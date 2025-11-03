
const signinBtn = document.getElementById('signinBtn') as HTMLButtonElement | null;
const codeInput = document.getElementById('code') as HTMLInputElement | null;
const msgEl = document.getElementById('message') as HTMLElement | null;
const form = document.getElementById('codeForm') as HTMLFormElement | null;

function setMessage(text: string, color?: string) {
  if (!msgEl) return;
  msgEl.textContent = text;
  msgEl.style.color = color ?? '';
}

if (signinBtn) {
  signinBtn.addEventListener('click', () => {
    // replace with real sign-in navigation
    window.alert('Sign in clicked');
  });
}

function validateCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

if (form && codeInput) {
  form.addEventListener('submit', (event: Event) => {
    event.preventDefault();

    const code = codeInput.value.trim();

    if (!validateCode(code)) {
      setMessage('Please enter exactly 6 digits.', '#b45309');
      codeInput.focus();
      return;
    }

    setMessage('Code accepted — submitting...', '#065f46');

    // simulate server processing (remove when real server flow is implemented)
    window.setTimeout(() => {
      window.alert('Code verified: ' + code);
      setMessage('');
    }, 600);
  });
}

if (codeInput) {
  codeInput.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLInputElement;
    const cleaned = target.value.replace(/\D/g, '').slice(0, 6);
    if (cleaned !== target.value) target.value = cleaned;
  });
}