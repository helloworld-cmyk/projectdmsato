# Gói Premium — MatchUp

## Mô tả

Gói hội viên **MatchUp Premium** cho phép người chơi xin vào kèo không giới hạn và mở các tính năng nâng cao. Gói miễn phí giới hạn **5 lượt xin vào kèo mỗi tháng dương lịch**; đặt sân luôn không giới hạn ở cả hai gói.

## Gói giá

| Gói | Giá | Hiệu lực | Ghi chú |
|---|---|---|---|
| Premium Tháng | 60.000đ | 30 ngày | Thanh toán hằng tháng, hủy bất cứ lúc nào |
| Premium Năm | 600.000đ | 365 ngày | Tiết kiệm bằng 2 tháng phí (~17%) |

Thanh toán được mô phỏng qua **Ví MatchUp** (trừ trực tiếp số dư ví). Ví không đủ số dư sẽ chặn nút thanh toán và gợi ý nạp tiền (nạp/rút qua VNPay, MoMo, chuyển khoản ngân hàng).

## Quyền lợi Premium

1. **Xin vào kèo không giới hạn** — Free chỉ được 5 lượt/tháng, hết lượt sẽ bị chặn kèm màn hình nâng cấp.
2. **Ưu đãi đặt sân độc quyền** — Voucher `PREMIUM60` (giảm 60.000đ) chỉ dùng được khi đang Premium; người thường thấy voucher khóa kèm nút nâng cấp.
3. **Voucher 30.000đ mỗi tháng** — Voucher `PREMIUM30` quay vòng: Premium dùng được 1 lần/tháng dương lịch (kiểm tra booking cùng mã trong tháng), điều kiện đơn từ 150.000đ.
4. **Giữ chỗ sân 30 phút** — Free giữ sân 10 phút, Premium 30 phút (`holdMinutes` lưu trên booking để hiển thị).
5. **Tích điểm x2** — Điểm thành viên nhân 2 khi thanh toán khi đang Premium (ghi chú "· x2 Premium" trong lịch sử điểm).
6. **Lưu kèo không giới hạn** — Free lưu tối đa 10 kèo (`FREE_SAVED_MATCH_LIMIT`); vượt giới hạn bị chặn kèm upsell.
7. **Kèo nổi bật** — Kèo tạo bởi thành viên Premium có badge "Nổi bật" và được ưu tiên lên đầu danh sách tìm kiếm.
8. **Chat không giới hạn** — Free chỉ giữ 3 phòng chat cùng lúc; mở phòng mới khi đã đủ 3 sẽ tự động đóng phòng cũ nhất kèm thông báo, và inbox hiện banner nâng cấp.
9. **Bộ lọc & gợi ý nâng cao** — Bộ lọc "Chất lượng đội" (chỉ hiện kèo chủ có độ tin cậy ≥ 90%) dành riêng Premium.
10. **Huy hiệu Premium** — Huy hiệu vàng cạnh tên trên hồ sơ, nổi bật trong cộng đồng.

## Hết hạn gói

- Khi `expiresAt` đã qua, membership tự động reset về miễn phí khi đọc state (trong `normaliseState`).
- Người dùng có thể hủy gói chủ động từ card Premium trên trang Cá nhân (hạ cấp ngay).

## Điểm vào (Entry points)

| Vị trí | Hành vi |
|---|---|
| Trang Cá nhân | Card "MatchUp Premium" + modal chọn gói và thanh toán (mở bằng URL `?premium=1`) |
| Trang chủ | Banner nâng cấp + thẻ voucher Premium bị khóa (`PREMIUM60`, `PREMIUM30`) |
| Trang Tìm trận | Hết lượt 5/5 khi "Xin vào" → upsell; bộ lọc Chất lượng đội bị khóa → upsell; lưu kèo quá 10 → upsell; kèo tạo bởi Premium có badge "Nổi bật" |
| Trang Đặt sân | Voucher `PREMIUM60`/`PREMIUM30` hiển thị khóa + nút "Nâng cấp Premium"; giữ chỗ 30 phút khi Premium |
| Trang Liên lạc | Giữ 3/3 phòng chat miễn phí → banner nâng cấp; phòng cũ nhất tự động đóng khi mở phòng mới |

## Luồng kiểm tra demo

1. `http://localhost:3000/profile/` → card Premium hiển thị trạng thái miễn phí, đã dùng X/5 lượt.
2. Bấm "Nâng cấp Premium" → chọn gói Năm hoặc Tháng → thanh toán qua Ví MatchUp (thiếu tiền → nạp tiền ở card Ví trước) → thông báo kích hoạt, huy hiệu vàng xuất hiện cạnh tên.
3. Vào `match/` → xin vào 6 kèo liên tiếp → lượt 6 bị chặn (với gói free; Premium không bị chặn).
4. Vào `booking/` → mở "Đổi voucher" → `PREMIUM60` hiện khóa → bấm "Nâng cấp Premium".
5. Trang chủ → banner Premium chuyển sang trạng thái đang hoạt động, voucher `PREMIUM60` mở khóa "Dùng ngay".
6. Bấm "Hủy gói" ở profile → hạ cấp về free ngay.

### Kiểm tra quyền lợi mới

- **Giữ sân 30 phút**: sau khi nâng cấp, giữ sân ở `booking/` → thông báo "Đã giữ sân trong 30 phút"; countdown trong `renderActiveHold` chạy từ 30:00.
- **Tích điểm x2**: thanh toán sân/kèo → lịch sử điểm cộng gấp đôi với ghi chú "· x2 Premium".
- **Voucher tháng**: khi Premium, `PREMIUM30` mở khóa ở trang chủ/booking; dùng 1 lần rồi đặt sân tiếp → voucher báo "Đã dùng voucher trong tháng này".
- **Lưu kèo giới hạn**: với gói free, lưu kèo thứ 11 → toast + upsell; Premium lưu không giới hạn.
- **Kèo nổi bật**: tạo kèo khi Premium → card có badge "Nổi bật" và xếp đầu danh sách.
- **Chat 3 phòng**: xin vào 4 kèo liên tiếp với gói free → phòng cũ nhất bị đóng + thông báo; `contact/` hiện banner nâng cấp khi đủ 3 phòng. Premium không bị giới hạn.

## Ghi chú triển khai

- Dữ liệu membership lưu trong `localStorage` (key `matchup-demo-state-v2`, field `membership`), không có backend.
- Số lượt dùng được tính bằng số `applications` tạo trong tháng dương lịch hiện tại (gồm cả yêu cầu đang chờ).
- Upgrade khi đang Premium sẽ **gia hạn** tính từ ngày hết hạn hiện tại.
- Trạng thái Premium được kiểm tra qua helper thuần `premiumActive(membership, now)` (`services/premium.js`) để các service tạo trước premium service (commerce, chat) dùng chung.
- Giới hạn free: 5 lượt xin kèo/tháng, 10 kèo lưu, 3 phòng chat, giữ sân 10 phút; Premium: không giới hạn tương ứng, giữ sân 30 phút, điểm x2, voucher `PREMIUM30` 1 lần/tháng.
- Voucher `PREMIUM30` quay vòng được kiểm tra bằng booking dùng đúng mã trong tháng dương lịch hiện tại.