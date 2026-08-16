import '../../../../js/app-state/index.js';

export const store = window.MatchUpStore;
export const query = new URLSearchParams(location.search);
export const profile = store.getProfile();
export const requestedBooking = query.get('booking');
export const requestedMatch = query.get('match');

export const matchApplication = requestedMatch
  ? store.getApplications().find(item => item.matchId === requestedMatch)
  : null;
export const matchInvite = requestedMatch
  ? (matchApplication && matchApplication.match)
    || store.getCustomMatches().find(item => item.id === requestedMatch)
  : null;
export const matchInviteMode = Boolean(matchInvite);

export const matchInvitePlayers = matchInvite
  ? [...(matchInvite.participants || [])]
  : [];

if (matchInvite && matchApplication
  && !matchInvitePlayers.some(player => player.name === profile.name)) {
  matchInvitePlayers.push({
    id: store.getSubjectId('player', profile.name),
    name: profile.name,
    initials: profile.initials,
    role: matchApplication.status === 'paid'
      ? 'Bạn · Đã vào kèo'
      : 'Bạn · Đã được duyệt',
    paid: matchApplication.status === 'paid',
    joinStatus: 'approved'
  });
}

function createMatchInviteBooking(match) {
  return {
    id: `match-invite-${match.id}`,
    status: 'confirmed',
    court: match.venue || 'Sân MatchUp',
    courtId: match.venue,
    date: '',
    time: match.time || 'Thời gian chưa cập nhật',
    duration: 90,
    total: Number(match.fee || 0),
    subtotal: Number(match.fee || 0),
    teamSize: Math.max(
      1,
      Number(match.capacity) || (matchInvitePlayers.length + 1)
    ),
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
    split: { mode: 'equal', players: matchInvitePlayers }
  };
}

const initialBooking = matchInviteMode
  ? createMatchInviteBooking(matchInvite)
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
  selectedMethod: 'VietQR',
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

export function syncBookingRoster(updated) {
  if (!updated) return;
  state.booking = updated;
  state.total = updated.total;
  state.splitMode = updated.split && updated.split.mode || 'equal';
  if (updated.split && Array.isArray(updated.split.players)) {
    state.splitPlayers = updated.split.players;
  }
}
