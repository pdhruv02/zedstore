(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const formatLength = (value) => `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}\"`;

  const bootEntry = () => {
    const entry = document.querySelector('[data-nabz-entry]');
    if (!entry || entry.dataset.nabzReady === 'true') return;
    entry.dataset.nabzReady = 'true';
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      entry.remove();
      document.dispatchEvent(new CustomEvent('nabz:intro-complete'));
    };
    entry.addEventListener('animationend', (event) => {
      if (event.target === entry && event.animationName === 'nabz-entry-release') finish();
    });
    window.setTimeout(finish, reducedMotion ? 320 : 3100);
  };

  const bootProductArchive = (root) => {
    root.querySelectorAll('[data-product-archive]').forEach((archive) => {
      if (archive.dataset.nabzReady === 'true') return;
      archive.dataset.nabzReady = 'true';
      const cards = [...archive.querySelectorAll('[data-product-card]')];
      const selectors = [...archive.querySelectorAll('[data-product-select]')];
      const count = archive.querySelector('[data-product-count]');
      if (!cards.length) return;
      let activeIndex = 0;
      const twoDigits = (value) => String(value).padStart(2, '0');
      const activate = (index) => {
        activeIndex = (index + cards.length) % cards.length;
        cards.forEach((card, cardIndex) => {
          const active = cardIndex === activeIndex;
          card.classList.toggle('is-active', active);
          card.setAttribute('aria-hidden', String(!active));
        });
        selectors.forEach((selector, selectorIndex) => {
          const active = selectorIndex === activeIndex;
          selector.classList.toggle('is-active', active);
          selector.setAttribute('aria-pressed', String(active));
        });
        if (count) count.textContent = `${twoDigits(activeIndex + 1)} / ${twoDigits(cards.length)}`;
      };
      selectors.forEach((selector, index) => {
        selector.addEventListener('click', () => activate(index));
        selector.addEventListener('keydown', (event) => {
          if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          const nextIndex = (index + (event.key === 'ArrowDown' ? 1 : -1) + selectors.length) % selectors.length;
          selectors[nextIndex].focus();
          activate(nextIndex);
        });
      });
      archive.querySelector('[data-product-previous]')?.addEventListener('click', () => activate(activeIndex - 1));
      archive.querySelector('[data-product-next]')?.addEventListener('click', () => activate(activeIndex + 1));
      activate(0);
    });
  };

  const bootFitStory = (root) => {
    root.querySelectorAll('[data-fit-story]').forEach((story) => {
      if (story.dataset.nabzReady === 'true') return;
      story.dataset.nabzReady = 'true';
      const tabs = [...story.querySelectorAll('[data-fit-story-tab]')];
      const panels = [...story.querySelectorAll('[data-fit-story-panel]')];
      const activate = (name) => {
        tabs.forEach((tab) => {
          const active = tab.dataset.fitStoryTab === name;
          tab.classList.toggle('is-active', active);
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => {
          const active = panel.dataset.fitStoryPanel === name;
          panel.hidden = false;
          panel.classList.toggle('is-active', active);
          panel.setAttribute('aria-hidden', String(!active));
          if (!active) window.setTimeout(() => {
            if (!panel.classList.contains('is-active')) panel.hidden = true;
          }, reducedMotion ? 0 : 500);
        });
      };
      tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activate(tab.dataset.fitStoryTab));
        tab.addEventListener('keydown', (event) => {
          if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          const nextIndex = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          tabs[nextIndex].focus();
          activate(tabs[nextIndex].dataset.fitStoryTab);
        });
      });
      activate('problem');
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
      const cloth = selector.querySelector('[data-fit-cloth]');
      const tableBody = selector.querySelector('[data-fit-table-body]');
      let size = 'M';
      let length = 'Standard';

      tableBody.innerHTML = sizes.map((item) => {
        const standard = formatLength(values[item].Standard);
        const extended = values[item].Extended === null ? 'Not initially offered' : formatLength(values[item].Extended);
        return `<tr data-row="${item}"><th scope="row">${item}</th><td data-cell="${item}-Standard">${standard}</td><td data-cell="${item}-Extended">${extended}</td></tr>`;
      }).join('');

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
        selector.querySelectorAll('[data-row]').forEach((row) => row.classList.toggle('is-active', row.dataset.row === size));
        selector.querySelectorAll('[data-cell]').forEach((cell) => cell.classList.toggle('is-active', cell.dataset.cell === `${size}-${length}`));
        const selectedLength = values[size][length];
        const height = 48 + ((selectedLength - 26.75) / 2.5) * 28;
        cloth.style.setProperty('--fit-width', `${values[size].width / 1.7}%`);
        cloth.style.setProperty('--fit-height', `${height}%`);
        output.textContent = `${size} · ${length} · ${formatLength(selectedLength)}`;
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
      if (deck.dataset.nabzDeckBound === 'true') return;
      deck.dataset.nabzDeckBound = 'true';
      const desktopDeck = window.matchMedia('(min-width: 961px) and (min-height: 620px)');
      const chapters = [...deck.querySelectorAll('[data-nabz-chapter]')];
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
      const asElement = (target) => target instanceof Element ? target : null;
      const isTextInput = (target) => Boolean(asElement(target)?.matches('input, textarea, select, [contenteditable="true"]'));
      const isInteractive = (target) => Boolean(asElement(target)?.closest('button, a, input, textarea, select, summary, [contenteditable="true"]'));

      const setChapterState = (chapter, state) => {
        chapter.dataset.deckState = state;
        const active = state === 'active';
        chapter.setAttribute('aria-hidden', String(!active));
        if ('inert' in chapter) chapter.inert = !active;
      };
      const updateUi = (announce = false) => {
        if (count) count.textContent = `${twoDigits(activeIndex + 1)} / ${twoDigits(chapters.length)}`;
        if (label) label.textContent = labels[activeIndex];
        if (live && announce) live.textContent = `Chapter ${activeIndex + 1} of ${chapters.length}: ${labels[activeIndex]}`;
        chapters.forEach((chapter, index) => chapter.classList.toggle('is-active', index === activeIndex));
      };
      const setInitialStates = () => {
        chapters.forEach((chapter, index) => setChapterState(chapter, index === activeIndex ? 'active' : index < activeIndex ? 'past' : 'future'));
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
            if (index !== activeIndex) setChapterState(chapter, direction > 0 ? 'past' : 'future');
          });
          transitioning = false;
        }, reducedMotion ? 40 : 920);
      };
      const canScrollInside = (target, direction) => {
        const scrollable = asElement(target)?.closest('[data-deck-scroll], details[open], textarea');
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
        const link = asElement(event.target)?.closest('a[href^="#"]');
        if (!link || !enabled) return;
        const destination = chapters.findIndex((chapter) => `#${chapter.id}` === link.getAttribute('href'));
        if (destination < 0) return;
        event.preventDefault();
        const forwardDistance = (destination - activeIndex + chapters.length) % chapters.length;
        const backwardDistance = (activeIndex - destination + chapters.length) % chapters.length;
        goTo(destination, forwardDistance <= backwardDistance ? 1 : -1);
      };
      const enable = () => {
        if (enabled || !desktopDeck.matches || window.Shopify?.designMode || document.querySelector('[data-nabz-entry]')) return;
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
        delete deck.dataset.nabzDeckReady;
        document.body.classList.remove('nabz-deck-active');
        chapters.forEach((chapter) => {
          delete chapter.dataset.deckState;
          chapter.removeAttribute('aria-hidden');
          if ('inert' in chapter) chapter.inert = false;
        });
        document.removeEventListener('wheel', onWheel);
        deck.removeEventListener('touchstart', onTouchStart);
        deck.removeEventListener('touchend', onTouchEnd);
        document.removeEventListener('keydown', onKeydown);
        document.removeEventListener('click', onHashNavigation);
      };
      deck.querySelector('[data-deck-previous]')?.addEventListener('click', () => goTo(activeIndex - 1, -1));
      deck.querySelector('[data-deck-next]')?.addEventListener('click', () => goTo(activeIndex + 1, 1));
      desktopDeck.addEventListener('change', () => desktopDeck.matches ? enable() : disable());
      if (document.querySelector('[data-nabz-entry]')) document.addEventListener('nabz:intro-complete', enable, { once: true });
      else enable();
    });
  };

  const boot = (root = document) => {
    if (root === document) bootEntry();
    bootProductArchive(root);
    bootFitStory(root);
    bootFitSelector(root);
    bootChapterDeck(root);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  else boot();
  document.addEventListener('shopify:section:load', (event) => boot(event.target));
})();
