import { renderBooking } from './booking.js';
import { renderSplit } from './split.js';
import { renderJoinRules } from '../booking/booking.js';
import { syncReviewAction } from '../features/journey.js';

export function renderAll() {
  renderBooking();
  renderSplit();
  renderJoinRules();
  syncReviewAction();
}
