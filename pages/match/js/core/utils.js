export function money(amount) {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}

export function playerClass(index) {
  return ['one', 'two', 'three', 'four'][index % 4];
}

export function currentLocationLabel(requestedLocation) {
  return requestedLocation
    || document.querySelector('[data-user-location]')?.textContent
    || 'vị trí hiện tại';
}

export function slotMinutes(slot) {
  const [hour, minute] = String(slot).slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
}

export function formatDistance(value) {
  return Number.isInteger(Number(value))
    ? String(Number(value))
    : Number(value).toFixed(1).replace('.', ',');
}

export function safe(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export function sportClass(sport) {
  if (sport === 'badminton') return 'badminton';
  if (sport === 'pickleball') return 'pickleball';
  if (sport === 'basketball') return 'basketball';
  return '';
}
