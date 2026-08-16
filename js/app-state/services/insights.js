export const createMatchInsightService = ({ state, reputationFromReviews, hostForMatch }) => {
  const matchInsight = (match) => {
    const profile = state.profile;
    const levelMatch = match.level === profile.level;
    const sportMatch = Array.isArray(profile.sports) && profile.sports.includes(match.sport);
    const nearby = Number(match.distance) <= Number(profile.radius || 10);
    const startsLate = Number(String(match.time || "").match(/\d{1,2}/)?.[0] || 0) >= 17;
    const eveningPreference = String(profile.availability || "").toLowerCase().includes("tối");
    const timeMatch = eveningPreference ? startsLate : true;
    const reasons = [];
    if (levelMatch) reasons.push(`Cùng trình độ ${profile.level}`);
    if (nearby) reasons.push(`Cách bạn ${Number(match.distance).toFixed(1).replace(".", ",")} km`);
    if (timeMatch) reasons.push("Đúng khung giờ bạn thường rảnh");
    if (sportMatch) reasons.push("Đúng môn bạn yêu thích");
    if (Number(match.available) === 1) reasons.push("Cần thêm đúng 1 người");
    if (!reasons.length) reasons.push("Đang được xếp theo sở thích của bạn");
    const baseScore = Number(match.score) || 78;
    const scoreBoost = (levelMatch ? 2 : 0) + (sportMatch ? 1 : 0);
    const score = Math.min(99, Math.max(60, Math.round((baseScore + scoreBoost) / 1)));
    const host = hostForMatch(match);
    const hostName = match.creatorName || host.name || "Chủ kèo MatchUp";
    const hostReputation = reputationFromReviews("player", { id: host.id, name: hostName }, {});
    return {
      score,
      reasons: reasons.slice(0, 4),
      host: {
        name: hostName,
        reliability: hostReputation.hasData
          ? Math.round(hostReputation.rating / 5 * 100)
          : 98,
        matches: hostReputation.hasData ? hostReputation.reviews : 24,
        reputation: hostReputation,
      },
      vibe: match.vibe || (
        match.format && match.format.toLowerCase().includes("giao")
          ? "Giao lưu, thân thiện"
          : "Cân bằng và vui vẻ"
      ),
    };
  };

  return { matchInsight };
};
