(() => {
  const root = document.querySelector('[data-nabz-production]');
  if (!root || root.dataset.productionReady === 'true') return;
  root.dataset.productionReady = 'true';

  const loader = root.querySelector('[data-nabz-loader]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forceFullLoader = new URLSearchParams(window.location.search).get('loader') === '1';

  let hasSeenLoader = false;
  try {
    hasSeenLoader = sessionStorage.getItem('nabz-loader-seen') === 'true';
  } catch (error) {
    hasSeenLoader = false;
  }

  const finishLoader = () => {
    document.documentElement.classList.remove('nabz-is-loading');
    if (!loader) return;
    loader.classList.add('is-finished');
    window.setTimeout(() => loader.remove(), 1100);
  };

  const runLoader = () => {
    if (!loader || reduceMotion) {
      if (loader) {
        loader.classList.add('is-stitched', 'is-opening');
      }
      window.setTimeout(finishLoader, reduceMotion ? 80 : 180);
      return;
    }

    const thread = loader.querySelector('[data-loader-thread]');
    const needle = loader.querySelector('[data-loader-needle]');
    const needleGlow = loader.querySelector('[data-loader-needle-glow]');
    const logo = loader.querySelector('[data-loader-logo]');

    if (!thread || !needle || !needleGlow || !logo) {
      finishLoader();
      return;
    }

    const fullExperience = forceFullLoader || !hasSeenLoader;
    const stitchDuration = fullExperience ? 2050 : 720;
    const settleDuration = fullExperience ? 320 : 120;
    const openDuration = fullExperience ? 940 : 620;
    const length = thread.getTotalLength();

    thread.style.strokeDasharray = `${length}`;
    thread.style.strokeDashoffset = `${length}`;
    loader.classList.toggle('is-returning', !fullExperience);

    const startedAt = performance.now();

    const stitch = (now) => {
      const rawProgress = Math.min(1, (now - startedAt) / stitchDuration);
      const progress = 1 - Math.pow(1 - rawProgress, 3);
      const point = thread.getPointAtLength(length * progress);

      thread.style.strokeDashoffset = `${length * (1 - progress)}`;
      needle.setAttribute('cx', point.x.toFixed(2));
      needle.setAttribute('cy', point.y.toFixed(2));
      needleGlow.setAttribute('cx', point.x.toFixed(2));
      needleGlow.setAttribute('cy', point.y.toFixed(2));
      logo.style.clipPath = `inset(0 ${(100 - progress * 100).toFixed(2)}% 0 0)`;

      if (rawProgress < 1) {
        requestAnimationFrame(stitch);
        return;
      }

      loader.classList.add('is-stitched');

      try {
        sessionStorage.setItem('nabz-loader-seen', 'true');
      } catch (error) {
        // The loader still works when storage is unavailable.
      }

      window.setTimeout(() => {
        loader.classList.add('is-opening');
        document.documentElement.classList.remove('nabz-is-loading');
        window.setTimeout(finishLoader, openDuration);
      }, settleDuration);
    };

    requestAnimationFrame(stitch);
  };

  let loaderStarted = false;
  const startWhenReady = () => {
    if (loaderStarted) return;
    loaderStarted = true;
    requestAnimationFrame(() => requestAnimationFrame(runLoader));
  };

  if (document.readyState === 'complete') {
    startWhenReady();
  } else {
    window.addEventListener('load', startWhenReady, { once: true });
    window.setTimeout(startWhenReady, 1200);
  }

  window.setTimeout(() => {
    if (document.documentElement.classList.contains('nabz-is-loading')) {
      finishLoader();
    }
  }, 5200);

  root.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  const nav = root.querySelector('.nabz-bg-nav');
  let navTicking = false;
  const updateNav = () => {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 32);
    navTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(updateNav);
  }, { passive: true });

  updateNav();
})();
