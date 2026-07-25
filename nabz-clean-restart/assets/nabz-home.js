(() => {
  const SELECTORS = {
    gallery: '[data-nabz-product-gallery]',
    panel: '[data-nabz-product-panel]',
    fit: '[data-nabz-fit]'
  };

  function initProductGallery(root = document) {
    root.querySelectorAll(SELECTORS.gallery).forEach((gallery) => {
      if (gallery.dataset.nabzInitialized === 'true') return;
      gallery.dataset.nabzInitialized = 'true';

      const panels = [...gallery.querySelectorAll(SELECTORS.panel)];
      const activate = (panel) => {
        panels.forEach((item) => {
          const active = item === panel;
          item.classList.toggle('is-active', active);
          item.querySelector('.nabz-product-panel__button')?.setAttribute('aria-pressed', String(active));
        });
      };

      panels.forEach((panel) => {
        panel.querySelector('.nabz-product-panel__button')?.addEventListener('click', () => activate(panel));
      });
    });
  }

  function initFit(root = document) {
    root.querySelectorAll(SELECTORS.fit).forEach((fit) => {
      if (fit.dataset.nabzInitialized === 'true') return;
      fit.dataset.nabzInitialized = 'true';

      const dataElement = fit.querySelector('[data-nabz-fit-data]');
      if (!dataElement) return;

      let rows;
      try {
        rows = JSON.parse(dataElement.textContent);
      } catch (error) {
        console.error('NABZ fit data could not be read.', error);
        return;
      }

      const data = Object.fromEntries(rows.map((row) => [row.size, row]));
      const sizeButtons = [...fit.querySelectorAll('[data-fit-size]')];
      const lengthButtons = [...fit.querySelectorAll('[data-fit-length]')];
      const extendedButton = fit.querySelector('[data-fit-length="extended"]');
      const lowerLayer = fit.querySelector('[data-fit-lower-layer]');
      const measureLower = fit.querySelector('[data-fit-measure-lower]');
      const widthLayer = fit.querySelector('[data-fit-width-layer]');
      const svgLength = fit.querySelector('[data-fit-svg-length]');
      const readoutSize = fit.querySelector('[data-fit-readout-size]');
      const readoutLength = fit.querySelector('[data-fit-readout-length]');
      const readoutValue = fit.querySelector('[data-fit-readout-value]');
      const unavailable = fit.querySelector('[data-fit-unavailable]');

      const widthScale = { S: 0.92, M: 1, L: 1.08, XL: 1.16 };
      let state = { size: 'M', length: 'standard' };

      const formatLength = (value) => `${value}"`;

      function setPressed(buttons, activeValue, attribute) {
        buttons.forEach((button) => {
          const active = button.dataset[attribute] === activeValue;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
      }

      function render() {
        const row = data[state.size];
        const hasExtended = row.extended !== null;

        if (!hasExtended && state.length === 'extended') {
          state.length = 'standard';
        }

        if (extendedButton) {
          extendedButton.disabled = !hasExtended;
          extendedButton.setAttribute('aria-disabled', String(!hasExtended));
        }

        setPressed(sizeButtons, state.size, 'fitSize');
        setPressed(lengthButtons, state.length, 'fitLength');

        const value = state.length === 'extended' ? row.extended : row.standard;
        const isExtended = state.length === 'extended';

        fit.style.setProperty('--fit-width-scale', widthScale[state.size]);
        fit.style.setProperty('--fit-length-scale', isExtended ? 1.18 : 1);
        fit.style.setProperty('--fit-measure-shift', isExtended ? '39px' : '0px');

        if (widthLayer) widthLayer.style.transform = `scaleX(${widthScale[state.size]})`;
        if (lowerLayer) lowerLayer.style.transform = `scaleY(${isExtended ? 1.18 : 1})`;
        if (measureLower) measureLower.style.transform = `scaleY(${isExtended ? 1.18 : 1})`;

        const shown = formatLength(value);
        if (svgLength) {
          svgLength.textContent = shown;
          svgLength.style.transform = `translateY(${isExtended ? 39 : 0}px)`;
        }
        if (readoutSize) readoutSize.textContent = state.size;
        if (readoutLength) readoutLength.textContent = isExtended ? 'Extended' : 'Standard';
        if (readoutValue) readoutValue.textContent = shown;
        if (unavailable) unavailable.hidden = hasExtended;
      }

      sizeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          state.size = button.dataset.fitSize;
          render();
        });
      });

      lengthButtons.forEach((button) => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          state.length = button.dataset.fitLength;
          render();
        });
      });

      render();
    });
  }

  function init(root = document) {
    initProductGallery(root);
    initFit(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
