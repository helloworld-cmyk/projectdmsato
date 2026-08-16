import { store } from '../state.js';
import { formatMoney, formatTransactionDate, escape } from '../utils.js';

export function renderWallet() {
  const wallet = store.getWallet();
  document.querySelector('#wallet-balance').textContent = formatMoney(wallet.balance);
  document.querySelector('#application-wallet-balance').textContent = `Số dư ${formatMoney(wallet.balance)}`;
  
  const history = document.querySelector('#wallet-history');
  if (wallet.transactions.length) {
    history.innerHTML = wallet.transactions.slice(0, 8).map(item => `
      <div class="wallet-item">
        <div>
          <strong>${escape(item.description)}</strong>
          <small>${formatTransactionDate(item.createdAt)}${item.method ? ' · ' + escape(item.method) : ''}</small>
        </div>
        <span class="wallet-amount ${item.type === 'topup' ? 'topup' : 'payment'}">
          ${item.amount > 0 ? '+' : '−'}${formatMoney(Math.abs(item.amount))}
        </span>
      </div>
    `).join('');
  } else {
    history.innerHTML = '<div class="wallet-empty">Ví chưa có giao dịch. Nạp tiền để thanh toán nhanh hơn.</div>';
  }
}