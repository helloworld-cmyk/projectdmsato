import {
  LOYALTY_POLICY,
  SPORT_LABELS,
  VOUCHER_CATALOG,
  WALLET_PAYMENT_METHOD,
} from "../core/constants.js";
import { amount as toAmount } from "../core/utils.js";

export const equalBookingPlayers = (players, total) => {
  if (!players.length) return [];
  const safeTotal = toAmount(total);
  const base = Math.floor(safeTotal / players.length);
  const remainder = safeTotal - base * players.length;
  return players.map((player, index) => ({
    ...player,
    amount: base + (index === 0 ? remainder : 0),
  }));
};

export const splitEqual = (players, total) => {
  if (!players.length) return [];
  const base = Math.floor(total / players.length);
  const remainder = total - base * players.length;
  return players.map((player, index) => ({
    ...player,
    amount: base + (index === 0 ? remainder : 0),
  }));
};

export const splitProportionally = (players, previousTotal, nextTotal) => {
  if (!players.length || !previousTotal) return splitEqual(players, nextTotal);
  const shares = players.map((player, index) => {
    const raw = toAmount(player.amount) / previousTotal * nextTotal;
    return { index, base: Math.floor(raw), fraction: raw % 1 };
  });
  let remainder = nextTotal - shares.reduce((sum, share) => sum + share.base, 0);
  shares.sort((a, b) => b.fraction - a.fraction || a.index - b.index).forEach((share) => {
    if (remainder > 0) {
      share.base += 1;
      remainder -= 1;
    }
  });
  return players.map((player, index) => ({
    ...player,
    amount: shares.find((share) => share.index === index).base,
  }));
};

export const createCommerceService = ({
  state,
  now,
  id,
  clone,
  amount = toAmount,
  addNotification,
  upsertJourney,
  save,
}) => {
  const money = (value) => (
    new Intl.NumberFormat("vi-VN").format(Math.round(Number(value) || 0)) + "đ"
  );
  const bookingHistoryExists = () => state.bookings.some((booking) => (
    !["cancelled", "expired"].includes(booking.status)
  ));
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
      times: Array.isArray(context.times) ? context.times.map(String) : [],
      date: context.date || "",
      teamSize: Number(context.teamSize) || 0,
      isFirstBooking: context.isFirstBooking === undefined
        ? !bookingHistoryExists()
        : Boolean(context.isFirstBooking),
    };
  };
  const voucherReason = (voucher, context) => {
    if (!context.hasContext) return "";
    if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < now()) {
      return "Voucher đã hết hạn";
    }
    if (voucher.requiresFirstBooking && !context.isFirstBooking) {
      return "Chỉ áp dụng cho lần đặt sân đầu tiên";
    }
    if (voucher.sports && context.sport && !voucher.sports.includes(context.sport)) {
      const sports = voucher.sports
        .map((sport) => SPORT_LABELS[sport] || sport)
        .join(" hoặc ");
      return `Chỉ áp dụng cho ${sports}`;
    }
    if (voucher.minSpend && context.subtotal && context.subtotal < voucher.minSpend) {
      return `Đơn tối thiểu ${money(voucher.minSpend)}`;
    }
    if (
      voucher.weekdayOnly
      && context.date
      && ["Thứ Bảy", "Chủ nhật"].includes(context.date)
    ) return "Chỉ áp dụng từ thứ 2 đến thứ 6";
    if (voucher.timeRange && (context.time || context.times.length)) {
      const times = context.times.length ? context.times : [context.time];
      const outsideOfferWindow = times.some((time) => {
        const hour = Number(String(time).split(":")[0]);
        return hour < voucher.timeRange.start || hour >= voucher.timeRange.end;
      });
      if (outsideOfferWindow) return "Không áp dụng cho tất cả khung giờ đã chọn";
    }
    if (
      voucher.minTeamSize
      && context.teamSize
      && context.teamSize < voucher.minTeamSize
    ) return `Cần nhóm từ ${voucher.minTeamSize} người`;
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
  const getVouchers = (context = {}) => (
    VOUCHER_CATALOG.map((voucher) => evaluateVoucher(voucher, context))
  );
  const bestVoucher = (context = {}) => getVouchers(context)
    .filter((voucher) => voucher.eligible)
    .sort((a, b) => b.discount - a.discount || a.priority - b.priority)[0] || null;
  const previewVoucher = (voucherId, context = {}) => {
    const voucher = VOUCHER_CATALOG.find((item) => (
      item.id === voucherId || item.code === voucherId
    ));
    return voucher ? evaluateVoucher(voucher, context) : null;
  };
  const previewPoints = (subtotal, requestedPoints = 0) => {
    const safeSubtotal = amount(subtotal);
    const requested = Math.max(0, Math.floor(Number(requestedPoints) || 0));
    const maxByOrder = Math.floor(
      (safeSubtotal * LOYALTY_POLICY.maxDiscountRate) / LOYALTY_POLICY.pointValue,
    );
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
  const addLoyaltyTransaction = ({
    type,
    points,
    sourceType,
    sourceId,
    amount: relatedAmount,
    description,
  }) => {
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
  const addWalletTransaction = ({
    type,
    amount: relatedAmount,
    sourceType,
    sourceId,
    method,
    description,
  }) => {
    const value = amount(relatedAmount);
    state.wallet.balance = Math.max(0, state.wallet.balance + (type === "topup" ? value : -value));
    state.wallet.transactions.unshift({
      id: id("wallet"),
      type,
      amount: type === "topup" ? value : -value,
      balance: state.wallet.balance,
      sourceType: sourceType || "wallet",
      sourceId: sourceId || null,
      method: method || "",
      description,
      createdAt: now(),
    });
    state.wallet.transactions = state.wallet.transactions.slice(0, 50);
    return state.wallet.balance;
  };
  const debitWallet = ({
    amount: relatedAmount,
    sourceType,
    sourceId,
    label,
    method = WALLET_PAYMENT_METHOD,
  }) => {
    const value = amount(relatedAmount);
    if (value > state.wallet.balance) return null;
    addWalletTransaction({
      type: "payment",
      amount: value,
      sourceType,
      sourceId,
      method,
      description: `Thanh toán ${money(value)} từ ví · ${label}`,
    });
    return { amount: value, balance: state.wallet.balance };
  };
  const topUpWallet = (rawAmount, method = "Nạp tiền trong app") => {
    const value = amount(rawAmount);
    if (value < 10000 || value > 5000000) return null;
    addWalletTransaction({
      type: "topup",
      amount: value,
      sourceType: "wallet",
      sourceId: null,
      method,
      description: `Nạp ${money(value)} vào Ví MatchUp`,
    });
    addNotification(
      "Nạp tiền vào ví thành công",
      `Ví MatchUp đã được cộng ${money(value)}.`,
      "wallet",
    );
    save("wallet-topped-up");
    return clone(state.wallet);
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
  const applyBookingDiscount = (booking, preview) => {
    const previousTotal = amount(booking.subtotal);
    const players = booking.split && Array.isArray(booking.split.players)
      ? booking.split.players
      : [];
    if (players.some((player) => player.paid)) return null;
    const isEqual = !booking.split || booking.split.mode !== "custom";
    const nextPlayers = isEqual
      ? splitEqual(players, preview.paidAmount)
      : splitProportionally(
        players,
        players.reduce((sum, player) => sum + amount(player.amount), 0),
        preview.paidAmount,
      );
    booking.total = preview.paidAmount;
    booking.loyalty = {
      redeemedPoints: preview.points,
      discount: preview.discount,
      originalTotal: previousTotal,
    };
    if (booking.split) booking.split.players = nextPlayers;
    return nextPlayers;
  };
  const expireBookings = () => {
    const expired = state.bookings.filter((booking) => (
      booking.status === "held" && booking.holdExpiresAt <= now()
    ));
    if (!expired.length) return false;
    expired.forEach((booking) => {
      booking.status = "expired";
      booking.updatedAt = now();
      upsertJourney(
        "booking",
        booking.id,
        "expired",
        { bookingId: booking.id, matchName: booking.court },
      );
      addNotification(
        "Đã hết hạn giữ sân",
        `${booking.court} lúc ${booking.time} không còn được giữ cho bạn.`,
        "booking",
      );
    });
    save("booking-expired");
    return true;
  };
  const getBooking = (bookingId) => {
    expireBookings();
    return state.bookings.find((booking) => booking.id === bookingId) || null;
  };

  return {
    money,
    bookingHistoryExists,
    voucherDiscountLabel,
    voucherDiscount,
    voucherContext,
    voucherReason,
    evaluateVoucher,
    getVouchers,
    bestVoucher,
    previewVoucher,
    previewPoints,
    addLoyaltyTransaction,
    addWalletTransaction,
    debitWallet,
    topUpWallet,
    settleLoyalty,
    splitEqual,
    splitProportionally,
    applyBookingDiscount,
    expireBookings,
    getBooking,
  };
};
