## 6.5. Xây dựng MVP

### 6.5.1. MVP hiện tại: MatchUp – ghép đội, đặt sân và quản lý trận đấu

#### Mô tả MVP

MatchUp hiện được triển khai dưới dạng prototype web tương tác, tập trung vào bài toán người chơi muốn tìm đồng đội, tìm kèo phù hợp và đặt sân trong cùng một quy trình. MVP gồm các màn hình chính: Khám phá, Tìm trận, Đặt sân, Rủ đội & chia tiền, Cá nhân và Liên lạc.

Phiên bản hiện tại mô phỏng toàn bộ hành trình của một trận đấu:

- Tìm kèo theo môn thể thao, thời gian, trình độ, khoảng cách và mức phí; sắp xếp theo độ phù hợp, khoảng cách hoặc thời gian.
- Hiển thị điểm phù hợp và lý do đề xuất, chẳng hạn cùng trình độ, đúng thời gian rảnh hoặc ở gần vị trí hiện tại.
- Xem chi tiết kèo, thông tin sân, người tham gia, số chỗ còn lại và phần chi phí dự kiến mỗi người.
- Lưu kèo, tạo kèo mới và bật tính năng báo khi có kèo phù hợp.
- Gửi yêu cầu tham gia kèo. Sau khi được duyệt, người chơi có thể xem danh sách đội và tham gia phòng chat riêng của kèo.
- Tìm sân theo môn, khung giờ, khoảng cách và mức giá; chọn ngày, sân, khung giờ còn chỗ và voucher.
- Giữ chỗ trong 10 phút, mô phỏng trạng thái khung giờ, hết hạn giữ chỗ và đặt lại sân.
- Tạo link mời, thêm người chơi, chia tiền đều hoặc tùy chỉnh, theo dõi tiến độ thanh toán và mô phỏng các phương thức VietQR, MoMo, VNPay.
- Theo dõi hành trình trận đấu, điểm thành viên, streak, huy hiệu, đánh giá sau trận và chức năng chơi lại.
- Quản lý hồ sơ, kèo đã lưu, yêu cầu tham gia, lịch sân, thông báo, lịch sử trận đấu và các phòng chat trong trang Cá nhân/Liên lạc.

#### Cơ sở lựa chọn MVP

MVP được xây dựng quanh hai nhu cầu cốt lõi của MatchUp: giải quyết việc thiếu người chơi để lập đội và giảm thao tác thủ công khi tìm, giữ sân, chia tiền. Việc kết hợp hai luồng này trong một prototype giúp nhóm trình bày rõ giá trị của sản phẩm và kiểm tra trải nghiệm đầu-cuối trước khi phát triển backend thật.

#### Trạng thái triển khai thực tế

- Đây là prototype frontend chạy trực tiếp trên trình duyệt; chưa có backend, cơ sở dữ liệu, tài khoản người dùng thật hoặc đồng bộ dữ liệu giữa các thiết bị.
- Dữ liệu kèo, sân, lịch trống, đánh giá, thanh toán và độ tin cậy hiện là dữ liệu demo hoặc được mô phỏng bằng JavaScript.
- Trạng thái người dùng, kèo, booking, thông báo và tin nhắn được lưu trong `localStorage` của trình duyệt.
- Vị trí trong bản demo được mock ở Long Biên, Hà Nội sau khi người dùng đồng ý bật vị trí; bản đồ và khoảng cách chưa kết nối dữ liệu bản đồ/sân theo thời gian thực.
- Phòng chat chỉ mở cho kèo có yêu cầu ở trạng thái được duyệt hoặc đã thanh toán; chat hiện chưa có realtime backend.
- Các thao tác thanh toán chỉ mô phỏng giao diện và trạng thái, chưa phát sinh giao dịch thật.

#### Giả thuyết cần kiểm tra ở giai đoạn tiếp theo

- Người chơi có nhu cầu thực tế đối với một nền tảng kết hợp ghép đội, đặt sân và chia tiền.
- Điểm phù hợp, bộ lọc theo khoảng cách/thời gian và quy trình xin vào kèo giúp rút ngắn thời gian tìm trận.
- Việc hiển thị tiến độ đủ người, trạng thái thanh toán và phòng chat sau khi được duyệt làm tăng mức độ tin cậy.
- Tính năng giữ chỗ, voucher và đặt lại sân tạo đủ giá trị để người dùng tiếp tục đặt sân qua nền tảng.
- Người chơi và chủ sân chấp nhận mô hình phí/hoa hồng sau khi được kiểm chứng bằng dữ liệu giao dịch thật.

#### Mục tiêu của MVP

- Kiểm tra mức độ dễ hiểu và liền mạch của luồng từ tìm kèo đến tham gia trận.
- Đánh giá trải nghiệm tìm sân, chọn khung giờ, giữ chỗ và chia tiền.
- Thu thập phản hồi về các tính năng có giá trị cao nhất đối với người chơi.
- Xác định các yêu cầu cần thiết cho backend: tài khoản, dữ liệu sân theo thời gian thực, chat realtime, thanh toán và thông báo.
- Làm cơ sở để thử nghiệm với người dùng thật trong một khu vực có mật độ sân và người chơi phù hợp.

#### Phương thức triển khai và đo lường

Ở giai đoạn prototype, sản phẩm được chạy thử trực tiếp trên trình duyệt thông qua các luồng demo. Giai đoạn tiếp theo nên tuyển một nhóm người chơi thật tại một cụm khu vực ở Hà Nội, sau đó ghi nhận:

- thời gian từ lúc mở ứng dụng đến khi tìm được kèo hoặc sân phù hợp;
- tỷ lệ xem chi tiết kèo, gửi yêu cầu tham gia và hoàn tất quy trình giữ chỗ;
- tỷ lệ người dùng quay lại, lưu kèo hoặc bật báo kèo;
- số lỗi và điểm gây khó hiểu trong luồng chia tiền, thanh toán và chat;
- phản hồi của người chơi và chủ sân về giá trị sản phẩm cũng như mô hình thu phí.

### 6.5.2. Các hạng mục chưa thuộc MVP hiện tại

Tài khoản quản trị dành cho chủ sân, hệ thống quản lý lịch sân B2B, gói hội viên Premium, thanh toán thật, ứng dụng di động, thuật toán ghép đội production và hệ thống dữ liệu thời gian thực chưa được triển khai trong repository hiện tại. Đây là các hạng mục có thể phát triển sau khi MVP được kiểm chứng với người dùng thật.

## 6.6. Kết luận và hướng phát triển sau MVP

### 6.6.1. Kết luận

MVP hiện tại đã thể hiện được giá trị cốt lõi của MatchUp bằng một prototype web có thể thao tác xuyên suốt: tìm kèo, tham gia đội, đặt sân, chia tiền, chat và theo dõi trận đấu. Tuy nhiên, đây mới là sản phẩm demo dùng để kiểm tra trải nghiệm và trình bày ý tưởng, chưa phải hệ thống thương mại vận hành với dữ liệu và giao dịch thật. Vì vậy, chưa nên kết luận về nhu cầu thị trường, tỷ lệ chuyển đổi hoặc mức phí chỉ dựa trên prototype này.

### 6.6.2. Hướng phát triển sau MVP

Sau khi thử nghiệm với người dùng thật, dự án có thể ưu tiên:

- xây dựng backend, tài khoản người dùng và cơ sở dữ liệu tập trung;
- tích hợp dữ liệu sân/khung giờ thật, bản đồ và định vị thực tế;
- tích hợp cổng thanh toán và cơ chế hoàn tiền, hủy sân, đối soát;
- triển khai chat realtime, push notification, báo cáo và các cơ chế an toàn cộng đồng;
- xây dựng dashboard cho chủ sân để quản lý lịch, giá và doanh thu;
- hoàn thiện thuật toán ghép đội dựa trên dữ liệu hành vi và lịch sử đánh giá;
- thử nghiệm gói Premium, phí giao dịch hoặc hoa hồng sau khi xác định được giá trị sẵn sàng chi trả;
- mở rộng từ một cụm khu vực thí điểm sang các quận khác tại Hà Nội và các thành phố lớn.
