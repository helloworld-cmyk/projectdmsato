import { store } from '../state.js';
import { formatMoney, formatTransactionDate, escape } from '../utils.js';

export function renderLoyalty() {
  const loyalty = store.getLoyalty();
  document.querySelector('#loyalty-balance').textContent = `${loyalty.balance} điểm`;
  
  const history = document.querySelector('#loyalty-history');
  if (loyalty.transactions.length) {
    history.innerHTML = loyalty.transactions.slice(0, 8).map(item => `
      <div class="loyalty-item">
        <div>
          <strong>${escape(item.description)}</strong>
          <small>${formatTransactionDate(item.createdAt)}</small>
        </div>
        <span class="loyalty-points ${item.points > 0 ? 'earn' : 'redeem'}">
          ${item.points > 0 ? '+' : ''}${item.points} điểm
        </span>
      </div>
    `).join('');
  } else {
    history.innerHTML = '<div class="loyalty-empty">Chưa có giao dịch điểm. Thanh toán thành công để bắt đầu tích điểm.</div>';
  }
}