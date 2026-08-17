import { dom, store } from '../core/state.js';
import { sportCatalog } from '../core/constants.js';
import { renderMatches } from '../match-list/filters.js';
import { currentLocationLabel, safe } from '../core/utils.js';
import { showToast } from '../core/toast.js';

let selectedCreateBookingId = null;

function activeBookings() {
  return store.getBookings().filter(booking => ['held', 'confirmed'].includes(booking.status));
}

function bookingStatusLabel(booking) {
  if (booking.status === 'held') {
    const minutes = booking.holdMinutes || (store.isPremium() ? 30 : 10);
    return `Đang giữ sân · còn ${minutes} phút`;
  }
  return booking.ownerPaid ? 'Đã thanh toán' : 'Đã xác nhận';
}

function bookingSport(booking) {
  return sportCatalog[booking.sport] || sportCatalog.football;
}

function renderCreateFlow() {
  const bookings = activeBookings();
  const form = dom.createFormElement;
  if (!bookings.some(booking => booking.id === selectedCreateBookingId)) {
    selectedCreateBookingId = null;
    form.elements.timeKey.disabled = false;
  }
  dom.createFormCard.hidden = !selectedCreateBookingId;
  if (!bookings.length) {
    dom.createCourtPicker.innerHTML = `
      <div class="create-flow-empty">
        <span class="material-symbols-rounded">event_busy</span>
        <h3>Bạn chưa đặt sân nào</h3>
        <p>
          Hãy đặt sân trước để chọn đúng địa điểm và giờ chơi khi
          tạo kèo mới.
        </p>
        <a class="create-flow-booking-link" href="../booking/">
          <span class="material-symbols-rounded">stadium</span>Đặt sân ngay
        </a>
      </div>
    `;
    return;
  }
  dom.createCourtPicker.innerHTML = `
    <p>Chọn một lịch sân đang giữ hoặc đã xác nhận để gắn vào kèo:</p>
    <div class="create-court-list">
      ${bookings.map(booking => {
        const detail = bookingSport(booking);
        const selected = booking.id === selectedCreateBookingId;
        return `
          <article class="create-court-card ${selected ? 'selected' : ''}"
            data-create-booking="${safe(booking.id)}">
            <span class="create-court-icon">${detail.emoji}</span>
            <div class="create-court-copy">
              <strong>${safe(booking.court)}</strong>
              <span>${safe(booking.date)} · ${safe(booking.time)}</span>
              <span>
                ${safe(booking.distance || 'Gần bạn')} · ${store.money(booking.total)}
              </span>
              <span class="create-court-status">${bookingStatusLabel(booking)}</span>
            </div>
            <button type="button" data-select-booking="${safe(booking.id)}">
              <span class="material-symbols-rounded">${selected ? 'check' : 'add'}</span>
              ${selected ? 'Đã chọn' : 'Chọn sân này'}
            </button>
          </article>
        `;
      }).join('')}
    </div>
  `;
  if (selectedCreateBookingId) {
    const selectedBooking = bookings.find(
      booking => booking.id === selectedCreateBookingId
    );
    dom.createSelectedBooking.querySelector('span:last-child').innerHTML =
      `<strong>${safe(selectedBooking.court)}</strong> · `
      + `${safe(selectedBooking.date)} · ${safe(selectedBooking.time)}`;
  }
}

function selectCreateBooking(bookingId) {
  const booking = activeBookings().find(item => item.id === bookingId);
  if (!booking) return;
  const form = dom.createFormElement;
  selectedCreateBookingId = booking.id;
  form.elements.bookingId.value = booking.id;
  form.elements.sport.value = booking.sport in sportCatalog ? booking.sport : 'football';
  form.elements.venue.value = booking.court || '';
  form.elements.fee.value = Number(
    booking.total || booking.subtotal || booking.originalTotal
  ) || 360000;
  const distance = Number.parseFloat(String(booking.distance || '').replace(',', '.'));
  form.elements.distance.value = Number.isFinite(distance) && distance > 0 ? distance : 2.1;
  let bookingTimeOption = form.elements.timeKey.querySelector('[data-booking-time]');
  if (!bookingTimeOption) {
    bookingTimeOption = document.createElement('option');
    bookingTimeOption.value = 'booking';
    bookingTimeOption.dataset.bookingTime = 'true';
    form.elements.timeKey.append(bookingTimeOption);
  }
  Array.from(form.elements.timeKey.options).forEach(option => {
    option.hidden = option.value !== 'booking';
  });
  bookingTimeOption.textContent = `${booking.date} · ${booking.time}`;
  form.elements.timeKey.value = 'booking';
  form.elements.timeKey.disabled = true;
  form.elements.name.value = `${booking.court} · Kèo giao lưu`;
  dom.createFormCard.hidden = false;
  renderCreateFlow();
  dom.createFormCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function openCreateFlow() {
  renderCreateFlow();
  dom.createFlow.hidden = false;
  document.body.classList.add('modal-open');
  dom.createFlow.focus({ preventScroll: true });
}

export function closeCreateFlow() {
  dom.createFlow.hidden = true;
  document.body.classList.remove('modal-open');
  document.querySelector('#open-modal').focus({ preventScroll: true });
}

function submitCreateForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const selectedBooking = activeBookings().find(
    booking => booking.id === form.get('bookingId')
  );
  if (!selectedBooking) {
    showToast('Hãy chọn một sân đã đặt trước khi tạo kèo.');
    return;
  }
  const sport = form.get('sport');
  const config = sportCatalog[sport] || sportCatalog.football;
  const timeKey = form.get('timeKey') || dom.createFormElement.elements.timeKey.value;
  const labels = {
    today: 'Tối nay, 20:00',
    tomorrow: 'Ngày mai, 18:30',
    weekend: 'Cuối tuần, 08:00'
  };
  const bookedTime = timeKey === 'booking' && selectedBooking;
  const matchTime = bookedTime
    ? `${selectedBooking.date}, ${selectedBooking.time}`
    : labels[timeKey];
  const matchTimeKey = bookedTime
    ? selectedBooking.dateKey || 'today'
    : timeKey;
  const bookedStart = bookedTime
    ? String(selectedBooking.time || '').match(/\d{1,2}:\d{2}/)
    : null;
  const timeOrder = bookedStart
    ? Number(bookedStart[0].slice(0, 2)) * 60 + Number(bookedStart[0].slice(3))
    : timeKey === 'today'
      ? 20
      : timeKey === 'tomorrow'
        ? 42
        : 56;
  const venue = form.get('venue').trim();
  store.createMatch({
    name: form.get('name').trim(),
    sport,
    emoji: config.emoji,
    format: config.format,
    level: form.get('level'),
    time: matchTime,
    timeKey: matchTimeKey,
    dateKey: selectedBooking.dateKey || null,
    timeOrder,
    venue,
    bookingId: selectedBooking.id,
    area: currentLocationLabel(),
    address: `${venue}, ${currentLocationLabel()}`,
    fee: Number(form.get('fee')),
    distance: Number(form.get('distance')),
    joinRules: {
      requirePaymentBeforeJoin: form.get('requirePaymentBeforeJoin') === 'on',
      autoApprove: form.get('autoApprove') === 'on',
      criteria: {
        levelMatch: form.get('levelMatch') === 'on',
        minRating: Number(form.get('minRating')) || 0,
        minCompletedMatches: Number(form.get('minCompletedMatches')) || 0
      }
    }
  });
  selectedCreateBookingId = null;
  dom.createFlow.hidden = true;
  document.body.classList.remove('modal-open');
  renderMatches();
  location.href = `../invite/?booking=${encodeURIComponent(selectedBooking.id)}`
    + '&pay=1&created=1';
}

export function initCreateFlow() {
  dom.createFormCard.append(dom.createFormElement);
  const bookingIdInput = document.createElement('input');
  bookingIdInput.type = 'hidden';
  bookingIdInput.name = 'bookingId';
  dom.createFormElement.prepend(bookingIdInput);
  dom.createFormElement.elements.fee.step = '1000';
  dom.createCourtPicker.addEventListener('click', event => {
    const button = event.target.closest('[data-select-booking]');
    if (button) selectCreateBooking(button.dataset.selectBooking);
  });
  dom.createFlow.addEventListener('click', event => {
    if (event.target === dom.createFlow) closeCreateFlow();
  });
  document.querySelector('#open-modal').addEventListener('click', openCreateFlow);
  document.querySelector('#mobile-create').addEventListener('click', event => {
    event.preventDefault();
    openCreateFlow();
  });
  document.querySelector('#close-create-flow').addEventListener('click', closeCreateFlow);
  document.querySelector('#create-auto-approve').addEventListener('change', () => {
    document.querySelector('#create-approval-criteria').hidden =
      !document.querySelector('#create-auto-approve').checked;
  });
  document.querySelector('#create-approval-criteria').hidden =
    !document.querySelector('#create-auto-approve').checked;
  dom.createFormElement.addEventListener('submit', submitCreateForm);
}

export { renderCreateFlow };
