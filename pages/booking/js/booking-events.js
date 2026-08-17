import {
  COURT_DISTANCE_STEP,
  COURT_PRICE_STEP,
  COURT_DISTANCE_MIN,
  COURT_DISTANCE_MAX,
  COURT_PRICE_MIN,
  COURT_PRICE_MAX,
  addDays,
  courts,
  courtState,
  dateFromKey,
  dateKey,
  dom,
  joinRuleState,
  readJoinRules,
  requestedVoucherId,
  scheduleFor,
  selectedDayKey,
  selectedDayText,
  selectedDayElement,
  selectedVoucher,
  syncCourtRanges,
  syncJoinRuleCriteria,
  weeklyState,
  store,
} from './booking-state.js';
import {
  renderActiveHold,
  renderCourts,
  renderDayOptions,
  renderSchedule,
  renderWeeklySchedule,
  renderVoucherSummary,
  refreshScheduleFromClock,
} from './booking-render.js';

const showToast = (message) => window.showToast?.(message);

const updateCourtRange = (type, value) => {
  if (type === 'distanceMin') {
    courtState.distanceMin = Math.min(Number(value), courtState.distanceMax - COURT_DISTANCE_STEP);
  } else if (type === 'distanceMax') {
    courtState.distanceMax = Math.max(Number(value), courtState.distanceMin + COURT_DISTANCE_STEP);
  } else if (type === 'priceMin') {
    courtState.priceMin = Math.min(Number(value), courtState.priceMax - COURT_PRICE_STEP);
  } else {
    courtState.priceMax = Math.max(Number(value), courtState.priceMin + COURT_PRICE_STEP);
  }
  syncCourtRanges();
  renderCourts();
};

const syncSelectedDate = (key, time) => {
  const visible = [...document.querySelectorAll('.day')]
    .some((day) => day.dataset.dateKey === key);
  courtState.selectedDateKey = key;
  if (!visible) renderDayOptions(key);
  document.querySelectorAll('.day').forEach((day) => {
    day.classList.toggle('active', day.dataset.dateKey === key);
  });
  const active = selectedDayElement();
  courtState.day = active ? Number(active.dataset.dayIndex) : 0;
  courtState.selectedTimes = time ? [time] : [];
  renderCourts();
  return courts.find((court) => court.id === courtState.selected);
};

const closeWeeklySchedule = () => {
  dom.weeklyLayer.classList.remove('show');
  dom.weeklyTrigger.setAttribute('aria-expanded', 'false');
  dom.weeklyTrigger.focus();
};

const openWeeklySchedule = () => {
  const selected = dateFromKey(selectedDayKey());
  weeklyState.startKey = dateKey(
    addDays(selected, -((selected.getDay() + 6) % 7)),
  );
  renderWeeklySchedule();
  dom.weeklyLayer.classList.add('show');
  dom.weeklyTrigger.setAttribute('aria-expanded', 'true');
  document.querySelector('#close-weekly-schedule').focus();
};

const bindEventListeners = () => {
  dom.courtDistanceMinInput.addEventListener('input', (event) => {
    updateCourtRange('distanceMin', event.target.value);
  });
  dom.courtDistanceMaxInput.addEventListener('input', (event) => {
    updateCourtRange('distanceMax', event.target.value);
  });
  dom.courtPriceMinInput.addEventListener('input', (event) => {
    updateCourtRange('priceMin', event.target.value);
  });
  dom.courtPriceMaxInput.addEventListener('input', (event) => {
    updateCourtRange('priceMax', event.target.value);
  });

  document.querySelectorAll('[data-court-filter]').forEach((filter) => {
    filter.addEventListener('click', () => {
      const type = filter.dataset.courtFilter;
      courtState[type] = type === 'distance'
        ? Number(filter.dataset.value)
        : filter.dataset.value;
      document.querySelectorAll(`[data-court-filter="${type}"]`).forEach((item) => {
        item.classList.remove('active');
      });
      filter.classList.add('active');
      renderCourts();
    });
  });

  document.querySelectorAll('[data-reset-court-filters]').forEach((reset) => {
    reset.addEventListener('click', () => {
      courtState.sport = 'all';
      courtState.time = 'all';
      courtState.priceMin = COURT_PRICE_MIN;
      courtState.priceMax = COURT_PRICE_MAX;
      courtState.distanceMin = COURT_DISTANCE_MIN;
      courtState.distanceMax = COURT_DISTANCE_MAX;
      courtState.voucherId = requestedVoucherId || null;
      syncCourtRanges();
      document.querySelectorAll('[data-court-filter]').forEach((item) => {
        item.classList.toggle(
          'active',
          item.dataset.value === 'all'
            || (item.dataset.courtFilter === 'distance' && item.dataset.value === '10'),
        );
      });
      renderCourts();
      showToast('Đã đặt lại bộ lọc sân');
    });
  });

  document.querySelectorAll('.day').forEach((day) => {
    day.addEventListener('click', () => {
      document.querySelectorAll('.day').forEach((item) => item.classList.remove('active'));
      day.classList.add('active');
      courtState.selectedDateKey = day.dataset.dateKey;
      courtState.day = Number(day.dataset.dayIndex);
      courtState.selectedTimes = [];
      renderCourts();
      showToast(`Đang xem lịch ${selectedDayText()}`);
    });
  });

  dom.courtList.addEventListener('click', (event) => {
    const card = event.target.closest('.court');
    if (!card) return;
    courtState.selected = card.dataset.id;
    courtState.selectedTimes = [];
    renderCourts();
    const court = courts.find((item) => item.id === courtState.selected);
    showToast(`Đã chọn ${court.name}`);
  });

  dom.timeSlots.addEventListener('click', (event) => {
    const slot = event.target.closest('.time');
    if (!slot) return;
    if (slot.classList.contains('past')) {
      showToast(`Khung giờ ${slot.dataset.time} đã qua theo thời gian thực.`);
      return;
    }
    if (Number(slot.dataset.available) === 0) {
      showToast(`Khung giờ ${slot.dataset.time} đã đầy. Hãy chọn giờ khác.`);
      return;
    }
    const index = courtState.selectedTimes.indexOf(slot.dataset.time);
    if (index > -1) courtState.selectedTimes.splice(index, 1);
    else courtState.selectedTimes.push(slot.dataset.time);
    courtState.selectedTimes.sort((a, b) => a.localeCompare(b));
    const court = courts.find((item) => item.id === courtState.selected);
    renderSchedule(court);
    renderVoucherSummary(court);
    showToast(index > -1
      ? `Đã bỏ chọn ${slot.dataset.time}`
      : `Đã chọn ${courtState.selectedTimes.length} khung giờ`);
  });

  document.querySelector('#clear-times').addEventListener('click', () => {
    courtState.selectedTimes = [];
    const court = courts.find((item) => item.id === courtState.selected);
    renderSchedule(court);
    renderVoucherSummary(court);
    showToast('Đã bỏ chọn các khung giờ');
  });

  document.querySelector('#toggle-vouchers').addEventListener('click', function onToggle() {
    const open = dom.voucherPicker.classList.toggle('show');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.textContent = open ? 'Đóng' : 'Đổi voucher';
  });

  dom.voucherPicker.addEventListener('click', (event) => {
    const upgradeButton = event.target.closest('[data-voucher-premium]');
    if (upgradeButton) {
      showToast('Voucher này dành riêng cho thành viên Premium.');
      location.href = '../profile/?premium=1';
      return;
    }
    const option = event.target.closest('[data-voucher-id]');
    if (!option) return;
    if (option.getAttribute('aria-disabled') === 'true') {
      showToast(option.querySelector('small').textContent);
      return;
    }
    courtState.voucherId = option.dataset.voucherId;
    const court = courts.find((item) => item.id === courtState.selected);
    renderVoucherSummary(court);
    showToast(`Đã đổi sang ${option.dataset.voucherId.toUpperCase()}`);
  });

  document.querySelector('#booking-require-payment').addEventListener(
    'change',
    function onChange() {
      joinRuleState.requirePaymentBeforeJoin = this.checked;
    },
  );
  document.querySelector('#booking-auto-approve').addEventListener('change', function onChange() {
    joinRuleState.autoApprove = this.checked;
    syncJoinRuleCriteria();
  });
  document.querySelector('#booking-level-match').addEventListener('change', function onChange() {
    joinRuleState.criteria.levelMatch = this.checked;
  });
  document.querySelector('#booking-min-rating').addEventListener('change', function onChange() {
    joinRuleState.criteria.minRating = Number(this.value) || 0;
  });
  document.querySelector('#booking-min-completed').addEventListener('change', function onChange() {
    joinRuleState.criteria.minCompletedMatches = Number(this.value) || 0;
  });

  document.querySelector('#reserve').addEventListener('click', () => {
    const court = courts.find((item) => item.id === courtState.selected);
    const schedule = scheduleFor(court);
    const unavailable = courtState.selectedTimes.find((time) => {
      const slot = schedule.find((item) => item.time === time);
      return !slot || slot.past || slot.available === 0;
    });
    if (!courtState.selectedTimes.length || unavailable) {
      showToast(unavailable
        ? `Khung giờ ${unavailable} vừa hết chỗ. Hãy chọn giờ khác.`
        : 'Hãy chọn ít nhất một khung giờ.');
      renderSchedule(court);
      renderVoucherSummary(court);
      return;
    }

    const voucher = selectedVoucher(court);
    const selectedTimes = [...courtState.selectedTimes];
    const booking = store.createBooking({
      courtId: court.id,
      court: court.name,
      distance: `${court.distance.toFixed(1).replace('.', ',')} km`,
      sport: court.sport,
      subtotal: court.price * selectedTimes.length,
      voucherId: voucher ? voucher.id : null,
      date: selectedDayText(),
      dateKey: selectedDayKey(),
      time: selectedTimes.join(' · '),
      timeSlots: selectedTimes,
      duration: 90 * selectedTimes.length,
      teamSize: 4,
      level: store.getProfile().level,
      joinRules: readJoinRules(),
    });
    location.href = `../invite/?booking=${encodeURIComponent(booking.id)}`;
  });

  dom.weeklyTrigger.addEventListener('click', openWeeklySchedule);
  document.querySelector('#close-weekly-schedule').addEventListener('click', closeWeeklySchedule);
  document.querySelector('#cancel-weekly-schedule').addEventListener('click', closeWeeklySchedule);
  document.querySelector('#weekly-schedule-prev').addEventListener('click', () => {
    const date = dateFromKey(weeklyState.startKey);
    weeklyState.startKey = dateKey(addDays(date, -7));
    renderWeeklySchedule();
  });
  document.querySelector('#weekly-schedule-next').addEventListener('click', () => {
    const date = dateFromKey(weeklyState.startKey);
    weeklyState.startKey = dateKey(addDays(date, 7));
    renderWeeklySchedule();
  });

  dom.weeklyLayer.addEventListener('click', (event) => {
    if (event.target === dom.weeklyLayer) {
      closeWeeklySchedule();
      return;
    }
    const slot = event.target.closest('[data-week-time]');
    if (slot) {
      const court = courts.find((item) => item.id === courtState.selected);
      const schedule = scheduleFor(court, slot.dataset.weekDate);
      const selected = schedule.find((item) => item.time === slot.dataset.weekTime);
      if (!selected || selected.past || selected.available === 0) return;
      syncSelectedDate(slot.dataset.weekDate, slot.dataset.weekTime);
      closeWeeklySchedule();
      showToast(`Đã chọn ${slot.dataset.weekTime} · ${selectedDayText()}`);
      return;
    }
    const day = event.target.closest('[data-week-date]');
    if (day && !day.disabled) {
      syncSelectedDate(day.dataset.weekDate);
      closeWeeklySchedule();
      showToast(`Đang xem lịch ${selectedDayText()}`);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dom.weeklyLayer.classList.contains('show')) {
      closeWeeklySchedule();
    }
  });
};

export const initBookingPage = () => {
  syncCourtRanges();
  renderDayOptions();
  refreshScheduleFromClock();
  bindEventListeners();
  setInterval(renderActiveHold, 1000);
  setInterval(refreshScheduleFromClock, 1000);
  renderActiveHold();
};
