(() => {
  'use strict';

  const ROOT_CLASS = 'nabz-scroll-ready';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopRail = window.matchMedia('(min-width: 900px)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  class NabzScrollExperience {
    constructor() {
      this.raf = 0;
      this.lastY = window.scrollY;
      this.lastDirectionY = window.scrollY;
      this.hero = null;
      this.horizontal = [];
      this.parallax = [];
      this.cinematics = [];
      this.progressFill = null;
      this.progressDot = null;
      this.revealObserver = null;
      this.resizeObserver = null;
      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
      this.tick = this.tick.bind(this);
      this.refresh = this.refresh.bind(this);
    }

    init() {
      document.documentElement.classList.add(ROOT_CLASS);
      this.bindGlobalEvents();
      this.refresh();
      this.tick();
    }

    bindGlobalEvents() {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      window.addEventListener('load', this.refresh, { once: true });
      document.addEventListener('shopify:section:load', this.refresh);
      document.addEventListener('shopify:section:reorder', this.refresh);
      desktopRail.addEventListener?.('change', this.refresh);
      reducedMotion.addEventListener?.('change', this.refresh);
    }

    refresh() {
      this.hero = document.querySelector('[data-nabz-hero]');
      this.parallax = Array.from(document.querySelectorAll('[data-nabz-parallax]'));
      this.cinematics = Array.from(document.querySelectorAll('[data-nabz-cinematic]'));
      this.progressFill = document.querySelector('.nabz-scroll-seam__fill');
      this.progressDot = document.querySelector('.nabz-scroll-seam__dot');
      this.setupReveals();
      this.setupHorizontalSections();
      this.requestTick();
    }

    setupReveals() {
      this.revealObserver?.disconnect();
      const items = Array.from(document.querySelectorAll('[data-nabz-reveal]'));

      if (reducedMotion.matches || !('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('is-visible'));
        return;
      }

      this.revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.revealObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.14,
        rootMargin: '0px 0px -10% 0px'
      });

      items.forEach((item) => {
        if (!item.classList.contains('is-visible')) this.revealObserver.observe(item);
      });
    }

    setupHorizontalSections() {
      this.resizeObserver?.disconnect();
      this.horizontal = Array.from(document.querySelectorAll('[data-nabz-horizontal]')).map((section) => ({
        section,
        viewport: section.querySelector('[data-nabz-horizontal-viewport]'),
        track: section.querySelector('[data-nabz-horizontal-track]'),
        cards: Array.from(section.querySelectorAll('[data-nabz-horizontal-card]')),
        travel: 0
      })).filter((item) => item.viewport && item.track);

      const measure = () => {
        this.horizontal.forEach((item) => {
          if (!desktopRail.matches || reducedMotion.matches) {
            item.section.style.removeProperty('height');
            item.track.style.removeProperty('transform');
            item.travel = 0;
            item.cards.forEach((card) => card.style.removeProperty('--card-focus'));
            return;
          }

          item.travel = Math.max(0, item.track.scrollWidth - item.viewport.clientWidth);
          item.section.style.height = `${Math.ceil(window.innerHeight + item.travel + window.innerHeight * 0.18)}px`;
        });
        this.requestTick();
      };

      measure();
      if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(measure);
        this.horizontal.forEach((item) => {
          this.resizeObserver.observe(item.track);
          this.resizeObserver.observe(item.viewport);
        });
      }
    }

    onScroll() {
      this.requestTick();
    }

    onResize() {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(this.refresh, 120);
    }

    requestTick() {
      if (!this.raf) this.raf = window.requestAnimationFrame(this.tick);
    }

    tick() {
      this.raf = 0;
      const y = window.scrollY;
      this.updateHeader(y);
      this.updateDocumentProgress(y);

      if (!reducedMotion.matches) {
        this.updateHero();
        this.updateHorizontal();
        this.updateParallax();
        this.updateCinematics();
      }

      this.lastY = y;
    }

    updateHeader(y) {
      document.body.classList.toggle('nabz-scrolled', y > 24);
      const delta = y - this.lastDirectionY;

      if (Math.abs(delta) > 10) {
        const scrollingDown = delta > 0;
        document.body.classList.toggle('nabz-header-hidden', scrollingDown && y > 180);
        this.lastDirectionY = y;
      }

      if (y < 80) document.body.classList.remove('nabz-header-hidden');
    }

    updateDocumentProgress(y) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(y / max);
      document.documentElement.style.setProperty('--nabz-progress', progress.toFixed(4));
      if (this.progressFill) this.progressFill.style.setProperty('--nabz-progress', progress.toFixed(4));
      if (this.progressDot) this.progressDot.style.setProperty('--nabz-progress', progress.toFixed(4));
    }

    updateHero() {
      if (!this.hero) return;
      const rect = this.hero.getBoundingClientRect();
      const distance = Math.max(1, this.hero.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / distance);
      this.hero.style.setProperty('--nabz-hero-progress', progress.toFixed(4));
    }

    updateHorizontal() {
      if (!desktopRail.matches) return;

      this.horizontal.forEach((item) => {
        const rect = item.section.getBoundingClientRect();
        const distance = Math.max(1, item.section.offsetHeight - window.innerHeight);
        const progress = clamp(-rect.top / distance);
        const x = item.travel * progress;
        item.track.style.transform = `translate3d(${-x.toFixed(2)}px, 0, 0)`;

        const viewportCenter = window.innerWidth / 2;
        item.cards.forEach((card) => {
          const cardRect = card.getBoundingClientRect();
          const cardCenter = cardRect.left + cardRect.width / 2;
          const focus = clamp(1 - Math.abs(cardCenter - viewportCenter) / (window.innerWidth * .62));
          card.style.setProperty('--card-focus', focus.toFixed(3));
        });
      });
    }

    updateParallax() {
      const viewportCenter = window.innerHeight / 2;
      this.parallax.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -window.innerHeight || rect.top > window.innerHeight * 2) return;
        const factor = Number.parseFloat(element.dataset.nabzParallax || '0.08');
        const center = rect.top + rect.height / 2;
        const offset = clamp((viewportCenter - center) * factor, -90, 90);
        element.style.setProperty('--nabz-parallax', `${offset.toFixed(2)}px`);
      });
    }

    updateCinematics() {
      this.cinematics.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.max(1, section.offsetHeight - window.innerHeight);
        const progress = clamp(-rect.top / distance);
        section.style.setProperty('--nabz-cinematic-progress', progress.toFixed(4));
      });
    }
  }

  const boot = () => {
    if (!document.querySelector('.nabz-home-marker')) return;
    if (window.__nabzScrollExperience) {
      window.__nabzScrollExperience.refresh();
      return;
    }
    window.__nabzScrollExperience = new NabzScrollExperience();
    window.__nabzScrollExperience.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
