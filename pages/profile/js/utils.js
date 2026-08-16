import { STATUS_COPY, SPORT_ICON } from './constants.js';

export function escape(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export function formatMoney(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function formatTransactionDate(time) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(time));
}

export function formatReputationDate(time) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(time));
}

export function countdown(booking, store) {
  const seconds = store.getSecondsRemaining(booking);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function getStatusCopy(status) {
  return STATUS_COPY[status] || status;
}

export function getSportIcon(sport, emoji) {
  return SPORT_ICON[sport] || emoji || '⚽';
}