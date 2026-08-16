import { store } from '../state.js';
import { escape } from '../utils.js';

export function renderPlayStats() {
  const state = store.getState();
  const journeys = store.getJourneys();
  const feedback = store.getFeedback();
  
  const completed = journeys.filter(item => item.status === 'completed').length;
  
  document.querySelector('#completed-count').textContent = completed;
  document.querySelector('#feedback-count').textContent = feedback.length;
  document.querySelector('#waitlist-count').textContent = state.waitlists.filter(item => item.status === 'active').length;
  document.querySelector('#streak-copy').textContent = `${state.profile.streak || 0} trận đã chơi`;
  
  const badgeRow = document.querySelector('#badge-row');
  if (state.profile.badges.length) {
    badgeRow.innerHTML = state.profile.badges.slice(0, 4).map(badge => `
      <span class="profile-badge">
        <span class="material-symbols-rounded" style="font-size:12px">verified</span> ${escape(badge)}
      </span>
    `).join('');
  } else {
    badgeRow.innerHTML = '<span class="profile-badge" style="color:#7d8a81;background:#f1f4f1">Hoàn thành một trận để nhận huy hiệu đầu tiên</span>';
  }
}