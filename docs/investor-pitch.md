# MatchUp — Hồ Sơ Kêu Gọi Đầu Tư

> **Slogan:** Ghép đội, đặt sân trong một chạm.
> **Bản hiện tại:** MVP demo web (Prototype tương tác đầy đủ, 6 màn hình: Khám phá, Tìm trận, Đặt sân, Rủ đội & chia tiền, Cá nhân, Liên lạc; chạy hoàn toàn trên trình duyệt), đã có phòng chat đội mở sau khi yêu cầu vào kèo được duyệt.

---

## 1. Tóm tắt (Elevator Pitch)

MatchUp là nền tảng thể thao cộng đồng kết hợp hai nhu cầu lớn nhất của người chơi thể thao thành thị:

1. **Tìm người chơi** — ghép đội đúng trình độ, đúng môn, đúng giờ, gần nhà (giải quyết bài toán "muốn đá nhưng thiếu đội").
2. **Đặt sân** — tìm sân còn trống, giữ chỗ, chia tiền và thanh toán minh bạch trong vài thao tác.

MatchUp không chỉ là "Tinder cho thể thao" hay "Booking sân bóng" — mà là **hệ điều hành cho toàn bộ vòng đời một trận đấu**: từ lúc mở kèo, ghép đội, đặt sân, chia tiền, ra sân, đến đánh giá và xây dựng danh tiếng cá nhân.

---

## 2. Vấn đề (Problem)

- **Người chơi mất rất nhiều thời gian để lập đội:** Phải nhắn tin từng nhóm, hỏi "tối nay có ai đá không?", dễ bị hủy kèo vào phút chót, chơi cùng người chênh lệch trình độ — mất hứng và dễ bỏ thể thao.
- **Sân trống vào khung giờ thấp điểm:** Chủ sân có giờ trống buổi trưa, buổi chiều thấp điểm không biết ai cần — tỷ lệ lấp đầy sân thấp, doanh thu rò rỉ.
- **Chia tiền và thanh toán phiền phức, thiếu tin cậy:** "Người làm đội" phải thu tiền lẻ, chuyển khoản tay, không có hồ sơ về độ tin cậy của từng người.
- **Không có dữ liệu:** Người chơi không có hồ sơ thể thao, danh tiếng; chủ sân không có dữ liệu về nhu cầu khách hàng.

---

## 3. Giải pháp & Các tính năng (Solution & Features)

### 3.1. Ghép đội thông minh (Smart Matchmaking)
- **Điểm phù hợp (Match Score):** Mỗi kèo hiển thị mức độ hợp gu với người dùng (ví dụ 96%) dựa trên **trình độ, môn yêu thích, bán kính, khung giờ rảnh** — người dùng hiểu rõ *vì sao* kèo này hợp với mình (cùng trình độ Khá, đúng môn, đúng giờ rảnh, cách 1,2 km).
- **Hồ sơ cá nhân (Profile):** Người dùng khai báo trình độ (Mới chơi / Khá / Giỏi), bán kính tìm kèo, môn yêu thích, thời gian rảnh → gợi ý kèo ngày càng chính xác.
- **Bộ lọc & sắp xếp đa chiều:** Theo môn thể thao (Bóng đá, Cầu lông, Pickleball, Bóng rổ), thời gian (hôm nay / mai / cuối tuần), trình độ, khoảng cách (thanh trượt 0–10 km), sắp xếp theo phù hợp nhất / gần nhất / sớm nhất / còn nhiều chỗ / phí thấp nhất.
- **Tạo kèo 30 giây:** Chủ kèo điền môn, trình độ, giờ, số người, sân, tổng tiền → hệ thống tự tính **phí chia đều mỗi người** theo số thành viên hiện tại.
- **Lưu kèo để xem lại:** Đánh dấu / bỏ đánh dấu ngay trong chi tiết kèo; danh sách kèo đã lưu được tổng hợp trong trang Cá nhân.
- **Báo tôi khi có kèo:** Khi chưa có lựa chọn phù hợp, người dùng có thể lưu bộ lọc hiện tại vào danh sách theo dõi; hệ thống sẽ tạo thông báo khi có kèo mới khớp tiêu chí. Có thể mở rộng bán kính tìm kiếm ngay tại màn hình trống.

### 3.2. Luồng tham gia kèo minh bạch (Trust & Safety)
- **Quy trình xin vào kèo:** Gửi yêu cầu → chủ kèo duyệt → thanh toán đủ phần → xác nhận chỗ. Trạng thái rõ ràng ở mọi bước (chờ duyệt / được nhận / đã thanh toán).
- **Chia tiền động & hoàn tiền tự động:** Phần của mỗi người = tổng tiền sân ÷ số người trong kèo; thanh toán một lần, không có cọc — khi có thêm người vào, chênh lệch được hoàn về ví và hiển thị thông báo "Bạn sẽ được hoàn X đồng".
- **Khoảnh khắc sau khi xin vào:** Hiển thị ngay danh sách đội, tiến độ đủ người, lời chào nhanh và nút sao chép link mời thêm bạn; người chơi có thể chuẩn bị trước ngay cả khi còn chờ duyệt.
- **Độ tin cậy của chủ kèo:** Hiển thị số trận đã tổ chức và tỷ lệ tin cậy — xây dựng lòng tin cho cộng đồng.
- **Công khai trạng thái thanh toán:** Ai đã đóng tiền, ai chưa — hiển thị ngay trong chi tiết kèo.
- **Thông tin kèo đầy đủ:** Địa chỉ chính xác, link Google Maps, khoảng cách thực tế từ vị trí người dùng, danh sách người tham gia.

#### Chat đội sau khi được duyệt (Gated Team Chat)
- **Mở đúng thời điểm:** Người chơi chỉ được đọc và gửi tin sau khi chủ kèo duyệt yêu cầu (`accepted`) hoặc sau khi đã thanh toán (`paid`); yêu cầu đang chờ không thể chat.
- **Một phòng chat gắn với một kèo:** Tên kèo, giờ chơi, sân và phí/người được ghim trong phòng, giúp cả đội không phải lục lại tin nhắn rời rạc.
- **Làm quen trước giờ ra sân:** Tin hệ thống, quick reply (chào đội / đến sớm / hỏi địa điểm) và danh sách thành viên giúp giảm hủy kèo phút chót, tăng cảm giác an toàn khi chơi với người mới.
- **Nền tảng cho Trust & Safety:** Khi triển khai thật, phòng chat là nơi tích hợp thông báo, báo cáo/chặn người dùng, kiểm duyệt nội dung và lịch sử tương tác theo kèo.

### 3.3. Đặt sân nhanh (Court Booking)
- **Tìm sân theo vị trí thực:** Bản đồ trực quan, bộ lọc môn / khung giờ (sáng, chiều, tối) / bán kính (3–10 km), danh sách sân kèm giá, đánh giá, tiện nghi.
- **Giữ chỗ 10 phút (10-minute hold):** Hệ thống giữ chỗ có **đồng hồ đếm ngược** — tạo cảm giác khẩn cấp, giảm tỷ lệ hủy, tối ưu tỷ lệ lấp đầy sân.
- **Trạng thái khung giờ thời gian thực:** Hiển thị chính xác khung giờ còn trống theo từng sân, tự động khóa khung giờ đã đầy, cảnh báo khi sân kín lịch.
- **Hết hạn an toàn & đặt lại:** Nếu không xác nhận trước khi đồng hồ 10 phút kết thúc, khung giờ được trả lại; người dùng nhận thông báo và có thể đặt lại sân / chọn khung giờ khác.
- **Ưu đãi theo ngữ cảnh:** Tự chọn voucher tốt nhất theo lần đặt đầu, giờ thấp điểm, môn thể thao hoặc quy mô đội; hiển thị điều kiện, lý do voucher chưa đủ điều kiện và mã ưu đãi sao chép một chạm.

### 3.4. Mời đội & chia tiền (Invite & Split Payment)
- **Link mời một chạm:** Tạo link chia sẻ cho kèo (chuyển tiếp qua Zalo / Messenger / email), ai có link đều có thể xem kèo và thanh toán phần của mình.
- **Chia tiền linh hoạt:** Chia đều hoặc tùy chỉnh từng người, hệ thống kiểm tra tổng khớp đơn, tự cập nhật khi số người thay đổi.
- **Theo dõi tiến độ thu tiền:** Thanh tiến độ "đã thu / còn thiếu", ai đã đóng, ai chưa — người tạo kèo không còn phải đuổi theo ai.
- **Ví MatchUp & thanh toán tập trung:** Mọi khoản thanh toán đều qua Ví MatchUp (đặt sân, phần kèo, nạp tiền ví); nạp / rút tiền qua các cổng VNPay, MoMo, chuyển khoản ngân hàng.

### 3.5. Chương trình thành viên & Gamification (Retention)
- **Điểm thành viên (Loyalty points):** 1 điểm / 1.000đ thực trả, quy đổi 1 điểm = 100đ, dùng tối đa 50% mỗi đơn — khuyến khích thanh toán trong nền tảng và giữ chân người dùng.
- **Huy hiệu & streak:** Huy hiệu "Đồng đội tích cực", đếm số trận đã chơi — tăng cảm giác gắn bó và danh tiếng trong cộng đồng.
- **Đánh giá sau trận:** Sao và tag cảm nhận (đúng giờ, đồng đội vui, sân tốt) — tạo dữ liệu chất lượng cho hệ thống gợi ý.

### 3.6. Hành trình trận đấu (Match Journey) & Kết nối 2 phía
- **Hành trình 5 bước trực quan:** Giữ sân → Xác nhận → Đủ người → Chia tiền → Sẵn sàng bắt đầu. Người dùng luôn biết bước tiếp theo cần làm gì.
- **Đặt lại lịch một chạm:** Sau trận, một nút "Chơi lại khung giờ này" đặt lại đúng sân, đúng giờ — tăng tần suất quay lại.
- **Thông báo thông minh:** Nhận thông báo khi có kèo mới phù hợp bộ lọc (waitlist), khi kèo được duyệt, khi giữ chỗ sắp hết hạn.
- **Chat theo trạng thái:** Ngay khi được duyệt vào kèo, người chơi được đưa vào phòng chat riêng của đội để chốt địa điểm, giờ đến và các lưu ý trước trận.
- **Kết nối 2 phía thị trường:** Người chơi ↔ Người chơi (ghép kèo) và Người chơi ↔ Chủ sân (lấp giờ trống) — tạo hiệu ứng mạng lưới hai chiều.

### 3.7. Trung tâm cá nhân & liên lạc (Retention Layer)
- **Trang Cá nhân hợp nhất:** Theo dõi yêu cầu chờ duyệt, kèo đã xác nhận, lịch sân sắp tới, kèo đã lưu, lịch sử trận hoàn thành, đánh giá đã gửi và các lượt tìm kiếm đang theo dõi.
- **Nhật ký điểm & danh tiếng:** Xem lịch sử cộng / đổi điểm thành viên, streak, huy hiệu và số liệu chơi ngay trong hồ sơ.
- **Trung tâm thông báo:** Một biểu tượng chuông hiển thị thông báo chưa đọc cho các mốc quan trọng: tạo kèo, xin vào, được duyệt, mở chat, thanh toán và hết hạn giữ sân; người dùng có thể đánh dấu đã đọc.
- **Tab Liên lạc / inbox đội:** Mỗi kèo đã được duyệt hoặc đã thanh toán có một phòng chat riêng; inbox hiển thị tin nhắn cuối, thời gian, trạng thái và badge chưa đọc, hỗ trợ tìm kiếm theo tên kèo.
- **Quản lý trạng thái:** Người dùng có thể hủy kèo / lịch sân trong demo, đặt lại lịch đã hết hạn và reset toàn bộ dữ liệu để trình diễn lại luồng sản phẩm.

---

## 4. Cơ hội thị trường (Market Opportunity)

- **Thể thao phong trào đang bùng nổ tại Việt Nam:** Phong trào pickleball, bóng đá 7 người, cầu lông phát triển mạnh tại các đô thị lớn (Hà Nội, TP.HCM); hàng trăm ngàn người chơi thường xuyên mỗi tuần.
- **Sân thiếu người, người thiếu đội — nghịch lý lớn:** Giờ thấp điểm sân trống đến 60–70%, trong khi người chơi không biết tìm nhau ở đâu. Nền tảng này hóa nghịch lý đó.
- **Thói quen thanh toán số đã phổ biến:** VietQR và ví điện tử đã trở thành thói quen của người Việt, hạ thấp rào cản áp dụng cho thanh toán chia tiền trên nền tảng.
- **Tiềm năng kiếm tiền đa nguồn:**
  1. Hoa hồng đặt sân (từ chủ sân, mô hình marketplace).
  2. Phí giao dịch chia tiền / giữ hộ thanh toán.
  3. Gói SaaS cho chủ sân: quản lý lịch, báo cáo doanh thu, khách hàng.
  4. Quảng cáo & tài trợ: thương hiệu thể thao, sản phẩm dinh dưỡng, giải đấu.
  5. Dữ liệu nhu cầu thể thao theo khu vực (bán cho thương hiệu, quy hoạch).

---

## 5. Lợi thế cạnh tranh (Competitive Moat)

| Đối thủ / giải pháp hiện tại | Hạn chế | MatchUp khác biệt |
|---|---|---|
| Nhóm chat (Zalo, Messenger) | Phân mảnh, không tìm được người lạ, hủy kèo dễ | Ghép kèo thuật toán với điểm phù hợp minh bạch |
| App đặt sân thuần túy | Chỉ giải quyết 1 nửa vòng đời | **Ghép đội + đặt sân + chia tiền + danh tiếng** trong một sản phẩm |
| Chat nhóm đại chúng | Không gắn với trạng thái duyệt, thanh toán, sân và danh sách thành viên | Phòng chat riêng chỉ mở sau khi được duyệt, gắn trực tiếp với giao dịch và hành trình trận đấu |
| Đặt sân qua gọi điện / giấy | Thủ công, không dữ liệu | Giữ chỗ 10 phút, thanh toán số, báo cáo tự động |
| Mạng xã hội thể thao | Thiếu giao dịch, thiếu tiện ích | Giao dịch khép kín: thanh toán, chia tiền, điểm thưởng |

**Hào sâu chiến lược:** Mạng lưới hai phía (người chơi + chủ sân), dữ liệu hồ sơ & danh tiếng tích lũy, lịch sử tương tác theo kèo và hệ điểm thưởng gắn chặt người dùng với nền tảng.

## 6. Giải đáp hai câu hỏi phản biện quan trọng

### 6.1. Nếu người chơi ở Long Biên nhưng sân ở Hai Bà Trưng thì sao?

MatchUp không mặc định rằng sân gần nhà luôn là lựa chọn tốt nhất. Hệ thống hiển thị **khoảng cách thực tế, địa chỉ, bản đồ và khung giờ còn trống**; người chơi có thể đặt bán kính tìm kiếm và tự quyết định có di chuyển hay không. Điểm phù hợp của một kèo cũng tính đến vị trí sân, không chỉ vị trí người dùng.

Đây là bài toán tối ưu giữa **độ gần, chất lượng sân, thời gian phù hợp và khả năng đủ đội**. Người ở Long Biên sẽ ưu tiên các kèo tại Long Biên hoặc khu vực lân cận, nhưng vẫn có thể chọn kèo ở Hai Bà Trưng nếu sân tốt hơn, giờ phù hợp hơn hoặc đã có bạn bè tham gia. Ở giai đoạn thí điểm, MatchUp tập trung mật độ sân và người chơi trong từng cụm quận để giảm quãng đường di chuyển; khi mở rộng, dữ liệu nhu cầu sẽ giúp đề xuất các kèo và sân cân bằng hơn theo từng khu vực.

### 6.2. Người dùng đã quen đặt một sân thì có liên hệ thẳng với chủ sân không?

**Có thể — và đây là rủi ro mà MatchUp phải chủ động giải quyết.** Vì vậy, sản phẩm không chỉ bán một lượt đặt sân mà cung cấp toàn bộ vòng đời trận đấu: tìm người cùng chơi, mở kèo, duyệt thành viên, thanh toán, chia tiền, chat đội, nhắc lịch, đánh giá và đặt lại một chạm.

Với người đã có sân quen, MatchUp tạo lý do để họ vẫn đặt qua nền tảng:

- Đặt lại đúng sân và khung giờ chỉ với một chạm, đồng thời tự mở lại kèo cho đội.
- Theo dõi phần thanh toán của từng thành viên, thay cho việc nhắn tin và thu tiền thủ công.
- Tích điểm, nhận ưu đãi, duy trì lịch sử trận đấu và danh tiếng cá nhân.
- Có phòng chat, nhắc lịch và quy trình xử lý rõ ràng nếu thành viên hủy hoặc không thanh toán.

Với chủ sân, nền tảng mang lại **khách mới và nhu cầu giờ thấp điểm**, cùng công cụ quản lý lịch, thanh toán và dữ liệu doanh thu. Chủ sân có thể tiếp tục phục vụ khách quen, nhưng đặt qua MatchUp giúp họ lấp đầy công suất và giảm vận hành. Do đó, hoa hồng chỉ có ý nghĩa khi giá trị tăng thêm cho cả hai phía lớn hơn chi phí giao dịch.

Chiến lược giữ giao dịch trong nền tảng là kết hợp **giá trị thực + loyalty + trải nghiệm đặt lại**, thay vì chỉ dựa vào việc ngăn người dùng liên hệ trực tiếp. Khi mạng lưới người chơi, lịch sử đội và dữ liệu tin cậy tích lũy, việc chuyển ra ngoài sẽ làm mất các tiện ích mà họ đang dùng.

---

## 7. Mô hình kinh doanh (Business Model)

1. **Hoa hồng đặt sân** (10–15% mỗi giao dịch thành công từ chủ sân).
2. **Phí thanh toán** trên mỗi phần chia tiền xử lý qua nền tảng.
3. **BaaS cho chủ sân (SaaS):** quản lý lịch sân, giá động, báo cáo doanh thu, tự động lấp giờ trống.
4. **Bán mã ưu đãi / voucher cho thương hiệu** giảm giá chéo sân.
5. **Gói nâng cao cho chủ kèo / câu lạc bộ:** phòng chat có thông báo nổi bật, quản trị thành viên, lịch sử đội và công cụ tổ chức nhiều trận.
6. **Tài trợ giải đấu, quảng cáo trong nền tảng** khi đạt quy mô.

---

## 8. Lộ trình sản phẩm (Roadmap)

- **Giai đoạn 1 — MVP (đã hoàn thành):** Web demo tương tác đầy đủ — ghép đội, lọc / sắp xếp, lưu kèo, báo kèo, đặt sân, mời đội, chia tiền, chat đội sau khi được duyệt, inbox Liên lạc, trung tâm thông báo, điểm thưởng, streak / huy hiệu và đánh giá (toàn bộ luồng được mô phỏng sống động, chạy không cần backend).
- **Giai đoạn 2 — Thị trường thí điểm (3–6 tháng):** Backend thật, chat realtime và push notification, app iOS/Android, triển khai tại 1–2 quận của Hà Nội (Long Biên), ký hợp đồng 20–50 sân, đạt 10.000 người dùng thử.
- **Giai đoạn 3 — Mở rộng (6–12 tháng):** Mở rộng TP.HCM, tích hợp thanh toán chính thức (MoMo, VNPay, ngân hàng), ra mắt bảng điều khiển cho chủ sân, thương mại hóa hoa hồng.
- **Giai đoạn 4 — Quy mô (12–24 tháng):** Dữ liệu lớn về nhu cầu thể thao, sản phẩm cho giải đấu & câu lạc bộ, mở rộng sang các đô thị lớn khác và Đông Nam Á.

---

## 9. Đội ngũ (Team)

*(Điền thông tin đội ngũ: thành viên, vai trò, kinh nghiệm, điểm mạnh bổ sung cho nhau.)*

---

## 10. Số tiền kêu gọi & cách sử dụng (The Ask)

| Hạng mục | Tỷ lệ |
|---|---|
| Phát triển sản phẩm (backend, mobile app) | 40% |
| Bán hàng & ký hợp đồng sân đối tác | 25% |
| Marketing & tăng trưởng người dùng | 25% |
| Vận hành & dự phòng | 10% |

*(Điền số tiền cụ thể, mức định giá, và các mốc sản phẩm tương ứng.)*

---

## 11. Cách chạy bản demo (How to Demo)

Mở `index.html` trong trình duyệt (không cần cài đặt). Toàn bộ dữ liệu được lưu trên trình duyệt (localStorage), có thể thao tác trực tiếp:

1. **Trang chủ (index.html):** Tìm trận, xem kèo nổi bật, đặt sân nhanh, xem danh mục voucher và sao chép mã ưu đãi `MATCH20`; biểu tượng chuông mở trung tâm thông báo.
2. **Tìm trận (match/):** Lọc môn / thời gian / trình độ / khoảng cách, sắp xếp, xem "Điểm phù hợp", lưu kèo, bật "Báo tôi khi có kèo", tạo kèo mới, xin vào kèo, xem chi tiết & bản đồ. Sau khi xin vào, màn hình đội hiển thị tiến độ, lời chào và link mời; phòng chat chỉ xuất hiện sau khi yêu cầu được duyệt.
3. **Đặt sân (booking/):** Lọc sân theo môn / giờ / bán kính, chọn ngày / sân / khung giờ, xem trạng thái khung giờ thời gian thực, chọn voucher theo điều kiện và giữ chỗ 10 phút. Nếu hết hạn, có thể đặt lại sân.
4. **Rủ đội & chia tiền (invite/):** Sao chép hoặc chia sẻ link mời, thêm người chơi, chia đều / tùy chỉnh với kiểm tra tổng khớp đơn, theo dõi tiến độ thu tiền, thanh toán từ Ví MatchUp, dùng điểm thành viên, xem hành trình 5 bước, đánh giá và chơi lại sau trận.
5. **Cá nhân (profile/):** Chỉnh hồ sơ & sở thích, xem kèo đã lưu, theo dõi kèo, bấm "Giả lập duyệt" để mô phỏng chủ kèo chấp nhận, mở chat đội, xem lịch sân, nạp / rút tiền Ví MatchUp qua VNPay / MoMo / chuyển khoản, thống kê trận / đánh giá / streak / huy hiệu, nhật ký điểm thành viên, hủy hoặc đặt lại lịch, đặt lại dữ liệu demo.
6. **Liên lạc (contact/):** Xem inbox các phòng chat đã được duyệt, tìm kiếm theo tên kèo, xem tin nhắn cuối và badge chưa đọc; chọn phòng để chat với đội.

---

*Tài liệu này mô tả sản phẩm MatchUp — bản MVP demo dùng để giới thiệu và kêu gọi đầu tư.*
