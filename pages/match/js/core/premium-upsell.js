export function openPremiumUpsell(message) {
  const layer = document.createElement('div');
  layer.className = 'premium-upsell-layer';
  layer.innerHTML = `
    <div class="premium-upsell">
      <button class="premium-upsell-close" type="button" aria-label="Đóng">
        <span class="material-symbols-rounded">close</span>
      </button>
      <span class="premium-upsell-icon material-symbols-rounded">workspace_premium</span>
      <h3>${message || 'Tính năng này dành cho thành viên Premium'}</h3>
      <p>Nâng cấp Premium 60.000đ/tháng để xin vào kèo không giới hạn, dùng bộ lọc nâng cao và nhận ưu đãi đặt sân độc quyền.</p>
      <button class="premium-upsell-cta" type="button">Nâng cấp Premium · 60.000đ/tháng</button>
      <span class="premium-upsell-close-text" role="button">Để sau</span>
    </div>
  `;
  document.body.appendChild(layer);
  const close = () => layer.remove();
  layer.querySelector('.premium-upsell-close').addEventListener('click', close);
  layer.querySelector('.premium-upsell-close-text').addEventListener('click', close);
  layer.addEventListener('click', event => {
    if (event.target === layer) close();
  });
  layer.querySelector('.premium-upsell-cta').addEventListener('click', () => {
    close();
    location.href = '../profile/?premium=1';
  });
}