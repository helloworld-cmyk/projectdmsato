import { store } from '../state.js';
import { formatMoney, escape } from '../utils.js';
import { 
  getCurrentApplication, 
  getApplicationSubtotal, 
  setRequestedApplicationPoints,
  getRequestedApplicationPoints,
  clearPayingApplicationId,
  setPayingApplicationId,
  notify
} from '../state.js';
import { render } from '../render.js';

export function renderApplicationPayment() {
  const application = getCurrentApplication();
  if (!application) return;
  
  const subtotal = getApplicationSubtotal();
  const requestedPoints = getRequestedApplicationPoints();
  const preview = store.previewPoints(subtotal, requestedPoints);
  
  document.querySelector('#application-points').value = preview.points || '';
  document.querySelector('#application-points').max = preview.maxPoints;
  document.querySelector('#application-point-balance').textContent = `Bạn có ${preview.availablePoints} điểm · tối đa ${preview.maxPoints}`;
  document.querySelector('#application-subtotal').textContent = formatMoney(preview.subtotal);
  document.querySelector('#application-discount').textContent = `−${formatMoney(preview.discount)}`;
  document.querySelector('#application-paid-total').textContent = formatMoney(preview.paidAmount);
  
  const wallet = store.getWallet();
  const insufficient = wallet.balance < preview.paidAmount;
  const button = document.querySelector('#confirm-application-payment');
  
  button.disabled = insufficient;
  button.textContent = insufficient 
    ? 'Ví không đủ số dư — hãy nạp thêm' 
    : `Thanh toán ${formatMoney(preview.paidAmount)} từ Ví MatchUp`;
}

export function openApplicationPayment(applicationId) {
  setPayingApplicationId(applicationId);
  setRequestedApplicationPoints(0);
  renderApplicationPayment();
  document.querySelector('#application-payment-modal').classList.add('show');
}

export function closeApplicationPayment() {
  document.querySelector('#application-payment-modal').classList.remove('show');
  clearPayingApplicationId();
  setRequestedApplicationPoints(0);
}

export function initApplicationPaymentModal() {
  // Points input
  document.querySelector('#application-points').addEventListener('input', (event) => {
    setRequestedApplicationPoints(event.target.value);
    renderApplicationPayment();
  });
  
  // Use max points
  document.querySelector('#application-use-max').addEventListener('click', () => {
    const subtotal = getApplicationSubtotal();
    const maxPoints = store.previewPoints(subtotal, 0).maxPoints;
    setRequestedApplicationPoints(maxPoints);
    renderApplicationPayment();
  });
  
  // Payment method selection
  document.querySelectorAll('[data-application-method]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-application-method]').forEach(item => {
        item.classList.toggle('active', item === button);
      });
    });
  });
  
  // Close buttons
  document.querySelector('#close-application-payment').addEventListener('click', closeApplicationPayment);
  document.querySelector('#application-payment-modal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeApplicationPayment();
  });
  
  // Confirm payment
  document.querySelector('#confirm-application-payment').addEventListener('click', () => {
    const application = getCurrentApplication();
    if (!application) {
      closeApplicationPayment();
      return;
    }
    
    const points = getRequestedApplicationPoints();
    const result = store.payForApplication(
      application.id, 
      points
    );
    
    if (!result) {
      notify('Số dư ví không đủ hoặc trạng thái kèo đã thay đổi. Hãy thử lại.');
      renderApplicationPayment();
      return;
    }
    
    closeApplicationPayment();
    render();
    notify(`Đã thanh toán từ Ví MatchUp, tích ${result.payment.earnedPoints} điểm.`);
  });
}