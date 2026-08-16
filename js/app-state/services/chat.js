export const createChatService = ({ state, now, id, clone, save }) => {
  const chatApplication = (matchId) => state.applications.find((application) => (
    application.matchId === matchId
    && ["accepted", "paid"].includes(application.status)
  )) || null;
  const hostForMatch = (match) => {
    const participants = Array.isArray(match && match.participants) ? match.participants : [];
    return participants.find((player) => player.role === "Chủ kèo")
      || participants[0]
      || { name: "Chủ kèo MatchUp", initials: "MU", tone: "#6680ba" };
  };
  const chatAutoReplyText = (text) => {
    const cleanText = String(text || "").trim();
    if (cleanText === "Mình sẽ đến sớm 10 phút nhé") {
      return "Ok bạn nhé, đội sẽ đợi bạn khởi động cùng mọi người.";
    }
    if (cleanText === "Mình xác nhận tham gia kèo nhé!") {
      return "Đã ghi nhận bạn tham gia rồi nhé! Hẹn gặp bạn tại sân.";
    }
    if (
      cleanText === "Sân mình chốt ở đâu vậy mọi người?"
      || cleanText === "Mình đã sẵn sàng rồi!"
    ) return "Mình đã ghim thông tin sân ở phía trên rồi nhé, hẹn bạn ở đó!";
    return "";
  };
  const createChatAutoReply = (match, text) => {
    const replyText = chatAutoReplyText(text);
    if (!replyText) return null;
    const host = match
      ? hostForMatch(match)
      : { name: "Minh Khang", initials: "MK", tone: "#6680ba" };
    const sender = host.name === state.profile.name
      ? { name: "Minh Khang", initials: "MK", tone: "#6680ba" }
      : host;
    return {
      id: id("message"),
      kind: "text",
      senderId: "member",
      senderName: sender.name,
      senderInitials: sender.initials,
      senderTone: sender.tone,
      text: replyText,
      createdAt: now(),
    };
  };
  const ensureChatRoom = (matchId, match) => {
    if (!matchId || !match) return null;
    const application = state.applications.find((item) => (
      item.matchId === matchId
      && !["declined", "cancelled"].includes(item.status)
    ));
    const isPending = application && application.status === "pending";
    if (!state.chatRooms[matchId]) {
      state.chatRooms[matchId] = {
        id: `chat-${matchId}`,
        matchId,
        createdAt: now(),
        unreadCount: 1,
        messages: [
          {
            id: id("message"),
            kind: "system",
            text: isPending
              ? "Phòng chat của kèo đã mở sau khi bạn gửi yêu cầu vào đội."
              : "Phòng chat riêng đã mở sau khi chủ kèo duyệt bạn vào đội.",
            createdAt: now(),
          },
        ],
        greetingPending: true,
      };
    } else if (isPending) {
      const systemMessage = state.chatRooms[matchId].messages
        && state.chatRooms[matchId].messages.find((message) => message.kind === "system");
      if (
        systemMessage
        && systemMessage.text === "Phòng chat riêng đã mở sau khi chủ kèo duyệt bạn vào đội."
      ) {
        systemMessage.text = "Phòng chat của kèo đã mở sau khi bạn gửi yêu cầu vào đội.";
      }
      const greeting = state.chatRooms[matchId].messages
        && state.chatRooms[matchId].messages.find(
          (message) => message.kind === "text" && message.senderId === "host",
        );
      if (
        greeting
        && greeting.text === "Chào mừng bạn vào kèo! Mình chốt sân và giờ ở đây nhé."
      ) greeting.text = "Chào bạn! Mình chốt sân và giờ ở đây nhé.";
    }
    return state.chatRooms[matchId];
  };
  const sendChatAutoReply = (matchId, text) => {
    const application = chatApplication(matchId);
    const reply = application ? createChatAutoReply(application.match, text) : null;
    if (!reply) return null;
    const room = ensureChatRoom(matchId, application.match);
    room.messages.push(reply);
    room.messages = room.messages.slice(-100);
    save("chat-auto-reply");
    return clone(reply);
  };
  const hasPendingChatGreeting = (matchId) => Boolean(
    state.chatRooms[matchId] && state.chatRooms[matchId].greetingPending,
  );
  const sendChatGreeting = (matchId) => {
    const application = chatApplication(matchId);
    const room = application ? ensureChatRoom(matchId, application.match) : null;
    if (!application || !room || !room.greetingPending) return null;
    const host = hostForMatch(application.match);
    const hostIsCurrentUser = host.name === state.profile.name;
    const sender = hostIsCurrentUser
      ? { name: "Minh Khang", initials: "MK", tone: "#6680ba" }
      : host;
    const message = {
      id: id("message"),
      kind: "text",
      senderId: "host",
      senderName: sender.name,
      senderInitials: sender.initials,
      senderTone: sender.tone,
      text: application.status === "pending"
        ? "Chào bạn! Mình chốt sân và giờ ở đây nhé."
        : "Chào mừng bạn vào kèo! Mình chốt sân và giờ ở đây nhé.",
      createdAt: now(),
    };
    room.messages.push(message);
    room.greetingPending = false;
    save("chat-greeting");
    return clone(message);
  };

  return {
    chatApplication,
    hostForMatch,
    chatAutoReplyText,
    createChatAutoReply,
    ensureChatRoom,
    sendChatAutoReply,
    hasPendingChatGreeting,
    sendChatGreeting,
  };
};
