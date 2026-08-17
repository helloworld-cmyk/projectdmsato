export const now = () => Date.now();
export const id = (prefix) => (
  `${prefix}-${now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
);
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const initials = (name) => String(name || "Ngọc Anh")
  .trim()
  .split(/\s+/)
  .slice(-2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();
export const integer = (value) => Math.max(0, Math.floor(Number(value) || 0));
export const amount = (value) => Math.max(0, Math.round(Number(value) || 0));
export const matchCurrentShare = (match, participantCount) => {
  const fee = Number(match && match.fee) || 0;
  const count = Math.max(1, integer(participantCount));
  return Math.floor(fee / count);
};
export const subjectKey = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "unknown";
export const stableSubjectId = (type, value) => `${type}-${subjectKey(value)}`;
export const subjectId = (type, value) => {
  if (value && typeof value === "object") {
    return String(
      value.id
      || value[`${type}Id`]
      || stableSubjectId(type, value.name || value.court || value.label),
    );
  }
  const raw = String(value || "");
  if (raw === "self") return "self";
  if (/^(?:court|player)-/.test(raw) || /^[a-z]+-\d+$/.test(raw)) return raw;
  return raw.startsWith(`${type}-`) ? raw : stableSubjectId(type, raw);
};
export const emptyPlayer = (player) => (
  !player
  || player.empty
  || !String(player.name || "").trim()
  || /^(còn|trống|empty|slot)/i.test(String(player.name || "").trim())
);
export const normalisePlayer = (player) => {
  if (!player || typeof player !== "object") return null;
  const name = String(player.name || "").trim();
  if (!name) return null;
  return {
    ...player,
    id: player.id || stableSubjectId("player", name),
    initials: player.initials || initials(name),
  };
};
export const normalisePlayers = (players) => (
  (Array.isArray(players) ? players : []).map(normalisePlayer).filter(Boolean)
);
export const negativeTags = new Set([
  "Sân xuống cấp", "Vệ sinh chưa tốt", "Dịch vụ chưa ổn", "Không đến",
  "Thanh toán trễ/quỵt", "Sai trình độ", "Trễ giờ",
]);
export const positiveTags = new Set([
  "Sân tốt", "Vệ sinh tốt", "Dịch vụ ổn", "Đúng giờ",
  "Thanh toán đúng hẹn", "Đúng trình độ", "Thân thiện",
]);
