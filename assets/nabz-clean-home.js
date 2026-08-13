(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const twoDigits = (value) => String(value).padStart(2, '0');

  const formatLength = (value) => {
    if (value === null) return 'Not initially offered';
    return `${Number.isInteger(value) ? value.toFixed(0) : value}"`;
  };

  const bootProductReel = (root) => {
    root.querySelectorAll('[data-product-reel]').forEach((reel) => {
      if (reel.dataset.productReady === 'true') return;
      reel.dataset.productReady = 'true';

      const cards = [...reel.querySelectorAll('[data-product-card]')];
      const selectors = [...reel.querySelectorAll('[data-product-select]')];
      const previous = reel.querySelector('[data-product-previous]');
      const next = reel.querySelector('[data-product-next]');
      let active = 0;

      if (!cards.length) return;

      const signedDistance = (index) => {
        let distance = index - active;
        const halfway = cards.length / 2;
        if (distance > halfway) distance -= cards.length;
        if (distance < -halfway) distance += cards.length;
        return distance;
      };

      const render = (nextIndex, focusSelector = false) => {
        active = (nextIndex + cards.length) % cards.length;

        cards.forEach((card, index) => {
          const distance = signedDistance(index);
          const magnitude = Math.abs(distance);
          const direction = distance === 0 ? 0 : Math.sign(distance);
          const x = distance * 48 + direction * magnitude * 7;
          const y = magnitude * 10;
          const rotation = distance * 4.4;
          const scale = Math.max(.68, 1 - magnitude * .075);
          const opacity = Math.max(.24, 1 - magnitude * .19);
          const isActive = index === active;

          card.style.setProperty('--stack-x', `${x}px`);
          card.style.setProperty('--stack-y', `${y}px`);
          card.style.setProperty('--stack-r', `${rotation}deg`);
          card.style.setProperty('--stack-scale', scale.toFixed(3));
          card.style.setProperty('--stack-opacity', opacity.toFixed(3));
          card.style.zIndex = String(30 - magnitude);
          card.classList.toggle('is-active', isActive);
          card.setAttribute('aria-hidden', String(!isActive));
        });

        selectors.forEach((selector, index) => {
          const isActive = index === active;
          selector.classList.toggle('is-active', isActive);
          selector.setAttribute('aria-pressed', String(isActive));
        });

        if (focusSelector) selectors[active]?.focus({ preventScroll: true });
      };

      selectors.forEach((selector) => {
        selector.addEventListener('click', () => render(Number(selector.dataset.productSelect)));
      });

      previous?.addEventListener('click', () => render(active - 1));
      next?.addEventListener('click', () => render(active + 1));

      reel.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        render(active + (event.key === 'ArrowRight' ? 1 : -1), true);
      });

      render(0);
    });
  };

  const bootFitLab = (root) => {
    root.querySelectorAll('[data-fit-selector]').forEach((selector) => {
      if (selector.dataset.fitReady === 'true') return;
      selector.dataset.fitReady = 'true';

      const dataNode = selector.querySelector('[data-fit-data]');
      const output = selector.querySelector('[data-fit-output]');
      const swatch = selector.querySelector('[data-fit-swatch]');
      const tableBody = selector.querySelector('[data-fit-table-body]');
      const sizeButtons = [...selector.querySelectorAll('[data-size]')];
      const lengthButtons = [...selector.querySelectorAll('[data-length]')];
      if (!dataNode || !output || !swatch || !tableBody) return;

      let values;
      try {
        values = JSON.parse(dataNode.textContent);
      } catch (error) {
        selector.dataset.fitError = 'true';
        return;
      }

      const sizes = Object.keys(values);
      let size = 'M';
      let length = 'Standard';

      tableBody.innerHTML = sizes.map((rowSize) => `
        <tr data-fit-row="${rowSize}">
          <th scope="row">${rowSize}</th>
          <td data-fit-cell="${rowSize}-Standard">${formatLength(values[rowSize].Standard)}</td>
          <td data-fit-cell="${rowSize}-Extended">${formatLength(values[rowSize].Extended)}</td>
        </tr>
      `).join('');

      const render = () => {
        const extendedAvailable = values[size].Extended !== null;
        const extendedButton = selector.querySelector('[data-length="Extended"]');
        if (!extendedAvailable && length === 'Extended') length = 'Standard';

        if (extendedButton) {
          extendedButton.disabled = !extendedAvailable;
          extendedButton.setAttribute('aria-disabled', String(!extendedAvailable));
        }

        sizeButtons.forEach((button) => {
          const isActive = button.dataset.size === size;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        lengthButtons.forEach((button) => {
          const isActive = button.dataset.length === length;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });

        selector.querySelectorAll('[data-fit-row]').forEach((row) => {
          row.classList.toggle('is-active', row.dataset.fitRow === size);
        });

        selector.querySelectorAll('[data-fit-cell]').forEach((cell) => {
          cell.classList.toggle('is-active', cell.dataset.fitCell === `${size}-${length}`);
        });

        const sizeIndex = Math.max(0, sizes.indexOf(size));
        const selectedLength = values[size][length];
        const minimum = 26.75;
        const maximum = 29.25;
        const normalizedLength = (selectedLength - minimum) / (maximum - minimum);
        const widthPercent = 38 + sizeIndex * 6;
        const heightPercent = 49 + normalizedLength * 22;

        swatch.style.setProperty('--swatch-width', `${widthPercent}%`);
        swatch.style.setProperty('--swatch-height', `${heightPercent}%`);
        output.textContent = `${size} · ${length} · ${formatLength(selectedLength)}`;
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

  const bootDeck = (root) => {
    root.querySelectorAll('[data-nabz-home]').forEach((deck) => {
      if (deck.dataset.deckReady === 'true') return;
      deck.dataset.deckReady = 'true';

      const scenes = [...deck.querySelectorAll('[data-nabz-scene]')];
      const dots = [...deck.querySelectorAll('[data-deck-dot]')];
      const current = deck.querySelector('[data-deck-current]');
      const previous = deck.querySelector('[data-deck-previous]');
      const next = deck.querySelector('[data-deck-next]');
      const live = deck.querySelector('[data-deck-live]');
      let activeIndex = 0;
      let frame = 0;

      if (!scenes.length) return;

      const announce = (index) => {
        const boundedIndex = Math.max(0, Math.min(scenes.length - 1, index));
        activeIndex = boundedIndex;
        deck.dataset.activeScene = String(activeIndex);

        scenes.forEach((scene, sceneIndex) => {
          const isCurrent = sceneIndex === activeIndex;
          scene.classList.toggle('is-current', isCurrent);
          if (isCurrent) scene.setAttribute('aria-current', 'true');
          else scene.removeAttribute('aria-current');
        });

        dots.forEach((dot, dotIndex) => {
          const isCurrent = dotIndex === activeIndex;
          dot.classList.toggle('is-active', isCurrent);
          if (isCurrent) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });

        if (current) current.textContent = twoDigits(activeIndex + 1);
        if (previous) previous.disabled = activeIndex === 0;
        if (next) next.disabled = activeIndex === scenes.length - 1;
        if (live) {
          live.textContent = `Chapter ${activeIndex + 1} of ${scenes.length}: ${scenes[activeIndex].dataset.sceneLabel || 'NABZ'}`;
        }
      };

      const findNearestScene = () => {
        frame = 0;
        const viewportCenter = window.innerHeight / 2;
        let nearest = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        scenes.forEach((scene, index) => {
          const rect = scene.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const distance = Math.abs(center - viewportCenter);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }
        });

        if (nearest !== activeIndex) announce(nearest);
      };

      const queueNearestScene = () => {
        if (frame) return;
        frame = window.requestAnimationFrame(findNearestScene);
      };

      const goTo = (index) => {
        const boundedIndex = Math.max(0, Math.min(scenes.length - 1, index));
        scenes[boundedIndex].scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      };

      previous?.addEventListener('click', () => goTo(activeIndex - 1));
      next?.addEventListener('click', () => goTo(activeIndex + 1));

      dots.forEach((dot) => {
        dot.addEventListener('click', (event) => {
          event.preventDefault();
          goTo(Number(dot.dataset.deckDot));
        });
      });

      window.addEventListener('scroll', queueNearestScene, { passive: true });
      window.addEventListener('resize', queueNearestScene, { passive: true });
      document.addEventListener('scrollend', findNearestScene, { passive: true });

      announce(0);
      window.requestAnimationFrame(() => {
        findNearestScene();
        deck.dataset.enhanced = 'true';
      });
    });
  };

  const removeEntry = (root) => {
    root.querySelectorAll('[data-nabz-entry]').forEach((entry) => {
      if (reducedMotion) {
        entry.remove();
        return;
      }
      window.setTimeout(() => entry.remove(), 1900);
    });
  };

  const boot = (root = document) => {
    bootProductReel(root);
    bootFitLab(root);
    bootDeck(root);
    removeEntry(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => boot(event.target));
})();
