export const DAY = 86400000;

export const WEEKDAY_NAMES = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'CN'
];

export const MONTH_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  month: 'long',
  year: 'numeric'
});

export const LONG_DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: 'numeric',
  month: 'numeric'
});

export const RANGES = [
  { key: 'all', label: 'Cả ngày' },
  { key: 'morning', label: 'Buổi sáng' },
  { key: 'afternoon', label: 'Buổi chiều' },
  { key: 'evening', label: 'Sau 18:00' }
];

export const SHORTCUTS = [
  { key: 'all', label: 'Tất cả ngày' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'tomorrow', label: 'Ngày mai' },
  { key: 'weekend', label: 'Cuối tuần này' },
  { key: 'next-week', label: 'Tuần sau' }
];
