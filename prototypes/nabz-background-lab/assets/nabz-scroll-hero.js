(() => {
  const FRAME_WIDTH = 1280;
  const FRAME_HEIGHT = 720;
  const MAX_CACHED_SHEETS = 5;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = (edge0, edge1, value) => {
    const amount = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return amount * amount * (3 - 2 * amount);
  };

  const removeOriginalHero = () => {
    document.querySelectorAll('.nabz-bg-lab .nabz-bg-hero').forEach((node) => node.remove());
  };

  const initHero = (hero) => {
    if (!hero || hero.dataset.scrollReady === 'true') return;

    const canvas = hero.querySelector('[data-shirt-canvas]');
    const context = canvas?.getContext('2d', { alpha: false });
    const spriteData = hero.querySelector('[data-shirt-sprites]');
    const loadingLabel = hero.querySelector('[data-shirt-loading]');
    const progressBar = hero.querySelector('[data-shirt-progress]');
    const frameLabel = hero.querySelector('[data-shirt-frame]');
    const lines = Array.from(hero.querySelectorAll('[data-shirt-line]'));

    if (!canvas || !context || !spriteData) {
      hero.classList.add('is-frame-failed');
      return;
    }

    let sprites;
    try {
      sprites = JSON.parse(spriteData.textContent || '[]');
    } catch (error) {
      hero.classList.add('is-frame-failed');
      return;
    }

    if (!Array.isArray(sprites) || !sprites.length) {
      hero.classList.add('is-frame-failed');
      return;
    }

    hero.dataset.scrollReady = 'true';
    hero.classList.add('is-frame-loading');

    const frameCount = Number(hero.dataset.frameCount || 154);
    const framesPerSheet = Number(hero.dataset.framesPerSheet || 8);
    const sheetColumns = Number(hero.dataset.sheetColumns || 4);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sheetCache = new Map();

    let requestedFrame = 0;
    let drawnFrame = -1;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let scrollRaf = 0;
    let resizeRaf = 0;

    const modelPositionX = () => {
      if (window.innerWidth <= 520) return 0.31;
      if (window.innerWidth <= 900) return 0.34;
      return 0.5;
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      let nextWidth = Math.max(1, Math.round(rect.width * pixelRatio));
      let nextHeight = Math.max(1, Math.round(rect.height * pixelRatio));
      const maxDimension = 1800;
      const scaleDown = Math.min(1, maxDimension / Math.max(nextWidth, nextHeight));
      nextWidth = Math.max(1, Math.round(nextWidth * scaleDown));
      nextHeight = Math.max(1, Math.round(nextHeight * scaleDown));

      if (nextWidth === canvasWidth && nextHeight === canvasHeight) return;

      canvasWidth = nextWidth;
      canvasHeight = nextHeight;
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      drawnFrame = -1;
      requestFrame(requestedFrame, true);
    };

    const pruneCache = (activeSheet) => {
      if (sheetCache.size <= MAX_CACHED_SHEETS) return;

      const removable = Array.from(sheetCache.entries())
        .filter(([index, entry]) => entry.status === 'loaded' && Math.abs(index - activeSheet) > 1)
        .sort((a, b) => a[1].usedAt - b[1].usedAt);

      while (sheetCache.size > MAX_CACHED_SHEETS && removable.length) {
        const [index, entry] = removable.shift();
        entry.image.onload = null;
        entry.image.onerror = null;
        entry.image.src = '';
        sheetCache.delete(index);
      }
    };

    const loadSheet = (sheetIndex) => {
      if (sheetIndex < 0 || sheetIndex >= sprites.length) {
        return Promise.reject(new Error('Sheet index out of range'));
      }

      const cached = sheetCache.get(sheetIndex);
      if (cached?.status === 'loaded') {
        cached.usedAt = performance.now();
        return Promise.resolve(cached.image);
      }
      if (cached?.promise) return cached.promise;

      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = sheetIndex <= 1 ? 'high' : 'auto';

      const entry = {
        image,
        status: 'loading',
        usedAt: performance.now(),
        promise: null
      };

      entry.promise = new Promise((resolve, reject) => {
        image.onload = () => {
          entry.status = 'loaded';
          entry.usedAt = performance.now();
          resolve(image);
        };
        image.onerror = () => {
          entry.status = 'failed';
          sheetCache.delete(sheetIndex);
          reject(new Error(`Unable to load frame sheet ${sheetIndex + 1}`));
        };
      });

      image.src = sprites[sheetIndex].url;
      sheetCache.set(sheetIndex, entry);
      return entry.promise;
    };

    const drawLoadedFrame = (frameIndex, image) => {
      const safeFrame = Math.min(frameCount - 1, Math.max(0, frameIndex));
      const localFrame = safeFrame % framesPerSheet;
      const sourceX = (localFrame % sheetColumns) * FRAME_WIDTH;
      const sourceY = Math.floor(localFrame / sheetColumns) * FRAME_HEIGHT;
      const coverScale = Math.max(canvasWidth / FRAME_WIDTH, canvasHeight / FRAME_HEIGHT);
      const drawWidth = FRAME_WIDTH * coverScale;
      const drawHeight = FRAME_HEIGHT * coverScale;
      const drawX = (canvasWidth - drawWidth) * modelPositionX();
      const drawY = (canvasHeight - drawHeight) * 0.5;

      context.fillStyle = '#d7d0c9';
      context.fillRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(image, sourceX, sourceY, FRAME_WIDTH, FRAME_HEIGHT, drawX, drawY, drawWidth, drawHeight);

      drawnFrame = safeFrame;
      hero.classList.add('is-frame-ready');
      hero.classList.remove('is-frame-loading', 'is-frame-failed');
      if (loadingLabel) loadingLabel.hidden = true;
    };

    function requestFrame(frameIndex, force = false) {
      const safeFrame = Math.min(frameCount - 1, Math.max(0, frameIndex));
      requestedFrame = safeFrame;
      if (!force && safeFrame === drawnFrame) return;

      const sheetIndex = Math.floor(safeFrame / framesPerSheet);
      loadSheet(sheetIndex)
        .then((image) => {
          const latestSheet = Math.floor(requestedFrame / framesPerSheet);
          if (latestSheet !== sheetIndex) {
            requestFrame(requestedFrame, true);
            return;
          }

          drawLoadedFrame(requestedFrame, image);
          pruneCache(sheetIndex);

          const localFrame = requestedFrame % framesPerSheet;
          if (localFrame >= framesPerSheet - 3) loadSheet(sheetIndex + 1).catch(() => {});
          if (localFrame <= 2) loadSheet(sheetIndex - 1).catch(() => {});
        })
        .catch(() => {
          hero.classList.add('is-frame-failed');
          hero.classList.remove('is-frame-loading');
          if (loadingLabel) loadingLabel.hidden = true;
        });
    }

    const renderCopy = (progress) => {
      const centers = [0.12, 0.48, 0.82];
      const widths = [0.23, 0.26, 0.31];

      lines.forEach((line, index) => {
        const center = centers[index] ?? 0.82;
        const width = widths[index] ?? 0.28;
        const alpha = smoothstep(0, 1, clamp(1 - Math.abs(progress - center) / width));
        const direction = progress < center ? 1 : -1;
        const offset = reduceMotion ? 0 : direction * (1 - alpha) * 34;
        const blur = reduceMotion ? 0 : (1 - alpha) * 8;
        const scale = reduceMotion ? 1 : 0.985 + alpha * 0.015;

        line.style.opacity = alpha.toFixed(3);
        line.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        line.style.filter = `blur(${blur.toFixed(2)}px)`;
      });
    };

    const updateFromScroll = () => {
      scrollRaf = 0;
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      const frame = Math.round(progress * (frameCount - 1));

      requestFrame(frame);
      renderCopy(progress);

      if (progressBar) progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (frameLabel) frameLabel.textContent = `${String(frame + 1).padStart(3, '0')} / ${frameCount}`;
      hero.classList.toggle('is-started', progress > 0.04);
      hero.classList.toggle('is-complete', progress > 0.84);
      hero.style.setProperty('--shirt-scroll-progress', progress.toFixed(4));
    };

    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(updateFromScroll);
    };

    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resizeCanvas();
        updateFromScroll();
      });
    };

    resizeCanvas();
    updateFromScroll();
    loadSheet(0).catch(() => {});
    loadSheet(1).catch(() => {});

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pageshow', updateFromScroll, { passive: true });
  };

  const boot = (scope = document) => {
    removeOriginalHero();
    scope.querySelectorAll?.('[data-shirt-scroll]').forEach(initHero);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => boot(event.target));
  window.addEventListener('pageshow', () => boot());
})();
