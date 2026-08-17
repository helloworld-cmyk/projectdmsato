import { requestedLocation } from './core/constants.js';
import { store } from './core/state.js';
import { initToast } from './core/toast.js';
import { initFilters, renderMatches, syncDistanceRange } from './match-list/filters.js';
import { initPaymentEvents } from './modals/payment.js';
import { initCreateFlow } from './create/create.js';
import { initFeedbackEvents, renderMatchReputation } from './modals/feedback.js';
import { handleQueryActions, initEvents } from './events.js';
import { initHostApprovedBanner, showHostApprovedBanner } from './modals/approved.js';

if (requestedLocation) {
  document.querySelectorAll('[data-user-location]').forEach(element => {
    element.textContent = requestedLocation;
  });
}

initToast();
initFilters();
initPaymentEvents();
initCreateFlow();
initFeedbackEvents();
initEvents();
initHostApprovedBanner();
syncDistanceRange();
renderMatches();
handleQueryActions();

const syncAutoApproval = () => {
  const autoApproved = store.autoApproveApplications?.(10000) || [];
  const hostApproved = store.getApplications()
    .filter(application => (
      application.status === 'pending'
      && application.approvalEligible
      && application.match?.demoHostApproval
      && Date.now() - Number(application.createdAt) >= 10000
    ))
    .map(application => store.updateApplicationStatus(application.id, 'accepted'))
    .filter(Boolean);
  [...autoApproved, ...hostApproved]
    .filter(application => ['accepted', 'payment_pending'].includes(application.status))
    .forEach(showHostApprovedBanner);
  renderMatches();
};
setInterval(syncAutoApproval, 1000);
syncAutoApproval();
setInterval(renderMatchReputation, 500);
