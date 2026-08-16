import { integer } from "../core/utils.js";

export const BOOKING_ROSTER_MIGRATION_VERSION = 1;

export const joinRuleDefaults = () => ({
  requirePaymentBeforeJoin: false,
  autoApprove: true,
  criteria: {
    levelMatch: false,
    minRating: 0,
    minCompletedMatches: 0,
  },
});

export const normaliseJoinRules = (input = {}) => {
  const defaults = joinRuleDefaults();
  const criteria = input && typeof input.criteria === "object" ? input.criteria : {};
  const allowedRatings = [0, 4, 4.5];
  const allowedMatches = [0, 3, 5, 10];
  const rating = Number(criteria.minRating);
  const completed = integer(criteria.minCompletedMatches);
  return {
    requirePaymentBeforeJoin: Boolean(input && input.requirePaymentBeforeJoin),
    autoApprove: Boolean(input && input.autoApprove),
    criteria: {
      levelMatch: Boolean(criteria.levelMatch),
      minRating: allowedRatings.includes(rating) ? rating : defaults.criteria.minRating,
      minCompletedMatches: allowedMatches.includes(completed)
        ? completed
        : defaults.criteria.minCompletedMatches,
    },
  };
};

export const createApprovalCheck = ({ reputationFromReviews }) => (match, candidate = {}) => {
  const rules = normaliseJoinRules(match && match.joinRules);
  const reputation = reputationFromReviews(
    "player",
    candidate.id || candidate.name || "unknown",
    { rating: Number(candidate.rating) || 0 },
  );
  const completedMatches = Number(candidate.completedMatches) || reputation.reviews || 0;
  const failed = [];
  if (
    rules.criteria.levelMatch
    && match
    && match.level
    && candidate.level !== match.level
  ) failed.push(`Đúng trình độ ${match.level}`);
  if (
    rules.criteria.minRating
    && (!(reputation.hasData || Number(candidate.rating) > 0)
      || reputation.rating < rules.criteria.minRating)
  ) failed.push(`Từ ${rules.criteria.minRating.toFixed(1)}★`);
  if (
    rules.criteria.minCompletedMatches
    && completedMatches < rules.criteria.minCompletedMatches
  ) failed.push(`${rules.criteria.minCompletedMatches} trận đã hoàn thành`);
  return { rules, eligible: failed.length === 0, failed, reputation, completedMatches };
};
