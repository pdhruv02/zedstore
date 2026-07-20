(() => {
  const start = () => {
    const root = document.querySelector('[data-ntd-root]');
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loader = root.querySelector('[data-loader]');
    const seen = sessionStorage.getItem('nabz-intro-seen') === '1';
    const closeLoader = () => {
      loader?.classList.add('is-done');
      document.documentElement.classList.add('nabz-loaded');
      sessionStorage.setItem('nabz-intro-seen', '1');
    };
    window.setTimeout(closeLoader, reduce || seen ? 120 : 1280);

    const header = root.querySelector('[data-header]');
    const hero = root.querySelector('[data-hero]');
    let ticking = false;
    const renderScroll = () => {
      ticking = false;
      const y = window.scrollY;
      header?.classList.toggle('is-solid', y > 48);
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const range = Math.max(1, hero.offsetHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -rect.top / range));
        hero.style.setProperty('--hero-progress', progress.toFixed(3));
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(renderScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    renderScroll();

    const stage = root.querySelector('[data-surface-stage]');
    const tabs = [...root.querySelectorAll('[data-surface-tab]')];
    const images = [...root.querySelectorAll('[data-surface-image]')];
    const indexLabel = root.querySelector('[data-surface-index]');
    const title = root.querySelector('[data-surface-title]');
    const copy = root.querySelector('[data-surface-copy]');
    const states = [
      ['Quiet from afar.', 'The full composition reads cleanly before the individual stitches reveal themselves.'],
      ['A line with memory.', 'The stitch travels across the shirt as structure, not as a motif placed on top.'],
      ['Air inside the cloth.', 'Open work creates light, depth, and a surface that changes as the body moves.'],
      ['Work you can feel.', 'Thread relief gives the shirt its second reading when the viewer comes closer.']
    ];
    let activeSurface = 0;
    const setSurface = (value) => {
      const next = Math.max(0, Math.min(3, Number(value)));
      activeSurface = next;
      images.forEach((image, i) => image.classList.toggle('is-active', i === next));
      tabs.forEach((tab, i) => {
        const active = i === next;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      if (indexLabel) indexLabel.textContent = `${String(next + 1).padStart(2, '0')} / 04`;
      if (title) title.textContent = states[next][0];
      if (copy) copy.textContent = states[next][1];
    };
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => setSurface(tab.dataset.surfaceTab));
      tab.addEventListener('mouseenter', () => setSurface(tab.dataset.surfaceTab));
    });
    stage?.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = stage.getBoundingClientRect();
      const ratio = Math.min(.999, Math.max(0, (event.clientX - rect.left) / rect.width));
      stage.style.setProperty('--surface-x', `${ratio * 100}%`);
      setSurface(Math.floor(ratio * 4));
    });
    stage?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); setSurface((activeSurface + 1) % 4); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setSurface((activeSurface + 3) % 4); }
    });

    const fitData = {
      'S-Standard': { inches: 26.75, width: .92, height: .985, copy: 'S room with a cleaner, shorter untucked proportion.' },
      'M-Standard': { inches: 27, width: 1, height: 1, copy: 'M room with a cleaner, shorter untucked proportion.' },
      'M-Extended': { inches: 28.5, width: 1, height: 1.055, copy: 'The same M room with added body and sleeve length.' },
      'L-Standard': { inches: 27.75, width: 1.07, height: 1.028, copy: 'L room with a cleaner, shorter untucked proportion.' },
      'L-Extended': { inches: 29.25, width: 1.07, height: 1.084, copy: 'The same L room with added body and sleeve length.' },
      'XL-Standard': { inches: 28.5, width: 1.14, height: 1.055, copy: 'XL room with a cleaner untucked proportion.' }
    };
    const frame = root.querySelector('[data-fit-frame]');
    const shirt = root.querySelector('[data-fit-shirt]');
    const measure = root.querySelector('[data-fit-measure]');
    const name = root.querySelector('[data-fit-name]');
    const length = root.querySelector('[data-fit-length]');
    const description = root.querySelector('[data-fit-description]');
    const availability = root.querySelector('[data-fit-availability]');
    const sizeButtons = [...root.querySelectorAll('[data-size]')];
    const lengthButtons = [...root.querySelectorAll('[data-length]')];
    const comparison = root.querySelector('[data-compare]');
    const compareStandard = root.querySelector('[data-compare-standard]');
    const compareExtended = root.querySelector('[data-compare-extended]');
    const compareLayer = root.querySelector('[data-compare-layer]');
    const compareHandle = root.querySelector('[data-compare-handle]');
    const compareRange = root.querySelector('[data-compare-range]');
    let selectedSize = 'M';
    let selectedLength = 'Standard';
    const format = (value) => Number.isInteger(value) ? String(value) : String(value).replace(/0+$/, '');

    const renderFit = () => {
      const canExtend = selectedSize === 'M' || selectedSize === 'L';
      const extendedButton = lengthButtons.find((button) => button.dataset.length === 'Extended');
      extendedButton?.classList.toggle('is-unavailable', !canExtend);
      extendedButton?.setAttribute('aria-disabled', String(!canExtend));
      if (!canExtend && selectedLength === 'Extended') selectedLength = 'Standard';
      const state = fitData[`${selectedSize}-${selectedLength}`];
      if (!state) return;

      sizeButtons.forEach((button) => {
        const active = button.dataset.size === selectedSize;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      lengthButtons.forEach((button) => {
        const active = button.dataset.length === selectedLength;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      frame?.style.setProperty('--fit-width', state.width);
      frame?.style.setProperty('--fit-height', state.height);
      if (shirt) shirt.alt = `NABZ shirt silhouette in ${selectedSize} ${selectedLength}`;
      if (measure) measure.textContent = `${format(state.inches)} in`;
      if (name) name.textContent = `${selectedSize} ${selectedLength}`;
      if (length) length.textContent = `${format(state.inches)} inches`;
      if (description) description.textContent = state.copy;
      if (availability) availability.textContent = canExtend ? '' : `${selectedSize} is currently available in Standard.`;

      comparison?.classList.toggle('is-hidden', !canExtend);
      if (canExtend) {
        const standard = fitData[`${selectedSize}-Standard`];
        const extended = fitData[`${selectedSize}-Extended`];
        compareStandard?.style.setProperty('--compare-width', standard.width);
        compareStandard?.style.setProperty('--compare-height', standard.height);
        compareExtended?.style.setProperty('--compare-width', extended.width);
        compareExtended?.style.setProperty('--compare-height', extended.height);
      }
    };
    sizeButtons.forEach((button) => button.addEventListener('click', () => { selectedSize = button.dataset.size; renderFit(); }));
    lengthButtons.forEach((button) => button.addEventListener('click', () => {
      const requested = button.dataset.length;
      if (requested === 'Extended' && selectedSize !== 'M' && selectedSize !== 'L') {
        if (availability) availability.textContent = `${selectedSize} is currently available in Standard.`;
        return;
      }
      selectedLength = requested;
      renderFit();
    }));
    const updateCompare = () => {
      const value = Number(compareRange?.value || 50);
      if (compareLayer) compareLayer.style.width = `${value}%`;
      if (compareHandle) compareHandle.style.left = `${value}%`;
      if (compareExtended) {
        const stageWidth = comparison?.querySelector('.ntd-compare__stage')?.clientWidth;
        if (stageWidth) compareExtended.style.width = `${stageWidth}px`;
      }
    };
    compareRange?.addEventListener('input', updateCompare);
    window.addEventListener('resize', updateCompare, { passive: true });
    renderFit();
    updateCompare();

    const crescendo = root.querySelector('[data-crescendo]');
    if ('IntersectionObserver' in window && crescendo) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-visible', entry.isIntersecting));
      }, { threshold: .28 });
      observer.observe(crescendo);
    } else crescendo?.classList.add('is-visible');

    const seam = root.querySelector('[data-page-seam]');
    root.querySelectorAll('[data-seam-link]').forEach((link) => link.addEventListener('click', (event) => {
      if (reduce || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      seam?.classList.add('is-active');
      window.setTimeout(() => { window.location.href = link.href; }, 340);
    }));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
