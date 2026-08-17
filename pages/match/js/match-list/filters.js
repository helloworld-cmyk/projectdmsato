import {
  DISTANCE_MAX,
  DISTANCE_MIN,
  DISTANCE_STEP,
  PRICE_MAX,
  PRICE_MIN,
  daySlots,
  distances,
  levels,
  requestedDate,
  requestedLocation,
  requestedTimeRange,
  requestedTimeScope,
  sortDescriptions,
  sportCatalog,
  store
} from '../core/constants.js';
import {
  createMatch,
  customMatchesForDate,
  decorateMatches,
  matches
} from '../core/data.js';
import { dom, state } from '../core/state.js';
import {
  currentLocationLabel,
  formatDistance,
  money,
  playerClass,
  safe,
  sportClass,
  slotMinutes
} from '../core/utils.js';
import { showToast } from '../core/toast.js';
import { openPremiumUpsell } from '../core/premium-upsell.js';

let timeFilter;

export function getTimeFilter() {
  return timeFilter;
}

export function syncTimeChips(value) {
  document.querySelectorAll('.chip[data-filter="time"]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === value);
  });
}

export function syncDistanceRange() {
  state.distanceMin = Math.max(
    DISTANCE_MIN,
    Math.min(Number(state.distanceMin), DISTANCE_MAX - DISTANCE_STEP)
  );
  state.distanceMax = Math.min(
    DISTANCE_MAX,
    Math.max(Number(state.distanceMax), DISTANCE_MIN + DISTANCE_STEP)
  );
  if (state.distanceMin > state.distanceMax - DISTANCE_STEP) {
    state.distanceMin = state.distanceMax - DISTANCE_STEP;
  }
  dom.distanceMinInput.value = state.distanceMin;
  dom.distanceMaxInput.value = state.distanceMax;
  dom.distanceMinLabel.textContent = `${formatDistance(state.distanceMin)} km`;
  dom.distanceMaxLabel.textContent = `${formatDistance(state.distanceMax)} km`;
  dom.distanceSlider.style.setProperty(
    '--range-start',
    `${state.distanceMin / DISTANCE_MAX * 100}%`
  );
  dom.distanceSlider.style.setProperty(
    '--range-end',
    `${state.distanceMax / DISTANCE_MAX * 100}%`
  );
}

export function syncPrice() {
  document.querySelector('#price-min-label').textContent = priceLabel(state.priceMin);
  document.querySelector('#price-max-label').textContent = priceLabel(state.priceMax);
  document.querySelector('#price-min').value = state.priceMin;
  document.querySelector('#price-max').value = state.priceMax;
}

function priceLabel(value) {
  return `${Math.round(value / 1000)}k`;
}

function allMatches() {
  const custom = state.time.startsWith('date:')
    ? customMatchesForDate(state.time.slice(5))
    : [];
  const created = store.getCustomMatches().filter(match => match.status !== 'cancelled');
  return [...custom, ...created, ...matches];
}

export function findMatch(matchId) {
  return allMatches().find(match => match.id === matchId);
}

export function applicationFor(matchId) {
  return store.getApplications().find(application => application.matchId === matchId);
}

export function insightFor(item) {
  return store.getMatchInsights(item);
}

function compareMatches(a, b) {
  if (a.featured !== b.featured) return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  if (state.sort === 'distance') return a.distance - b.distance || b.score - a.score;
  if (state.sort === 'time') return a.timeOrder - b.timeOrder || a.distance - b.distance;
  if (state.sort === 'price') return a.share - b.share || a.distance - b.distance;
  return b.score - a.score || a.distance - b.distance;
}

function timeRangeMatches(item) {
  if (state.timeRange === 'all') return true;
  const start = Number.isFinite(Number(item.startMinutes))
    ? Number(item.startMinutes)
    : slotMinutes(item.time || '00:00');
  if (state.timeRange === 'morning') return start < 12 * 60;
  if (state.timeRange === 'afternoon') return start >= 12 * 60 && start < 18 * 60;
  if (state.timeRange === 'evening') return start >= 18 * 60;
  return true;
}

const scopeLabels = {
  today: 'hôm nay',
  tomorrow: 'ngày mai',
  'next-week': 'tuần sau',
  weekend: 'cuối tuần',
  all: 'hôm nay',
  date: 'ngày đã chọn'
};

function slotsForRange(timeRange) {
  const all = daySlots.map((slot, index) => ({
    slot,
    index,
    start: slotMinutes(slot)
  }));
  if (timeRange === 'morning') return all.filter(item => item.start < 12 * 60);
  if (timeRange === 'afternoon') {
    return all.filter(item => item.start >= 12 * 60 && item.start < 18 * 60);
  }
  if (timeRange === 'evening') return all.filter(item => item.start >= 18 * 60);
  return all;
}

function generateFillers(count, excludeIds) {
  const candidates = slotsForRange(state.timeRange);
  if (candidates.length === 0 || count <= 0) return [];
  const sports = state.sport === 'all'
    ? Object.keys(sportCatalog)
    : [state.sport];
  const scopeKey = state.time.startsWith('date:') ? 'date' : state.time;
  const dateKey = state.time.startsWith('date:') ? state.time.slice(5) : '';
  const timeObj = { key: scopeKey, label: scopeLabels[scopeKey] || '' };
  const used = new Set(excludeIds);
  const priceSpan = Math.max(10000, state.priceMax - state.priceMin);
  const priceSteps = Math.max(1, Math.floor(priceSpan / 10000));
  const distanceCandidates = distances.filter(
    value => value >= state.distanceMin && value <= state.distanceMax
  );
  const fillers = [];
  for (let index = 0; index < count; index += 1) {
    const slotInfo = candidates[
      Math.round(index * (candidates.length - 1) / Math.max(1, count - 1))
    ];
    const sport = sports[index % sports.length];
    const detail = sportCatalog[sport];
    const sportIndex = Object.keys(sportCatalog).indexOf(sport);
    const level = state.level === 'all' ? levels[index % levels.length] : state.level;
    const levelIndex = levels.indexOf(level);
    const venueIndex = index % detail.venues.length;
    const match = createMatch({
      sport,
      detail,
      sportIndex,
      time: timeObj,
      timeIndex: 0,
      slot: slotInfo.slot,
      slotIndex: slotInfo.index,
      venueIndex,
      level,
      levelIndex,
      dateKey
    });
    match.distance = distanceCandidates.length
      ? distanceCandidates[index % distanceCandidates.length]
      : Math.min(
        state.distanceMax,
        Math.max(state.distanceMin, distances[index % distances.length])
      );
    const share = state.priceMin + ((index % (priceSteps + 1)) * 10000);
    match.fee = match.capacity * share;
    match.startMinutes = slotInfo.start;
    match.timeOrder = slotInfo.start;
    match.id = `filler-${sport}-${scopeKey}-${slotInfo.index}-${levelIndex}-${index}`;
    if (!used.has(match.id)) {
      used.add(match.id);
      fillers.push(match);
    }
  }
  decorateMatches(fillers);
  return fillers;
}

function selectBalanced(items) {
  if (items.length <= 8) {
    if (items.length < 8) {
      const fillers = generateFillers(8 - items.length, items.map(item => item.id));
      return [...items, ...fillers];
    }
    return items;
  }
  const groups = items.reduce((result, item) => {
    const key = Number(item.startMinutes) || 0;
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(item);
    return result;
  }, new Map());
  const buckets = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  if (buckets.length < 8) return items.slice(0, 8);
  const selected = [];
  const selectedIds = new Set();
  for (let index = 0; index < 8; index += 1) {
    const bucketIndex = Math.round(index * (buckets.length - 1) / 7);
    const candidate = buckets[bucketIndex][1].find(
      item => !selectedIds.has(item.id)
    );
    if (candidate) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }
  return [
    ...selected,
    ...items.filter(item => !selectedIds.has(item.id))
  ].slice(0, 8);
}

const sportImages = {
  football: [
    'https://images.unsplash.com/photo-1556962021-9d0303621643?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1634114441919-7636abb21cae?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1755993071218-91e315259902?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1660926655800-3d11219f390d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1672487566446-63dfd8ff49c8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1598196333385-a2afddfafd67?auto=format&fit=crop&w=1200&q=80'
  ],
  badminton: [
    'https://images.unsplash.com/photo-1720515226352-b0b1dec6813b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1729166241032-5b339506a0d7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1732955365693-fbd795199803?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1718452739586-5b467f1f109b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1722003180803-577efd6d2ecc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1721760886493-61c47c1caec9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1721760887421-5f8d04fd8c19?auto=format&fit=crop&w=1200&q=80'
  ],
  pickleball: [
    'https://images.unsplash.com/photo-1737229495515-53f1eaee5c16?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1737476997205-b3336182f215?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1755755178676-9ecd95514c1f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1737477003413-285d443f7fde?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1693142518176-c43bad2eb5fc?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1737476990369-9cf356085909?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1693142517898-2f986215e412?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1665855031742-a87f5964adf1?auto=format&fit=crop&w=1200&q=80'
  ],
  basketball: [
    'https://images.unsplash.com/photo-1752166672322-f9ea3086684e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1752166670640-8db04fa49cb2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1585072064801-152a92dabef9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1721750476164-1fc2d260db31?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1721750476593-437e0c7c337b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584986161151-55363a10d7c9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1638569794984-d47b2983c1c6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1602105320811-f504e5ff5011?auto=format&fit=crop&w=1200&q=80'
  ]
};

function joinShareFor(item) {
  return Math.floor(
    (Number(item.fee) || 0) / Math.max(1, (item.participants || []).length + 1)
  );
}

function cardImageFor(item) {
  const images = sportImages[item.sport];
  if (!images || !images.length) return '';
  let hash = 0;
  for (let index = 0; index < item.id.length; index += 1) {
    hash = (hash * 31 + item.id.charCodeAt(index)) >>> 0;
  }
  return images[hash % images.length];
}

function renderMatchCard(item) {
  const application = applicationFor(item.id);
  const insight = insightFor(item);
  const saved = store.isMatchSaved(item.id);
  const paymentReady = application
    && application.paymentStatus !== 'paid'
    && ['accepted', 'payment_pending'].includes(application.status);
  const joinedApplication = application
    && ['accepted', 'paid'].includes(application.status)
    && !paymentReady;
  const awaitingApproval = item.joinRules?.autoApprove || item.demoHostApproval;
  const pendingSeconds = application && application.status === 'pending'
    && awaitingApproval
    && application.approvalEligible
    ? Math.max(
      0,
      10 - Math.floor((Date.now() - (Number(application.createdAt) || Date.now())) / 1000)
    )
    : 0;
  const joinLabel = item.custom
    ? 'Mời thêm'
    : joinedApplication
      ? 'Mời thêm'
      : paymentReady
        ? 'Thanh toán'
        : application
            ? application.status === 'pending' && application.paymentStatus === 'paid'
            ? 'Đã thanh toán · chờ duyệt'
            : application.status === 'pending'
              ? awaitingApproval
                && application.approvalEligible
                ? `Đã gửi · ${pendingSeconds}s`
                : application.approvalEligible
                  ? 'Đã gửi · chờ chủ kèo'
                  : 'Chưa đủ tiêu chí'
              : application.status === 'paid'
                ? 'Đã vào kèo'
                : 'Không được duyệt'
          : 'Xin vào';
  const disabled = !item.custom && !paymentReady && !joinedApplication && !!application;
  const paymentAttribute = paymentReady
    ? ` data-payment-application="${safe(application.id)}"`
    : '';
  const inviteAttribute = (item.custom || joinedApplication)
    ? ` data-invite-match="${safe(item.id)}"`
    : '';
  const participants = item.participants.slice(0, 3).map((player, index) => (
    `<span class="member ${playerClass(index)}">${safe(player.initials)}</span>`
  )).join('');
  const reasons = insight.reasons.slice(0, 2).map(reason => (
    `<span>${safe(reason)}</span>`
  )).join('');
  const ruleTags = `
    <span class="tag ${item.joinRules?.autoApprove ? 'auto' : 'manual'}">
      ${item.joinRules?.autoApprove ? '⚡ Tự động duyệt' : '⏳ Chờ chủ kèo duyệt'}
    </span>
    <span class="tag ${item.joinRules?.requirePaymentBeforeJoin ? 'payfirst' : 'gray'}">
      ${item.joinRules?.requirePaymentBeforeJoin ? '💳 Đóng tiền trước' : '💳 Thanh toán sau'}
    </span>
  `;

  return `
    <article class="match-card ${saved ? 'is-saved' : ''}" data-id="${item.id}"
      style="background-image:url('${cardImageFor(item)}')">
      <div class="card-top">
        <span class="sport-mark ${sportClass(item.sport)}">${item.emoji}</span>
        ${item.featured ? '<span class="featured-badge"><span class="material-symbols-rounded">workspace_premium</span> Nổi bật</span>' : ''}
        <button class="match-score" data-insight-id="${item.id}"
          aria-label="Vì sao kèo này hợp với bạn">
          <strong>${insight.score}%</strong> hợp với bạn
          <span class="material-symbols-rounded">info</span>
        </button>
      </div>
      <h3>${safe(item.name)}</h3>
      <div class="tags">
        <span class="tag">${safe(item.level).toUpperCase()}</span>
        <span class="tag gray">${safe(item.format)}</span>
        ${ruleTags}
      </div>
      <div class="match-reasons">${reasons}</div>
      <div class="card-info">
        <div>
          <span class="material-symbols-rounded">schedule</span>
          ${safe(item.time)}
        </div>
        <div>
          <span class="material-symbols-rounded">location_on</span>
          ${safe(item.venue)}, ${safe(item.area)} ·
          ${Number(item.distance).toFixed(1).replace('.', ',')} km
        </div>
      </div>
      <div class="card-cost">
        <span class="material-symbols-rounded">payments</span>
        ${money(joinShareFor(item))}/người
      </div>
      <div class="card-bottom">
        <div class="members">
          ${participants}
          <span>${item.participants.length} người</span>
        </div>
        <div class="card-actions">
          <button class="view-details" data-id="${item.id}">Xem kèo</button>
          <button class="join" data-id="${item.id}"${paymentAttribute}${inviteAttribute}
            ${disabled ? 'disabled' : ''}>${joinLabel}</button>
        </div>
      </div>
    </article>
  `;
}

export function renderMatches() {
  const visible = selectBalanced(allMatches().filter(item => {
    const matchesDate = state.time === 'all'
      || (state.time.startsWith('date:')
        ? item.dateKey === state.time.slice(5)
        : item.timeKey === state.time);
    const qualityMatch = state.quality !== 'trusted'
      || insightFor(item).host.reliability >= 90;
    return (state.sport === 'all' || item.sport === state.sport)
      && matchesDate
      && timeRangeMatches(item)
      && (state.level === 'all' || item.level === state.level)
      && qualityMatch
      && item.share >= state.priceMin
      && item.share <= state.priceMax
      && item.distance >= state.distanceMin
      && item.distance <= state.distanceMax;
  }).sort(compareMatches));

  dom.grid.innerHTML = visible.map(renderMatchCard).join('');
  document.querySelector('#match-count').textContent = visible.length;
  document.querySelector('#result-note').textContent =
    `${visible.length} kèo trong khoảng ${formatDistance(state.distanceMin)}`
    + `–${formatDistance(state.distanceMax)} km từ ${currentLocationLabel(requestedLocation)}`;
  document.querySelector('#sort-description').textContent = sortDescriptions[state.sort];
  dom.empty.classList.toggle('show', visible.length === 0);
}

function updateDistanceFromInput(type, value) {
  if (type === 'min') {
    state.distanceMin = Math.min(Number(value), state.distanceMax - DISTANCE_STEP);
  } else {
    state.distanceMax = Math.max(Number(value), state.distanceMin + DISTANCE_STEP);
  }
  syncDistanceRange();
  renderMatches();
}

function updatePrice(type, value) {
  if (type === 'min') {
    state.priceMin = Math.min(Number(value), state.priceMax - 10000);
  } else {
    state.priceMax = Math.max(Number(value), state.priceMin + 10000);
  }
  syncPrice();
  renderMatches();
}

export function initFilters() {
  const priceGroup = document.createElement('div');
  priceGroup.className = 'filter-group';
  priceGroup.innerHTML = `
    <div class="filter-label">
      <span class="material-symbols-rounded">payments</span>Giá / người
    </div>
    <div class="distance-range">
      <div class="distance-values">
        <output id="price-min-label">10k</output>
        <span>đến</span>
        <output id="price-max-label">500k</output>
      </div>
      <div class="range-slider">
        <input id="price-min" type="range" min="10000" max="500000"
          step="10000" value="10000" aria-label="Giá tối thiểu">
        <input id="price-max" type="range" min="10000" max="500000"
          step="10000" value="500000" aria-label="Giá tối đa">
      </div>
    </div>
    <p class="hint">Phí chia dự kiến cho mỗi người.</p>
  `;
  document.querySelector('.filter-panel').append(priceGroup);

  timeFilter = window.MatchUpTimeFilter.init({
    trigger: document.querySelector('[data-time-filter-trigger]'),
    initial: {
      scope: requestedTimeScope === 'custom' && requestedDate ? 'custom' : requestedTimeScope,
      dateKey: requestedDate || undefined,
      range: requestedTimeRange
    },
    onApply: selection => {
      state.time = selection.scope === 'custom'
        ? `date:${selection.dateKey}`
        : selection.scope;
      state.timeRange = selection.range || 'all';
      syncTimeChips(state.time);
      renderMatches();
      showToast(`Đã lọc theo ${selection.label}`);
    }
  });

  document.querySelectorAll('.chip[data-filter="sport"]').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === state.sport);
  });
  syncTimeChips(state.time);

  document.querySelector('#price-min').addEventListener('input', event => {
    updatePrice('min', event.target.value);
  });
  document.querySelector('#price-max').addEventListener('input', event => {
    updatePrice('max', event.target.value);
  });
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.filter;
      state[type] = chip.dataset.value;
      chip.closest('.filter-group').querySelectorAll('.chip').forEach(item => {
        item.classList.remove('active');
      });
      chip.classList.add('active');
      if (type === 'time') {
        state.timeRange = 'all';
        timeFilter.setSelection({ scope: chip.dataset.value, range: 'all' });
      }
      renderMatches();
    });
  });

  document.querySelectorAll('.chip[data-premium-filter="quality"]').forEach(chip => {
    chip.addEventListener('click', () => {
      const value = chip.dataset.value;
      if (value === 'trusted' && !store.isPremium()) {
        showToast('Bộ lọc Chất lượng đội dành riêng cho thành viên Premium.');
        openPremiumUpsell();
        return;
      }
      state.quality = value;
      chip.closest('.filter-group').querySelectorAll('.chip').forEach(item => {
        item.classList.remove('active');
      });
      chip.classList.add('active');
      renderMatches();
    });
  });

  dom.distanceMinInput.addEventListener('input', event => {
    updateDistanceFromInput('min', event.target.value);
  });
  dom.distanceMaxInput.addEventListener('input', event => {
    updateDistanceFromInput('max', event.target.value);
  });

  const sortSelect = document.querySelector('#sort-matches');
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    renderMatches();
    showToast(sortDescriptions[state.sort]);
  });
  document.querySelector('#reset').addEventListener('click', () => {
    Object.assign(state, {
      sport: 'all',
      time: 'all',
      timeRange: 'all',
      level: 'all',
      quality: 'all',
      priceMin: PRICE_MIN,
      priceMax: PRICE_MAX,
      distanceMin: DISTANCE_MIN,
      distanceMax: DISTANCE_MAX,
      sort: 'recommended'
    });
    timeFilter.setSelection({ scope: 'all', range: 'all' });
    sortSelect.value = 'recommended';
    syncDistanceRange();
    syncPrice();
    document.querySelectorAll('.chip[data-filter]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.value === 'all');
    });
    document.querySelectorAll('.chip[data-premium-filter]').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.value === 'all');
    });
    renderMatches();
    showToast('Đã đặt lại bộ lọc và sắp xếp');
  });
}

export { allMatches };
