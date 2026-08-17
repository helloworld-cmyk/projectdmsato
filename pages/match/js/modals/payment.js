import {
  dom,
  requestedJoinPoints,
  setPayingApplicationId,
  setRequestedJoinPoints,
  store,
  payingApplicationId
} from '../core/state.js';
import { findMatch, renderMatches } from '../match-list/filters.js';
import { openTeamMoment } from './team.js';
import { money } from '../core/utils.js';
import { matchCurrentShare } from '../../../../js/app-state/core/utils.js';
import { showToast } from '../core/toast.js';

export function currentJoinApplication() {
  return store.getApplications().find(
    application => application.id === payingApplicationId
  ) || null;
}

function currentJoinSubtotal() {
  const application = currentJoinApplication();
  if (!application || !application.match) return 0;
  const participants = Array.isArray(application.match.participants)
    ? application.match.participants
    : [];
  return matchCurrentShare(application.match, participants.length);
}

export function renderJoinPayment() {
  const application = currentJoinApplication();
  if (!application) return;
  const subtotal = currentJoinSubtotal();
  const preview = store.previewPoints(subtotal, requestedJoinPoints);
  setRequestedJoinPoints(preview.points);
  document.querySelector('#match-payment-name').textContent = application.match.name;
  document.querySelector('#match-payment-subtotal').textContent = money(preview.subtotal);
  document.querySelector('#match-payment-total').textContent = money(preview.paidAmount);
  document.querySelector('#match-payment-points-input').value = preview.points || '';
  document.querySelector('#match-payment-point-balance').textContent =
    `Bạn có ${preview.availablePoints} điểm · tối đa ${preview.maxPoints}`;
  document.querySelector('#match-payment-wallet').textContent =
    `Số dư ${money(store.getWallet().balance)}`;
  const insufficient = store.getWallet().balance < preview.paidAmount;
  const button = document.querySelector('#confirm-match-payment');
  button.disabled = insufficient;
  button.textContent = insufficient
    ? 'Ví không đủ số dư — hãy nạp thêm'
    : `Thanh toán ${money(preview.paidAmount)} từ Ví MatchUp`;
}

export function openJoinPayment(applicationId) {
  setPayingApplicationId(applicationId);
  setRequestedJoinPoints(0);
  dom.teamMoment.classList.remove('show');
  renderJoinPayment();
  dom.matchPaymentModal.classList.add('show');
}

export function closeJoinPayment() {
  dom.matchPaymentModal.classList.remove('show');
  setPayingApplicationId(null);
  setRequestedJoinPoints(0);
}

export function goToApplicationPayment(applicationId) {
  if (applicationId) openJoinPayment(applicationId);
}

export function initPaymentEvents() {
  document.querySelector('#close-match-payment').addEventListener(
    'click',
    closeJoinPayment
  );
  dom.matchPaymentModal.addEventListener('click', event => {
    if (event.target === dom.matchPaymentModal) closeJoinPayment();
  });
  document.querySelector('#match-payment-points-input').addEventListener(
    'input',
    event => {
      setRequestedJoinPoints(event.target.value);
      renderJoinPayment();
    }
  );
  document.querySelector('#match-payment-use-max').addEventListener('click', () => {
    if (!currentJoinApplication()) return;
    const subtotal = currentJoinSubtotal();
    setRequestedJoinPoints(store.previewPoints(subtotal, 0).maxPoints);
    renderJoinPayment();
  });
  document.querySelector('#confirm-match-payment').addEventListener('click', () => {
    const application = currentJoinApplication();
    if (!application) return;
    const result = store.payForApplication(
      application.id,
      requestedJoinPoints
    );
    if (!result) {
      showToast('Số dư ví không đủ hoặc trạng thái kèo đã thay đổi.');
      renderJoinPayment();
      return;
    }
    closeJoinPayment();
    const item = findMatch(result.matchId) || result.match;
    renderMatches();
    openTeamMoment(item, result);
    showToast(
      `Đã thanh toán ${money(result.payment.paidAmount)} từ Ví MatchUp.`
    );
  });
}
