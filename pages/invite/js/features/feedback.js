import { profile, state, store } from '../core/state.js';
import { $ } from '../core/dom.js';
import { safe } from '../core/utils.js';
import { showToast } from '../core/toast.js';
import { renderAll } from '../render/index.js';

const courtTagOptions = [
  'Sân tốt',
  'Vệ sinh tốt',
  'Dịch vụ ổn',
  'Sân xuống cấp',
  'Vệ sinh chưa tốt',
  'Dịch vụ chưa ổn'
];
const playerTagOptions = [
  'Đúng giờ',
  'Thanh toán đúng hẹn',
  'Đúng trình độ',
  'Thân thiện',
  'Không đến',
  'Thanh toán trễ/quỵt',
  'Sai trình độ',
  'Trễ giờ'
];
const feedbackModal = $('#feedback-modal');

export function reviewablePlayers() {
  return state.splitPlayers.filter(player => {
    if (player.empty || !String(player.name || '').trim()) return false;
    const playerId = player.id || store.getSubjectId('player', player.name);
    return playerId !== store.getSubjectId('player', profile.name)
      && player.name !== profile.name;
  });
}

function starsMarkup(value, attribute) {
  return [1, 2, 3, 4, 5].map(number => (
    `<button type="button" class="rating-star ${number <= value ? 'active' : ''}"
      data-${attribute}="${number}">★</button>`
  )).join('');
}

export function renderReputationForm() {
  $('#court-rating-row').innerHTML = starsMarkup(state.courtRating, 'court-rating');
  $('#court-feedback-tags').innerHTML = courtTagOptions.map(tag => {
    const safeTag = safe(tag);
    const active = state.courtTags.has(tag) ? 'active' : '';
    const risk = tag.startsWith('Sân') || tag.startsWith('Vệ')
      || tag.startsWith('Dịch') ? '' : ' reputation-risk';
    return `<button type="button" class="feedback-tag ${active}${risk}"
      data-court-tag="${safeTag}">${safeTag}</button>`;
  }).join('');

  const players = reviewablePlayers();
  $('#player-feedback-list').innerHTML = players.length
    ? players.map(renderPlayerFeedback).join('')
    : '<div class="reputation-empty">Chưa có người chơi khác đủ điều '
      + 'kiện để đánh giá.</div>';
}

function renderPlayerFeedback(player) {
  const playerId = player.id || store.getSubjectId('player', player.name);
  if (!state.playerRatings[playerId]) state.playerRatings[playerId] = 5;
  if (!state.playerTags[playerId]) state.playerTags[playerId] = new Set();
  const tags = playerTagOptions.map(tag => {
    const active = state.playerTags[playerId].has(tag) ? 'active' : '';
    const risk = [
      'Không đến',
      'Thanh toán trễ/quỵt',
      'Sai trình độ',
      'Trễ giờ'
    ].includes(tag) ? ' reputation-risk' : '';
    return `<button type="button" class="feedback-tag ${active}${risk}"
      data-player-id="${safe(playerId)}" data-player-tag="${safe(tag)}">
      ${safe(tag)}
    </button>`;
  }).join('');
  return `<article class="reputation-player">
    <div class="reputation-player-head">
      <span class="reputation-player-avatar">${safe(player.initials || '')}</span>
      <strong>${safe(player.name)}</strong>
    </div>
    <div class="reputation-rating" data-player-rating-row="${safe(playerId)}">
      ${starsMarkup(state.playerRatings[playerId], 'player-rating')}
    </div>
    <div class="reputation-tags">${tags}</div>
  </article>`;
}

export function openFeedback() {
  if (!state.booking) return;
  if (!store.canSubmitReputationReview('booking', state.booking.id)) {
    showToast('Lịch này đã được đánh giá.');
    return;
  }
  renderReputationForm();
  feedbackModal.classList.add('show');
}

export function closeFeedback() {
  feedbackModal.classList.remove('show');
}

function submitFeedback() {
  if (!state.booking) return;
  if (!store.canSubmitReputationReview('booking', state.booking.id)) {
    showToast('Trận này đã được đánh giá hoặc chưa hoàn tất.');
    closeFeedback();
    renderAll();
    return;
  }

  const players = reviewablePlayers().map(player => {
    const playerId = player.id || store.getSubjectId('player', player.name);
    return {
      id: playerId,
      name: player.name,
      initials: player.initials,
      rating: state.playerRatings[playerId] || 5,
      tags: state.playerTags[playerId] ? [...state.playerTags[playerId]] : []
    };
  });
  const review = store.submitReputationReview({
    type: 'booking',
    sourceId: state.booking.id,
    court: {
      id: state.booking.courtId,
      name: state.booking.court,
      rating: state.courtRating,
      tags: [...state.courtTags]
    },
    players
  });
  if (!review) {
    showToast('Không thể lưu đánh giá cho trận này.');
    return;
  }
  store.submitFeedback({
    type: 'booking',
    sourceId: state.booking.id,
    rating: state.feedbackRating,
    atmosphere: state.feedbackRating,
    tags: [
      ...new Set([
        'Đồng đội vui',
        ...state.courtTags,
        ...players.flatMap(player => player.tags)
      ])
    ],
    repeat: true
  });
  closeFeedback();
  renderAll();
  showToast('Đã lưu đánh giá sân và người chơi!');
}

export function initFeedbackEvents() {
  feedbackModal.addEventListener('click', event => {
    const courtStar = event.target.closest('[data-court-rating]');
    if (courtStar) {
      state.courtRating = Number(courtStar.dataset.courtRating);
      state.feedbackRating = state.courtRating;
      renderReputationForm();
      return;
    }

    const playerStar = event.target.closest('[data-player-rating]');
    if (playerStar) {
      const row = playerStar.closest('[data-player-rating-row]');
      if (row) {
        state.playerRatings[row.dataset.playerRatingRow] = Number(
          playerStar.dataset.playerRating
        );
        renderReputationForm();
      }
      return;
    }

    const courtTag = event.target.closest('[data-court-tag]');
    if (courtTag) {
      const value = courtTag.dataset.courtTag;
      if (state.courtTags.has(value)) state.courtTags.delete(value);
      else state.courtTags.add(value);
      renderReputationForm();
      return;
    }

    const playerTag = event.target.closest('[data-player-tag]');
    if (!playerTag) return;
    const playerId = playerTag.dataset.playerId;
    const value = playerTag.dataset.playerTag;
    if (!state.playerTags[playerId]) state.playerTags[playerId] = new Set();
    if (state.playerTags[playerId].has(value)) {
      state.playerTags[playerId].delete(value);
    } else {
      state.playerTags[playerId].add(value);
    }
    renderReputationForm();
  });

  $('#skip-feedback').addEventListener('click', closeFeedback);
  feedbackModal.addEventListener('click', event => {
    if (event.target === feedbackModal) closeFeedback();
  });
  $('#repeat-booking').addEventListener('click', () => {
    if (!state.booking) return;
    location.href = `../booking/?repeatCourt=${encodeURIComponent(
      state.booking.court
    )}&repeatTime=${encodeURIComponent(state.booking.time)}`;
  });
  $('#submit-feedback').addEventListener('click', submitFeedback);
}
