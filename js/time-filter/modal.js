import {
  RANGES,
  SHORTCUTS,
  WEEKDAY_NAMES
} from './constants.js';

const shortcutMarkup = () => SHORTCUTS.map((shortcut) => [
  `<button type="button" data-time-shortcut="${shortcut.key}">`,
  `${shortcut.label}</button>`
].join('')).join('');

const rangeMarkup = () => RANGES.map((range) => [
  '<button type="button"',
  ` data-time-range="${range.key}">`,
  `${range.label}</button>`
].join('')).join('');

const weekdayMarkup = () => WEEKDAY_NAMES
  .map((day) => `<span>${day}</span>`)
  .join('');

const modalMarkup = () => `
  <div class="time-filter-modal">
    <div class="time-filter-head">
      <div class="time-filter-heading">
        <span class="material-symbols-rounded">calendar_month</span>
        <div>
          <h2 id="time-filter-title">Chọn thời gian</h2>
          <p>Lọc theo ngày và khung giờ bạn muốn chơi</p>
        </div>
      </div>
      <button
        class="time-filter-close"
        type="button"
        data-time-close
        aria-label="Đóng"
      >
        <span class="material-symbols-rounded">close</span>
      </button>
    </div>
    <div
      class="time-filter-shortcuts"
      aria-label="Chọn nhanh ngày"
    >
      ${shortcutMarkup()}
    </div>
    <div class="time-filter-calendar">
      <div class="time-filter-month">
        <div class="time-filter-month-nav">
          <button
            type="button"
            data-time-prev
            aria-label="Tháng trước"
          >
            <span class="material-symbols-rounded">chevron_left</span>
          </button>
          <button
            type="button"
            data-time-next
            aria-label="Tháng sau"
          >
            <span class="material-symbols-rounded">chevron_right</span>
          </button>
        </div>
        <strong data-time-month></strong>
        <span aria-hidden="true" style="width:29px"></span>
      </div>
      <div class="time-filter-weekdays">
        ${weekdayMarkup()}
      </div>
      <div class="time-filter-days" data-time-days></div>
      <div class="time-filter-range">
        <div class="time-filter-range-head">
          <strong>Khung giờ</strong>
          <span>Có thể đổi sau khi chọn ngày</span>
        </div>
        <div
          class="time-filter-range-options"
          aria-label="Chọn khung giờ"
        >
          ${rangeMarkup()}
        </div>
      </div>
    </div>
    <div class="time-filter-actions">
      <button
        class="time-filter-cancel"
        type="button"
        data-time-cancel
      >
        Hủy
      </button>
      <button
        class="time-filter-apply"
        type="button"
        data-time-apply
      >
        Áp dụng bộ lọc
      </button>
    </div>
  </div>`;

export const ensureModal = () => {
  let layer = document.querySelector('#time-filter-modal');
  if (layer) return layer;

  layer = document.createElement('div');
  layer.className = 'time-filter-layer';
  layer.id = 'time-filter-modal';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'time-filter-title');
  layer.innerHTML = modalMarkup();
  document.body.appendChild(layer);
  return layer;
};
