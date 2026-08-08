(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const formatLength = (value) => `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}"`;

  const bootProductGallery = (root) => {
    root.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
      if (gallery.dataset.nabzReady === 'true') return;
      gallery.dataset.nabzReady = 'true';

      const panels = [...gallery.querySelectorAll('[data-product-panel]')];
      const activate = (selected) => {
        panels.forEach((panel) => {
          const active = panel === selected;
          panel.classList.toggle('is-active', active);
          panel.setAttribute('aria-pressed', String(active));
        });
      };

      panels.forEach((panel) => {
        panel.addEventListener('click', () => activate(panel));
        panel.addEventListener('pointerenter', () => {
          if (window.matchMedia('(hover: hover)').matches) activate(panel);
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
      const next = story.querySelector('[data-fit-story-next]');
      const back = story.querySelector('[data-fit-story-back]');

      const show = (target, departing) => {
        departing.classList.add('is-leaving');
        departing.classList.remove('is-active');
        departing.setAttribute('aria-hidden', 'true');
        target.classList.remove('is-leaving');
        target.classList.add('is-active');
        target.setAttribute('aria-hidden', 'false');
      };

      next.addEventListener('click', () => show(solution, problem));
      back.addEventListener('click', () => show(problem, solution));
    });
  };

  const bootFitSelector = (root) => {
    root.querySelectorAll('[data-fit-selector]').forEach((selector) => {
      if (selector.dataset.nabzReady === 'true') return;
      selector.dataset.nabzReady = 'true';

      const values = JSON.parse(selector.querySelector('[data-fit-data]').textContent);
      const sizes = Object.keys(values);
      const sizeButtons = [...selector.querySelectorAll('[data-size]')];
      const lengthButtons = [...selector.querySelectorAll('[data-length]')];
      const output = selector.querySelector('[data-fit-output]');
      const fitLayout = selector.closest('.nabz-fit');
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
        cancelAnimationFrame(animationFrame);
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
          if (progress < 1) animationFrame = requestAnimationFrame(frame);
        };

        animationFrame = requestAnimationFrame(frame);
      };

      const render = () => {
        const extendedButton = selector.querySelector('[data-length="Extended"]');
        const extendedAvailable = values[size].Extended !== null;
        extendedButton.disabled = !extendedAvailable;
        extendedButton.setAttribute('aria-disabled', String(!extendedAvailable));

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

        fitLayout.querySelectorAll('[data-row]').forEach((row) => {
          row.classList.toggle('is-active', row.dataset.row === size);
        });

        fitLayout.querySelectorAll('[data-cell]').forEach((cell) => {
          cell.classList.toggle('is-active', cell.dataset.cell === `${size}-${length}`);
        });

        const selectedLength = values[size][length];
        const displayedLength = formatLength(selectedLength);
        output.textContent = `${size} · ${length} · ${displayedLength}`;
        measureText.textContent = displayedLength;
        animateShirt(values[size].width, lengthToHem(selectedLength));
      };

      sizeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          size = button.dataset.size;
          render();
        });
      });

      lengthButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          length = button.dataset.length;
          render();
        });
      });

      render();
    });
  };

  const bootChapterDeck = (root) => {
    root.querySelectorAll('[data-nabz-home]').forEach((deck) => {
      if (deck.dataset.nabzDeckReady === 'true') return;

      const desktopDeck = window.matchMedia('(min-width: 961px) and (min-height: 620px)');
      const chapters = [...deck.querySelectorAll('[data-nabz-chapter]')];
      const previousButton = deck.querySelector('[data-deck-previous]');
      const nextButton = deck.querySelector('[data-deck-next]');
      const count = deck.querySelector('[data-deck-count]');
      const label = deck.querySelector('[data-deck-label]');
      const live = deck.querySelector('[data-deck-live]');
      const labels = chapters.map((chapter) => chapter.dataset.chapterLabel || 'NABZ');

      if (chapters.length < 2) return;

      let activeIndex = Math.max(0, chapters.findIndex((chapter) => `#${chapter.id}` === window.location.hash));
      let transitioning = false;
      let transitionTimer = 0;
      let wheelTotal = 0;
      let wheelResetTimer = 0;
      let touchStartX = 0;
      let touchStartY = 0;
      let enabled = false;

      const twoDigits = (value) => String(value).padStart(2, '0');
      const isTextInput = (target) => target.matches('input, textarea, select, [contenteditable="true"]');
      const isInteractive = (target) => Boolean(target.closest('button, a, input, textarea, select, summary, [contenteditable="true"]'));

      const setChapterState = (chapter, state) => {
        chapter.dataset.deckState = state;
        const isActive = state === 'active';
        chapter.setAttribute('aria-hidden', String(!isActive));
        if ('inert' in chapter) chapter.inert = !isActive;
      };

      const updateUi = (announce = false) => {
        if (count) count.textContent = `${twoDigits(activeIndex + 1)} / ${twoDigits(chapters.length)}`;
        if (label) label.textContent = labels[activeIndex];
        if (live && announce) live.textContent = `Chapter ${activeIndex + 1} of ${chapters.length}: ${labels[activeIndex]}`;
        chapters.forEach((chapter, index) => {
          chapter.classList.toggle('is-active', index === activeIndex);
        });
      };

      const setInitialStates = () => {
        chapters.forEach((chapter, index) => {
          if (index === activeIndex) setChapterState(chapter, 'active');
          else setChapterState(chapter, index < activeIndex ? 'past' : 'future');
        });
        updateUi(false);
      };

      const goTo = (nextIndex, direction = 1, announce = true) => {
        if (!enabled || transitioning) return;
        const normalizedIndex = (nextIndex + chapters.length) % chapters.length;
        if (normalizedIndex === activeIndex) return;

        transitioning = true;
        const current = chapters[activeIndex];
        const incoming = chapters[normalizedIndex];

        incoming.classList.add('is-deck-preparing');
        setChapterState(incoming, direction > 0 ? 'future' : 'past');
        incoming.getBoundingClientRect();
        incoming.classList.remove('is-deck-preparing');

        window.requestAnimationFrame(() => {
          setChapterState(current, direction > 0 ? 'past' : 'future');
          setChapterState(incoming, 'active');
          activeIndex = normalizedIndex;
          updateUi(announce);

          if (history.replaceState) history.replaceState(null, '', `#${chapters[activeIndex].id}`);
        });

        window.clearTimeout(transitionTimer);
        transitionTimer = window.setTimeout(() => {
          chapters.forEach((chapter, index) => {
            if (index === activeIndex) return;
            setChapterState(chapter, direction > 0 ? 'past' : 'future');
          });
          transitioning = false;
        }, reducedMotion ? 40 : 920);
      };

      const canScrollInside = (target, direction) => {
        const scrollable = target.closest('[data-deck-scroll], details[open], textarea');
        if (!scrollable) return false;
        if (direction > 0) return scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight - 1;
        return scrollable.scrollTop > 1;
      };

      const onWheel = (event) => {
        if (!enabled || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        const direction = Math.sign(event.deltaY);
        if (canScrollInside(event.target, direction)) return;
        event.preventDefault();
        if (transitioning) return;

        wheelTotal += event.deltaY;
        window.clearTimeout(wheelResetTimer);
        wheelResetTimer = window.setTimeout(() => { wheelTotal = 0; }, 180);
        if (Math.abs(wheelTotal) < 44) return;

        goTo(activeIndex + Math.sign(wheelTotal), Math.sign(wheelTotal));
        wheelTotal = 0;
      };

      const onKeydown = (event) => {
        if (!enabled || isTextInput(event.target)) return;
        if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
          event.preventDefault();
          goTo(activeIndex + 1, 1);
        } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
          event.preventDefault();
          goTo(activeIndex - 1, -1);
        } else if (event.key === 'Home') {
          event.preventDefault();
          goTo(0, -1);
        } else if (event.key === 'End') {
          event.preventDefault();
          goTo(chapters.length - 1, 1);
        }
      };

      const onTouchStart = (event) => {
        if (!enabled || event.touches.length !== 1 || isInteractive(event.target)) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      };

      const onTouchEnd = (event) => {
        if (!enabled || !touchStartY || event.changedTouches.length !== 1) return;
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        const deltaY = event.changedTouches[0].clientY - touchStartY;
        touchStartX = 0;
        touchStartY = 0;
        if (Math.abs(deltaY) < 58 || Math.abs(deltaY) <= Math.abs(deltaX)) return;
        goTo(activeIndex + (deltaY < 0 ? 1 : -1), deltaY < 0 ? 1 : -1);
      };

      const onHashNavigation = (event) => {
        const link = event.target.closest('a[href^="#"]');
        if (!link || !enabled) return;
        const destination = chapters.findIndex((chapter) => `#${chapter.id}` === link.getAttribute('href'));
        if (destination < 0) return;
        event.preventDefault();
        const forwardDistance = (destination - activeIndex + chapters.length) % chapters.length;
        const backwardDistance = (activeIndex - destination + chapters.length) % chapters.length;
        goTo(destination, forwardDistance <= backwardDistance ? 1 : -1);
      };

      const enable = () => {
        if (enabled || !desktopDeck.matches || window.Shopify?.designMode) return;
        enabled = true;
        deck.dataset.nabzDeckReady = 'true';
        document.body.classList.add('nabz-deck-active');
        setInitialStates();
        document.addEventListener('wheel', onWheel, { passive: false });
        deck.addEventListener('touchstart', onTouchStart, { passive: true });
        deck.addEventListener('touchend', onTouchEnd, { passive: true });
        document.addEventListener('keydown', onKeydown);
        document.addEventListener('click', onHashNavigation);
      };

      const disable = () => {
        if (!enabled) return;
        enabled = false;
        document.body.classList.remove('nabz-deck-active');
        chapters.forEach((chapter) => {
          chapter.removeAttribute('data-deck-state');
          chapter.removeAttribute('aria-hidden');
          if ('inert' in chapter) chapter.inert = false;
        });
        document.removeEventListener('wheel', onWheel);
        deck.removeEventListener('touchstart', onTouchStart);
        deck.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('click', onHashNavigation);
      };

      previousButton?.addEventListener('click', () => goTo(activeIndex - 1, -1));
      nextButton?.addEventListener('click', () => goTo(activeIndex + 1, 1));
      desktopDeck.addEventListener('change', () => {
        if (desktopDeck.matches) enable();
        else disable();
      });

      enable();
    });
  };

  const boot = (root = document) => {
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
