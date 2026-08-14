/*
 * Small client-side data layer for the MatchUp demo.
 * It deliberately keeps all state in localStorage so every screen can share
 * a believable journey without requiring a backend.
 */
(() => {
  const STORAGE_KEY = "matchup-demo-state-v2";
  const EVENT_NAME = "matchup:state-change";
  const LOYALTY_POLICY = Object.freeze({
    earnPerAmount: 1000,
    pointValue: 100,
    maxDiscountRate: 0.5,
  });
  const WALLET_PAYMENT_METHOD = "Ví MatchUp";
  const SPORT_LABELS = Object.freeze({ football: "bóng đá", badminton: "cầu lông", pickleball: "pickleball", basketball: "bóng rổ" });
  const VOUCHER_CATALOG = Object.freeze([
    {
      id: "welcome20",
      code: "MATCH20",
      category: "new",
      categoryLabel: "Tân thủ",
      icon: "celebration",
      tone: "yellow",
      title: "Giảm 20% lần đặt sân đầu",
      description: "Áp dụng cho mọi sân đối tác",
      condition: "Đơn từ 120.000đ",
      expires: "Hết hạn 31/08",
      expiresAt: "2026-08-31T23:59:59+07:00",
      discountType: "percent",
      discountValue: 20,
      maxDiscount: 80000,
      minSpend: 120000,
      requiresFirstBooking: true,
      priority: 1,
    },
    {
      id: "offpeak50",
      code: "OFFPEAK50",
      category: "offpeak",
      categoryLabel: "Giờ thấp điểm",
      icon: "wb_sunny",
      tone: "orange",
      title: "Giảm 50.000đ giờ thấp điểm",
      description: "Thứ 2–6 · 06:00–17:00",
      condition: "Đơn từ 150.000đ",
      expires: "Hết hạn 15/09",
      expiresAt: "2026-09-15T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 50000,
      minSpend: 150000,
      weekdayOnly: true,
      timeRange: { start: 6, end: 17 },
      priority: 2,
    },
    {
      id: "football30",
      code: "FOOTBALL30",
      category: "sport",
      categoryLabel: "Theo môn",
      icon: "sports_soccer",
      tone: "green",
      title: "Bóng đá giảm 30.000đ",
      description: "Dành riêng cho sân bóng đá",
      condition: "Đơn từ 180.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 30000,
      minSpend: 180000,
      sports: ["football"],
      priority: 3,
    },
    {
      id: "badminton15",
      code: "RACKET15",
      category: "sport",
      categoryLabel: "Theo môn",
      icon: "sports",
      tone: "blue",
      title: "Cầu lông giảm 15%",
      description: "Cho mọi sân cầu lông đối tác",
      condition: "Giảm tối đa 40.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "percent",
      discountValue: 15,
      maxDiscount: 40000,
      sports: ["badminton"],
      priority: 4,
    },
    {
      id: "pickleball40",
      code: "PICKLE40",
      category: "sport",
      categoryLabel: "Theo môn",
      icon: "sports_tennis",
      tone: "purple",
      title: "Pickleball giảm 40.000đ",
      description: "Thử sân pickleball gần bạn",
      condition: "Đơn từ 140.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 40000,
      minSpend: 140000,
      sports: ["pickleball"],
      priority: 5,
    },
    {
      id: "friends30",
      code: "TEAM30",
      category: "friends",
      categoryLabel: "Bạn bè",
      icon: "group",
      tone: "red",
      title: "Rủ đủ đội, giảm 30.000đ",
      description: "Khi nhóm có từ 4 người",
      condition: "Đơn từ 180.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 30000,
      minSpend: 180000,
      minTeamSize: 4,
      priority: 6,
    },
  ]);
  const now = () => Date.now();
  const id = (prefix) => `${prefix}-${now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const initials = (name) => String(name || "Ngọc Anh").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
  const integer = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const amount = (value) => Math.max(0, Math.round(Number(value) || 0));
  const subjectKey = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
  const stableSubjectId = (type, value) => `${type}-${subjectKey(value)}`;
  const subjectId = (type, value) => {
    if (value && typeof value === "object") return String(value.id || value[`${type}Id`] || stableSubjectId(type, value.name || value.court || value.label));
    const raw = String(value || "");
    if (raw === "self") return "self";
    if (/^(?:court|player)-/.test(raw) || /^[a-z]+-\d+$/.test(raw)) return raw;
    return raw.startsWith(`${type}-`) ? raw : stableSubjectId(type, raw);
  };
  const emptyPlayer = (player) => !player || player.empty || !String(player.name || "").trim() || /^(còn|trống|empty|slot)/i.test(String(player.name || "").trim());
  const normalisePlayer = (player) => {
    if (!player || typeof player !== "object") return null;
    const name = String(player.name || "").trim();
    if (!name) return null;
    return { ...player, id: player.id || stableSubjectId("player", name), initials: player.initials || initials(name) };
  };
  const normalisePlayers = (players) => (Array.isArray(players) ? players : []).map(normalisePlayer).filter(Boolean);
  const negativeTags = new Set(["Sân xuống cấp", "Vệ sinh chưa tốt", "Dịch vụ chưa ổn", "Không đến", "Thanh toán trễ/quỵt", "Sai trình độ", "Trễ giờ"]);
  const positiveTags = new Set(["Sân tốt", "Vệ sinh tốt", "Dịch vụ ổn", "Đúng giờ", "Thanh toán đúng hẹn", "Đúng trình độ", "Thân thiện"]);
  const reputationFromReviews = (type, subject, fallback = {}) => {
    const subjectType = type === "court" ? "court" : "player";
    const resolvedId = subjectId(subjectType, subject);
    const reviews = state.reputationReviews.filter((review) => subjectType === "court"
      ? review.court && review.court.id === resolvedId
      : Array.isArray(review.players) && review.players.some((player) => player.id === resolvedId));
    const ratings = reviews.map((review) => subjectType === "court"
      ? Number(review.court && review.court.rating)
      : Number(review.players.find((player) => player.id === resolvedId).rating)).filter((rating) => rating > 0);
    const rating = ratings.length ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length * 10) / 10 : Number(fallback.rating) || 0;
    const fallbackCount = integer(fallback.reviews || fallback.count);
    const allTags = reviews.flatMap((review) => {
      const target = subjectType === "court" ? review.court : (review.players || []).find((player) => player.id === resolvedId);
      return target && Array.isArray(target.tags) ? target.tags : [];
    });
    const tags = [...new Set(allTags)].map((tag) => ({ tag, count: allTags.filter((item) => item === tag).length, positive: positiveTags.has(tag), negative: negativeTags.has(tag) }))
      .sort((a, b) => b.count - a.count || Number(b.positive) - Number(a.positive) || a.tag.localeCompare(b.tag, "vi"));
    const highlights = tags.filter((item) => item.positive).slice(0, 4);
    const alerts = tags.filter((item) => item.negative && item.count >= 2);
    return {
      subjectId: resolvedId,
      rating,
      reviews: reviews.length || fallbackCount,
      count: reviews.length || fallbackCount,
      tags,
      highlights,
      alerts,
      warnings: alerts,
      hasData: reviews.length > 0,
    };
  };
  const DEMO_REPUTATION_SEED_VERSION = 1;
  const demoReputationReviews = () => {
    const entries = [
      { subject: "Ngọc Anh", reviewers: ["Minh Khang", "Thảo Vy"], ratings: [5, 5], tags: [["Đúng giờ", "Thân thiện"], ["Thanh toán đúng hẹn", "Đúng trình độ"]] },
      { subject: "Minh Khang", reviewers: ["Ngọc Anh", "Thảo Vy"], ratings: [5, 4], tags: [["Đúng giờ", "Thân thiện"], ["Đúng trình độ", "Thanh toán đúng hẹn"]] },
      { subject: "Thảo Vy", reviewers: ["Ngọc Anh", "Minh Khang"], ratings: [5, 5], tags: [["Thân thiện", "Đúng trình độ"], ["Đúng giờ", "Thanh toán đúng hẹn"]] },
      { subject: "Quốc Duy", reviewers: ["Ngọc Anh", "Minh Khang"], ratings: [4, 5], tags: [["Đúng giờ", "Đúng trình độ"], ["Thân thiện", "Thanh toán đúng hẹn"]] },
      { subject: "Hà My", reviewers: ["Ngọc Anh", "Thảo Vy"], ratings: [5, 4], tags: [["Thân thiện", "Đúng giờ"], ["Đúng trình độ", "Thanh toán đúng hẹn"]] },
      { subject: "Tuấn Anh", reviewers: ["Minh Khang", "Thảo Vy"], ratings: [4, 5], tags: [["Đúng trình độ", "Đúng giờ"], ["Thân thiện", "Thanh toán đúng hẹn"]] },
    ];
    return entries.flatMap((entry) => entry.reviewers.map((reviewer, index) => ({
      id: `demo-reputation-${subjectKey(entry.subject)}-${index + 1}`,
      type: "match",
      sourceId: `demo-match-${subjectKey(entry.subject)}-${index + 1}`,
      reviewer: { id: stableSubjectId("player", reviewer), name: reviewer, initials: initials(reviewer) },
      createdAt: now() - ((index + 1) * 86400000),
      court: null,
      players: [{
        id: stableSubjectId("player", entry.subject),
        name: entry.subject,
        initials: initials(entry.subject),
        rating: entry.ratings[index],
        tags: entry.tags[index],
      }],
    })));
  };
  const seedMissingDemoReputation = (saved) => {
    if (Number(saved.demoReputationSeedVersion) >= DEMO_REPUTATION_SEED_VERSION) return;
    const existingSubjectIds = new Set((saved.reputationReviews || []).flatMap((review) => (review.players || []).map((player) => subjectId("player", player))));
    const missingSeed = demoReputationReviews().filter((review) => !existingSubjectIds.has(review.players[0].id));
    saved.reputationReviews = [...missingSeed, ...(saved.reputationReviews || [])];
    saved.demoReputationSeedVersion = DEMO_REPUTATION_SEED_VERSION;
  };
  const BOOKING_ROSTER_MIGRATION_VERSION = 1;
  const seededBookingPlayer = (player) => {
    const name = String(player && player.name || "").trim();
    const role = String(player && player.role || "").trim();
    return ["Minh Khoa", "Thu Linh"].includes(name) && role === "Đã vào kèo · Đang chờ thanh toán";
  };
  const equalBookingPlayers = (players, total) => {
    if (!players.length) return [];
    const safeTotal = amount(total);
    const base = Math.floor(safeTotal / players.length);
    const remainder = safeTotal - base * players.length;
    return players.map((player, index) => ({ ...player, amount: base + (index === 0 ? remainder : 0) }));
  };
  const joinRuleDefaults = () => ({
    requirePaymentBeforeJoin: false,
    autoApprove: false,
    criteria: {
      levelMatch: false,
      minRating: 0,
      minCompletedMatches: 0,
    },
  });
  const normaliseJoinRules = (input = {}) => {
    const defaults = joinRuleDefaults();
    const criteria = input && typeof input.criteria === "object" ? input.criteria : {};
    const allowedRatings = [0, 4, 4.5];
    const allowedMatches = [0, 3, 5, 10];
    const rating = Number(criteria.minRating);
    const completed = integer(criteria.minCompletedMatches);
    return {
      requirePaymentBeforeJoin: Boolean(input && input.requirePaymentBeforeJoin),
      autoApprove: Boolean(input && input.autoApprove),
      criteria: {
        levelMatch: Boolean(criteria.levelMatch),
        minRating: allowedRatings.includes(rating) ? rating : defaults.criteria.minRating,
        minCompletedMatches: allowedMatches.includes(completed) ? completed : defaults.criteria.minCompletedMatches,
      },
    };
  };
  const approvalCheck = (match, candidate = {}) => {
    const rules = normaliseJoinRules(match && match.joinRules);
    const reputation = reputationFromReviews("player", candidate.id || candidate.name || "unknown", { rating: Number(candidate.rating) || 0 });
    const completedMatches = Number(candidate.completedMatches) || reputation.reviews || 0;
    const failed = [];
    if (rules.criteria.levelMatch && match && match.level && candidate.level !== match.level) failed.push(`Đúng trình độ ${match.level}`);
    if (rules.criteria.minRating && (!(reputation.hasData || Number(candidate.rating) > 0) || reputation.rating < rules.criteria.minRating)) failed.push(`Từ ${rules.criteria.minRating.toFixed(1)}★`);
    if (rules.criteria.minCompletedMatches && completedMatches < rules.criteria.minCompletedMatches) failed.push(`${rules.criteria.minCompletedMatches} trận đã hoàn thành`);
    return { rules, eligible: failed.length === 0, failed, reputation, completedMatches };
  };
  const loyaltyDefaults = () => ({ balance: 0, transactions: [] });
  const walletDefaults = () => ({ balance: 0, transactions: [] });
  const defaultState = () => ({
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
    notifications: [
      { id: id("notice"), type: "tip", title: "Chào mừng đến MatchUp", body: "Hồ sơ của bạn giúp MatchUp gợi ý kèo hợp hơn.", createdAt: now(), read: false },
    ],
  });

  const normaliseState = (saved) => {
    const shouldMigrateBookingRosters = Number(saved.bookingRosterMigrationVersion) < BOOKING_ROSTER_MIGRATION_VERSION;
    saved.profile = saved.profile && typeof saved.profile === "object" ? saved.profile : defaultState().profile;
    saved.profile.sports = Array.isArray(saved.profile.sports) ? saved.profile.sports : ["football"];
    saved.profile.streak = integer(saved.profile.streak);
    saved.profile.badges = Array.isArray(saved.profile.badges) ? saved.profile.badges : [];
    saved.preferences = saved.preferences && typeof saved.preferences === "object" ? saved.preferences : {
      sport: saved.profile.sports && saved.profile.sports[0] || "football",
      time: "today",
      level: saved.profile.level || "Khá",
      radius: Number(saved.profile.radius) || 10,
      availability: saved.profile.availability || "Linh hoạt",
    };
    const loyalty = saved && saved.loyalty && typeof saved.loyalty === "object" ? saved.loyalty : loyaltyDefaults();
    saved.loyalty = {
      balance: integer(loyalty.balance),
      transactions: Array.isArray(loyalty.transactions) ? loyalty.transactions.slice(0, 50) : [],
    };
    const wallet = saved && saved.wallet && typeof saved.wallet === "object" ? saved.wallet : walletDefaults();
    saved.wallet = {
      balance: amount(wallet.balance),
      transactions: Array.isArray(wallet.transactions) ? wallet.transactions.slice(0, 50) : [],
    };
    saved.matches = Array.isArray(saved.matches) ? saved.matches : [];
    saved.applications = Array.isArray(saved.applications) ? saved.applications : [];
    saved.chatRooms = saved.chatRooms && typeof saved.chatRooms === "object" ? saved.chatRooms : {};
    Object.values(saved.chatRooms).forEach((room) => {
      const messages = Array.isArray(room.messages) ? room.messages : [];
      if (room.greetingPending === undefined && messages.length === 2 && messages[0].kind === "system" && messages[1].senderId === "host") {
        room.messages = [messages[0]];
        room.greetingPending = true;
      }
    });
    saved.bookings = Array.isArray(saved.bookings) ? saved.bookings : [];
    saved.notifications = Array.isArray(saved.notifications) ? saved.notifications : [];
    saved.savedMatches = Array.isArray(saved.savedMatches) ? saved.savedMatches : [];
    saved.savedMatchDetails = saved.savedMatchDetails && typeof saved.savedMatchDetails === "object" ? saved.savedMatchDetails : {};
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
          ? booking.split.players.filter((player) => !emptyPlayer(player) && !seededBookingPlayer(player))
          : booking.split.players;
        const normalisedPlayers = normalisePlayers(players);
        booking.split.players = shouldMigrateBookingRosters && !booking.ownerPaid && booking.split.mode !== "custom"
          ? equalBookingPlayers(normalisedPlayers, booking.total)
          : normalisedPlayers;
      }
      if (booking.joinRules.requirePaymentBeforeJoin && booking.split && Array.isArray(booking.split.players)) {
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
      if (Array.isArray(match.participants)) match.participants = normalisePlayers(match.participants);
    });
    saved.applications.forEach((application) => {
      if (application.match && Array.isArray(application.match.participants)) application.match.participants = normalisePlayers(application.match.participants);
    });
    saved.reputationReviews = saved.reputationReviews.map((review) => ({
      ...review,
      reviewer: { ...(review.reviewer || {}), id: "self", name: review.reviewer && review.reviewer.name || saved.profile.name, initials: review.reviewer && review.reviewer.initials || initials(saved.profile.name) },
      court: review.court ? { ...review.court, id: subjectId("court", review.court), rating: Math.min(5, Math.max(1, integer(review.court.rating) || 5)), tags: Array.isArray(review.court.tags) ? review.court.tags.slice(0, 6) : [] } : null,
      players: normalisePlayers(review.players).map((player) => ({ ...player, id: subjectId("player", player), rating: Math.min(5, Math.max(1, integer(player.rating) || 5)), tags: Array.isArray(player.tags) ? player.tags.slice(0, 8) : [] })),
    })).filter((review) => review && review.type && review.sourceId);
    saved.playJourneys.forEach((journey) => {
      journey.feedbackSubmitted = Boolean(journey.feedbackSubmitted);
      journey.reputationSubmitted = Boolean(journey.reputationSubmitted || saved.reputationReviews.some((review) => review.type === journey.type && review.sourceId === journey.sourceId));
    });
    saved.applications.forEach((application) => {
      if (application.match) {
        application.match.joinRules = normaliseJoinRules(application.match.joinRules);
        if (application.match.joinRules.requirePaymentBeforeJoin && application.paymentStatus !== "paid" && application.status === "accepted") application.status = "payment_pending";
        if (application.match.joinRules.requirePaymentBeforeJoin && application.paymentStatus === "paid" && application.status === "accepted") application.status = "paid";
      }
      if (!saved.playJourneys.some((journey) => journey.type === "match" && journey.sourceId === application.id)) {
        saved.playJourneys.push({ id: id("journey"), type: "match", sourceId: application.id, matchId: application.matchId, matchName: application.match && application.match.name, status: application.status, feedbackSubmitted: false, reputationSubmitted: false, createdAt: application.createdAt || now(), updatedAt: application.updatedAt || now() });
      }
    });
    saved.bookings.forEach((booking) => {
      if (!saved.playJourneys.some((journey) => journey.type === "booking" && journey.sourceId === booking.id)) {
        saved.playJourneys.push({ id: id("journey"), type: "booking", sourceId: booking.id, bookingId: booking.id, matchName: booking.court, status: booking.ownerPaid ? "paid" : booking.status, feedbackSubmitted: false, reputationSubmitted: false, createdAt: booking.createdAt || now(), updatedAt: booking.updatedAt || now() });
      }
    });
    saved.bookings.forEach((booking) => {
      if (!Number.isFinite(Number(booking.subtotal))) booking.subtotal = amount(booking.total);
      if (!Number.isFinite(Number(booking.originalTotal))) booking.originalTotal = amount(booking.subtotal);
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
  let state = read();
  const save = (reason = "update") => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { reason, state: clone(state) } }));
  };
  const addNotification = (title, body, type = "info") => {
    state.notifications.unshift({ id: id("notice"), type, title, body, createdAt: now(), read: false });
    state.notifications = state.notifications.slice(0, 30);
  };
  const upsertJourney = (type, sourceId, status, extra = {}) => {
    let journey = state.playJourneys.find((item) => item.type === type && item.sourceId === sourceId);
    if (!journey) {
      journey = { id: id("journey"), type, sourceId, status, feedbackSubmitted: false, reputationSubmitted: false, createdAt: now(), updatedAt: now(), ...extra };
      state.playJourneys.unshift(journey);
    } else {
      journey.status = status;
      journey.updatedAt = now();
      Object.assign(journey, extra);
    }
    return journey;
  };
  const findJourney = (type, sourceId) => state.playJourneys.find((item) => item.type === type && item.sourceId === sourceId) || null;
  const hasReputationReview = (type, sourceId) => state.reputationReviews.some((review) => review.type === type && review.sourceId === sourceId);
  const canSubmitReputationReview = (type, sourceId) => {
    const journey = findJourney(type, sourceId);
    if (!journey || hasReputationReview(type, sourceId)) return false;
    // A saved booking is reviewable from the personal schedule even when it
    // was cancelled or expired. The user may still have a useful experience
    // to report about the court or the people attached to that booking.
    return type === "booking" || journey.status === "completed";
  };
  const normaliseReviewTags = (tags, limit) => [...new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag || "").trim()).filter(Boolean))].slice(0, limit);
  const submitReputationReview = (input = {}) => {
    const type = input.type === "match" ? "match" : input.type === "booking" ? "booking" : null;
    const sourceId = String(input.sourceId || "");
    if (!type || !sourceId || !canSubmitReputationReview(type, sourceId)) return null;
    const profile = state.profile;
    const courtInput = input.court || {};
    const courtName = String(courtInput.name || input.courtName || input.court || "Sân chưa cập nhật").trim();
    const court = {
      id: subjectId("court", courtInput.id || input.courtId || courtName),
      name: courtName,
      rating: Math.min(5, Math.max(1, integer(courtInput.rating || input.courtRating) || 5)),
      tags: normaliseReviewTags(courtInput.tags || input.courtTags, 6),
    };
    const selfPlayerId = stableSubjectId("player", profile.name);
    const players = normalisePlayers(input.players).map((player) => ({
      ...player,
      id: subjectId("player", player),
      rating: Math.min(5, Math.max(1, integer(player.rating) || 5)),
      tags: normaliseReviewTags(player.tags, 8),
    })).filter((player, index, all) => {
      const isSelf = player.id === "self" || player.id === selfPlayerId || subjectKey(player.name) === subjectKey(profile.name);
      return !isSelf && !emptyPlayer(player) && all.findIndex((item) => item.id === player.id) === index;
    });
    const review = {
      id: id("reputation"),
      type,
      sourceId,
      reviewer: { id: "self", name: profile.name, initials: profile.initials || initials(profile.name) },
      createdAt: now(),
      court,
      players,
    };
    state.reputationReviews.unshift(review);
    const journey = findJourney(type, sourceId);
    journey.reputationSubmitted = true;
    journey.updatedAt = now();
    addNotification("Đã lưu đánh giá uy tín", "Cảm ơn bạn đã giúp cộng đồng MatchUp chơi vui và đúng hẹn hơn.", "feedback");
    save("reputation-review-submitted");
    return clone(review);
  };
  // A room is available as soon as the join request succeeds. The host can
  // still approve the request separately, but the applicant should be able
  // to reach the kèo's conversation immediately.
  const chatApplication = (matchId) => state.applications.find((application) => application.matchId === matchId && ["pending", "accepted", "paid"].includes(application.status)) || null;
  const hostForMatch = (match) => {
    const participants = Array.isArray(match && match.participants) ? match.participants : [];
    return participants.find((player) => player.role === "Chủ kèo") || participants[0] || { name: "Chủ kèo MatchUp", initials: "MU", tone: "#6680ba" };
  };
  const chatAutoReplyText = (text) => {
    const cleanText = String(text || "").trim();
    if (cleanText === "Mình sẽ đến sớm 10 phút nhé") return "Ok bạn nhé, đội sẽ đợi bạn khởi động cùng mọi người.";
    if (cleanText === "Mình xác nhận tham gia kèo nhé!") return "Đã ghi nhận bạn tham gia rồi nhé! Hẹn gặp bạn tại sân.";
    if (cleanText === "Sân mình chốt ở đâu vậy mọi người?" || cleanText === "Mình đã sẵn sàng rồi!") return "Mình đã ghim thông tin sân ở phía trên rồi nhé, hẹn bạn ở đó!";
    return "";
  };
  const createChatAutoReply = (match, text) => {
    const replyText = chatAutoReplyText(text);
    if (!replyText) return null;
    const host = match ? hostForMatch(match) : { name: "Minh Khang", initials: "MK", tone: "#6680ba" };
    const sender = host.name === state.profile.name ? { name: "Minh Khang", initials: "MK", tone: "#6680ba" } : host;
    return {
      id: id("message"),
      kind: "text",
      senderId: "member",
      senderName: sender.name,
      senderInitials: sender.initials,
      senderTone: sender.tone,
      text: replyText,
      createdAt: now(),
    };
  };
  const ensureChatRoom = (matchId, match) => {
    if (!matchId || !match) return null;
    const application = state.applications.find((item) => item.matchId === matchId && !["declined", "cancelled"].includes(item.status));
    const isPending = application && application.status === "pending";
    if (!state.chatRooms[matchId]) {
      state.chatRooms[matchId] = {
        id: `chat-${matchId}`,
        matchId,
        createdAt: now(),
        unreadCount: 1,
        messages: [
          { id: id("message"), kind: "system", text: isPending ? "Phòng chat của kèo đã mở sau khi bạn gửi yêu cầu vào đội." : "Phòng chat riêng đã mở sau khi chủ kèo duyệt bạn vào đội.", createdAt: now() },
        ],
        greetingPending: true,
      };
    } else if (isPending) {
      const systemMessage = state.chatRooms[matchId].messages && state.chatRooms[matchId].messages.find((message) => message.kind === "system");
      if (systemMessage && systemMessage.text === "Phòng chat riêng đã mở sau khi chủ kèo duyệt bạn vào đội.") systemMessage.text = "Phòng chat của kèo đã mở sau khi bạn gửi yêu cầu vào đội.";
      const greeting = state.chatRooms[matchId].messages && state.chatRooms[matchId].messages.find((message) => message.kind === "text" && message.senderId === "host");
      if (greeting && greeting.text === "Chào mừng bạn vào kèo! Mình chốt sân và giờ ở đây nhé.") greeting.text = "Chào bạn! Mình chốt sân và giờ ở đây nhé.";
    }
    return state.chatRooms[matchId];
  };
  const sendChatAutoReply = (matchId, text) => {
    const application = chatApplication(matchId);
    const reply = application ? createChatAutoReply(application.match, text) : null;
    if (!reply) return null;
    const room = ensureChatRoom(matchId, application.match);
    room.messages.push(reply);
    room.messages = room.messages.slice(-100);
    save("chat-auto-reply");
    return clone(reply);
  };
  const hasPendingChatGreeting = (matchId) => Boolean(state.chatRooms[matchId] && state.chatRooms[matchId].greetingPending);
  const sendChatGreeting = (matchId) => {
    const application = chatApplication(matchId);
    const room = application ? ensureChatRoom(matchId, application.match) : null;
    if (!application || !room || !room.greetingPending) return null;
    const host = hostForMatch(application.match);
    const hostIsCurrentUser = host.name === state.profile.name;
    const sender = hostIsCurrentUser ? { name: "Minh Khang", initials: "MK", tone: "#6680ba" } : host;
    const message = {
      id: id("message"),
      kind: "text",
      senderId: "host",
      senderName: sender.name,
      senderInitials: sender.initials,
      senderTone: sender.tone,
      text: application.status === "pending" ? "Chào bạn! Mình chốt sân và giờ ở đây nhé." : "Chào mừng bạn vào kèo! Mình chốt sân và giờ ở đây nhé.",
      createdAt: now(),
    };
    room.messages.push(message);
    room.greetingPending = false;
    save("chat-greeting");
    return clone(message);
  };
  const matchInsight = (match) => {
    const profile = state.profile;
    const levelMatch = match.level === profile.level;
    const sportMatch = Array.isArray(profile.sports) && profile.sports.includes(match.sport);
    const nearby = Number(match.distance) <= Number(profile.radius || 10);
    const startsLate = Number(String(match.time || "").match(/\d{1,2}/)?.[0] || 0) >= 17;
    const eveningPreference = String(profile.availability || "").toLowerCase().includes("tối");
    const timeMatch = eveningPreference ? startsLate : true;
    const reasons = [];
    if (levelMatch) reasons.push(`Cùng trình độ ${profile.level}`);
    if (nearby) reasons.push(`Cách bạn ${Number(match.distance).toFixed(1).replace(".", ",")} km`);
    if (timeMatch) reasons.push("Đúng khung giờ bạn thường rảnh");
    if (sportMatch) reasons.push("Đúng môn bạn yêu thích");
    if (Number(match.available) === 1) reasons.push("Cần thêm đúng 1 người");
    if (!reasons.length) reasons.push("Đang được xếp theo sở thích của bạn");
    const baseScore = Number(match.score) || 78;
    const score = Math.min(99, Math.max(60, Math.round((baseScore + (levelMatch ? 2 : 0) + (sportMatch ? 1 : 0)) / 1)));
    const host = hostForMatch(match);
    const hostName = match.creatorName || host.name || "Chủ kèo MatchUp";
    const hostReputation = reputationFromReviews("player", { id: host.id, name: hostName }, {});
    return {
      score,
      reasons: reasons.slice(0, 4),
      host: { name: hostName, reliability: hostReputation.hasData ? Math.round(hostReputation.rating / 5 * 100) : 98, matches: hostReputation.hasData ? hostReputation.reviews : 24, reputation: hostReputation },
      vibe: match.vibe || (match.format && match.format.toLowerCase().includes("giao") ? "Giao lưu, thân thiện" : "Cân bằng và vui vẻ"),
    };
  };
  const money = (amount) => new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount) || 0)) + "đ";
  const bookingHistoryExists = () => state.bookings.some((booking) => !["cancelled", "expired"].includes(booking.status));
  const voucherDiscountLabel = (voucher) => voucher.discountType === "percent"
    ? `Giảm ${voucher.discountValue}%`
    : `Giảm ${money(voucher.discountValue)}`;
  const voucherDiscount = (voucher, subtotal) => {
    const safeSubtotal = amount(subtotal);
    if (!safeSubtotal) return 0;
    const raw = voucher.discountType === "percent"
      ? Math.round(safeSubtotal * voucher.discountValue / 100)
      : voucher.discountValue;
    return Math.min(safeSubtotal, voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw);
  };
  const voucherContext = (context = {}) => {
    const hasContext = Object.keys(context || {}).length > 0;
    return {
      hasContext,
      subtotal: amount(context.subtotal),
      sport: context.sport || "",
      time: context.time || "",
      times: Array.isArray(context.times) ? context.times.map(String) : [],
      date: context.date || "",
      teamSize: Number(context.teamSize) || 0,
      isFirstBooking: context.isFirstBooking === undefined ? !bookingHistoryExists() : Boolean(context.isFirstBooking),
    };
  };
  const voucherReason = (voucher, context) => {
    if (!context.hasContext) return "";
    if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < now()) return "Voucher đã hết hạn";
    if (voucher.requiresFirstBooking && !context.isFirstBooking) return "Chỉ áp dụng cho lần đặt sân đầu tiên";
    if (voucher.sports && context.sport && !voucher.sports.includes(context.sport)) return `Chỉ áp dụng cho ${voucher.sports.map((sport) => SPORT_LABELS[sport] || sport).join(" hoặc ")}`;
    if (voucher.minSpend && context.subtotal && context.subtotal < voucher.minSpend) return `Đơn tối thiểu ${money(voucher.minSpend)}`;
    if (voucher.weekdayOnly && context.date && ["Thứ Bảy", "Chủ nhật"].includes(context.date)) return "Chỉ áp dụng từ thứ 2 đến thứ 6";
    if (voucher.timeRange && (context.time || context.times.length)) {
      const times = context.times.length ? context.times : [context.time];
      const outsideOfferWindow = times.some((time) => {
        const hour = Number(String(time).split(":")[0]);
        return hour < voucher.timeRange.start || hour >= voucher.timeRange.end;
      });
      if (outsideOfferWindow) return "Không áp dụng cho tất cả khung giờ đã chọn";
    }
    if (voucher.minTeamSize && context.teamSize && context.teamSize < voucher.minTeamSize) return `Cần nhóm từ ${voucher.minTeamSize} người`;
    return "";
  };
  const evaluateVoucher = (voucher, context = {}) => {
    const resolved = voucherContext(context);
    const reason = voucherReason(voucher, resolved);
    const eligible = !reason;
    return {
      ...voucher,
      eligible,
      reason,
      discount: eligible ? voucherDiscount(voucher, resolved.subtotal) : 0,
      discountLabel: voucherDiscountLabel(voucher),
      isFirstBooking: resolved.isFirstBooking,
    };
  };
  const getVouchers = (context = {}) => VOUCHER_CATALOG.map((voucher) => evaluateVoucher(voucher, context));
  const bestVoucher = (context = {}) => getVouchers(context)
    .filter((voucher) => voucher.eligible)
    .sort((a, b) => b.discount - a.discount || a.priority - b.priority)[0] || null;
  const previewVoucher = (voucherId, context = {}) => {
    const voucher = VOUCHER_CATALOG.find((item) => item.id === voucherId || item.code === voucherId);
    return voucher ? evaluateVoucher(voucher, context) : null;
  };
  const previewPoints = (subtotal, requestedPoints = 0) => {
    const safeSubtotal = amount(subtotal);
    const requested = integer(requestedPoints);
    const maxByOrder = Math.floor((safeSubtotal * LOYALTY_POLICY.maxDiscountRate) / LOYALTY_POLICY.pointValue);
    const maxPoints = Math.min(state.loyalty.balance, maxByOrder);
    const points = Math.min(requested, maxPoints);
    const discount = points * LOYALTY_POLICY.pointValue;
    return {
      subtotal: safeSubtotal,
      requestedPoints: requested,
      points,
      maxPoints,
      availablePoints: state.loyalty.balance,
      discount,
      paidAmount: safeSubtotal - discount,
      isValid: requested === points,
    };
  };
  const addLoyaltyTransaction = ({ type, points, sourceType, sourceId, amount: relatedAmount, description }) => {
    state.loyalty.balance = Math.max(0, state.loyalty.balance + points);
    state.loyalty.transactions.unshift({
      id: id("loyalty"),
      type,
      points,
      sourceType,
      sourceId,
      amount: amount(relatedAmount),
      description,
      createdAt: now(),
    });
    state.loyalty.transactions = state.loyalty.transactions.slice(0, 50);
  };
  const addWalletTransaction = ({ type, amount: relatedAmount, sourceType, sourceId, method, description }) => {
    const value = amount(relatedAmount);
    state.wallet.balance = Math.max(0, state.wallet.balance + (type === "topup" ? value : -value));
    state.wallet.transactions.unshift({
      id: id("wallet"),
      type,
      amount: type === "topup" ? value : -value,
      balance: state.wallet.balance,
      sourceType: sourceType || "wallet",
      sourceId: sourceId || null,
      method: method || "",
      description,
      createdAt: now(),
    });
    state.wallet.transactions = state.wallet.transactions.slice(0, 50);
    return state.wallet.balance;
  };
  const debitWallet = ({ amount: relatedAmount, sourceType, sourceId, label, method = WALLET_PAYMENT_METHOD }) => {
    const value = amount(relatedAmount);
    if (value > state.wallet.balance) return null;
    addWalletTransaction({
      type: "payment",
      amount: value,
      sourceType,
      sourceId,
      method,
      description: `Thanh toán ${money(value)} từ ví · ${label}`,
    });
    return { amount: value, balance: state.wallet.balance };
  };
  const topUpWallet = (rawAmount, method = "Nạp tiền trong app") => {
    const value = amount(rawAmount);
    if (value < 10000 || value > 5000000) return null;
    addWalletTransaction({
      type: "topup",
      amount: value,
      sourceType: "wallet",
      sourceId: null,
      method,
      description: `Nạp ${money(value)} vào Ví MatchUp`,
    });
    addNotification("Nạp tiền vào ví thành công", `Ví MatchUp đã được cộng ${money(value)}.`, "wallet");
    save("wallet-topped-up");
    return clone(state.wallet);
  };
  const settleLoyalty = ({ subtotal, requestedPoints, sourceType, sourceId, label }) => {
    const preview = previewPoints(subtotal, requestedPoints);
    if (!preview.isValid) return null;
    if (preview.points) {
      addLoyaltyTransaction({
        type: "redeem",
        points: -preview.points,
        sourceType,
        sourceId,
        amount: preview.discount,
        description: `Đổi ${preview.points} điểm giảm ${money(preview.discount)} · ${label}`,
      });
    }
    const earnedPoints = Math.floor(preview.paidAmount / LOYALTY_POLICY.earnPerAmount);
    if (earnedPoints) {
      addLoyaltyTransaction({
        type: "earn",
        points: earnedPoints,
        sourceType,
        sourceId,
        amount: preview.paidAmount,
        description: `Tích ${earnedPoints} điểm từ ${label}`,
      });
    }
    return { ...preview, earnedPoints };
  };
  const splitEqual = (players, total) => {
    if (!players.length) return [];
    const base = Math.floor(total / players.length);
    const remainder = total - base * players.length;
    return players.map((player, index) => ({ ...player, amount: base + (index === 0 ? remainder : 0) }));
  };
  const splitProportionally = (players, previousTotal, nextTotal) => {
    if (!players.length || !previousTotal) return splitEqual(players, nextTotal);
    const shares = players.map((player, index) => {
      const raw = amount(player.amount) / previousTotal * nextTotal;
      return { index, base: Math.floor(raw), fraction: raw % 1 };
    });
    let remainder = nextTotal - shares.reduce((sum, share) => sum + share.base, 0);
    shares.sort((a, b) => b.fraction - a.fraction || a.index - b.index).forEach((share) => {
      if (remainder > 0) {
        share.base += 1;
        remainder -= 1;
      }
    });
    return players.map((player, index) => ({ ...player, amount: shares.find((share) => share.index === index).base }));
  };
  const applyBookingDiscount = (booking, preview) => {
    const previousTotal = amount(booking.subtotal);
    const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
    if (players.some((player) => player.paid)) return null;
    const isEqual = !booking.split || booking.split.mode !== "custom";
    const nextPlayers = isEqual
      ? splitEqual(players, preview.paidAmount)
      : splitProportionally(players, players.reduce((sum, player) => sum + amount(player.amount), 0), preview.paidAmount);
    booking.total = preview.paidAmount;
    booking.loyalty = { redeemedPoints: preview.points, discount: preview.discount, originalTotal: previousTotal };
    if (booking.split) booking.split.players = nextPlayers;
    return nextPlayers;
  };
  const expireBookings = () => {
    const expired = state.bookings.filter((booking) => booking.status === "held" && booking.holdExpiresAt <= now());
    if (!expired.length) return false;
    expired.forEach((booking) => {
      booking.status = "expired";
      booking.updatedAt = now();
      upsertJourney("booking", booking.id, "expired", { bookingId: booking.id, matchName: booking.court });
      addNotification("Đã hết hạn giữ sân", `${booking.court} lúc ${booking.time} không còn được giữ cho bạn.`, "booking");
    });
    save("booking-expired");
    return true;
  };
  const getBooking = (bookingId) => {
    expireBookings();
    return state.bookings.find((booking) => booking.id === bookingId) || null;
  };

  window.MatchUpStore = {
    money,
    getState: () => { expireBookings(); return clone(state); },
    getLoyalty: () => clone({ ...state.loyalty, policy: LOYALTY_POLICY }),
    getWallet: () => clone({ ...state.wallet, paymentMethod: WALLET_PAYMENT_METHOD }),
    topUpWallet,
    canPayWithWallet: (requiredAmount) => state.wallet.balance >= amount(requiredAmount),
    getVouchers: (context = {}) => clone(getVouchers(context)),
    getVoucher: (voucherId) => clone(VOUCHER_CATALOG.find((voucher) => voucher.id === voucherId || voucher.code === voucherId) || null),
    previewVoucher: (voucherId, context = {}) => clone(previewVoucher(voucherId, context)),
    getBestVoucher: (context = {}) => clone(bestVoucher(context)),
    previewPoints: (subtotal, requestedPoints) => clone(previewPoints(subtotal, requestedPoints)),
    previewBookingPoints: (bookingId, requestedPoints) => {
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking) return null;
      const preview = previewPoints(amount(booking.subtotal), requestedPoints);
      const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
      const projectedPlayers = booking.split && booking.split.mode === "custom"
        ? splitProportionally(players, players.reduce((sum, player) => sum + amount(player.amount), 0), preview.paidAmount)
        : splitEqual(players, preview.paidAmount);
      return clone({ ...preview, ownerAmount: amount(projectedPlayers[0] && projectedPlayers[0].amount) });
    },
    getProfile: () => clone(state.profile),
    getSubjectId: (type, value) => subjectId(type === "court" ? "court" : "player", value),
    submitReputationReview: (input = {}) => submitReputationReview(input),
    canSubmitReputationReview: (type, sourceId) => canSubmitReputationReview(type, sourceId),
    getCourtReputation: (courtId, fallback = {}) => clone(reputationFromReviews("court", courtId, fallback)),
    getPlayerReputation: (playerId) => clone(reputationFromReviews("player", playerId === "self" ? stableSubjectId("player", state.profile.name) : playerId, {})),
    getReviewsForSubject: (subjectType, subjectIdValue) => {
      const type = subjectType === "court" ? "court" : "player";
      const resolvedId = type === "player" && subjectIdValue === "self" ? stableSubjectId("player", state.profile.name) : subjectId(type, subjectIdValue);
      return clone(state.reputationReviews.filter((review) => type === "court"
        ? review.court && review.court.id === resolvedId
        : Array.isArray(review.players) && review.players.some((player) => player.id === resolvedId)));
    },
    getPreferences: () => clone(state.preferences),
    updateProfile: (updates) => {
      state.profile = { ...state.profile, ...updates };
      state.profile.initials = initials(state.profile.name);
      state.preferences = { ...state.preferences, level: state.profile.level, radius: state.profile.radius, availability: state.profile.availability, sport: state.profile.sports[0] || state.preferences.sport };
      addNotification("Đã cập nhật hồ sơ", "Sở thích của bạn sẽ được dùng để gợi ý kèo phù hợp hơn.", "profile");
      save("profile-updated");
      return clone(state.profile);
    },
    addNotification: (title, body, type) => { addNotification(title, body, type); save("notification-added"); },
    getNotifications: () => clone(state.notifications),
    markNotificationsRead: () => {
      state.notifications.forEach((notification) => { notification.read = true; });
      save("notifications-read");
    },
    createMatch: (input) => {
      const profile = state.profile;
      const capacity = Math.max(2, Number(input.capacity) || 6);
      const match = {
        id: id("match"),
        custom: true,
        sport: input.sport || "football",
        emoji: input.emoji || "⚽",
        name: input.name || `${profile.name} tìm đồng đội`,
        format: input.format || "Giao lưu",
        venue: input.venue || "Sân gần bạn",
        bookingId: input.bookingId || null,
        area: input.area || "Long Biên",
        address: input.address || "Long Biên, Hà Nội",
        time: input.time || "Tối nay, 20:00",
        timeKey: input.timeKey || "today",
        dateKey: input.dateKey || null,
        timeOrder: Number(input.timeOrder) || 20,
        distance: Number(input.distance) || 2.1,
        level: input.level || profile.level,
        score: 100,
        capacity,
        joined: 1,
        available: capacity - 1,
        fee: Number(input.fee) || 360000,
        share: Math.ceil((Number(input.fee) || 360000) / capacity / 1000) * 1000,
        deposit: Math.ceil((Number(input.fee) || 360000) / capacity / 2000) * 1000,
        paymentMethod: "Chuyển khoản QR qua MatchUp",
        creatorName: profile.name,
        joinRules: normaliseJoinRules(input.joinRules),
        status: "open",
        createdAt: now(),
        participants: [{ id: stableSubjectId("player", profile.name), name: profile.name, initials: profile.initials, role: "Chủ kèo", tone: "#d78c68", payment: "Chưa thanh toán" }],
        vibe: "Giao lưu, thân thiện",
      };
      state.matches.unshift(match);
      addNotification("Đã đăng kèo mới", `${match.name} đang chờ thêm ${match.available} người chơi.`, "match");
      save("match-created");
      return clone(match);
    },
    updateMatchRules: (matchId, rules) => {
      const match = state.matches.find((item) => item.id === matchId);
      if (!match) return null;
      match.joinRules = normaliseJoinRules(rules);
      match.updatedAt = now();
      save("match-rules-updated");
      return clone(match);
    },
    getMatchApproval: (match, candidate = state.profile) => clone(approvalCheck(match, candidate)),
    getCustomMatches: () => clone(state.matches),
    getMatch: (matchId) => clone(state.matches.find((match) => match.id === matchId) || null),
    getMatchInsights: (match) => clone(matchInsight(match || {})),
    isMatchSaved: (matchId) => state.savedMatches.includes(matchId),
    toggleSavedMatch: (matchId, label = "kèo này", details = null) => {
      const index = state.savedMatches.indexOf(matchId);
      const saved = index === -1;
      if (saved) {
        state.savedMatches.unshift(matchId);
        if (details && typeof details === "object") state.savedMatchDetails[matchId] = clone({ ...details, id: matchId });
      } else {
        state.savedMatches.splice(index, 1);
        delete state.savedMatchDetails[matchId];
      }
      addNotification(saved ? "Đã lưu kèo" : "Đã bỏ lưu kèo", saved ? `Bạn sẽ dễ tìm lại ${label}.` : `${label} đã được bỏ khỏi danh sách lưu.`, "match");
      save(saved ? "match-saved" : "match-unsaved");
      return saved;
    },
    getSavedMatches: () => clone(state.savedMatches),
    getSavedMatchRecords: () => clone(state.savedMatches.map((matchId) => state.savedMatchDetails[matchId] || { id: matchId, name: "Kèo đã lưu" })),
    requestWaitlist: (criteria = {}) => {
      const key = JSON.stringify({ sport: criteria.sport || "all", time: criteria.time || "all", level: criteria.level || "all", radius: Number(criteria.radius) || 10 });
      const existing = state.waitlists.find((item) => item.key === key && item.status === "active");
      if (existing) return clone(existing);
      const waitlist = { id: id("wait"), key, criteria: { ...criteria }, status: "active", createdAt: now() };
      state.waitlists.unshift(waitlist);
      addNotification("Đã bật báo kèo", "MatchUp sẽ nhắc bạn khi có kèo mới phù hợp bộ lọc này.", "match");
      save("waitlist-created");
      return clone(waitlist);
    },
    getWaitlists: () => clone(state.waitlists),
    getJourney: (type, sourceId) => clone(findJourney(type, sourceId)),
    getJourneys: () => clone(state.playJourneys),
    completeJourney: (type, sourceId) => {
      const journey = findJourney(type, sourceId);
      if (!journey) return null;
      journey.status = "completed";
      journey.completedAt = now();
      journey.updatedAt = now();
      addNotification("Trận chơi đã hoàn thành", "Chia sẻ cảm nhận để nhận huy hiệu cho đội của bạn.", "feedback");
      save("journey-completed");
      return clone(journey);
    },
    submitFeedback: (input = {}) => {
      const rating = Math.min(5, Math.max(1, integer(input.rating) || 5));
      const atmosphere = Math.min(5, Math.max(1, integer(input.atmosphere) || rating));
      const existing = state.matchFeedback.find((item) => item.type === input.type && item.sourceId === input.sourceId);
      if (existing) return clone(existing);
      const feedback = { id: id("feedback"), type: input.type, sourceId: input.sourceId, rating, atmosphere, tags: Array.isArray(input.tags) ? input.tags.slice(0, 4) : [], repeat: input.repeat !== false, createdAt: now() };
      state.matchFeedback.unshift(feedback);
      const journey = upsertJourney(input.type, input.sourceId, "completed", { feedbackSubmitted: true });
      state.profile.streak = integer(state.profile.streak) + 1;
      const badge = atmosphere >= 4 ? "Đồng đội tích cực" : "Luôn sẵn sàng ra sân";
      if (!state.profile.badges.includes(badge)) state.profile.badges.unshift(badge);
      addNotification("Cảm ơn bạn đã chia sẻ", `Bạn nhận huy hiệu “${badge}”. Trận tiếp theo đang chờ bạn!`, "feedback");
      save("feedback-submitted");
      return clone({ feedback, journey });
    },
    getFeedback: () => clone(state.matchFeedback),
    cancelMatch: (matchId) => {
      const match = state.matches.find((item) => item.id === matchId);
      if (!match || match.status === "cancelled") return null;
      match.status = "cancelled";
      match.updatedAt = now();
      addNotification("Đã hủy kèo", `${match.name} không còn hiển thị cho người chơi khác.`, "match");
      save("match-cancelled");
      return clone(match);
    },
    applyToMatch: (match) => {
      const existing = state.applications.find((application) => application.matchId === match.id && application.status !== "cancelled");
      if (existing) return clone(existing);
      const decision = approvalCheck(match, state.profile);
      const paymentFirst = decision.rules.requirePaymentBeforeJoin;
      const autoApproved = decision.rules.autoApprove && decision.eligible;
      const status = paymentFirst ? "payment_pending" : autoApproved ? "accepted" : "pending";
      const application = {
        id: id("application"),
        matchId: match.id,
        match: clone(match),
        status,
        paymentStatus: "unpaid",
        autoApproved,
        approvalCriteria: clone(decision.rules.criteria),
        approvalNote: decision.eligible ? "Đủ tiêu chí tham gia" : `Còn thiếu: ${decision.failed.join(", ")}`,
        createdAt: now(),
        updatedAt: now(),
      };
      upsertJourney("match", application.id, status === "accepted" ? "accepted" : "requested", { matchId: match.id, matchName: match.name });
      state.applications.unshift(application);
      ensureChatRoom(application.matchId, application.match);
      if (status === "accepted") {
        addNotification("Đã tự động duyệt vào kèo", `${match.name}. ${decision.rules.requirePaymentBeforeJoin ? "Hãy thanh toán cọc để giữ chỗ." : "Bạn đã được thêm vào đội."}`, "match");
        addNotification("Phòng chat đã mở", `Bạn có thể làm quen với đội trong ${match.name}.`, "chat");
      } else if (status === "payment_pending") {
        addNotification("Thanh toán cọc trước khi được duyệt", `${match.name}. Sau khi thanh toán, ${autoApproved ? "bạn sẽ được tự động vào đội." : "chủ kèo mới có thể duyệt bạn vào đội."}`, "payment");
      } else {
        addNotification("Đã gửi yêu cầu vào kèo", `Yêu cầu vào ${match.name} đang chờ chủ kèo phản hồi.`, "match");
      }
      save("match-applied");
      return clone(application);
    },
    getApplications: () => clone(state.applications),
    getChatAccess: (matchId) => {
      const application = chatApplication(matchId);
      if (!application) return { allowed: false, status: null, reason: "Phòng chat chỉ mở sau khi chủ kèo duyệt yêu cầu." };
      const room = ensureChatRoom(matchId, application.match);
      return clone({ allowed: true, status: application.status, match: application.match, roomId: room.id, greetingPending: Boolean(room.greetingPending) });
    },
    getChatRooms: () => clone(state.applications.filter((application) => ["pending", "accepted", "paid"].includes(application.status)).map((application) => {
      const room = ensureChatRoom(application.matchId, application.match);
      const messages = Array.isArray(room.messages) ? room.messages : [];
      const lastMessage = messages.filter((message) => message.kind !== "system").slice(-1)[0] || messages.slice(-1)[0] || null;
      return { id: room.id, matchId: application.matchId, status: application.status, match: application.match, lastMessage, unreadCount: Number(room.unreadCount) || 0, updatedAt: lastMessage ? lastMessage.createdAt : room.createdAt };
    }).sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))),
    markChatRead: (matchId) => {
      const room = state.chatRooms[matchId];
      if (!room || !room.unreadCount) return false;
      room.unreadCount = 0;
      save("chat-read");
      return true;
    },
    getChatMessages: (matchId) => clone((state.chatRooms[matchId] && state.chatRooms[matchId].messages) || []),
    getChatAutoReply: (text) => clone(createChatAutoReply(null, text)),
    hasPendingChatGreeting,
    sendChatGreeting,
    sendChatAutoReply,
    sendChatMessage: (matchId, text) => {
      const application = chatApplication(matchId);
      const cleanText = String(text || "").trim().slice(0, 500);
      if (!application || !cleanText) return null;
      const room = ensureChatRoom(matchId, application.match);
      const profile = state.profile;
      const message = {
        id: id("message"),
        kind: "text",
        senderId: "self",
        senderName: profile.name,
        senderInitials: profile.initials,
        senderTone: "#d78c68",
        text: cleanText,
        createdAt: now(),
      };
      room.messages.push(message);
      room.messages = room.messages.slice(-100);
      save("chat-message-sent");
      return clone(message);
    },
    updateApplicationStatus: (applicationId, status) => {
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application) return null;
      const paymentFirst = Boolean(application.match && application.match.joinRules && application.match.joinRules.requirePaymentBeforeJoin);
      if (status === "accepted" && paymentFirst && application.paymentStatus !== "paid") return null;
      const nextStatus = status === "accepted" && paymentFirst ? "paid" : status;
      application.status = nextStatus;
      application.updatedAt = now();
      upsertJourney("match", application.id, nextStatus, { matchId: application.matchId, matchName: application.match.name });
      const label = nextStatus === "accepted" || nextStatus === "paid" ? "Bạn đã được nhận vào kèo" : nextStatus === "declined" ? "Yêu cầu vào kèo không được duyệt" : "Đã hủy yêu cầu vào kèo";
      addNotification(label, application.match.name, "match");
      if (nextStatus === "accepted" || nextStatus === "paid") {
        ensureChatRoom(application.matchId, application.match);
        addNotification("Phòng chat đã mở", `Bạn có thể làm quen với đội trong ${application.match.name}.`, "chat");
      }
      save("application-updated");
      return clone(application);
    },
    payForApplication: (applicationId, method = "VietQR", requestedPoints = 0) => {
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application || !["accepted", "payment_pending"].includes(application.status)) return null;
      const paymentFirst = Boolean(application.match && application.match.joinRules && application.match.joinRules.requirePaymentBeforeJoin);
      const subtotal = amount(application.match.deposit || application.match.share / 2);
      const pointsPreview = previewPoints(subtotal, requestedPoints);
      const walletPayment = method === WALLET_PAYMENT_METHOD;
      if (!pointsPreview.isValid || (walletPayment && pointsPreview.paidAmount > state.wallet.balance)) return null;
      const loyaltyPayment = settleLoyalty({
        subtotal,
        requestedPoints,
        sourceType: "application",
        sourceId: application.id,
        label: `cọc kèo ${application.match.name}`,
      });
      if (!loyaltyPayment) return null;
      const walletPaymentDetail = walletPayment
        ? debitWallet({ amount: loyaltyPayment.paidAmount, sourceType: "application", sourceId: application.id, label: `cọc kèo ${application.match.name}` })
        : null;
      if (walletPayment && !walletPaymentDetail) return null;
      application.status = paymentFirst && !application.autoApproved ? "pending" : "paid";
      application.paymentStatus = "paid";
      application.paymentMethod = method;
      application.payment = {
        subtotal,
        paidAmount: loyaltyPayment.paidAmount,
        redeemedPoints: loyaltyPayment.points,
        discount: loyaltyPayment.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
        walletAmount: walletPaymentDetail ? walletPaymentDetail.amount : 0,
      };
      upsertJourney("match", application.id, application.status, { matchId: application.matchId, matchName: application.match.name });
      application.updatedAt = now();
      const loyaltyNote = `${loyaltyPayment.points ? ` Đã đổi ${loyaltyPayment.points} điểm.` : ""}${loyaltyPayment.earnedPoints ? ` Tích ${loyaltyPayment.earnedPoints} điểm.` : ""}`;
      addNotification(application.status === "pending" ? "Đã thanh toán cọc — chờ duyệt" : "Đã thanh toán cọc kèo", `${money(loyaltyPayment.paidAmount)} qua ${method} cho ${application.match.name}.${loyaltyNote}`, "payment");
      save("application-paid");
      return clone(application);
    },
    createBooking: (input) => {
      expireBookings();
      const hasSubtotal = Object.prototype.hasOwnProperty.call(input, "subtotal");
      const originalTotal = amount(hasSubtotal ? input.subtotal : input.total);
      const teamSize = Math.max(1, integer(input.teamSize) || 4);
      const voucherContext = {
        subtotal: originalTotal,
        sport: input.sport || "",
        date: input.date || "",
        time: input.time || "",
        times: Array.isArray(input.timeSlots) ? input.timeSlots : [],
        teamSize,
        isFirstBooking: !bookingHistoryExists(),
      };
      const voucherPreview = input.voucherId
        ? previewVoucher(input.voucherId, voucherContext)
        : hasSubtotal ? bestVoucher(voucherContext) : null;
      const appliedVoucher = voucherPreview && voucherPreview.eligible ? voucherPreview : null;
      const voucherDiscountAmount = appliedVoucher ? appliedVoucher.discount : 0;
      const total = Math.max(0, originalTotal - voucherDiscountAmount);
      const booking = {
        id: id("booking"),
        court: input.court,
        courtId: input.courtId || stableSubjectId("court", input.court),
        teamSize,
        distance: input.distance || "gần bạn",
        sport: input.sport || "football",
        date: input.date,
        dateKey: input.dateKey || null,
        time: input.time,
        timeSlots: Array.isArray(input.timeSlots) ? [...input.timeSlots] : null,
        duration: input.duration || 90,
        total,
        subtotal: total,
        originalTotal,
        level: input.level || state.profile.level,
        creatorName: state.profile.name,
        joinRules: normaliseJoinRules(input.joinRules),
        voucher: appliedVoucher ? {
          id: appliedVoucher.id,
          code: appliedVoucher.code,
          title: appliedVoucher.title,
          category: appliedVoucher.category,
          discount: voucherDiscountAmount,
          discountLabel: appliedVoucher.discountLabel,
        } : null,
        status: "held",
        holdExpiresAt: now() + 10 * 60 * 1000,
        createdAt: now(),
        updatedAt: now(),
        ownerPaid: false,
        split: {
          mode: "equal",
          players: [
            { id: stableSubjectId("player", state.profile.name), name: state.profile.name, initials: state.profile.initials, role: "Người tạo kèo", amount: total, paid: false },
          ],
        },
      };
      state.bookings.unshift(booking);
      upsertJourney("booking", booking.id, "held", { bookingId: booking.id, matchName: booking.court });
      const voucherNote = booking.voucher ? ` Đã dùng ${booking.voucher.code}, giảm ${money(booking.voucher.discount)}.` : "";
      addNotification("Đã giữ sân trong 10 phút", `${booking.court} · ${booking.date}, ${booking.time}.${voucherNote} Hãy xác nhận hoặc mời đội.`, "booking");
      save("booking-held");
      return clone(booking);
    },
    updateBookingRules: (bookingId, rules) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.ownerPaid || ["expired", "cancelled"].includes(booking.status)) return null;
      booking.joinRules = normaliseJoinRules(rules);
      const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
      players.forEach((player) => {
        if (booking.joinRules.requirePaymentBeforeJoin) {
          if (!player.paid && player.joinStatus === "approved") {
            player.joinStatus = "payment_pending";
            player.role = "Đã đủ điều kiện · Chờ thanh toán cọc";
          } else if (player.paid && player.joinStatus === "approved") {
            player.role = "Đã được duyệt · Đã thanh toán";
          }
        } else if (player.joinStatus === "payment_pending") {
          player.joinStatus = player.autoApproved ? "approved" : "pending";
          player.role = player.joinStatus === "approved" ? "Đã tự động duyệt · Chờ thanh toán" : "Đang chờ chủ kèo duyệt";
        }
      });
      booking.updatedAt = now();
      save("booking-rules-updated");
      return clone(booking);
    },
    getBookings: () => { expireBookings(); return clone(state.bookings); },
    getBooking: (bookingId) => clone(getBooking(bookingId)),
    getLatestBooking: () => { expireBookings(); return clone(state.bookings[0] || null); },
    confirmBooking: (bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.status !== "held") return null;
      booking.status = "confirmed";
      booking.updatedAt = now();
      upsertJourney("booking", booking.id, "confirmed", { bookingId: booking.id, matchName: booking.court });
      addNotification("Đã xác nhận đặt sân", `${booking.court} · ${booking.date}, ${booking.time} đã có trong lịch của bạn.`, "booking");
      save("booking-confirmed");
      return clone(booking);
    },
    cancelBooking: (bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || !["held", "confirmed"].includes(booking.status)) return null;
      booking.status = "cancelled";
      booking.updatedAt = now();
      upsertJourney("booking", booking.id, "cancelled", { bookingId: booking.id, matchName: booking.court });
      addNotification("Đã hủy lịch sân", `${booking.court} · ${booking.date}, ${booking.time}.`, "booking");
      save("booking-cancelled");
      return clone(booking);
    },
    saveBookingSplit: (bookingId, split) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.ownerPaid) return null;
      booking.split = clone(split);
      booking.updatedAt = now();
      save("booking-split-updated");
      return clone(booking);
    },
    addBookingPlayer: (bookingId, playerInput = {}) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.ownerPaid || ["expired", "cancelled"].includes(booking.status)) return null;
      const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
      const maxPlayers = Math.max(1, integer(booking.teamSize) || 4);
      if (players.length >= maxPlayers) return null;
      const player = normalisePlayer({
        ...playerInput,
        role: playerInput.role || "Đã được mời · Đang chờ tham gia",
        paid: false,
      });
      if (!player || players.some((item) => subjectKey(item.name) === subjectKey(player.name))) return null;
      const decision = approvalCheck(booking, { ...player, level: playerInput.level || booking.level, completedMatches: playerInput.completedMatches, rating: playerInput.rating });
      const requirePayment = Boolean(booking.joinRules && booking.joinRules.requirePaymentBeforeJoin);
      const autoEligible = Boolean(booking.joinRules && booking.joinRules.autoApprove && decision.eligible);
      // Payment-first means payment is the gate before approval. Never expose an
      // approval action for an unpaid player, even when the host uses manual approval.
      const joinStatus = requirePayment ? "payment_pending" : autoEligible ? "approved" : "pending";
      player.joinStatus = joinStatus;
      player.autoApproved = autoEligible;
      player.approvalNote = decision.eligible ? "Đủ tiêu chí tham gia" : `Còn thiếu: ${decision.failed.join(", ")}`;
      if (joinStatus === "payment_pending") player.role = autoEligible ? "Đã đủ điều kiện · Chờ thanh toán cọc" : "Đang chờ thanh toán cọc trước khi duyệt";
      else if (joinStatus === "approved") player.role = "Đã tự động duyệt · Chờ thanh toán";
      else player.role = "Đang chờ chủ kèo duyệt";
      booking.split = {
        mode: "equal",
        players: splitEqual([...players, player], amount(booking.total)),
      };
      booking.updatedAt = now();
      save("booking-player-added");
      return clone(booking);
    },
    updateBookingPlayerStatus: (bookingId, playerId, status) => {
      const booking = getBooking(bookingId);
      if (!booking || !booking.split || !Array.isArray(booking.split.players)) return null;
      const player = booking.split.players.find((item) => item.id === playerId);
      if (!player || !["approved", "rejected"].includes(status)) return null;
      if (status === "approved" && booking.joinRules && booking.joinRules.requirePaymentBeforeJoin && !player.paid) return null;
      player.joinStatus = status;
      player.role = status === "approved"
        ? player.paid ? "Đã được chủ kèo duyệt · Đã thanh toán" : "Đã được chủ kèo duyệt · Chờ thanh toán"
        : "Không được duyệt";
      booking.updatedAt = now();
      save("booking-player-status-updated");
      return clone(booking);
    },
    markBookingPlayerPaid: (bookingId, playerId) => {
      const booking = getBooking(bookingId);
      if (!booking || !booking.split || !Array.isArray(booking.split.players)) return null;
      const player = booking.split.players.find((item) => item.id === playerId);
      if (!player || player.id === booking.split.players[0].id || player.joinStatus === "rejected") return null;
      player.paid = true;
      const requirePayment = Boolean(booking.joinRules && booking.joinRules.requirePaymentBeforeJoin);
      if (requirePayment && player.joinStatus === "payment_pending") {
        if (player.autoApproved) {
          player.joinStatus = "approved";
          player.role = "Đã tự động duyệt · Đã thanh toán";
        } else {
          player.joinStatus = "pending";
          player.role = "Đã thanh toán cọc · Chờ chủ kèo duyệt";
        }
      } else if (player.joinStatus === "approved") {
        player.role = "Đã được duyệt · Đã thanh toán";
      }
      booking.updatedAt = now();
      addNotification("Đã ghi nhận thanh toán của người chơi", `${player.name} đã thanh toán phần ${money(player.amount)} cho ${booking.court}.`, "payment");
      save("booking-player-paid");
      return clone(booking);
    },
    payForBooking: (bookingId, method = "VietQR", requestedPoints = 0) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.ownerPaid || booking.status === "expired" || booking.status === "cancelled") return null;
      const subtotal = amount(booking.subtotal);
      const preview = previewPoints(subtotal, requestedPoints);
      if (!preview.isValid) return null;
      const walletPayment = method === WALLET_PAYMENT_METHOD;
      const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
      if (!players.length || players.some((player) => player.paid)) return null;
      const currentSplitTotal = players.reduce((sum, player) => sum + amount(player.amount), 0);
      if (booking.split.mode === "custom" && currentSplitTotal !== subtotal) return null;
      const previewSplit = booking.split.mode === "custom"
        ? splitProportionally(players, currentSplitTotal, preview.paidAmount)
        : splitEqual(players, preview.paidAmount);
      const ownerAmount = amount(previewSplit[0] && previewSplit[0].amount);
      if (walletPayment && ownerAmount > state.wallet.balance) return null;
      const loyaltyPayment = settleLoyalty({
        subtotal: ownerAmount,
        requestedPoints: 0,
        sourceType: "booking",
        sourceId: booking.id,
        label: `thanh toán sân ${booking.court}`,
      });
      if (!loyaltyPayment) return null;
      if (preview.points) {
        addLoyaltyTransaction({
          type: "redeem",
          points: -preview.points,
          sourceType: "booking",
          sourceId: booking.id,
          amount: preview.discount,
          description: `Đổi ${preview.points} điểm giảm ${money(preview.discount)} cho đơn sân ${booking.court}`,
        });
      }
      const discountedPlayers = applyBookingDiscount(booking, preview);
      if (!discountedPlayers) return null;
      const walletPaymentDetail = walletPayment
        ? debitWallet({ amount: ownerAmount, sourceType: "booking", sourceId: booking.id, label: `sân ${booking.court}` })
        : null;
      if (walletPayment && !walletPaymentDetail) return null;
      booking.ownerPaid = true;
      booking.ownerPaymentMethod = method;
      booking.payment = {
        subtotal: ownerAmount,
        paidAmount: ownerAmount,
        redeemedPoints: preview.points,
        discount: preview.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
        walletAmount: walletPaymentDetail ? walletPaymentDetail.amount : 0,
      };
      booking.updatedAt = now();
      const self = booking.split && booking.split.players && booking.split.players[0];
      if (self) self.paid = true;
      upsertJourney("booking", booking.id, "paid", { bookingId: booking.id, matchName: booking.court });
      const loyaltyNote = `${preview.points ? ` Đã đổi ${preview.points} điểm.` : ""}${loyaltyPayment.earnedPoints ? ` Tích ${loyaltyPayment.earnedPoints} điểm.` : ""}`;
      addNotification("Thanh toán sân thành công", `Bạn đã thanh toán ${money(ownerAmount)} qua ${method} cho ${booking.court}.${loyaltyNote}`, "payment");
      save("booking-paid");
      return clone(booking);
    },
    getSecondsRemaining: (booking) => booking && booking.status === "held" ? Math.max(0, Math.ceil((booking.holdExpiresAt - now()) / 1000)) : 0,
    resetDemo: () => {
      state = defaultState();
      try { localStorage.clear(); } catch (_) { /* storage may be unavailable */ }
      try { sessionStorage.clear(); } catch (_) { /* storage may be unavailable */ }
      document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { reason: "demo-reset", state: clone(state) } }));
      return clone(state);
    },
  };
})();
