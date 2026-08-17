import {
  addDays,
  availableSlotsFor,
  bookingTimes,
  courts,
  courtState,
  dateFromKey,
  dateInfo,
  dateKey,
  dom,
  money,
  pad,
  selectedDayKey,
  selectedDayName,
  selectedDayText,
  selectedSlotCount,
  selectedVoucher,
  scheduleFor,
  store,
  timeMatch,
  voucherOptions,
  weeklyState,
} from './booking-state.js';

export const renderDayOptions = (startKey) => {
  const baseKey = startKey || courtState.dayStartKey || dateKey(new Date());
  const base = dateFromKey(baseKey);
  courtState.dayStartKey = dateKey(base);
  if (!courtState.selectedDateKey) courtState.selectedDateKey = courtState.dayStartKey;

  document.querySelectorAll('.day').forEach((day) => {
    const index = Number(day.dataset.dayIndex);
    const date = addDays(base, index);
    const info = dateInfo(dateKey(date));
    day.dataset.label = info.label;
    day.dataset.weekday = info.weekday;
    day.dataset.dateKey = info.key;
    day.dataset.dateLabel = info.dateLabel;
    day.innerHTML = `${info.label}<b>${pad(date.getDate())}</b>`;
    day.title = `${info.weekday} · ${info.dateLabel}`;
    day.setAttribute('aria-label', `${info.weekday} ngày ${info.dateLabel}`);
    day.classList.toggle('active', info.key === courtState.selectedDateKey);
  });
};

export const renderVoucherPicker = (court) => {
  if (!court) {
    dom.voucherPicker.innerHTML = '';
    return;
  }

  const options = voucherOptions(court);
  const active = selectedVoucher(court);

  dom.voucherPicker.innerHTML = options.map((voucher) => {
    const eligible = voucher.eligible;
    const selected = active && active.id === voucher.id;
    const premiumLocked = !eligible && voucher.requiresPremium;
    const classes = `voucher-option ${eligible ? '' : 'locked'} ${selected ? 'selected' : ''}`;
    const disabled = eligible ? '' : ' aria-disabled="true"';
    const description = eligible ? voucher.title : voucher.reason;
    const discount = eligible ? `−${money(voucher.discount)}` : premiumLocked ? 'Premium' : 'Khóa';
    const upgradeButton = premiumLocked
      ? '<button class="voucher-premium-upgrade" type="button" data-voucher-premium="1">Nâng cấp Premium</button>'
      : '';

    return [
      `<button class="${classes}" type="button" role="option"`,
      ` aria-selected="${selected}" data-voucher-id="${voucher.id}"${disabled}>`,
      `<span><strong>${voucher.code} · ${voucher.discountLabel}</strong>`,
      `<small>${description}</small>${upgradeButton}</span><b>${discount}</b></button>`,
    ].join('');
  }).join('');
};

export const renderVoucherSummary = (court) => {
  if (!court) return;

  const subtotal = court.price * selectedSlotCount();
  const voucher = selectedSlotCount() ? selectedVoucher(court) : null;
  const total = Math.max(0, subtotal - (voucher ? voucher.discount : 0));
  const selectedVoucherLabel = !selectedSlotCount()
    ? 'Chọn khung giờ để xem ưu đãi'
    : voucher
      ? `${voucher.code} · ${voucher.discountLabel}`
      : 'Chưa có voucher phù hợp';

  document.querySelector('#selected-voucher').textContent = selectedVoucherLabel;
  document.querySelector('#booking-discount-title').textContent = !selectedSlotCount()
    ? 'Chưa chọn khung giờ'
    : voucher
      ? voucher.title
      : 'Chưa có ưu đãi áp dụng';
  document.querySelector('#booking-discount-label').textContent = voucher
    ? 'Đã chọn một voucher'
    : 'Ưu đãi đang áp dụng';
  document.querySelector('#booking-discount').textContent = (
    `−${money(voucher ? voucher.discount : 0)}`
  );
  document.querySelector('#total').textContent = money(total);
  document.querySelector('#booking-duration').textContent = selectedSlotCount()
    ? `${selectedSlotCount() * 90} phút`
    : '—';
  renderVoucherPicker(court);
};

const slotPeriod = (time) => {
  const hour = Number(time.slice(0, 2));
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
};

export const renderSchedule = (court) => {
  const schedule = scheduleFor(court);
  const upcoming = schedule.filter((slot) => !slot.past);
  const available = upcoming.filter((slot) => slot.available > 0);

  courtState.selectedTimes = courtState.selectedTimes.filter((time) => (
    schedule.some((slot) => slot.time === time && !slot.past && slot.available > 0)
  ));

  dom.timeSlots.innerHTML = schedule.map((slot) => {
    const isPast = slot.past;
    const isFull = !isPast && slot.available === 0;
    const isSelected = courtState.selectedTimes.includes(slot.time);
    const stateLabel = isPast
      ? 'Đã qua'
      : isFull
        ? 'Đã đầy'
        : `còn ${slot.available}/${slot.capacity} sân`;
    const classes = `time ${isSelected ? 'active ' : ''}`
      + `${isPast ? 'past ' : isFull ? 'full ' : ''}`;
    const disabled = isPast || isFull;

    return [
      `<button class="${classes}" type="button" data-period="${slotPeriod(slot.time)}"`,
      ` data-time="${slot.time}" data-available="${slot.available}"`,
      ` aria-label="${slot.time}: ${stateLabel}${isSelected ? ', đang chọn' : ''}"`,
      ` aria-pressed="${isSelected}" aria-disabled="${disabled}"${disabled ? ' disabled' : ''}>`,
      `<span>${slot.time}</span><small>${stateLabel}</small></button>`,
    ].join('');
  }).join('');

  const selectedTimes = document.querySelector('#selected-times');
  const clearTimes = document.querySelector('#clear-times');
  const count = selectedSlotCount();
  selectedTimes.classList.toggle('empty', !count);
  selectedTimes.innerHTML = count
    ? `<span class="material-symbols-rounded">event_available</span><span><strong>`
      + `${count} khung đã chọn</strong> · ${courtState.selectedTimes.join(' · ')}<br>`
      + `${count * 90} phút · ${money(court.price * count)}</span>`
    : '<span class="material-symbols-rounded">touch_app</span>'
      + '<span>Chưa chọn khung giờ nào</span>';
  clearTimes.hidden = !count;
  document.querySelector('#availability').textContent = upcoming.length
    ? `${available.length}/${upcoming.length} khung trống`
    : 'Hết giờ hôm nay';

  const pastCount = schedule.filter((slot) => slot.past).length;
  const fullCount = upcoming.length - available.length;
  const note = !upcoming.length
    ? 'Đã hết các khung giờ hôm nay. Hãy chọn ngày khác.'
    : !available.length
      ? 'Sân này đã kín các khung giờ còn lại. Hãy chọn sân hoặc ngày khác.'
      : fullCount
        ? `${pastCount ? `${pastCount} giờ đã qua; ` : ''}${fullCount}`
          + ' khung giờ đã đầy; bạn vẫn có thể chọn nhiều khung còn trống.'
        : pastCount
          ? `${pastCount} giờ đã qua. Các khung còn lại đang có sân trống.`
          : 'Tất cả khung giờ trong ngày đang còn sân trống.';
  const noteIcon = !available.length || fullCount ? 'info' : 'event_available';
  document.querySelector('#availability-note').innerHTML = [
    `<span class="material-symbols-rounded">${noteIcon}</span>`,
    `<span>${note}</span>`,
  ].join('');

  const reserve = document.querySelector('#reserve');
  reserve.disabled = !count;
  reserve.textContent = count ? `Giữ ${count} khung & thanh toán` : 'Chọn khung giờ';
};

export const updateSummary = (court) => {
  if (!court) return;
  document.querySelector('#selected-court').textContent = (
    `${court.name} · ${court.distance.toFixed(1).replace('.', ',')} km`
  );
  renderSchedule(court);
  renderVoucherSummary(court);
};

const priceMatch = (court) => (
  court.price >= courtState.priceMin && court.price <= courtState.priceMax
);

export const renderCourts = () => {
  const visible = courts
    .filter((court) => (
      (courtState.sport === 'all' || court.sport === courtState.sport)
      && timeMatch(court)
      && priceMatch(court)
      && court.distance >= courtState.distanceMin
      && court.distance <= courtState.distanceMax
    ))
    .sort((a, b) => a.distance - b.distance || a.price - b.price);

  if (visible.length && !visible.some((court) => court.id === courtState.selected)) {
    courtState.selected = visible[0].id;
  }

  dom.courtList.innerHTML = visible.map((court) => {
    const reputation = store.getCourtReputation(court.id, {
      rating: court.rating,
      reviews: court.reviews,
    });
    const selected = court.id === courtState.selected;
    const schedule = scheduleFor(court);
    const upcoming = schedule.filter((slot) => !slot.past);
    const available = upcoming.filter((slot) => slot.available > 0);
    const status = available.length
      ? `Còn ${available.length}/${upcoming.length} khung giờ sắp tới`
      : upcoming.length
        ? 'Đã kín các khung giờ còn lại'
        : 'Đã hết giờ hôm nay';
    const highlight = reputation.highlights[0] ? reputation.highlights[0].tag : '';
    const warning = reputation.alerts[0] ? reputation.alerts[0].tag : '';
    const reputationNote = highlight
      ? '<div class="court-reputation-note">'
        + '<span class="material-symbols-rounded">thumb_up</span>' + highlight + '</div>'
      : '';
    const reputationWarning = warning
      ? '<div class="court-reputation-warning">'
        + '<span class="material-symbols-rounded">warning</span>' + warning + '</div>'
      : '';

    return [
      `<article class="court ${selected ? 'selected' : ''}" data-id="${court.id}">`,
      `<div class="court-art ${court.tone}">`,
      `<img src="${court.image}" alt="${court.name}" loading="lazy" decoding="async">`,
      `<span class="court-art-fallback" aria-hidden="true">${court.emoji}</span></div><div>`,
      `<div class="court-title"><h3>${court.name}</h3>`,
      '<span class="material-symbols-rounded verified">verified</span></div>',
      `<p>${court.facility}</p><div class="court-meta">`,
      '<span><span class="material-symbols-rounded">location_on</span>',
      `${court.area} · ${court.distance.toFixed(1).replace('.', ',')} km</span>`,
      '<span><span class="material-symbols-rounded">star</span>',
      `${reputation.rating.toFixed(1)} (${reputation.reviews})</span></div>`,
      reputationNote,
      reputationWarning,
      `<div class="court-availability ${available.length ? '' : 'full'}">`,
      '<span class="material-symbols-rounded">'
        + `${available.length ? 'event_available' : 'block'}</span>`,
      `${status}</div></div><div class="court-right">`,
      `<strong>${money(court.price)}</strong><span>/ 90 phút</span>`,
      `<button class="select-court">${selected ? 'Đã chọn' : 'Chọn sân'}</button>`,
      '</div></article>',
    ].join('');
  }).join('');

  const openCourts = visible.filter((court) => availableSlotsFor(court).length).length;
  document.querySelector('#court-count').textContent = visible.length;
  document.querySelector('#court-result-note').textContent = visible.length
    ? `${openCourts} sân còn giờ trống · ${visible.length - openCourts}`
      + ` sân không còn giờ trống ${selectedDayName()}.`
    : 'Không tìm thấy sân phù hợp với bộ lọc này.';

  if (visible.length) {
    updateSummary(visible.find((court) => court.id === courtState.selected));
    return;
  }

  dom.timeSlots.innerHTML = '';
  dom.voucherPicker.innerHTML = '';
  document.querySelector('#availability').textContent = 'Không có sân';
  document.querySelector('#availability-note').innerHTML = [
    '<span class="material-symbols-rounded">info</span>',
    '<span>Hãy nới bộ lọc để xem lịch sân.</span>',
  ].join('');
  document.querySelector('#reserve').disabled = true;
  document.querySelector('#reserve').textContent = 'Chọn sân để tiếp tục';
};

export const renderWeeklySchedule = () => {
  const court = courts.find((item) => item.id === courtState.selected);
  if (!court) return;

  weeklyState.startKey = weeklyState.startKey || mondayOf(selectedDayKey());
  const keys = weeklyDateKeys(weeklyState.startKey);
  const schedules = keys.map((key) => scheduleFor(court, key));
  dom.weeklyRange.textContent = weeklyRangeLabel(keys);
  dom.weeklySubtitle.textContent = (
    `${court.name} · ${court.distance.toFixed(1).replace('.', ',')} km`
  );

  const headers = keys.map((key) => {
    const info = dateInfo(key);
    const selected = key === selectedDayKey();
    const classes = `weekly-schedule-day ${selected ? 'is-selected ' : ''}`
      + `${info.isToday ? 'is-today ' : ''}${info.isPast ? 'is-past' : ''}`;
    const disabled = info.isPast ? ' disabled' : '';

    return [
      `<button class="${classes}" type="button" data-week-date="${key}"${disabled}>`,
      `${info.isToday ? 'Hôm nay' : weeklyWeekdayLabel(info.date)}`,
      `<strong>${pad(info.date.getDate())}</strong></button>`,
    ].join('');
  }).join('');

  const rows = bookingTimes.map((time, index) => {
    const cells = schedules.map((schedule, keyIndex) => {
      const slot = schedule[index];
      const key = keys[keyIndex];
      const selected = key === selectedDayKey() && courtState.selectedTimes.includes(time);
      const state = slot.past
        ? 'Đã qua'
        : slot.available === 0
          ? 'Đã đầy'
          : `còn ${slot.available}/${slot.capacity} sân`;
      const classes = `weekly-schedule-slot ${slot.past ? 'is-past ' : ''}`
        + `${slot.available === 0 ? 'is-full ' : ''}${selected ? 'is-selected' : ''}`;
      const disabled = slot.past || slot.available === 0;

      return [
        `<button class="${classes}" type="button" data-week-date="${key}"`,
        ` data-week-time="${time}" aria-label="${key} ${time}: ${state}"`,
        `${disabled ? ' disabled' : ''}><span>${slot.available}/${slot.capacity}</span>`,
        `<small>${state}</small></button>`,
      ].join('');
    }).join('');

    return `<div class="weekly-schedule-time" role="rowheader">${time}</div>${cells}`;
  }).join('');

  dom.weeklyGrid.innerHTML = `<div class="weekly-schedule-corner">Giờ</div>${headers}${rows}`;
};

const mondayOf = (key) => {
  const date = dateFromKey(key);
  return dateKey(addDays(date, -((date.getDay() + 6) % 7)));
};

const weeklyDateKeys = (startKey) => {
  const start = dateFromKey(startKey);
  return Array.from({ length: 7 }, (_, index) => dateKey(addDays(start, index)));
};

const weeklyWeekdayLabel = (date) => (date.getDay() === 0 ? 'CN' : `T${date.getDay() + 1}`);

const weeklyRangeLabel = (keys) => {
  const first = dateFromKey(keys[0]);
  const last = dateFromKey(keys[keys.length - 1]);
  const firstPart = `${pad(first.getDate())}/${pad(first.getMonth() + 1)}`;
  const lastPart = `${pad(last.getDate())}/${pad(last.getMonth() + 1)}`;

  return first.getFullYear() === last.getFullYear()
    ? `${firstPart} — ${lastPart} · ${first.getFullYear()}`
    : `${firstPart}/${first.getFullYear()} — ${lastPart}/${last.getFullYear()}`;
};

export const renderActiveHold = () => {
  const booking = store.getLatestBooking();
  const box = document.querySelector('#active-hold');
  if (!booking) {
    box.style.display = 'none';
    return;
  }

  if (booking.status === 'held') {
    const seconds = store.getSecondsRemaining(booking);
    box.style.display = 'block';
    box.innerHTML = [
      '<span class="material-symbols-rounded" style="font-size:14px">timer</span>',
      ` Bạn đang giữ ${booking.court} lúc ${booking.time} · còn `,
      `${String(Math.floor(seconds / 60)).padStart(2, '0')}:`,
      `${String(seconds % 60).padStart(2, '0')} `,
      `<a href="../invite/?booking=${booking.id}" style="margin-left:4px;color:#1e7049">`,
      'Tiếp tục</a>',
    ].join('');
  } else if (booking.status === 'expired') {
    box.style.display = 'block';
    box.innerHTML = [
      '<span class="material-symbols-rounded" style="font-size:14px">restart_alt</span>',
      ' Giữ chỗ trước đã hết hạn. ',
      '<a href="./" style="margin-left:4px;color:#1e7049">Chọn lại giờ gần nhất</a>',
    ].join('');
  } else {
    box.style.display = 'none';
  }
};

export const refreshScheduleFromClock = () => {
  const now = new Date();
  const marker = `${dateKey(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (marker === refreshScheduleFromClock.lastMarker) return;

  const previousKey = selectedDayKey();
  renderDayOptions();
  const days = [...document.querySelectorAll('.day')];
  const active = days.find((day) => day.dataset.dateKey === previousKey) || days[0];
  days.forEach((day) => day.classList.toggle('active', day === active));
  const dayChanged = !previousKey || previousKey !== active.dataset.dateKey;
  courtState.day = Number(active.dataset.dayIndex);
  if (dayChanged) courtState.selectedTimes = [];
  refreshScheduleFromClock.lastMarker = marker;
  renderCourts();
};

refreshScheduleFromClock.lastMarker = '';
