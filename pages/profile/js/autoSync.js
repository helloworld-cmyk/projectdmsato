import { store } from './state.js';
import { renderAll } from './render.js';
import { AUTO_APPROVE_DELAY, RENDER_INTERVAL } from './constants.js';

export function syncAutoApproval() {
  if (store.autoApproveApplications) {
    store.autoApproveApplications(AUTO_APPROVE_DELAY);
  }
}

export function startAutoSync() {
  // Listen for state changes
  document.addEventListener('matchup:state-change', () => {
    syncAutoApproval();
    renderAll();
  });
  
  // Periodic sync
  setInterval(() => {
    syncAutoApproval();
    renderAll();
  }, RENDER_INTERVAL);
  
  // Initial sync
  syncAutoApproval();
}