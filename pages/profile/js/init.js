import { store } from './state.js';
import { initToast, showToast } from './toast.js';
import { initDOM } from './dom.js';
import { initApplicationPaymentModal } from './modals/applicationPayment.js';
import { initWalletTopupModal } from './modals/walletTopup.js';
import { initEventListeners } from './events.js';
import { startAutoSync } from './autoSync.js';
import { renderAll, render } from './render.js';

// Initialize toast
const toast = document.querySelector('.toast');
initToast(toast);

// Make showToast available globally for backward compatibility
window.showToast = showToast;

// Initialize DOM (inject cards and modals)
initDOM();

// Initialize modals
initApplicationPaymentModal();
initWalletTopupModal();

// Initialize event listeners
initEventListeners();

// Start auto sync
startAutoSync();

// Initial render
renderAll();

// Handle URL parameters for requested application
const profileQuery = new URLSearchParams(location.search);
const requestedApplicationId = profileQuery.get('application');
const requestedPayment = profileQuery.get('pay') === '1';

// Store these for later use
window.__requestedApplicationId = requestedApplicationId;
window.__requestedPayment = requestedPayment;

// Open requested application after initial render
setTimeout(() => {
  if (!requestedApplicationId) return;
  
  const application = store.getApplications().find(item => item.id === requestedApplicationId);
  const actionButton = [...document.querySelectorAll('[data-app-action]')].find(button => button.dataset.id === requestedApplicationId);
  
  actionButton?.closest('.activity')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  if (!application) {
    showToast('Không tìm thấy yêu cầu vào kèo này.');
    return;
  }
  
  if (requestedPayment && ['accepted', 'payment_pending'].includes(application.status)) {
    // openApplicationPayment will be available after modals init
    import('./modals/applicationPayment.js').then(module => {
      module.openApplicationPayment(application.id);
    });
    return;
  }
  
  if (requestedPayment && application.status === 'paid') {
    showToast('Bạn đã thanh toán cọc cho kèo này rồi.');
    return;
  }
  
  if (requestedPayment && application.status === 'pending' && application.paymentStatus === 'paid') {
    showToast('Bạn đã đóng cọc, đang chờ chủ kèo duyệt.');
    return;
  }
  
  if (requestedPayment && application.status === 'pending') {
    showToast('Yêu cầu đang chờ chủ kèo duyệt.');
  }
}, 0);