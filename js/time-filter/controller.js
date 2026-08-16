import {
  dateForShortcut,
  dateKey,
  fromKey,
  shortcutForDate
} from './dates.js';
import { renderCalendar } from './calendar.js';
import { ensureModal } from './modal.js';
import { normalizeSelection } from './selection.js';

export const init = ({ trigger, initial, onApply } = {}) => {
  if (!trigger) return null;

  const layer = ensureModal();
  const days = layer.querySelector('[data-time-days]');
  const monthLabel = layer.querySelector('[data-time-month]');
  let current = normalizeSelection(initial);
  let draft = { ...current };
  let viewDate = fromKey(current.dateKey);
  let lastFocused = trigger;

  const updateTrigger = (selection) => {
    const label = trigger.querySelector('[data-time-filter-label]');
    if (label) label.textContent = selection.label;
    trigger.setAttribute('aria-label', `Thời gian: ${selection.label}`);
  };

  const render = () => renderCalendar({
    layer,
    days,
    monthLabel,
    viewDate,
    draft
  });

  const open = () => {
    draft = { ...current };
    viewDate = fromKey(draft.dateKey);
    lastFocused = document.activeElement || trigger;
    layer.classList.add('show');
    render();
    window.setTimeout(() => {
      layer.querySelector('[data-time-apply]')?.focus();
    }, 0);
  };

  const close = () => {
    layer.classList.remove('show');
    lastFocused?.focus?.();
  };

  const apply = () => {
    current = normalizeSelection({ ...draft, label: undefined });
    updateTrigger(current);
    onApply?.({ ...current });
    close();
  };

  const setSelection = (selection = {}) => {
    const next = { ...current, ...selection };
    if (
      selection.scope &&
      selection.scope !== 'all' &&
      selection.scope !== 'custom'
    ) {
      next.dateKey = dateKey(dateForShortcut(selection.scope));
    }
    current = normalizeSelection({ ...next, label: undefined });
    updateTrigger(current);
  };

  const handleShortcut = (shortcut) => {
    draft.scope = shortcut.dataset.timeShortcut;
    if (draft.scope !== 'all') {
      draft.dateKey = dateKey(dateForShortcut(draft.scope));
    }
    viewDate = fromKey(draft.dateKey);
    render();
  };

  const handleDate = (dateButton) => {
    if (dateButton.disabled) return;
    draft.dateKey = dateButton.dataset.timeDate;
    draft.scope = shortcutForDate(draft.dateKey);
    render();
  };

  const handleLayerClick = (event) => {
    if (
      event.target === layer ||
      event.target.closest('[data-time-close]') ||
      event.target.closest('[data-time-cancel]')
    ) {
      close();
      return;
    }

    const shortcut = event.target.closest('[data-time-shortcut]');
    if (shortcut) {
      handleShortcut(shortcut);
      return;
    }

    const range = event.target.closest('[data-time-range]');
    if (range) {
      draft.range = range.dataset.timeRange;
      render();
      return;
    }

    const dateButton = event.target.closest('[data-time-date]');
    if (dateButton) {
      handleDate(dateButton);
      return;
    }

    if (event.target.closest('[data-time-prev]')) {
      viewDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() - 1,
        1
      );
      render();
      return;
    }

    if (event.target.closest('[data-time-next]')) {
      viewDate = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        1
      );
      render();
      return;
    }

    if (event.target.closest('[data-time-apply]')) apply();
  };

  trigger.addEventListener('click', open);
  layer.addEventListener('click', handleLayerClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && layer.classList.contains('show')) close();
  });
  updateTrigger(current);

  return {
    open,
    close,
    getSelection: () => ({ ...current }),
    setSelection
  };
};
