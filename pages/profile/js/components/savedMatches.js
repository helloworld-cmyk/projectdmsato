import { store } from '../state.js';
import { getSportIcon, getStatusCopy, formatMoney, escape } from '../utils.js';
import { notify } from '../state.js';

export function renderSavedMatches() {
  const savedMatches = store.getSavedMatchRecords();
  const list = document.querySelector('#saved-matches-list');
  
  list.innerHTML = savedMatches.length
    ? savedMatches.map(item => {
        const cancelled = item.status === 'cancelled';
        const detailsLink = `../match/?match=${encodeURIComponent(item.id)}`;
        return `
          <article class="activity">
            <div class="activity-icon">${getSportIcon(item.sport, item.emoji)}</div>
            <div class="activity-copy">
              <h4>${escape(item.name)}</h4>
              <p>${escape(item.time || 'Thời gian chưa cập nhật')} · ${escape(item.venue || 'Địa điểm chưa cập nhật')}${item.share ? ` · ${formatMoney(item.share)}/người` : ''}</p>
              <b class="status ${cancelled ? 'cancelled' : 'open'}">${cancelled ? 'Kèo đã hủy' : 'Đã lưu'}</b>
            </div>
            <div class="actions">
              ${cancelled ? '<span class="action">Không còn hoạt động</span>' : `<a class="action primary" href="${detailsLink}">Xem lại</a>`}
              <button class="action" data-saved-action="remove" data-id="${escape(item.id)}">Bỏ lưu</button>
            </div>
          </article>
        `;
      }).join('')
    : '<div class="saved-empty"><span class="material-symbols-rounded">bookmark_border</span>Bạn chưa lưu kèo nào.<br /><a href="../match/" style="color:#1e7049;font-weight:800">Tìm kèo gần bạn</a></div>';
  
  // Attach event listeners for saved matches
  list.querySelectorAll('[data-saved-action="remove"]').forEach(button => {
    button.addEventListener('click', () => {
      const item = store.getSavedMatchRecords().find(match => match.id === button.dataset.id);
      if (!item) return;
      store.toggleSavedMatch(item.id, item.name);
      notify('Đã bỏ lưu kèo.');
      renderSavedMatches();
    });
  });
}