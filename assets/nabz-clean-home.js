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

  const bootDetailLens = (root) => {
    root.querySelectorAll('[data-detail-source]').forEach((source) => {
      if (source.dataset.nabzLensReady === 'true') return;
      source.dataset.nabzLensReady = 'true';

      const lens = source.querySelector('[data-detail-lens]');
      if (!lens || reducedMotion) return;

      source.addEventListener('pointermove', (event) => {
        const bounds = source.getBoundingClientRect();
        const x = Math.min(68, Math.max(37, ((event.clientX - bounds.left) / bounds.width) * 100));
        const y = Math.min(73, Math.max(39, ((event.clientY - bounds.top) / bounds.height) * 100));
        lens.style.setProperty('--detail-x', `${x}%`);
        lens.style.setProperty('--detail-y', `${y}%`);
      });
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
      const tableBody = selector.querySelector('[data-fit-table-body]');
      const outline = selector.querySelector('[data-shirt-outline]');
      const placket = selector.querySelector('[data-shirt-placket]');
      const hem = selector.querySelector('[data-shirt-hem]');
      const measure = selector.querySelector('[data-shirt-measure]');
      const measureTop = selector.querySelector('[data-shirt-measure-top]');
      const measureBottom = selector.querySelector('[data-shirt-measure-bottom]');
      const measureText = selector.querySelector('[data-shirt-measure-text]');
      const sizeText = selector.querySelector('[data-shirt-size-text]');

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
        const center = 190;
        const shoulderLeft = center - width - 21;
        const shoulderRight = center + width + 21;
        const bodyLeft = center - width;
        const bodyRight = center + width;

        outline.setAttribute('d', [
          'M164 76',
          `L${shoulderLeft} 91`,
          `Q${shoulderLeft - 16} 96 ${shoulderLeft - 34} 116`,
          `L${shoulderLeft - 18} 192`,
          `L${bodyLeft} 180`,
          `L${bodyLeft} ${hemY - 17}`,
          `Q${bodyLeft + 20} ${hemY} ${center} ${hemY}`,
          `Q${bodyRight - 20} ${hemY} ${bodyRight} ${hemY - 17}`,
          `L${bodyRight} 180`,
          `L${shoulderRight + 18} 192`,
          `L${shoulderRight + 34} 116`,
          `Q${shoulderRight + 16} 96 ${shoulderRight} 91`,
          'L216 76',
        ].join(' '));

        placket.setAttribute('d', `M190 69 L190 ${hemY - 4}`);
        hem.setAttribute('d', `M${bodyLeft + 7} ${hemY - 15} Q190 ${hemY + 5} ${bodyRight - 7} ${hemY - 15}`);

        const measureX = Math.min(344, bodyRight + 40);
        measure.setAttribute('x1', measureX);
        measure.setAttribute('x2', measureX);
        measure.setAttribute('y1', 104);
        measure.setAttribute('y2', hemY);
        measureTop.setAttribute('x1', measureX - 8);
        measureTop.setAttribute('x2', measureX + 8);
        measureTop.setAttribute('y1', 104);
        measureTop.setAttribute('y2', 104);
        measureBottom.setAttribute('x1', measureX - 8);
        measureBottom.setAttribute('x2', measureX + 8);
        measureBottom.setAttribute('y1', hemY);
        measureBottom.setAttribute('y2', hemY);
        measureText.setAttribute('x', measureX + 12);
        measureText.setAttribute('y', 104 + ((hemY - 104) / 2));
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

        selector.querySelectorAll('[data-row]').forEach((row) => {
          row.classList.toggle('is-active', row.dataset.row === size);
        });

        selector.querySelectorAll('[data-cell]').forEach((cell) => {
          cell.classList.toggle('is-active', cell.dataset.cell === `${size}-${length}`);
        });

        const selectedLength = values[size][length];
        const displayedLength = formatLength(selectedLength);
        output.textContent = `${size} · ${length} · ${displayedLength}`;
        measureText.textContent = displayedLength;
        sizeText.textContent = size;
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

  const boot = (root = document) => {
    bootProductGallery(root);
    bootDetailLens(root);
    bootFitSelector(root);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => boot(event.target));
})();
