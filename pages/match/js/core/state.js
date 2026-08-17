import {
  DISTANCE_MAX,
  DISTANCE_MIN,
  PRICE_MAX,
  PRICE_MIN,
  requestedDate,
  requestedLocation,
  requestedSport,
  requestedTimeRange,
  requestedTimeScope,
  store
} from './constants.js';

export const state = {
  sport: requestedSport,
  time: requestedTimeScope === 'custom' && requestedDate
    ? `date:${requestedDate}`
    : requestedTimeScope,
  timeRange: requestedTimeRange,
  level: 'all',
  quality: 'all',
  priceMin: PRICE_MIN,
  priceMax: PRICE_MAX,
  distanceMin: DISTANCE_MIN,
  distanceMax: DISTANCE_MAX,
  sort: 'recommended'
};

export const dom = {
  grid: document.querySelector('#match-grid'),
  empty: document.querySelector('.empty'),
  distanceMinInput: document.querySelector('#distance-min'),
  distanceMaxInput: document.querySelector('#distance-max'),
  distanceSlider: document.querySelector('#distance-slider'),
  distanceMinLabel: document.querySelector('#distance-min-label'),
  distanceMaxLabel: document.querySelector('#distance-max-label'),
  detailsModal: document.querySelector('#details-modal'),
  detailContent: document.querySelector('#detail-content'),
  matchPaymentModal: document.querySelector('#match-payment-modal'),
  matchFeedbackModal: document.querySelector('#match-feedback-modal'),
  teamMoment: document.querySelector('#team-moment-modal'),
  createFlow: document.querySelector('#create-flow'),
  createCourtPicker: document.querySelector('#create-court-picker'),
  createFormCard: document.querySelector('#create-form-card'),
  createSelectedBooking: document.querySelector('#create-selected-booking'),
  createFormElement: document.querySelector('#create-match-form')
};

export let payingApplicationId = null;
export let requestedJoinPoints = 0;
export let matchFeedbackRating = 5;
export let matchFeedbackTags = new Set(['Đồng đội vui']);
export let teamMatch = null;
export let teamApplication = null;

export function setPayingApplicationId(value) {
  payingApplicationId = value;
}

export function setRequestedJoinPoints(value) {
  requestedJoinPoints = Math.max(0, Math.floor(Number(value) || 0));
}

export function setMatchFeedbackRating(value) {
  matchFeedbackRating = value;
}

export function toggleMatchFeedbackTag(value) {
  if (matchFeedbackTags.has(value)) {
    matchFeedbackTags.delete(value);
  } else {
    matchFeedbackTags.add(value);
  }
}

export function resetMatchFeedback() {
  matchFeedbackRating = 5;
  matchFeedbackTags = new Set(['Đồng đội vui']);
}

export function setTeamState(match, application) {
  teamMatch = match;
  teamApplication = application;
}

export { DISTANCE_MAX, DISTANCE_MIN, PRICE_MAX, PRICE_MIN, requestedLocation, store };
