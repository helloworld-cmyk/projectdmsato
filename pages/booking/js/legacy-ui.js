const toast = document.querySelector('.toast');
let timer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.querySelectorAll('[data-toast]').forEach((button) => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

document.querySelectorAll('.legacy-filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    filter.classList.toggle('active');
  });
});

document.querySelectorAll('.legacy-court').forEach((court) => {
  court.addEventListener('click', () => court.classList.add('selected'));
});
