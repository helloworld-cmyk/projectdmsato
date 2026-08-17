import { store } from '../state.js';
import { getSportIcon, getStatusCopy, formatMoney, escape, countdown } from '../utils.js';
import { notify } from '../state.js';
import { openApplicationPayment } from '../modals/applicationPayment.js';
import { render } from '../render.js';
import { renderPlayStats } from './playStats.js';

export function renderApplications() {
  const applications = store.getApplications();
  const createdMatches = store.getCustomMatches();
  const list = document.querySelector('#applications-list');
  
  const createdMarkup = createdMatches.map(item => `
    <article class="activity">
      <div class="activity-icon">${getSportIcon(item.sport, item.emoji)}</div>
      <div class="activity-copy">
        <h4>${escape(item.name)}</h4>
        <p>Chủ kèo · ${escape(item.time)} · ${escape(item.venue)} · còn ${item.available} chỗ</p>
        <b class="status ${item.status || 'open'}">${getStatusCopy(item.status || 'open')}</b>
      </div>
      <div class="actions">
        ${item.status !== 'cancelled' ? `
          <a class="action primary" href="../invite/?match=${encodeURIComponent(item.id)}">Xem kèo</a>
          <button class="action" data-created-action="cancel" data-id="${item.id}">Hủy kèo</button>
        ` : ''}
      </div>
    </article>
  `).join('');
  
  const applicationMarkup = applications.map(item => {
    const displayStatus = item.status === 'pending' && item.paymentStatus === 'paid' ? 'paid_pending_approval' : item.status;
    const pendingSeconds = item.match.joinRules?.autoApprove
      && item.approvalEligible
      ? Math.max(0, 10 - Math.floor(
        (Date.now() - (Number(item.createdAt) || Date.now())) / 1000
      ))
      : 0;
    
    let actions = '';
    if (item.status === 'payment_pending') {
      actions = `
        <a class="action" href="../invite/?match=${encodeURIComponent(item.matchId)}">Mời thêm</a>
        <button class="action primary" data-app-action="paid" data-id="${item.id}">Thanh toán cọc</button>
        <button class="action" data-app-action="cancelled" data-id="${item.id}">Hủy</button>
      `;
    } else if (item.status === 'pending') {
      actions = `
        <a class="action" href="../invite/?match=${encodeURIComponent(item.matchId)}">Mời thêm</a>
        <span class="action" aria-disabled="true">${item.match.joinRules?.autoApprove
        && item.approvalEligible
        ? `Đang kiểm tra và tự duyệt sau ${pendingSeconds} giây`
        : item.approvalEligible
          ? 'Đang chờ chủ kèo duyệt'
          : 'Chưa đủ tiêu chí tham gia'}</span>`;
    } else if (item.status === 'accepted') {
      actions = `
        <a class="action" href="../invite/?match=${encodeURIComponent(item.matchId)}">Mời thêm</a>
        <button class="action primary" data-chat-match="${item.matchId}">Mở chat</button>
        <button class="action" data-app-action="paid" data-id="${item.id}">Thanh toán cọc</button>
        <button class="action" data-app-action="cancelled" data-id="${item.id}">Hủy</button>
      `;
    } else if (item.status === 'paid') {
      actions = `
        <a class="action" href="../invite/?match=${encodeURIComponent(item.matchId)}">Mời thêm</a>
        <button class="action primary" data-chat-match="${item.matchId}">Mở chat</button>
        <a class="action" href="../match/?application=${encodeURIComponent(item.id)}&finish=1">Kết trận & đánh giá</a>
      `;
    }
    
    return `
      <article class="activity">
        <div class="activity-icon">${getSportIcon(item.match.sport, item.match.emoji)}</div>
        <div class="activity-copy">
          <h4>${escape(item.match.name)}</h4>
          <p>${escape(item.match.time)} · ${escape(item.match.venue)}...</p>
          <b class="status ${displayStatus}">${getStatusCopy(displayStatus)}</b>
        </div>
        <div class="actions">${actions}</div>
      </article>
    `;
  }).join('');
  
  list.innerHTML = createdMarkup + applicationMarkup;
  
  // Attach event listeners
  list.querySelectorAll('[data-created-action="cancel"]').forEach(button => {
    button.addEventListener('click', () => {
      store.cancelMatch(button.dataset.id);
      notify('Đã hủy kèo của bạn.');
      render();
    });
  });
  
  list.querySelectorAll('[data-app-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.appAction;
      const id = button.dataset.id;
      
      if (action === 'paid') {
        openApplicationPayment(id);
        return;
      }
      
      const updatedApplication = store.updateApplicationStatus(id, action);
      
      let message = '';
      if (!updatedApplication && action === 'accepted') {
        message = 'Chưa thể duyệt: người chơi cần thanh toán cọc trước.';
      } else if (action === 'accepted') {
        message = 'Bạn đã được nhận vào kèo.';
      } else if (action === 'declined') {
        message = 'Yêu cầu đã không được duyệt.';
      } else {
        message = 'Đã hủy yêu cầu.';
      }
      
      notify(message);
      render();
      
      // Check if we need to auto-open payment for requested application
      const profileQuery = new URLSearchParams(location.search);
      const requestedApplicationId = profileQuery.get('application');
      const requestedPayment = profileQuery.get('pay') === '1';
      
      if (updatedApplication && action === 'accepted' && requestedApplicationId === id && requestedPayment) {
        setTimeout(() => openApplicationPayment(id), 0);
      }
    });
  });
}
