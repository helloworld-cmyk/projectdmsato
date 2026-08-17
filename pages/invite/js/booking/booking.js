import {
  matchApplication,
  matchInvite,
  matchInviteMode,
  ownSplitPlayer,
  state,
  store,
  refreshMatchInvite
} from '../core/state.js';
import { $ } from '../core/dom.js';
import { showToast } from '../core/toast.js';
import { format } from '../core/utils.js';
import { matchCurrentShare } from '../../../../js/app-state/core/utils.js';

const shareJoinCandidates = [
  { name: 'Minh Khoa', initials: 'MK', level: 'Khá', rating: 4.5, completedMatches: 5 },
  { name: 'Thu Linh', initials: 'TL', level: 'Khá', rating: 4, completedMatches: 3 },
  { name: 'Quốc Duy', initials: 'QD', level: 'Giỏi', rating: 4.8, completedMatches: 10 },
  { name: 'Hà My', initials: 'HM', level: 'Mới chơi', rating: 0, completedMatches: 0 }
];

let shareJoinTimer = null;

export function activePlayerCount() {
  const inactive = ['pending', 'payment_pending', 'rejected'];
  return state.splitPlayers.filter(player => !inactive.includes(player.joinStatus)).length;
}

export function defaultJoinRules() {
  return {
    requirePaymentBeforeJoin: false,
    autoApprove: false,
    criteria: {
      levelMatch: false,
      minRating: 0,
      minCompletedMatches: 0
    }
  };
}

export function renderJoinRules() {
  const rules = state.booking && state.booking.joinRules || defaultJoinRules();
  $('#share-require-payment').checked = Boolean(rules.requirePaymentBeforeJoin);
  $('#share-auto-approve').checked = Boolean(rules.autoApprove);
  $('#share-level-match').checked = Boolean(rules.criteria && rules.criteria.levelMatch);
  $('#share-min-rating').value = String(rules.criteria && rules.criteria.minRating || 0);
  $('#share-min-completed').value = String(
    rules.criteria && rules.criteria.minCompletedMatches || 0
  );
  $('#share-approval-criteria').hidden = !rules.autoApprove;
  $('#share-description').textContent = rules.requirePaymentBeforeJoin
    ? rules.autoApprove
      ? 'Người đạt tiêu chí sẽ thanh toán và tự vào đội.'
      : 'Người nhận link sẽ thanh toán trước; chỉ được vào đội sau '
        + 'khi chủ kèo duyệt.'
    : rules.autoApprove
      ? 'Link mời sẽ tự động duyệt người đạt đủ tiêu chí, không cần '
        + 'thanh toán trước.'
      : 'Người nhận link sẽ chờ chủ kèo duyệt; không cần thanh toán trước.';
}

export function collectJoinRules() {
  return {
    requirePaymentBeforeJoin: $('#share-require-payment').checked,
    autoApprove: $('#share-auto-approve').checked,
    criteria: {
      levelMatch: $('#share-level-match').checked,
      minRating: Number($('#share-min-rating').value) || 0,
      minCompletedMatches: Number($('#share-min-completed').value) || 0
    }
  };
}

export function equalise() {
  const base = Math.floor(state.total / state.splitPlayers.length);
  const remainder = state.total - base * state.splitPlayers.length;
  state.splitPlayers = state.splitPlayers.map((player, index) => ({
    ...player,
    amount: base + (index === 0 ? remainder : 0)
  }));
}

export function totalSplit() {
  return state.splitPlayers.reduce(
    (sum, player) => sum + (Number(player.amount) || 0),
    0
  );
}

export function isBalanced() {
  return totalSplit() === state.total;
}

export function saveSplit() {
  if (!state.booking) return;
  if (matchInviteMode) {
    store.saveMatchSplit(matchInvite.id, {
      mode: state.splitMode,
      players: state.splitPlayers
    });
    return;
  }
  const updated = store.saveBookingSplit(state.booking.id, {
    mode: state.splitMode,
    players: state.splitPlayers
  });
  if (updated) state.booking = updated;
}

export function matchModePayableSubtotal() {
  if (!matchInviteMode || !matchInvite) return 0;
  const participants = Array.isArray(matchInvite.participants)
    ? matchInvite.participants
    : [];
  const share = matchCurrentShare(matchInvite, participants.length);
  const paid = matchApplication && matchApplication.payment
    ? Number(matchApplication.payment.paidAmount) || 0
    : 0;
  return Math.max(0, share - paid);
}

export function refundForSelf() {
  const own = ownSplitPlayer();
  if (!own || !own.paid) return 0;
  const paid = Number(own.paidAmount) || 0;
  const amount = Number(own.amount) || 0;
  if (!paid || paid <= amount) return 0;
  return paid - amount;
}

export function notifyRefund() {
  const refund = refundForSelf();
  if (!refund) return;
  showToast(
    `Bạn sẽ được hoàn ${format(refund)} đồng do đã có thêm người vào kèo.`
  );
}

export function scheduleSharedPlayer(onUpdate) {
  if (!state.booking) return;
  clearTimeout(shareJoinTimer);
  shareJoinTimer = setTimeout(() => {
    const latest = matchInviteMode
      ? state.booking
      : store.getBooking(state.booking.id) || state.booking;
    const existingNames = new Set(
      (latest.split && latest.split.players || []).map(player => (
        String(player.name || '').trim().toLocaleLowerCase()
      ))
    );
    const candidate = shareJoinCandidates.find(player => (
      !existingNames.has(player.name.toLocaleLowerCase())
    ));

    if (!candidate) {
      showToast('Đã mời hết người chơi trong danh sách gợi ý.');
      return;
    }

    let updated = null;
    if (matchInviteMode) {
      updated = store.addMatchPlayer(matchInvite.id, {
        ...candidate,
        role: 'Đã tham gia qua link'
      });
      if (updated) refreshMatchInvite();
    } else {
      updated = store.addBookingPlayer(latest.id, {
        ...candidate,
        role: 'Đã tham gia qua link'
      });
      if (updated) {
        state.booking = updated;
        state.total = updated.total;
        state.splitMode = updated.split && updated.split.mode || 'equal';
        state.splitPlayers = updated.split && updated.split.players || state.splitPlayers;
      }
    }
    if (!updated) {
      const blocked = !matchInviteMode && latest
        && ['expired', 'cancelled'].includes(latest.status);
      showToast(blocked
        ? 'Giữ chỗ đã hết hạn hoặc bị hủy, không thể thêm thành viên.'
        : 'Người chơi này đã có trong kèo rồi.');
      return;
    }

    onUpdate();
    showToast(`${candidate.name} vừa vào kèo sau khi nhận link.`);
    notifyRefund();
  }, 1000);
}

export function timeRemainingLabel() {
  const seconds = state.booking ? store.getSecondsRemaining(state.booking) : 0;
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:`
    + `${String(seconds % 60).padStart(2, '0')}`;
}

export function refreshBookingFromStore() {
  if (!state.booking) return;
  if (matchInviteMode) {
    refreshMatchInvite();
    return;
  }
  const updated = store.getBooking(state.booking.id);
  if (!updated) return;
  state.booking = updated;
  state.total = updated.total;
  state.splitMode = updated.split && updated.split.mode || 'equal';
  state.splitPlayers = updated.split && Array.isArray(updated.split.players)
    ? updated.split.players
    : state.splitPlayers;
}
