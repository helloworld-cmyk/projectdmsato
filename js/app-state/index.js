import {
  EVENT_NAME,
  LOYALTY_POLICY,
  SPORT_LABELS,
  STORAGE_KEY,
  VOUCHER_CATALOG,
  WALLET_PAYMENT_METHOD,
} from "./core/constants.js";
import * as utils from "./core/utils.js";
import { createStateStore } from "./core/state.js";
import {
  createDemoReputationReviews,
  createReputationService,
  DEMO_REPUTATION_SEED_VERSION,
  seedMissingDemoReputation,
} from "./services/reputation.js";
import { createApprovalCheck, joinRuleDefaults, normaliseJoinRules, BOOKING_ROSTER_MIGRATION_VERSION } from "./services/rules.js";
import { createChatService } from "./services/chat.js";
import { createCommerceService } from "./services/commerce.js";
import { createMatchInsightService } from "./services/insights.js";
import { createGeneralApi } from "./api/api-general.js";
import { createProfileApi } from "./api/api-profile.js";
import { createMatchesApi } from "./api/api-matches.js";
import { createChatApi } from "./api/api-chat.js";
import { createBookingsApi } from "./api/api-bookings.js";

const demoReputationReviews = () => createDemoReputationReviews({
  now: utils.now,
  initials: utils.initials,
  subjectKey: utils.subjectKey,
  stableSubjectId: utils.stableSubjectId,
});
const seedReputation = (saved) => seedMissingDemoReputation(saved, {
  createReviews: demoReputationReviews,
  subjectId: utils.subjectId,
});

const stateStore = createStateStore({
  demoReputationReviews,
  seedMissingDemoReputation: seedReputation,
});
const reputation = createReputationService({
  ...utils,
  state: stateStore.state,
  save: stateStore.save,
  addNotification: stateStore.addNotification,
  findJourney: stateStore.findJourney,
});
const approvalCheck = createApprovalCheck({ reputationFromReviews: reputation.reputationFromReviews });
const chat = createChatService({
  state: stateStore.state,
  now: utils.now,
  id: utils.id,
  clone: utils.clone,
  save: stateStore.save,
});
const commerce = createCommerceService({
  state: stateStore.state,
  now: utils.now,
  id: utils.id,
  clone: utils.clone,
  amount: utils.amount,
  addNotification: stateStore.addNotification,
  upsertJourney: stateStore.upsertJourney,
  save: stateStore.save,
});
const insights = createMatchInsightService({
  state: stateStore.state,
  reputationFromReviews: reputation.reputationFromReviews,
  hostForMatch: chat.hostForMatch,
});

const context = {
  STORAGE_KEY,
  EVENT_NAME,
  LOYALTY_POLICY,
  WALLET_PAYMENT_METHOD,
  SPORT_LABELS,
  VOUCHER_CATALOG,
  ...utils,
  ...stateStore,
  ...reputation,
  DEMO_REPUTATION_SEED_VERSION,
  BOOKING_ROSTER_MIGRATION_VERSION,
  joinRuleDefaults,
  normaliseJoinRules,
  approvalCheck,
  ...chat,
  ...commerce,
  matchInsight: insights.matchInsight,
};

export const store = {
  ...createGeneralApi(context),
  ...createProfileApi(context),
  ...createMatchesApi(context),
  ...createChatApi(context),
  ...createBookingsApi(context),
};

window.MatchUpStore = store;
window.MatchUpState = stateStore.state;

export const state = stateStore.state;
export { context };
