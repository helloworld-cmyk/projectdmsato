import '../../js/app-state/index.js';

const toast = document.querySelector('.toast');
let timer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

const store = window.MatchUpStore;

const voucherGrid = document.querySelector('#voucher-grid');
const voucherCount = document.querySelector('#voucher-count');
const escapeHtml = (value) => String(value ?? '').replace(
  /[&<>"']/g,
  (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char])
);

const renderVouchers = (filter = 'all') => {
  const vouchers = store.getVouchers().filter(
    (voucher) => filter === 'all' || voucher.category === filter
  );
  voucherCount.textContent = vouchers.length;
  voucherGrid.innerHTML = vouchers.length
    ? vouchers.map((voucher, index) => `<article class="voucher-card
      tone-${escapeHtml(voucher.tone)}
      ${index === 0 && filter === 'all' ? 'featured' : ''}">
        <div class="voucher-card-top">
          <span class="voucher-tag">
            ${escapeHtml(voucher.categoryLabel)}
          </span>
          <span class="voucher-card-icon">
            <span class="material-symbols-rounded">
              ${escapeHtml(voucher.icon)}
            </span>
          </span>
        </div>
        <div class="voucher-value">${escapeHtml(voucher.discountLabel)}</div>
        <h4>${escapeHtml(voucher.title)}</h4>
        <p>${escapeHtml(voucher.description)}</p>
        <div class="voucher-meta">
          <span>
            <span class="material-symbols-rounded">receipt_long</span>
            ${escapeHtml(voucher.condition)}
          </span>
          <span>
            <span class="material-symbols-rounded">schedule</span>
            ${escapeHtml(voucher.expires)}
          </span>
        </div>
        <div class="voucher-actions">
          <button
            class="copy-code"
            type="button"
            data-voucher-copy="${escapeHtml(voucher.code)}"
          >${escapeHtml(voucher.code)}</button>
          <a
            class="use-voucher"
            href="pages/booking/?voucher=${encodeURIComponent(voucher.id)}"
            data-voucher-use="${escapeHtml(voucher.id)}"
          >
            Dùng ngay
            <span class="material-symbols-rounded">arrow_forward</span>
          </a>
        </div>
      </article>`).join('')
    : '<div class="voucher-empty">Chưa có voucher trong nhóm này.</div>';
};

document.querySelectorAll('[data-voucher-filter]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-voucher-filter]').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    renderVouchers(tab.dataset.voucherFilter);
  });
});

voucherGrid.addEventListener('click', async (event) => {
  const copyButton = event.target.closest('[data-voucher-copy]');
  if (copyButton) {
    const code = copyButton.dataset.voucherCopy;
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Đã sao chép mã ${code}`);
    } catch {
      showToast(`Mã ưu đãi của bạn: ${code}`);
    }
    return;
  }

  const useButton = event.target.closest('[data-voucher-use]');
  if (useButton) {
    showToast('Voucher sẽ được kiểm tra lại theo sân và khung giờ bạn chọn.');
  }
});

renderVouchers();

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

document.querySelectorAll('.sport-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sport-tab').forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const sport = tab.textContent
      .trim()
      .replace(/^⚽ |^🏸 |^🎾 |^🏀 /, '')
      .replace('Tất cả', '');
    document.querySelectorAll('.match-card').forEach((card) => {
      card.style.display = !sport || card.dataset.sport === sport ? '' : 'none';
    });
  });
});

document.querySelectorAll('.date').forEach((date) => {
  date.addEventListener('click', () => {
    document.querySelectorAll('.date').forEach((item) => {
      item.classList.remove('active');
    });
    date.classList.add('active');
  });
});

document.querySelectorAll('.time').forEach((time) => {
  time.addEventListener('click', () => {
    document.querySelectorAll('.time').forEach((item) => {
      item.classList.remove('active');
    });
    time.classList.add('active');
    document.querySelector('.book-btn').textContent =
      `Giữ chỗ sân · ${time.textContent}`;
  });
});
