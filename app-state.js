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
  const SPORT_LABELS = Object.freeze({ football: "bóng đá", badminton: "cầu lông", pickleball: "pickleball", basketball: "bóng rổ" });
  const VOUCHER_CATALOG = Object.freeze([
    {
      id: "welcome20",
      code: "MATCH20",
      category: "new",
      categoryLabel: "Tân thủ",
      icon: "celebration",
      tone: "yellow",
      title: "Giảm 20% lần đặt sân đầu",
      description: "Áp dụng cho mọi sân đối tác",
      condition: "Đơn từ 120.000đ",
      expires: "Hết hạn 31/08",
      expiresAt: "2026-08-31T23:59:59+07:00",
      discountType: "percent",
      discountValue: 20,
      maxDiscount: 80000,
      minSpend: 120000,
      requiresFirstBooking: true,
      priority: 1,
    },
    {
      id: "offpeak50",
      code: "OFFPEAK50",
      category: "offpeak",
      categoryLabel: "Giờ thấp điểm",
      icon: "wb_sunny",
      tone: "orange",
      title: "Giảm 50.000đ giờ thấp điểm",
      description: "Thứ 2–6 · 06:00–17:00",
      condition: "Đơn từ 150.000đ",
      expires: "Hết hạn 15/09",
      expiresAt: "2026-09-15T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 50000,
      minSpend: 150000,
      weekdayOnly: true,
      timeRange: { start: 6, end: 17 },
      priority: 2,
    },
    {
      id: "football30",
      code: "FOOTBALL30",
      category: "sport",
      categoryLabel: "Theo môn",
      icon: "sports_soccer",
      tone: "green",
      title: "Bóng đá giảm 30.000đ",
      description: "Dành riêng cho sân bóng đá",
      condition: "Đơn từ 180.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 30000,
      minSpend: 180000,
      sports: ["football"],
      priority: 3,
    },
    {
      id: "badminton15",
      code: "RACKET15",
      category: "sport",
      categoryLabel: "Theo môn",
      icon: "sports",
      tone: "blue",
      title: "Cầu lông giảm 15%",
      description: "Cho mọi sân cầu lông đối tác",
      condition: "Giảm tối đa 40.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "percent",
      discountValue: 15,
      maxDiscount: 40000,
      sports: ["badminton"],
      priority: 4,
    },
    {
      id: "pickleball40",
      code: "PICKLE40",
      category: "sport",
      categoryLabel: "Theo môn",
      icon: "sports_tennis",
      tone: "purple",
      title: "Pickleball giảm 40.000đ",
      description: "Thử sân pickleball gần bạn",
      condition: "Đơn từ 140.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 40000,
      minSpend: 140000,
      sports: ["pickleball"],
      priority: 5,
    },
    {
      id: "friends30",
      code: "TEAM30",
      category: "friends",
      categoryLabel: "Bạn bè",
      icon: "group",
      tone: "red",
      title: "Rủ đủ đội, giảm 30.000đ",
      description: "Khi nhóm có từ 4 người",
      condition: "Đơn từ 180.000đ",
      expires: "Hết hạn 30/09",
      expiresAt: "2026-09-30T23:59:59+07:00",
      discountType: "fixed",
      discountValue: 30000,
      minSpend: 180000,
      minTeamSize: 4,
      priority: 6,
    },
  ]);
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
      streak: 0,
      badges: [],
    },
    preferences: {
      sport: "football",
      time: "today",
      level: "Khá",
      radius: 10,
      availability: "Tối các ngày trong tuần",
    },
    matches: [],
    applications: [],
    chatRooms: {},
    bookings: [],
    savedMatches: [],
    savedMatchDetails: {},
    playJourneys: [],
    matchFeedback: [],
    waitlists: [],
    loyalty: loyaltyDefaults(),
    notifications: [
      { id: id("notice"), type: "tip", title: "Chào mừng đến MatchUp", body: "Hồ sơ của bạn giúp MatchUp gợi ý kèo hợp hơn.", createdAt: now(), read: false },
    ],
  });

  const normaliseState = (saved) => {
    saved.profile = saved.profile && typeof saved.profile === "object" ? saved.profile : defaultState().profile;
    saved.profile.sports = Array.isArray(saved.profile.sports) ? saved.profile.sports : ["football"];
    saved.profile.streak = integer(saved.profile.streak);
    saved.profile.badges = Array.isArray(saved.profile.badges) ? saved.profile.badges : [];
    saved.preferences = saved.preferences && typeof saved.preferences === "object" ? saved.preferences : {
      sport: saved.profile.sports && saved.profile.sports[0] || "football",
      time: "today",
      level: saved.profile.level || "Khá",
      radius: Number(saved.profile.radius) || 10,
      availability: saved.profile.availability || "Linh hoạt",
    };
    const loyalty = saved && saved.loyalty && typeof saved.loyalty === "object" ? saved.loyalty : loyaltyDefaults();
    saved.loyalty = {
      balance: integer(loyalty.balance),
      transactions: Array.isArray(loyalty.transactions) ? loyalty.transactions.slice(0, 50) : [],
    };
    saved.applications = Array.isArray(saved.applications) ? saved.applications : [];
    saved.chatRooms = saved.chatRooms && typeof saved.chatRooms === "object" ? saved.chatRooms : {};
    saved.bookings = Array.isArray(saved.bookings) ? saved.bookings : [];
    saved.notifications = Array.isArray(saved.notifications) ? saved.notifications : [];
    saved.savedMatches = Array.isArray(saved.savedMatches) ? saved.savedMatches : [];
    saved.savedMatchDetails = saved.savedMatchDetails && typeof saved.savedMatchDetails === "object" ? saved.savedMatchDetails : {};
    saved.playJourneys = Array.isArray(saved.playJourneys) ? saved.playJourneys : [];
    saved.matchFeedback = Array.isArray(saved.matchFeedback) ? saved.matchFeedback : [];
    saved.waitlists = Array.isArray(saved.waitlists) ? saved.waitlists : [];
    saved.applications.forEach((application) => {
      if (!saved.playJourneys.some((journey) => journey.type === "match" && journey.sourceId === application.id)) {
        saved.playJourneys.push({ id: id("journey"), type: "match", sourceId: application.id, matchId: application.matchId, matchName: application.match && application.match.name, status: application.status, feedbackSubmitted: false, createdAt: application.createdAt || now(), updatedAt: application.updatedAt || now() });
      }
    });
    saved.bookings.forEach((booking) => {
      if (!saved.playJourneys.some((journey) => journey.type === "booking" && journey.sourceId === booking.id)) {
        saved.playJourneys.push({ id: id("journey"), type: "booking", sourceId: booking.id, bookingId: booking.id, matchName: booking.court, status: booking.ownerPaid ? "paid" : booking.status, feedbackSubmitted: false, createdAt: booking.createdAt || now(), updatedAt: booking.updatedAt || now() });
      }
    });
    saved.bookings.forEach((booking) => {
      if (!Number.isFinite(Number(booking.subtotal))) booking.subtotal = amount(booking.total);
      if (!Number.isFinite(Number(booking.originalTotal))) booking.originalTotal = amount(booking.subtotal);
      if (!booking.voucher || typeof booking.voucher !== "object") booking.voucher = null;
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
  const upsertJourney = (type, sourceId, status, extra = {}) => {
    let journey = state.playJourneys.find((item) => item.type === type && item.sourceId === sourceId);
    if (!journey) {
      journey = { id: id("journey"), type, sourceId, status, feedbackSubmitted: false, createdAt: now(), updatedAt: now(), ...extra };
      state.playJourneys.unshift(journey);
    } else {
      journey.status = status;
      journey.updatedAt = now();
      Object.assign(journey, extra);
    }
    return journey;
  };
  const findJourney = (type, sourceId) => state.playJourneys.find((item) => item.type === type && item.sourceId === sourceId) || null;
  const chatApplication = (matchId) => state.applications.find((application) => application.matchId === matchId && ["accepted", "paid"].includes(application.status)) || null;
  const hostForMatch = (match) => {
    const participants = Array.isArray(match && match.participants) ? match.participants : [];
    return participants.find((player) => player.role === "Chủ kèo") || participants[0] || { name: "Chủ kèo MatchUp", initials: "MU", tone: "#6680ba" };
  };
  const ensureChatRoom = (matchId, match) => {
    if (!matchId || !match) return null;
    if (!state.chatRooms[matchId]) {
      const host = hostForMatch(match);
      const hostIsCurrentUser = host.name === state.profile.name;
      const sender = hostIsCurrentUser ? { name: "Minh Khang", initials: "MK", tone: "#6680ba" } : host;
      state.chatRooms[matchId] = {
        id: `chat-${matchId}`,
        matchId,
        createdAt: now(),
        unreadCount: 1,
        messages: [
          { id: id("message"), kind: "system", text: "Phòng chat riêng đã mở sau khi chủ kèo duyệt bạn vào đội.", createdAt: now() },
          { id: id("message"), kind: "text", senderId: "host", senderName: sender.name, senderInitials: sender.initials, senderTone: sender.tone, text: "Chào mừng bạn vào kèo! Mình chốt sân và giờ ở đây nhé.", createdAt: now() },
        ],
      };
    }
    return state.chatRooms[matchId];
  };
  const matchInsight = (match) => {
    const profile = state.profile;
    const levelMatch = match.level === profile.level;
    const sportMatch = Array.isArray(profile.sports) && profile.sports.includes(match.sport);
    const nearby = Number(match.distance) <= Number(profile.radius || 10);
    const startsLate = Number(String(match.time || "").match(/\d{1,2}/)?.[0] || 0) >= 17;
    const eveningPreference = String(profile.availability || "").toLowerCase().includes("tối");
    const timeMatch = eveningPreference ? startsLate : true;
    const reasons = [];
    if (levelMatch) reasons.push(`Cùng trình độ ${profile.level}`);
    if (nearby) reasons.push(`Cách bạn ${Number(match.distance).toFixed(1).replace(".", ",")} km`);
    if (timeMatch) reasons.push("Đúng khung giờ bạn thường rảnh");
    if (sportMatch) reasons.push("Đúng môn bạn yêu thích");
    if (Number(match.available) === 1) reasons.push("Cần thêm đúng 1 người");
    if (!reasons.length) reasons.push("Đang được xếp theo sở thích của bạn");
    const baseScore = Number(match.score) || 78;
    const score = Math.min(99, Math.max(60, Math.round((baseScore + (levelMatch ? 2 : 0) + (sportMatch ? 1 : 0)) / 1)));
    return {
      score,
      reasons: reasons.slice(0, 4),
      host: { name: match.creatorName || (match.participants && match.participants[0] && match.participants[0].name) || "Chủ kèo MatchUp", reliability: 98, matches: 24 },
      vibe: match.vibe || (match.format && match.format.toLowerCase().includes("giao") ? "Giao lưu, thân thiện" : "Cân bằng và vui vẻ"),
    };
  };
  const money = (amount) => new Intl.NumberFormat("vi-VN").format(Math.round(Number(amount) || 0)) + "đ";
  const bookingHistoryExists = () => state.bookings.some((booking) => !["cancelled", "expired"].includes(booking.status));
  const voucherDiscountLabel = (voucher) => voucher.discountType === "percent"
    ? `Giảm ${voucher.discountValue}%`
    : `Giảm ${money(voucher.discountValue)}`;
  const voucherDiscount = (voucher, subtotal) => {
    const safeSubtotal = amount(subtotal);
    if (!safeSubtotal) return 0;
    const raw = voucher.discountType === "percent"
      ? Math.round(safeSubtotal * voucher.discountValue / 100)
      : voucher.discountValue;
    return Math.min(safeSubtotal, voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw);
  };
  const voucherContext = (context = {}) => {
    const hasContext = Object.keys(context || {}).length > 0;
    return {
      hasContext,
      subtotal: amount(context.subtotal),
      sport: context.sport || "",
      time: context.time || "",
      date: context.date || "",
      teamSize: Number(context.teamSize) || 0,
      isFirstBooking: context.isFirstBooking === undefined ? !bookingHistoryExists() : Boolean(context.isFirstBooking),
    };
  };
  const voucherReason = (voucher, context) => {
    if (!context.hasContext) return "";
    if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < now()) return "Voucher đã hết hạn";
    if (voucher.requiresFirstBooking && !context.isFirstBooking) return "Chỉ áp dụng cho lần đặt sân đầu tiên";
    if (voucher.sports && context.sport && !voucher.sports.includes(context.sport)) return `Chỉ áp dụng cho ${voucher.sports.map((sport) => SPORT_LABELS[sport] || sport).join(" hoặc ")}`;
    if (voucher.minSpend && context.subtotal && context.subtotal < voucher.minSpend) return `Đơn tối thiểu ${money(voucher.minSpend)}`;
    if (voucher.weekdayOnly && context.date && ["Thứ Bảy", "Chủ nhật"].includes(context.date)) return "Chỉ áp dụng từ thứ 2 đến thứ 6";
    if (voucher.timeRange && context.time) {
      const hour = Number(String(context.time).split(":")[0]);
      if (hour < voucher.timeRange.start || hour >= voucher.timeRange.end) return "Không áp dụng cho khung giờ này";
    }
    if (voucher.minTeamSize && context.teamSize && context.teamSize < voucher.minTeamSize) return `Cần nhóm từ ${voucher.minTeamSize} người`;
    return "";
  };
  const evaluateVoucher = (voucher, context = {}) => {
    const resolved = voucherContext(context);
    const reason = voucherReason(voucher, resolved);
    const eligible = !reason;
    return {
      ...voucher,
      eligible,
      reason,
      discount: eligible ? voucherDiscount(voucher, resolved.subtotal) : 0,
      discountLabel: voucherDiscountLabel(voucher),
      isFirstBooking: resolved.isFirstBooking,
    };
  };
  const getVouchers = (context = {}) => VOUCHER_CATALOG.map((voucher) => evaluateVoucher(voucher, context));
  const bestVoucher = (context = {}) => getVouchers(context)
    .filter((voucher) => voucher.eligible)
    .sort((a, b) => b.discount - a.discount || a.priority - b.priority)[0] || null;
  const previewVoucher = (voucherId, context = {}) => {
    const voucher = VOUCHER_CATALOG.find((item) => item.id === voucherId || item.code === voucherId);
    return voucher ? evaluateVoucher(voucher, context) : null;
  };
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
      upsertJourney("booking", booking.id, "expired", { bookingId: booking.id, matchName: booking.court });
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
    getVouchers: (context = {}) => clone(getVouchers(context)),
    getVoucher: (voucherId) => clone(VOUCHER_CATALOG.find((voucher) => voucher.id === voucherId || voucher.code === voucherId) || null),
    previewVoucher: (voucherId, context = {}) => clone(previewVoucher(voucherId, context)),
    getBestVoucher: (context = {}) => clone(bestVoucher(context)),
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
    getPreferences: () => clone(state.preferences),
    updateProfile: (updates) => {
      state.profile = { ...state.profile, ...updates };
      state.profile.initials = initials(state.profile.name);
      state.preferences = { ...state.preferences, level: state.profile.level, radius: state.profile.radius, availability: state.profile.availability, sport: state.profile.sports[0] || state.preferences.sport };
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
        vibe: "Giao lưu, thân thiện",
      };
      state.matches.unshift(match);
      addNotification("Đã đăng kèo mới", `${match.name} đang chờ thêm ${match.available} người chơi.`, "match");
      save("match-created");
      return clone(match);
    },
    getCustomMatches: () => clone(state.matches),
    getMatch: (matchId) => clone(state.matches.find((match) => match.id === matchId) || null),
    getMatchInsights: (match) => clone(matchInsight(match || {})),
    isMatchSaved: (matchId) => state.savedMatches.includes(matchId),
    toggleSavedMatch: (matchId, label = "kèo này", details = null) => {
      const index = state.savedMatches.indexOf(matchId);
      const saved = index === -1;
      if (saved) {
        state.savedMatches.unshift(matchId);
        if (details && typeof details === "object") state.savedMatchDetails[matchId] = clone({ ...details, id: matchId });
      } else {
        state.savedMatches.splice(index, 1);
        delete state.savedMatchDetails[matchId];
      }
      addNotification(saved ? "Đã lưu kèo" : "Đã bỏ lưu kèo", saved ? `Bạn sẽ dễ tìm lại ${label}.` : `${label} đã được bỏ khỏi danh sách lưu.`, "match");
      save(saved ? "match-saved" : "match-unsaved");
      return saved;
    },
    getSavedMatches: () => clone(state.savedMatches),
    getSavedMatchRecords: () => clone(state.savedMatches.map((matchId) => state.savedMatchDetails[matchId] || { id: matchId, name: "Kèo đã lưu" })),
    requestWaitlist: (criteria = {}) => {
      const key = JSON.stringify({ sport: criteria.sport || "all", time: criteria.time || "all", level: criteria.level || "all", radius: Number(criteria.radius) || 10 });
      const existing = state.waitlists.find((item) => item.key === key && item.status === "active");
      if (existing) return clone(existing);
      const waitlist = { id: id("wait"), key, criteria: { ...criteria }, status: "active", createdAt: now() };
      state.waitlists.unshift(waitlist);
      addNotification("Đã bật báo kèo", "MatchUp sẽ nhắc bạn khi có kèo mới phù hợp bộ lọc này.", "match");
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
      addNotification("Trận chơi đã hoàn thành", "Chia sẻ cảm nhận để nhận huy hiệu cho đội của bạn.", "feedback");
      save("journey-completed");
      return clone(journey);
    },
    submitFeedback: (input = {}) => {
      const rating = Math.min(5, Math.max(1, integer(input.rating) || 5));
      const atmosphere = Math.min(5, Math.max(1, integer(input.atmosphere) || rating));
      const existing = state.matchFeedback.find((item) => item.type === input.type && item.sourceId === input.sourceId);
      if (existing) return clone(existing);
      const feedback = { id: id("feedback"), type: input.type, sourceId: input.sourceId, rating, atmosphere, tags: Array.isArray(input.tags) ? input.tags.slice(0, 4) : [], repeat: input.repeat !== false, createdAt: now() };
      state.matchFeedback.unshift(feedback);
      const journey = upsertJourney(input.type, input.sourceId, "completed", { feedbackSubmitted: true });
      state.profile.streak = integer(state.profile.streak) + 1;
      const badge = atmosphere >= 4 ? "Đồng đội tích cực" : "Luôn sẵn sàng ra sân";
      if (!state.profile.badges.includes(badge)) state.profile.badges.unshift(badge);
      addNotification("Cảm ơn bạn đã chia sẻ", `Bạn nhận huy hiệu “${badge}”. Trận tiếp theo đang chờ bạn!`, "feedback");
      save("feedback-submitted");
      return clone({ feedback, journey });
    },
    getFeedback: () => clone(state.matchFeedback),
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
      upsertJourney("match", application.id, "requested", { matchId: match.id, matchName: match.name });
      state.applications.unshift(application);
      addNotification("Đã gửi yêu cầu vào kèo", `Yêu cầu vào ${match.name} đang chờ chủ kèo phản hồi.`, "match");
      save("match-applied");
      return clone(application);
    },
    getApplications: () => clone(state.applications),
    getChatAccess: (matchId) => {
      const application = chatApplication(matchId);
      if (!application) return { allowed: false, status: null, reason: "Phòng chat chỉ mở sau khi chủ kèo duyệt yêu cầu." };
      const room = ensureChatRoom(matchId, application.match);
      return clone({ allowed: true, status: application.status, match: application.match, roomId: room.id });
    },
    getChatRooms: () => clone(state.applications.filter((application) => ["accepted", "paid"].includes(application.status)).map((application) => {
      const room = ensureChatRoom(application.matchId, application.match);
      const messages = Array.isArray(room.messages) ? room.messages : [];
      const lastMessage = messages.filter((message) => message.kind !== "system").slice(-1)[0] || messages.slice(-1)[0] || null;
      return { id: room.id, matchId: application.matchId, status: application.status, match: application.match, lastMessage, unreadCount: Number(room.unreadCount) || 0, updatedAt: lastMessage ? lastMessage.createdAt : room.createdAt };
    }).sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))),
    markChatRead: (matchId) => {
      const room = state.chatRooms[matchId];
      if (!room || !room.unreadCount) return false;
      room.unreadCount = 0;
      save("chat-read");
      return true;
    },
    getChatMessages: (matchId) => clone((state.chatRooms[matchId] && state.chatRooms[matchId].messages) || []),
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
      application.status = status;
      application.updatedAt = now();
      upsertJourney("match", application.id, status, { matchId: application.matchId, matchName: application.match.name });
      const label = status === "accepted" ? "Bạn đã được nhận vào kèo" : status === "declined" ? "Yêu cầu vào kèo không được duyệt" : "Đã hủy yêu cầu vào kèo";
      addNotification(label, application.match.name, "match");
      if (status === "accepted") {
        ensureChatRoom(application.matchId, application.match);
        addNotification("Phòng chat đã mở", `Bạn có thể làm quen với đội trong ${application.match.name}.`, "chat");
      }
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
      upsertJourney("match", application.id, "paid", { matchId: application.matchId, matchName: application.match.name });
      application.updatedAt = now();
      const loyaltyNote = `${loyaltyPayment.points ? ` Đã đổi ${loyaltyPayment.points} điểm.` : ""}${loyaltyPayment.earnedPoints ? ` Tích ${loyaltyPayment.earnedPoints} điểm.` : ""}`;
      addNotification("Đã thanh toán cọc kèo", `${money(loyaltyPayment.paidAmount)} cho ${application.match.name}.${loyaltyNote}`, "payment");
      save("application-paid");
      return clone(application);
    },
    createBooking: (input) => {
      expireBookings();
      const hasSubtotal = Object.prototype.hasOwnProperty.call(input, "subtotal");
      const originalTotal = amount(hasSubtotal ? input.subtotal : input.total);
      const voucherContext = {
        subtotal: originalTotal,
        sport: input.sport || "",
        date: input.date || "",
        time: input.time || "",
        teamSize: Number(input.teamSize) || 4,
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
        distance: input.distance || "gần bạn",
        sport: input.sport || "football",
        date: input.date,
        time: input.time,
        duration: input.duration || 90,
        total,
        subtotal: total,
        originalTotal,
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
            { name: state.profile.name, initials: state.profile.initials, role: "Người tạo kèo", amount: Math.round(total / 4), paid: false },
            { name: "Minh Khoa", initials: "MK", role: "Đã vào kèo · Đang chờ thanh toán", amount: Math.round(total / 4), paid: false },
            { name: "Thu Linh", initials: "TL", role: "Đã vào kèo · Đang chờ thanh toán", amount: Math.round(total / 4), paid: false },
            { name: "Còn 1 chỗ", initials: "+", role: "Mời thêm người để chia đều hơn", amount: Math.round(total / 4), paid: false, empty: true },
          ],
        },
      };
      state.bookings.unshift(booking);
      upsertJourney("booking", booking.id, "held", { bookingId: booking.id, matchName: booking.court });
      const voucherNote = booking.voucher ? ` Đã dùng ${booking.voucher.code}, giảm ${money(booking.voucher.discount)}.` : "";
      addNotification("Đã giữ sân trong 10 phút", `${booking.court} · ${booking.date}, ${booking.time}.${voucherNote} Hãy xác nhận hoặc mời đội.`, "booking");
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
      upsertJourney("booking", booking.id, "confirmed", { bookingId: booking.id, matchName: booking.court });
      addNotification("Đã xác nhận đặt sân", `${booking.court} · ${booking.date}, ${booking.time} đã có trong lịch của bạn.`, "booking");
      save("booking-confirmed");
      return clone(booking);
    },
    cancelBooking: (bookingId) => {
      const booking = getBooking(bookingId);
      if (!booking || !["held", "confirmed"].includes(booking.status)) return null;
      booking.status = "cancelled";
      booking.updatedAt = now();
      upsertJourney("booking", booking.id, "cancelled", { bookingId: booking.id, matchName: booking.court });
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
      upsertJourney("booking", booking.id, "paid", { bookingId: booking.id, matchName: booking.court });
      const loyaltyNote = `${preview.points ? ` Đã đổi ${preview.points} điểm.` : ""}${loyaltyPayment.earnedPoints ? ` Tích ${loyaltyPayment.earnedPoints} điểm.` : ""}`;
      addNotification("Thanh toán sân thành công", `Bạn đã thanh toán ${money(ownerAmount)} qua ${method} cho ${booking.court}.${loyaltyNote}`, "payment");
      save("booking-paid");
      return clone(booking);
    },
    getSecondsRemaining: (booking) => booking && booking.status === "held" ? Math.max(0, Math.ceil((booking.holdExpiresAt - now()) / 1000)) : 0,
    resetDemo: () => { state = defaultState(); save("demo-reset"); },
  };
})();
