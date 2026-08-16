import "./app-state/index.js";
(() => {
  const store = window.MatchUpStore;
  if (!store) return;
  const escape = (value) => String(value || "").replace(
    /[&<>"']/g,
    (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]),
  );
  const relativeTime = (time) => {
    const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return "vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
    return `${Math.floor(minutes / 1440)} ngày trước`;
  };
  const popover = document.createElement("aside");
  popover.className = "matchup-notice";
  popover.setAttribute("aria-label", "Thông báo MatchUp");
  popover.innerHTML = `
    <div class="matchup-notice-head">
      <h2>Thông báo</h2>
      <button type="button" data-mark-read>Đánh dấu đã đọc</button>
    </div>
    <div class="matchup-notice-list"></div>
  `;
  document.body.appendChild(popover);

  const chatLayer = document.createElement("div");
  chatLayer.className = "matchup-chat-layer";
  chatLayer.setAttribute("role", "dialog");
  chatLayer.setAttribute("aria-modal", "true");
  chatLayer.setAttribute("aria-label", "Phòng chat của kèo");
  chatLayer.innerHTML = `
    <section class="matchup-chat">
      <header class="matchup-chat-head">
        <div class="matchup-chat-title">
          <span class="matchup-chat-mark">
            <span class="material-symbols-rounded">forum</span>
          </span>
          <div>
            <h2 data-chat-title>Phòng chat đội</h2>
            <p data-chat-subtitle>Chỉ thành viên đã được duyệt</p>
          </div>
        </div>
        <button
          class="matchup-chat-close"
          type="button"
          data-chat-close
          aria-label="Đóng phòng chat"
        >
          <span class="material-symbols-rounded">close</span>
        </button>
      </header>
      <div class="matchup-chat-pin">
        <span class="material-symbols-rounded">push_pin</span>
        <div class="matchup-chat-pin-copy">
          <strong data-chat-match-name>Thông tin kèo</strong>
          <span data-chat-match-meta></span>
        </div>
        <button type="button" class="matchup-chat-copy" data-chat-copy>
          Sao chép
        </button>
      </div>
      <div class="matchup-chat-messages" data-chat-messages></div>
      <div class="matchup-chat-composer">
        <div class="matchup-chat-quick">
          <button type="button" data-chat-quick="Mình sẽ đến sớm 10 phút nhé">
            Đến sớm 10 phút
          </button>
          <button type="button" data-chat-quick="Sân mình chốt ở đâu vậy mọi người?">
            Hỏi địa điểm
          </button>
          <button type="button" data-chat-quick="Mình đã sẵn sàng rồi!">
            Đã sẵn sàng
          </button>
        </div>
        <form class="matchup-chat-form" data-chat-form>
          <label class="sr-only" for="matchup-chat-input">
            Viết tin nhắn
          </label>
          <input
            id="matchup-chat-input"
            maxlength="500"
            autocomplete="off"
            placeholder="Nhắn cho đội của bạn…"
          />
          <button
            class="matchup-chat-send"
            type="submit"
            aria-label="Gửi tin nhắn"
          >
            <span class="material-symbols-rounded">send</span>
          </button>
        </form>
      </div>
    </section>
  `;
  document.body.appendChild(chatLayer);

  let activeChatMatchId = null;
  const typingMatchCounts = new Map();
  const changeTyping = (matchId, amount) => {
    const next = Math.max(0, (typingMatchCounts.get(matchId) || 0) + amount);
    if (next) typingMatchCounts.set(matchId, next);
    else typingMatchCounts.delete(matchId);
  };
  const greetingMatchIds = new Set();
  const startPendingChatGreeting = (matchId) => {
    if (!store.hasPendingChatGreeting(matchId) || greetingMatchIds.has(matchId)) return;
    greetingMatchIds.add(matchId);
    window.setTimeout(() => {
      changeTyping(matchId, 1);
      if (activeChatMatchId === matchId) renderChat();
      window.setTimeout(() => {
        changeTyping(matchId, -1);
        store.sendChatGreeting(matchId);
        greetingMatchIds.delete(matchId);
        if (activeChatMatchId === matchId) renderChat();
      }, 1000);
    }, 1000);
  };
  const chatTime = (time) => new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(time));
  const closeChat = () => {
    activeChatMatchId = null;
    chatLayer.classList.remove("show");
  };
  const renderChat = () => {
    if (!activeChatMatchId) return;
    const access = store.getChatAccess(activeChatMatchId);
    if (!access.allowed) {
      closeChat();
      return;
    }
    const match = access.match || {};
    const messages = store.getChatMessages(activeChatMatchId);
    chatLayer.querySelector("[data-chat-title]").textContent = "Phòng chat đội";
    const memberCount = Math.max(2, (match.participants || []).length);
    const approvalStatus = access.status === "pending"
      ? "đang chờ duyệt"
      : "đã duyệt";
    chatLayer.querySelector("[data-chat-subtitle]").textContent =
      `${memberCount} thành viên · ${approvalStatus}`;
    chatLayer.querySelector("[data-chat-match-name]").textContent = match.name || "Kèo MatchUp";
    const matchMeta = [
      match.time,
      match.venue,
      match.share ? `${store.money(match.share)}/người` : "",
    ].filter(Boolean).join(" · ");
    chatLayer.querySelector("[data-chat-match-meta]").textContent = matchMeta;
    const list = chatLayer.querySelector("[data-chat-messages]");
    const typingMessage = [...messages].reverse().find(
      (message) => message.kind !== "system" && message.senderId !== "self",
    );
    const participants = match.participants || [];
    const profileName = store.getProfile().name;
    const typingParticipant = participants.find(
      (player) => player.name !== profileName,
    ) || participants.find((player) => player.role === "Chủ kèo") || {};
    const typingMember = typingMessage
      ? {
        name: typingMessage.senderName,
        initials: typingMessage.senderInitials,
        tone: typingMessage.senderTone,
      }
      : {
        name: typingParticipant.name || "Minh Khang",
        initials: typingParticipant.initials || "MK",
        tone: typingParticipant.tone || "#6680ba",
      };
    const typingMarkup = typingMatchCounts.has(activeChatMatchId)
      ? `<div class="matchup-chat-typing" role="status" aria-live="polite">
          <span class="matchup-chat-typing-avatar"
            style="background:${escape(typingMember.tone || "#6680ba")}">
            ${escape(typingMember.initials || "MU")}
          </span>
          <div class="matchup-chat-typing-copy">
            <span class="matchup-chat-typing-name">
              ${escape(typingMember.name || "Thành viên")} đang nhập
            </span>
            <span class="matchup-chat-typing-bubble" aria-label="Đang nhập">
              <i></i><i></i><i></i>
            </span>
          </div>
        </div>`
      : "";
    const messageMarkup = messages.length ? messages.map((message) => {
      if (message.kind === "system") {
        return `<div class="matchup-chat-system">${escape(message.text)}</div>`;
      }
      const self = message.senderId === "self";
      return `<article class="matchup-chat-row ${self ? "self" : ""}">
        <span class="matchup-chat-avatar"
          style="background:${escape(message.senderTone || "#6680ba")}">
          ${escape(message.senderInitials || "MU")}
        </span>
        <div class="matchup-chat-bubble-wrap">
          <span class="matchup-chat-sender">
            ${self ? "Bạn" : escape(message.senderName || "Thành viên")}
          </span>
          <div class="matchup-chat-bubble">${escape(message.text)}</div>
          <small class="matchup-chat-time">${chatTime(message.createdAt)}</small>
        </div>
      </article>`;
    }).join("") :
      '<div class="matchup-chat-system">Hãy là người đầu tiên chào cả đội.</div>';
    list.innerHTML = `${messageMarkup}${typingMarkup}`;
    list.scrollTop = list.scrollHeight;
  };
  const openChat = (matchId) => {
    const access = store.getChatAccess(matchId);
    if (!access.allowed) return;
    activeChatMatchId = matchId;
    store.markChatRead(matchId);
    chatLayer.classList.add("show");
    renderChat();
    startPendingChatGreeting(matchId);
    window.setTimeout(() => chatLayer.querySelector("#matchup-chat-input")?.focus(), 50);
  };
  window.MatchUpChat = { open: openChat, close: closeChat };
  document.addEventListener("click", (event) => {
    const chatButton = event.target.closest("[data-chat-match]");
    if (chatButton) { event.preventDefault(); openChat(chatButton.dataset.chatMatch); return; }
    if (event.target === chatLayer || event.target.closest("[data-chat-close]")) {
      closeChat();
      return;
    }
    const quick = event.target.closest("[data-chat-quick]");
    if (quick && activeChatMatchId) {
      const matchId = activeChatMatchId;
      const text = quick.dataset.chatQuick;
      store.sendChatMessage(matchId, text);
      renderChat();
      window.setTimeout(() => {
        changeTyping(matchId, 1);
        if (activeChatMatchId === matchId) renderChat();
        window.setTimeout(() => {
          changeTyping(matchId, -1);
          store.sendChatAutoReply(matchId, text);
          if (activeChatMatchId === matchId) renderChat();
        }, 1000);
      }, 1000);
      return;
    }
    const copy = event.target.closest("[data-chat-copy]");
    if (copy && activeChatMatchId) {
      const match = store.getChatAccess(activeChatMatchId).match || {};
      const text = [match.name, match.time, match.venue].filter(Boolean).join(" · ");
      navigator.clipboard?.writeText(text).then(() => {
        copy.textContent = "Đã sao chép";
        window.setTimeout(() => {
          copy.textContent = "Sao chép";
        }, 1600);
      }).catch(() => {});
    }
  });
  chatLayer.querySelector("[data-chat-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = chatLayer.querySelector("#matchup-chat-input");
    if (!activeChatMatchId || !input.value.trim()) return;
    store.sendChatMessage(activeChatMatchId, input.value);
    input.value = "";
    renderChat();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chatLayer.classList.contains("show")) {
      closeChat();
    }
  });
  const render = () => {
    const notifications = store.getNotifications();
    const list = popover.querySelector(".matchup-notice-list");
    const notificationMarkup = notifications.length
      ? notifications.map((notification) => `
        <article class="matchup-notice-item ${notification.read ? "" : "unread"}">
          <strong>${escape(notification.title)}</strong>
          <span>${escape(notification.body)}</span>
          <small>${relativeTime(notification.createdAt)}</small>
        </article>
      `).join("")
      : '<p style="margin:12px 0;color:#68756d;font-size:12px">'
        + "Bạn chưa có thông báo nào.</p>";
    list.innerHTML = notificationMarkup;
    const unread = notifications.filter((notification) => !notification.read).length;
    document.querySelectorAll("[data-notifications]").forEach((button) => {
      const label = unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo";
      button.setAttribute("aria-label", label);
      button.classList.toggle("has-unread", unread > 0);
      const badge = button.querySelector(".badge, i");
      if (badge) badge.style.display = unread ? "" : "none";
    });
    const profile = store.getProfile();
    document.querySelectorAll(".avatar[data-profile], .profile .avatar").forEach(
      (avatar) => {
        avatar.textContent = profile.initials;
      },
    );
    document.querySelectorAll(".profile-copy").forEach((copy) => {
      const nameNode = [...copy.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (nameNode) nameNode.nodeValue = profile.name;
      const detail = copy.querySelector("span");
      if (detail) detail.textContent = `Trình độ ${profile.level}`;
    });
  };
  document.querySelectorAll("[data-notifications]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      popover.classList.toggle("show");
      if (popover.classList.contains("show")) store.markNotificationsRead();
      render();
    });
  });
  popover.querySelector("[data-mark-read]").addEventListener("click", () => {
    store.markNotificationsRead();
    render();
  });
  document.addEventListener("click", (event) => {
    const outsideNotifications = !event.target.closest("[data-notifications]");
    const outsidePopover = !event.target.closest(".matchup-notice");
    if (outsideNotifications && outsidePopover) popover.classList.remove("show");
  });
  const profilePath = document.documentElement.dataset.profilePath || "profile/";
  document.querySelectorAll(
    ".profile, .avatar[data-profile], [data-profile-link]",
  ).forEach((element) => {
    element.classList.add("matchup-profile-link");
    element.setAttribute("role", "link");
    element.tabIndex = 0;
    element.addEventListener("click", () => { location.href = profilePath; });
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") location.href = profilePath;
    });
  });
  document.addEventListener("matchup:state-change", render);
  document.addEventListener("matchup:state-change", renderChat);
  render();
})();
