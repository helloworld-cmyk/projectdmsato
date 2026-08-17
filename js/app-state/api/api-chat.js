import { addSelfToRoster } from "../services/roster.js";

export const createChatApi = (context) => {
    const {
      WALLET_PAYMENT_METHOD,
      now,
      id,
      clone,
      initials,
      amount,
      read,
      state,
      save,
      addNotification,
      upsertJourney,
      chatApplication,
      createChatAutoReply,
      ensureChatRoom,
      sendChatAutoReply,
      hasPendingChatGreeting,
      sendChatGreeting,
      money,
      previewPoints,
      debitWallet,
      settleLoyalty,
      approvalCheck
    } = context;
    return {
getApplications: () => clone(state.applications),
    getChatAccess: (matchId) => {
      const application = chatApplication(matchId);
      if (!application) {
        return {
          allowed: false,
          status: null,
          reason: "Phòng chat chỉ mở sau khi chủ kèo duyệt yêu cầu.",
        };
      }
      const room = ensureChatRoom(matchId, application.match);
      return clone({
        allowed: true,
        status: application.status,
        match: application.match,
        roomId: room.id,
        greetingPending: Boolean(room.greetingPending),
      });
    },
    getChatRooms: () => clone(state.applications
      .filter((application) => ["accepted", "paid"].includes(application.status))
      .map((application) => {
        const room = ensureChatRoom(application.matchId, application.match);
        const messages = Array.isArray(room.messages) ? room.messages : [];
        const lastMessage = messages
          .filter((message) => message.kind !== "system")
          .slice(-1)[0] || messages.slice(-1)[0] || null;
        return {
          id: room.id,
          matchId: application.matchId,
          status: application.status,
          match: application.match,
          lastMessage,
          unreadCount: Number(room.unreadCount) || 0,
          updatedAt: lastMessage ? lastMessage.createdAt : room.createdAt,
        };
      })
      .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))),
    markChatRead: (matchId) => {
      const room = state.chatRooms[matchId];
      if (!room || !room.unreadCount) return false;
      room.unreadCount = 0;
      save("chat-read");
      return true;
    },
    getChatMessages: (matchId) => clone(
      (state.chatRooms[matchId] && state.chatRooms[matchId].messages) || [],
    ),
    getChatAutoReply: (text) => clone(createChatAutoReply(null, text)),
    hasPendingChatGreeting,
    sendChatGreeting,
    sendChatAutoReply,
    sendChatMessage: (matchId, text) => {
      const application = chatApplication(matchId);
      const cleanText = String(text || "").trim().slice(0, 500);
      if (!application || !cleanText) return null;
      const room = ensureChatRoom(matchId, application.match);
      const profile = state.profile;
      const message = {
        id: id("message"),
        kind: "text",
        senderId: "self",
        senderName: profile.name,
        senderInitials: profile.initials,
        senderTone: "#d78c68",
        text: cleanText,
        createdAt: now(),
      };
      room.messages.push(message);
      room.messages = room.messages.slice(-100);
      save("chat-message-sent");
      return clone(message);
    },
    updateApplicationStatus: (applicationId, status) => {
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application) return null;
      const nextStatus = status === "accepted" ? "accepted" : status;
      if (nextStatus === "accepted") {
        const decision = approvalCheck(application.match, state.profile);
        if (!decision.eligible) return null;
        if (
          decision.rules.requirePaymentBeforeJoin
          && application.paymentStatus !== "paid"
        ) {
          return null;
        }
      }
      application.status = nextStatus;
      application.updatedAt = now();
      upsertJourney(
        "match",
        application.id,
        nextStatus,
        { matchId: application.matchId, matchName: application.match.name },
      );
      const label = nextStatus === "accepted" || nextStatus === "paid"
        ? "Bạn đã được nhận vào kèo"
        : nextStatus === "declined"
          ? "Yêu cầu vào kèo không được duyệt"
          : "Đã hủy yêu cầu vào kèo";
      addNotification(label, application.match.name, "match");
      if (nextStatus === "accepted" || nextStatus === "paid") {
        const live = state.matches.find((match) => match.id === application.matchId);
        const records = [live, application.match].filter(Boolean);
        records.forEach((record) => addSelfToRoster(record, state.profile, {
          paid: application.paymentStatus === "paid" || nextStatus === "paid",
          joinStatus: "approved",
          role: nextStatus === "paid"
            ? "Đã vào kèo · Đã thanh toán"
            : "Đã vào kèo",
        }));
        ensureChatRoom(application.matchId, application.match);
        addNotification(
          "Phòng chat đã mở",
          `Bạn có thể làm quen với đội trong ${application.match.name}.`,
          "chat",
        );
      }
      save("application-updated");
      return clone(application);
    },
    payForApplication: (applicationId, method = "VietQR", requestedPoints = 0) => {
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application || !["accepted", "payment_pending"].includes(application.status)) {
        return null;
      }
      const paymentFirst = Boolean(
        application.match
        && application.match.joinRules
        && application.match.joinRules.requirePaymentBeforeJoin,
      );
      const subtotal = amount(application.match.deposit || application.match.share / 2);
      const pointsPreview = previewPoints(subtotal, requestedPoints);
      const walletPayment = method === WALLET_PAYMENT_METHOD;
      if (
        !pointsPreview.isValid
        || (walletPayment && pointsPreview.paidAmount > state.wallet.balance)
      ) return null;
      const loyaltyPayment = settleLoyalty({
        subtotal,
        requestedPoints,
        sourceType: "application",
        sourceId: application.id,
        label: `cọc kèo ${application.match.name}`,
      });
      if (!loyaltyPayment) return null;
      const walletPaymentDetail = walletPayment
        ? debitWallet({
          amount: loyaltyPayment.paidAmount,
          sourceType: "application",
          sourceId: application.id,
          label: `cọc kèo ${application.match.name}`,
        })
        : null;
      if (walletPayment && !walletPaymentDetail) return null;
      application.status = paymentFirst && !application.autoApproved ? "pending" : "paid";
      application.paymentStatus = "paid";
      application.paymentMethod = method;
      if (application.status === "paid") {
        const live = state.matches.find((match) => match.id === application.matchId);
        const records = [live, application.match].filter(Boolean);
        records.forEach((record) => addSelfToRoster(record, state.profile, {
          paid: true,
          joinStatus: "approved",
          role: "Đã vào kèo · Đã thanh toán",
        }));
      }
      application.payment = {
        subtotal,
        paidAmount: loyaltyPayment.paidAmount,
        redeemedPoints: loyaltyPayment.points,
        discount: loyaltyPayment.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
        walletAmount: walletPaymentDetail ? walletPaymentDetail.amount : 0,
      };
      upsertJourney(
        "match",
        application.id,
        application.status,
        { matchId: application.matchId, matchName: application.match.name },
      );
      application.updatedAt = now();
      const loyaltyNote = [
        loyaltyPayment.points ? ` Đã đổi ${loyaltyPayment.points} điểm.` : "",
        loyaltyPayment.earnedPoints
          ? ` Tích ${loyaltyPayment.earnedPoints} điểm.`
          : "",
      ].join("");
      const paymentTitle = application.status === "pending"
        ? "Đã thanh toán cọc — chờ duyệt"
        : "Đã thanh toán cọc kèo";
      addNotification(
        paymentTitle,
        `${money(loyaltyPayment.paidAmount)} qua ${method} `
          + `cho ${application.match.name}.${loyaltyNote}`,
        "payment",
      );
      save("application-paid");
      return clone(application);
    },
    };
};
