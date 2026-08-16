import { store } from '../state.js';
import { formatMoney } from '../utils.js';
import { setWalletTopupAmount, notify } from '../state.js';
import { renderWallet } from '../components/wallet.js';

let walletModal = null;
let walletInput = null;

export function initWalletTopupModal() {
  walletModal = document.querySelector('#wallet-topup-modal');
  walletInput = document.querySelector('#wallet-topup-amount');
  
  // Quick topup buttons
  document.querySelectorAll('[data-wallet-topup]').forEach(button => {
    button.addEventListener('click', () => {
      const amount = Number(button.dataset.walletTopup);
      const result = store.topUpWallet(amount, 'Nạp nhanh trong app');
      if (result) {
        notify(`Đã nạp ${formatMoney(amount)} vào Ví MatchUp.`);
        renderWallet();
      }
    });
  });
  
  // Open custom amount modal
  document.querySelector('#open-wallet-topup').addEventListener('click', () => {
    walletInput.value = 100000;
    syncWalletTopup();
    walletModal.classList.add('show');
    walletInput.focus();
  });
  
  // Preset buttons in modal
  document.querySelectorAll('[data-wallet-preset]').forEach(button => {
    button.addEventListener('click', () => {
      walletInput.value = button.dataset.walletPreset;
      syncWalletTopup();
    });
  });
  
  // Input sync
  walletInput.addEventListener('input', syncWalletTopup);
  
  // Close buttons
  document.querySelector('#close-wallet-topup').addEventListener('click', closeWalletTopup);
  walletModal.addEventListener('click', (event) => {
    if (event.target === walletModal) closeWalletTopup();
  });
  
  // Confirm topup
  document.querySelector('#confirm-wallet-topup').addEventListener('click', () => {
    const amount = Math.max(0, Math.floor(Number(walletInput.value) || 0));
    const result = store.topUpWallet(amount, 'Nạp tiền trong app');
    
    if (!result) {
      notify('Số tiền nạp phải từ 10.000đ đến 5.000.000đ.');
      return;
    }
    
    closeWalletTopup();
    renderWallet();
    notify(`Đã nạp ${formatMoney(amount)} vào Ví MatchUp.`);
  });
}

function syncWalletTopup() {
  const amount = Math.max(0, Math.floor(Number(walletInput.value) || 0));
  setWalletTopupAmount(amount);
  document.querySelector('#confirm-wallet-topup').textContent = `Nạp ${formatMoney(amount)} vào ví`;
}

function closeWalletTopup() {
  walletModal.classList.remove('show');
}