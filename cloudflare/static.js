(() => {
  const form = document.querySelector('[data-static-contact]');
  if (!form) return;

  const status = form.querySelector('[data-contact-status]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (status) {
      status.hidden = false;
      status.textContent = 'Message sending is being connected. Please check back shortly.';
    }
  });
})();
