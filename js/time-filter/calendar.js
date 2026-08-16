import {
  LONG_DATE_FORMATTER,
  MONTH_FORMATTER
} from './constants.js';
import {
  addDays,
  dateKey,
  today
} from './dates.js';

const dateButtonMarkup = ({ day, key, month, currentDay, draft }) => {
  const outside = day.getMonth() !== month;
  const past = day < currentDay;
  const todayClass = key === dateKey(currentDay) ? ' today' : '';
  const selectedClass = draft.scope !== 'all' && key === draft.dateKey
    ? ' selected'
    : '';
  return [
    '<button type="button"',
    ` class="time-filter-day${outside ? ' muted' : ''}` +
      `${todayClass}${selectedClass}"`,
    ` data-time-date="${key}"`,
    past ? ' disabled' : '',
    ` aria-label="${LONG_DATE_FORMATTER.format(day)}"`,
    ` aria-pressed="${key === draft.dateKey}">`,
    `${day.getDate()}</button>`
  ].join('');
};

const updateActiveStates = (layer, draft) => {
  layer
    .querySelectorAll('[data-time-shortcut]')
    .forEach((button) => button.classList.toggle(
      'active',
      button.dataset.timeShortcut === draft.scope
    ));
  layer
    .querySelectorAll('[data-time-range]')
    .forEach((button) => button.classList.toggle(
      'active',
      button.dataset.timeRange === draft.range
    ));
};

export const renderCalendar = ({
  layer,
  days,
  monthLabel,
  viewDate,
  draft
}) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  monthLabel.textContent = MONTH_FORMATTER
    .format(viewDate)
    .replace(/^./, (character) => character.toUpperCase());

  const firstDay = new Date(year, month, 1);
  const firstGridDay = addDays(
    firstDay,
    -((firstDay.getDay() + 6) % 7)
  );
  const currentDay = today();
  days.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const day = addDays(firstGridDay, index);
    return dateButtonMarkup({
      day,
      key: dateKey(day),
      month,
      currentDay,
      draft
    });
  }).join('');
  updateActiveStates(layer, draft);
};
