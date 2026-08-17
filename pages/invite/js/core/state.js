import '../../../../js/app-state/index.js';
import { subjectKey } from '../../../../js/app-state/core/utils.js';

export const store = window.MatchUpStore;
export const query = new URLSearchParams(location.search);
export const profile = store.getProfile();
export const requestedBooking = query.get('booking');
export const requestedMatch = query.get('match');

export const matchApplication = requestedMatch
  ? store.getApplications().find(item => (
    item.matchId === requestedMatch && item.status !== 'cancelled'
  ))
  : null;
export let matchInvite = requestedMatch
  ? (matchApplication && matchApplication.match)
    || store.resolveMatchRecord(requestedMatch)
  : null;
export const matchInviteMode = Boolean(matchInvite);

function buildSplitPlayers(match) {
  const participants = [...(Array.isArray(match.participants) ? match.participants : [])];
  const saved = match.split && Array.isArray(match.split.players)
    ? match.split.players
    : [];
  const amountByKey = new Map(
    saved.map(player => [subjectKey(player.name), Number(player.amount) || 0])
  );
  const paidByKey = new Map(
    saved.map(player => [subjectKey(player.name), Boolean(player.paid)])
  );
  if (
    matchApplication
    && !participants.some(player => subjectKey(player.name) === subjectKey(profile.name))
  ) {
    participants.push({
      id: store.getSubjectId('player', profile.name),
      name: profile.name,
      initials: profile.initials,
      role: matchApplication.status === 'paid'
        ? 'Bạn · Đã vào kèo'
        : matchApplication.status === 'accepted'
          || matchApplication.status === 'payment_pending'
          ? 'Bạn · Đã được duyệt'
          : 'Bạn · Đang chờ duyệt',
      paid: matchApplication.status === 'paid',
      payment: matchApplication.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán',
      paidAmount: matchApplication.payment
        ? Number(matchApplication.payment.paidAmount) || 0
        : 0,
      joinStatus: 'approved',
      tone: '#d78c68'
    });
  }
  return participants.map(player => {
    const key = subjectKey(player.name);
    const isSelf = key === subjectKey(profile.name);
    return {
      ...player,
      amount: amountByKey.get(key) || 0,
      paid: isSelf
        ? Boolean(
          player.paid
          || player.payment === 'Đã thanh toán'
          || (matchApplication && matchApplication.status === 'paid')
        )
        : paidByKey.has(key)
          ? paidByKey.get(key)
          : Boolean(player.paid) || player.payment === 'Đã thanh toán',
      paidAmount: isSelf
        ? Number(
          (matchApplication && matchApplication.payment
            && matchApplication.payment.paidAmount)
          || (match.payment && match.payment.paidAmount)
          || player.paidAmount
        ) || 0
        : Number(player.paidAmount) || 0,
      joinStatus: player.joinStatus || 'approved'
    };
  });
}

function buildMatchInviteBooking(match) {
  const players = buildSplitPlayers(match);
  return {
    id: `match-invite-${match.id}`,
    matchId: match.id,
    status: 'confirmed',
    court: match.venue || 'Sân MatchUp',
    courtId: match.venue,
    date: '',
    time: match.time || 'Thời gian chưa cập nhật',
    duration: 90,
    total: Number(match.fee || 0),
    subtotal: Number(match.fee || 0),
    teamSize: Math.max(1, Number(match.capacity) || players.length + 1),
    ownerPaid: false,
    joinRules: match.joinRules || {
      requirePaymentBeforeJoin: false,
      autoApprove: false,
      criteria: {
        levelMatch: false,
        minRating: 0,
        minCompletedMatches: 0
      }
    },
    split: {
      mode: match.split && match.split.mode === 'custom' ? 'custom' : 'equal',
      players
    }
  };
}

export function refreshMatchInvite() {
  if (!requestedMatch) return false;
  const record = store.resolveMatchRecord(requestedMatch);
  if (!record) {
    matchInvite = null;
    return false;
  }
  matchInvite = record;
  state.booking = buildMatchInviteBooking(record);
  state.total = state.booking.total;
  state.splitMode = state.booking.split.mode;
  state.splitPlayers = state.booking.split.players;
  return true;
}

const initialBooking = matchInviteMode
  ? buildMatchInviteBooking(matchInvite)
  : requestedBooking
    ? store.getBooking(requestedBooking)
    : store.getLatestBooking();
const initialTotal = initialBooking ? initialBooking.total : 168000;

export const state = {
  booking: initialBooking,
  total: initialTotal,
  splitMode: initialBooking && initialBooking.split
    ? initialBooking.split.mode
    : 'equal',
  requestedBookingPoints: 0,
  splitPlayers: initialBooking && initialBooking.split
    && initialBooking.split.players
    ? initialBooking.split.players
    : [{
      id: store.getSubjectId('player', profile.name),
      name: profile.name,
      initials: profile.initials,
      role: 'Người tạo kèo',
      amount: initialTotal,
      paid: false
    }],
  feedbackRating: 5,
  courtRating: 5,
  courtTags: new Set(['Sân tốt']),
  playerRatings: {},
  playerTags: {}
};

export function ownSplitPlayer() {
  const profileKey = subjectKey(profile.name);
  return state.splitPlayers.find(player => (
    subjectKey(player.name) === profileKey
  )) || state.splitPlayers[0] || null;
}

export function syncBookingRoster(updated) {
  if (!updated) return;
  state.booking = updated;
  state.total = updated.total;
  state.splitMode = updated.split && updated.split.mode || 'equal';
  if (updated.split && Array.isArray(updated.split.players)) {
    state.splitPlayers = updated.split.players;
  }
}