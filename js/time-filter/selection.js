import { RANGES } from './constants.js';
import { dateKey, dateLabel, today } from './dates.js';

export const selectionLabel = (selection) => {
  if (selection.scope === 'all') return 'Tất cả ngày';
  const range = RANGES.find((item) => item.key === selection.range) ||
    RANGES[0];
  return `${dateLabel(selection.dateKey)}, ${range.label.toLowerCase()}`;
};

export const normalizeSelection = (selection = {}) => {
  const current = dateKey(today());
  const next = selection.dateKey &&
    /^\d{4}-\d{2}-\d{2}$/.test(selection.dateKey)
    ? selection.dateKey
    : current;
  const scope = selection.scope || 'today';
  const range = RANGES.some((item) => item.key === selection.range)
    ? selection.range
    : 'all';
  return {
    scope,
    dateKey: next,
    range,
    label: selectionLabel({ scope, dateKey: next, range })
  };
};
