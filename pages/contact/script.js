import '../../js/app-state/index.js';

const store = window.MatchUpStore;
const list = document.querySelector('#chat-list');
const search = document.querySelector('#chat-search');
const count = document.querySelector('#chat-count');
const conversation = document.querySelector('#conversation-card');
const escapeHtml = (value) => String(value ?? '').replace(
  /[&<>"']/g,
  (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]),
);
const truncateEnd = (text, maxLen = 48) => {
  if (text.length <= maxLen) return text;
  return '…' + text.slice(-(maxLen - 1));
};
const roomInitials = (value) => String(value || 'MU')
  .split(/\s+/)
  .slice(-2)
  .map((part) => part[0])
  .join('')
  .toUpperCase();
const demoMessage = (
  senderName,
  senderInitials,
  senderTone,
  text,
  time,
  senderId = 'member',
) => ({ senderId, senderName, senderInitials, senderTone, text, time });
const demoRooms = [
  {
    id: 'demo-football',
    name: 'Kèo bóng đá sân 5 · Tối thứ 5',
    icon: 'sports_soccer',
    tone: '#3f8060',
    initials: 'BĐ',
    meta: 'Thứ Năm · 20:00 · Sân Phú Thọ',
    tag: 'Đã đủ đội',
    members: '5 thành viên',
    unreadCount: 3,
    messages: [
      {
        kind: 'system',
        text: 'Minh Khang đã tạo kèo · 5 người · 72.000đ/người',
        time: '18:02',
      },
      demoMessage(
        'Minh Khang',
        'MK',
        '#6680ba',
        'Mọi người ơi, mình vừa giữ sân Phú Thọ tối thứ Năm 20:00. '
          + 'Chốt đội 5 người nhé?',
        '18:04',
      ),
      demoMessage(
        'Lan Anh',
        'LA',
        '#d88562',
        'Mình vào nhé. Sân này có bóng và áo bib sẵn không Khang?',
        '18:08',
      ),
      demoMessage(
        'Tuấn',
        'T',
        '#7d67ad',
        'Có bóng size 5 rồi, mình mang thêm bơm. '
          + 'Chia đều 72k/người đúng không?',
        '18:11',
      ),
      demoMessage(
        'Ngọc Anh',
        'NA',
        '#d78c68',
        'Mình xác nhận có mặt. Mình đến sớm 10 phút để khởi động.',
        '18:15',
        'self',
      ),
      demoMessage(
        'Minh Khang',
        'MK',
        '#6680ba',
        'Chuẩn kèo! Mọi người chuyển cọc trước 19:00 thứ Tư nhé, '
          + 'mình ghim thông tin ở trên rồi.',
        '18:18',
      ),
    ],
  },
  {
    id: 'demo-badminton',
    name: 'Cầu lông level Khá · Sáng CN',
    icon: 'sports',
    tone: '#c27c3d',
    initials: 'CL',
    meta: 'Chủ nhật · 08:00 · Sân Thanh Đa',
    tag: 'Còn 1 chỗ',
    members: '3 thành viên',
    unreadCount: 2,
    messages: [
      {
        kind: 'system',
        text: 'Lan Anh đã tạo kèo · 4 người · 55.000đ/người',
        time: '17:26',
      },
      demoMessage(
        'Lan Anh',
        'LA',
        '#d88562',
        'Chủ nhật 08:00 sân Thanh Đa nhé. Mọi người muốn đánh đôi xoay vòng '
          + 'hay chia cặp cố định?',
        '17:28',
      ),
      demoMessage(
        'Huy',
        'H',
        '#4e8f8a',
        'Mình vote xoay vòng cho vui, mỗi trận 15 điểm rồi đổi cặp nha.',
        '17:32',
      ),
      demoMessage(
        'Ngọc Anh',
        'NA',
        '#d78c68',
        'Mình tham gia. Level Khá, đánh đôi xoay vòng là hợp bài luôn.',
        '17:36',
        'self',
      ),
      demoMessage(
        'Minh Khang',
        'MK',
        '#6680ba',
        'Mình đem cầu và 2 vợt dự phòng. Còn thiếu một bạn nữa là đủ kèo.',
        '17:39',
      ),
      demoMessage(
        'Lan Anh',
        'LA',
        '#d88562',
        'Ok, mình giữ sân đến tối nay. Ai có bạn cùng trình độ thì rủ thêm '
          + 'giúp mình nhé.',
        '17:42',
      ),
    ],
  },
  {
    id: 'demo-pickleball',
    name: 'Pickleball sau giờ làm · Q.2',
    icon: 'sports_tennis',
    tone: '#7a63a7',
    initials: 'PB',
    meta: 'Thứ Tư · 18:30 · The Pick Hub',
    tag: 'Đang tìm người',
    members: '3 thành viên',
    unreadCount: 1,
    messages: [
      {
        kind: 'system',
        text: 'Phương đã tạo kèo · 4 người · 90.000đ/người',
        time: '16:10',
      },
      demoMessage(
        'Phương',
        'P',
        '#cf7b60',
        'Mình mở kèo pickleball giao lưu sau giờ làm thứ Tư 18:30. '
          + 'Có ai đi từ văn phòng khu Thảo Điền không?',
        '16:12',
      ),
      demoMessage(
        'Khoa',
        'K',
        '#4b8b72',
        'Mình đi từ 18:00, có thể ghé đón thêm một bạn ở ga Metro nhé.',
        '16:18',
      ),
      demoMessage(
        'Ngọc Anh',
        'NA',
        '#d78c68',
        'Mình tự đến được. Mọi người chốt thuê vợt tại sân '
          + 'hay tự mang vậy?',
        '16:23',
        'self',
      ),
      demoMessage(
        'Phương',
        'P',
        '#cf7b60',
        'Sân có vợt thuê 50k/cây. Mình sẽ đặt thêm 2 cây, ai cần thì nhắn '
          + 'để mình ghi lại.',
        '16:26',
      ),
    ],
  },
];

const requestedMatchId = new URLSearchParams(location.search).get('match');
let selectedRoomId = requestedMatchId
  ? `live-${requestedMatchId}`
  : demoRooms[0].id;
const typingRoomCounts = new Map();
const greetingRoomIds = new Set();

const changeTyping = (roomId, amount) => {
  const next = Math.max(0, (typingRoomCounts.get(roomId) || 0) + amount);
  if (next) typingRoomCounts.set(roomId, next);
  else typingRoomCounts.delete(roomId);
};

const startPendingGreeting = (room) => {
  if (
    !room
    || !room.isLive
    || !store.hasPendingChatGreeting(room.matchId)
    || greetingRoomIds.has(room.id)
  ) return;

  greetingRoomIds.add(room.id);
  window.setTimeout(() => {
    changeTyping(room.id, 1);
    render();
    window.setTimeout(() => {
      changeTyping(room.id, -1);
      store.sendChatGreeting(room.matchId);
      greetingRoomIds.delete(room.id);
      render();
    }, 1000);
  }, 1000);
};

const formatTime = (value) => {
  if (typeof value === 'string') return value;
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const liveRooms = () => (store?.getChatRooms?.() || []).map((room) => {
  const match = room.match || {};
  const host = (match.participants || []).find((player) => player.role === 'Chủ kèo')
    || (match.participants || [])[0]
    || {};

  return {
    id: `live-${room.matchId}`,
    matchId: room.matchId,
    name: match.name || 'Phòng chat đội',
    icon: 'forum',
    tone: host.tone || '#6680ba',
    initials: roomInitials(match.name || host.name),
    meta: [
      match.time,
      match.venue,
      match.share ? `${store.money(match.share)}/người` : '',
    ].filter(Boolean).join(' · '),
    tag: room.status === 'paid'
      ? 'Đã đóng cọc'
      : room.status === 'pending'
        ? 'Đang chờ duyệt'
        : 'Đã được duyệt',
    members: `${Math.max(2, (match.participants || []).length)} thành viên`,
    unreadCount: Number(room.unreadCount) || 0,
    isLive: true,
    messages: store.getChatMessages(room.matchId),
  };
});

const allRooms = () => [...demoRooms, ...liveRooms()];
const findRoom = (roomId) => allRooms().find((room) => room.id === roomId);
const latestMessage = (room) => room.messages
  .filter((message) => message.kind !== 'system')
  .slice(-1)[0]
  || room.messages.slice(-1)[0];
const scrollMessages = () => {
  const messages = conversation.querySelector('.conversation-messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
};

const renderList = () => {
  const rooms = allRooms();
  const query = search.value.trim().toLowerCase();
  const visible = rooms.filter((room) => (
    `${room.name} ${room.meta}`.toLowerCase().includes(query)
  ));

  const getLastMessageTime = (room) => {
    const last = latestMessage(room);
    return last?.createdAt || last?.time || 0;
  };

  visible.sort((a, b) => {
    if (a.isLive !== b.isLive) {
      return b.isLive ? 1 : -1;
    }
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    return getLastMessageTime(b) - getLastMessageTime(a);
  });

  count.textContent = `${rooms.length} phòng`;
  list.innerHTML = visible.map((room) => {
    const last = latestMessage(room);
    const preview = last
      ? truncateEnd(`${last.senderId === 'self' ? 'Bạn' : last.senderName || ''}: ${last.text}`)
      : 'Chưa có tin nhắn';
    const unreadClass = room.unreadCount ? 'unread' : '';
    const activeClass = room.id === selectedRoomId ? 'active' : '';
    const lastTime = last?.time || formatTime(last?.createdAt) || 'Mới mở';
    const unread = room.unreadCount
      ? `<span class="thread-unread">${room.unreadCount}</span>`
      : '';

    return `<button class="chat-thread ${unreadClass} ${activeClass}" type="button"
      data-room-id="${escapeHtml(room.id)}">
      <span class="thread-avatar" style="background:${escapeHtml(room.tone)}">
        ${escapeHtml(room.initials)}
      </span>
      <span class="thread-copy">
        <span class="thread-top">
          <strong>${escapeHtml(room.name)}</strong>
          <time>${escapeHtml(lastTime)}</time>
        </span>
        <span class="thread-preview">${escapeHtml(preview)}</span>
        <span class="thread-status">${escapeHtml(room.tag)}</span>
      </span>
      ${unread}
    </button>`;
  }).join('') || `<div class="empty-inbox">
    <span class="material-symbols-rounded">forum</span>
    <strong>Không tìm thấy cuộc trò chuyện</strong>
    <p>Thử tìm bằng tên kèo hoặc địa điểm khác.</p>
  </div>`;
};

const renderConversation = () => {
  const room = findRoom(selectedRoomId);
  if (!room) {
    conversation.innerHTML = `<div class="conversation-empty"><div>
      <span class="material-symbols-rounded">forum</span>
      <strong>Chọn một phòng chat</strong>
      <p>Chọn một kênh bên trái để xem đội đang bàn bạc về lịch ra sân.</p>
    </div></div>`;
    return;
  }

  const messages = room.messages || [];
  const typingMember = [...messages].reverse().find((message) => (
    message.kind !== 'system' && message.senderId !== 'self'
  )) || {};
  const typingMarkup = typingRoomCounts.has(room.id)
    ? `<div class="conversation-typing" role="status" aria-live="polite">
        <span class="typing-avatar" style="background:${escapeHtml(
          typingMember.senderTone || '#6680ba'
        )}">${escapeHtml(
          typingMember.senderInitials || roomInitials(typingMember.senderName)
        )}</span>
        <div class="typing-copy">
          <span class="typing-name">${escapeHtml(
            typingMember.senderName || 'Thành viên'
          )} đang nhập</span>
          <span class="typing-bubble" aria-label="Đang nhập">
            <i></i><i></i><i></i>
          </span>
        </div>
      </div>`
    : '';
  const messageMarkup = messages.map((message) => {
    if (message.kind === 'system') {
      return `<div class="conversation-system">${escapeHtml(message.text)}</div>`;
    }

    const selfClass = message.senderId === 'self' ? 'self' : '';
    const sender = message.senderId === 'self'
      ? 'Bạn'
      : message.senderName || 'Thành viên';
    const initials = message.senderInitials || roomInitials(message.senderName);
    const tone = message.senderTone || '#6680ba';
    const time = formatTime(message.time || message.createdAt);

    return `<article class="conversation-row ${selfClass}">
      <span class="message-avatar" style="background:${escapeHtml(tone)}">
        ${escapeHtml(initials)}
      </span>
      <div class="message-copy">
        <span class="message-sender">${escapeHtml(sender)}</span>
        <div class="message-bubble">${escapeHtml(message.text)}</div>
        <small class="message-time">${escapeHtml(time)}</small>
      </div>
    </article>`;
  }).join('');
  const liveLabel = room.isLive ? 'phòng của bạn' : 'kênh mẫu MatchUp';

  conversation.innerHTML = `<div class="conversation-head">
    <div class="conversation-title">
      <span class="conversation-avatar" style="background:${escapeHtml(room.tone)}">
        ${escapeHtml(room.initials)}
      </span>
      <div class="conversation-title-copy">
        <strong>${escapeHtml(room.name)}</strong>
        <span>${escapeHtml(room.members)} · ${liveLabel}</span>
      </div>
    </div>
    <span class="conversation-online"><i></i>Đang hoạt động</span>
  </div>
  <div class="conversation-pin">
    <span class="material-symbols-rounded">push_pin</span>
    <div class="conversation-pin-copy">
      <strong>${escapeHtml(room.meta)}</strong>
      <span>Trao đổi để chốt sân, giờ đến và chia phí minh bạch</span>
    </div>
    <span class="conversation-pin-tag">${escapeHtml(room.tag)}</span>
  </div>
  <div class="conversation-messages">${messageMarkup}${typingMarkup}</div>
  <div class="conversation-compose">
    <div class="quick-replies">
      <button type="button" data-message-quick="Mình sẽ đến sớm 10 phút nhé">
        Đến sớm 10 phút
      </button>
      <button type="button" data-message-quick="Mình xác nhận tham gia kèo nhé!">
        Xác nhận tham gia
      </button>
      <button type="button" data-message-quick="Sân mình chốt ở đâu vậy mọi người?">
        Hỏi địa điểm
      </button>
    </div>
    <form class="conversation-form" data-message-form>
      <label class="sr-only" for="conversation-input">Viết tin nhắn</label>
      <input id="conversation-input" maxlength="500" autocomplete="off"
        placeholder="Nhắn cho đội của bạn…" />
      <button class="conversation-send" type="submit" aria-label="Gửi tin nhắn">
        <span class="material-symbols-rounded">send</span>
      </button>
    </form>
  </div>`;
  scrollMessages();
};

const render = () => {
  renderList();
  renderConversation();
  startPendingGreeting(findRoom(selectedRoomId));
};

const sendMessage = (text, options = {}) => {
  const clean = String(text || '').trim().slice(0, 500);
  const room = findRoom(selectedRoomId);
  const shouldAutoReply = options.autoReply === true
    && Boolean(store.getChatAutoReply(clean));

  if (!clean || !room) return;
  if (room.isLive) store.sendChatMessage(room.matchId, clean);
  else {
    room.messages.push(demoMessage(
      'Ngọc Anh',
      'NA',
      '#d78c68',
      clean,
      new Date(),
      'self',
    ));
  }
  room.unreadCount = 0;
  render();

  if (shouldAutoReply) {
    window.setTimeout(() => {
      changeTyping(room.id, 1);
      render();
      window.setTimeout(() => {
        changeTyping(room.id, -1);
        if (room.isLive) store.sendChatAutoReply(room.matchId, clean);
        else {
          const reply = store.getChatAutoReply(clean);
          if (reply) room.messages.push(demoMessage(
            reply.senderName,
            reply.senderInitials,
            reply.senderTone,
            reply.text,
            new Date(),
          ));
        }
        render();
      }, 1000);
    }, 1000);
  }
};

list.addEventListener('click', (event) => {
  const thread = event.target.closest('[data-room-id]');
  if (!thread) return;
  selectedRoomId = thread.dataset.roomId;
  const room = findRoom(selectedRoomId);
  if (room) room.unreadCount = 0;
  render();
});

conversation.addEventListener('click', (event) => {
  const quick = event.target.closest('[data-message-quick]');
  if (quick) sendMessage(quick.dataset.messageQuick, { autoReply: true });
});

conversation.addEventListener('submit', (event) => {
  if (!event.target.matches('[data-message-form]')) return;
  event.preventDefault();
  sendMessage(event.target.querySelector('input').value);
});

search.addEventListener('input', renderList);
document.addEventListener('matchup:state-change', render);
render();
