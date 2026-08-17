import {
  daySlots,
  distances,
  levels,
  memberSets,
  playerPool,
  sportCatalog,
  timeCatalog
} from './constants.js';
import { slotMinutes } from './utils.js';

export function createMatch({
  sport,
  detail,
  sportIndex,
  time,
  timeIndex,
  slot,
  slotIndex,
  venueIndex,
  level,
  levelIndex,
  dateKey
}) {
  return {
    id: `${sport}-${time.key}-${slotIndex}-${levelIndex}${dateKey ? `-${dateKey}` : ''}`,
    sport,
    emoji: detail.emoji,
    name: `${detail.teams[venueIndex]} · ${time.label}`,
    format: detail.format,
    venue: detail.venues[venueIndex],
    area: detail.areas[venueIndex],
    address: detail.addresses[venueIndex],
    time: `${slot}, ${time.label}`,
    timeKey: time.key,
    dateKey: dateKey || '',
    startMinutes: slotMinutes(slot),
    timeOrder: timeIndex * 1440 + slotMinutes(slot),
    distance: distances[venueIndex],
    level,
    score: 96 - ((slotIndex * 2 + levelIndex + sportIndex + timeIndex) % 12),
    members: memberSets[(venueIndex + timeIndex + levelIndex) % memberSets.length],
    fee: detail.fees[venueIndex]
  };
}

export function buildMatchesForDays(days) {
  return Object.entries(sportCatalog).flatMap(([sport, detail], sportIndex) => (
    days.flatMap((time, timeIndex) => (
      time.slots.flatMap((slot, slotIndex) => (
        levels.map((level, levelIndex) => createMatch({
          sport,
          detail,
          sportIndex,
          time,
          timeIndex,
          slot,
          slotIndex,
          venueIndex: slotIndex % detail.venues.length,
          level,
          levelIndex,
          dateKey: time.dateKey
        }))
      ))
    ))
  ));
}

export function decorateMatches(items) {
  items.forEach((match, index) => {
    const [joined, capacity] = match.members;
    match.capacity = capacity;
    match.available = capacity - joined;
    match.share = Math.ceil(match.fee / capacity / 1000) * 1000;
    match.deposit = Math.ceil(match.share / 2 / 1000) * 1000;
    const autoApprove = index % 2 === 0;
    match.joinRules = {
      requirePaymentBeforeJoin: autoApprove,
      autoApprove,
      criteria: {
        levelMatch: false,
        minRating: 0,
        minCompletedMatches: 0
      }
    };
    match.demoHostApproval = !autoApprove;
    match.paymentMethod = match.joinRules.requirePaymentBeforeJoin
      ? 'Thanh toán qua Ví MatchUp'
      : index % 2 === 0
        ? 'Thanh toán qua Ví MatchUp'
        : 'Thanh toán cho chủ kèo sau khi được duyệt';
    match.participants = Array.from({ length: joined }, (_, playerIndex) => {
      const player = playerPool[(index + playerIndex) % playerPool.length];
      const paid = playerIndex === 0 || (playerIndex + index) % 3 !== 0;
      return { ...player, payment: paid ? 'Đã thanh toán' : 'Chờ thanh toán' };
    });
  });
}

export const matches = buildMatchesForDays(timeCatalog);

export function customMatchesForDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  const label = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric'
  }).format(date).replace(/^./, character => character.toUpperCase());
  const generated = buildMatchesForDays([{ key: 'custom', label, slots: daySlots, dateKey }]);
  decorateMatches(generated);
  return generated;
}

decorateMatches(matches);
