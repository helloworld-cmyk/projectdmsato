import '../../../../js/app-state/index.js';

export const store = window.MatchUpStore;

export const toast = document.querySelector('.toast');

export const searchParams = new URLSearchParams(window.location.search);

export const supportedSports = [
  'all',
  'football',
  'badminton',
  'pickleball',
  'basketball'
];

export const supportedTimeScopes = [
  'all',
  'today',
  'tomorrow',
  'weekend',
  'next-week',
  'custom'
];

export const supportedTimeRanges = [
  'all',
  'morning',
  'afternoon',
  'evening'
];

export const requestedSport = supportedSports.includes(searchParams.get('sport'))
  ? searchParams.get('sport')
  : 'all';

export const requestedTimeScope = supportedTimeScopes.includes(
  searchParams.get('time')
)
  ? searchParams.get('time')
  : 'all';

export const requestedDate = /^\d{4}-\d{2}-\d{2}$/.test(
  searchParams.get('date') || ''
)
  ? searchParams.get('date')
  : '';

export const requestedTimeRange = supportedTimeRanges.includes(
  searchParams.get('range')
)
  ? searchParams.get('range')
  : 'all';

export const requestedLocation = (searchParams.get('location') || '')
  .trim()
  .replace(/[<>&"']/g, '')
  .slice(0, 80);

export const DISTANCE_MIN = 0;
export const DISTANCE_MAX = 10;
export const DISTANCE_STEP = 0.1;
export const PRICE_MIN = 10000;
export const PRICE_MAX = 500000;

export const sortDescriptions = {
  recommended: 'Đang ưu tiên độ phù hợp, sau đó là khoảng cách',
  distance: 'Đang xếp kèo gần vị trí hiện tại nhất',
  time: 'Đang xếp kèo có thời gian diễn ra sớm nhất',
  spots: 'Đang xếp kèo còn nhiều chỗ trống nhất',
  price: 'Đang xếp kèo có phí tham gia thấp nhất'
};

export const sportCatalog = {
  football: {
    emoji: '⚽',
    label: 'Bóng đá',
    format: 'Sân 5/7 người',
    venues: [
      'Sân bóng Văn Quán',
      'Sân bóng Mỗ Lao',
      'Sân bóng Kiến Hưng',
      'Sân bóng Xa La',
      'Sân bóng Phúc La',
      'Sân bóng Yên Nghĩa',
      'Sân bóng Hà Đông',
      'Sân bóng La Khê'
    ],
    areas: [
      'Văn Quán',
      'Mỗ Lao',
      'Kiến Hưng',
      'Phúc La',
      'Phúc La',
      'Yên Nghĩa',
      'Hà Đông',
      'La Khê'
    ],
    addresses: [
      'Ngõ 1 Văn Quán, Hà Nội',
      'Số 8 Nguyễn Văn Lộc, Hà Nội',
      'Đường Cầu Đơ, Hà Nội',
      'Khu đô thị Xa La, Hà Nội',
      'Đường Phúc La, Hà Nội',
      'Khu đô thị Yên Nghĩa, Hà Nội',
      'Đường Tô Hiệu, Hà Nội',
      'Đường Lê Trọng Tấn, Hà Nội'
    ],
    teams: [
      'FC Văn Quán',
      'Mỗ Lao United',
      'Anh Em Kiến Hưng',
      'Xa La Weekend',
      'Phúc La Warriors',
      'Yên Nghĩa FC',
      'Hà Đông 5-a-side',
      'La Khê Football'
    ],
    fees: [420000, 360000, 400000, 350000, 380000, 390000, 360000, 420000]
  },
  badminton: {
    emoji: '🏸',
    label: 'Cầu lông',
    format: 'Đánh đôi nam nữ',
    venues: [
      'Cầu lông Hai Bà Trưng',
      'Nhà thi đấu Văn Quán',
      'Cầu lông Mỗ Lao',
      'Cầu lông La Khê',
      'Cầu lông Phúc La',
      'Cầu lông Yên Nghĩa',
      'Cầu lông Hà Đông',
      'Cầu lông Văn Phú'
    ],
    areas: [
      'Nguyễn Văn Lộc',
      'Văn Quán',
      'Mỗ Lao',
      'La Khê',
      'Phúc La',
      'Yên Nghĩa',
      'Hà Đông',
      'Văn Phú'
    ],
    addresses: [
      '72 Nguyễn Văn Lộc, Hà Nội',
      'Khu thể thao Văn Quán, Hà Nội',
      '18 Nguyễn Văn Trỗi, Hà Nội',
      'Đường Lê Trọng Tấn, Hà Nội',
      'Đường Phúc La, Hà Nội',
      'Khu đô thị Yên Nghĩa, Hà Nội',
      'Đường Tô Hiệu, Hà Nội',
      'Khu đô thị Văn Phú, Hà Nội'
    ],
    teams: [
      'Hai Bà Trưng Smash',
      'Văn Quán Smash',
      'Mỗ Lao Badminton',
      'La Khê Friendly',
      'Phúc La Racket',
      'Yên Nghĩa Shuttle',
      'Hà Đông Doubles',
      'Văn Phú Rally'
    ],
    fees: [180000, 200000, 160000, 180000, 180000, 160000, 200000, 180000]
  },
  pickleball: {
    emoji: '🎾',
    label: 'Pickleball',
    format: 'Đánh đôi giao lưu',
    venues: [
      'Pickleball Văn Phú',
      'Pickleball Park City',
      'Pickleball Dương Nội',
      'Pickleball Yên Nghĩa',
      'Pickleball Hà Đông',
      'Pickleball La Khê',
      'Pickleball Phúc La',
      'Pickleball Mỗ Lao'
    ],
    areas: [
      'Văn Phú',
      'La Khê',
      'Dương Nội',
      'Yên Nghĩa',
      'Hà Đông',
      'La Khê',
      'Phúc La',
      'Mỗ Lao'
    ],
    addresses: [
      'Khu đô thị Văn Phú, Hà Nội',
      'Park City Hanoi, Hà Nội',
      'Khu đô thị Dương Nội, Hà Nội',
      'Đường Quang Trung, Hà Nội',
      'Khu thể thao Hà Đông, Hà Nội',
      'Đường Lê Trọng Tấn, Hà Nội',
      'Đường Phúc La, Hà Nội',
      'Nguyễn Văn Lộc, Hà Nội'
    ],
    teams: [
      'Văn Phú Picklers',
      'Park City Rally',
      'Dương Nội Social',
      'Yên Nghĩa Open',
      'Hà Đông Pickle',
      'La Khê Spin',
      'Phúc La Dinks',
      'Mỗ Lao Picklers'
    ],
    fees: [240000, 280000, 240000, 200000, 240000, 220000, 220000, 260000]
  },
  basketball: {
    emoji: '🏀',
    label: 'Bóng rổ',
    format: '3x3 nửa sân',
    venues: [
      'Sân bóng rổ Văn Phú',
      'Sân bóng rổ Mỗ Lao',
      'Sân bóng rổ Dương Nội',
      'Sân thể thao Hà Cầu',
      'Sân bóng rổ Hà Đông',
      'Sân bóng rổ Phúc La',
      'Sân bóng rổ Yên Nghĩa',
      'Sân bóng rổ La Khê'
    ],
    areas: [
      'Văn Phú',
      'Mỗ Lao',
      'Dương Nội',
      'Hà Cầu',
      'Hà Đông',
      'Phúc La',
      'Yên Nghĩa',
      'La Khê'
    ],
    addresses: [
      'Khu đô thị Văn Phú, Hà Nội',
      '18 Nguyễn Văn Lộc, Hà Nội',
      'Khu thể thao Dương Nội, Hà Nội',
      'Công viên Hà Cầu, Hà Nội',
      'Khu thể thao Hà Đông, Hà Nội',
      'Đường Phúc La, Hà Nội',
      'Khu đô thị Yên Nghĩa, Hà Nội',
      'Đường Lê Trọng Tấn, Hà Nội'
    ],
    teams: [
      'Văn Phú Hoopers',
      'Mỗ Lao 3x3',
      'Dương Nội Ballers',
      'Hà Cầu Afterwork',
      'Hà Đông Hoops',
      'Phúc La Fastbreak',
      'Yên Nghĩa Ballers',
      'La Khê Streetball'
    ],
    fees: [180000, 210000, 180000, 150000, 210000, 180000, 180000, 210000]
  }
};

export const daySlots = [
  '06:00 — 07:30',
  '06:30 — 08:00',
  '07:00 — 08:30',
  '07:30 — 09:00',
  '08:30 — 10:00',
  '09:30 — 11:00',
  '10:30 — 12:00',
  '11:00 — 12:30',
  '12:00 — 13:30',
  '12:30 — 14:00',
  '13:30 — 15:00',
  '14:00 — 15:30',
  '15:00 — 16:30',
  '16:00 — 17:30',
  '17:00 — 18:30',
  '17:30 — 19:00',
  '18:00 — 19:30',
  '18:30 — 20:00',
  '19:00 — 20:30',
  '19:30 — 21:00',
  '20:00 — 21:30',
  '20:30 — 22:00',
  '21:00 — 22:30',
  '21:30 — 23:00'
];

export const timeCatalog = [
  { key: 'today', label: 'hôm nay', slots: daySlots },
  { key: 'tomorrow', label: 'ngày mai', slots: daySlots },
  { key: 'weekend', label: 'cuối tuần', slots: daySlots },
  { key: 'next-week', label: 'tuần sau', slots: daySlots }
];

export const distances = [1.2, 2.1, 2.8, 3.6, 4.4, 5.2, 7.8, 9.4];
export const levels = ['Mới chơi', 'Khá', 'Giỏi'];
export const memberSets = [[3, 5], [2, 4], [4, 6], [5, 8], [3, 6], [2, 5], [4, 7], [5, 8]];

export const playerPool = [
  { name: 'Ngọc Anh', initials: 'NA', role: 'Chủ kèo', tone: '#d78c68' },
  { name: 'Minh Khang', initials: 'MK', role: 'Đã xác nhận', tone: '#6680ba' },
  { name: 'Thảo Vy', initials: 'TV', role: 'Đã xác nhận', tone: '#c7a85f' },
  { name: 'Quốc Duy', initials: 'QD', role: 'Đã xác nhận', tone: '#559480' },
  { name: 'Hà My', initials: 'HM', role: 'Đã xác nhận', tone: '#a16eb2' },
  { name: 'Tuấn Anh', initials: 'TA', role: 'Đã xác nhận', tone: '#5f93a6' }
];
