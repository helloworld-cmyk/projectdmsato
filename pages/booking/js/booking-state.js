import '../../../js/app-state/index.js';

export const store = window.MatchUpStore;

export const courtCatalog = {
  football: {
    emoji: '⚽',
    tone: '',
    facility: 'Sân 5 · Sân 7 · Bãi xe',
    name: 'Sân bóng',
    // Ảnh Unsplash theo đúng bộ môn: https://unsplash.com/s/photos/football-field
    images: [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1709431511265-20e72ac61182?auto=format&fit=crop&w=900&q=80',
    ],
  },
  badminton: {
    emoji: '🏸',
    tone: 'orange',
    facility: 'Sân thảm · Thoáng mát · Có tủ đồ',
    name: 'Cầu lông',
    // Ảnh Unsplash theo đúng bộ môn: https://unsplash.com/s/photos/badminton-court
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1708312604109-16c0be9326cd?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=900&q=80',
    ],
  },
  pickleball: {
    emoji: '🎾',
    tone: 'blue',
    facility: 'Sân chuẩn · Đèn tối · Nước miễn phí',
    name: 'Pickleball',
    // Ảnh Unsplash theo đúng bộ môn: https://unsplash.com/s/photos/pickleball-court
    images: [
      'https://images.unsplash.com/photo-1693142517898-2f986215e412?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1693142518820-78d7a05f1546?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1737476996922-828e3975f631?auto=format&fit=crop&w=900&q=80',
    ],
  },
  basketball: {
    emoji: '🏀',
    tone: 'orange',
    facility: 'Sân 3x3 · Đèn đêm · Khán đài',
    name: 'Sân bóng rổ',
    // Ảnh Unsplash theo đúng bộ môn: https://unsplash.com/s/photos/basketball-court
    images: [
      'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?auto=format&fit=crop&w=900&q=80',
    ],
  },
};

// Mỗi môn có 9 sân ở từng dải giá; toàn bộ đều nằm trong bán kính 3 km.
// Các sân có lịch sáng, chiều, tối để mọi bộ lọc luôn có kết quả.
export const nearbyAreas = [
  'Văn Quán',
  'Mỗ Lao',
  'Kiến Hưng',
  'Phúc La',
  'Văn Phú',
  'La Khê',
  'Dương Nội',
  'Hà Cầu',
  'Yên Nghĩa',
];

export const nearbyDistances = [0.7, 0.9, 1.1, 1.4, 1.7, 2.0, 2.3, 2.6, 2.9];

export const priceBands = [
  {
    key: 'budget',
    prices: [85000, 90000, 95000, 100000, 105000, 110000, 115000, 118000, 120000],
  },
  {
    key: 'standard',
    prices: [125000, 130000, 135000, 140000, 150000, 160000, 165000, 175000, 180000],
  },
  {
    key: 'premium',
    prices: [185000, 190000, 200000, 210000, 220000, 230000, 240000, 250000, 260000],
  },
];

export const bookingTimes = [
  '06:00',
  '07:30',
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '15:00',
  '16:30',
  '18:00',
  '19:30',
  '21:00',
  '22:30',
];

export const availabilityPatterns = [
  [3, 2, 1, 4, 1, 0, 2, 3, 1, 0, 2, 1],
  [1, 0, 2, 1, 3, 1, 0, 2, 3, 1, 0, 2],
  [0, 2, 1, 3, 0, 2, 1, 0, 2, 3, 1, 0],
  [2, 0, 1, 0, 2, 1, 3, 2, 0, 1, 2, 3],
  [3, 1, 0, 2, 3, 0, 1, 2, 0, 3, 1, 2],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

export const courts = Object.entries(courtCatalog).flatMap(([sport, detail], sportIndex) => (
  priceBands.flatMap((band, bandIndex) => band.prices.map((price, index) => {
    const sequence = bandIndex * nearbyAreas.length + index + 1;

    return {
      id: `${sport}-${band.key}-${index}`,
      sport,
      name: `${detail.name} ${nearbyAreas[index]} · Sân ${sequence}`,
      area: nearbyAreas[index],
      emoji: detail.emoji,
      tone: detail.tone,
      image: detail.images[(bandIndex * nearbyAreas.length + index) % detail.images.length],
      facility: detail.facility,
      distance: nearbyDistances[index],
      price,
      rating: (4.7 + (sequence % 3) / 10).toFixed(1),
      reviews: 126 + sequence * 47,
      slots: bookingTimes,
      capacity: 3 + (sequence % 4),
      scheduleSeed: (index + sportIndex * 2 + bandIndex) % availabilityPatterns.length,
    };
  }))
));

const repeatQuery = new URLSearchParams(location.search);
export const repeatCourt = repeatQuery.get('repeatCourt');
const repeatTime = repeatQuery.get('repeatTime');
export const requestedVoucherId = repeatQuery.get('voucher');
export const repeatedCourt = courts.find((court) => court.name === repeatCourt);
export const repeatedTimes = (
  (repeatTime && repeatTime.match(/\b\d{2}:\d{2}\b/g)) || []
).filter((time) => bookingTimes.includes(time));

export const COURT_DISTANCE_MIN = 0;
export const COURT_DISTANCE_MAX = 10;
export const COURT_DISTANCE_STEP = 0.1;
export const COURT_PRICE_MIN = 10000;
export const COURT_PRICE_MAX = 500000;
export const COURT_PRICE_STEP = 10000;

export const courtState = {
  sport: 'all',
  time: 'all',
  priceMin: COURT_PRICE_MIN,
  priceMax: COURT_PRICE_MAX,
  distanceMin: COURT_DISTANCE_MIN,
  distanceMax: COURT_DISTANCE_MAX,
  selected: repeatedCourt ? repeatedCourt.id : courts[0].id,
  day: 0,
  dayStartKey: null,
  selectedDateKey: null,
  selectedTimes: repeatedTimes,
  voucherId: requestedVoucherId || null,
};

export const joinRuleState = {
  requirePaymentBeforeJoin: false,
  autoApprove: false,
  criteria: {
    levelMatch: false,
    minRating: 0,
    minCompletedMatches: 0,
  },
};

export const dom = {
  courtList: document.querySelector('#court-list'),
  timeSlots: document.querySelector('#time-slots'),
  voucherPicker: document.querySelector('#voucher-picker'),
  courtPriceMinInput: document.querySelector('#court-price-min'),
  courtPriceMaxInput: document.querySelector('#court-price-max'),
  courtPriceSlider: document.querySelector('#court-price-slider'),
  courtPriceMinLabel: document.querySelector('#court-price-min-label'),
  courtPriceMaxLabel: document.querySelector('#court-price-max-label'),
  courtDistanceMinInput: document.querySelector('#court-distance-min'),
  courtDistanceMaxInput: document.querySelector('#court-distance-max'),
  courtDistanceSlider: document.querySelector('#court-distance-slider'),
  courtDistanceMinLabel: document.querySelector('#court-distance-min-label'),
  courtDistanceMaxLabel: document.querySelector('#court-distance-max-label'),
  weeklyLayer: document.querySelector('#weekly-schedule-modal'),
  weeklyGrid: document.querySelector('#weekly-schedule-grid'),
  weeklyRange: document.querySelector('#weekly-schedule-range'),
  weeklySubtitle: document.querySelector('#weekly-schedule-subtitle'),
  weeklyTrigger: document.querySelector('#open-weekly-schedule'),
};

export const weeklyState = { startKey: '' };

export const syncJoinRuleCriteria = () => {
  document.querySelector('#booking-approval-criteria').hidden = !joinRuleState.autoApprove;
};

export const readJoinRules = () => ({
  requirePaymentBeforeJoin: joinRuleState.requirePaymentBeforeJoin,
  autoApprove: joinRuleState.autoApprove,
  criteria: { ...joinRuleState.criteria },
});

export const money = (value) => (
  `${new Intl.NumberFormat('vi-VN').format(Math.round(Number(value) || 0))}đ`
);

export const pad = (value) => String(value).padStart(2, '0');

export const formatCourtDistance = (value) => (
  Number.isInteger(Number(value))
    ? String(Number(value))
    : Number(value).toFixed(1).replace('.', ',')
);

export const formatCourtPrice = (value) => `${Math.round(Number(value) / 1000)}k`;

export const syncCourtRanges = () => {
  courtState.distanceMin = Math.max(
    COURT_DISTANCE_MIN,
    Math.min(Number(courtState.distanceMin), COURT_DISTANCE_MAX - COURT_DISTANCE_STEP),
  );
  courtState.distanceMax = Math.min(
    COURT_DISTANCE_MAX,
    Math.max(Number(courtState.distanceMax), COURT_DISTANCE_MIN + COURT_DISTANCE_STEP),
  );
  if (courtState.distanceMin > courtState.distanceMax - COURT_DISTANCE_STEP) {
    courtState.distanceMin = courtState.distanceMax - COURT_DISTANCE_STEP;
  }
  courtState.priceMin = Math.max(
    COURT_PRICE_MIN,
    Math.min(Number(courtState.priceMin), COURT_PRICE_MAX - COURT_PRICE_STEP),
  );
  courtState.priceMax = Math.min(
    COURT_PRICE_MAX,
    Math.max(Number(courtState.priceMax), COURT_PRICE_MIN + COURT_PRICE_STEP),
  );
  if (courtState.priceMin > courtState.priceMax - COURT_PRICE_STEP) {
    courtState.priceMin = courtState.priceMax - COURT_PRICE_STEP;
  }
  dom.courtDistanceMinInput.value = courtState.distanceMin;
  dom.courtDistanceMaxInput.value = courtState.distanceMax;
  dom.courtDistanceMinLabel.textContent = `${formatCourtDistance(courtState.distanceMin)} km`;
  dom.courtDistanceMaxLabel.textContent = `${formatCourtDistance(courtState.distanceMax)} km`;
  dom.courtDistanceSlider.style.setProperty(
    '--range-start',
    `${courtState.distanceMin / COURT_DISTANCE_MAX * 100}%`,
  );
  dom.courtDistanceSlider.style.setProperty(
    '--range-end',
    `${courtState.distanceMax / COURT_DISTANCE_MAX * 100}%`,
  );
  dom.courtPriceMinInput.value = courtState.priceMin;
  dom.courtPriceMaxInput.value = courtState.priceMax;
  dom.courtPriceMinLabel.textContent = formatCourtPrice(courtState.priceMin);
  dom.courtPriceMaxLabel.textContent = formatCourtPrice(courtState.priceMax);
  dom.courtPriceSlider.style.setProperty(
    '--range-start',
    `${(courtState.priceMin - COURT_PRICE_MIN) / (COURT_PRICE_MAX - COURT_PRICE_MIN) * 100}%`,
  );
  dom.courtPriceSlider.style.setProperty(
    '--range-end',
    `${(courtState.priceMax - COURT_PRICE_MIN) / (COURT_PRICE_MAX - COURT_PRICE_MIN) * 100}%`,
  );
};

const weekdayNames = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

export const dateKey = (date) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

export const dateFromKey = (key) => {
  const parts = String(key).split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setHours(12, 0, 0, 0);
  return date;
};

export const todayDate = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
};

export const currentDateKey = () => dateKey(todayDate());

export const addDays = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  next.setHours(12, 0, 0, 0);
  return next;
};

export const daysBetween = (firstKey, secondKey) => (
  Math.round((dateFromKey(firstKey).getTime() - dateFromKey(secondKey).getTime()) / 86400000)
);

export const dateInfo = (key) => {
  const date = dateFromKey(key);
  const currentKey = currentDateKey();
  const tomorrowKey = dateKey(addDays(todayDate(), 1));

  return {
    key,
    date,
    weekday: weekdayNames[date.getDay()],
    label: key === currentKey
      ? 'Hôm nay'
      : key === tomorrowKey
        ? 'Ngày mai'
        : weekdayNames[date.getDay()],
    dateLabel: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`,
    isToday: key === currentKey,
    isPast: key < currentKey,
  };
};

export const selectedDayElement = () => document.querySelector('.day.active');

export const selectedDayKey = () => (
  courtState.selectedDateKey
  || selectedDayElement()?.dataset.dateKey
  || currentDateKey()
);

export const selectedDayName = () => dateInfo(selectedDayKey()).label;

export const selectedDayWeekday = () => dateInfo(selectedDayKey()).weekday;

export const selectedDayText = () => {
  const info = dateInfo(selectedDayKey());
  return [info.label, info.dateLabel].join(' · ');
};

export const bookingDateMatchesFor = (booking, key) => {
  const info = dateInfo(key);
  return booking.dateKey
    ? booking.dateKey === key
    : [info.label + ' · ' + info.dateLabel, info.label, info.weekday].includes(booking.date);
};

export const bookingDateMatches = (booking) => bookingDateMatchesFor(booking, selectedDayKey());

export const slotHasPassed = (time, dayKey) => {
  const targetKey = dayKey || selectedDayKey();
  const now = new Date();
  const todayKey = currentDateKey();

  if (targetKey < todayKey) return true;
  if (targetKey > todayKey) return false;

  const parts = time.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= parts[0] * 60 + parts[1];
};

export const bookingIncludesTime = (booking, time) => (
  Array.isArray(booking.timeSlots) ? booking.timeSlots.includes(time) : booking.time === time
);

export const scheduleFor = (court, dayKey) => {
  const targetKey = dayKey || selectedDayKey();
  const pattern = availabilityPatterns[
    (court.scheduleSeed + Math.max(0, daysBetween(targetKey, currentDateKey())))
      % availabilityPatterns.length
  ];
  const booked = store.getBookings();

  return bookingTimes.map((time, index) => {
    const past = slotHasPassed(time, targetKey);
    const reserved = past
      ? 0
      : booked.filter((booking) => (
        booking.court === court.name
        && bookingDateMatchesFor(booking, targetKey)
        && bookingIncludesTime(booking, time)
        && ['held', 'confirmed'].includes(booking.status)
      )).length;

    return {
      time,
      past,
      available: past ? 0 : Math.max(0, Math.min(pattern[index], court.capacity) - reserved),
      capacity: court.capacity,
    };
  });
};

export const availableSlotsFor = (court) => (
  scheduleFor(court).filter((slot) => !slot.past && slot.available > 0)
);

export const timeMatch = (court) => {
  if (courtState.time === 'all') return true;

  const hours = court.slots.map((slot) => Number(slot.slice(0, 2)));
  if (courtState.time === 'morning') return hours.some((hour) => hour < 12);
  if (courtState.time === 'afternoon') {
    return hours.some((hour) => hour >= 12 && hour < 18);
  }
  return hours.some((hour) => hour >= 18);
};

export const selectedSlotCount = () => courtState.selectedTimes.length;

export const voucherContext = (court) => ({
  subtotal: court.price * selectedSlotCount(),
  sport: court.sport,
  date: selectedDayWeekday(),
  time: courtState.selectedTimes[0] || '',
  times: courtState.selectedTimes,
  teamSize: 4,
});

export const voucherOptions = (court) => store.getVouchers(voucherContext(court));

export const selectedVoucher = (court) => {
  const options = voucherOptions(court);
  const selected = options.find(
    (voucher) => voucher.id === courtState.voucherId && voucher.eligible,
  );
  if (selected) return selected;

  const best = options
    .filter((voucher) => voucher.eligible)
    .sort((a, b) => b.discount - a.discount || a.priority - b.priority)[0] || null;
  courtState.voucherId = best ? best.id : null;
  return best;
};
