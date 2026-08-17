export const createPremiumApi = (context) => {
  const {
    clone,
    PREMIUM_PLANS,
    isPremium,
    premiumInfo,
    matchesUsedThisMonth,
    canJoinMatch,
    upgradeToPremium,
    cancelPremium,
  } = context;
  const safeClone = (value) => (value === null || value === undefined ? value : clone(value));
  return {
    getPremiumPlans: () => clone(PREMIUM_PLANS),
    getMembership: () => clone(premiumInfo()),
    isPremium: () => isPremium(),
    getPremiumInfo: () => clone(premiumInfo()),
    getMatchesUsedThisMonth: () => matchesUsedThisMonth(),
    canJoinMatch: () => clone(canJoinMatch()),
    upgradeToPremium: (planId, method) => safeClone(upgradeToPremium(planId, method)),
    cancelPremium: () => safeClone(cancelPremium()),
  };
};