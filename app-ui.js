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
  document.head.appendChild(style);

  const popover = document.createElement("aside");
  popover.className = "matchup-notice";
  popover.setAttribute("aria-label", "Thông báo MatchUp");
  popover.innerHTML = '<div class="matchup-notice-head"><h2>Thông báo</h2><button type="button" data-mark-read>Đánh dấu đã đọc</button></div><div class="matchup-notice-list"></div>';
  document.body.appendChild(popover);
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
  render();
})();
