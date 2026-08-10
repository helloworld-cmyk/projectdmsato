(function () {
  const DAY = 86400000;
  const weekdayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const monthFormatter = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
  const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric' });
  const longDateFormatter = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
  const ranges = [
    { key: 'all', label: 'Cả ngày' },
    { key: 'morning', label: 'Buổi sáng' },
    { key: 'afternoon', label: 'Buổi chiều' },
    { key: 'evening', label: 'Sau 18:00' }
  ];
  const shortcuts = [
    { key: 'all', label: 'Tất cả ngày' },
    { key: 'today', label: 'Hôm nay' },
    { key: 'tomorrow', label: 'Ngày mai' },
    { key: 'weekend', label: 'Cuối tuần này' },
    { key: 'next-week', label: 'Tuần sau' }
  ];

  const pad = (number) => String(number).padStart(2, '0');
  const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const addDays = (date, count) => new Date(date.getTime() + count * DAY);
  const dateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const fromKey = (key) => {
    const [year, month, day] = String(key).split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const today = () => startOfDay(new Date());
  const mondayOf = (date) => addDays(date, -((date.getDay() + 6) % 7));
  const dateForShortcut = (key) => {
    const current = today();
    if (key === 'today') return current;
    if (key === 'tomorrow') return addDays(current, 1);
    if (key === 'weekend') return addDays(mondayOf(current), 5);
    if (key === 'next-week') return addDays(mondayOf(current), 7);
    return current;
  };
  const shortcutForDate = (key) => shortcuts.find((shortcut) => shortcut.key !== 'all' && dateKey(dateForShortcut(shortcut.key)) === key)?.key || 'custom';
  const dateLabel = (key) => {
    const currentKey = dateKey(today());
    const tomorrowKey = dateKey(addDays(today(), 1));
    if (key === currentKey) return 'Hôm nay';
    if (key === tomorrowKey) return 'Ngày mai';
    return longDateFormatter.format(fromKey(key)).replace(/^./, (character) => character.toUpperCase());
  };
  const selectionLabel = (selection) => {
    if (selection.scope === 'all') return 'Tất cả ngày';
    const range = ranges.find((item) => item.key === selection.range) || ranges[0];
    return `${dateLabel(selection.dateKey)}, ${range.label.toLowerCase()}`;
  };
  const normalize = (selection = {}) => {
    const current = dateKey(today());
    const next = selection.dateKey && /^\d{4}-\d{2}-\d{2}$/.test(selection.dateKey) ? selection.dateKey : current;
    const scope = selection.scope || 'today';
    const range = ranges.some((item) => item.key === selection.range) ? selection.range : 'all';
    return { scope, dateKey: next, range, label: selectionLabel({ scope, dateKey: next, range }) };
  };

  const ensureModal = () => {
    let layer = document.querySelector('#time-filter-modal');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.className = 'time-filter-layer';
    layer.id = 'time-filter-modal';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-labelledby', 'time-filter-title');
    layer.innerHTML = `<div class="time-filter-modal">
      <div class="time-filter-head">
        <div class="time-filter-heading"><span class="material-symbols-rounded">calendar_month</span><div><h2 id="time-filter-title">Chọn thời gian</h2><p>Lọc theo ngày và khung giờ bạn muốn chơi</p></div></div>
        <button class="time-filter-close" type="button" data-time-close aria-label="Đóng"><span class="material-symbols-rounded">close</span></button>
      </div>
      <div class="time-filter-shortcuts" aria-label="Chọn nhanh ngày">${shortcuts.map((shortcut) => `<button type="button" data-time-shortcut="${shortcut.key}">${shortcut.label}</button>`).join('')}</div>
      <div class="time-filter-calendar"><div class="time-filter-month"><div class="time-filter-month-nav"><button type="button" data-time-prev aria-label="Tháng trước"><span class="material-symbols-rounded">chevron_left</span></button><button type="button" data-time-next aria-label="Tháng sau"><span class="material-symbols-rounded">chevron_right</span></button></div><strong data-time-month></strong><span aria-hidden="true" style="width:29px"></span></div><div class="time-filter-weekdays">${weekdayNames.map((day) => `<span>${day}</span>`).join('')}</div><div class="time-filter-days" data-time-days></div>
        <div class="time-filter-range"><div class="time-filter-range-head"><strong>Khung giờ</strong><span>Có thể đổi sau khi chọn ngày</span></div><div class="time-filter-range-options" aria-label="Chọn khung giờ">${ranges.map((range) => `<button type="button" data-time-range="${range.key}">${range.label}</button>`).join('')}</div></div>
      </div>
      <div class="time-filter-actions"><button class="time-filter-cancel" type="button" data-time-cancel>Hủy</button><button class="time-filter-apply" type="button" data-time-apply>Áp dụng bộ lọc</button></div>
    </div>`;
    document.body.appendChild(layer);
    return layer;
  };

  const init = ({ trigger, initial, onApply } = {}) => {
    if (!trigger) return null;
    const layer = ensureModal();
    const days = layer.querySelector('[data-time-days]');
    const monthLabel = layer.querySelector('[data-time-month]');
    let current = normalize(initial);
    let draft = { ...current };
    let viewDate = fromKey(current.dateKey);
    let lastFocused = trigger;

    const updateTrigger = (selection) => {
      const label = trigger.querySelector('[data-time-filter-label]');
      if (label) label.textContent = selection.label;
      trigger.setAttribute('aria-label', `Thời gian: ${selection.label}`);
    };
    const renderCalendar = () => {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      monthLabel.textContent = monthFormatter.format(viewDate).replace(/^./, (character) => character.toUpperCase());
      const firstDay = new Date(year, month, 1);
      const firstGridDay = addDays(firstDay, -((firstDay.getDay() + 6) % 7));
      const currentDay = today();
      days.innerHTML = Array.from({ length: 42 }, (_, index) => {
        const day = addDays(firstGridDay, index);
        const key = dateKey(day);
        const outside = day.getMonth() !== month;
        const past = day < currentDay;
        const todayClass = key === dateKey(currentDay) ? ' today' : '';
        const selectedClass = draft.scope !== 'all' && key === draft.dateKey ? ' selected' : '';
        return `<button type="button" class="time-filter-day${outside ? ' muted' : ''}${todayClass}${selectedClass}" data-time-date="${key}" ${past ? 'disabled' : ''} aria-label="${longDateFormatter.format(day)}" aria-pressed="${key === draft.dateKey}">${day.getDate()}</button>`;
      }).join('');
      layer.querySelectorAll('[data-time-shortcut]').forEach((button) => button.classList.toggle('active', button.dataset.timeShortcut === draft.scope));
      layer.querySelectorAll('[data-time-range]').forEach((button) => button.classList.toggle('active', button.dataset.timeRange === draft.range));
    };
    const open = () => {
      draft = { ...current };
      viewDate = fromKey(draft.dateKey);
      lastFocused = document.activeElement || trigger;
      layer.classList.add('show');
      renderCalendar();
      window.setTimeout(() => layer.querySelector('[data-time-apply]')?.focus(), 0);
    };
    const close = () => {
      layer.classList.remove('show');
      lastFocused?.focus?.();
    };
    const apply = () => {
      current = normalize({ ...draft, label: undefined });
      updateTrigger(current);
      onApply?.({ ...current });
      close();
    };
    const setSelection = (selection) => {
      const next = { ...current, ...selection };
      if (selection?.scope && selection.scope !== 'all' && selection.scope !== 'custom') next.dateKey = dateKey(dateForShortcut(selection.scope));
      current = normalize({ ...next, label: undefined });
      updateTrigger(current);
    };
    trigger.addEventListener('click', open);
    layer.addEventListener('click', (event) => {
      if (event.target === layer || event.target.closest('[data-time-close]') || event.target.closest('[data-time-cancel]')) { close(); return; }
      const shortcut = event.target.closest('[data-time-shortcut]');
      if (shortcut) {
        draft.scope = shortcut.dataset.timeShortcut;
        if (draft.scope !== 'all') draft.dateKey = dateKey(dateForShortcut(draft.scope));
        viewDate = fromKey(draft.dateKey);
        renderCalendar();
        return;
      }
      const range = event.target.closest('[data-time-range]');
      if (range) { draft.range = range.dataset.timeRange; renderCalendar(); return; }
      const dateButton = event.target.closest('[data-time-date]');
      if (dateButton && !dateButton.disabled) {
        draft.dateKey = dateButton.dataset.timeDate;
        draft.scope = shortcutForDate(draft.dateKey);
        renderCalendar();
        return;
      }
      if (event.target.closest('[data-time-prev]')) { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); renderCalendar(); return; }
      if (event.target.closest('[data-time-next]')) { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); renderCalendar(); return; }
      if (event.target.closest('[data-time-apply]')) apply();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && layer.classList.contains('show')) close(); });
    updateTrigger(current);
    return { open, close, getSelection: () => ({ ...current }), setSelection };
  };

  window.MatchUpTimeFilter = { init, dateKey, dateLabel };
})();
