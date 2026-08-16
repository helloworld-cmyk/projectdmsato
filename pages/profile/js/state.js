import { showToast } from './toast.js';
import '../../../js/app-state/index.js';

export const store = window.MatchUpStore;

export let payingApplicationId = null;
export let requestedApplicationPoints = 0;
export let selectedApplicationMethod = 'VietQR';
export let walletTopupAmount = 100000;

export function setPayingApplicationId(id) {
  payingApplicationId = id;
}

export function clearPayingApplicationId() {
  payingApplicationId = null;
}

export function setRequestedApplicationPoints(points) {
  requestedApplicationPoints = Math.max(0, Math.floor(points || 0));
}

export function setSelectedApplicationMethod(method) {
  selectedApplicationMethod = method;
}

export function setWalletTopupAmount(amount) {
  walletTopupAmount = Math.max(0, Math.floor(amount || 0));
}

export function getCurrentApplication() {
  return store.getApplications().find(item => item.id === payingApplicationId) || null;
}

export function getApplicationSubtotal() {
  const application = getCurrentApplication();
  return application ? Number(application.match.deposit || application.match.share / 2) || 0 : 0;
}

export function notify(message) {
  showToast(message);
}

export function getSelectedApplicationMethod() {
  return selectedApplicationMethod;
}

export function getRequestedApplicationPoints() {
  return requestedApplicationPoints;
}
