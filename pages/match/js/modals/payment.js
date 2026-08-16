import {
  dom,
  requestedJoinPoints,
  selectedJoinMethod,
  setPayingApplicationId,
  setRequestedJoinPoints,
  setSelectedJoinMethod,
  store,
  payingApplicationId
} from '../core/state.js';
import { findMatch, renderMatches } from '../match-list/filters.js';
import { openTeamMoment } from './team.js';
import { money } from '../core/utils.js';
import { showToast } from '../core/toast.js';

export function currentJoinApplication() {
  return store.getApplications().find(
    application => application.id === payingApplicationId
  ) || null;
}

export function renderJoinPayment() {
  const application = currentJoinApplication();
  if (!application) return;
  const subtotal = Number(application.match.deposit || application.match.share / 2) || 0;
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
  const insufficient = selectedJoinMethod === 'Ví MatchUp'
    && store.getWallet().balance < preview.paidAmount;
  const button = document.querySelector('#confirm-match-payment');
  button.disabled = insufficient;
  button.textContent = insufficient
    ? 'Ví không đủ số dư — hãy nạp thêm'
    : `Thanh toán ${money(preview.paidAmount)} qua ${selectedJoinMethod}`;
}

export function openJoinPayment(applicationId) {
  setPayingApplicationId(applicationId);
  setRequestedJoinPoints(0);
  setSelectedJoinMethod('VietQR');
  document.querySelectorAll('[data-join-method]').forEach(button => {
    const active = button.dataset.joinMethod === selectedJoinMethod;
    button.classList.toggle('active', active);
    button.querySelector('.check').textContent = active ? 'check_circle' : '';
  });
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
  document.querySelectorAll('[data-join-method]').forEach(button => {
    button.addEventListener('click', () => {
      setSelectedJoinMethod(button.dataset.joinMethod);
      document.querySelectorAll('[data-join-method]').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.querySelector('.check').textContent = active ? 'check_circle' : '';
      });
      renderJoinPayment();
    });
  });
  document.querySelector('#match-payment-points-input').addEventListener(
    'input',
    event => {
      setRequestedJoinPoints(event.target.value);
      renderJoinPayment();
    }
  );
  document.querySelector('#match-payment-use-max').addEventListener('click', () => {
    const application = currentJoinApplication();
    if (!application) return;
    const subtotal = Number(application.match.deposit || application.match.share / 2) || 0;
    setRequestedJoinPoints(store.previewPoints(subtotal, 0).maxPoints);
    renderJoinPayment();
  });
  document.querySelector('#confirm-match-payment').addEventListener('click', () => {
    const application = currentJoinApplication();
    if (!application) return;
    const result = store.payForApplication(
      application.id,
      selectedJoinMethod,
      requestedJoinPoints
    );
    if (!result) {
      showToast(selectedJoinMethod === 'Ví MatchUp'
        ? 'Số dư ví không đủ hoặc trạng thái kèo đã thay đổi.'
        : 'Trạng thái kèo hoặc điểm đã thay đổi.');
      renderJoinPayment();
      return;
    }
    closeJoinPayment();
    const item = findMatch(result.matchId) || result.match;
    renderMatches();
    openTeamMoment(item, result);
    showToast(
      `Đã thanh toán cọc ${money(result.payment.paidAmount)} qua ${selectedJoinMethod}.`
    );
  });
}
