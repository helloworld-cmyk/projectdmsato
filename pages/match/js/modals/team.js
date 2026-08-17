import { dom, setTeamState, teamApplication, teamMatch } from '../core/state.js';
import { playerClass, safe } from '../core/utils.js';

export function closeTeamMoment() {
  dom.teamMoment.classList.remove('show');
}

export function openTeamMoment(item, application) {
  setTeamState(item, application);
  const participants = item.participants || [];
  const joined = participants.length;
  const capacity = item.capacity || joined + 1;
const copy = application.status === 'payment_pending'
    ? 'Kèo này yêu cầu thanh toán trước khi được duyệt. '
      + 'Hãy thanh toán để gửi yêu cầu vào đội.'
    : application.status === 'pending'
      ? `Yêu cầu vào ${item.name} đã được gửi. `
        + 'Thanh toán sẽ mở lại ngay khi chủ kèo duyệt.'
      : application.status === 'accepted'
        ? 'Bạn đã được chủ kèo nhận vào. '
          + 'Hãy thanh toán để giữ chỗ trong đội!'
        : 'Bạn đã hoàn tất thanh toán phần của mình. '
          + 'Sau trận, hãy đánh giá đội nhé!';
  document.querySelector('#team-moment-copy').textContent = copy;
  document.querySelector('#team-roster').innerHTML = participants
    .slice(0, 6)
    .map((player, index) => (
      `<span class="member ${playerClass(index)}">${safe(player.initials)}</span>`
    ))
    .join('')
    + '<span class="member" style="color:#728178;background:#edf2ed">+</span>';
  document.querySelector('#team-progress-bar').style.width =
    `${Math.min(100, joined / capacity * 100)}%`;
  document.querySelector('#team-progress-label').textContent = `${joined}/${capacity} người`;
  document.querySelector('#team-progress-need').textContent = item.available === 1
    ? 'Còn 1 chỗ'
    : `Còn ${item.available} chỗ`;
  const paymentButton = document.querySelector('#team-payment');
  paymentButton.dataset.applicationId = application.id;
  paymentButton.disabled = !['accepted', 'payment_pending'].includes(application.status);
  paymentButton.textContent = ['accepted', 'payment_pending'].includes(application.status)
    ? 'Thanh toán'
    : application.status === 'paid'
      ? 'Đã thanh toán'
      : application.status === 'pending'
        ? 'Chờ chủ kèo duyệt'
        : 'Theo dõi & thanh toán';
  const finishButton = document.querySelector('#team-finish');
  finishButton.dataset.applicationId = application.id;
  finishButton.disabled = application.status !== 'paid';
  finishButton.textContent = application.status === 'paid'
    ? 'Đã chơi xong · đánh giá'
    : 'Đánh giá sau khi thanh toán';
  dom.teamMoment.classList.add('show');
}

export function getTeamState() {
  return { teamMatch, teamApplication };
}
