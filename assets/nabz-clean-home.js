(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
  const formatLength = (value) => `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}"`;

  const bootEntry = () => {
    const entry = document.querySelector('[data-nabz-entry]');
    if (!entry || entry.dataset.nabzReady === 'true') return;
    entry.dataset.nabzReady = 'true';

    let completed = false;
    let fallbackTimer = 0;
    const inputEvents = ['touchstart', 'pointerdown'];

    const finish = () => {
      if (completed) return;
      completed = true;
      window.clearTimeout(fallbackTimer);
      inputEvents.forEach((eventName) => window.removeEventListener(eventName, finish, true));
      window.removeEventListener('scroll', finish, true);
      window.removeEventListener('keydown', finish, true);
      entry.classList.add('is-finished');
      window.requestAnimationFrame(() => entry.remove());
      document.dispatchEvent(new CustomEvent('nabz:intro-complete'));
    };

    entry.addEventListener('animationend', (event) => {
      if (event.target === entry && event.animationName === 'nabz-entry-release') finish();
    });

    inputEvents.forEach((eventName) => window.addEventListener(eventName, finish, { capture: true, passive: true, once: true }));
    window.addEventListener('scroll', finish, { capture: true, passive: true, once: true });
    window.addEventListener('keydown', finish, { capture: true, once: true });
    fallbackTimer = window.setTimeout(finish, reducedMotion ? 520 : 2350);
  };

  const bootProductGallery = (root) => {
    root.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
      if (gallery.dataset.nabzReady === 'true') return;
      gallery.dataset.nabzReady = 'true';

      const panels = [...gallery.querySelectorAll('[data-product-panel]')];
      if (!panels.length) return;

      const activate = (selected) => {
        panels.forEach((panel) => {
          const active = panel === selected;
          panel.classList.toggle('is-active', active);
          panel.setAttribute('aria-pressed', String(active));
        });
      };

      panels.forEach((panel) => {
        panel.addEventListener('click', () => activate(panel));
        panel.addEventListener('focus', () => activate(panel));
        panel.addEventListener('pointerenter', () => {
          if (window.matchMedia('(hover: hover)').matches) activate(panel);
        });
        panel.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const nextIndex = (panels.indexOf(panel) + direction + panels.length) % panels.length;
          panels[nextIndex].focus();
        });
      });
    });
  };

  const bootFitStory = (root) => {
    root.querySelectorAll('[data-fit-story]').forEach((story) => {
      if (story.dataset.nabzReady === 'true') return;
      story.dataset.nabzReady = 'true';

      const problem = story.querySelector('[data-fit-story-state="problem"]');
      const solution = story.querySelector('[data-fit-story-state="solution"]');
      if (!problem || !solution) return;

      const show = (target, departing) => {
        departing.classList.add('is-leaving');
        departing.classList.remove('is-active');
        departing.setAttribute('aria-hidden', 'true');
        target.classList.remove('is-leaving');
        target.classList.add('is-active');
        target.setAttribute('aria-hidden', 'false');
        if ('inert' in departing) departing.inert = true;
        if ('inert' in target) target.inert = false;
      };

      story.querySelector('[data-fit-story-next]')?.addEventListener('click', () => show(solution, problem));
      story.querySelector('[data-fit-story-back]')?.addEventListener('click', () => show(problem, solution));
    });
  };

  const bootFitSelector = (root) => {
    root.querySelectorAll('[data-fit-selector]').forEach((selector) => {
      if (selector.dataset.nabzReady === 'true') return;
      selector.dataset.nabzReady = 'true';

      const dataNode = selector.querySelector('[data-fit-data]');
      const fitLayout = selector.closest('.nabz-fit');
      if (!dataNode || !fitLayout) return;

      const values = JSON.parse(dataNode.textContent);
      const sizes = Object.keys(values);
      const sizeButtons = [...selector.querySelectorAll('[data-size]')];
      const lengthButtons = [...selector.querySelectorAll('[data-length]')];
      const output = selector.querySelector('[data-fit-output]');
      const tableBody = fitLayout.querySelector('[data-fit-table-body]');
      const outline = selector.querySelector('[data-shirt-outline]');
      const shadow = selector.querySelector('[data-shirt-shadow]');
      const grain = selector.querySelector('[data-shirt-grain]');
      const yoke = selector.querySelector('[data-shirt-yoke]');
      const armholes = selector.querySelector('[data-shirt-armholes]');
      const sleeveSeams = selector.querySelector('[data-shirt-sleeve-seams]');
      const placket = selector.querySelector('[data-shirt-placket]');
      const pocket = selector.querySelector('[data-shirt-pocket]');
      const pocketFlap = selector.querySelector('[data-shirt-pocket-flap]');
      const buttons = selector.querySelector('[data-shirt-buttons]');
      const hem = selector.querySelector('[data-shirt-hem]');
      const guideTop = selector.querySelector('[data-shirt-guide-top]');
      const guideBottom = selector.querySelector('[data-shirt-guide-bottom]');
      const measure = selector.querySelector('[data-shirt-measure]');
      const measureText = selector.querySelector('[data-shirt-measure-text]');

      if (!output || !tableBody || !outline || !shadow || !grain || !yoke || !armholes || !sleeveSeams || !placket || !pocket || !pocketFlap || !buttons || !hem || !guideTop || !guideBottom || !measure || !measureText) return;

      let size = 'M';
      let length = 'Standard';
      let currentWidth = values.M.width;
      let currentHem = 321;
      let animationFrame = 0;

      tableBody.innerHTML = sizes.map((item) => {
        const standard = formatLength(values[item].Standard);
        const extended = values[item].Extended === null ? 'Not initially offered' : formatLength(values[item].Extended);
        return `<tr data-row="${item}"><th scope="row">${item}</th><td data-cell="${item}-Standard">${standard}</td><td data-cell="${item}-Extended">${extended}</td></tr>`;
      }).join('');

      const lengthToHem = (inches) => 315 + ((inches - 26.75) / 2.5) * 54;

      const drawShirt = (width, hemY) => {
        const center = 210;
        const shoulderLeft = center - width - 21;
        const shoulderRight = center + width + 21;
        const bodyLeft = center - width;
        const bodyRight = center + width;
        const sleeveLeft = shoulderLeft - 58;
        const sleeveRight = shoulderRight + 58;
        const shirtPath = [
          'M169 69',
          `C${shoulderLeft + 48} 77 ${shoulderLeft + 21} 86 ${shoulderLeft + 8} 93`,
          `Q${shoulderLeft - 2} 98 ${shoulderLeft - 10} 110`,
          `L${sleeveLeft} 168`,
          `L${sleeveLeft + 28} 188`,
          `L${bodyLeft} 156`,
          `L${bodyLeft} ${hemY - 18}`,
          `Q${bodyLeft + 7} ${hemY - 4} ${center} ${hemY + 8}`,
          `Q${bodyRight - 7} ${hemY - 4} ${bodyRight} ${hemY - 18}`,
          `L${bodyRight} 156`,
          `L${sleeveRight - 28} 188`,
          `L${sleeveRight} 168`,
          `L${shoulderRight + 10} 110`,
          `Q${shoulderRight + 2} 98 ${shoulderRight - 8} 93`,
          `C${shoulderRight - 21} 86 ${shoulderRight - 48} 77 251 69`,
          'Q235 73 232 68',
          'Q210 82 188 68',
          'Q185 73 169 69',
          'Z',
        ].join(' ');

        outline.setAttribute('d', shirtPath);
        shadow.setAttribute('d', shirtPath);
        grain.setAttribute('d', shirtPath);
        yoke.setAttribute('d', `M${shoulderLeft - 5} 105 Q${center} 132 ${shoulderRight + 5} 105`);
        armholes.setAttribute('d', `M${shoulderLeft - 6} 104Q${bodyLeft + 15} 127 ${bodyLeft} 156 M${shoulderRight + 6} 104Q${bodyRight - 15} 127 ${bodyRight} 156`);
        sleeveSeams.setAttribute('d', [
          `M${sleeveLeft + 4} 169L${sleeveLeft + 31} 188`,
          `M${sleeveLeft + 11} 160L${sleeveLeft + 38} 180`,
          `M${sleeveRight - 4} 169L${sleeveRight - 31} 188`,
          `M${sleeveRight - 11} 160L${sleeveRight - 38} 180`,
        ].join(' '));
        placket.setAttribute('d', `M204 91L204 ${hemY + 5} M216 91L216 ${hemY + 5}`);
        pocket.setAttribute('d', `M${center + 31} 139H${center + 78}V187Q${center + 55} 198 ${center + 31} 187Z`);
        pocketFlap.setAttribute('d', `M${center + 29} 138H${center + 80}V150H${center + 29}Z`);
        hem.setAttribute('d', `M${bodyLeft + 6} ${hemY - 7}Q${center} ${hemY + 13} ${bodyRight - 6} ${hemY - 7}`);
        buttons.innerHTML = [108, 139, 170, 201, 232, 263, 294, 325, 356]
          .filter((y) => y < hemY - 10)
          .map((y) => `<circle cx="210" cy="${y}" r="2"></circle>`)
          .join('');

        const measureX = Math.min(407, sleeveRight + 20);
        guideTop.setAttribute('x1', bodyRight + 8);
        guideTop.setAttribute('x2', measureX - 7);
        guideTop.setAttribute('y1', 103);
        guideTop.setAttribute('y2', 103);
        guideBottom.setAttribute('x1', bodyRight + 8);
        guideBottom.setAttribute('x2', measureX - 7);
        guideBottom.setAttribute('y1', hemY);
        guideBottom.setAttribute('y2', hemY);
        measure.setAttribute('x1', measureX);
        measure.setAttribute('x2', measureX);
        measure.setAttribute('y1', 107);
        measure.setAttribute('y2', hemY);
        measureText.setAttribute('x', measureX + 10);
        measureText.setAttribute('y', 107 + ((hemY - 107) / 2));
      };

      const animateShirt = (targetWidth, targetHem) => {
        window.cancelAnimationFrame(animationFrame);
        if (reducedMotion) {
          currentWidth = targetWidth;
          currentHem = targetHem;
          drawShirt(currentWidth, currentHem);
          return;
        }

        const startWidth = currentWidth;
        const startHem = currentHem;
        const startTime = performance.now();
        const duration = 340;

        const frame = (time) => {
          const progress = Math.min(1, (time - startTime) / duration);
          const eased = 1 - ((1 - progress) ** 3);
          currentWidth = startWidth + ((targetWidth - startWidth) * eased);
          currentHem = startHem + ((targetHem - startHem) * eased);
          drawShirt(currentWidth, currentHem);
          if (progress < 1) animationFrame = window.requestAnimationFrame(frame);
        };

        animationFrame = window.requestAnimationFrame(frame);
      };

      const render = () => {
        const extendedButton = selector.querySelector('[data-length="Extended"]');
        const extendedAvailable = values[size].Extended !== null;
        if (extendedButton) {
          extendedButton.disabled = !extendedAvailable;
          extendedButton.setAttribute('aria-disabled', String(!extendedAvailable));
        }
        if (!extendedAvailable && length === 'Extended') length = 'Standard';

        sizeButtons.forEach((button) => {
          const active = button.dataset.size === size;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });

        lengthButtons.forEach((button) => {
          const active = button.dataset.length === length;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });

        fitLayout.querySelectorAll('[data-row]').forEach((row) => row.classList.toggle('is-active', row.dataset.row === size));
        fitLayout.querySelectorAll('[data-cell]').forEach((cell) => cell.classList.toggle('is-active', cell.dataset.cell === `${size}-${length}`));

        const selectedLength = values[size][length];
        const displayedLength = formatLength(selectedLength);
        output.textContent = `${size} · ${length} · ${displayedLength}`;
        measureText.textContent = displayedLength;
        animateShirt(values[size].width, lengthToHem(selectedLength));
      };

      sizeButtons.forEach((button) => button.addEventListener('click', () => {
        size = button.dataset.size;
        render();
      }));

      lengthButtons.forEach((button) => button.addEventListener('click', () => {
        if (button.disabled) return;
        length = button.dataset.length;
        render();
      }));

      render();
    });
  };

  const bootChapterDeck = (root) => {
    root.querySelectorAll('[data-nabz-home]').forEach((deck) => {
      if (deck.dataset.nabzDeckReady === 'true') return;
      deck.dataset.nabzDeckReady = 'true';

      const chapters = [...deck.querySelectorAll('[data-nabz-chapter]')];
      const count = deck.querySelector('[data-deck-count]');
      const progress = deck.querySelector('[data-deck-progress]');
      const previous = deck.querySelector('[data-deck-previous]');
      const next = deck.querySelector('[data-deck-next]');
      const live = deck.querySelector('[data-deck-live]');
      const desktop = window.matchMedia('(min-width: 961px) and (min-height: 640px)');
      const threadPositions = [31, 66, 47, 72, 39];
      let activeIndex = 0;
      let frame = 0;

      if (!chapters.length) return;

      const twoDigits = (value) => String(value).padStart(2, '0');

      const announce = (index) => {
        if (index === activeIndex && chapters[index].classList.contains('is-current')) return;
        activeIndex = index;
        chapters.forEach((chapter, chapterIndex) => {
          const current = chapterIndex === activeIndex;
          chapter.classList.toggle('is-current', current);
          if (current) chapter.setAttribute('aria-current', 'true');
          else chapter.removeAttribute('aria-current');
        });
        if (count) count.textContent = `${twoDigits(activeIndex + 1)} / ${twoDigits(chapters.length)}`;
        if (live) live.textContent = `Chapter ${activeIndex + 1} of ${chapters.length}: ${chapters[activeIndex].dataset.chapterLabel || 'NABZ'}`;
        previous?.toggleAttribute('disabled', activeIndex === 0);
        next?.toggleAttribute('disabled', activeIndex === chapters.length - 1);
        deck.style.setProperty('--nabz-thread-x', `${threadPositions[activeIndex] || 50}%`);
        deck.style.setProperty('--nabz-glow-x', `${threadPositions[activeIndex] || 50}%`);
      };

      const update = () => {
        frame = 0;
        const viewportHeight = Math.max(1, window.innerHeight);
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        chapters.forEach((chapter, index) => {
          const rect = chapter.getBoundingClientRect();
          const distance = (rect.top + (rect.height / 2) - (viewportHeight / 2)) / viewportHeight;
          const absoluteDistance = Math.abs(distance);
          if (absoluteDistance < nearestDistance) {
            nearestDistance = absoluteDistance;
            nearestIndex = index;
          }

          const focus = clamp(1 - absoluteDistance, 0, 1);
          chapter.style.setProperty('--chapter-focus', focus.toFixed(4));
          const inverseFocus = 1 - focus;
          chapter.style.setProperty('--nabz-hero-rule-scale', (.55 + focus * .45).toFixed(4));
          chapter.style.setProperty('--nabz-hero-copy-opacity', (.58 + focus * .42).toFixed(4));
          chapter.style.setProperty('--nabz-hero-line-x', `${(inverseFocus * -14).toFixed(2)}px`);
          chapter.style.setProperty('--nabz-hero-accent-x', `${(inverseFocus * 18).toFixed(2)}px`);
          chapter.style.setProperty('--nabz-hero-image-scale', (1.035 + inverseFocus * .035).toFixed(4));
          chapter.style.setProperty('--nabz-hero-image-x', `${(inverseFocus * 1.5).toFixed(3)}%`);
          chapter.style.setProperty('--nabz-hero-detail-y', `${(inverseFocus * 24).toFixed(2)}px`);
          chapter.style.setProperty('--nabz-hero-detail-rotate', `${(inverseFocus * 2).toFixed(3)}deg`);
          chapter.style.setProperty('--nabz-hero-focus-opacity', (.2 + focus * .8).toFixed(4));
          chapter.style.setProperty('--nabz-hero-focus-scale', (.74 + focus * .26).toFixed(4));
          chapter.style.setProperty('--nabz-shoulder-image-scale', (1.02 + inverseFocus * .035).toFixed(4));
          chapter.style.setProperty('--nabz-shoulder-line-offset', (760 - focus * 760).toFixed(2));
          chapter.style.setProperty('--nabz-shoulder-circle-opacity', focus.toFixed(4));
          chapter.style.setProperty('--nabz-shoulder-circle-scale', (.3 + focus * .7).toFixed(4));

          if (desktop.matches && !reducedMotion) {
            const limited = clamp(distance, -1.15, 1.15);
            const magnitude = Math.abs(limited);
            const incoming = limited > 0;
            const y = incoming ? magnitude * 34 : magnitude * -18;
            const scale = 1 - magnitude * (incoming ? .052 : .032);
            const rotateX = limited * -2.7;
            const rotateZ = limited * (index % 2 === 0 ? .42 : -.42);
            const opacity = .38 + focus * .62;
            const shade = (1 - focus) * .26;
            chapter.style.setProperty('--nabz-card-y', `${y.toFixed(2)}px`);
            chapter.style.setProperty('--nabz-card-scale', scale.toFixed(4));
            chapter.style.setProperty('--nabz-card-rotate-x', `${rotateX.toFixed(3)}deg`);
            chapter.style.setProperty('--nabz-card-rotate-z', `${rotateZ.toFixed(3)}deg`);
            chapter.style.setProperty('--nabz-card-opacity', opacity.toFixed(4));
            chapter.style.setProperty('--nabz-card-shade', shade.toFixed(4));
            chapter.style.setProperty('--nabz-contact-shade', (shade * .6).toFixed(4));
          } else {
            ['--nabz-card-y', '--nabz-card-scale', '--nabz-card-rotate-x', '--nabz-card-rotate-z', '--nabz-card-opacity', '--nabz-card-shade']
              .forEach((property) => chapter.style.removeProperty(property));
            chapter.style.removeProperty('--nabz-contact-shade');
          }
        });

        announce(nearestIndex);
        const scrollRange = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
        const pageProgress = clamp(window.scrollY / scrollRange, 0, 1) * 100;
        deck.style.setProperty('--nabz-deck-progress', `${pageProgress.toFixed(2)}%`);
        deck.style.setProperty('--nabz-thread-progress', `${pageProgress.toFixed(2)}%`);
        if (progress) progress.style.setProperty('--nabz-deck-progress', `${pageProgress.toFixed(2)}%`);
      };

      const requestUpdate = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(update);
      };

      const goTo = (index) => {
        const target = chapters[clamp(index, 0, chapters.length - 1)];
        target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      };

      previous?.addEventListener('click', () => goTo(activeIndex - 1));
      next?.addEventListener('click', () => goTo(activeIndex + 1));
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate, { passive: true });
      desktop.addEventListener?.('change', requestUpdate);
      update();
    });
  };

  const boot = (root = document) => {
    if (root === document) bootEntry();
    bootProductGallery(root);
    bootFitStory(root);
    bootFitSelector(root);
    bootChapterDeck(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => boot(event.target));
})();
