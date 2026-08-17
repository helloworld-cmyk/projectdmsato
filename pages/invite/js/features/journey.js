import { matchInviteMode, state, store } from '../core/state.js';
import { $, $$ } from '../core/dom.js';

export function journeyStatus() {
  if (!state.booking) return 'held';
  const journey = store.getJourney('booking', state.booking.id);
  if (journey && journey.status === 'completed') return 'ready';
  if (['expired', 'cancelled'].includes(state.booking.status)) {
    return state.booking.status;
  }
  if (state.booking.ownerPaid) return 'paid';
  if (state.booking.status === 'confirmed') return 'confirmed';
  return 'held';
}

const journeyLabels = {
  held: [
    'Bạn đang giữ sân.',
    'Đang giữ chỗ',
    'Xác nhận sân để bắt đầu hành trình.',
    'Xác nhận sân'
  ],
  confirmed: [
    'Sân đã có trong lịch.',
    'Đã xác nhận',
    'Mời đội và chia tiền để cả nhóm sẵn sàng.',
    'Mời đội'
  ],
  team: [
    'Đội hình đã sẵn sàng hơn.',
    'Đủ người',
    'Thanh toán phần của bạn để khóa lịch chơi.',
    'Thanh toán phần của bạn'
  ],
  paid: [
    'Mọi thứ đã sẵn sàng.',
    'Sắp bắt đầu',
    'Sau trận, chia sẻ cảm nhận để nhận huy hiệu nhé.',
    'Mình đã chơi xong'
  ],
  ready: [
    'Bạn đã hoàn thành trận chơi.',
    'Đã hoàn thành',
    'Đánh giá giúp cộng đồng tìm được những đội vui hơn.',
    'Đánh giá trận'
  ],
  expired: [
    'Giữ chỗ đã hết hạn.',
    'Có thể đánh giá',
    'Bạn vẫn có thể chia sẻ trải nghiệm của lịch này.',
    'Đánh giá trận'
  ],
  cancelled: [
    'Lịch đã hủy.',
    'Có thể đánh giá',
    'Bạn vẫn có thể chia sẻ trải nghiệm của lịch này.',
    'Đánh giá trận'
  ]
};

export function renderJourney() {
  if (matchInviteMode) {
    $('#journey-card').style.display = 'none';
    return;
  }
  const status = journeyStatus();
  const index = {
    held: 0,
    confirmed: 1,
    team: 2,
    paid: 3,
    ready: 4
  }[status] || 0;
  const labels = journeyLabels[status] || [];
  const journey = state.booking && store.getJourney('booking', state.booking.id);
  const reviewed = journey && (
    journey.feedbackSubmitted
    || journey.reputationSubmitted
    || !store.canSubmitReputationReview('booking', state.booking.id)
  );

  $$('.journey-step').forEach((step, stepIndex) => {
    step.classList.toggle('done', stepIndex < index);
    step.classList.toggle('current', stepIndex === index);
  });
  $('#journey-caption').textContent = labels[0];
  $('#journey-badge').textContent = labels[1];
  $('#journey-next').textContent = labels[2];

  const action = $('#journey-action');
  action.textContent = reviewed ? 'Đã đánh giá' : labels[3];
  action.dataset.journeyAction = reviewed
    ? 'reviewed'
    : ['expired', 'cancelled'].includes(status) ? 'review' : status;
  action.disabled = Boolean(reviewed);
  $('#journey-card').style.display = state.booking ? 'block' : 'none';
}

export function syncReviewAction() {
  if (!state.booking) return;
  const journey = store.getJourney('booking', state.booking.id);
  const reviewed = Boolean(journey && (
    journey.feedbackSubmitted
    || journey.reputationSubmitted
    || !store.canSubmitReputationReview('booking', state.booking.id)
  ));
  const action = $('#journey-action');
  const labels = {
    held: 'Xác nhận sân',
    confirmed: 'Mời đội',
    team: 'Thanh toán phần của bạn',
    paid: 'Mình đã chơi xong',
    ready: 'Đánh giá trận',
    expired: 'Đánh giá trận',
    cancelled: 'Đánh giá trận'
  };
  action.textContent = reviewed
    ? 'Đã đánh giá'
    : labels[action.dataset.journeyAction] || action.textContent;
  action.dataset.journeyAction = reviewed
    ? 'reviewed'
    : ['expired', 'cancelled'].includes(action.dataset.journeyAction)
      ? 'review'
      : action.dataset.journeyAction;
  action.disabled = reviewed;
}
