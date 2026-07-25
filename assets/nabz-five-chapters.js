(() => {
  const start = () => {
    const root = document.querySelector('[data-nabz-home]');
    if (!root || root.dataset.ready === 'true') return;
    root.dataset.ready = 'true';

    const panels = [...root.querySelectorAll('[data-product-panel]')];
    const activatePanel = (panel) => {
      panels.forEach((item) => {
        const active = item === panel;
        item.classList.toggle('is-active', active);
        item.querySelector('[data-product-activate]')?.setAttribute('aria-pressed', String(active));
      });
    };
    panels.forEach((panel) => {
      panel.querySelector('[data-product-activate]')?.addEventListener('click', () => activatePanel(panel));
      panel.addEventListener('focusin', () => activatePanel(panel));
    });

    const fitRoot = root.querySelector('[data-fit-root]');
    if (!fitRoot) return;
    const data = {
      S: { width: 0.90, Standard: '26.75"', Extended: null },
      M: { width: 1.00, Standard: '27"', Extended: '28.5"' },
      L: { width: 1.10, Standard: '27.75"', Extended: '29.25"' },
      XL: { width: 1.20, Standard: '28.5"', Extended: null }
    };
    const hemY = { Standard: 404, Extended: 438 };
    const sizeButtons = [...fitRoot.querySelectorAll('[data-fit-size]')];
    const lengthButtons = [...fitRoot.querySelectorAll('[data-fit-length]')];
    const body = fitRoot.querySelector('[data-shirt-body]');
    const placket = fitRoot.querySelector('[data-shirt-placket]');
    const measureLine = fitRoot.querySelector('[data-measure-line]');
    const measureCap = fitRoot.querySelector('[data-measure-cap]');
    const measureText = fitRoot.querySelector('[data-measure-text]');
    const output = fitRoot.querySelector('[data-fit-output]');
    const unavailable = fitRoot.querySelector('[data-fit-unavailable]');
    const tableBody = fitRoot.querySelector('[data-fit-table]');
    const svg = fitRoot.querySelector('.nabz-fit__shirt');
    let size = 'M';
    let length = 'Standard';

    const drawTable = () => {
      tableBody.innerHTML = Object.entries(data).map(([key, value]) => `<tr><td>${key}</td><td>${value.Standard}</td><td>${value.Extended || 'Not initially offered'}</td></tr>`).join('');
    };

    const render = () => {
      const state = data[size];
      const canExtend = Boolean(state.Extended);
      const extendedButton = lengthButtons.find((button) => button.dataset.fitLength === 'Extended');
      extendedButton.setAttribute('aria-disabled', String(!canExtend));
      if (!canExtend && length === 'Extended') {
        length = 'Standard';
        unavailable.textContent = 'Not initially offered';
      } else {
        unavailable.textContent = canExtend ? '' : 'Not initially offered';
      }

      sizeButtons.forEach((button) => {
        const active = button.dataset.fitSize === size;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      lengthButtons.forEach((button) => {
        const active = button.dataset.fitLength === length;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      const half = 58 * state.width;
      const left = 180 - half;
      const right = 180 + half;
      const y = hemY[length];
      body.setAttribute('d', `M122 174 L${left.toFixed(1)} ${y} Q180 ${y + 20} ${right.toFixed(1)} ${y} L238 174`);
      placket.setAttribute('y2', String(y + 10));
      measureLine.setAttribute('y2', String(y + 10));
      measureCap.setAttribute('y1', String(y + 10));
      measureCap.setAttribute('y2', String(y + 10));
      measureText.textContent = state[length] || 'Not initially offered';
      measureText.setAttribute('y', String((104 + y) / 2));
      measureText.setAttribute('transform', `rotate(90 320 ${(104 + y) / 2})`);
      output.textContent = `${size} + ${length} + ${state[length]}`;
      svg.setAttribute('aria-label', `Shirt diagram showing ${size} ${length} at ${state[length]}`);
    };

    sizeButtons.forEach((button) => button.addEventListener('click', () => { size = button.dataset.fitSize; render(); }));
    lengthButtons.forEach((button) => button.addEventListener('click', () => {
      const requested = button.dataset.fitLength;
      if (requested === 'Extended' && !data[size].Extended) {
        unavailable.textContent = 'Not initially offered';
        return;
      }
      length = requested;
      render();
    }));

    drawTable();
    render();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
