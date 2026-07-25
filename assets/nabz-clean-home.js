(() => {
  const boot = (root = document) => {
    root.querySelectorAll('[data-product-gallery]').forEach((gallery) => {
      if (gallery.dataset.nabzReady === 'true') return;
      gallery.dataset.nabzReady = 'true';

      const panels = [...gallery.querySelectorAll('[data-product-panel]')];
      panels.forEach((panel) => {
        panel.addEventListener('click', () => {
          panels.forEach((item) => {
            const active = item === panel;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-pressed', String(active));
          });
        });
      });
    });

    root.querySelectorAll('[data-fit-selector]').forEach((selector) => {
      if (selector.dataset.nabzReady === 'true') return;
      selector.dataset.nabzReady = 'true';

      const values = {
        S: { Standard: '26.75"', Extended: null },
        M: { Standard: '27"', Extended: '28.5"' },
        L: { Standard: '27.75"', Extended: '29.25"' },
        XL: { Standard: '28.5"', Extended: null },
      };

      let size = 'M';
      let length = 'Standard';
      const sizeButtons = [...selector.querySelectorAll('[data-size]')];
      const lengthButtons = [...selector.querySelectorAll('[data-length]')];
      const output = selector.querySelector('[data-fit-output]');

      const render = () => {
        const extendedButton = selector.querySelector('[data-length="Extended"]');
        const extendedAvailable = Boolean(values[size].Extended);
        extendedButton.disabled = !extendedAvailable;
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

        output.textContent = `${size} · ${length} · ${values[size][length]}`;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => boot(event.target));
})();
