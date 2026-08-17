import {
  matchInviteMode,
  profile,
  state,
  store,
  ownSplitPlayer
} from '../core/state.js';
import { $, $$ } from '../core/dom.js';
import {
  bookingTeamSize,
  defaultJoinRules,
  equalise,
  isBalanced,
  matchModePayableSubtotal,
  refundForSelf,
  totalSplit
} from '../booking/booking.js';
import { format, safe } from '../core/utils.js';
import { subjectKey } from '../../../../js/app-state/core/utils.js';

const inactiveStatuses = ['pending', 'payment_pending', 'rejected'];

export function renderSplit() {
  state.splitPlayers = state.splitPlayers.filter(player => (
    player && !player.empty && String(player.name || '').trim()
  ));
  if (!state.splitPlayers.length) {
    state.splitPlayers = [{
      id: store.getSubjectId('player', profile.name),
      name: profile.name,
      initials: profile.initials,
      role: 'Người tạo kèo',
      amount: state.total,
      paid: false
    }];
  }
  if (state.splitMode === 'equal') equalise();

  const maxPlayers = bookingTeamSize();
  const activePlayers = state.splitPlayers.filter(player => (
    !inactiveStatuses.includes(player.joinStatus)
  ));
  const rosterPlayers = state.splitPlayers.filter(
    player => player.joinStatus !== 'rejected'
  );
  const paidCount = rosterPlayers.filter(player => player.paid).length;
  const activeCount = activePlayers.length;
  const balanced = isBalanced();
  const rules = state.booking && state.booking.joinRules || defaultJoinRules();
  const requirePayment = Boolean(rules.requirePaymentBeforeJoin);

  $$('.split-tab').forEach(tab => {
    const active = tab.dataset.mode === state.splitMode;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });
  $('#split-total').textContent = format(
    state.splitMode === 'custom' ? totalSplit() : state.total
  );
  $('#each-total').textContent = state.splitMode === 'equal'
    ? `${format(state.total / state.splitPlayers.length)} / người`
    : 'Tùy chỉnh';
  $('#split-caption').textContent = state.splitMode === 'equal'
    ? `Chia đều cho ${activeCount} người chơi.`
    : balanced
      ? 'Tổng tiền đã được chia đủ.'
      : `Còn chênh lệch ${format(Math.abs(state.total - totalSplit()))}.`;

  const peopleStack = $('#people-stack');
  peopleStack.setAttribute('aria-label', `${activeCount} trong ${maxPlayers} người chơi`);
  peopleStack.innerHTML = state.splitPlayers.slice(0, 4)
    .map((player, index) => {
      const tone = ['', 'blue', 'yellow', ''][index] || '';
      return `<span class="mini-avatar ${tone}">${safe(player.initials || '')}</span>`;
    }).join('') + `<b id="people-count">${activeCount}/${maxPlayers} người</b>`;

  $('#player-list').innerHTML = state.splitPlayers.map(renderPlayer).join('');
  $('#add-player').style.display = activeCount < maxPlayers ? 'flex' : 'none';
  $('#progress-title').textContent = requirePayment
    ? `${paidCount}/${rosterPlayers.length} người đã thanh toán`
    : `${activeCount}/${maxPlayers} người đã vào kèo`;
  const paidAmount = rosterPlayers.reduce(
    (sum, player) => player.paid ? sum + Number(player.amount || 0) : sum,
    0
  );
  $('#paid-total').textContent = requirePayment ? format(paidAmount) : 'Không cần';
  $('#remaining-total').textContent = requirePayment
    ? format(Math.max(0, state.total - paidAmount))
    : '—';
  $('.progress-card p').textContent = requirePayment
    ? 'Đội cần thanh toán đủ để sân được xác nhận.'
    : 'Đội không cần thanh toán trước để vào kèo.';
  $('#progress-bar').style.width = requirePayment
    ? `${state.total ? paidAmount / state.total * 100 : 0}%`
    : `${maxPlayers ? activeCount / maxPlayers * 100 : 0}%`;

  const own = ownSplitPlayer();
  const ownAmount = own ? own.amount : state.splitPlayers[0].amount;
  const refund = matchInviteMode ? refundForSelf() : 0;
  const refundNote = $('#refund-note');
  const refundMessage = refund > 0
    ? `Bạn sẽ được hoàn ${format(refund)} đồng do đã có thêm người vào kèo.`
    : '';
  $('#refund-note-text').textContent = refundMessage;
  refundNote.hidden = !refundMessage;
  if (matchInviteMode) {
    $('#progress-title').textContent = requirePayment
      ? `${paidCount}/${rosterPlayers.length} người đã thanh toán`
      : `${activeCount}/${maxPlayers} người đã vào kèo`;
    $('.progress-card p').textContent = requirePayment
      ? 'Kèo yêu cầu thanh toán trước khi chốt chỗ trong đội.'
      : 'Kèo này không yêu cầu thanh toán trước khi vào đội.';
  }
  $('#modal-amount').textContent = format(ownAmount);
  $('#modal-pay-amount').textContent = format(ownAmount);
  renderPaymentButton(ownAmount, balanced);
}

function renderPlayer(player, index) {
  const tone = ['', 'blue', 'yellow', ''][index] || '';
  const rules = state.booking && state.booking.joinRules || defaultJoinRules();
  const requirePayment = Boolean(rules.requirePaymentBeforeJoin);
  const amount = state.splitMode === 'custom'
    ? `<input class="amount-input" data-amount-index="${index}" type="number"
        min="0" step="1000" value="${Number(player.amount) || 0}"
        aria-label="Số tiền ${safe(player.name)}" />`
    : `<span class="amount">${format(player.amount)}</span>`;
  const joinStatus = player.joinStatus || 'approved';
  const paid = Boolean(player.paid);
  const isSelf = subjectKey(player.name) === subjectKey(profile.name);
  let joinLabel;
  let statusNote;
  if (matchInviteMode && isSelf) {
    const paidAmount = Number(player.paidAmount) || 0;
    const ownAmount = Number(player.amount) || 0;
    if (paidAmount >= ownAmount) {
      joinLabel = 'Đã thanh toán đủ phần';
      statusNote = 'Đã khóa chỗ trong đội';
    } else if (paidAmount > 0) {
      joinLabel = `Đã thanh toán ${format(paidAmount)}`;
      statusNote = `còn ${format(ownAmount - paidAmount)}`;
    } else {
      joinLabel = 'Chưa thanh toán';
      statusNote = 'Bạn chưa thanh toán phần của mình';
    }
  } else {
    joinLabel = playerJoinLabel(isSelf, paid, joinStatus);
    statusNote = playerStatusNote(isSelf, paid, joinStatus);
  }
  const statusClass = paid
    ? 'done'
    : joinStatus === 'payment_pending'
      ? 'waiting'
      : joinStatus === 'pending' ? 'review' : '';
  const meetsCriteria = !String(player.approvalNote || '').startsWith('Còn thiếu:');
  const canApprove = joinStatus === 'pending'
    && (!requirePayment || paid)
    && meetsCriteria;
  const actions = playerActions(player, canApprove);
  const ownerLabel = isSelf
    ? ' <span style="color:#79867e;font-size:9px">(bạn)</span>'
    : '';
  const icon = paid ? 'check_circle' : joinStatus === 'pending' ? 'schedule' : 'payments';
  return `<div class="player" data-index="${index}">
    <span class="player-avatar ${tone}">${safe(player.initials || '')}</span>
    <div class="player-copy">
      <strong>${safe(player.name)}${ownerLabel}</strong>
      <span>${safe(player.role || 'Đã được mời · Đang chờ tham gia')}</span>
      <div class="player-state-row">
        <b class="payment-state ${statusClass}">
          <span class="material-symbols-rounded">${icon}</span>${joinLabel}
        </b>
        <span class="player-state-note">${statusNote}</span>
      </div>
      ${actions ? `<div class="player-actions">${actions}</div>` : ''}
    </div>${amount}
  </div>`;
}

function playerJoinLabel(isOwner, paid, status) {
  if (isOwner) return paid ? 'Đã thanh toán phần của bạn' : 'Chưa thanh toán';
  if (status === 'payment_pending') return 'Chờ thanh toán';
  if (status === 'pending' && paid) return 'Đã thanh toán · chờ duyệt';
  if (status === 'pending') return 'Chờ chủ kèo duyệt';
  if (status === 'approved' && paid) return 'Đã vào kèo · đã thanh toán';
  if (status === 'approved') return 'Đã vào kèo';
  if (status === 'rejected') return 'Không được duyệt';
  return 'Chưa thanh toán';
}

function playerStatusNote(isOwner, paid, status) {
  if (isOwner) return paid ? 'Đã khóa phần của bạn' : 'Bạn là người tạo kèo';
  if (status === 'payment_pending') return 'Thanh toán trước khi được duyệt';
  if (status === 'pending' && paid) return 'Đã nhận tiền · còn bước duyệt';
  if (status === 'pending') return 'Chủ kèo cần xác nhận';
  if (status === 'approved' && paid) return 'Đã khóa chỗ trong đội';
  if (status === 'approved') return 'Không cần thanh toán trước';
  return '';
}

function playerActions(player, canApprove) {
  const approve = canApprove
    ? `<button class="approve-player" type="button" data-approve-player="${safe(player.id)}">
        <span class="material-symbols-rounded">how_to_reg</span>Duyệt vào đội
      </button>`
    : '';
  return approve;
}

function renderPaymentButton(ownAmount, balanced) {
  const paymentButton = $('#open-payment');
  const own = ownSplitPlayer();
  const unavailable = state.splitMode === 'custom' && !balanced
    || state.booking && ['expired', 'cancelled'].includes(state.booking.status);
  paymentButton.disabled = unavailable;
  const payableLabel = matchInviteMode
    ? format(matchModePayableSubtotal())
    : format(ownAmount);
  if (own && own.paid) {
    paymentButton.innerHTML = '<span class="material-symbols-rounded">check_circle</span>'
      + 'Phần của bạn đã thanh toán';
  } else if (unavailable) {
    const label = state.splitMode === 'custom' && !balanced
      ? 'Chia tiền chưa khớp'
      : 'Lịch sân không còn hiệu lực';
    paymentButton.innerHTML = '<span class="material-symbols-rounded">priority_high</span>'
      + label;
  } else {
    paymentButton.innerHTML = '<span class="material-symbols-rounded">lock</span>'
      + `Thanh toán <span id="pay-button-amount">${payableLabel}</span>`;
  }
}
