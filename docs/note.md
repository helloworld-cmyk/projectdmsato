# Plan refactor toàn bộ codebase MatchUp

## Mục tiêu

- Mỗi file JavaScript chỉ có một trách nhiệm rõ ràng, không còn file vài trăm dòng chứa tất cả logic.
- Toàn bộ JavaScript dùng ES Modules với `import`/`export` chuẩn của trình duyệt.
- Tách hẳn 4 lớp: state/data, business logic, UI components và page controller.
- Có thể đọc code theo chiều dọc, giới hạn dòng dài và tránh các chuỗi `innerHTML` khổng lồ.
- Refactor từng phần mà các flow hiện tại vẫn chạy được: tạo kèo, xin vào kèo, thanh toán, đặt sân, chat, profile, thông báo.
- Không đổi hành vi hoặc format dữ liệu `localStorage` nếu chưa có migration tương ứng.

## Tình trạng hiện tại cần giữ làm mốc

- `app-state/` đã được tách bước đầu thành `core`, `services`, `api`; tiếp tục hoàn thiện thay vì viết lại từ đầu.
- `profile/js/` đã có một số component riêng nhưng vẫn còn dependency vòng giữa component và `render.js`.
- `app-ui.js` vẫn gộp notification, chat và profile navigation trong một IIFE.
- `invite/script.js` là phần UI lớn cần ưu tiên chia nhỏ.
- Các page còn dùng nhiều HTML tĩnh và các script riêng: `index/`, `match/`, `invite/`, `booking/`, `contact/`, `profile/`.

## Nguyên tắc kiến trúc sau refactor

```text
page/main.js
  -> page/controller.js
    -> page/components/*.js
      -> page/selectors.js
      -> shared/*.js
      -> app-state/api/*.js

app-state/
  -> core state/storage/migrations
  -> domain services
  -> api facade

app-state không được import DOM.
shared không được biết dữ liệu cụ thể của một page.
component không tự khởi tạo toàn bộ app và không thao tác trực tiếp với localStorage.
```

Quy ước thực hiện:

- Mỗi phần dưới đây là một commit hoặc một PR nhỏ.
- Không format lại toàn bộ repository trong cùng commit với thay đổi logic.
- Khi chuyển file, giữ một file adapter/re-export tạm thời để các page cũ không hỏng giữa chừng.
- Không tạo dependency vòng. Controller gọi action rồi gọi render; component chỉ nhận dữ liệu đã chuẩn bị.
- Các hàm không có DOM phải được đưa ra file thuần để có thể test bằng Node.
- Mỗi file mới nên nằm khoảng 30–150 dòng; file trên 200 dòng phải có lý do rõ ràng.

## Phần 0 — Chốt baseline trước khi sửa

### Việc thực hiện

1. Chạy app tại `http://localhost:3000/`.
2. Ghi lại các route đang có:
   - `/`
   - `/match/`
   - `/invite/`
   - `/booking/`
   - `/contact/`
   - `/profile/`
3. Kiểm tra nhanh các flow chính:
   - lọc và lưu một kèo;
   - xin vào kèo và cập nhật trạng thái;
   - duyệt/thanh toán application;
   - tạo booking, chia tiền và thanh toán;
   - mở chat, gửi tin nhắn và đánh dấu đã đọc;
   - sửa profile và reset demo.
4. Lưu lại lỗi console hiện có, không sửa trong phần này.
5. Kiểm tra `git diff` để tách rõ thay đổi đang có của người dùng khỏi thay đổi refactor mới.

### Xong khi

- Có checklist smoke test cho 6 route.
- Biết rõ lỗi nào đã tồn tại trước refactor.
- Có thể so sánh hành vi trước và sau từng phần.

Commit: `chore: record refactor baseline`

## Phần 1 — Thêm quy tắc format để hết dòng code quá dài

### File dự kiến

- `.editorconfig`
- `package.json`
- `prettier.config.mjs`
- có thể thêm `eslint.config.js` sau khi module hóa xong

### Việc thực hiện

- Cấu hình indent 2 spaces, cuối dòng LF, encoding UTF-8.
- Cấu hình Prettier cho `js`, `html`, `css`, giới hạn độ dài dòng khoảng 100–110 ký tự.
- Thêm script nhỏ:
  - `format` — format file đã chỉ định;
  - `format:check` — kiểm tra format;
  - `check:js` — kiểm tra syntax các file JS;
  - `test` — chạy test thuần bằng `node:test` khi test đã được thêm.
- Chỉ format các file vừa sửa trong từng commit, sau cùng mới format phần còn lại.

### Xong khi

- Không còn phải viết hoặc đọc các dòng JS/CSS cực dài trong file mới.
- Chạy được format check mà không cần bundler.

Commit: `chore: add formatting and module checks`

## Phần 2 — Tạo lớp shared dùng chung

### Cấu trúc đích

```text
shared/
  dom.js              # qs, qsa, required, on
  html.js             # escapeHtml, template helpers
  format.js           # formatMoney, formatDate, relativeTime
  time.js             # countdown và các phép tính thời gian
  events.js           # tên event và helper subscribe/unsubscribe
  validation.js       # validate input dùng chung
  ui/
    toast.js
    modal.js
    emptyState.js
```

### Việc thực hiện

- Di chuyển các hàm dùng chung từ `profile/js/utils.js`, `app-ui.js` và các page script.
- Giữ `profile/js/utils.js` làm file re-export tạm thời để profile không hỏng.
- Chỉ đưa hàm thật sự dùng chung vào `shared`; hàm chỉ phục vụ một page vẫn để tại page đó.
- Chuẩn hóa `escapeHtml` và dùng nó cho mọi dữ liệu từ state trước khi render HTML.
- Chuẩn hóa format tiền, ngày và countdown để các page không tự viết bản riêng.

### Xong khi

- Không còn 2–3 bản `escape`, `formatMoney`, `relativeTime` khác nhau.
- `shared/` không import `store`, không import DOM của page cụ thể.
- Có test cho các hàm pure: escape, format tiền, countdown, validation.

Commit: `refactor: extract shared utilities`

## Phần 3 — Ổn định state core và storage

### Cấu trúc đích

```text
app-state/
  index.js                 # entrypoint duy nhất để bootstrap
  bootstrap.js             # lắp các service và API
  core/
    constants.js
    defaults.js             # state mặc định
    storage.js              # read/write localStorage
    migrations.js           # migration theo version
    normalise.js            # chuẩn hóa dữ liệu đọc vào
    state.js                 # store nội bộ và event state-change
```

### Việc thực hiện

1. Giữ `STORAGE_KEY`, `EVENT_NAME` và các version migration ở một chỗ.
2. Tách `createDefaultState`, `normaliseState`, `read`, `save`, `resetDemo` khỏi file state lớn.
3. Tách từng migration thành hàm có tên và version cụ thể, ví dụ:
   - `migrateBookingRosterV1`;
   - `migrateReputationV1`;
   - `migrateChatGreetingV1`.
4. Store nội bộ chỉ chịu trách nhiệm:
   - giữ state;
   - đọc/ghi storage;
   - phát event state change;
   - gọi migration.
5. Không để UI biết cấu trúc trực tiếp của `localStorage`.
6. Vẫn expose `window.MatchUpStore` trong giai đoạn chuyển tiếp để các page cũ hoạt động.

### Xong khi

- State core không chứa HTML, `document`, `window` UI hoặc `innerHTML`.
- Có test đọc state cũ, state thiếu field và state sai kiểu.
- Dữ liệu demo cũ vẫn mở được và không bị mất sau reload.

Commit: `refactor: split state storage and migrations`

## Phần 4 — Tách domain logic khỏi API facade

### Cấu trúc đích

```text
app-state/
  domains/
    profile.js
    matches.js
    applications.js
    bookings.js
    chat.js
    commerce.js
    reputation.js
    notifications.js
    journeys.js
  api/
    api-general.js
    api-profile.js
    api-matches.js
    api-bookings.js
    api-chat.js
    index.js
```

### Việc thực hiện

- Giữ business rule trong `domains`/`services`, chỉ expose method public trong `api`.
- Tách logic hiện có theo nhóm:
  - profile và preferences;
  - match, filter, save, waitlist;
  - application và approval;
  - booking, roster, chia tiền;
  - wallet, voucher, loyalty;
  - chat room, message, auto reply;
  - reputation, feedback, journey;
  - notification.
- Các hàm như `splitEqual`, `splitProportionally`, voucher calculation, approval check phải là pure function riêng.
- API trả clone/view model, không trả object state để page có thể mutate trực tiếp.
- `app-state/index.js` chỉ làm nhiệm vụ lắp dependency và export store.
- Khi tách, giữ tên API cũ; chỉ đổi vị trí implementation, không đổi contract.

### Xong khi

- Mỗi domain có thể test độc lập.
- `api/*.js` không còn chứa hàng trăm dòng business logic.
- Không có domain nào import ngược page hoặc component.
- Các flow hiện tại chạy bằng cùng method name như trước.

Commit: `refactor: separate state domains from public api`

## Phần 5 — Chia `app-ui.js` thành shared UI modules

### Cấu trúc đích

```text
app-ui/
  index.js
  bootstrap.js
  notifications/
    view.js
    controller.js
  chat/
    view.js
    controller.js
    messages.js
    typing.js
  profile-navigation.js
```

### Việc thực hiện

- Tách 3 trách nhiệm hiện đang nằm trong IIFE:
  1. notification popover;
  2. chat layer, quick reply, typing và copy match info;
  3. profile link/navigation.
- Mỗi UI module có `mount(root, dependencies)` hoặc `init(dependencies)` rõ ràng.
- Tách HTML template dài thành các hàm render nhỏ trong `view.js`.
- Tách listener khỏi render function.
- `app-ui.js` tạm thời chỉ còn:

  ```js
  import "./app-ui/index.js";
  ```

- Các page vẫn import `app-ui.js` trong lúc chuyển đổi, không đổi nhiều HTML cùng một lúc.

### Xong khi

- Không còn IIFE lớn trong `app-ui.js`.
- Chat và notification vẫn hoạt động ở mọi page.
- Có thể sửa chat mà không phải đọc notification code.

Commit: `refactor: split shared app ui`

## Phần 6 — Hoàn thiện profile thành component và controller

### Cấu trúc đích

```text
profile/js/
  main.js
  controller.js
  selectors.js
  actions.js
  mount.js
  components/
    profile.js
    playStats.js
    savedMatches.js
    applications.js
    bookings.js
    wallet.js
    loyalty.js
    reputation.js
  modals/
    applicationPayment.js
    walletTopup.js
  templates/
    cards.js
    modals.js
```

### Việc thực hiện

- Đưa các phép tính số liệu và lọc list sang `selectors.js`.
- Đưa thao tác update profile, cancel, pay, reset sang `actions.js`.
- Component nhận view model và chỉ render vùng DOM của mình.
- `render.js` chỉ điều phối các component; không tự xử lý business logic.
- Tách event listener theo nhóm:
  - profile form;
  - application/payment;
  - booking;
  - wallet/loyalty;
  - saved match và feedback.
- Xóa import vòng kiểu component gọi ngược `render.js`; sau action, controller gọi render cần thiết.
- Tách HTML inject trong `dom.js` thành `mount.js` và template nhỏ.

### Xong khi

- Mỗi section profile render độc lập.
- Một thay đổi ở wallet không cần đọc applications/bookings.
- Không có component nào import ngược controller tổng.

Commit: `refactor: finish profile component architecture`

## Phần 7 — Chia page `/match/`

### Cấu trúc đích

```text
match/
  main.js
  controller.js
  state.js              # filter tạm của page, không phải app state
  selectors.js
  events.js
  components/
    filterBar.js
    matchList.js
    matchCard.js
    joinDialog.js
    reputationSummary.js
  templates/
    matchCard.js
    emptyState.js
```

### Việc thực hiện

- Tách filter state khỏi logic render danh sách.
- Tách `matchCard` khỏi join dialog và reputation block.
- Tách event delegation khỏi hàm render.
- Dùng `store` API để lấy data; không đọc `window.MatchUpState` trong component.
- Giữ query string và hành vi filter hiện tại nếu có.

### Xong khi

- `match/script.js` trở thành entrypoint/controller mỏng hoặc được giữ làm adapter import `main.js`.
- Có thể render card bằng dữ liệu mẫu mà không cần chạy toàn bộ page.

Commit: `refactor: split match page modules`

## Phần 8 — Chia page `/invite/` theo từng flow

Đây là phần ưu tiên vì `invite/script.js` đang lớn nhất.

### Cấu trúc đích

```text
invite/
  main.js
  controller.js
  state.js
  selectors.js
  actions.js
  events.js
  components/
    matchForm.js
    playerSlots.js
    joinRules.js
    venuePicker.js
    inviteSummary.js
    shareDialog.js
  templates/
    playerSlot.js
    summary.js
```

### Việc thực hiện

1. Liệt kê các biến state tạm chỉ dùng trong trang.
2. Đưa state đó vào `invite/state.js`, không đặt trong biến global.
3. Tách form input và validation khỏi render.
4. Tách player slots, join rules, venue/location, summary và share dialog thành component.
5. Tách action gọi `store.createMatch`, `store.updateMatchRules`, `store.applyToMatch` khỏi event listener.
6. Mỗi component chỉ biết root element của nó và dữ liệu cần render.
7. Giữ `invite/script.js` làm adapter cho tới khi HTML chuyển sang entrypoint mới.

### Xong khi

- Không còn file 750 dòng chứa cả form, modal, state và event.
- Mỗi flow có thể sửa độc lập.
- Tạo kèo và gửi lời mời vẫn lưu đúng state sau reload.

Commit: `refactor: split invite page into feature modules`

## Phần 9 — Chia page `/booking/` và loại bỏ legacy dần dần

### Cấu trúc đích

```text
booking/
  main.js
  controller.js
  state.js
  selectors.js
  events.js
  components/
    schedule.js
    bookingSummary.js
    roster.js
    splitEditor.js
    voucherPicker.js
    payment.js
    confirmation.js
```

### Việc thực hiện

- Đưa xử lý lịch/sân vào `schedule.js`.
- Đưa roster và chia tiền vào `roster.js`/`splitEditor.js`.
- Đưa voucher, loyalty, wallet và VietQR vào `payment.js`.
- Đọc các hàm còn lại trong `legacy-ui.js`, chuyển từng hàm sang module mới rồi xóa file legacy sau khi smoke test.
- Không để payment component tự sửa state; mọi mutation đi qua API booking/commerce.

### Xong khi

- `legacy-ui.js` không còn được load.
- Có test cho chia đều, chia theo tỷ lệ, discount và wallet debit.
- Luồng đặt sân từ chọn lịch đến confirm vẫn giữ nguyên.

Commit: `refactor: split booking page and remove legacy ui`

## Phần 10 — Chia page `/contact/`

### Cấu trúc đích

```text
contact/
  main.js
  controller.js
  selectors.js
  events.js
  components/
    roomList.js
    roomRow.js
    chatPanel.js
    messageList.js
    composer.js
```

### Việc thực hiện

- Tách tìm kiếm room khỏi render room list.
- Tách room row khỏi message list.
- Tách composer, quick reply và gửi tin nhắn khỏi chat panel.
- Dùng shared chat controller nếu logic giống chat layer trong `app-ui`; không tạo hai implementation khác nhau.
- Giữ điều kiện chỉ hiển thị application đã accepted/paid.

### Xong khi

- Contact page chỉ còn controller mỏng.
- Search, mở room, gửi message và unread badge đều hoạt động.

Commit: `refactor: split contact page components`

## Phần 11 — Chia page `/` và gom các page entrypoint

### Cấu trúc đích

```text
index/
  main.js
  controller.js
  selectors.js
  events.js
  components/
    preferenceForm.js
    recommendedMatches.js
    matchPreview.js
```

### Việc thực hiện

- Chuyển logic còn lại trong `index/script.js` sang controller/component tương ứng.
- Các script page chỉ nên làm 3 việc: tìm root, khởi tạo state view, gọi controller.
- Chuẩn hóa entrypoint trong HTML:

  ```html
  <script type="module" src="./index/main.js"></script>
  ```

- Các import phải dùng đường dẫn tương đối có đuôi `.js` để chạy trực tiếp trên static hosting.
- Giữ `location.js` và `js/time-filter/index.js` làm entrypoint dùng chung.

### Xong khi

- Mọi page đều có một entrypoint module duy nhất của riêng page đó.
- Không còn page nào phụ thuộc vào thứ tự của nhiều script global.

Commit: `refactor: standardize page entrypoints`

## Phần 12 — Giảm HTML động khổng lồ và tổ chức UI component

### Việc thực hiện

- Thêm một root rõ ràng cho mỗi vùng dynamic, ví dụ:

  ```html
  <section data-component="match-list"></section>
  ```

- Chuyển HTML lặp lại ra `templates/*.js` hoặc `<template>` có tên.
- Mỗi template chỉ đại diện cho một component, không chứa cả page.
- Tránh nối chuỗi HTML nhiều dòng trong controller.
- Không đặt `onclick` inline trong HTML; event nằm trong `events.js`.
- Mọi input cần label/aria label và mọi list cần empty state/loading state.

### Xong khi

- Không còn `innerHTML` dài đến mức phải cuộn ngang.
- Markup của một component nằm gần logic component đó.
- Có thể tìm một UI bằng tên component thay vì tìm giữa file HTML hàng trăm dòng.

Commit: `refactor: isolate ui templates and mounts`

## Phần 13 — Dọn CSS theo component và responsive

Phần này làm sau khi JS component đã ổn định để tránh sửa đi sửa lại selector.

### Việc thực hiện

- Mỗi page giữ CSS layout riêng; CSS dùng chung đưa vào `shared` hoặc file global hiện có.
- Đặt tên class theo component, tránh selector phụ thuộc sâu vào HTML.
- Gom breakpoint/responsive theo component.
- Tìm và xử lý các nguyên nhân tạo horizontal overflow thật trên viewport:
  - chuỗi dài;
  - modal/chat width cố định;
  - bảng hoặc card không co giãn;
  - `min-width` không cần thiết.
- Không dùng `overflow-x: hidden` để che lỗi trước khi tìm nguyên nhân.

### Xong khi

- Các page hiển thị tốt ở mobile và desktop.
- Không có horizontal scroll không chủ ý.
- CSS của component có thể đọc và chỉnh độc lập.

Commit: `refactor: organize component styles and responsive rules`

## Phần 14 — Test, smoke test và dọn adapter cũ

### Test tự động

Ưu tiên test các phần không có DOM:

- state defaults và migrations;
- normalise player/booking/reputation;
- approval rules;
- equal/proportional split;
- voucher và loyalty;
- wallet debit/top-up;
- chat access và message rules;
- selectors của từng page.

### Smoke test sau mỗi phần

- `npm run format:check`.
- `npm run check:js`.
- `npm test`.
- Mở lại 6 route và kiểm tra console.
- Reload trang để kiểm tra persistence.
- Kiểm tra các flow state quan trọng bằng localStorage mới và dữ liệu demo cũ.

### Dọn cuối cùng

- Xóa `app-state.js` cũ sau khi mọi import đã chuyển.
- Xóa các adapter `script.js`/`app-ui.js` chỉ còn re-export khi không còn consumer.
- Xóa `legacy-ui.js` sau phần booking.
- Xóa hàm duplicate trong page utils.
- Xóa `window.MatchUpState` nếu không còn page nào dùng; giữ `window.MatchUpStore` chỉ khi thật sự cần tương thích.
- Cập nhật `README.md` với cấu trúc module và lệnh chạy/test.

Commit: `refactor: remove legacy entrypoints and document architecture`

## Thứ tự triển khai nhanh nhất

```text
0 Baseline
  ↓
1 Format/check
  ↓
2 Shared utilities
  ↓
3 State core
  ↓
4 Domain + API facade
  ↓
5 Shared app UI
  ↓
┌──────────────┬──────────────┬──────────────┐
│ 6 Profile    │ 7 Match      │ 8 Invite     │
│              │              │              │
│ 9 Booking    │ 10 Contact   │ 11 Home      │
└──────────────┴──────────────┴──────────────┘
  ↓
12 HTML/templates
  ↓
13 CSS/responsive
  ↓
14 Tests + cleanup
```

Các phần 6–11 có thể làm song song sau khi phần 5 hoàn tất, nhưng mỗi page phải được hoàn thành trọn một vertical slice trước khi chuyển sang page khác.

## Definition of Done cho mọi phần

- Không có lỗi syntax/module import.
- Không tăng thêm file global hoặc biến global mới.
- Logic mới có tên hàm và boundary rõ ràng.
- Component có root riêng và không render sang vùng của component khác.
- Mutation state đi qua API/domain action.
- Có smoke test cho page/flow liên quan.
- Có commit nhỏ, mô tả đúng một mục tiêu và dễ revert.
