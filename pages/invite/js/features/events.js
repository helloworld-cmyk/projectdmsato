import {
  matchInvite,
  matchInviteMode,
  state,
  store,
  refreshMatchInvite,
  syncBookingRoster
} from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import {
  bookingTeamSize,
  collectJoinRules,
  equalise,
  notifyRefund,
  saveSplit,
  scheduleSharedPlayer,
  refreshBookingFromStore
} from '../booking/booking.js';
import { showToast } from '../core/toast.js';
import { renderAll } from '../render/index.js';
import { renderBooking } from '../render/booking.js';
import { openFeedback, initFeedbackEvents } from './feedback.js';
import { initPaymentEvents, openPayment } from './payment.js';

export function initEvents() {
  initSplitEvents();
  initBookingRulesEvents();
  initPlayerEvents();
  initShareEvents();
  initJourneyEvents();
  initFeedbackEvents();
  initPaymentEvents();
  document.addEventListener('matchup:state-change', () => {
    refreshBookingFromStore();
    renderAll();
  });
}

function initSplitEvents() {
  $$('.split-tab').forEach(tab => tab.addEventListener('click', () => {
    state.splitMode = tab.dataset.mode;
    if (state.splitMode === 'equal') equalise();
    saveSplit();
    renderAll();
  }));
}

function initBookingRulesEvents() {
  $('#share-auto-approve').addEventListener('change', event => {
    $('#share-approval-criteria').hidden = !event.target.checked;
  });
  $('#booking-rules-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!state.booking) return;
    if (matchInviteMode) {
      if (!store.updateMatchRules(matchInvite.id, collectJoinRules())) return;
      refreshMatchInvite();
    } else {
      const updated = store.updateBookingRules(
        state.booking.id,
        collectJoinRules()
      );
      if (!updated) return;
      state.booking = updated;
    }
    renderAll();
    showToast('Đã lưu quy tắc tham gia cho kèo.');
  });
}

function initPlayerEvents() {
  $('#player-list').addEventListener('input', event => {
    const input = event.target.closest('[data-amount-index]');
    if (!input) return;
    state.splitPlayers[Number(input.dataset.amountIndex)].amount = Number(
      input.value
    ) || 0;
    saveSplit();
    renderAll();
  });
  $('#player-list').addEventListener('click', handlePlayerAction);
  $('#add-player').addEventListener('click', addPlayer);
}

function handlePlayerAction(event) {
  if (matchInviteMode) return;
  const approveButton = event.target.closest('[data-approve-player]');
  if (!approveButton || !state.booking) return;
  const updated = store.updateBookingPlayerStatus(
    state.booking.id,
    approveButton.dataset.approvePlayer,
    'approved'
  );
  if (updated) {
    syncBookingRoster(updated);
    renderAll();
    showToast('Đã duyệt người chơi vào đội.');
  } else {
    const current = store.getBooking(state.booking.id);
    const player = current && current.split && current.split.players
      ? current.split.players.find(item => item.id === approveButton.dataset.approvePlayer)
      : null;
    if (player && player.approvalNote && player.approvalNote.startsWith('Còn thiếu:')) {
      showToast(`Chưa thể duyệt: ${player.approvalNote}.`);
    } else {
      showToast('Chưa thể duyệt: người chơi cần thanh toán trước.');
    }
  }
}

function addPlayer() {
  if (state.splitPlayers.length >= bookingTeamSize()) {
    showToast(`Kèo đã đủ ${bookingTeamSize()} người.`);
    return;
  }
  const name = window.prompt('Tên người bạn muốn thêm vào kèo:');
  if (!name || !name.trim()) return;
  const trimmed = name.trim();
  const initials = trimmed.split(/\s+/).slice(-2)
    .map(part => part[0]).join('').toUpperCase();
  if (matchInviteMode) {
    const updated = store.addMatchPlayer(matchInvite.id, {
      id: store.getSubjectId('player', trimmed),
      name: trimmed,
      initials,
      role: 'Đã mời · Chờ tham gia'
    });
    if (!updated) {
      showToast('Người chơi này đã có trong kèo hoặc kèo đã đủ người.');
      return;
    }
    refreshMatchInvite();
    renderAll();
    showToast(`Đã thêm ${trimmed} vào kèo — hãy gửi link để họ xác nhận.`);
    notifyRefund();
    return;
  }
  const updated = store.addBookingPlayer(state.booking.id, {
    id: store.getSubjectId('player', trimmed),
    name: trimmed,
    initials
  });
  if (!updated) {
    showToast('Người chơi này đã có trong kèo hoặc kèo đã đủ người.');
    return;
  }
  syncBookingRoster(updated);
  renderAll();
  showToast(`Đã thêm ${trimmed} vào kèo — hãy gửi link để họ xác nhận.`);
}

function initShareEvents() {
  $('#copy-link').addEventListener('click', async () => {
    const link = $('#share-link').value;
    try {
      await navigator.clipboard.writeText(link);
      showToast('Đã sao chép link mời vào kèo!');
    } catch {
      $('#share-link').select();
      showToast('Hãy sao chép link mời này để gửi cho đội nhé.');
    }
    scheduleSharedPlayer(renderAll);
  });
  $('#share-link-button').addEventListener('click', shareLink);
}

async function shareLink() {
  const link = $('#share-link').value;
  let shared = false;
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Mời vào kèo MatchUp',
        text: 'Vào kèo và thanh toán phần của bạn nhé!',
        url: link
      });
      shared = true;
    } catch (_) {
      // The user may close the native share sheet.
    }
  } else {
    try {
      await navigator.clipboard.writeText(link);
      showToast('Đã sao chép link để bạn gửi cho đội!');
      shared = true;
    } catch {
      showToast('Hãy sao chép link mời để chia sẻ nhé.');
      shared = true;
    }
  }
  if (shared) scheduleSharedPlayer(renderAll);
}

function initJourneyEvents() {
  $('#confirm-booking').addEventListener('click', confirmBooking);
  $('#journey-action').addEventListener('click', handleJourneyAction);
}

function confirmBooking() {
  if (!state.booking) return;
  const result = store.confirmBooking(state.booking.id);
  if (!result) {
    showToast('Giữ chỗ đã hết hạn, hãy chọn giờ khác.');
    return;
  }
  state.booking = result;
  renderAll();
  showToast('Đã xác nhận sân. Bây giờ bạn có thể mời đội!');
}

function handleJourneyAction(event) {
  const action = event.currentTarget.dataset.journeyAction;
  if (action === 'held') {
    $('#confirm-booking').click();
    return;
  }
  if (action === 'confirmed') {
    $('#share-link').focus();
    showToast('Hãy gửi link này cho đội để cùng sẵn sàng.');
    return;
  }
  if (action === 'team') {
    openPayment();
    return;
  }
  if (action === 'paid') {
    store.completeJourney('booking', state.booking.id);
    showToast('Tuyệt vời! Trận chơi đã được ghi nhận.');
    openFeedback();
    renderAll();
    return;
  }
  if (action === 'ready' || action === 'review') {
    openFeedback();
    return;
  }
  if (action === 'expired' || action === 'cancelled') {
    location.href = '../booking/';
  }
}
