import { FREE_MATCH_LIMIT, PREMIUM_PLANS } from "../core/constants.js";
import { amount as toAmount } from "../core/utils.js";

export const membershipDefaults = () => ({ plan: null, startedAt: null, expiresAt: null });

export const premiumActive = (membership, at) => Boolean(
  membership
  && membership.plan
  && membership.expiresAt
  && new Date(membership.expiresAt).getTime() > at,
);

export const createPremiumService = ({
  state,
  now,
  clone,
  amount = toAmount,
  debitWallet,
  addNotification,
  save,
}) => {
  const money = (value) => (
    new Intl.NumberFormat("vi-VN").format(Math.round(Number(value) || 0)) + "đ"
  );
  const findPlan = (planId) => PREMIUM_PLANS.find((plan) => plan.id === planId) || null;
  const planForMembership = () => (
    state.membership && state.membership.plan
      ? findPlan(state.membership.plan)
      : null
  );
  const isPremium = () => {
    const membership = state.membership || membershipDefaults();
    return premiumActive(membership, now());
  };
  const premiumInfo = () => {
    const membership = state.membership || membershipDefaults();
    const active = isPremium();
    const plan = planForMembership();
    const expiresAt = active ? membership.expiresAt : null;
    const daysLeft = expiresAt
      ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now()) / 86400000))
      : 0;
    return {
      active,
      plan: active ? plan.id : null,
      planLabel: active && plan ? plan.label : null,
      startedAt: membership.startedAt || null,
      expiresAt,
      daysLeft,
      renewPrice: plan ? plan.price : 0,
      limit: FREE_MATCH_LIMIT,
    };
  };
  const matchesUsedThisMonth = () => {
    const today = new Date(now());
    const monthKey = `${today.getFullYear()}-${today.getMonth()}`;
    return state.applications.filter((application) => {
      const createdAt = Number(application.createdAt) || now();
      const created = new Date(createdAt);
      return `${created.getFullYear()}-${created.getMonth()}` === monthKey;
    }).length;
  };
  const canJoinMatch = () => {
    if (isPremium()) return { allowed: true, usage: matchesUsedThisMonth(), limit: null };
    const usage = matchesUsedThisMonth();
    return {
      allowed: usage < FREE_MATCH_LIMIT,
      usage,
      limit: FREE_MATCH_LIMIT,
    };
  };
  const upgradeToPremium = (planId) => {
    const plan = findPlan(planId);
    if (!plan) return null;
    const membership = state.membership || membershipDefaults();
    if (plan.price > state.wallet.balance) {
      return { ok: false, reason: "insufficient", plan };
    }
    const debit = debitWallet({
      amount: plan.price,
      sourceType: "membership",
      sourceId: plan.id,
      label: `gói ${plan.label}`,
    });
    if (!debit) return { ok: false, reason: "insufficient", plan };
    const base = membership.plan && membership.expiresAt
      ? Math.max(now(), new Date(membership.expiresAt).getTime())
      : now();
    state.membership = {
      plan: plan.id,
      startedAt: now(),
      expiresAt: base + plan.days * 86400000,
    };
    addNotification(
      "Đã kích hoạt Premium",
      `Gói ${plan.label} có hiệu lực đến ${new Date(state.membership.expiresAt).toLocaleDateString("vi-VN")}. Cảm ơn bạn đã đồng hành cùng MatchUp!`,
      "premium",
    );
    save("premium-upgraded");
    return {
      ok: true,
      plan,
      method: "Ví MatchUp",
      membership: clone(state.membership),
      info: premiumInfo(),
    };
  };
  const cancelPremium = () => {
    if (!state.membership || !state.membership.plan) return null;
    state.membership = membershipDefaults();
    addNotification(
      "Đã hủy gói Premium",
      "Bạn trở lại gói miễn phí với 5 lượt xin vào kèo mỗi tháng.",
      "premium",
    );
    save("premium-cancelled");
    return clone(state.membership);
  };

  return {
    money,
    isPremium,
    premiumInfo,
    matchesUsedThisMonth,
    canJoinMatch,
    upgradeToPremium,
    cancelPremium,
  };
};