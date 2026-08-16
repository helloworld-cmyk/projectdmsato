import { store } from './state.js';
import { notify } from './state.js';
import { renderProfile } from './components/profile.js';
import { renderAll } from './render.js';

export function initEventListeners() {
  // Profile form submit
  document.querySelector('#profile-form').addEventListener('submit', (event) => {
    event.preventDefault();
    
    store.updateProfile({
      name: document.querySelector('#profile-name-input').value.trim() || 'Ngọc Anh',
      level: document.querySelector('#profile-level').value,
      radius: Number(document.querySelector('#profile-radius').value),
      sports: [...document.querySelectorAll('.sport-choice input:checked')].map(input => input.value),
      availability: document.querySelector('#profile-availability').value.trim() || 'Linh hoạt'
    });
    
    renderProfile();
    notify('Đã lưu hồ sơ và cập nhật gợi ý.');
  });
  
  // Sport choice toggle
  document.querySelectorAll('.sport-choice input').forEach(input => {
    input.addEventListener('change', () => {
      input.closest('.sport-choice')?.classList.toggle('is-selected', input.checked);
    });
  });
  
  // Reset demo
  document.querySelector('#reset-demo').addEventListener('click', () => {
    if (!confirm('Đặt lại toàn bộ dữ liệu trên web và quay về trạng thái lần đầu mở?')) return;
    store.resetDemo();
    renderAll();
    notify('Đã đặt lại dữ liệu. Trang sẽ tải lại như lần đầu mở web.');
    setTimeout(() => location.reload(), 450);
  });
}