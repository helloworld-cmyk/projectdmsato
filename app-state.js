/*
 * Small client-side data layer for the MatchUp demo.
 * It deliberately keeps all state in localStorage so every screen can share
 * a believable journey without requiring a backend.
 */
(() => {
  const STORAGE_KEY = "matchup-demo-state-v2";
  const EVENT_NAME = "matchup:state-change";
  const LOYALTY_POLICY = Object.freeze({
    earnPerAmount: 1000,
    pointValue: 100,
    maxDiscountRate: 0.5,
  });
  const now = () => Date.now();
  const id = (prefix) => `${prefix}-${now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const initials = (name) => String(name || "Ngọc Anh").trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
  const integer = (value) => Math.max(0, Math.floor(Number(value) || 0));
  const amount = (value) => Math.max(0, Math.round(Number(value) || 0));
  const loyaltyDefaults = () => ({ balance: 0, transactions: [] });
  const defaultState = () => ({
    profile: {
      name: "Ngọc Anh",
      initials: "NA",
      level: "Khá",
      radius: 10,
      sports: ["football", "badminton"],
      availability: "Tối các ngày trong tuần",
    },
    matches: [],
    applications: [],
    bookings: [],
    loyalty: loyaltyDefaults(),
    notifications: [
      { id: id("notice"), type: "tip", title: "Chào mừng đến MatchUp", body: "Hồ sơ của bạn giúp MatchUp gợi ý kèo hợp hơn.", createdAt: now(), read: false },
    ],
  });

  const normaliseState = (saved) => {
    const loyalty = saved && saved.loyalty && typeof saved.loyalty === "object" ? saved.loyalty : loyaltyDefaults();
    saved.loyalty = {
      balance: integer(loyalty.balance),
      transactions: Array.isArray(loyalty.transactions) ? loyalty.transactions.slice(0, 50) : [],
    };
    saved.applications = Array.isArray(saved.applications) ? saved.applications : [];
    saved.bookings = Array.isArray(saved.bookings) ? saved.bookings : [];
    saved.notifications = Array.isArray(saved.notifications) ? saved.notifications : [];
    saved.bookings.forEach((booking) => {
      if (!Number.isFinite(Number(booking.subtotal))) booking.subtotal = amount(booking.total);
    });
    return saved;
  };

  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.profile && Array.isArray(saved.matches)) return normaliseState(saved);
    } catch (_) { /* fall through to seed data */ }
    return defaultState();
  };
  let state = read();
  const save = (reason = "update") => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { reason, state: clone(state) } }));
  };
  const addNotification = (title, body, type = "info") => {
    state.notifications.unshift({ id: id("notice"), type, title, body, createdAt: now(), read: false });
    state.notifications = state.notifications.slice(0, 30);
  };
  const money = (amount) => new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount) || 0)) + "đ";
  const previewPoints = (subtotal, requestedPoints = 0) => {
    const safeSubtotal = amount(subtotal);
    const requested = integer(requestedPoints);
    const maxByOrder = Math.floor((safeSubtotal * LOYALTY_POLICY.maxDiscountRate) / LOYALTY_POLICY.pointValue);
    const maxPoints = Math.min(state.loyalty.balance, maxByOrder);
    const points = Math.min(requested, maxPoints);
    const discount = points * LOYALTY_POLICY.pointValue;
    return {
      subtotal: safeSubtotal,
      requestedPoints: requested,
      points,
      maxPoints,
      availablePoints: state.loyalty.balance,
      discount,
      paidAmount: safeSubtotal - discount,
      isValid: requested === points,
    };
  };
  const addLoyaltyTransaction = ({ type, points, sourceType, sourceId, amount: relatedAmount, description }) => {
    state.loyalty.balance = Math.max(0, state.loyalty.balance + points);
    state.loyalty.transactions.unshift({
      id: id("loyalty"),
      type,
      points,
      sourceType,
      sourceId,
      amount: amount(relatedAmount),
      description,
      createdAt: now(),
    });
    state.loyalty.transactions = state.loyalty.transactions.slice(0, 50);
  };
  const settleLoyalty = ({ subtotal, requestedPoints, sourceType, sourceId, label }) => {
    const preview = previewPoints(subtotal, requestedPoints);
    if (!preview.isValid) return null;
    if (preview.points) {
      addLoyaltyTransaction({
        type: "redeem",
        points: -preview.points,
        sourceType,
        sourceId,
        amount: preview.discount,
        description: `Đổi ${preview.points} điểm giảm ${money(preview.discount)} · ${label}`,
      });
    }
    const earnedPoints = Math.floor(preview.paidAmount / LOYALTY_POLICY.earnPerAmount);
    if (earnedPoints) {
      addLoyaltyTransaction({
        type: "earn",
        points: earnedPoints,
        sourceType,
        sourceId,
        amount: preview.paidAmount,
        description: `Tích ${earnedPoints} điểm từ ${label}`,
      });
    }
    return { ...preview, earnedPoints };
  };
  const splitEqual = (players, total) => {
    if (!players.length) return [];
    const base = Math.floor(total / players.length);
    const remainder = total - base * players.length;
    return players.map((player, index) => ({ ...player, amount: base + (index === 0 ? remainder : 0) }));
  };
  const splitProportionally = (players, previousTotal, nextTotal) => {
    if (!players.length || !previousTotal) return splitEqual(players, nextTotal);
    const shares = players.map((player, index) => {
      const raw = amount(player.amount) / previousTotal * nextTotal;
      return { index, base: Math.floor(raw), fraction: raw % 1 };
    });
    let remainder = nextTotal - shares.reduce((sum, share) => sum + share.base, 0);
    shares.sort((a, b) => b.fraction - a.fraction || a.index - b.index).forEach((share) => {
      if (remainder > 0) {
        share.base += 1;
        remainder -= 1;
      }
    });
    return players.map((player, index) => ({ ...player, amount: shares.find((share) => share.index === index).base }));
  };
  const applyBookingDiscount = (booking, preview) => {
    const previousTotal = amount(booking.subtotal);
    const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
    if (players.some((player) => player.paid)) return null;
    const isEqual = !booking.split || booking.split.mode !== "custom";
    const nextPlayers = isEqual
      ? splitEqual(players, preview.paidAmount)
      : splitProportionally(players, players.reduce((sum, player) => sum + amount(player.amount), 0), preview.paidAmount);
    booking.total = preview.paidAmount;
    booking.loyalty = { redeemedPoints: preview.points, discount: preview.discount, originalTotal: previousTotal };
    if (booking.split) booking.split.players = nextPlayers;
    return nextPlayers;
  };
  const expireBookings = () => {
    const expired = state.bookings.filter((booking) => booking.status === "held" && booking.holdExpiresAt <= now());
    if (!expired.length) return false;
    expired.forEach((booking) => {
      booking.status = "expired";
      booking.updatedAt = now();
      addNotification("Đã hết hạn giữ sân", `${booking.court} lúc ${booking.time} không còn được giữ cho bạn.`, "booking");
    });
    save("booking-expired");
    return true;
  };
  const getBooking = (bookingId) => {
    expireBookings();
    return state.bookings.find((booking) => booking.id === bookingId) || null;
  };

  window.MatchUpStore = {
    money,
    getState: () => { expireBookings(); return clone(state); },
    getLoyalty: () => clone({ ...state.loyalty, policy: LOYALTY_POLICY }),
    previewPoints: (subtotal, requestedPoints) => clone(previewPoints(subtotal, requestedPoints)),
    previewBookingPoints: (bookingId, requestedPoints) => {
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking) return null;
      const preview = previewPoints(amount(booking.subtotal), requestedPoints);
      const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
      const projectedPlayers = booking.split && booking.split.mode === "custom"
        ? splitProportionally(players, players.reduce((sum, player) => sum + amount(player.amount), 0), preview.paidAmount)
        : splitEqual(players, preview.paidAmount);
      return clone({ ...preview, ownerAmount: amount(projectedPlayers[0] && projectedPlayers[0].amount) });
    },
    getProfile: () => clone(state.profile),
    updateProfile: (updates) => {
      state.profile = { ...state.profile, ...updates };
      state.profile.initials = initials(state.profile.name);
      addNotification("Đã cập nhật hồ sơ", "Sở thích của bạn sẽ được dùng để gợi ý kèo phù hợp hơn.", "profile");
      save("profile-updated");
      return clone(state.profile);
    },
    addNotification: (title, body, type) => { addNotification(title, body, type); save("notification-added"); },
    getNotifications: () => clone(state.notifications),
    markNotificationsRead: () => {
      state.notifications.forEach((notification) => { notification.read = true; });
      save("notifications-read");
    },
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
        area: input.area || "Hà Đông",
        address: input.address || "Hà Đông, Hà Nội",
        time: input.time || "Tối nay, 20:00",
        timeKey: input.timeKey || "today",
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
        status: "open",
        createdAt: now(),
        participants: [{ name: profile.name, initials: profile.initials, role: "Chủ kèo", tone: "#d78c68", payment: "Chưa thanh toán" }],
      };
      state.matches.unshift(match);
      addNotification("Đã đăng kèo mới", `${match.name} đang chờ thêm ${match.available} người chơi.`, "match");
      save("match-created");
      return clone(match);
    },
    getCustomMatches: () => clone(state.matches),
    getMatch: (matchId) => clone(state.matches.find((match) => match.id === matchId) || null),
    cancelMatch: (matchId) => {
      const match = state.matches.find((item) => item.id === matchId);
      if (!match || match.status === "cancelled") return null;
      match.status = "cancelled";
      match.updatedAt = now();
      addNotification("Đã hủy kèo", `${match.name} không còn hiển thị cho người chơi khác.`, "match");
      save("match-cancelled");
      return clone(match);
    },
    applyToMatch: (match) => {
      const existing = state.applications.find((application) => application.matchId === match.id && application.status !== "cancelled");
      if (existing) return clone(existing);
      const application = {
        id: id("application"),
        matchId: match.id,
        match: clone(match),
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: now(),
        updatedAt: now(),
      };
      state.applications.unshift(application);
      addNotification("Đã gửi yêu cầu vào kèo", `Yêu cầu vào ${match.name} đang chờ chủ kèo phản hồi.`, "match");
      save("match-applied");
      return clone(application);
    },
    getApplications: () => clone(state.applications),
    updateApplicationStatus: (applicationId, status) => {
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application) return null;
      application.status = status;
      application.updatedAt = now();
      const label = status === "accepted" ? "Bạn đã được nhận vào kèo" : status === "declined" ? "Yêu cầu vào kèo không được duyệt" : "Đã hủy yêu cầu vào kèo";
      addNotification(label, application.match.name, "match");
      save("application-updated");
      return clone(application);
    },
    payForApplication: (applicationId, method = "VietQR", requestedPoints = 0) => {
      const application = state.applications.find((item) => item.id === applicationId);
      if (!application || application.status !== "accepted") return null;
      const subtotal = amount(application.match.deposit || application.match.share / 2);
      const loyaltyPayment = settleLoyalty({
        subtotal,
        requestedPoints,
        sourceType: "application",
        sourceId: application.id,
        label: `cọc kèo ${application.match.name}`,
      });
      if (!loyaltyPayment) return null;
      application.status = "paid";
      application.paymentStatus = "paid";
      application.paymentMethod = method;
      application.payment = {
        subtotal,
        paidAmount: loyaltyPayment.paidAmount,
        redeemedPoints: loyaltyPayment.points,
        discount: loyaltyPayment.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
      };
      application.updatedAt = now();
      const loyaltyNote = `${loyaltyPayment.points ? ` Đã đổi ${loyaltyPayment.points} điểm.` : ""}${loyaltyPayment.earnedPoints ? ` Tích ${loyaltyPayment.earnedPoints} điểm.` : ""}`;
      addNotification("Đã thanh toán cọc kèo", `${money(loyaltyPayment.paidAmount)} cho ${application.match.name}.${loyaltyNote}`, "payment");
      save("application-paid");
      return clone(application);
    },
    createBooking: (input) => {
      expireBookings();
      const total = Number(input.total) || 0;
      const booking = {
        id: id("booking"),
        court: input.court,
        distance: input.distance || "gần bạn",
        sport: input.sport || "football",
        date: input.date,
        time: input.time,
        duration: input.duration || 90,
        total,
        subtotal: total,
        status: "held",
        holdExpiresAt: now() + 10 * 60 * 1000,
        createdAt: now(),
        updatedAt: now(),
        ownerPaid: false,
        split: {
          mode: "equal",
          players: [
            { name: state.profile.name, initials: state.profile.initials, role: "Người tạo kèo", amount: Math.round(total / 4), paid: false },
            { name: "Minh Khoa", initials: "MK", role: "Đã vào kèo · Đang chờ thanh toán", amount: Math.round(total / 4), paid: false },
            { name: "Thu Linh", initials: "TL", role: "Đã vào kèo · Đang chờ thanh toán", amount: Math.round(total / 4), paid: false },
            { name: "Còn 1 chỗ", initials: "+", role: "Mời thêm người để chia đều hơn", amount: Math.round(total / 4), paid: false, empty: true },
          ],
        },
      };
      state.bookings.unshift(booking);
      addNotification("Đã giữ sân trong 10 phút", `${booking.court} · ${booking.date}, ${booking.time}. Hãy xác nhận hoặc mời đội.`, "booking");
      save("booking-held");
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
      addNotification("Đã xác nhận đặt sân", `${booking.court} · ${booking.date}, ${booking.time} đã có trong lịch của bạn.`, "booking");
      save("booking-confirmed");
      return clone(booking);
    },
    cancelBooking: (bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || !["held", "confirmed"].includes(booking.status)) return null;
      booking.status = "cancelled";
      booking.updatedAt = now();
      addNotification("Đã hủy lịch sân", `${booking.court} · ${booking.date}, ${booking.time}.`, "booking");
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
    payForBooking: (bookingId, method = "VietQR", requestedPoints = 0) => {
      const booking = getBooking(bookingId);
      if (!booking || booking.ownerPaid || booking.status === "expired" || booking.status === "cancelled") return null;
      const subtotal = amount(booking.subtotal);
      const preview = previewPoints(subtotal, requestedPoints);
      if (!preview.isValid) return null;
      const players = booking.split && Array.isArray(booking.split.players) ? booking.split.players : [];
      if (!players.length || players.some((player) => player.paid)) return null;
      const currentSplitTotal = players.reduce((sum, player) => sum + amount(player.amount), 0);
      if (booking.split.mode === "custom" && currentSplitTotal !== subtotal) return null;
      const previewSplit = booking.split.mode === "custom"
        ? splitProportionally(players, currentSplitTotal, preview.paidAmount)
        : splitEqual(players, preview.paidAmount);
      const ownerAmount = amount(previewSplit[0] && previewSplit[0].amount);
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
          description: `Đổi ${preview.points} điểm giảm ${money(preview.discount)} cho đơn sân ${booking.court}`,
        });
      }
      const discountedPlayers = applyBookingDiscount(booking, preview);
      if (!discountedPlayers) return null;
      booking.ownerPaid = true;
      booking.ownerPaymentMethod = method;
      booking.payment = {
        subtotal: ownerAmount,
        paidAmount: ownerAmount,
        redeemedPoints: preview.points,
        discount: preview.discount,
        earnedPoints: loyaltyPayment.earnedPoints,
      };
      booking.updatedAt = now();
      const self = booking.split && booking.split.players && booking.split.players[0];
      if (self) self.paid = true;
      const loyaltyNote = `${preview.points ? ` Đã đổi ${preview.points} điểm.` : ""}${loyaltyPayment.earnedPoints ? ` Tích ${loyaltyPayment.earnedPoints} điểm.` : ""}`;
      addNotification("Thanh toán sân thành công", `Bạn đã thanh toán ${money(ownerAmount)} qua ${method} cho ${booking.court}.${loyaltyNote}`, "payment");
      save("booking-paid");
      return clone(booking);
    },
    getSecondsRemaining: (booking) => booking && booking.status === "held" ? Math.max(0, Math.ceil((booking.holdExpiresAt - now()) / 1000)) : 0,
    resetDemo: () => { state = defaultState(); save("demo-reset"); },
  };
})();
