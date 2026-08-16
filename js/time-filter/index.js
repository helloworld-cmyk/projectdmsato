import { init } from './controller.js';
import { dateKey, dateLabel } from './dates.js';

const api = {
  init,
  dateKey,
  dateLabel
};

if (typeof window !== 'undefined') {
  window.MatchUpTimeFilter = api;
}

export {
  init,
  dateKey,
  dateLabel
};
