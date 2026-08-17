export function injectCards() {
  const content = document.querySelector('.content');

  content.insertAdjacentHTML('afterbegin', `
    <article class="card premium-card" id="premium-card">
      <div class="premium-card-top">
        <span class="premium-card-icon material-symbols-rounded">workspace_premium</span>
        <div>
          <h3>MatchUp Premium</h3>
          <p>Xin vào kèo không giới hạn, ưu đãi đặt sân độc quyền.</p>
        </div>
      </div>
      <div class="premium-card-status" id="premium-status"></div>
      <div class="premium-benefits" id="premium-benefits"></div>
      <div class="premium-actions" id="premium-actions"></div>
    </article>
  `);

  content.insertAdjacentHTML('afterbegin', `
    <article class="card loyalty-card" id="loyalty-card">
      <div class="loyalty-head">
        <div class="loyalty-title">
          <span class="material-symbols-rounded">workspace_premium</span>
          <div>
            <h3>Điểm thành viên</h3>
            <p>Tích điểm sau mỗi thanh toán thành công.</p>
          </div>
        </div>
        <div class="loyalty-balance">
          <span>Số dư</span>
          <strong id="loyalty-balance">0 điểm</strong>
        </div>
      </div>
      <div class="loyalty-rule">1 điểm / 1.000đ thực trả · 1 điểm = 100đ · dùng tối đa 50% mỗi đơn.</div>
      <div class="loyalty-history" id="loyalty-history"></div>
    </article>
  `);

  content.insertAdjacentHTML('afterbegin', `
    <article class="card wallet-card" id="wallet-card">
      <div class="wallet-head">
        <div class="wallet-title">
          <span class="material-symbols-rounded">account_balance_wallet</span>
          <div>
            <h3>Ví MatchUp</h3>
            <p>Nạp trước để thanh toán nhanh hơn.</p>
          </div>
        </div>
        <div class="wallet-balance">
          <span>Số dư ví</span>
          <strong id="wallet-balance">0đ</strong>
        </div>
      </div>
      <div class="wallet-actions">
        <button class="wallet-topup" type="button" data-wallet-topup="100000">+100.000đ</button>
        <button class="wallet-topup" type="button" data-wallet-topup="200000">+200.000đ</button>
        <button class="wallet-topup" type="button" data-wallet-topup="500000">+500.000đ</button>
        <button class="wallet-topup custom" type="button" id="open-wallet-topup">
          <span class="material-symbols-rounded" style="font-size:13px">add</span> Số khác
        </button>
        <button class="wallet-topup withdraw" type="button" id="open-wallet-withdraw">
          <span class="material-symbols-rounded" style="font-size:13px">arrow_upward</span> Rút tiền
        </button>
      </div>
      <p class="wallet-note">Số dư ví dùng được cho đặt sân và thanh toán phần kèo. Mọi giao dịch được lưu trên trình duyệt này.</p>
      <div class="wallet-history" id="wallet-history"></div>
    </article>
  `);

  content.insertAdjacentHTML('afterbegin', `
    <article class="card play-stats" id="play-stats">
      <div class="play-stats-head">
        <div>
          <h3>Nhịp chơi của bạn</h3>
          <p>Mỗi trận hoàn thành là một lý do để quay lại.</p>
        </div>
        <span class="streak" id="streak-copy">0 trận đã chơi</span>
      </div>
      <div class="play-stat-row">
        <div class="play-stat"><strong id="completed-count">0</strong><span>trận hoàn thành</span></div>
        <div class="play-stat"><strong id="feedback-count">0</strong><span>đánh giá đã gửi</span></div>
        <div class="play-stat"><strong id="waitlist-count">0</strong><span>tìm kiếm đang theo dõi</span></div>
      </div>
      <div class="badge-row" id="badge-row"></div>
    </article>
  `);
}

export function injectModals() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="loyalty-modal-layer" id="application-payment-modal" role="dialog" aria-modal="true" aria-labelledby="application-payment-title">
      <div class="loyalty-modal">
        <div class="loyalty-modal-top">
          <div>
            <h2 id="application-payment-title">Thanh toán phần kèo</h2>
            <p>Dùng điểm thành viên để giảm tiền thanh toán.</p>
          </div>
          <button class="loyalty-close" id="close-application-payment" aria-label="Đóng"><span class="material-symbols-rounded">close</span></button>
        </div>
        <div class="wallet-payment-methods">
          <button class="wallet-payment-method active" type="button" data-application-method="Ví MatchUp">
            <span class="material-symbols-rounded">account_balance_wallet</span>Ví MatchUp<small id="application-wallet-balance">Số dư 0đ</small>
          </button>
        </div>
        <div class="point-box">
          <div class="point-box-head">
            <span>Đổi điểm giảm giá</span>
            <small id="application-point-balance">Bạn có 0 điểm</small>
          </div>
          <div class="point-input-row">
            <input id="application-points" type="number" min="0" step="1" inputmode="numeric" aria-label="Số điểm muốn dùng" placeholder="Nhập số điểm" />
            <button class="point-max" id="application-use-max" type="button">Dùng tối đa</button>
          </div>
          <div class="point-summary">
            <div><span>Phần của bạn</span><strong id="application-subtotal">0đ</strong></div>
            <div class="discount"><span>Giảm từ điểm</span><strong id="application-discount">−0đ</strong></div>
            <div class="due"><span>Thanh toán</span><strong id="application-paid-total">0đ</strong></div>
          </div>
        </div>
        <button class="app-pay-confirm" id="confirm-application-payment" type="button">Thanh toán 0đ từ Ví MatchUp</button>
      </div>
    </div>
  `);

  document.body.insertAdjacentHTML('beforeend', `
    <div class="loyalty-modal-layer" id="wallet-topup-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-topup-title">
      <div class="loyalty-modal">
        <div class="loyalty-modal-top">
          <div>
            <h2 id="wallet-topup-title">Nạp tiền vào Ví MatchUp</h2>
            <p class="wallet-modal-copy">Chọn số tiền và cổng thanh toán. Tiền sẽ được cộng vào Ví MatchUp sau khi thanh toán thành công.</p>
          </div>
          <button class="loyalty-close" id="close-wallet-topup" aria-label="Đóng"><span class="material-symbols-rounded">close</span></button>
        </div>
        <input class="wallet-amount-input" id="wallet-topup-amount" type="number" min="10000" max="5000000" step="10000" inputmode="numeric" aria-label="Số tiền nạp" value="100000" />
        <div class="wallet-presets">
          <button class="wallet-preset" type="button" data-wallet-preset="100000">100.000đ</button>
          <button class="wallet-preset" type="button" data-wallet-preset="200000">200.000đ</button>
          <button class="wallet-preset" type="button" data-wallet-preset="500000">500.000đ</button>
        </div>
        <div class="wallet-topup-methods" aria-label="Cổng thanh toán">
          <button class="wallet-payment-method active" type="button" data-topup-method="VNPay">
            <span class="material-symbols-rounded">credit_card</span>VNPay<small>Thẻ ngân hàng</small>
          </button>
          <button class="wallet-payment-method" type="button" data-topup-method="MoMo">
            <span class="material-symbols-rounded">account_balance_wallet</span>MoMo<small>Ví điện tử</small>
          </button>
          <button class="wallet-payment-method" type="button" data-topup-method="Chuyển khoản ngân hàng">
            <span class="material-symbols-rounded">account_balance</span>Chuyển khoản<small>Ngân hàng nội địa</small>
          </button>
        </div>
        <button class="wallet-confirm" id="confirm-wallet-topup" type="button">Nạp 100.000đ qua VNPay</button>
      </div>
    </div>
  `);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="loyalty-modal-layer" id="wallet-withdraw-modal" role="dialog" aria-modal="true" aria-labelledby="wallet-withdraw-title">
      <div class="loyalty-modal">
        <div class="loyalty-modal-top">
          <div>
            <h2 id="wallet-withdraw-title">Rút tiền từ Ví MatchUp</h2>
            <p class="wallet-modal-copy">Chọn số tiền muốn rút và cổng nhận tiền. Tiền sẽ được chuyển sau khi xử lý thành công.</p>
          </div>
          <button class="loyalty-close" id="close-wallet-withdraw" aria-label="Đóng"><span class="material-symbols-rounded">close</span></button>
        </div>
        <input class="wallet-amount-input" id="wallet-withdraw-amount" type="number" min="10000" step="10000" inputmode="numeric" aria-label="Số tiền rút" />
        <p class="wallet-balance-hint" id="wallet-withdraw-balance">Số dư khả dụng: 0đ</p>
        <div class="wallet-topup-methods" aria-label="Cổng nhận tiền">
          <button class="wallet-payment-method active" type="button" data-withdraw-method="VNPay">
            <span class="material-symbols-rounded">credit_card</span>VNPay<small>Thẻ ngân hàng</small>
          </button>
          <button class="wallet-payment-method" type="button" data-withdraw-method="MoMo">
            <span class="material-symbols-rounded">account_balance_wallet</span>MoMo<small>Ví điện tử</small>
          </button>
          <button class="wallet-payment-method" type="button" data-withdraw-method="Chuyển khoản ngân hàng">
            <span class="material-symbols-rounded">account_balance</span>Chuyển khoản<small>Ngân hàng nội địa</small>
          </button>
        </div>
        <button class="wallet-confirm" id="confirm-wallet-withdraw" type="button" disabled>Rút 0đ qua VNPay</button>
      </div>
    </div>
  `);

document.body.insertAdjacentHTML('beforeend', `
    <div class="loyalty-modal-layer" id="premium-upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="premium-upgrade-title">
      <div class="loyalty-modal premium-modal">
        <div class="loyalty-modal-top">
          <div>
            <h2 id="premium-upgrade-title">Nâng cấp MatchUp Premium</h2>
            <p>Xin vào kèo không giới hạn và tận hưởng ưu đãi độc quyền.</p>
          </div>
          <button class="loyalty-close" id="close-premium-upgrade" aria-label="Đóng"><span class="material-symbols-rounded">close</span></button>
        </div>
        <div class="premium-plans" id="premium-plans"></div>
        <div class="wallet-payment-methods">
          <button class="wallet-payment-method active" type="button" data-premium-method="Ví MatchUp">
            <span class="material-symbols-rounded">account_balance_wallet</span>Ví MatchUp<small id="premium-wallet-balance">Số dư 0đ</small>
          </button>
        </div>
        <p class="premium-modal-note">Thanh toán được mô phỏng để bạn thử nghiệm luồng nâng cấp.</p>
        <button class="premium-confirm" id="confirm-premium-upgrade" type="button">Nâng cấp</button>
      </div>
    </div>
  `);
}

export function initDOM() {
  injectCards();
  injectModals();
}