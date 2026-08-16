import {
  dom,
  matchFeedbackRating,
  matchFeedbackTags,
  payingApplicationId,
  resetMatchFeedback,
  setPayingApplicationId,
  setMatchFeedbackRating,
  store,
  toggleMatchFeedbackTag
} from '../core/state.js';
import { allMatches } from '../match-list/filters.js';
import { safe } from '../core/utils.js';
import { showToast } from '../core/toast.js';

export function renderMatchFeedback() {
  document.querySelector('#match-feedback-stars').innerHTML = [1, 2, 3, 4, 5]
    .map(number => `
      <button type="button" class="${number <= matchFeedbackRating ? 'active' : ''}"
        data-match-rating="${number}">★</button>
    `)
    .join('');
  document.querySelector('#match-feedback-tags').innerHTML = [
    'Đồng đội vui',
    'Đúng giờ',
    'Đúng trình độ',
    'Thanh toán đúng hẹn',
    'Trễ giờ'
  ].map(tag => `
    <button type="button" class="${matchFeedbackTags.has(tag) ? 'active' : ''}"
      data-match-tag="${safe(tag)}">${safe(tag)}</button>
  `).join('');
}

export function openMatchFeedback(applicationId) {
  const application = store.getApplications().find(item => item.id === applicationId);
  if (!application) return;
  const journey = store.getJourney('match', application.id);
  if (!journey || journey.status !== 'completed') {
    store.completeJourney('match', application.id);
  }
  if (!store.canSubmitReputationReview('match', application.id)) {
    showToast('Kèo này đã được đánh giá.');
    return;
  }
  setPayingApplicationId(application.id);
  resetMatchFeedback();
  renderMatchFeedback();
  dom.matchFeedbackModal.classList.add('show');
}

export function initFeedbackEvents() {
  dom.matchFeedbackModal.addEventListener('click', event => {
    const rating = event.target.closest('[data-match-rating]');
    if (rating) {
      setMatchFeedbackRating(Number(rating.dataset.matchRating));
      renderMatchFeedback();
      return;
    }
    const tag = event.target.closest('[data-match-tag]');
    if (tag) {
      toggleMatchFeedbackTag(tag.dataset.matchTag);
      renderMatchFeedback();
    }
  });
  document.querySelector('#submit-match-feedback').addEventListener('click', () => {
    const application = store.getApplications().find(
      item => item.id === payingApplicationId
    );
    if (!application) return;
    const players = (application.match.participants || [])
      .filter(player => player.name !== store.getProfile().name)
      .map(player => ({
        id: player.id,
        name: player.name,
        initials: player.initials,
        rating: matchFeedbackRating,
        tags: [...matchFeedbackTags]
      }));
    const review = store.submitReputationReview({
      type: 'match',
      sourceId: application.id,
      court: {
        id: application.match.venue,
        name: application.match.venue,
        rating: matchFeedbackRating,
        tags: [...matchFeedbackTags]
      },
      players
    });
    if (!review) {
      showToast('Không thể lưu đánh giá cho kèo này.');
      return;
    }
    store.submitFeedback({
      type: 'match',
      sourceId: application.id,
      rating: matchFeedbackRating,
      atmosphere: matchFeedbackRating,
      tags: [...matchFeedbackTags],
      repeat: true
    });
    dom.matchFeedbackModal.classList.remove('show');
    showToast('Đã lưu đánh giá kèo và người chơi!');
  });
}

export function renderMatchReputation() {
  if (!dom.detailsModal.classList.contains('show')) return;
  if (dom.detailContent.querySelector('[data-match-reputation]')) return;
  const title = document.querySelector('#details-title');
  if (!title) return;
  const item = allMatches().find(match => match.name === title.textContent);
  if (!item) return;
  const players = (item.participants || []).map(player => {
    const reputation = store.getPlayerReputation(player.id || player.name);
    const rating = reputation.hasData ? `${reputation.rating.toFixed(1)} ★` : '—';
    const count = reputation.hasData
      ? `${reputation.reviews} lượt đánh giá`
      : 'Chưa đủ dữ liệu';
    const highlights = reputation.highlights.slice(0, 2).map(tag => (
      `<span class="match-reputation-tag">${safe(tag.tag)} <b>${tag.count}</b></span>`
    )).join('');
    const alerts = reputation.alerts.slice(0, 2).map(tag => (
      `<span class="match-reputation-alert">${safe(tag.tag)} · ${tag.count}</span>`
    )).join('');
    return `
      <div class="match-reputation-row">
        <span class="player-avatar" style="background:${safe(player.tone || '#6680ba')}">
          ${safe(player.initials)}
        </span>
        <div class="match-reputation-copy">
          <strong>${safe(player.name)}</strong>
          <div class="match-reputation-summary">
            <span class="match-reputation-rating">${rating}</span>
            <span class="match-reputation-count">${count}</span>
          </div>
          ${highlights ? `<div class="match-reputation-tags">${highlights}</div>` : ''}
          ${alerts ? `<div>${alerts}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  dom.detailContent.querySelector('.detail-actions').insertAdjacentHTML(
    'beforebegin',
    `<section class="detail-section match-reputation-section" data-match-reputation>
      <h3>Uy tín người chơi</h3>
      <p class="match-reputation-note">
        Điểm và nhãn được tổng hợp từ các trận đã hoàn tất.
      </p>
      <div class="match-reputation-list">${players}</div>
    </section>`
  );
}
