import { store } from '../state.js';
import { formatReputationDate, escape } from '../utils.js';

export function renderReputation() {
  const profile = store.getProfile();
  const reputation = store.getPlayerReputation('self');
  
  const rating = document.querySelector('#profile-reputation-rating');
  const count = document.querySelector('#profile-reputation-count');
  
  rating.textContent = reputation.hasData ? `${reputation.rating.toFixed(1)} ★` : '—';
  count.textContent = reputation.reviews ? `${reputation.reviews} lượt đánh giá` : 'Chưa có đánh giá';
  
  document.querySelector('#profile-reputation-highlights').innerHTML = reputation.highlights.length
    ? reputation.highlights.map(item => `<span class="reputation-highlight">${escape(item.tag)} · ${item.count}</span>`).join('')
    : '<span class="reputation-empty" style="padding:0;text-align:left">Các tiêu chí nổi bật sẽ xuất hiện sau khi có phản hồi.</span>';
  
  document.querySelector('#profile-reputation-alert').innerHTML = reputation.alerts.length
    ? reputation.alerts.map(item => `<div class="reputation-alert"><span class="material-symbols-rounded">warning</span>${escape(item.tag)} · ${item.count} phản hồi</div>`).join('')
    : '';
  
  const reviews = store.getReviewsForSubject('player', 'self');
  const list = document.querySelector('#profile-reputation-reviews');
  
  list.innerHTML = reviews.length
    ? reviews.slice(0, 5).map(review => {
        const target = (review.players || []).find(player => player.id === store.getSubjectId('player', profile.name));
        if (!target) return '';
        return `
          <article class="reputation-review">
            <div class="reputation-review-head">
              <strong>${escape(review.reviewer.name)}</strong>
              <time>${formatReputationDate(review.createdAt)}</time>
            </div>
            <div class="reputation-review-rating">
              ${'★'.repeat(Number(target.rating) || 0)}${'☆'.repeat(5 - (Number(target.rating) || 0))}
            </div>
            ${target.tags && target.tags.length ? `<div class="reputation-review-copy">${target.tags.map(tag => escape(tag)).join(' · ')}</div>` : ''}
          </article>
        `;
      }).join('')
    : '<div class="reputation-empty"><span class="material-symbols-rounded">rate_review</span>Chưa có người khác đánh giá bạn. Hãy hoàn tất thêm trận để xây dựng uy tín.</div>';
}