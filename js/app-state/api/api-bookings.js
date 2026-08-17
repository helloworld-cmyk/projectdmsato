export const createBookingsApi = (context) => {
    const {
      EVENT_NAME,
      now,
      id,
      clone,
      initials,
      integer,
      amount,
      subjectKey,
      stableSubjectId,
      normalisePlayer,
      normaliseJoinRules,
      approvalCheck,
      defaultState,
      state,
      save,
      addNotification,
      upsertJourney,
      money,
      bookingHistoryExists,
      voucherContext,
      bestVoucher,
      previewVoucher,
      previewPoints,
      addLoyaltyTransaction,
      debitWallet,
      settleLoyalty,
      splitEqual,
      splitProportionally,
      applyBookingDiscount,
      expireBookings,
      getBooking
    } = context;
    return {
createBooking: (input) => {
      expireBookings();
      const hasSubtotal = Object.prototype.hasOwnProperty.call(input, "subtotal");
      const originalTotal = amount(hasSubtotal ? input.subtotal : input.total);
      const teamSize = Math.max(1, integer(input.teamSize) || 4);
      const voucherContext = {
        subtotal: originalTotal,
        sport: input.sport || "",
        date: input.date || "",
        time: input.time || "",
        times: Array.isArray(input.timeSlots) ? input.timeSlots : [],
        teamSize,
        isFirstBooking: !bookingHistoryExists(),
      };
      const voucherPreview = input.voucherId
        ? previewVoucher(input.voucherId, voucherContext)
        : hasSubtotal ? bestVoucher(voucherContext) : null;
      const appliedVoucher = voucherPreview && voucherPreview.eligible ? voucherPreview : null;
      const voucherDiscountAmount = appliedVoucher ? appliedVoucher.discount : 0;
      const total = Math.max(0, originalTotal - voucherDiscountAmount);
      const booking = {
        id: id("booking"),
        court: input.court,
        courtId: input.courtId || stableSubjectId("court", input.court),
        teamSize,
        distance: input.distance || "gần bạn",
        sport: input.sport || "football",
        date: input.date,
        dateKey: input.dateKey || null,
        time: input.time,
        timeSlots: Array.isArray(input.timeSlots) ? [...input.timeSlots] : null,
        duration: input.duration || 90,
        total,
        subtotal: total,
        originalTotal,
        level: input.level || state.profile.level,
        creatorName: state.profile.name,
        joinRules: normaliseJoinRules(input.joinRules),
        voucher: appliedVoucher ? {
          id: appliedVoucher.id,
          code: appliedVoucher.code,
          title: appliedVoucher.title,
          category: appliedVoucher.category,
          discount: voucherDiscountAmount,
          discountLabel: appliedVoucher.discountLabel,
        } : null,
        status: "held",
        holdExpiresAt: now() + 10 * 60 * 1000,
        createdAt: now(),
        updatedAt: now(),
        ownerPaid: false,
        split: {
          mode: "equal",
          players: [
            {
              id: stableSubjectId("player", state.profile.name),
              name: state.profile.name,
              initials: state.profile.initials,
              role: "Người tạo kèo",
              amount: total,
              paid: false,
            },
          ],
        },
      };
      state.bookings.unshift(booking);
      upsertJourney(
        "booking",
        booking.id,
        "held",
        { bookingId: booking.id, matchName: booking.court },
      );
      const voucherNote = booking.voucher
        ? ` Đã dùng ${booking.voucher.code}, giảm ${money(booking.voucher.discount)}.`
        : "";
      addNotification(
        "Đã giữ sân trong 10 phút",
        `${booking.court} · ${booking.date}, ${booking.time}.${voucherNote}`
          + " Hãy xác nhận hoặc mời đội.",
        "booking",
      );
      save("booking-held");
      return clone(booking);
    },
    updateBookingRules: (bookingId, rules) => {
      const booking = getBooking(bookingId);
      if (
        !booking
        || booking.ownerPaid
        || ["expired", "cancelled"].includes(booking.status)
      ) return null;
      booking.joinRules = normaliseJoinRules(rules);
      const players = booking.split && Array.isArray(booking.split.players)
        ? booking.split.players
        : [];
      players.forEach((player) => {
        if (player === players[0]) return;
        const decision = approvalCheck(booking, {
          ...player,
          level: player.level || booking.level,
          completedMatches: player.completedMatches,
          rating: player.rating,
        });
        const requiresPayment = Boolean(booking.joinRules.requirePaymentBeforeJoin);
        const autoEligible = Boolean(
          booking.joinRules.autoApprove && decision.eligible,
        );
        if (requiresPayment) player.paid = true;
        player.autoApproved = autoEligible;
        player.approvalNote = decision.eligible
          ? "Đủ tiêu chí tham gia"
          : `Còn thiếu: ${decision.failed.join(", ")}`;
        if (autoEligible) {
          player.joinStatus = "approved";
          player.role = player.paid
            ? "Đã tự động duyệt · Đã thanh toán"
            : "Đã tự động duyệt · Không cần thanh toán trước";
        } else if (player.joinStatus === "approved" && !decision.eligible) {
          player.joinStatus = "pending";
          player.role = player.paid
            ? "Đã thanh toán · Chờ đủ tiêu chí"
            : "Đang chờ đủ tiêu chí tham gia";
        } else if (player.joinStatus !== "approved") {
          player.joinStatus = "pending";
          player.role = requiresPayment && player.paid
            ? "Đã thanh toán · Chờ chủ kèo duyệt"
            : "Đang chờ chủ kèo duyệt";
        }
      });
      booking.updatedAt = now();
      save("booking-rules-updated");
      return clone(booking);
    },
    getBookings: () => { expireBookings(); return clone(state.bookings); },
    getBooking: (bookingId) => clone(getBooking(bookingId)),
    getLatestBooking: () => { expireBookings(); return clone(state.bookings[0] || null); },
    confirmBooking: (bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.status !== "held") return null;
      booking.status = "confirmed";
      booking.updatedAt = now();
      upsertJourney(
        "booking",
        booking.id,
        "confirmed",
        { bookingId: booking.id, matchName: booking.court },
      );
      addNotification(
        "Đã xác nhận đặt sân",
        `${booking.court} · ${booking.date}, ${booking.time} đã có trong lịch của bạn.`,
        "booking",
      );
      save("booking-confirmed");
      return clone(booking);
    },
    cancelBooking: (bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || !["held", "confirmed"].includes(booking.status)) return null;
      booking.status = "cancelled";
      booking.updatedAt = now();
      upsertJourney(
        "booking",
        booking.id,
        "cancelled",
        { bookingId: booking.id, matchName: booking.court },
      );
      addNotification(
        "Đã hủy lịch sân",
        `${booking.court} · ${booking.date}, ${booking.time}.`,
        "booking",
      );
      save("booking-cancelled");
      return clone(booking);
    },
    saveBookingSplit: (bookingId, split) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.ownerPaid) return null;
      booking.split = clone(split);
      booking.updatedAt = now();
      save("booking-split-updated");
      return clone(booking);
    },
    addBookingPlayer: (bookingId, playerInput = {}) => {
      const booking = getBooking(bookingId);
      if (
        !booking
        || booking.ownerPaid
        || ["expired", "cancelled"].includes(booking.status)
      ) return null;
      const players = booking.split && Array.isArray(booking.split.players)
        ? booking.split.players
        : [];
      const maxPlayers = Math.max(1, integer(booking.teamSize) || 4);
      if (players.length >= maxPlayers) return null;
      const player = normalisePlayer({
        ...playerInput,
        role: playerInput.role || "Đã được mời · Đang chờ tham gia",
        paid: false,
      });
      if (
        !player
        || players.some((item) => subjectKey(item.name) === subjectKey(player.name))
      ) return null;
      const decision = approvalCheck(booking, {
        ...player,
        level: playerInput.level || booking.level,
        completedMatches: playerInput.completedMatches,
        rating: playerInput.rating,
      });
      const requirePayment = Boolean(
        booking.joinRules && booking.joinRules.requirePaymentBeforeJoin,
      );
      const autoEligible = Boolean(
        booking.joinRules && booking.joinRules.autoApprove && decision.eligible,
      );
      const joinStatus = autoEligible ? "approved" : "pending";
      player.paid = requirePayment;
      player.joinStatus = joinStatus;
      player.autoApproved = autoEligible;
      player.approvalNote = decision.eligible
        ? "Đủ tiêu chí tham gia"
        : `Còn thiếu: ${decision.failed.join(", ")}`;
      if (joinStatus === "approved") {
        player.role = requirePayment
          ? "Đã tự động duyệt · Đã thanh toán"
          : "Đã tự động duyệt · Không cần thanh toán trước";
      } else {
        player.role = requirePayment && player.paid
          ? "Đã thanh toán · Chờ chủ kèo duyệt"
          : "Đang chờ chủ kèo duyệt";
      }
      booking.split = {
        mode: "equal",
        players: splitEqual([...players, player], amount(booking.total)),
      };
      booking.updatedAt = now();
      save("booking-player-added");
      return clone(booking);
    },
    updateBookingPlayerStatus: (bookingId, playerId, status) => {
      const booking = getBooking(bookingId);
      if (!booking || !booking.split || !Array.isArray(booking.split.players)) {
        return null;
      }
      const player = booking.split.players.find((item) => item.id === playerId);
      if (!player || !["approved", "rejected"].includes(status)) return null;
      if (
        status === "approved"
        && booking.joinRules
        && booking.joinRules.requirePaymentBeforeJoin
        && !player.paid
      ) return null;
      const decision = approvalCheck(booking, {
        ...player,
        level: player.level || booking.level,
        completedMatches: player.completedMatches,
        rating: player.rating,
      });
      if (status === "approved" && !decision.eligible) {
        player.approvalNote = `Còn thiếu: ${decision.failed.join(", ")}`;
        return null;
      }
      player.joinStatus = status;
      player.role = status === "approved"
        ? player.paid
          ? "Đã được chủ kèo duyệt · Đã thanh toán"
          : "Đã được chủ kèo duyệt · Không cần thanh toán trước"
        : "Không được duyệt";
      booking.updatedAt = now();
      save("booking-player-status-updated");
      return clone(booking);
    },
    payForBooking: (bookingId, requestedPoints = 0) => {
      const booking = getBooking(bookingId);
      if (
        !booking
        || booking.ownerPaid
        || booking.status === "expired"
        || booking.status === "cancelled"
      ) return null;
      const subtotal = amount(booking.subtotal);
      const preview = previewPoints(subtotal, requestedPoints);
      if (!preview.isValid) return null;
      const players = booking.split && Array.isArray(booking.split.players)
        ? booking.split.players
        : [];
      if (!players.length) return null;
      const currentSplitTotal = players.reduce((sum, player) => sum + amount(player.amount), 0);
      if (booking.split.mode === "custom" && currentSplitTotal !== subtotal) return null;
      const previewSplit = booking.split.mode === "custom"
        ? splitProportionally(players, currentSplitTotal, preview.paidAmount)
        : splitEqual(players, preview.paidAmount);
      const ownerAmount = amount(previewSplit[0] && previewSplit[0].amount);
      if (ownerAmount > state.wallet.balance) return null;
      const loyaltyPayment = settleLoyalty({
        subtotal: ownerAmount,
        requestedPoints: 0,
        sourceType: "booking",
        sourceId: booking.id,
        label: `thanh toán sân ${booking.court}`,
      });
      if (!loyaltyPayment) return null;
      if (preview.points) {
        addLoyaltyTransaction({
          type: "redeem",
          points: -preview.points,
          sourceType: "booking",
          sourceId: booking.id,
          amount: preview.discount,
          description: `Đổi ${preview.points} điểm giảm ${money(preview.discount)} `
            + `cho đơn sân ${booking.court}`,
        });
      }
      const discountedPlayers = applyBookingDiscount(booking, preview);
      if (!discountedPlayers) return null;
      const walletPaymentDetail = debitWallet({
        amount: ownerAmount,
        sourceType: "booking",
        sourceId: booking.id,
        label: `sân ${booking.court}`,
      });
      if (!walletPaymentDetail) return null;
      booking.ownerPaid = true;
      booking.ownerPaymentMethod = "Ví MatchUp";
      booking.payment = {
        subtotal: ownerAmount,
        paidAmount: ownerAmount,
        redeemedPoints: preview.points,
        discount: preview.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
        walletAmount: walletPaymentDetail.amount,
      };
      booking.updatedAt = now();
      const self = booking.split && booking.split.players && booking.split.players[0];
      if (self) self.paid = true;
      upsertJourney(
        "booking",
        booking.id,
        "paid",
        { bookingId: booking.id, matchName: booking.court },
      );
      const loyaltyNote = [
        preview.points ? ` Đã đổi ${preview.points} điểm.` : "",
        loyaltyPayment.earnedPoints
          ? ` Tích ${loyaltyPayment.earnedPoints} điểm.`
          : "",
      ].join("");
      addNotification(
        "Thanh toán sân thành công",
        `Bạn đã thanh toán ${money(ownerAmount)} `
          + `cho ${booking.court}.${loyaltyNote}`,
        "payment",
      );
      save("booking-paid");
      return clone(booking);
    },
    getSecondsRemaining: (booking) => booking && booking.status === "held"
      ? Math.max(0, Math.ceil((booking.holdExpiresAt - now()) / 1000))
      : 0,
    resetDemo: () => {
      const nextState = defaultState();
      Object.keys(state).forEach((key) => { delete state[key]; });
      Object.assign(state, nextState);
      try { localStorage.clear(); } catch (_) { /* storage may be unavailable */ }
      try { sessionStorage.clear(); } catch (_) { /* storage may be unavailable */ }
      document.dispatchEvent(new CustomEvent(EVENT_NAME, {
        detail: { reason: "demo-reset", state: clone(state) },
      }));
      return clone(state);
    },
    };
};
