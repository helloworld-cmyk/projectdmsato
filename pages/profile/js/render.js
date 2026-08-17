import { store } from './state.js';
import { renderMembership } from './components/membership.js';
import { renderLoyalty } from './components/loyalty.js';
import { renderWallet } from './components/wallet.js';
import { renderPlayStats } from './components/playStats.js';
import { renderReputation } from './components/reputation.js';
import { renderSavedMatches } from './components/savedMatches.js';
import { renderApplications } from './components/applications.js';
import { renderBookings } from './components/bookings.js';
import { renderProfile } from './components/profile.js';

export function render() {
  const applications = store.getApplications();
  const createdMatches = store.getCustomMatches();
  const savedMatches = store.getSavedMatchRecords();
  const bookings = store.getBookings();
  const activeBookings = bookings.filter(item => ['held', 'confirmed'].includes(item.status));
  
  // Update counters
  document.querySelector('#pending-count').textContent = applications.filter(item => ['pending', 'payment_pending'].includes(item.status)).length;
  document.querySelector('#confirmed-count').textContent = applications.filter(item => ['accepted', 'paid'].includes(item.status)).length + createdMatches.filter(item => item.status === 'open').length;
  document.querySelector('#booking-count').textContent = activeBookings.length;
  document.querySelector('#match-total-label').textContent = `${applications.length + createdMatches.length} mục`;
  document.querySelector('#saved-match-total-label').textContent = `${savedMatches.length} mục`;
  document.querySelector('#booking-total-label').textContent = `${bookings.length} mục`;
  
  // Render all sections
  renderSavedMatches();
  renderApplications();
  renderBookings();
}

export function renderAll() {
  renderProfile();
  renderMembership();
  renderLoyalty();
  renderWallet();
  renderPlayStats();
  renderReputation();
  render();
}