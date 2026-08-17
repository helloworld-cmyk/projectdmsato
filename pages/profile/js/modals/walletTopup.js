import { store } from '../state.js';
import { formatMoney } from '../utils.js';
import {
  setWalletTopupAmount,
  setSelectedTopupMethod,
  notify
} from '../state.js';
import { renderWallet } from '../components/wallet.js';

let walletModal = null;
let walletInput = null;
let topupMethod = 'VNPay';

export function initWalletTopupModal() {
  walletModal = document.querySelector('#wallet-topup-modal');
  walletInput = document.querySelector('#wallet-topup-amount');

  // Quick topup buttons — open modal with preset amount
  document.querySelectorAll('[data-wallet-topup]').forEach(button => {
    button.addEventListener('click', () => {
      walletInput.value = button.dataset.walletTopup;
      openWalletTopup();
    });
  });

  // Open custom amount modal
  document.querySelector('#open-wallet-topup').addEventListener('click', () => {
    walletInput.value = 100000;
    openWalletTopup();
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

  // Payment method selection
  document.querySelectorAll('[data-topup-method]').forEach(button => {
    button.addEventListener('click', () => {
      topupMethod = button.dataset.topupMethod;
      setSelectedTopupMethod(topupMethod);
      document.querySelectorAll('[data-topup-method]').forEach(item => {
        item.classList.toggle('active', item === button);
      });
      syncWalletTopup();
    });
  });

  // Close buttons
  document.querySelector('#close-wallet-topup').addEventListener('click', closeWalletTopup);
  walletModal.addEventListener('click', (event) => {
    if (event.target === walletModal) closeWalletTopup();
  });

  // Confirm topup
  document.querySelector('#confirm-wallet-topup').addEventListener('click', () => {
    const amount = Math.max(0, Math.floor(Number(walletInput.value) || 0));
    const result = store.topUpWallet(amount, topupMethod);

    if (!result) {
      notify('Số tiền nạp phải từ 10.000đ đến 5.000.000đ.');
      return;
    }

    closeWalletTopup();
    renderWallet();
    notify(`Đã nạp ${formatMoney(amount)} vào Ví MatchUp qua ${topupMethod}.`);
  });
}

function openWalletTopup() {
  syncWalletTopup();
  walletModal.classList.add('show');
  walletInput.focus();
}

function syncWalletTopup() {
  const amount = Math.max(0, Math.floor(Number(walletInput.value) || 0));
  setWalletTopupAmount(amount);
  document.querySelector('#confirm-wallet-topup').textContent =
    `Nạp ${formatMoney(amount)} qua ${topupMethod}`;
}

function closeWalletTopup() {
  walletModal.classList.remove('show');
}
