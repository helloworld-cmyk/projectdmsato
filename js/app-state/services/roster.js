import { initials, stableSubjectId, subjectKey } from "../core/utils.js";

export const normaliseMatchPlayer = (player) => {
  if (!player || typeof player !== "object") return null;
  const name = String(player.name || "").trim();
  if (!name) return null;
  return {
    ...player,
    id: player.id || stableSubjectId("player", name),
    initials: player.initials || initials(name),
    payment: player.payment || (player.paid ? "Đã thanh toán" : "Chờ thanh toán"),
    tone: player.tone || "#6680ba",
  };
};

export const addSelfToRoster = (match, profile, options = {}) => {
  if (!match || !profile) return { participants: [], player: null, added: false };
  const participants = Array.isArray(match.participants) ? match.participants : [];
  const existing = participants.find((item) => (
    subjectKey(item.name) === subjectKey(profile.name)
  ));
  if (existing) {
    if (options.paid) {
      existing.paid = true;
      existing.payment = "Đã thanh toán";
      existing.role = "Đã vào kèo · Đã thanh toán";
    }
    if (options.joinStatus) existing.joinStatus = options.joinStatus;
    return { participants, player: existing, added: false };
  }
  const paid = Boolean(options.paid);
  const player = normaliseMatchPlayer({
    name: profile.name,
    initials: profile.initials,
    role: options.role || (paid ? "Đã vào kèo · Đã thanh toán" : "Đã vào kèo"),
    tone: "#d78c68",
    paid,
    payment: paid ? "Đã thanh toán" : "Chờ thanh toán",
    joinStatus: options.joinStatus || "approved",
  });
  if (!player) return { participants, player: null, added: false };
  const next = [...participants, player];
  match.participants = next;
  const capacity = Math.max(2, Number(match.capacity) || next.length);
  match.joined = next.length;
  match.available = Math.max(0, capacity - next.length);
  return { participants: next, player, added: true };
};