import { store } from '../state.js';
import { escape } from '../utils.js';

export function renderProfile() {
  const profile = store.getProfile();
  
  document.querySelector('#profile-name').textContent = profile.name;
  document.querySelector('#profile-initials').textContent = profile.initials;
  document.querySelector('#profile-name-input').value = profile.name;
  document.querySelector('#profile-level').value = profile.level;
  document.querySelector('#profile-radius').value = String(profile.radius);
  document.querySelector('#profile-availability').value = profile.availability || '';
  
  document.querySelectorAll('.sport-choice input').forEach(input => {
    const selected = profile.sports.includes(input.value);
    input.checked = selected;
    input.closest('.sport-choice')?.classList.toggle('is-selected', selected);
  });
}