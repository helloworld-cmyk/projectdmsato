import { requestedLocation } from './core/constants.js';
import { store } from './core/state.js';
import { initToast } from './core/toast.js';
import { initFilters, renderMatches, syncDistanceRange } from './match-list/filters.js';
import { initPaymentEvents } from './modals/payment.js';
import { initCreateFlow } from './create/create.js';
import { initFeedbackEvents, renderMatchReputation } from './modals/feedback.js';
import { handleQueryActions, initEvents } from './events.js';

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
syncDistanceRange();
renderMatches();
handleQueryActions();

const syncAutoApproval = () => store.autoApproveApplications?.(10000);
setInterval(syncAutoApproval, 1000);
syncAutoApproval();
setInterval(renderMatchReputation, 500);
