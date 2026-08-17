# Kịch bản quay video demo — MatchUp

> **Sản phẩm:** MatchUp — Ghép đội, đặt sân trong một chạm
> **Bản edit:** 40 giây | **Raw footage:** 2–3 phút (quay dư để có chất liệu dựng)
> **Hình thức:** Quay màn hình trình duyệt (screen recording), giao diện mobile hoặc desktop tùy format phân phối
> **URL demo:** `http://localhost:3000/`

---

## 1. Chuẩn bị trước khi quay

- [ ] Reset dữ liệu demo (nút Reset trong trang Cá nhân) để bắt đầu ở trạng thái sạch.
- [ ] Tắt thông báo hệ điều hành, tab trình duyệt khác, bookmark để màn hình gọn.
- [ ] Đặt cửa sổ trình duyệt ở đúng khung hình sẽ xuất bản (16:9 desktop hoặc 9:16 mobile), độ phân giải ≥ 1080p.
- [ ] Chuẩn bị sẵn trạng thái demo cho phân cảnh 6–7: dùng "Giả lập duyệt" trong trang Cá nhân để kèo có trạng thái `accepted` → chat đội mở được.
- [ ] Lồng tiếng: đọc chậm, rõ, khớp từng phân cảnh; hoặc chuẩn bị sub trên màn hình nếu không lồng tiếng.

---

## 2. Bảng phân cảnh (40 giây bản edit)

| # | Thời gian | Phân cảnh / Màn hình | Thao tác trên màn hình | Lời thoại / Chữ trên màn hình | Ghi chú dựng |
|---|-----------|----------------------|------------------------|-------------------------------|--------------|
| 1 | 0–3s | **Mở đầu — Trang Khám phá** (`/`) | Logo MatchUp xuất hiện, list kèo gợi ý cuộn nhẹ | "Muốn đá tối nay mà thiếu đội, thiếu sân?" | Cắt nhanh, chữ to ở giữa màn hình |
| 2 | 3–9s | **Tìm trận — Kèo hợp gu** (`/match/`) | Cuộn list kèo → bấm 1 kèo → highlight "Điểm phù hợp 96%", lý do "cùng trình độ, đúng giờ rảnh, cách 1,2 km" → bấm lưu kèo | "MatchUp gợi ý đúng kèo hợp gu — đúng trình độ, đúng giờ rảnh, lại gần nhà. Mỗi kèo đều có điểm phù hợp minh bạch." | Zoom nhẹ vào điểm phù hợp và lý do |
| 3 | 9–15s | **Xin vào kèo** (trong `/match/`) | Bấm **Xin vào** → màn hình sau khi xin vào: danh sách đội, tiến độ đủ người, lời chào, nút sao chép link mời | "Xin vào kèo một chạm. Xem ngay đội hình, tiến độ đủ người và mời thêm bạn bằng link." | Giữ 1s ở màn hình link mời |
| 4 | 15–21s | **Đặt sân** (`/booking/`) | Chọn sân → chọn ngày, khung giờ còn trống → giữ chỗ → đồng hồ đếm ngược 10 phút hiện lên | "Chưa có sân? Đặt sân nhanh với khung giờ còn trống, giữ chỗ trong 10 phút." | Highlight đồng hồ đếm ngược, thêm hiệu ứng đếm |
| 5 | 21–27s | **Rủ đội & chia tiền** (`/invite/`) | Sao chép link mời → chia tiền đều cho đội → thanh tiến độ "đã thu / còn thiếu" → modal chọn VietQR / MoMo / VNPay | "Rủ đội, chia tiền tự động. Theo dõi ai đã đóng, ai chưa — thanh toán qua VietQR, MoMo, VNPay." | Chèn mockup logo 3 phương thức thanh toán |
| 6 | 27–32s | **Chat đội — Tab Liên lạc** (`/contact/`) | Mở inbox → chọn phòng chat của kèo đã duyệt → gửi tin nhắn "Tối nay 19h đúng giờ nha cả đội" → tin nhắn xuất hiện | "Được duyệt rồi — có ngay phòng chat riêng của đội để chốt giờ, chốt địa điểm." | Quick reply hoặc typing rất sống động |
| 7 | 32–36s | **Cá nhân — Thành tích** (`/profile/`) | Mở thống kê: số trận hoàn thành, streak, huy hiệu "Đồng đội tích cực" → nút **Chơi lại khung giờ này** | "Sau trận, đánh giá, nhận huy hiệu, giữ streak — và đặt lại đúng sân, đúng giờ chỉ một chạm." | Slow motion hoặc hiệu ứng nhẹ khi streak tăng |
| 8 | 36–40s | **End screen** | Logo MatchUp, slogan | "MatchUp — Ghép đội, đặt sân trong một chạm." | Chữ logo lớn, kèm handle/CTA nếu có |

---

## 3. Gợi ý quay raw (mỗi cảnh quay dư 10–15s để dựng thoải mái)

- **Cảnh 1:** Quay cuộn trang Khám phá từ 5–8 kèo, chậm rãi, có 1–2 lần dừng lâu hơn.
- **Cảnh 2:** Quay đầy đủ thao tác lọc (môn / thời gian / trình độ / khoảng cách) và sắp xếp theo "phù hợp nhất" — phần này dễ bị cắt nên cần đủ chất liệu.
- **Cảnh 3:** Quay cả trạng thái "Chờ duyệt" trước, sau đó dùng "Giả lập duyệt" ở `/profile/` để có cảnh chuyển trạng thái sang "Được nhận".
- **Cảnh 4:** Quay luôn 2 kịch bản: giữ chỗ thành công và cảnh "hết hạn giữ chỗ → đặt lại" (tính năng nổi bật, nếu dư thời lượng có thể dùng).
- **Cảnh 5:** Quay cả 3 modal thanh toán (VietQR, MoMo, VNPay) để dựng chọn được.
- **Cảnh 6:** Quay giao diện chat: quick reply, typing indicator, tin hệ thống — chọn cảnh nào gọn nhất.
- **Cảnh 7:** Quay đánh giá sau trận (sao + thẻ cảm nhận) làm cảnh bonus; streak/huy hiệu là cảnh chính.
- **Cảnh 8:** Quay tối thiểu 5s tĩnh ở màn hình logo để dựng end card.

---

## 4. Ghi chú dựng (editor)

- Nhạc nền: upbeat, tempo 120–130 BPM, tăng dần ở cảnh 3–5, giảm ở end card.
- Chữ trên màn hình (caption): tiếng Việt có dấu, phông dễ đọc, xuất hiện theo từng câu lời thoại.
- Cắt theo nhịp: chuyển cảnh đúng phách, tránh cắt giữa thao tác đang dở.
- Tổng thời lượng bắt buộc ≤ 40s — nếu thừa, ưu tiên cắt phần lọc ở cảnh 2 và cảnh bonus ở cảnh 4, 7.
- Bản dài hơn (60–90s) có thể dùng chính raw này: thêm cảnh lọc kèo, voucher, cảnh hết hạn giữ sân và đánh giá sau trận.
