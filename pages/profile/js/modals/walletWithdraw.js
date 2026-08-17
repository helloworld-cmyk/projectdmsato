import { store } from '../state.js';
import { formatMoney } from '../utils.js';
import { setSelectedWithdrawMethod, notify } from '../state.js';
import { renderWallet } from '../components/wallet.js';

let walletModal = null;
let walletInput = null;
let withdrawMethod = 'VNPay';

export function initWalletWithdrawModal() {
  walletModal = document.querySelector('#wallet-withdraw-modal');
  walletInput = document.querySelector('#wallet-withdraw-amount');

  document.querySelector('#open-wallet-withdraw').addEventListener('click', () => {
    walletInput.value = 100000;
    openWalletWithdraw();
  });

  walletInput.addEventListener('input', syncWalletWithdraw);

  // Payment method selection
  document.querySelectorAll('[data-withdraw-method]').forEach(button => {
    button.addEventListener('click', () => {
      withdrawMethod = button.dataset.withdrawMethod;
      setSelectedWithdrawMethod(withdrawMethod);
      document.querySelectorAll('[data-withdraw-method]').forEach(item => {
        item.classList.toggle('active', item === button);
      });
      syncWalletWithdraw();
    });
  });

  document.querySelector('#close-wallet-withdraw').addEventListener('click', closeWalletWithdraw);
  walletModal.addEventListener('click', (event) => {
    if (event.target === walletModal) closeWalletWithdraw();
  });

  document.querySelector('#confirm-wallet-withdraw').addEventListener('click', () => {
    const amount = Math.max(0, Math.floor(Number(walletInput.value) || 0));
    const result = store.withdrawFromWallet(amount, withdrawMethod);

    if (!result) {
      notify('Số tiền rút phải từ 10.000đ và không vượt quá số dư ví.');
      return;
    }

    closeWalletWithdraw();
    renderWallet();
    notify(`Đã gửi yêu cầu rút ${formatMoney(amount)} qua ${withdrawMethod}.`);
  });
}

function openWalletWithdraw() {
  syncWalletWithdraw();
  walletModal.classList.add('show');
  walletInput.focus();
}

function syncWalletWithdraw() {
  const amount = Math.max(0, Math.floor(Number(walletInput.value) || 0));
  const balance = store.getWallet().balance;
  document.querySelector('#wallet-withdraw-balance').textContent =
    `Số dư khả dụng: ${formatMoney(balance)}`;

  const confirm = document.querySelector('#confirm-wallet-withdraw');
  const invalid = amount < 10000 || amount > balance;
  confirm.disabled = invalid;
  confirm.textContent = invalid
    ? 'Số tiền rút không hợp lệ'
    : `Rút ${formatMoney(amount)} qua ${withdrawMethod}`;
}

function closeWalletWithdraw() {
  walletModal.classList.remove('show');
}
