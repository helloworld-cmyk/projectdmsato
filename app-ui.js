/* Shared header behaviour: profile links and a lightweight notification centre. */
(() => {
  const store = window.MatchUpStore;
  if (!store) return;
  const escape = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const relativeTime = (time) => {
    const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return "vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
    return `${Math.floor(minutes / 1440)} ngày trước`;
  };
  const style = document.createElement("style");
  style.textContent = ".matchup-notice{position:fixed;z-index:90;top:74px;right:max(18px,calc((100vw - 1380px)/2));width:min(365px,calc(100vw - 32px));padding:13px;border:1px solid #e5ebe5;border-radius:16px;background:#fff;box-shadow:0 18px 48px rgba(24,37,31,.18);display:none}.matchup-notice.show{display:block}.matchup-notice-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.matchup-notice h2{margin:0;color:#18251f;font:800 15px 'Plus Jakarta Sans',sans-serif}.matchup-notice button{border:0;background:transparent;color:#1e7049;font:800 11px 'DM Sans',sans-serif;cursor:pointer}.matchup-notice-list{display:grid;gap:4px;margin-top:9px;max-height:330px;overflow:auto}.matchup-notice-item{padding:10px;border-radius:10px;background:#f7f9f6}.matchup-notice-item.unread{background:#eff9ef}.matchup-notice-item strong{display:block;color:#24342b;font-size:11px}.matchup-notice-item span{display:block;margin-top:3px;color:#6d7a72;font-size:10px;line-height:1.35}.matchup-notice-item small{display:block;margin-top:4px;color:#90a096;font-size:9px;font-weight:700}.matchup-profile-link{cursor:pointer}.matchup-profile-link:hover{opacity:.82}@media(max-width:760px){.matchup-notice{top:14px;right:16px}}";
  style.textContent += ".matchup-chat-layer{position:fixed;z-index:120;inset:0;display:grid;place-items:center;padding:18px;background:rgba(18,36,26,.46);opacity:0;visibility:hidden;transition:.2s}.matchup-chat-layer.show{opacity:1;visibility:visible}.matchup-chat{width:min(560px,100%);height:min(720px,calc(100vh - 36px));display:flex;flex-direction:column;overflow:hidden;border:1px solid #dce9de;border-radius:22px;background:#fff;box-shadow:0 24px 70px rgba(15,34,23,.27);transform:translateY(12px);transition:.2s}.matchup-chat-layer.show .matchup-chat{transform:translateY(0)}.matchup-chat-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 18px;color:#fff;background:#18392a}.matchup-chat-title{display:flex;align-items:center;gap:10px;min-width:0}.matchup-chat-mark{width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;color:#18392a;background:#ccf645}.matchup-chat-mark .material-symbols-rounded{font-size:21px}.matchup-chat h2{margin:0;overflow:hidden;font:800 15px 'Plus Jakarta Sans',sans-serif;text-overflow:ellipsis;white-space:nowrap}.matchup-chat-head p{margin:3px 0 0;overflow:hidden;color:#c5d8ca;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.matchup-chat-close{width:31px;height:31px;display:grid;place-items:center;flex:0 0 auto;border:1px solid rgba(255,255,255,.2);border-radius:9px;color:#fff;background:rgba(255,255,255,.08)}.matchup-chat-pin{display:flex;align-items:center;gap:9px;padding:10px 14px;border-bottom:1px solid #e7efe8;color:#426450;background:#f4fbf4;font-size:10px}.matchup-chat-pin .material-symbols-rounded{font-size:17px;color:#1e7049}.matchup-chat-pin-copy{min-width:0;flex:1}.matchup-chat-pin strong,.matchup-chat-pin span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.matchup-chat-pin span{margin-top:2px;color:#708278;font-size:9px}.matchup-chat-copy{padding:6px 8px;border:0;border-radius:7px;color:#1e7049;background:transparent;font-size:9px;font-weight:800;white-space:nowrap}.matchup-chat-copy:hover{background:#e3f2e5}.matchup-chat-messages{display:flex;flex:1;flex-direction:column;gap:9px;padding:16px 15px;overflow:auto;background:#fbfdfb}.matchup-chat-system{align-self:center;max-width:88%;padding:7px 10px;border-radius:999px;color:#789083;background:#edf4ee;font-size:9px;font-weight:700;text-align:center}.matchup-chat-row{display:flex;align-items:flex-end;gap:7px;max-width:86%}.matchup-chat-row.self{align-self:flex-end;flex-direction:row-reverse}.matchup-chat-avatar{width:27px;height:27px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;color:#fff;font-size:8px;font-weight:800}.matchup-chat-bubble-wrap{min-width:0}.matchup-chat-sender{display:block;margin:0 0 3px 3px;color:#7b8b82;font-size:9px;font-weight:800}.matchup-chat-row.self .matchup-chat-sender{margin:0 3px 3px 0;text-align:right}.matchup-chat-bubble{padding:9px 11px;border-radius:13px 13px 13px 4px;color:#31463a;background:#fff;box-shadow:0 2px 9px rgba(27,61,39,.06);font-size:11px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}.matchup-chat-row.self .matchup-chat-bubble{border-radius:13px 13px 4px 13px;color:#173c2c;background:#dff5b2}.matchup-chat-time{display:block;margin:4px 3px 0;color:#a0ada4;font-size:8px}.matchup-chat-row.self .matchup-chat-time{text-align:right}.matchup-chat-composer{padding:10px 12px 12px;border-top:1px solid #e7efe8;background:#fff}.matchup-chat-quick{display:flex;gap:6px;margin-bottom:9px;overflow:auto}.matchup-chat-quick button{padding:6px 8px;border:1px solid #dceade;border-radius:999px;color:#38694d;background:#f7fbf7;font-size:9px;font-weight:800;white-space:nowrap}.matchup-chat-quick button:hover{border-color:#b8ddbf;background:#eff9ef}.matchup-chat-form{display:flex;align-items:center;gap:7px}.matchup-chat-form input{width:100%;min-width:0;padding:10px 12px;border:1px solid #dce7dd;border-radius:12px;outline:0;color:#263e30;background:#fbfdfb;font-size:11px}.matchup-chat-form input:focus{border-color:#8dc69b;box-shadow:0 0 0 3px rgba(141,198,155,.16)}.matchup-chat-send{width:38px;height:38px;display:grid;place-items:center;flex:0 0 auto;border:0;border-radius:11px;color:#173c2c;background:#ccf645}.matchup-chat-send .material-symbols-rounded{font-size:19px}@media(max-width:560px){.matchup-chat-layer{padding:0}.matchup-chat{width:100%;height:100%;border:0;border-radius:0}.matchup-chat-head{padding-top:calc(14px + env(safe-area-inset-top))}.matchup-chat-messages{padding-bottom:12px}}";
  style.textContent += ".matchup-chat-close{padding:0;line-height:0}.matchup-chat-close>.material-symbols-rounded{width:24px;height:24px;min-width:0;overflow:hidden;display:grid;place-items:center;line-height:1;text-align:center}";
  document.head.appendChild(style);

  const popover = document.createElement("aside");
  popover.className = "matchup-notice";
  popover.setAttribute("aria-label", "Thông báo MatchUp");
  popover.innerHTML = '<div class="matchup-notice-head"><h2>Thông báo</h2><button type="button" data-mark-read>Đánh dấu đã đọc</button></div><div class="matchup-notice-list"></div>';
  document.body.appendChild(popover);

  const chatLayer = document.createElement("div");
  chatLayer.className = "matchup-chat-layer";
  chatLayer.setAttribute("role", "dialog");
  chatLayer.setAttribute("aria-modal", "true");
  chatLayer.setAttribute("aria-label", "Phòng chat của kèo");
  chatLayer.innerHTML = '<section class="matchup-chat"><header class="matchup-chat-head"><div class="matchup-chat-title"><span class="matchup-chat-mark"><span class="material-symbols-rounded">forum</span></span><div><h2 data-chat-title>Phòng chat đội</h2><p data-chat-subtitle>Chỉ thành viên đã được duyệt</p></div></div><button class="matchup-chat-close" type="button" data-chat-close aria-label="Đóng phòng chat"><span class="material-symbols-rounded">close</span></button></header><div class="matchup-chat-pin"><span class="material-symbols-rounded">push_pin</span><div class="matchup-chat-pin-copy"><strong data-chat-match-name>Thông tin kèo</strong><span data-chat-match-meta></span></div><button type="button" class="matchup-chat-copy" data-chat-copy>Sao chép</button></div><div class="matchup-chat-messages" data-chat-messages></div><div class="matchup-chat-composer"><div class="matchup-chat-quick"><button type="button" data-chat-quick="Mình sẽ đến sớm 10 phút nhé">Đến sớm 10 phút</button><button type="button" data-chat-quick="Sân mình chốt ở đâu vậy mọi người?">Hỏi địa điểm</button><button type="button" data-chat-quick="Mình đã sẵn sàng rồi!">Đã sẵn sàng</button></div><form class="matchup-chat-form" data-chat-form><label class="sr-only" for="matchup-chat-input">Viết tin nhắn</label><input id="matchup-chat-input" maxlength="500" autocomplete="off" placeholder="Nhắn cho đội của bạn…" /><button class="matchup-chat-send" type="submit" aria-label="Gửi tin nhắn"><span class="material-symbols-rounded">send</span></button></form></div></section>';
  document.body.appendChild(chatLayer);

  let activeChatMatchId = null;
  const chatTime = (time) => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date(time));
  const closeChat = () => { activeChatMatchId = null; chatLayer.classList.remove("show"); };
  const renderChat = () => {
    if (!activeChatMatchId) return;
    const access = store.getChatAccess(activeChatMatchId);
    if (!access.allowed) { closeChat(); return; }
    const match = access.match || {};
    const messages = store.getChatMessages(activeChatMatchId);
    chatLayer.querySelector("[data-chat-title]").textContent = "Phòng chat đội";
    chatLayer.querySelector("[data-chat-subtitle]").textContent = `${Math.max(2, (match.participants || []).length)} thành viên · đã duyệt`;
    chatLayer.querySelector("[data-chat-match-name]").textContent = match.name || "Kèo MatchUp";
    chatLayer.querySelector("[data-chat-match-meta]").textContent = [match.time, match.venue, match.share ? `${store.money(match.share)}/người` : ""].filter(Boolean).join(" · ");
    const list = chatLayer.querySelector("[data-chat-messages]");
    list.innerHTML = messages.length ? messages.map((message) => {
      if (message.kind === "system") return `<div class="matchup-chat-system">${escape(message.text)}</div>`;
      const self = message.senderId === "self";
      return `<article class="matchup-chat-row ${self ? "self" : ""}"><span class="matchup-chat-avatar" style="background:${escape(message.senderTone || "#6680ba")}">${escape(message.senderInitials || "MU")}</span><div class="matchup-chat-bubble-wrap"><span class="matchup-chat-sender">${self ? "Bạn" : escape(message.senderName || "Thành viên")}</span><div class="matchup-chat-bubble">${escape(message.text)}</div><small class="matchup-chat-time">${chatTime(message.createdAt)}</small></div></article>`;
    }).join("") : '<div class="matchup-chat-system">Hãy là người đầu tiên chào cả đội.</div>';
    list.scrollTop = list.scrollHeight;
  };
  const openChat = (matchId) => {
    const access = store.getChatAccess(matchId);
    if (!access.allowed) return;
    activeChatMatchId = matchId;
    store.markChatRead(matchId);
    chatLayer.classList.add("show");
    renderChat();
    window.setTimeout(() => chatLayer.querySelector("#matchup-chat-input")?.focus(), 50);
  };
  window.MatchUpChat = { open: openChat, close: closeChat };
  document.addEventListener("click", (event) => {
    const chatButton = event.target.closest("[data-chat-match]");
    if (chatButton) { event.preventDefault(); openChat(chatButton.dataset.chatMatch); return; }
    if (event.target === chatLayer || event.target.closest("[data-chat-close]")) { closeChat(); return; }
    const quick = event.target.closest("[data-chat-quick]");
    if (quick && activeChatMatchId) {
      store.sendChatMessage(activeChatMatchId, quick.dataset.chatQuick);
      renderChat();
      return;
    }
    const copy = event.target.closest("[data-chat-copy]");
    if (copy && activeChatMatchId) {
      const match = store.getChatAccess(activeChatMatchId).match || {};
      const text = [match.name, match.time, match.venue].filter(Boolean).join(" · ");
      navigator.clipboard?.writeText(text).then(() => { copy.textContent = "Đã sao chép"; window.setTimeout(() => { copy.textContent = "Sao chép"; }, 1600); }).catch(() => {});
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
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && chatLayer.classList.contains("show")) closeChat(); });
  const render = () => {
    const notifications = store.getNotifications();
    const list = popover.querySelector(".matchup-notice-list");
    list.innerHTML = notifications.length ? notifications.map((notification) => `<article class="matchup-notice-item ${notification.read ? "" : "unread"}"><strong>${escape(notification.title)}</strong><span>${escape(notification.body)}</span><small>${relativeTime(notification.createdAt)}</small></article>`).join("") : '<p style="margin:12px 0;color:#68756d;font-size:12px">Bạn chưa có thông báo nào.</p>';
    const unread = notifications.filter((notification) => !notification.read).length;
    document.querySelectorAll("[data-notifications]").forEach((button) => {
      button.setAttribute("aria-label", unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo");
      button.classList.toggle("has-unread", unread > 0);
      const badge = button.querySelector(".badge, i");
      if (badge) badge.style.display = unread ? "" : "none";
    });
    const profile = store.getProfile();
    document.querySelectorAll(".avatar[data-profile], .profile .avatar").forEach((avatar) => { avatar.textContent = profile.initials; });
    document.querySelectorAll(".profile-copy").forEach((copy) => {
      const nameNode = [...copy.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      if (nameNode) nameNode.nodeValue = profile.name;
      const detail = copy.querySelector("span");
      if (detail) detail.textContent = `Trình độ ${profile.level}`;
    });
  };
  document.querySelectorAll("[data-notifications]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    popover.classList.toggle("show");
    if (popover.classList.contains("show")) store.markNotificationsRead();
    render();
  }));
  popover.querySelector("[data-mark-read]").addEventListener("click", () => { store.markNotificationsRead(); render(); });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-notifications]") && !event.target.closest(".matchup-notice")) popover.classList.remove("show");
  });
  document.querySelectorAll(".profile, .avatar[data-profile], [data-profile-link]").forEach((element) => {
    element.classList.add("matchup-profile-link");
    element.setAttribute("role", "link");
    element.tabIndex = 0;
    element.addEventListener("click", () => { location.href = "profile.html"; });
    element.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") location.href = "profile.html"; });
  });
  document.addEventListener("matchup:state-change", render);
  document.addEventListener("matchup:state-change", renderChat);
  render();
})();
