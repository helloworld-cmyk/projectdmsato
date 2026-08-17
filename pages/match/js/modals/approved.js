import { store } from '../core/state.js';
import { findMatch } from '../match-list/filters.js';
import { openDetails } from '../match-list/details.js';
import { openJoinPayment } from './payment.js';
import { safe } from '../core/utils.js';

const banner = document.querySelector('#host-approved-banner');
const message = document.querySelector('#host-approved-message');
const action = document.querySelector('#host-approved-action');
let hideTimer;

export function hideHostApprovedBanner() {
  clearTimeout(hideTimer);
  banner.classList.remove('show');
}

export function showHostApprovedBanner(application) {
  if (!application || !application.match) return;
  const match = findMatch(application.matchId) || application.match;
  const paymentPending = application.status === 'payment_pending';
  message.textContent = `${safe(match.name)} · ${safe(match.time)} · ${safe(match.venue)}`;
  action.textContent = paymentPending
    ? 'Thanh toán để chốt chỗ'
    : 'Xem kèo ngay';
  action.dataset.applicationId = application.id;
  banner.classList.add('show');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideHostApprovedBanner, 8000);
}

export function initHostApprovedBanner() {
  document.querySelector('#close-host-approved').addEventListener('click', hideHostApprovedBanner);
  action.addEventListener('click', () => {
    const application = store.getApplications().find(
      item => item.id === action.dataset.applicationId
    );
    if (!application) {
      hideHostApprovedBanner();
      return;
    }
    const match = findMatch(application.matchId) || application.match;
    hideHostApprovedBanner();
    if (application.status === 'payment_pending') {
      openJoinPayment(application.id);
    } else if (match) {
      openDetails(match);
    }
  });
}
