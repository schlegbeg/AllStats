// Локальна перевірка демонстраційної форми зворотного зв’язку.
const feedbackForm = document.getElementById('feedbackForm');
const feedbackDialog = document.getElementById('feedback-success');
const feedbackSubmit = document.getElementById('feedback-submit');
const feedbackClose = document.getElementById('feedback-close');
const feedbackStatus = document.getElementById('feedback-status');
const feedbackAgreement = document.getElementById('feedback-agreement');

const emailPattern = /^(?!.*\.\.)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const phonePattern = /^\+380[0-9]{9}$/;
const touchedFields = new Set();

const feedbackFields = [
  {
    control: document.getElementById('feedback-name'),
    error: document.getElementById('feedback-name-error'),
    success: document.getElementById('feedback-name-success'),
    validate: validateName
  },
  {
    control: document.getElementById('feedback-email'),
    error: document.getElementById('feedback-email-error'),
    success: document.getElementById('feedback-email-success'),
    validate: validateEmail
  },
  {
    control: document.getElementById('feedback-phone'),
    error: document.getElementById('feedback-phone-error'),
    success: document.getElementById('feedback-phone-success'),
    validate: validatePhone
  },
  {
    control: document.getElementById('feedback-message'),
    error: document.getElementById('feedback-message-error'),
    success: document.getElementById('feedback-message-success'),
    validate: validateMessage
  },
  {
    control: feedbackAgreement,
    error: document.getElementById('feedback-agreement-error'),
    success: document.getElementById('feedback-agreement-success'),
    validate: validateAgreement
  }
];

function graphemeCount(value) {
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length;
  }

  return Array.from(value).length;
}

function validateName() {
  return graphemeCount(document.getElementById('feedback-name').value.trim()) >= 2;
}

function validateEmail() {
  return emailPattern.test(document.getElementById('feedback-email').value);
}

function validatePhone() {
  return phonePattern.test(document.getElementById('feedback-phone').value);
}

function validateMessage() {
  return graphemeCount(document.getElementById('feedback-message').value.trim()) >= 10;
}

function validateAgreement() {
  return feedbackAgreement.checked;
}

function showError(field) {
  field.error.hidden = false;
  field.success.hidden = true;
  field.control.setAttribute('aria-invalid', 'true');
  field.control.classList.remove('tw-border-line', 'tw-border-accent');
  field.control.classList.add('tw-border-danger');
}

function showSuccess(field) {
  field.error.hidden = true;
  field.success.hidden = false;
  field.success.textContent = 'Коректно';
  field.control.setAttribute('aria-invalid', 'false');
  field.control.classList.remove('tw-border-line', 'tw-border-danger');
  field.control.classList.add('tw-border-accent');
}

function clearError(field) {
  field.error.hidden = true;
  field.success.hidden = true;
  field.control.setAttribute('aria-invalid', 'false');
  field.control.classList.remove('tw-border-danger', 'tw-border-accent');
  field.control.classList.add('tw-border-line');
}

function validateField(field) {
  const isValid = field.validate();
  if (isValid) showSuccess(field);
  else showError(field);
  return isValid;
}

function resetFeedbackUI() {
  touchedFields.clear();
  feedbackFields.forEach(clearError);
  feedbackStatus.textContent = '';
}

feedbackFields.forEach((field) => {
  field.control.addEventListener('blur', () => {
    touchedFields.add(field.control);
    validateField(field);
  });

  field.control.addEventListener('input', () => {
    if (!touchedFields.has(field.control)) return;
    validateField(field);
  });
});

feedbackAgreement.addEventListener('change', () => {
  touchedFields.add(feedbackAgreement);
  validateField(feedbackFields.find((field) => field.control === feedbackAgreement));
});

feedbackForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (feedbackDialog.open) return;

  let firstInvalidField = null;
  feedbackFields.forEach((field) => {
    touchedFields.add(field.control);
    if (!validateField(field) && firstInvalidField === null) {
      firstInvalidField = field;
    }
  });

  if (firstInvalidField) {
    feedbackStatus.textContent = 'Є помилки у формі. Перевірте позначені поля.';
    firstInvalidField.control.focus();
    return;
  }

  feedbackStatus.textContent = '';
  feedbackDialog.showModal();
  feedbackForm.reset();
  resetFeedbackUI();
  feedbackClose.focus();
});

feedbackClose.addEventListener('click', () => {
  feedbackDialog.close();
});

feedbackDialog.addEventListener('click', (event) => {
  if (event.target !== feedbackDialog) return;

  const bounds = feedbackDialog.getBoundingClientRect();
  const isOutsideDialog = event.clientX < bounds.left
    || event.clientX > bounds.right
    || event.clientY < bounds.top
    || event.clientY > bounds.bottom;

  if (isOutsideDialog) feedbackDialog.close();
});

feedbackDialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;

  event.preventDefault();
  feedbackClose.focus();
});

feedbackDialog.addEventListener('close', () => {
  feedbackSubmit.focus();
});

// Власна валідація замінює браузерні повідомлення лише після налаштування всіх обробників.
feedbackForm.noValidate = true;
feedbackSubmit.disabled = false;
