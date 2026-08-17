import { store } from '../state.js';
import { escape } from '../utils.js';

const benefits = [
  { icon: 'all_inclusive', title: 'Xin vào kèo không giới hạn', copy: 'Miễn phí 5 trận/tháng, Premium thoải mái tìm kèo.' },
  { icon: 'sell', title: 'Ưu đãi đặt sân độc quyền', copy: 'Voucher PREMIUM60 và 30.000đ mỗi tháng cho thành viên.' },
  { icon: 'timer', title: 'Giữ chỗ sân lâu hơn', copy: 'Giữ sân tới 30 phút thay vì 10 phút để kịp mời đội.' },
  { icon: 'card_membership', title: 'Tích điểm x2', copy: 'Nhân đôi điểm thành viên khi thanh toán qua MatchUp.' },
  { icon: 'bookmark', title: 'Lưu kèo không giới hạn', copy: 'Gói miễn phí lưu tối đa 10 kèo, Premium lưu thoải mái.' },
  { icon: 'star', title: 'Kèo nổi bật', copy: 'Kèo do bạn tạo được gắn huy hiệu và lên đầu danh sách.' },
  { icon: 'forum', title: 'Chat không giới hạn', copy: 'Gói miễn phí giữ 3 phòng chat, Premium giữ không giới hạn.' },
  { icon: 'tune', title: 'Bộ lọc & gợi ý nâng cao', copy: 'Lọc theo chất lượng đội và mở rộng bán kính 20 km.' },
  { icon: 'workspace_premium', title: 'Huy hiệu Premium', copy: 'Nổi bật trong danh sách thành viên, ưu tiên khi duyệt.' },
];

export function renderMembership() {
  const info = store.getPremiumInfo();
  const usage = store.getMatchesUsedThisMonth();
  const status = document.querySelector('#premium-status');
  const actions = document.querySelector('#premium-actions');

  if (info.active) {
    const expiry = new Date(info.expiresAt).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    status.innerHTML = `
      <div class="premium-status-active">
        <span class="material-symbols-rounded">verified</span>
        <div>
          <strong>${escape(info.planLabel)} đang hoạt động</strong>
          <small>Còn ${info.daysLeft} ngày · hết hạn ${expiry}</small>
        </div>
      </div>
    `;
    actions.innerHTML = `
      <button class="premium-upgrade-btn" type="button" id="open-premium-upgrade">
        <span class="material-symbols-rounded">autorenew</span> Gia hạn
      </button>
      <button class="premium-cancel-btn" type="button" id="cancel-premium">Hủy gói</button>
    `;
  } else {
    status.innerHTML = `
      <div class="premium-status-free">
        <strong>Gói miễn phí</strong>
        <span>Đã dùng ${usage} / ${info.limit} lượt xin vào kèo trong tháng này.</span>
      </div>
    `;
    actions.innerHTML = `
      <button class="premium-upgrade-btn primary" type="button" id="open-premium-upgrade">
        <span class="material-symbols-rounded">workspace_premium</span> Nâng cấp Premium · 60.000đ/tháng
      </button>
    `;
  }

  document.querySelector('#premium-benefits').innerHTML = benefits.map(benefit => `
    <div class="premium-benefit">
      <span class="material-symbols-rounded">${benefit.icon}</span>
      <div><strong>${benefit.title}</strong><small>${benefit.copy}</small></div>
    </div>
  `).join('');

  const openButton = document.querySelector('#open-premium-upgrade');
  const cancelButton = document.querySelector('#cancel-premium');
  if (openButton) openButton.addEventListener('click', () => {
    import('../modals/premiumUpgrade.js').then(module => module.openPremiumUpgrade());
  });
  if (cancelButton) cancelButton.addEventListener('click', () => {
    store.cancelPremium();
    renderMembership();
    document.dispatchEvent(new CustomEvent('matchup:state-change'));
    window.showToast?.('Đã hủy gói Premium. Bạn trở lại gói miễn phí.');
  });
}