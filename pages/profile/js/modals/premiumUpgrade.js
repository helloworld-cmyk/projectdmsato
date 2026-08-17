import { store } from '../state.js';
import { formatMoney } from '../utils.js';
import { renderMembership } from '../components/membership.js';

let selectedPlanId = 'monthly';
let modal = null;

export function openPremiumUpgrade() {
  modal = document.querySelector('#premium-upgrade-modal');
  selectedPlanId = 'monthly';
  renderPremiumPlans();
  syncPremiumMethod();
  modal.classList.add('show');
}

export function closePremiumUpgrade() {
  modal?.classList.remove('show');
}

function renderPremiumPlans() {
  const plans = store.getPremiumPlans();
  document.querySelector('#premium-plans').innerHTML = plans.map(plan => `
    <button class="premium-plan ${plan.id === selectedPlanId ? 'selected' : ''}"
      type="button" data-premium-plan="${plan.id}">
      <span class="premium-plan-radio"></span>
      <span class="premium-plan-copy">
        <strong>${plan.label} · ${formatMoney(plan.price)}</strong>
        <small>${plan.description}</small>
      </span>
      ${plan.badge ? `<em>${plan.badge}</em>` : ''}
    </button>
  `).join('');

  document.querySelectorAll('[data-premium-plan]').forEach(button => {
    button.addEventListener('click', () => {
      selectedPlanId = button.dataset.premiumPlan;
      renderPremiumPlans();
      syncPremiumMethod();
    });
  });
}

function currentPlanPrice() {
  const plans = store.getPremiumPlans();
  const plan = plans.find(item => item.id === selectedPlanId) || plans[0];
  return plan ? plan.price : 0;
}

function syncPremiumMethod() {
  const wallet = store.getWallet();
  const price = currentPlanPrice();
  const insufficient = wallet.balance < price;

  document.querySelector('#premium-wallet-balance').textContent = `Số dư ${formatMoney(wallet.balance)}`;

  const confirm = document.querySelector('#confirm-premium-upgrade');
  confirm.disabled = insufficient;
  confirm.textContent = insufficient
    ? 'Ví không đủ số dư — hãy nạp thêm'
    : `Nâng cấp ${formatMoney(price)} từ Ví MatchUp`;
}

export function initPremiumUpgradeModal() {
  modal = document.querySelector('#premium-upgrade-modal');

  document.querySelector('#close-premium-upgrade').addEventListener('click', closePremiumUpgrade);
  modal.addEventListener('click', event => {
    if (event.target === modal) closePremiumUpgrade();
  });

  document.querySelector('#confirm-premium-upgrade').addEventListener('click', () => {
    const result = store.upgradeToPremium(selectedPlanId);

    if (!result || !result.ok) {
      window.showToast?.('Ví không đủ số dư hoặc gói không hợp lệ. Hãy thử lại.');
      syncPremiumMethod();
      return;
    }

    closePremiumUpgrade();
    renderMembership();
    document.dispatchEvent(new CustomEvent('matchup:state-change'));
    window.showToast?.(`Đã kích hoạt ${result.plan.label} từ Ví MatchUp. Chào mừng bạn đến với Premium!`);
  });
}