(() => {
  const removeOriginalHero = () => document.querySelectorAll('.nabz-bg-lab .nabz-bg-hero').forEach((node) => node.remove());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeOriginalHero, { once: true });
  else removeOriginalHero();
  const heroes = document.querySelectorAll('[data-shirt-scroll]');
  if (!heroes.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = (edge0, edge1, value) => {
    const amount = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return amount * amount * (3 - 2 * amount);
  };

  heroes.forEach((hero) => {
    if (hero.dataset.scrollReady === 'true') return;
    hero.dataset.scrollReady = 'true';

    const canvas = hero.querySelector('[data-shirt-canvas]');
    const context = canvas ? canvas.getContext('2d', { alpha: false }) : null;
    const spriteData = hero.querySelector('[data-shirt-sprites]');
    const loadingLabel = hero.querySelector('[data-shirt-loading]');
    const progressBar = hero.querySelector('[data-shirt-progress]');
    const frameLabel = hero.querySelector('[data-shirt-frame]');
    const lines = Array.from(hero.querySelectorAll('[data-shirt-line]'));
    const frameCount = Number(hero.dataset.frameCount || 154);
    const framesPerSheet = Number(hero.dataset.framesPerSheet || 8);
    const sheetColumns = Number(hero.dataset.sheetColumns || 4);
    const sourceWidth = 1280;
    const sourceHeight = 720;

    let sprites = [];
    try {
      sprites = JSON.parse(spriteData?.textContent || '[]');
    } catch (error) {
      hero.classList.add('is-frame-failed');
      return;
    }

    const sheetCache = new Map();
    let targetProgress = reduceMotion ? 1 : 0;
    let renderedProgress = targetProgress;
    let requestedFrame = reduceMotion ? frameCount - 1 : 0;
    let drawnFrame = -1;
    let rafId = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;

    const getPositionX = () => {
      if (window.innerWidth <= 520) return 0.31;
      if (window.innerWidth <= 900) return 0.34;
      return 0.5;
    };

    const resizeCanvas = () => {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
      let width = Math.max(1, Math.round(rect.width * ratio));
      let height = Math.max(1, Math.round(rect.height * ratio));
      const maxDimension = 1800;
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      if (width === canvasWidth && height === canvasHeight) return;
      canvasWidth = width;
      canvasHeight = height;
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      if (drawnFrame >= 0) drawFrame(drawnFrame, true);
    };

    const loadSheet = (sheetIndex) => {
      if (sheetIndex < 0 || sheetIndex >= sprites.length) return Promise.reject(new Error('Sheet out of range'));
      const existing = sheetCache.get(sheetIndex);
      if (existing?.status === 'loaded') return Promise.resolve(existing.image);
      if (existing?.promise) return existing.promise;

      const image = new Image();
      image.decoding = 'async';
      image.crossOrigin = 'anonymous';
      const entry = { image, status: 'loading', promise: null, usedAt: performance.now() };
      entry.promise = new Promise((resolve, reject) => {
        image.onload = () => {
          entry.status = 'loaded';
          entry.usedAt = performance.now();
          resolve(image);
        };
        image.onerror = () => {
          entry.status = 'failed';
          reject(new Error(`Unable to load sheet ${sheetIndex + 1}`));
        };
      });
      image.src = sprites[sheetIndex].url;
      sheetCache.set(sheetIndex, entry);
      return entry.promise;
    };

    const releaseDistantSheets = (activeSheet) => {
      sheetCache.forEach((entry, index) => {
        if (Math.abs(index - activeSheet) <= 1 || entry.status === 'loading') return;
        entry.image.onload = null;
        entry.image.onerror = null;
        entry.image.src = '';
        sheetCache.delete(index);
      });
    };

    const drawFrame = (frameIndex, force = false) => {
      if (!canvas || !context || !sprites.length) return;
      const safeFrame = Math.min(frameCount - 1, Math.max(0, frameIndex));
      if (!force && safeFrame === drawnFrame) return;

      requestedFrame = safeFrame;
      const sheetIndex = Math.floor(safeFrame / framesPerSheet);
      const localFrame = safeFrame % framesPerSheet;

      loadSheet(sheetIndex).then((image) => {
        if (requestedFrame !== safeFrame && !force) return;
        if (!canvasWidth || !canvasHeight) resizeCanvas();

        const sx = (localFrame % sheetColumns) * sourceWidth;
        const sy = Math.floor(localFrame / sheetColumns) * sourceHeight;
        const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        const dx = (canvasWidth - drawWidth) * getPositionX();
        const dy = (canvasHeight - drawHeight) * 0.5;

        context.fillStyle = '#d7d0c9';
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(image, sx, sy, sourceWidth, sourceHeight, dx, dy, drawWidth, drawHeight);
        drawnFrame = safeFrame;
        hero.classList.add('is-frame-ready');
        hero.classList.remove('is-frame-loading');
        if (loadingLabel) loadingLabel.setAttribute('hidden', '');

        const nearEnd = localFrame >= framesPerSheet - 3;
        const nearStart = localFrame <= 2;
        if (nearEnd && sheetIndex + 1 < sprites.length) loadSheet(sheetIndex + 1).catch(() => {});
        if (nearStart && sheetIndex - 1 >= 0) loadSheet(sheetIndex - 1).catch(() => {});
        releaseDistantSheets(sheetIndex);
      }).catch(() => {
        hero.classList.add('is-frame-failed');
        hero.classList.remove('is-frame-loading');
      });
    };

    const updateTarget = () => {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
      targetProgress = reduceMotion ? 1 : clamp(-rect.top / travel);
      if (!rafId) rafId = requestAnimationFrame(render);
    };

    const renderLine = (line, index, progress) => {
      const centers = [0.12, 0.48, 0.82];
      const widths = [0.23, 0.26, 0.31];
      const center = centers[index] ?? 0.82;
      const width = widths[index] ?? 0.28;
      const distance = Math.abs(progress - center);
      const alpha = clamp(1 - distance / width);
      const easedAlpha = smoothstep(0, 1, alpha);
      const direction = progress < center ? 1 : -1;
      const offset = direction * (1 - easedAlpha) * 34;
      const blur = (1 - easedAlpha) * 8;
      const scale = 0.985 + easedAlpha * 0.015;

      line.style.opacity = easedAlpha.toFixed(3);
      line.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      line.style.filter = `blur(${blur.toFixed(2)}px)`;
    };

    const render = () => {
      rafId = 0;
      const difference = targetProgress - renderedProgress;
      renderedProgress += difference * (reduceMotion ? 1 : 0.22);
      if (Math.abs(difference) < 0.0005) renderedProgress = targetProgress;

      const progress = clamp(renderedProgress);
      const frame = Math.min(frameCount - 1, Math.max(0, Math.round(progress * (frameCount - 1))));
      drawFrame(frame);

      if (progressBar) progressBar.style.transform = `scaleX(${progress.toFixed(4)})`;
      if (frameLabel) frameLabel.textContent = `${String(frame + 1).padStart(3, '0')} / ${frameCount}`;

      lines.forEach((line, index) => renderLine(line, index, progress));
      hero.classList.toggle('is-started', progress > 0.04);
      hero.classList.toggle('is-complete', progress > 0.84);
      hero.style.setProperty('--shirt-scroll-progress', progress.toFixed(4));

      if (Math.abs(targetProgress - renderedProgress) > 0.0005) rafId = requestAnimationFrame(render);
    };

    let scrollTicking = false;
    const onScroll = () => {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(() => {
        scrollTicking = false;
        updateTarget();
      });
    };

    const onResize = () => {
      resizeCanvas();
      updateTarget();
    };

    hero.classList.add('is-frame-loading');
    resizeCanvas();
    loadSheet(reduceMotion ? sprites.length - 1 : 0)
      .then(() => drawFrame(reduceMotion ? frameCount - 1 : 0, true))
      .catch(() => hero.classList.add('is-frame-failed'));

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    updateTarget();
  });
})();
