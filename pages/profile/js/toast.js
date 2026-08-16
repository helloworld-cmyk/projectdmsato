let toastElement = null;
let toastTimer = null;

export function initToast(element) {
  toastElement = element;
}

export function showToast(message) {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove('show'), 2600);
}