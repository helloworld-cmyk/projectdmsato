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

const premiumBanner = document.querySelector('#premium-banner');
const premiumBannerCta = document.querySelector('#premium-banner-cta');

function syncPremiumBanner() {
  if (!premiumBanner) return;
  const premium = store.isPremium();
  premiumBanner.classList.toggle('active', premium);
  document.querySelector('#premium-banner-text').textContent = premium
    ? 'Bạn đang là thành viên Premium — cảm ơn đã đồng hành cùng MatchUp!'
    : 'Xin vào kèo không giới hạn, voucher 30.000đ mỗi tháng, giữ sân 30 phút, tích điểm x2 và kèo nổi bật.';
  premiumBannerCta.textContent = premium ? 'Quản lý gói' : 'Nâng cấp · 60.000đ/tháng';
}

premiumBannerCta?.addEventListener('click', () => {
  location.href = 'pages/profile/?premium=1';
});

syncPremiumBanner();
document.addEventListener('matchup:state-change', syncPremiumBanner);

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
  const premium = store.isPremium();
  const vouchers = store.getVouchers().filter(
    (voucher) => filter === 'all' || voucher.category === filter
  );
  voucherCount.textContent = vouchers.length;
  voucherGrid.innerHTML = vouchers.length
    ? vouchers.map((voucher, index) => {
      const premiumLocked = voucher.requiresPremium && !premium;
      return `<article class="voucher-card
      tone-${escapeHtml(voucher.tone)}
      ${premiumLocked ? 'premium-locked' : ''}
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
          ${premiumLocked
            ? `<button class="voucher-upgrade" type="button" data-voucher-upgrade="${escapeHtml(voucher.id)}">
              <span class="material-symbols-rounded">workspace_premium</span>
              Nâng cấp Premium
            </button>`
            : `<button
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
          </a>`}
        </div>
      </article>`;
    }).join('')
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
  const upgradeButton = event.target.closest('[data-voucher-upgrade]');
  if (upgradeButton) {
    showToast('Voucher này dành riêng cho thành viên Premium.');
    location.href = 'pages/profile/?premium=1';
    return;
  }

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
