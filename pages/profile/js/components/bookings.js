import { store } from '../state.js';
import { formatMoney, escape, countdown, getStatusCopy } from '../utils.js';
import { notify } from '../state.js';
import { renderWallet } from './wallet.js';
import { renderPlayStats } from './playStats.js';
import { render } from '../render.js';

export function renderBookings() {
  const bookings = store.getBookings();
  const list = document.querySelector('#bookings-list');
  
  list.innerHTML = bookings.length
    ? bookings.map(item => {
        const canReview = store.canSubmitReputationReview('booking', item.id);
        const reviewAction = canReview
          ? `<a class="action primary" href="../invite/?booking=${encodeURIComponent(item.id)}&feedback=1">Đánh giá</a>`
          : '<span class="action" aria-disabled="true">Đã đánh giá</span>';
        
        let actions = '';
        if (item.status === 'held') {
          actions = `
            ${reviewAction}
            <button class="action" data-booking-action="confirm" data-id="${item.id}">Xác nhận</button>
            <a class="action" href="../invite/?booking=${item.id}">Mời đội</a>
            <button class="action" data-booking-action="cancel" data-id="${item.id}">Hủy</button>
          `;
        } else if (item.status === 'confirmed') {
          if (item.ownerPaid) {
            actions = `
              ${reviewAction}
              <button class="action" data-booking-action="finish" data-id="${item.id}">Kết trận</button>
              <button class="action" data-booking-action="cancel" data-id="${item.id}">Hủy lịch</button>
            `;
          } else {
            actions = `
              ${reviewAction}
              <a class="action" href="../invite/?booking=${item.id}">Mời đội / chia tiền</a>
              <button class="action" data-booking-action="cancel" data-id="${item.id}">Hủy lịch</button>
            `;
          }
        } else if (item.status === 'expired') {
          actions = `<a class="action" href="../booking/">Đặt lại</a>`;
        }
        
        let journeyText = '';
        if (item.status === 'held') {
          journeyText = 'Đã giữ sân · chờ xác nhận';
        } else if (item.status === 'confirmed' && !item.ownerPaid) {
          journeyText = 'Đã xác nhận · chờ chia tiền';
        } else if (item.ownerPaid) {
          journeyText = 'Sẵn sàng ra sân';
        } else {
          journeyText = 'Đã cập nhật';
        }
        
        return `
          <article class="activity">
            <div class="activity-icon">🏟️</div>
            <div class="activity-copy">
              <h4>${escape(item.court)}</h4>
              <p>${escape(item.date)}, ${escape(item.time)} · 90 phút · ${formatMoney(item.total)}</p>
              <div class="journey-mini"><strong>Hành trình:</strong> ${journeyText}</div>
              <b class="status ${item.status}">${item.status === 'held' ? `Giữ chỗ còn ${countdown(item, store)}` : getStatusCopy(item.status)}</b>
            </div>
            <div class="actions">${actions}</div>
          </article>
        `;
      }).join('')
    : '<div class="empty"><span class="material-symbols-rounded">stadium</span>Bạn chưa có lịch sân nào.<br /><a href="../booking/" style="color:#1e7049;font-weight:800">Tìm sân gần bạn</a></div>';
  
  // Attach event listeners for bookings
  list.querySelectorAll('[data-booking-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.bookingAction;
      
      if (action === 'finish') {
        store.completeJourney('booking', button.dataset.id);
        location.href = `../invite/?booking=${encodeURIComponent(button.dataset.id)}&feedback=1`;
        return;
      }
      
      const result = action === 'confirm'
        ? store.confirmBooking(button.dataset.id)
        : store.cancelBooking(button.dataset.id);
      
      notify(result ? (action === 'confirm' ? 'Đã xác nhận lịch sân.' : 'Đã hủy lịch sân.') : 'Lịch sân này không thể cập nhật.');
      render();
      renderPlayStats();
      renderWallet();
    });
  });
}