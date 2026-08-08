(() => {
  document.documentElement.classList.add('nabz-js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopRunway = window.matchMedia('(min-width: 961px)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatLength = (value) => `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')}"`;

  const bootEntry = () => {
    const entry = document.querySelector('[data-nabz-entry]');
    if (!entry || entry.dataset.nabzReady === 'true') return;
    entry.dataset.nabzReady = 'true';
    document.documentElement.classList.add('nabz-entry-active');

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      document.documentElement.classList.remove('nabz-entry-active');
      entry.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reducedMotion ? 80 : 180,
        easing: 'ease-out',
        fill: 'forwards',
      }).finished.finally(() => {
        entry.remove();
        document.dispatchEvent(new CustomEvent('nabz:intro-complete'));
      });
    };

    entry.querySelector('[data-nabz-entry-skip]')?.addEventListener('click', finish);
    window.setTimeout(finish, reducedMotion ? 720 : 3100);
  };

  const bootReveals = (root) => {
    const revealItems = [...root.querySelectorAll('[data-reveal], [data-shoulder-visual]')];
    if (!revealItems.length) return;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item) => observer.observe(item));
  };

  const bootPageChrome = (root) => {
    const home = root.querySelector('[data-nabz-home]');
    const header = document.querySelector('[data-nabz-header]');
    if (!home || home.dataset.nabzChromeReady === 'true') return;
    home.dataset.nabzChromeReady = 'true';

    const scenes = [...home.querySelectorAll('[data-nabz-scene]')];
    const links = [...home.querySelectorAll('[data-thread-link]')];
    const progress = home.querySelector('[data-thread-progress]');
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;
      const scrollRange = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const percentage = clamp(scrollY / scrollRange, 0, 1) * 100;
      if (progress) progress.style.setProperty('--nabz-page-progress', `${percentage}%`);

      if (header) {
        const movingDown = scrollY > lastY + 8;
        const movingUp = scrollY < lastY - 8;
        if (movingDown && scrollY > 180) header.classList.add('is-hidden');
        else if (movingUp || scrollY < 100) header.classList.remove('is-hidden');
      }
      lastY = scrollY;

      const hero = home.querySelector('#hero');
      const portrait = home.querySelector('[data-hero-portrait] img');
      const macro = home.querySelector('[data-hero-macro]');
      if (hero && portrait && scrollY < hero.offsetHeight * 1.2) {
        const heroProgress = clamp(scrollY / hero.offsetHeight, 0, 1);
        portrait.style.transform = `scale(${1.015 + heroProgress * .045}) translateY(${heroProgress * 1.8}%)`;
        if (macro) macro.style.transform = `translateY(${heroProgress * -22}px) rotate(${2.2 - heroProgress * 1.4}deg)`;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    const sceneObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { threshold: [0.24, 0.42, 0.62], rootMargin: '-10% 0px -22% 0px' });

    scenes.forEach((scene) => sceneObserver.observe(scene));
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  };

  const bootProductRunway = (root) => {
    root.querySelectorAll('[data-product-runway]').forEach((runway) => {
      if (runway.dataset.nabzReady === 'true') return;
      runway.dataset.nabzReady = 'true';

      const plates = [...runway.querySelectorAll('[data-product-plate]')];
      const jumpButtons = [...runway.querySelectorAll('[data-product-jump]')];
      const current = runway.querySelector('[data-product-current]');
      const stage = runway.querySelector('.nabz-product-runway__stage');
      const sticky = runway.querySelector('.nabz-product-runway__sticky');
      if (!plates.length || !stage || !sticky) return;
      let activeIndex = 0;
      let ticking = false;

      const twoDigits = (value) => String(value).padStart(2, '0');

      const setPlateVariables = (plate, index, selected) => {
        const distance = Math.abs(index - selected);
        const past = index < selected;
        plate.style.setProperty('--plate-distance', String(distance));
        plate.style.setProperty('--plate-shift-y', `${distance * (past ? 10 : 7)}px`);
        plate.style.setProperty('--plate-scale', String(Math.max(.68, (past ? .83 : .91) - distance * (past ? .025 : .035))));
        plate.style.setProperty('--plate-angle', `${(past ? -7 : 5) + distance * (past ? -1.4 : 1.2)}deg`);
        plate.style.setProperty('--plate-opacity', String(Math.max(.06, (past ? .36 : .58) - distance * (past ? .07 : .14))));
      };

      const activate = (index) => {
        const selected = clamp(index, 0, plates.length - 1);
        if (selected === activeIndex && plates[0].dataset.stateReady === 'true') return;
        activeIndex = selected;

        plates.forEach((plate, plateIndex) => {
          const state = plateIndex === selected ? 'active' : plateIndex < selected ? 'past' : 'next';
          plate.classList.toggle('is-active', state === 'active');
          plate.classList.toggle('is-past', state === 'past');
          plate.classList.toggle('is-next', state === 'next');
          plate.dataset.stateReady = 'true';
          setPlateVariables(plate, plateIndex, selected);
        });

        jumpButtons.forEach((button, buttonIndex) => {
          const active = buttonIndex === selected;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-selected', String(active));
        });
        if (current) current.textContent = twoDigits(selected + 1);
      };

      const updateFromScroll = () => {
        if (!desktopRunway.matches) {
          ticking = false;
          return;
        }
        const rect = runway.getBoundingClientRect();
        const travel = Math.max(1, runway.offsetHeight - sticky.offsetHeight);
        const progress = clamp(-rect.top / travel, 0, 1);
        activate(Math.round(progress * (plates.length - 1)));
        ticking = false;
      };

      const onScroll = () => {
        if (ticking || !desktopRunway.matches) return;
        ticking = true;
        window.requestAnimationFrame(updateFromScroll);
      };

      jumpButtons.forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.productJump);
          const travel = Math.max(1, runway.offsetHeight - sticky.offsetHeight);
          const destination = window.scrollY + runway.getBoundingClientRect().top + (index / Math.max(1, plates.length - 1)) * travel;
          window.scrollTo({ top: destination, behavior: reducedMotion ? 'auto' : 'smooth' });
        });
      });

      if (stage) {
        let mobileTimer = 0;
        stage.addEventListener('scroll', () => {
          if (desktopRunway.matches) return;
          window.clearTimeout(mobileTimer);
          mobileTimer = window.setTimeout(() => {
            const center = stage.scrollLeft + stage.clientWidth / 2;
            const nearest = plates.reduce((best, plate, index) => {
              const plateCenter = plate.offsetLeft + plate.offsetWidth / 2;
              const distance = Math.abs(center - plateCenter);
              return distance < best.distance ? { index, distance } : best;
            }, { index: 0, distance: Infinity });
            activate(nearest.index);
          }, 70);
        }, { passive: true });
      }

      const setRunwayMode = () => {
        const enhanced = desktopRunway.matches;
        runway.classList.toggle('is-enhanced', enhanced);
        if (enhanced) window.requestAnimationFrame(updateFromScroll);
        else activate(0);
      };

      desktopRunway.addEventListener('change', setRunwayMode);
      window.addEventListener('scroll', onScroll, { passive: true });
      activate(0);
      setRunwayMode();
    });
  };

  const bootFitStory = (root) => {
    root.querySelectorAll('[data-fit-story]').forEach((story) => {
      if (story.dataset.nabzReady === 'true') return;
      story.dataset.nabzReady = 'true';
      const problem = story.querySelector('[data-fit-story-state="problem"]');
      const solution = story.querySelector('[data-fit-story-state="solution"]');

      const show = (target, other) => {
        target.classList.add('is-active');
        target.setAttribute('aria-hidden', 'false');
        other.classList.remove('is-active');
        other.setAttribute('aria-hidden', 'true');
        if ('inert' in target) target.inert = false;
        if ('inert' in other) other.inert = true;
      };

      if ('inert' in solution) solution.inert = true;

      story.querySelector('[data-fit-story-next]')?.addEventListener('click', () => show(solution, problem));
      story.querySelector('[data-fit-story-back]')?.addEventListener('click', () => show(problem, solution));
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
          `C${shoulderLeft + 48} 75 ${shoulderLeft + 24} 83 ${shoulderLeft + 9} 92`,
          `Q${shoulderLeft - 3} 98 ${shoulderLeft - 11} 110`,
          `L${sleeveLeft} 163`,
          `Q${sleeveLeft - 3} 168 ${sleeveLeft + 2} 173`,
          `L${sleeveLeft + 27} 191`,
          `Q${sleeveLeft + 31} 193 ${sleeveLeft + 35} 188`,
          `L${bodyLeft} 157`,
          `L${bodyLeft} ${hemY - 18}`,
          `Q${bodyLeft + 8} ${hemY - 3} ${center} ${hemY + 8}`,
          `Q${bodyRight - 8} ${hemY - 3} ${bodyRight} ${hemY - 18}`,
          `L${bodyRight} 157`,
          `L${sleeveRight - 35} 188`,
          `Q${sleeveRight - 31} 193 ${sleeveRight - 27} 191`,
          `L${sleeveRight - 2} 173`,
          `Q${sleeveRight + 3} 168 ${sleeveRight} 163`,
          `L${shoulderRight + 11} 110`,
          `Q${shoulderRight + 3} 98 ${shoulderRight - 9} 92`,
          `C${shoulderRight - 24} 83 ${shoulderRight - 48} 75 251 69`,
          'Q235 73 232 68',
          'Q210 81 188 68',
          'Q185 73 169 69',
          'Z',
        ].join(' ');

        [outline, shadow, grain].forEach((path) => path.setAttribute('d', shirtPath));
        yoke.setAttribute('d', `M${shoulderLeft - 5} 105 Q${center} 129 ${shoulderRight + 5} 105`);
        armholes.setAttribute('d', `M${shoulderLeft - 6} 104Q${bodyLeft + 16} 128 ${bodyLeft} 157 M${shoulderRight + 6} 104Q${bodyRight - 16} 128 ${bodyRight} 157`);
        sleeveSeams.setAttribute('d', `M${sleeveLeft + 2} 163L${sleeveLeft + 30} 184 M${sleeveRight - 2} 163L${sleeveRight - 30} 184`);
        placket.setAttribute('d', `M204 91L204 ${hemY + 5} M216 91L216 ${hemY + 5}`);
        pocket.setAttribute('d', `M${center + 31} 139H${center + 78}V187Q${center + 55} 198 ${center + 31} 187Z`);
        pocketFlap.setAttribute('d', `M${center + 29} 138H${center + 80}V150H${center + 29}Z`);
        hem.setAttribute('d', `M${bodyLeft + 6} ${hemY - 7}Q${center} ${hemY + 13} ${bodyRight - 6} ${hemY - 7}`);
        buttons.innerHTML = [108, 139, 170, 201, 232, 263, 294, 325, 356]
          .filter((buttonY) => buttonY < hemY - 10)
          .map((buttonY) => `<circle cx="210" cy="${buttonY}" r="2"></circle>`)
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
        const duration = 360;

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
        fitLayout.querySelectorAll('[data-row]').forEach((row) => row.classList.toggle('is-active', row.dataset.row === size));
        fitLayout.querySelectorAll('[data-cell]').forEach((cell) => cell.classList.toggle('is-active', cell.dataset.cell === `${size}-${length}`));

        const selectedLength = values[size][length];
        const displayedLength = formatLength(selectedLength);
        output.textContent = `${size} · ${length} · ${displayedLength}`;
        measureText.textContent = displayedLength;
        animateShirt(values[size].width, lengthToHem(selectedLength));
      };

      sizeButtons.forEach((button) => button.addEventListener('click', () => { size = button.dataset.size; render(); }));
      lengthButtons.forEach((button) => button.addEventListener('click', () => { if (!button.disabled) { length = button.dataset.length; render(); } }));
      render();
    });
  };

  const boot = (root = document) => {
    const features = root === document
      ? [() => bootEntry(), () => bootReveals(root), () => bootPageChrome(root), () => bootProductRunway(root), () => bootFitStory(root), () => bootFitSelector(root)]
      : [() => bootReveals(root), () => bootPageChrome(root), () => bootProductRunway(root), () => bootFitStory(root), () => bootFitSelector(root)];

    features.forEach((initialize) => {
      try {
        initialize();
      } catch (error) {
        console.error('NABZ feature initialization failed.', error);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', (event) => boot(event.target));
})();
