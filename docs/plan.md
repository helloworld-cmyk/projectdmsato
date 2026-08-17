# Plan: Sửa lỗi không thanh toán được tại màn `/pages/invite/`

## Hiện trạng

Trên màn Rủ đội & chia tiền (`/pages/invite/`), sau khi đặt sân xong người dùng không
thể thanh toán phần của mình: bấm nút **Thanh toán** chỉ nhận toast
"Số dư ví không đủ hoặc trạng thái lịch đã thay đổi" dù chọn VietQR và lịch còn hiệu lực.

## Nguyên nhân gốc rễ (đã mô phỏng lại được)

Khi bật quy tắc **"Thanh toán trước khi được duyệt"** ở màn này, người chơi vào kèo
bị đánh dấu `paid = true` ngay mà không qua thanh toán thật:

- `js/app-state/api/api-bookings.js:253` — `addBookingPlayer`: `player.paid = requirePayment;`
- `js/app-state/api/api-bookings.js:144` — `updateBookingRules`: `if (requiresPayment) player.paid = true;`
  (đánh dấu luôn cả người đã có trong kèo)

Sau đó `payForBooking` (chủ kèo thanh toán) bị chặn vì guard sai:

- `js/app-state/api/api-bookings.js:324`
  ```js
  if (!players.length || players.some((player) => player.paid)) return null;
  ```

Kết quả: chỉ cần có 1 người chơi khác trong kèo (mời tay hoặc qua link) kèm quy tắc
"thanh toán trước" bật, **chủ kèo không bao giờ thanh toán được**.

Cùng guard này còn tồn tại ở `applyBookingDiscount`:

- `js/app-state/services/commerce.js:294`
  ```js
  if (players.some((player) => player.paid)) return null;
  ```

## Phạm vi

- `js/app-state/api/api-bookings.js`
- `js/app-state/services/commerce.js`
- `pages/invite/js/features/payment.js`

Không đụng tới luồng Premium (vừa thêm). Đã kiểm chứng: premium (upgrade, voucher
PREMIUM60, giới hạn xin vào kèo) hoạt động độc lập với bug này.

## Các bước thực hiện

### 1. `js/app-state/api/api-bookings.js` — `payForBooking`

Bỏ `players.some((player) => player.paid)` khỏi guard, giữ `!players.length`:

```js
if (!players.length) return null;
```

Việc chống thanh toán 2 lần đã được đảm bảo bởi:
- `booking.ownerPaid` — kiểm tra ở đầu hàm (dòng 311–316);
- `self.paid = true` — set cho chính chủ kèo sau khi thanh toán thành công.

### 2. `js/app-state/services/commerce.js` — `applyBookingDiscount`

Bỏ guard `players.some((player) => player.paid)` (chỉ được gọi từ `payForBooking`
sau khi đã kiểm tra `ownerPaid`):

```js
if (!players.length) return null;
```

### 3. `pages/invite/js/features/payment.js` — toast lỗi rõ lý do

Tách toast lỗi khi `payForBooking` / `payForApplication` / `payForMatchOwner`
trả về null để hiển thị đúng lý do thật:

- Giữ chỗ đã hết hạn (`expired`) hoặc lịch đã hủy (`cancelled`);
- Ví MatchUp không đủ số dư;
- Số điểm yêu cầu vượt mức cho phép;
- Trạng thái kèo/lịch đã thay đổi (trường hợp còn lại).

Tránh dùng chung câu toast chung chung gây hiểu lầm như hiện tại.

## Kiểm chứng sau khi sửa

Chạy lại mô phỏng store (node, không cần browser) với các kịch bản:

1. **Kịch bản lỗi**: bật "Thanh toán trước khi được duyệt" + mời 1 người vào kèo
   → `payForBooking` phải trả về booking thành công (ownerPaid = true).
2. **Kịch bản cơ bản**: đặt sân → thanh toán ngay (kèo 1 người) vẫn OK.
3. **Premium**: member + đơn ≥ 200.000đ → PREMIUM60 tự áp dụng, thanh toán OK.
4. **Ví MatchUp**: số dư không đủ → nút thanh toán vẫn bị khóa đúng.

## Ghi chú

- Không cần thay đổi HTML/CSS.
- Không thay đổi hành vi: người vào kèo vẫn hiển thị "đã thanh toán cọc" khi bật
  quy tắc thanh toán trước; chỉ bỏ chặn thanh toán cho chủ kèo.
