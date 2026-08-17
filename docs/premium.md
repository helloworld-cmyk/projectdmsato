# Gói Premium — MatchUp

## Mô tả

Gói hội viên **MatchUp Premium** cho phép người chơi xin vào kèo không giới hạn và mở các tính năng nâng cao. Gói miễn phí giới hạn **5 lượt xin vào kèo mỗi tháng dương lịch**; đặt sân luôn không giới hạn ở cả hai gói.

## Gói giá

| Gói | Giá | Hiệu lực | Ghi chú |
|---|---|---|---|
| Premium Tháng | 60.000đ | 30 ngày | Thanh toán hằng tháng, hủy bất cứ lúc nào |
| Premium Năm | 600.000đ | 365 ngày | Tiết kiệm bằng 2 tháng phí (~17%) |

Thanh toán được mô phỏng qua **Ví MatchUp** (trừ trực tiếp số dư ví) hoặc **VietQR** (giả lập). Ví không đủ số dư sẽ chặn nút thanh toán và gợi ý nạp tiền.

## Quyền lợi Premium

1. **Xin vào kèo không giới hạn** — Free chỉ được 5 lượt/tháng, hết lượt sẽ bị chặn kèm màn hình nâng cấp.
2. **Ưu đãi đặt sân độc quyền** — Voucher `PREMIUM60` (giảm 60.000đ) chỉ dùng được khi đang Premium; người thường thấy voucher khóa kèm nút nâng cấp.
3. **Bộ lọc & gợi ý nâng cao** — Bộ lọc "Chất lượng đội" (chỉ hiện kèo chủ có độ tin cậy ≥ 90%) dành riêng Premium.
4. **Huy hiệu Premium** — Huy hiệu vàng cạnh tên trên hồ sơ, nổi bật trong cộng đồng.

## Hết hạn gói

- Khi `expiresAt` đã qua, membership tự động reset về miễn phí khi đọc state (trong `normaliseState`).
- Người dùng có thể hủy gói chủ động từ card Premium trên trang Cá nhân (hạ cấp ngay).

## Điểm vào (Entry points)

| Vị trí | Hành vi |
|---|---|
| Trang Cá nhân | Card "MatchUp Premium" + modal chọn gói và thanh toán (mở bằng URL `?premium=1`) |
| Trang chủ | Banner nâng cấp + thẻ voucher Premium bị khóa |
| Trang Tìm trận | Hết lượt 5/5 khi "Xin vào" → upsell; bộ lọc Chất lượng đội bị khóa → upsell |
| Trang Đặt sân | Voucher `PREMIUM60` hiển thị khóa + nút "Nâng cấp Premium" |

## Luồng kiểm tra demo

1. `http://localhost:3000/profile/` → card Premium hiển thị trạng thái miễn phí, đã dùng X/5 lượt.
2. Bấm "Nâng cấp Premium" → chọn gói Năm hoặc Tháng → thanh toán qua Ví MatchUp (thiếu tiền → nạp tiền ở card Ví trước) → thông báo kích hoạt, huy hiệu vàng xuất hiện cạnh tên.
3. Vào `match/` → xin vào 6 kèo liên tiếp → lượt 6 bị chặn (với gói free; Premium không bị chặn).
4. Vào `booking/` → mở "Đổi voucher" → `PREMIUM60` hiện khóa → bấm "Nâng cấp Premium".
5. Trang chủ → banner Premium chuyển sang trạng thái đang hoạt động, voucher `PREMIUM60` mở khóa "Dùng ngay".
6. Bấm "Hủy gói" ở profile → hạ cấp về free ngay.

## Ghi chú triển khai

- Dữ liệu membership lưu trong `localStorage` (key `matchup-demo-state-v2`, field `membership`), không có backend.
- Số lượt dùng được tính bằng số `applications` tạo trong tháng dương lịch hiện tại (gồm cả yêu cầu đang chờ).
- Upgrade khi đang Premium sẽ **gia hạn** tính từ ngày hết hạn hiện tại.