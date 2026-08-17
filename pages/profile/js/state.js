import { showToast } from './toast.js';
import '../../../js/app-state/index.js';
import { matchCurrentShare } from '../../../js/app-state/core/utils.js';

export const store = window.MatchUpStore;

export let payingApplicationId = null;
export let requestedApplicationPoints = 0;
export let walletTopupAmount = 100000;
export let selectedTopupMethod = 'VNPay';
export let selectedWithdrawMethod = 'VNPay';

export function setPayingApplicationId(id) {
  payingApplicationId = id;
}

export function clearPayingApplicationId() {
  payingApplicationId = null;
}

export function setRequestedApplicationPoints(points) {
  requestedApplicationPoints = Math.max(0, Math.floor(points || 0));
}

export function setWalletTopupAmount(amount) {
  walletTopupAmount = Math.max(0, Math.floor(amount || 0));
}

export function setSelectedTopupMethod(method) {
  selectedTopupMethod = method;
}

export function setSelectedWithdrawMethod(method) {
  selectedWithdrawMethod = method;
}

export function getCurrentApplication() {
  return store.getApplications().find(item => item.id === payingApplicationId) || null;
}

export function getApplicationSubtotal() {
  const application = getCurrentApplication();
  if (!application || !application.match) return 0;
  const participants = Array.isArray(application.match.participants)
    ? application.match.participants
    : [];
  return matchCurrentShare(application.match, participants.length);
}

export function notify(message) {
  showToast(message);
}

export function getRequestedApplicationPoints() {
  return requestedApplicationPoints;
}
