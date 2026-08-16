import { query, state } from './core/state.js';
import { injectDynamicUi } from './core/dom.js';
import { initEvents } from './features/events.js';
import { openFeedback } from './features/feedback.js';
import { openPayment } from './features/payment.js';
import { renderAll } from './render/index.js';
import { renderBooking } from './render/booking.js';
import { syncReviewAction } from './features/journey.js';

injectDynamicUi();
initEvents();
renderAll();
setInterval(syncReviewAction, 250);
setInterval(renderBooking, 1000);

if (query.get('pay') === '1' && state.booking) {
  renderAll();
  setTimeout(openPayment, 0);
}
if (query.get('feedback') === '1' && state.booking) {
  renderAll();
  openFeedback();
}
