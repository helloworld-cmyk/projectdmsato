export const $ = selector => document.querySelector(selector);
export const $$ = selector => document.querySelectorAll(selector);

export function injectDynamicUi() {
  $('#payment-modal .modal-methods').insertAdjacentHTML(
    'afterend',
    `<div class="loyalty-checkout">
      <div class="loyalty-checkout-head">
        <span>Đổi điểm thành viên</span>
        <span id="booking-point-balance">Bạn có 0 điểm</span>
      </div>
      <div class="loyalty-point-input">
        <input id="booking-points" type="number" min="0" step="1"
          inputmode="numeric" aria-label="Số điểm muốn dùng"
          placeholder="Nhập số điểm" />
        <button class="loyalty-max" id="booking-use-max" type="button">Dùng tối đa</button>
      </div>
      <div class="loyalty-checkout-lines">
        <div><span>Tổng đơn sau ưu đãi</span><strong id="booking-subtotal">0đ</strong></div>
        <div class="discount">
          <span>Giảm từ điểm</span><strong id="booking-discount">−0đ</strong>
        </div>
        <div class="payable">
          <span>Phần bạn thanh toán</span><strong id="booking-payable">0đ</strong>
        </div>
      </div>
    </div>`
  );
  $('#feedback-modal .feedback-actions').insertAdjacentHTML(
    'afterend',
    `<button class="feedback-repeat" id="repeat-booking">
      <span class="material-symbols-rounded" style="font-size:14px">replay</span>
      Chơi lại khung giờ này
    </button>`
  );
}
