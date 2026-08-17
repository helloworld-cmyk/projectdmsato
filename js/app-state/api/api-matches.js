import { addSelfToRoster, normaliseMatchPlayer } from "../services/roster.js";

export const createMatchesApi = (context) => {
    const {
      now,
      id,
      clone,
      initials,
      integer,
      amount,
      subjectKey,
      stableSubjectId,
      WALLET_PAYMENT_METHOD,
      normaliseJoinRules,
      approvalCheck,
      state,
      save,
      addNotification,
      upsertJourney,
      findJourney,
      ensureChatRoom,
      matchInsight,
      money,
      previewPoints,
      settleLoyalty,
      debitWallet
    } = context;
    const syncSelfRoster = (matchId, application, options) => {
      const records = [];
      const live = state.matches.find((match) => match.id === matchId);
      if (live) records.push(live);
      if (application && application.match) records.push(application.match);
      records.forEach((record) => addSelfToRoster(record, state.profile, options));
    };
    return {
createMatch: (input) => {
      const profile = state.profile;
      const capacity = Math.max(2, Number(input.capacity) || 6);
      const match = {
        id: id("match"),
        custom: true,
        sport: input.sport || "football",
        emoji: input.emoji || "⚽",
        name: input.name || `${profile.name} tìm đồng đội`,
        format: input.format || "Giao lưu",
        venue: input.venue || "Sân gần bạn",
        bookingId: input.bookingId || null,
        area: input.area || "Long Biên",
        address: input.address || "Long Biên, Hà Nội",
        time: input.time || "Tối nay, 20:00",
        timeKey: input.timeKey || "today",
        dateKey: input.dateKey || null,
        timeOrder: Number(input.timeOrder) || 20,
        distance: Number(input.distance) || 2.1,
        level: input.level || profile.level,
        score: 100,
        capacity,
        joined: 1,
        available: capacity - 1,
        fee: Number(input.fee) || 360000,
        share: Math.ceil((Number(input.fee) || 360000) / capacity / 1000) * 1000,
        deposit: Math.ceil((Number(input.fee) || 360000) / capacity / 2000) * 1000,
        paymentMethod: "Chuyển khoản QR qua MatchUp",
        creatorName: profile.name,
        joinRules: normaliseJoinRules(input.joinRules),
        status: "open",
        createdAt: now(),
        participants: [{
          id: stableSubjectId("player", profile.name),
          name: profile.name,
          initials: profile.initials,
          role: "Chủ kèo",
          tone: "#d78c68",
          payment: "Chưa thanh toán",
        }],
        vibe: "Giao lưu, thân thiện",
      };
      state.matches.unshift(match);
      upsertJourney(
        "match",
        match.id,
        "created",
        { matchId: match.id, matchName: match.name },
      );
      addNotification(
        "Đã đăng kèo mới",
        `${match.name} đang chờ thêm ${match.available} người chơi.`,
        "match",
      );
      save("match-created");
      return clone(match);
    },
    updateMatchRules: (matchId, rules) => {
      const match = resolveMatchRecord(matchId);
      if (!match) return null;
      match.joinRules = normaliseJoinRules(rules);
      match.updatedAt = now();
      save("match-rules-updated");
      return clone(match);
    },
    resolveMatchRecord: (matchId) => {
      const custom = state.matches.find((match) => match.id === matchId);
      if (custom) return custom;
      const application = state.applications.find((item) => (
        item.matchId === matchId && item.status !== "cancelled"
      ));
      return (application && application.match) || null;
    },
    addMatchPlayer: (matchId, playerInput = {}) => {
      const match = resolveMatchRecord(matchId);
      if (!match || match.status === "cancelled") return null;
      const participants = Array.isArray(match.participants) ? match.participants : [];
      const capacity = Math.max(2, Number(match.capacity) || participants.length + 1);
      if (participants.length >= capacity) return null;
      const player = normaliseMatchPlayer({ ...playerInput });
      if (
        !player
        || participants.some((item) => subjectKey(item.name) === subjectKey(player.name))
      ) return null;
      match.participants = [...participants, player];
      match.joined = match.participants.length;
      match.available = Math.max(0, capacity - match.participants.length);
      match.updatedAt = now();
      save("match-player-added");
      return clone(match);
    },
    saveMatchSplit: (matchId, split) => {
      const match = resolveMatchRecord(matchId);
      if (!match || match.status === "cancelled") return null;
      match.split = clone(split);
      match.updatedAt = now();
      save("match-split-updated");
      return clone(match);
    },
    payForMatchOwner: (matchId, method = "VietQR", requestedPoints = 0) => {
      const match = resolveMatchRecord(matchId);
      if (!match || match.status === "cancelled") return null;
      const participants = Array.isArray(match.participants) ? match.participants : [];
      const owner = participants.find((player) => player.role === "Chủ kèo")
        || participants[0];
      if (!owner || owner.payment === "Đã thanh toán" || owner.paid) return null;
      const share = amount(match.share || Math.ceil(
        (Number(match.fee) || 0) / Math.max(1, Number(match.capacity) || 1) / 1000,
      ) * 1000);
      const walletPayment = method === WALLET_PAYMENT_METHOD;
      const preview = previewPoints(share, requestedPoints);
      if (!preview.isValid || (walletPayment && preview.paidAmount > state.wallet.balance)) {
        return null;
      }
      const loyaltyPayment = settleLoyalty({
        subtotal: share,
        requestedPoints,
        sourceType: "match",
        sourceId: match.id,
        label: `phần chủ kèo ${match.name}`,
      });
      if (!loyaltyPayment) return null;
      const walletPaymentDetail = walletPayment
        ? debitWallet({
          amount: loyaltyPayment.paidAmount,
          sourceType: "match",
          sourceId: match.id,
          label: `phần chủ kèo ${match.name}`,
        })
        : null;
      if (walletPayment && !walletPaymentDetail) return null;
      owner.payment = "Đã thanh toán";
      owner.paid = true;
      match.payment = {
        subtotal: share,
        paidAmount: loyaltyPayment.paidAmount,
        redeemedPoints: loyaltyPayment.points,
        discount: loyaltyPayment.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
        walletAmount: walletPaymentDetail ? walletPaymentDetail.amount : 0,
      };
      match.updatedAt = now();
      addNotification(
        "Thanh toán phần chủ kèo thành công",
        `Bạn đã thanh toán ${money(loyaltyPayment.paidAmount)} qua ${method} `
          + `cho ${match.name}.`,
        "payment",
      );
      save("match-owner-paid");
      return clone(match);
    },
    getMatchApproval: (match, candidate = state.profile) => clone(approvalCheck(match, candidate)),
    getCustomMatches: () => clone(state.matches),
    getMatch: (matchId) => clone(state.matches.find((match) => match.id === matchId) || null),
    getMatchInsights: (match) => clone(matchInsight(match || {})),
    isMatchSaved: (matchId) => state.savedMatches.includes(matchId),
    toggleSavedMatch: (matchId, label = "kèo này", details = null) => {
      const index = state.savedMatches.indexOf(matchId);
      const saved = index === -1;
      if (saved) {
        state.savedMatches.unshift(matchId);
        if (details && typeof details === "object") {
          state.savedMatchDetails[matchId] = clone({ ...details, id: matchId });
        }
      } else {
        state.savedMatches.splice(index, 1);
        delete state.savedMatchDetails[matchId];
      }
      const title = saved ? "Đã lưu kèo" : "Đã bỏ lưu kèo";
      const message = saved
        ? `Bạn sẽ dễ tìm lại ${label}.`
        : `${label} đã được bỏ khỏi danh sách lưu.`;
      addNotification(title, message, "match");
      save(saved ? "match-saved" : "match-unsaved");
      return saved;
    },
    getSavedMatches: () => clone(state.savedMatches),
    getSavedMatchRecords: () => clone(state.savedMatches.map((matchId) => (
      state.savedMatchDetails[matchId] || { id: matchId, name: "Kèo đã lưu" }
    ))),
    requestWaitlist: (criteria = {}) => {
      const key = JSON.stringify({
        sport: criteria.sport || "all",
        time: criteria.time || "all",
        level: criteria.level || "all",
        radius: Number(criteria.radius) || 10,
      });
      const existing = state.waitlists.find((item) => (
        item.key === key && item.status === "active"
      ));
      if (existing) return clone(existing);
      const waitlist = {
        id: id("wait"),
        key,
        criteria: { ...criteria },
        status: "active",
        createdAt: now(),
      };
      state.waitlists.unshift(waitlist);
      addNotification(
        "Đã bật báo kèo",
        "MatchUp sẽ nhắc bạn khi có kèo mới phù hợp bộ lọc này.",
        "match",
      );
      save("waitlist-created");
      return clone(waitlist);
    },
    getWaitlists: () => clone(state.waitlists),
    getJourney: (type, sourceId) => clone(findJourney(type, sourceId)),
    getJourneys: () => clone(state.playJourneys),
    completeJourney: (type, sourceId) => {
      const journey = findJourney(type, sourceId);
      if (!journey) return null;
      journey.status = "completed";
      journey.completedAt = now();
      journey.updatedAt = now();
      addNotification(
        "Trận chơi đã hoàn thành",
        "Chia sẻ cảm nhận để nhận huy hiệu cho đội của bạn.",
        "feedback",
      );
      save("journey-completed");
      return clone(journey);
    },
    submitFeedback: (input = {}) => {
      const rating = Math.min(5, Math.max(1, integer(input.rating) || 5));
      const atmosphere = Math.min(5, Math.max(1, integer(input.atmosphere) || rating));
      const existing = state.matchFeedback.find((item) => (
        item.type === input.type && item.sourceId === input.sourceId
      ));
      if (existing) return clone(existing);
      const feedback = {
        id: id("feedback"),
        type: input.type,
        sourceId: input.sourceId,
        rating,
        atmosphere,
        tags: Array.isArray(input.tags) ? input.tags.slice(0, 4) : [],
        repeat: input.repeat !== false,
        createdAt: now(),
      };
      state.matchFeedback.unshift(feedback);
      const journey = upsertJourney(
        input.type,
        input.sourceId,
        "completed",
        { feedbackSubmitted: true },
      );
      state.profile.streak = integer(state.profile.streak) + 1;
      const badge = atmosphere >= 4 ? "Đồng đội tích cực" : "Luôn sẵn sàng ra sân";
      if (!state.profile.badges.includes(badge)) state.profile.badges.unshift(badge);
      addNotification(
        "Cảm ơn bạn đã chia sẻ",
        `Bạn nhận huy hiệu “${badge}”. Trận tiếp theo đang chờ bạn!`,
        "feedback",
      );
      save("feedback-submitted");
      return clone({ feedback, journey });
    },
    getFeedback: () => clone(state.matchFeedback),
    cancelMatch: (matchId) => {
      const match = state.matches.find((item) => item.id === matchId);
      if (!match || match.status === "cancelled") return null;
      match.status = "cancelled";
      match.updatedAt = now();
      addNotification(
        "Đã hủy kèo",
        `${match.name} không còn hiển thị cho người chơi khác.`,
        "match",
      );
      save("match-cancelled");
      return clone(match);
    },
    applyToMatch: (match) => {
      const existing = state.applications.find((application) => (
        application.matchId === match.id && application.status !== "cancelled"
      ));
      if (existing) return clone(existing);
      const decision = approvalCheck(match, state.profile);
      const paymentFirst = decision.rules.requirePaymentBeforeJoin;
      const autoApproved = decision.rules.autoApprove && decision.eligible;
      const status = autoApproved
        ? paymentFirst ? "payment_pending" : "accepted"
        : "pending";
      const application = {
        id: id("application"),
        matchId: match.id,
        match: clone(match),
        status,
        paymentStatus: "unpaid",
        autoApproved,
        approvalEligible: decision.eligible,
        approvalCriteria: clone(decision.rules.criteria),
        approvalNote: decision.eligible
          ? "Đủ tiêu chí tham gia"
          : `Còn thiếu: ${decision.failed.join(", ")}`,
        autoApproveAfterMs: autoApproved ? null : 0,
        createdAt: now(),
        updatedAt: now(),
      };
      upsertJourney(
        "match",
        application.id,
        status === "accepted" ? "accepted" : "requested",
        { matchId: match.id, matchName: match.name },
      );
      state.applications.unshift(application);
      if (status === "accepted" || status === "payment_pending") {
        syncSelfRoster(match.id, application, {
          paid: application.paymentStatus === "paid",
          joinStatus: status === "accepted" ? "approved" : "payment_pending",
          role: status === "accepted"
            ? "Đã vào kèo"
            : "Đã vào kèo · Chờ thanh toán cọc",
        });
      }
      ensureChatRoom(application.matchId, application.match);
      addNotification(
        status === "accepted" || status === "payment_pending"
          ? "Đã tự động duyệt vào kèo"
          : "Đã gửi yêu cầu vào kèo",
        status === "accepted"
          ? `Bạn đã đủ tiêu chí và được thêm vào ${match.name}.`
          : status === "payment_pending"
            ? `Bạn đã đủ tiêu chí. Hãy thanh toán cọc để chốt chỗ trong ${match.name}.`
            : decision.eligible
              ? `Yêu cầu vào ${match.name} đang chờ chủ kèo duyệt.`
              : `Chưa đủ tiêu chí vào ${match.name}: ${decision.failed.join(", ")}.`,
        "match",
      );
      save("match-applied");
      return clone(application);
    },
    autoApproveApplications: (delayMs = 10000) => {
      const parsedDelay = Number(delayMs);
      const threshold = Number.isFinite(parsedDelay) ? Math.max(0, parsedDelay) : 10000;
      const due = state.applications.filter((application) => {
        if (
          !application
          || application.status !== "pending"
        ) return false;
        const match = application.match;
        const decision = approvalCheck(match, state.profile);
        if (!decision.rules.autoApprove || !decision.eligible) return false;
        const createdAt = Number(application.createdAt) || now();
        return now() - createdAt >= threshold;
      });
      if (!due.length) return [];
      due.forEach((application) => {
        const paymentFirst = Boolean(
          application.match
          && application.match.joinRules
          && application.match.joinRules.requirePaymentBeforeJoin,
        );
        application.status = application.paymentStatus === "paid"
          ? "paid"
          : paymentFirst ? "payment_pending" : "accepted";
        application.autoApproved = true;
        application.approvalDueAt = null;
        application.updatedAt = now();
        syncSelfRoster(application.matchId, application, {
          paid: application.paymentStatus === "paid",
          joinStatus: application.status === "accepted"
            ? "approved"
            : application.status === "paid" ? "approved" : "payment_pending",
          role: application.status === "paid"
            ? "Đã vào kèo · Đã thanh toán"
            : application.status === "accepted"
              ? "Đã vào kèo"
              : "Đã vào kèo · Chờ thanh toán cọc",
        });
        upsertJourney(
          "match",
          application.id,
          application.status,
          {
            matchId: application.matchId,
            matchName: application.match && application.match.name,
          },
        );
        const matchName = application.match && application.match.name || "Kèo MatchUp";
        const statusMessage = paymentFirst && application.status !== "paid"
          ? " Hãy thanh toán cọc để giữ chỗ."
          : " Bạn đã được thêm vào đội.";
        addNotification(
          "Đã tự động duyệt vào kèo",
          `${matchName}.${statusMessage}`,
          "match",
        );
        ensureChatRoom(application.matchId, application.match);
        addNotification(
          "Phòng chat đã mở",
          `Bạn có thể làm quen với đội trong ${matchName}.`,
          "chat",
        );
      });
      save("applications-auto-approved");
      return clone(due);
    },
    };
};
