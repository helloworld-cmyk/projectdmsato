import {
  DAY,
  LONG_DATE_FORMATTER,
  SHORTCUTS
} from './constants.js';

export const pad = (number) => String(number).padStart(2, '0');

export const startOfDay = (date) => new Date(
  date.getFullYear(),
  date.getMonth(),
  date.getDate()
);

export const addDays = (date, count) => new Date(
  date.getTime() + count * DAY
);

export const dateKey = (date) => [
  date.getFullYear(),
  pad(date.getMonth() + 1),
  pad(date.getDate())
].join('-');

export const fromKey = (key) => {
  const [year, month, day] = String(key).split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const today = () => startOfDay(new Date());

export const mondayOf = (date) => addDays(
  date,
  -((date.getDay() + 6) % 7)
);

export const dateForShortcut = (key) => {
  const current = today();
  if (key === 'today') return current;
  if (key === 'tomorrow') return addDays(current, 1);
  if (key === 'weekend') return addDays(mondayOf(current), 5);
  if (key === 'next-week') return addDays(mondayOf(current), 7);
  return current;
};

export const shortcutForDate = (key) => SHORTCUTS.find(
  (shortcut) => shortcut.key !== 'all' &&
    dateKey(dateForShortcut(shortcut.key)) === key
)?.key || 'custom';

export const dateLabel = (key) => {
  const currentKey = dateKey(today());
  const tomorrowKey = dateKey(addDays(today(), 1));
  if (key === currentKey) return 'Hôm nay';
  if (key === tomorrowKey) return 'Ngày mai';
  return LONG_DATE_FORMATTER
    .format(fromKey(key))
    .replace(/^./, (character) => character.toUpperCase());
};
