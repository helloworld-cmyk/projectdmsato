import { EVENT_NAME, STORAGE_KEY } from "./constants.js";
import {
  amount,
  clone,
  emptyPlayer,
  id,
  initials,
  integer,
  normalisePlayers,
  now,
  stableSubjectId,
  subjectId,
} from "./utils.js";
import { BOOKING_ROSTER_MIGRATION_VERSION, normaliseJoinRules } from "../services/rules.js";
import { equalBookingPlayers } from "../services/commerce.js";
import { DEMO_REPUTATION_SEED_VERSION } from "../services/reputation.js";

export const loyaltyDefaults = () => ({ balance: 0, transactions: [] });
export const walletDefaults = () => ({ balance: 0, transactions: [] });
export const membershipDefaults = () => ({ plan: null, startedAt: null, expiresAt: null });

export const createDefaultState = ({ demoReputationReviews }) => ({
  profile: {
    name: "Ngọc Anh",
    initials: "NA",
    level: "Khá",
    radius: 10,
    sports: ["football", "badminton"],
    availability: "Tối các ngày trong tuần",
    streak: 0,
    badges: [],
  },
  preferences: {
    sport: "football",
    time: "today",
    level: "Khá",
    radius: 10,
    availability: "Tối các ngày trong tuần",
  },
  matches: [],
  applications: [],
  chatRooms: {},
  bookings: [],
  bookingRosterMigrationVersion: BOOKING_ROSTER_MIGRATION_VERSION,
  savedMatches: [],
  savedMatchDetails: {},
  playJourneys: [],
  matchFeedback: [],
  reputationReviews: demoReputationReviews(),
  demoReputationSeedVersion: DEMO_REPUTATION_SEED_VERSION,
  waitlists: [],
  loyalty: loyaltyDefaults(),
  wallet: walletDefaults(),
  membership: membershipDefaults(),
  notifications: [
    {
      id: id("notice"),
      type: "tip",
      title: "Chào mừng đến MatchUp",
      body: "Hồ sơ của bạn giúp MatchUp gợi ý kèo hợp hơn.",
      createdAt: now(),
      read: false,
    },
  ],
});

export const createStateStore = ({ demoReputationReviews, seedMissingDemoReputation }) => {
  const defaultState = () => createDefaultState({ demoReputationReviews });
  const seededBookingPlayer = (player) => {
    const name = String(player && player.name || "").trim();
    const role = String(player && player.role || "").trim();
    return ["Minh Khoa", "Thu Linh"].includes(name) && role === "Đã vào kèo · Đang chờ thanh toán";
  };

  const normaliseState = (saved) => {
    const shouldMigrateBookingRosters = (
      Number(saved.bookingRosterMigrationVersion) < BOOKING_ROSTER_MIGRATION_VERSION
    );
    saved.profile = saved.profile && typeof saved.profile === "object"
      ? saved.profile
      : defaultState().profile;
    saved.profile.sports = Array.isArray(saved.profile.sports)
      ? saved.profile.sports
      : ["football"];
    saved.profile.streak = integer(saved.profile.streak);
    saved.profile.badges = Array.isArray(saved.profile.badges) ? saved.profile.badges : [];
    saved.preferences = saved.preferences && typeof saved.preferences === "object"
      ? saved.preferences
      : {
        sport: saved.profile.sports && saved.profile.sports[0] || "football",
        time: "today",
        level: saved.profile.level || "Khá",
        radius: Number(saved.profile.radius) || 10,
        availability: saved.profile.availability || "Linh hoạt",
      };
    const loyalty = saved && saved.loyalty && typeof saved.loyalty === "object"
      ? saved.loyalty
      : loyaltyDefaults();
    saved.loyalty = {
      balance: integer(loyalty.balance),
      transactions: Array.isArray(loyalty.transactions) ? loyalty.transactions.slice(0, 50) : [],
    };
    const wallet = saved && saved.wallet && typeof saved.wallet === "object"
      ? saved.wallet
      : walletDefaults();
    saved.wallet = {
      balance: amount(wallet.balance),
      transactions: Array.isArray(wallet.transactions) ? wallet.transactions.slice(0, 50) : [],
    };
    const membership = saved && saved.membership && typeof saved.membership === "object"
      ? saved.membership
      : membershipDefaults();
    const membershipExpired = membership.plan
      && membership.expiresAt
      && new Date(membership.expiresAt).getTime() <= now();
    saved.membership = membershipExpired
      ? membershipDefaults()
      : {
        plan: membership.plan || null,
        startedAt: membership.startedAt || null,
        expiresAt: membership.expiresAt || null,
      };
    saved.matches = Array.isArray(saved.matches) ? saved.matches : [];
    saved.applications = Array.isArray(saved.applications) ? saved.applications : [];
    saved.chatRooms = saved.chatRooms && typeof saved.chatRooms === "object" ? saved.chatRooms : {};
    Object.values(saved.chatRooms).forEach((room) => {
      const messages = Array.isArray(room.messages) ? room.messages : [];
      if (
        room.greetingPending === undefined
        && messages.length === 2
        && messages[0].kind === "system"
        && messages[1].senderId === "host"
      ) {
        room.messages = [messages[0]];
        room.greetingPending = true;
      }
    });
    saved.bookings = Array.isArray(saved.bookings) ? saved.bookings : [];
    saved.notifications = Array.isArray(saved.notifications) ? saved.notifications : [];
    saved.savedMatches = Array.isArray(saved.savedMatches) ? saved.savedMatches : [];
    saved.savedMatchDetails = saved.savedMatchDetails
      && typeof saved.savedMatchDetails === "object"
      ? saved.savedMatchDetails
      : {};
    saved.playJourneys = Array.isArray(saved.playJourneys) ? saved.playJourneys : [];
    saved.matchFeedback = Array.isArray(saved.matchFeedback) ? saved.matchFeedback : [];
    saved.reputationReviews = Array.isArray(saved.reputationReviews) ? saved.reputationReviews : [];
    seedMissingDemoReputation(saved);
    saved.waitlists = Array.isArray(saved.waitlists) ? saved.waitlists : [];
    saved.matches.forEach((match) => { match.joinRules = normaliseJoinRules(match.joinRules); });
    saved.bookings.forEach((booking) => {
      booking.joinRules = normaliseJoinRules(booking.joinRules);
      booking.courtId = booking.courtId || stableSubjectId("court", booking.court);
      booking.teamSize = Math.max(1, integer(booking.teamSize) || 4);
      if (booking.split && Array.isArray(booking.split.players)) {
        const players = shouldMigrateBookingRosters && !booking.ownerPaid
          ? booking.split.players.filter((player) => (
            !emptyPlayer(player) && !seededBookingPlayer(player)
          ))
          : booking.split.players;
        const normalisedPlayers = normalisePlayers(players);
        booking.split.players = (
          shouldMigrateBookingRosters
          && !booking.ownerPaid
          && booking.split.mode !== "custom"
        )
          ? equalBookingPlayers(normalisedPlayers, booking.total)
          : normalisedPlayers;
      }
      if (
        booking.joinRules.requirePaymentBeforeJoin
        && booking.split
        && Array.isArray(booking.split.players)
      ) {
        booking.split.players.forEach((player) => {
          if (player.paid) {
            if (player.joinStatus === "approved") player.role = "Đã được duyệt · Đã thanh toán";
            return;
          }
          if (player.joinStatus === "approved") {
            player.joinStatus = "payment_pending";
            player.role = "Đã đủ điều kiện · Chờ thanh toán cọc";
          }
        });
      }
    });
    saved.bookingRosterMigrationVersion = BOOKING_ROSTER_MIGRATION_VERSION;
    saved.matches.forEach((match) => {
      if (Array.isArray(match.participants)) {
        match.participants = normalisePlayers(match.participants);
      }
    });
    saved.applications.forEach((application) => {
      if (application.match && Array.isArray(application.match.participants)) {
        application.match.participants = normalisePlayers(application.match.participants);
      }
    });
    saved.reputationReviews = saved.reputationReviews.map((review) => {
      const reviewer = review.reviewer || {};
      const court = review.court;
      const normalisedCourt = court
        ? {
          ...court,
          id: subjectId("court", court),
          rating: Math.min(5, Math.max(1, integer(court.rating) || 5)),
          tags: Array.isArray(court.tags) ? court.tags.slice(0, 6) : [],
        }
        : null;
      const players = normalisePlayers(review.players).map((player) => ({
        ...player,
        id: subjectId("player", player),
        rating: Math.min(5, Math.max(1, integer(player.rating) || 5)),
        tags: Array.isArray(player.tags) ? player.tags.slice(0, 8) : [],
      }));
      return {
        ...review,
        reviewer: {
          ...reviewer,
          id: "self",
          name: reviewer.name || saved.profile.name,
          initials: reviewer.initials || initials(saved.profile.name),
        },
        court: normalisedCourt,
        players,
      };
    });
    saved.reputationReviews = saved.reputationReviews
      .filter((review) => review && review.type && review.sourceId);
    saved.playJourneys.forEach((journey) => {
      journey.feedbackSubmitted = Boolean(journey.feedbackSubmitted);
      journey.reputationSubmitted = Boolean(
        journey.reputationSubmitted
        || saved.reputationReviews.some((review) => (
          review.type === journey.type && review.sourceId === journey.sourceId
        )),
      );
    });
    saved.applications.forEach((application) => {
      if (application.match) {
        application.match.joinRules = normaliseJoinRules(application.match.joinRules);
        if (
          application.match.joinRules.requirePaymentBeforeJoin
          && application.paymentStatus !== "paid"
          && application.status === "accepted"
        ) application.status = "payment_pending";
        if (
          application.match.joinRules.requirePaymentBeforeJoin
          && application.paymentStatus === "paid"
          && application.status === "accepted"
        ) application.status = "paid";
      }
      if (!saved.playJourneys.some((journey) => (
        journey.type === "match" && journey.sourceId === application.id
      ))) {
        saved.playJourneys.push({
          id: id("journey"),
          type: "match",
          sourceId: application.id,
          matchId: application.matchId,
          matchName: application.match && application.match.name,
          status: application.status,
          feedbackSubmitted: false,
          reputationSubmitted: false,
          createdAt: application.createdAt || now(),
          updatedAt: application.updatedAt || now(),
        });
      }
    });
    saved.bookings.forEach((booking) => {
      if (!saved.playJourneys.some((journey) => (
        journey.type === "booking" && journey.sourceId === booking.id
      ))) {
        saved.playJourneys.push({
          id: id("journey"),
          type: "booking",
          sourceId: booking.id,
          bookingId: booking.id,
          matchName: booking.court,
          status: booking.ownerPaid ? "paid" : booking.status,
          feedbackSubmitted: false,
          reputationSubmitted: false,
          createdAt: booking.createdAt || now(),
          updatedAt: booking.updatedAt || now(),
        });
      }
    });
    saved.bookings.forEach((booking) => {
      if (!Number.isFinite(Number(booking.subtotal))) booking.subtotal = amount(booking.total);
      if (!Number.isFinite(Number(booking.originalTotal))) {
        booking.originalTotal = amount(booking.subtotal);
      }
      if (!booking.voucher || typeof booking.voucher !== "object") booking.voucher = null;
    });
    return saved;
  };

  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.profile && Array.isArray(saved.matches)) {
        const previousRosterVersion = Number(saved.bookingRosterMigrationVersion) || 0;
        const normalised = normaliseState(saved);
        if (previousRosterVersion < BOOKING_ROSTER_MIGRATION_VERSION) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised));
        }
        return normalised;
      }
    } catch (_) { /* fall through to seed data */ }
    return defaultState();
  };
  const state = read();
  const save = (reason = "update") => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { reason, state: clone(state) },
    }));
  };
  const addNotification = (title, body, type = "info") => {
    state.notifications.unshift({
      id: id("notice"),
      type,
      title,
      body,
      createdAt: now(),
      read: false,
    });
    state.notifications = state.notifications.slice(0, 30);
  };
  const upsertJourney = (type, sourceId, status, extra = {}) => {
    let journey = state.playJourneys.find((item) => (
      item.type === type && item.sourceId === sourceId
    ));
    if (!journey) {
      journey = {
        id: id("journey"),
        type,
        sourceId,
        status,
        feedbackSubmitted: false,
        reputationSubmitted: false,
        createdAt: now(),
        updatedAt: now(),
        ...extra,
      };
      state.playJourneys.unshift(journey);
    } else {
      journey.status = status;
      journey.updatedAt = now();
      Object.assign(journey, extra);
    }
    return journey;
  };
  const findJourney = (type, sourceId) => state.playJourneys.find((item) => (
    item.type === type && item.sourceId === sourceId
  )) || null;

  return {
    defaultState,
    normaliseState,
    read,
    state,
    save,
    addNotification,
    upsertJourney,
    findJourney,
  };
};
