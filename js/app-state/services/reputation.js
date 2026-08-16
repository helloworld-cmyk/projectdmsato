export const DEMO_REPUTATION_SEED_VERSION = 1;

export const createDemoReputationReviews = ({ now, initials, subjectKey, stableSubjectId }) => {
  const entries = [
    {
      subject: "Ngọc Anh",
      reviewers: ["Minh Khang", "Thảo Vy"],
      ratings: [5, 5],
      tags: [["Đúng giờ", "Thân thiện"], ["Thanh toán đúng hẹn", "Đúng trình độ"]],
    },
    {
      subject: "Minh Khang",
      reviewers: ["Ngọc Anh", "Thảo Vy"],
      ratings: [5, 4],
      tags: [["Đúng giờ", "Thân thiện"], ["Đúng trình độ", "Thanh toán đúng hẹn"]],
    },
    {
      subject: "Thảo Vy",
      reviewers: ["Ngọc Anh", "Minh Khang"],
      ratings: [5, 5],
      tags: [["Thân thiện", "Đúng trình độ"], ["Đúng giờ", "Thanh toán đúng hẹn"]],
    },
    {
      subject: "Quốc Duy",
      reviewers: ["Ngọc Anh", "Minh Khang"],
      ratings: [4, 5],
      tags: [["Đúng giờ", "Đúng trình độ"], ["Thân thiện", "Thanh toán đúng hẹn"]],
    },
    {
      subject: "Hà My",
      reviewers: ["Ngọc Anh", "Thảo Vy"],
      ratings: [5, 4],
      tags: [["Thân thiện", "Đúng giờ"], ["Đúng trình độ", "Thanh toán đúng hẹn"]],
    },
    {
      subject: "Tuấn Anh",
      reviewers: ["Minh Khang", "Thảo Vy"],
      ratings: [4, 5],
      tags: [["Đúng trình độ", "Đúng giờ"], ["Thân thiện", "Thanh toán đúng hẹn"]],
    },
  ];
  return entries.flatMap((entry) => entry.reviewers.map((reviewer, index) => ({
    id: `demo-reputation-${subjectKey(entry.subject)}-${index + 1}`,
    type: "match",
    sourceId: `demo-match-${subjectKey(entry.subject)}-${index + 1}`,
    reviewer: {
      id: stableSubjectId("player", reviewer),
      name: reviewer,
      initials: initials(reviewer),
    },
    createdAt: now() - ((index + 1) * 86400000),
    court: null,
    players: [{
      id: stableSubjectId("player", entry.subject),
      name: entry.subject,
      initials: initials(entry.subject),
      rating: entry.ratings[index],
      tags: entry.tags[index],
    }],
  })));
};

export const seedMissingDemoReputation = (saved, { createReviews, subjectId }) => {
  if (Number(saved.demoReputationSeedVersion) >= DEMO_REPUTATION_SEED_VERSION) return;
  const existingSubjectIds = new Set(
    (saved.reputationReviews || []).flatMap((review) => (
      (review.players || []).map((player) => subjectId("player", player))
    )),
  );
  const missingSeed = createReviews().filter((review) => (
    !existingSubjectIds.has(review.players[0].id)
  ));
  saved.reputationReviews = [...missingSeed, ...(saved.reputationReviews || [])];
  saved.demoReputationSeedVersion = DEMO_REPUTATION_SEED_VERSION;
};

export const createReputationService = ({
  state,
  now,
  id,
  clone,
  initials,
  integer,
  subjectKey,
  stableSubjectId,
  subjectId,
  emptyPlayer,
  normalisePlayers,
  negativeTags,
  positiveTags,
  save,
  addNotification,
  findJourney,
}) => {
  const reputationFromReviews = (type, subject, fallback = {}) => {
    const subjectType = type === "court" ? "court" : "player";
    const resolvedId = subjectId(subjectType, subject);
    const reviews = state.reputationReviews.filter((review) => subjectType === "court"
      ? review.court && review.court.id === resolvedId
      : Array.isArray(review.players)
        && review.players.some((player) => player.id === resolvedId));
    const ratings = reviews.map((review) => subjectType === "court"
      ? Number(review.court && review.court.rating)
      : Number(review.players.find((player) => player.id === resolvedId).rating)
    ).filter((rating) => rating > 0);
    const rating = ratings.length
      ? Math.round(ratings.reduce((sum, value) => sum + value, 0) / ratings.length * 10) / 10
      : Number(fallback.rating) || 0;
    const fallbackCount = integer(fallback.reviews || fallback.count);
    const allTags = reviews.flatMap((review) => {
      const target = subjectType === "court"
        ? review.court
        : (review.players || []).find((player) => player.id === resolvedId);
      return target && Array.isArray(target.tags) ? target.tags : [];
    });
    const tags = [...new Set(allTags)]
      .map((tag) => ({
        tag,
        count: allTags.filter((item) => item === tag).length,
        positive: positiveTags.has(tag),
        negative: negativeTags.has(tag),
      }))
      .sort((a, b) => (
        b.count - a.count
        || Number(b.positive) - Number(a.positive)
        || a.tag.localeCompare(b.tag, "vi")
      ));
    const highlights = tags.filter((item) => item.positive).slice(0, 4);
    const alerts = tags.filter((item) => item.negative && item.count >= 2);
    return {
      subjectId: resolvedId,
      rating,
      reviews: reviews.length || fallbackCount,
      count: reviews.length || fallbackCount,
      tags,
      highlights,
      alerts,
      warnings: alerts,
      hasData: reviews.length > 0,
    };
  };

  const hasReputationReview = (type, sourceId) => state.reputationReviews.some((review) => (
    review.type === type && review.sourceId === sourceId
  ));
  const canSubmitReputationReview = (type, sourceId) => {
    const journey = findJourney(type, sourceId);
    if (!journey || hasReputationReview(type, sourceId)) return false;
    // A saved booking is reviewable from the personal schedule even when it
    // was cancelled or expired. The user may still have a useful experience
    // to report about the court or the people attached to that booking.
    return type === "booking" || journey.status === "completed";
  };
  const normaliseReviewTags = (tags, limit) => (
    [...new Set(
      (Array.isArray(tags) ? tags : [])
        .map((tag) => String(tag || "").trim())
        .filter(Boolean),
    )].slice(0, limit)
  );
  const submitReputationReview = (input = {}) => {
    const type = input.type === "match" ? "match" : input.type === "booking" ? "booking" : null;
    const sourceId = String(input.sourceId || "");
    if (!type || !sourceId || !canSubmitReputationReview(type, sourceId)) return null;
    const profile = state.profile;
    const courtInput = input.court || {};
    const courtName = String(
      courtInput.name || input.courtName || input.court || "Sân chưa cập nhật",
    ).trim();
    const court = {
      id: subjectId("court", courtInput.id || input.courtId || courtName),
      name: courtName,
      rating: Math.min(5, Math.max(1, integer(courtInput.rating || input.courtRating) || 5)),
      tags: normaliseReviewTags(courtInput.tags || input.courtTags, 6),
    };
    const selfPlayerId = stableSubjectId("player", profile.name);
    const players = normalisePlayers(input.players).map((player) => ({
      ...player,
      id: subjectId("player", player),
      rating: Math.min(5, Math.max(1, integer(player.rating) || 5)),
      tags: normaliseReviewTags(player.tags, 8),
    })).filter((player, index, all) => {
      const isSelf = (
        player.id === "self"
        || player.id === selfPlayerId
        || subjectKey(player.name) === subjectKey(profile.name)
      );
      return (
        !isSelf
        && !emptyPlayer(player)
        && all.findIndex((item) => item.id === player.id) === index
      );
    });
    const review = {
      id: id("reputation"),
      type,
      sourceId,
      reviewer: {
        id: "self",
        name: profile.name,
        initials: profile.initials || initials(profile.name),
      },
      createdAt: now(),
      court,
      players,
    };
    state.reputationReviews.unshift(review);
    const journey = findJourney(type, sourceId);
    journey.reputationSubmitted = true;
    journey.updatedAt = now();
    addNotification(
      "Đã lưu đánh giá uy tín",
      "Cảm ơn bạn đã giúp cộng đồng MatchUp chơi vui và đúng hẹn hơn.",
      "feedback",
    );
    save("reputation-review-submitted");
    return clone(review);
  };

  return {
    reputationFromReviews,
    hasReputationReview,
    canSubmitReputationReview,
    normaliseReviewTags,
    submitReputationReview,
  };
};
