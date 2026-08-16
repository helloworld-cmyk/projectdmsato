export const createProfileApi = (context) => {
    const {
      id,
      clone,
      initials,
      stableSubjectId,
      subjectId,
      reputationFromReviews,
      read,
      state,
      save,
      addNotification,
      canSubmitReputationReview,
      submitReputationReview
    } = context;
    return {
getProfile: () => clone(state.profile),
    getSubjectId: (type, value) => subjectId(type === "court" ? "court" : "player", value),
    submitReputationReview: (input = {}) => submitReputationReview(input),
    canSubmitReputationReview: (type, sourceId) => canSubmitReputationReview(type, sourceId),
    getCourtReputation: (courtId, fallback = {}) => clone(
      reputationFromReviews("court", courtId, fallback),
    ),
    getPlayerReputation: (playerId) => clone(reputationFromReviews(
      "player",
      playerId === "self" ? stableSubjectId("player", state.profile.name) : playerId,
      {},
    )),
    getReviewsForSubject: (subjectType, subjectIdValue) => {
      const type = subjectType === "court" ? "court" : "player";
      const resolvedId = type === "player" && subjectIdValue === "self"
        ? stableSubjectId("player", state.profile.name)
        : subjectId(type, subjectIdValue);
      return clone(state.reputationReviews.filter((review) => type === "court"
        ? review.court && review.court.id === resolvedId
        : Array.isArray(review.players)
          && review.players.some((player) => player.id === resolvedId)));
    },
    getPreferences: () => clone(state.preferences),
    updateProfile: (updates) => {
      state.profile = { ...state.profile, ...updates };
      state.profile.initials = initials(state.profile.name);
      state.preferences = {
        ...state.preferences,
        level: state.profile.level,
        radius: state.profile.radius,
        availability: state.profile.availability,
        sport: state.profile.sports[0] || state.preferences.sport,
      };
      addNotification(
        "Đã cập nhật hồ sơ",
        "Sở thích của bạn sẽ được dùng để gợi ý kèo phù hợp hơn.",
        "profile",
      );
      save("profile-updated");
      return clone(state.profile);
    },
    addNotification: (title, body, type) => {
      addNotification(title, body, type);
      save("notification-added");
    },
    getNotifications: () => clone(state.notifications),
    markNotificationsRead: () => {
      state.notifications.forEach((notification) => { notification.read = true; });
      save("notifications-read");
    },
    };
};
