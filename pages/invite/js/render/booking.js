import {
  matchInvite,
  matchInviteMode,
  profile,
  state,
  store
} from '../core/state.js';
import { $ } from '../core/dom.js';
import { format } from '../core/utils.js';
import { timeRemainingLabel } from '../booking/booking.js';
import { renderJourney } from '../features/journey.js';

export function renderBooking() {
  if (!state.booking) {
    $('#confirm-booking').hidden = true;
    $('#journey-card').style.display = 'none';
    return;
  }

  if (matchInviteMode) {
    renderMatchInvite();
    return;
  }

  state.booking = store.getBooking(state.booking.id) || state.booking;
  state.total = state.booking.total;
  $('#booking-code').textContent = `Mã đặt sân: ${state.booking.id.slice(-7).toUpperCase()}`;
  $('#event-court').textContent = `${state.booking.court} · Sân giao lưu`;
  $('#detail-court').textContent = `${state.booking.court} · 90 phút`;
  const eventTime = `${state.booking.date}, ${state.booking.time}`
    + ` — ${state.booking.duration} phút`;
  $('#event-time').textContent = eventTime;
  $('#detail-time').textContent = eventTime;

  const originalTotal = Number(state.booking.originalTotal || state.booking.total);
  $('#detail-total').textContent = state.booking.voucher
    ? `${format(originalTotal)} − ${format(state.booking.voucher.discount)}`
      + ` = ${format(state.total)}`
    : `${format(state.total)} · chưa dùng voucher`;

  const voucherBox = $('#detail-voucher');
  voucherBox.hidden = !state.booking.voucher;
  if (state.booking.voucher) {
    $('#detail-voucher-title').textContent = `${state.booking.voucher.code}`
      + ` · ${state.booking.voucher.title}`;
    $('#detail-voucher-copy').textContent = `Đã giảm ${format(
      state.booking.voucher.discount
    )} trước khi chia tiền.`;
  }

  $('#event-owner').textContent = profile.name;
  $('#share-link').value = `https://matchup.vn/keo/${state.booking.id}`;
  const chip = $('#booking-chip');
  const description = $('#event-description');
  const confirm = $('#confirm-booking');

  if (state.booking.status === 'held') {
    chip.innerHTML = '<span class="material-symbols-rounded">timer</span>'
      + `GIỮ CHỖ CÒN ${timeRemainingLabel()}`;
    description.textContent = 'Xác nhận sân trong thời gian giữ chỗ, sau đó '
      + 'mời đội và thu tiền từng người.';
    confirm.hidden = false;
    confirm.disabled = false;
    confirm.textContent = 'Xác nhận giữ sân';
  } else if (state.booking.status === 'confirmed') {
    chip.innerHTML = '<span class="material-symbols-rounded">verified</span>'
      + 'SÂN ĐÃ XÁC NHẬN';
    description.textContent = 'Sân đã nằm trong lịch của bạn. Hãy gửi link '
      + 'để đội cùng xác nhận và thanh toán.';
    confirm.hidden = true;
  } else {
    chip.innerHTML = '<span class="material-symbols-rounded">error</span>'
      + (state.booking.status === 'expired'
        ? 'GIỮ CHỖ ĐÃ HẾT HẠN'
        : 'LỊCH ĐÃ HỦY');
    description.textContent = 'Lịch này không còn có thể thanh toán. Hãy '
      + 'chọn một khung giờ khác.';
    confirm.hidden = true;
  }
  renderJourney();
}

function renderMatchInvite() {
  document.body.classList.add('match-invite-mode');
  $('.eyebrow').textContent = 'Kèo đã tham gia';
  $('.page-head h1').textContent = 'Mời thêm đồng đội.';
  $('.page-head p').textContent = 'Chia sẻ link này để rủ thêm người vào cùng kèo.';
  $('#booking-code').textContent = `Mã kèo: ${String(matchInvite.id).slice(-7).toUpperCase()}`;
  $('#booking-chip').innerHTML = '<span class="material-symbols-rounded">groups</span>'
    + 'KÈO ĐANG MỞ ĐỂ MỜI THÊM';
  $('#event-court').textContent = `${matchInvite.name || matchInvite.venue}`
    + ` · ${matchInvite.format || 'Kèo giao lưu'}`;
  $('#event-description').textContent = 'Bạn đã vào kèo. Gửi link để đội '
    + 'có thêm người chơi trước giờ ra sân.';
  $('#event-time').textContent = matchInvite.time || 'Thời gian chưa cập nhật';
  $('#event-location').textContent = [matchInvite.venue, matchInvite.area]
    .filter(Boolean).join(' · ') || 'Địa điểm chưa cập nhật';
  $('#event-owner').textContent = matchInvite.creatorName
    || (matchInvite.participants || [])[0]?.name
    || profile.name;
  $('#detail-court').textContent = `${matchInvite.venue || 'Sân MatchUp'}`
    + ` · ${matchInvite.format || 'Kèo giao lưu'}`;
  $('#detail-time').textContent = matchInvite.time || 'Thời gian chưa cập nhật';
  $('#detail-total').textContent = `${format(matchInvite.fee || 0)}`
    + ` · ${format(matchInvite.share || 0)}/người`;
  $('#share-link').value = new URL(
    `?match=${encodeURIComponent(matchInvite.id)}`,
    location.href
  ).href;
  $('#share-description').textContent = 'Ai có link đều có thể xem thông tin '
    + 'kèo và được thêm vào đội.';
  $('.share-note').innerHTML = '<span class="material-symbols-rounded">info</span>'
    + 'Gửi link này cho đồng đội. Danh sách người chơi sẽ được cập nhật '
    + 'ngay sau khi họ tham gia.';
  $('#confirm-booking').hidden = true;
  $('#journey-card').style.display = 'none';
}
