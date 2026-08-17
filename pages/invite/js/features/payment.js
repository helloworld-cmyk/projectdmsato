import {
  matchApplication,
  matchInvite,
  matchInviteMode,
  profile,
  state,
  store,
  ownSplitPlayer,
  refreshMatchInvite
} from '../core/state.js';
import { $ } from '../core/dom.js';
import { isBalanced, matchModePayableSubtotal } from '../booking/booking.js';
import { format } from '../core/utils.js';
import { showToast } from '../core/toast.js';
import { renderAll } from '../render/index.js';
import { subjectKey } from '../../../../js/app-state/core/utils.js';

const paymentModal = $('#payment-modal');

function isCustomOwner() {
  if (!matchInvite || !matchInvite.custom) return false;
  const participants = Array.isArray(matchInvite.participants)
    ? matchInvite.participants
    : [];
  const first = participants[0];
  return Boolean(first && subjectKey(first.name) === subjectKey(profile.name));
}

function currentPreview() {
  if (matchInviteMode) {
    return store.previewPoints(matchModePayableSubtotal(), state.requestedBookingPoints);
  }
  if (state.booking) {
    return store.previewBookingPoints(state.booking.id, state.requestedBookingPoints);
  }
  return store.previewPoints(state.total, state.requestedBookingPoints);
}

function payableOf(preview) {
  return preview && (preview.ownerAmount === undefined
    ? preview.paidAmount
    : preview.ownerAmount) || 0;
}

function bookingPaymentFailure() {
  if (state.booking && ['expired', 'cancelled'].includes(state.booking.status)) {
    return 'Lịch sân không còn hiệu lực (đã hết hạn hoặc đã bị hủy).';
  }
  if (state.booking && state.booking.ownerPaid) {
    return 'Lịch sân này đã được thanh toán rồi.';
  }
  const preview = currentPreview();
  if (store.getWallet().balance < payableOf(preview)) {
    return 'Số dư ví MatchUp không đủ để thanh toán.';
  }
  if (preview && state.requestedBookingPoints > preview.maxPoints) {
    return 'Số điểm yêu cầu vượt mức cho phép.';
  }
  return 'Trạng thái lịch sân đã thay đổi. Hãy thử lại.';
}

function matchPaymentFailure() {
  const own = ownSplitPlayer();
  if (own && own.paid) {
    return 'Phần của bạn đã được thanh toán rồi.';
  }
  if (matchInvite && matchInvite.status === 'cancelled') {
    return 'Kèo đã bị hủy, không thể thanh toán.';
  }
  const preview = currentPreview();
  if (store.getWallet().balance < payableOf(preview)) {
    return 'Số dư ví MatchUp không đủ để thanh toán.';
  }
  if (preview && state.requestedBookingPoints > preview.maxPoints) {
    return 'Số điểm yêu cầu vượt mức cho phép.';
  }
  return 'Trạng thái kèo đã thay đổi. Hãy thử lại.';
}

export function renderBookingPayment() {
  const preview = currentPreview();
  if (!preview) return;
  state.requestedBookingPoints = preview.points;
  $('#booking-points').value = preview.points || '';
  $('#booking-points').max = preview.maxPoints;
  $('#booking-point-balance').textContent = `Bạn có ${preview.availablePoints}`
    + ` điểm · tối đa ${preview.maxPoints}`;
  $('#booking-wallet-balance').textContent = `Số dư ${format(
    store.getWallet().balance
  )}`;
  $('#booking-subtotal').textContent = format(preview.subtotal);
  $('#booking-discount').textContent = `−${format(preview.discount)}`;
  const payable = preview.ownerAmount === undefined
    ? preview.paidAmount
    : preview.ownerAmount;
  $('#booking-payable').textContent = format(payable);
  $('#modal-amount').textContent = format(payable);
  const amountNode = $('#modal-pay-amount');
  if (amountNode) amountNode.textContent = format(payable);
  const insufficient = store.getWallet().balance < payable;
  const confirm = $('#confirm-payment');
  confirm.disabled = insufficient;
  confirm.innerHTML = insufficient
    ? 'Ví không đủ số dư — hãy nạp thêm'
    : `Thanh toán <span id="modal-pay-amount">${format(payable)}</span>`
      + ` từ Ví MatchUp`;
}

export function openPayment() {
  const own = ownSplitPlayer();
  if (own && own.paid) {
    showToast('Phần của bạn đã được thanh toán.');
    return;
  }
  if (state.splitMode === 'custom' && !isBalanced()) {
    showToast('Tổng phần tiền phải khớp tổng đơn trước khi thanh toán.');
    return;
  }
  if (state.booking && ['expired', 'cancelled'].includes(state.booking.status)) {
    showToast('Lịch sân này không còn hiệu lực.');
    return;
  }
  state.requestedBookingPoints = 0;
  renderBookingPayment();
  paymentModal.classList.add('show');
}

export function closePayment() {
  paymentModal.classList.remove('show');
}

function confirmMatchPayment() {
  let result = null;
  if (
    matchApplication
    && ['accepted', 'payment_pending'].includes(matchApplication.status)
    && matchApplication.paymentStatus !== 'paid'
  ) {
    result = store.payForApplication(
      matchApplication.id,
      state.requestedBookingPoints
    );
  } else if (matchInvite && matchInvite.custom && isCustomOwner()) {
    result = store.payForMatchOwner(
      matchInvite.id,
      state.requestedBookingPoints
    );
  } else {
    showToast('Kèo này chưa có khoản thanh toán dành cho bạn.');
    return;
  }
  if (!result) {
    showToast(matchPaymentFailure());
    renderBookingPayment();
    return;
  }
  refreshMatchInvite();
  closePayment();
  renderAll();
  showToast(`Thanh toán thành công từ Ví MatchUp, tích `
    + `${result.payment && result.payment.earnedPoints || 0} điểm.`);
}

function confirmPayment() {
  if (state.splitMode === 'custom' && !isBalanced()) {
    showToast('Tổng phần tiền chưa khớp, chưa thể thanh toán.');
    return;
  }
  if (matchInviteMode) {
    confirmMatchPayment();
    return;
  }
  const result = state.booking
    ? store.payForBooking(
      state.booking.id,
      state.requestedBookingPoints
    )
    : null;
  if (!result) {
    showToast(bookingPaymentFailure());
    renderBookingPayment();
    return;
  }
  state.booking = result;
  state.splitMode = result.split.mode;
  state.splitPlayers = result.split.players;
  closePayment();
  renderAll();
  showToast(`Thanh toán thành công từ Ví MatchUp, tích `
    + `${result.payment.earnedPoints} điểm.`);
}

export function initPaymentEvents() {
  $('#open-payment').addEventListener('click', openPayment);
  $('#close-payment').addEventListener('click', closePayment);
  paymentModal.addEventListener('click', event => {
    if (event.target === paymentModal) closePayment();
  });
  $('#booking-points').addEventListener('input', event => {
    state.requestedBookingPoints = Math.max(
      0,
      Math.floor(Number(event.target.value) || 0)
    );
    renderBookingPayment();
  });
  $('#booking-use-max').addEventListener('click', () => {
    const preview = matchInviteMode
      ? store.previewPoints(matchModePayableSubtotal(), 0)
      : state.booking
        ? store.previewBookingPoints(state.booking.id, 0)
        : store.previewPoints(state.total, 0);
    state.requestedBookingPoints = preview ? preview.maxPoints : 0;
    renderBookingPayment();
  });
  $('#confirm-payment').addEventListener('click', confirmPayment);
}
