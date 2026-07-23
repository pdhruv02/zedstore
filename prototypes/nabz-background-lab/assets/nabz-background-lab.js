document.body.classList.add('nabz-background-lab-active');
(() => {
  const roots = document.querySelectorAll('[data-nabz-bg-lab]');
  roots.forEach((root) => {
    if (root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';
    const revealItems = root.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => observer.observe(item));
    const stage = root.querySelector('[data-fit-stage]');
    const fitButtons = root.querySelectorAll('[data-fit-control]');
    fitButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const fit = button.dataset.fitControl;
        if (stage) stage.dataset.fit = fit;
        fitButtons.forEach((item) => item.classList.toggle('is-active', item === button));
        root.querySelectorAll('[data-fit-length]').forEach((item) => {
          item.textContent = fit === 'extended' ? '28.5 in' : '27 in';
        });
      });
    });
    const progress = root.querySelector('[data-scroll-progress]');
    const updateProgress = () => {
      if (!progress) return;
      const rect = root.getBoundingClientRect();
      const total = Math.max(1, root.offsetHeight - window.innerHeight);
      const current = Math.min(total, Math.max(0, -rect.top));
      progress.style.transform = `scaleX(${current / total})`;
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
    };
    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
  });
})();