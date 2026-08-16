export const createGeneralApi = (context) => {
    const {
      LOYALTY_POLICY,
      WALLET_PAYMENT_METHOD,
      VOUCHER_CATALOG,
      id,
      clone,
      amount,
      money,
      state,
      getVouchers,
      bestVoucher,
      previewVoucher,
      previewPoints,
      topUpWallet,
      splitEqual,
      splitProportionally,
      expireBookings
    } = context;
    return {
    money,
    getState: () => { expireBookings(); return clone(state); },
    getLoyalty: () => clone({ ...state.loyalty, policy: LOYALTY_POLICY }),
    getWallet: () => clone({ ...state.wallet, paymentMethod: WALLET_PAYMENT_METHOD }),
    topUpWallet,
    canPayWithWallet: (requiredAmount) => state.wallet.balance >= amount(requiredAmount),
    getVouchers: (context = {}) => clone(getVouchers(context)),
    getVoucher: (voucherId) => clone(VOUCHER_CATALOG.find((voucher) => (
      voucher.id === voucherId || voucher.code === voucherId
    )) || null),
    previewVoucher: (voucherId, context = {}) => clone(previewVoucher(voucherId, context)),
    getBestVoucher: (context = {}) => clone(bestVoucher(context)),
    previewPoints: (subtotal, requestedPoints) => clone(previewPoints(subtotal, requestedPoints)),
    previewBookingPoints: (bookingId, requestedPoints) => {
      const booking = state.bookings.find((item) => item.id === bookingId);
      if (!booking) return null;
      const preview = previewPoints(amount(booking.subtotal), requestedPoints);
      const players = booking.split && Array.isArray(booking.split.players)
        ? booking.split.players
        : [];
      const projectedPlayers = booking.split && booking.split.mode === "custom"
        ? splitProportionally(
          players,
          players.reduce((sum, player) => sum + amount(player.amount), 0),
          preview.paidAmount,
        )
        : splitEqual(players, preview.paidAmount);
      return clone({
        ...preview,
        ownerAmount: amount(projectedPlayers[0] && projectedPlayers[0].amount),
      });
    },
    };
};
