import { dom, store } from '../core/state.js';
import { applicationFor, insightFor } from './filters.js';
import { currentLocationLabel, money, safe } from '../core/utils.js';
import { requestedLocation } from '../core/constants.js';

export function closeDetails() {
  dom.detailsModal.classList.remove('show');
}

export function openDetails(item) {
  if (!item) return;
  const paidCount = item.participants.filter(
    player => player.payment === 'Đã thanh toán'
  ).length;
  const joinRules = store.getMatchApproval(item).rules;
  const criteriaLabels = [
    joinRules.criteria.levelMatch ? 'Cùng trình độ' : '',
    joinRules.criteria.minRating
      ? `Uy tín từ ${joinRules.criteria.minRating.toFixed(1)}★`
      : '',
    joinRules.criteria.minCompletedMatches
      ? `Đã hoàn thành ${joinRules.criteria.minCompletedMatches} trận`
      : ''
  ].filter(Boolean);
  const joinRulesMarkup = `
    <section class="detail-section">
      <h3>Quy tắc tham gia</h3>
      <div class="detail-meta">
        <span>${joinRules.requirePaymentBeforeJoin
          ? 'Bắt thanh toán cọc trước'
          : 'Thanh toán sau khi được duyệt'}</span>
        <span>${joinRules.autoApprove
          ? 'Tự động duyệt theo tiêu chí'
          : 'Chờ chủ kèo duyệt'}</span>
      </div>
      ${criteriaLabels.length
        ? `<p style="margin:9px 0 0;color:#6f8075;font-size:10px">
            Tiêu chí tự động duyệt: ${criteriaLabels.map(safe).join(' · ')}
          </p>`
        : ''}
    </section>
  `;
  const paymentCopy = joinRules.requirePaymentBeforeJoin
    ? 'Kèo yêu cầu thanh toán cọc trước khi chốt chỗ trong đội.'
    : 'Bạn thanh toán cọc sau khi chủ kèo duyệt; phần còn lại '
      + 'thanh toán trước giờ chơi 30 phút.';
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query='
    + encodeURIComponent(`${item.venue}, ${item.address}`);
  const application = applicationFor(item.id);
  const detailAction = item.custom
    ? '<button class="join" disabled>Kèo của bạn</button>'
    : application && ['accepted', 'payment_pending'].includes(application.status)
      ? `<button class="join" data-detail-payment="${safe(application.id)}">
          Thanh toán cọc
        </button>`
      : application && application.status === 'paid'
        ? '<button class="join" disabled>Đã thanh toán cọc</button>'
        : application && application.status === 'pending'
          && application.paymentStatus === 'paid'
          ? `<button class="join" data-detail-profile="${safe(application.id)}">
              Đã đóng cọc · chờ duyệt
            </button>`
          : application
            ? `<button class="join" data-detail-profile="${safe(application.id)}">
                Theo dõi yêu cầu
              </button>`
            : `<button class="join" data-detail-join="${item.id}">Xin vào kèo</button>`;
  const participants = item.participants.map(player => `
    <div class="player-row">
      <span class="player-avatar" style="background:${player.tone}">
        ${player.initials}
      </span>
      <span class="player-copy">${player.name}<small>${player.role}</small></span>
      <span class="payment-state ${player.payment === 'Đã thanh toán'
        ? 'paid'
        : 'pending'}">${player.payment}</span>
    </div>
  `).join('');
  const insight = insightFor(item);
  const saved = store.isMatchSaved(item.id);
  const hostName = insight.host.name;
  const hostInitials = hostName.split(/\s+/)
    .slice(-2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

  dom.detailContent.innerHTML = `
    <div class="modal-top">
      <div>
        <div class="detail-kicker">
          <span class="material-symbols-rounded">sports_score</span>Thông tin kèo
        </div>
        <h2 id="details-title">${item.name}</h2>
        <p>${item.emoji} ${item.format} · ${item.time}</p>
        <div class="detail-meta">
          <span>${item.level}</span>
          <span>${item.participants.length}/${item.capacity} người</span>
          <span>Còn ${item.available} chỗ</span>
        </div>
      </div>
      <button class="close" id="close-details" aria-label="Đóng chi tiết kèo">
        <span class="material-symbols-rounded">close</span>
      </button>
    </div>
    <section class="detail-section">
      <h3>Địa điểm &amp; khoảng cách</h3>
      <div class="detail-venue">
        <div class="venue-icon">
          <span class="material-symbols-rounded">stadium</span>
        </div>
        <div>
          <strong>${item.venue}</strong>
          <p>${item.address}</p>
        </div>
        <a class="map-link" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">
          <span class="material-symbols-rounded">map</span>Google Maps
        </a>
      </div>
      <div class="distance-callout">
        <span class="material-symbols-rounded">near_me</span>
        <span>
          <strong>${item.distance.toFixed(1).replace('.', ',')} km</strong>
          từ vị trí hiện tại của bạn
          (<span data-detail-location>${currentLocationLabel(requestedLocation)}</span>)
        </span>
      </div>
    </section>
    <section class="detail-section">
      <h3>Người đã vào kèo (${item.participants.length})</h3>
      <div class="player-list">${participants}</div>
    </section>
    <section class="detail-section">
      <h3>Thanh toán</h3>
      <div class="payment-grid">
        <div class="payment-stat">
          <small>Tổng tiền sân</small><strong>${money(item.fee)}</strong>
        </div>
        <div class="payment-stat">
          <small>Chia đều dự kiến</small>
          <strong>${money(item.share)}/người</strong>
        </div>
        <div class="payment-stat">
          <small>Đã thanh toán</small>
          <strong>${paidCount}/${item.participants.length} người</strong>
        </div>
      </div>
      <div class="payment-method">
        <span class="material-symbols-rounded">qr_code_2</span>
        <span><strong>${item.paymentMethod}.</strong><br />${paymentCopy}</span>
      </div>
    </section>
    ${joinRulesMarkup}
    <div class="detail-actions">
      <button class="view-details" id="close-details-secondary">Để sau</button>
      ${detailAction}
    </div>
  `;

  dom.detailContent.querySelector('.modal-top').insertAdjacentHTML('afterend', `
    <section class="insight-box">
      <div class="insight-box-head">
        <span>VÌ SAO KÈO NÀY HỢP VỚI BẠN?</span><strong>${insight.score}%</strong>
      </div>
      <div class="insight-list">
        ${insight.reasons.map(reason => `<span>${safe(reason)}</span>`).join('')}
      </div>
    </section>
    <section class="detail-section">
      <h3>Không khí &amp; độ tin cậy</h3>
      <div class="host-card">
        <span class="host-avatar">${safe(hostInitials)}</span>
        <div>
          <strong>${safe(hostName)}</strong>
          <small>Chủ kèo · ${safe(insight.vibe)}</small>
        </div>
        <div class="host-trust">
          ${insight.host.reliability}%
          <span>${insight.host.matches} trận đã tổ chức</span>
        </div>
      </div>
    </section>
  `);
  dom.detailContent.querySelector('.detail-actions').insertAdjacentHTML(
    'afterbegin',
    `<button class="save-match ${saved ? 'saved' : ''}" data-save-match="${item.id}">
      <span class="material-symbols-rounded">${saved ? 'bookmark' : 'bookmark_border'}</span>
      ${saved ? 'Đã lưu' : 'Lưu kèo'}
    </button>`
  );
  if (application && store.getChatAccess(item.id).allowed) {
    dom.detailContent.querySelector('.detail-actions').insertAdjacentHTML(
      'afterbegin',
      `<button class="save-match" data-chat-match="${item.id}">
        <span class="material-symbols-rounded">forum</span>Mở chat
      </button>`
    );
  }
  dom.detailsModal.classList.add('show');
}
