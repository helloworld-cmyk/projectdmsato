# Context dự án

Khi cần mở trình duyệt để kiểm tra giao diện dự án, hãy mở thẳng URL gốc sau:

`http://localhost:3000/`

## Tab Liên lạc

Tab **Liên lạc** (`/contact.html`) là inbox kiểu Messenger, tổng hợp tất cả phòng chat đội đã được mở sau khi chủ kèo duyệt yêu cầu tham gia.

- Chỉ các kèo có trạng thái `accepted` hoặc `paid` mới xuất hiện trong inbox.
- Mỗi dòng hiển thị tên kèo, avatar đội, tin nhắn cuối, thời gian và badge chưa đọc.
- Bấm một dòng sẽ mở lại phòng chat đội dùng chung; tìm kiếm lọc theo tên kèo.
- Tin nhắn và phòng chat hiện được lưu trong `localStorage` để mô phỏng prototype; chưa có realtime backend.

Luồng kiểm tra: vào `/match.html` → **Xin vào** → `/profile.html` → **Giả lập duyệt** → mở tab **Liên lạc** → chọn phòng chat.
