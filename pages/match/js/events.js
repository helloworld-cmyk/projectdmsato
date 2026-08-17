import { dom, state, store, DISTANCE_MAX } from './core/state.js';
import { closeDetails, openDetails } from './match-list/details.js';
import {
  allMatches,
  findMatch,
  renderMatches,
  syncDistanceRange
} from './match-list/filters.js';
import { goToApplicationPayment, openJoinPayment } from './modals/payment.js';
import { closeTeamMoment, getTeamState, openTeamMoment } from './modals/team.js';
import { closeCreateFlow, openCreateFlow, renderCreateFlow } from './create/create.js';
import { openMatchFeedback } from './modals/feedback.js';
import { showToast } from './core/toast.js';
import { openPremiumUpsell } from './core/premium-upsell.js';

export function requestToJoin(matchId) {
  const item = findMatch(matchId);
  if (!item || item.custom) return;
  const application = store.applyToMatch(item);
  if (application && application.ok === false && application.reason === 'limit') {
    showToast(`Gói miễn phí đã dùng hết ${application.limit} lượt xin vào kèo trong tháng này.`);
    openPremiumUpsell(
      `Bạn đã dùng hết ${application.usage}/${application.limit} lượt trong tháng`
    );
    return;
  }
  renderMatches();
  if (['accepted', 'payment_pending'].includes(application.status)) {
    openJoinPayment(application.id);
  } else {
    openTeamMoment(item, application);
  }
}

function initGridEvents() {
  dom.grid.addEventListener('click', event => {
    const insightButton = event.target.closest('[data-insight-id]');
    if (insightButton) {
      openDetails(findMatch(insightButton.dataset.insightId));
      return;
    }
    const detailButton = event.target.closest('.view-details');
    if (detailButton) {
      openDetails(findMatch(detailButton.dataset.id));
      return;
    }
    const inviteButton = event.target.closest('[data-invite-match]');
    if (inviteButton) {
      location.href = `../invite/?match=${encodeURIComponent(
        inviteButton.dataset.inviteMatch
      )}`;
      return;
    }
    const paymentButton = event.target.closest('[data-payment-application]');
    if (paymentButton) {
      goToApplicationPayment(paymentButton.dataset.paymentApplication);
      return;
    }
    const button = event.target.closest('.join');
    if (!button || button.disabled) return;
    requestToJoin(button.dataset.id);
  });
}

function initDetailsEvents() {
  dom.detailsModal.addEventListener('click', event => {
    if (
      event.target === dom.detailsModal
      || event.target.closest('#close-details')
      || event.target.closest('#close-details-secondary')
    ) {
      closeDetails();
      return;
    }
    const chatButton = event.target.closest('[data-chat-match]');
    if (chatButton) {
      closeDetails();
      window.MatchUpChat?.open(chatButton.dataset.chatMatch);
      return;
    }
    const saveButton = event.target.closest('[data-save-match]');
    if (saveButton) {
      const item = findMatch(saveButton.dataset.saveMatch);
      const saved = store.toggleSavedMatch(item.id, item.name, item);
      saveButton.classList.toggle('saved', saved);
      saveButton.innerHTML = `
        <span class="material-symbols-rounded">
          ${saved ? 'bookmark' : 'bookmark_border'}
        </span>${saved ? 'Đã lưu' : 'Lưu kèo'}
      `;
      renderMatches();
      return;
    }
    const paymentButton = event.target.closest('[data-detail-payment]');
    if (paymentButton) {
      goToApplicationPayment(paymentButton.dataset.detailPayment);
      return;
    }
    const profileButton = event.target.closest('[data-detail-profile]');
    if (profileButton) {
      location.href = `../profile/?application=${encodeURIComponent(
        profileButton.dataset.detailProfile
      )}`;
      return;
    }
    const joinButton = event.target.closest('[data-detail-join]');
    if (joinButton) {
      requestToJoin(joinButton.dataset.detailJoin);
      closeDetails();
    }
  });
}

function initTeamEvents() {
  dom.teamMoment.addEventListener('click', async event => {
    if (
      event.target === dom.teamMoment
      || event.target.closest('#close-team-moment')
    ) {
      closeTeamMoment();
      return;
    }
    const { teamMatch, teamApplication } = getTeamState();
    if (event.target.closest('#team-open-chat')) {
      if (teamMatch) {
        location.href = `../contact/?match=${encodeURIComponent(teamMatch.id)}`;
      }
      return;
    }
    if (event.target.closest('#team-payment')) {
      if (teamApplication && ['accepted', 'payment_pending'].includes(
        teamApplication.status
      )) {
        openJoinPayment(teamApplication.id);
        return;
      }
      showToast('Thanh toán sẽ mở sau khi chủ kèo duyệt yêu cầu.');
      return;
    }
    if (event.target.closest('#team-invite')) {
      if (teamMatch) {
        location.href = `../invite/?match=${encodeURIComponent(teamMatch.id)}`;
      }
      return;
    }
    if (event.target.closest('#team-finish')) {
      if (teamApplication) {
        location.href = `./?application=${encodeURIComponent(
          teamApplication.id
        )}&finish=1`;
      }
      return;
    }
    if (event.target.closest('#team-view-details')) {
      closeTeamMoment();
      if (teamMatch) openDetails(teamMatch);
      return;
    }
    if (event.target.closest('#team-share')) {
      const link = `https://matchup.vn/keo/${teamMatch ? teamMatch.id : ''}`;
      try {
        if (!navigator.clipboard) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(link);
        showToast('Đã sao chép link mời thêm bạn!');
      } catch (_) {
        showToast('Hãy gửi link kèo trong trang Kèo của tôi nhé.');
      }
    }
  });
}

function initEmptyEvents() {
  dom.empty.addEventListener('click', event => {
    const action = event.target.closest('[data-empty-action]');
    if (!action) return;
    if (action.dataset.emptyAction === 'waitlist') {
      const wait = store.requestWaitlist({
        sport: state.sport,
        time: state.time,
        level: state.level,
        radius: state.distanceMax
      });
      showToast(wait
        ? 'Đã bật báo kèo phù hợp cho bạn.'
        : 'Bạn đã bật báo kèo này rồi.');
      return;
    }
    state.distanceMax = DISTANCE_MAX;
    syncDistanceRange();
    renderMatches();
    showToast('Đã mở rộng bán kính tìm kiếm đến 10 km.');
  });
}

export function initEvents() {
  initGridEvents();
  initDetailsEvents();
  initTeamEvents();
  initEmptyEvents();
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!dom.createFlow.hidden) {
      closeCreateFlow();
    } else {
      closeDetails();
    }
  });
  document.addEventListener('matchup:location-ready', () => {
    document.querySelectorAll('[data-detail-location]').forEach(element => {
      element.textContent = document.querySelector('[data-user-location]')?.textContent
        || 'vị trí hiện tại';
    });
    renderMatches();
  });
  document.addEventListener('matchup:state-change', () => {
    renderMatches();
    if (!dom.createFlow.hidden) renderCreateFlow();
    const { teamMatch, teamApplication } = getTeamState();
    if (teamMatch && teamApplication) {
      const latest = store.getApplications().find(
        application => application.id === teamApplication.id
      );
      if (latest && latest.status !== teamApplication.status) {
        openTeamMoment(teamMatch, latest);
      }
    }
  });
}

export function handleQueryActions() {
  const query = new URLSearchParams(location.search);
  const requestedMatchId = query.get('match');
  if (requestedMatchId) {
    const requestedMatch = findMatch(requestedMatchId);
    if (requestedMatch) {
      openDetails(requestedMatch);
    } else {
      showToast('Kèo này không còn hoạt động.');
    }
  }
  if (query.get('create') === '1') openCreateFlow();
  const applicationId = query.get('application');
  if (query.get('finish') === '1' && applicationId) {
    setTimeout(() => openMatchFeedback(applicationId), 0);
  }
}
