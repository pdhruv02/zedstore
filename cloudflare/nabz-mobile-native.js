(() => {
  const mobile = window.matchMedia('(max-width: 960px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const enhanceProductRail = () => {
    document.querySelectorAll('[data-product-archive]').forEach((archive) => {
      const cards = [...archive.querySelectorAll('[data-product-card]')];
      const buttons = [...archive.querySelectorAll('[data-product-select]')];
      buttons.forEach((button, index) => {
        if (button.querySelector('img')) return;
        const source = cards[index]?.querySelector('img')?.getAttribute('src');
        if (!source) return;
        const thumb = document.createElement('img');
        thumb.src = source;
        thumb.alt = '';
        thumb.loading = 'lazy';
        thumb.setAttribute('aria-hidden', 'true');
        button.prepend(thumb);
      });
      buttons.forEach((button) => button.addEventListener('click', () => {
        if (!mobile.matches) return;
        button.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      }));
    });
  };

  const enhanceFit = () => {
    document.querySelectorAll('[data-fit-selector]').forEach((ledger) => {
      if (ledger.querySelector('.nabz-mobile-fit-nav')) return;
      const nav = document.createElement('div');
      nav.className = 'nabz-mobile-fit-nav';
      nav.setAttribute('role', 'tablist');
      nav.setAttribute('aria-label', 'Fit explanation');
      nav.innerHTML = '<button class="is-active" type="button" data-mobile-fit-tab="problem">Problem</button><button type="button" data-mobile-fit-tab="illustration">Illustration</button><button type="button" data-mobile-fit-tab="system">System</button>';
      ledger.prepend(nav);
      const problem = ledger.querySelector('[data-fit-story-panel="problem"]');
      const solution = ledger.querySelector('[data-fit-story-panel="solution"]');
      const setState = (state) => {
        ledger.dataset.mobileFit = state;
        nav.querySelectorAll('button').forEach((button) => button.classList.toggle('is-active', button.dataset.mobileFitTab === state));
        if (!mobile.matches) return;
        if (problem) {
          problem.hidden = state !== 'problem';
          problem.classList.toggle('is-active', state === 'problem');
        }
        if (solution) {
          solution.hidden = state !== 'system';
          solution.classList.toggle('is-active', state === 'system');
        }
      };
      nav.addEventListener('click', (event) => {
        const button = event.target.closest('[data-mobile-fit-tab]');
        if (!button) return;
        setState(button.dataset.mobileFitTab);
      });
      setState('problem');
      mobile.addEventListener('change', () => {
        if (mobile.matches) setState(ledger.dataset.mobileFit || 'problem');
        else {
          delete ledger.dataset.mobileFit;
          if (problem) problem.hidden = false;
          const activeDesktop = ledger.querySelector('[data-fit-story-tab].is-active')?.dataset.fitStoryTab || 'problem';
          if (problem) problem.hidden = activeDesktop !== 'problem';
          if (solution) solution.hidden = activeDesktop !== 'solution';
        }
      });
    });
  };

  const enhanceStory = () => {
    document.querySelectorAll('[data-story-film]').forEach((film) => {
      const video = film.querySelector('video');
      if (!video) return;
      const source = video.querySelector('source');
      const playable = () => film.classList.add('is-playable');
      const unavailable = () => film.classList.remove('is-playable');
      video.addEventListener('loadedmetadata', playable, { once: true });
      video.addEventListener('canplay', playable, { once: true });
      video.addEventListener('error', unavailable);
      source?.addEventListener('error', unavailable);
      video.addEventListener('play', () => film.classList.add('is-playing'));
      video.addEventListener('pause', () => film.classList.remove('is-playing'));
      video.addEventListener('ended', () => film.classList.remove('is-playing'));
    });
  };

  const enhanceStaticForm = () => {
    document.querySelectorAll('[data-static-contact-form]').forEach((form) => {
      if (form.dataset.staticBound === 'true') return;
      form.dataset.staticBound = 'true';
      const note = document.createElement('p');
      note.className = 'nabz-static-form-note';
      note.hidden = true;
      note.setAttribute('role', 'status');
      form.append(note);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        note.hidden = false;
        note.textContent = 'The contact form is temporarily offline while NABZ is hosted independently.';
      });
    });
  };

  const bootMobileDeck = () => {
    const deck = document.querySelector('[data-nabz-home]');
    const ui = deck?.querySelector('[data-deck-ui]');
    if (!deck || !ui) return;
    const chapters = [...deck.querySelectorAll('[data-nabz-chapter]')];
    if (chapters.length !== 5) return;
    const names = ['Identity', 'Surface', 'Fit', 'Story', 'Contact'];
    let active = Math.max(0, chapters.findIndex((chapter) => `#${chapter.id}` === location.hash));
    let startX = 0;
    let startY = 0;
    let enabled = false;

    ui.innerHTML = `<div class="nabz-mobile-progress" aria-hidden="true"><i></i></div><div class="nabz-mobile-dock">${names.map((name, index) => `<button type="button" data-mobile-chapter="${index}"><span></span>${name}</button>`).join('')}</div>`;
    const progress = ui.querySelector('.nabz-mobile-progress i');
    const dockButtons = [...ui.querySelectorAll('[data-mobile-chapter]')];

    const apply = (announce = false) => {
      chapters.forEach((chapter, index) => {
        const state = index === active ? 'active' : index < active ? 'past' : 'future';
        chapter.dataset.mobileState = state;
        chapter.classList.toggle('is-active', index === active);
        chapter.setAttribute('aria-hidden', String(index !== active));
        if ('inert' in chapter) chapter.inert = index !== active;
      });
      dockButtons.forEach((button, index) => {
        button.classList.toggle('is-active', index === active);
        button.setAttribute('aria-current', index === active ? 'true' : 'false');
      });
      if (progress) progress.style.transform = `translateX(${active * 100}%)`;
      if (history.replaceState) history.replaceState(null, '', `#${chapters[active].id}`);
      if (announce) document.title = `NABZ · ${names[active]}`;
    };

    const go = (index) => {
      if (!enabled) return;
      active = (index + chapters.length) % chapters.length;
      apply(true);
    };
    const enable = () => {
      if (enabled || !mobile.matches) return;
      enabled = true;
      document.body.classList.add('nabz-mobile-deck-active');
      apply(false);
    };
    const disable = () => {
      if (!enabled) return;
      enabled = false;
      document.body.classList.remove('nabz-mobile-deck-active');
      chapters.forEach((chapter) => {
        delete chapter.dataset.mobileState;
        chapter.removeAttribute('aria-hidden');
        if ('inert' in chapter) chapter.inert = false;
      });
      document.title = 'NABZ';
    };

    dockButtons.forEach((button) => button.addEventListener('click', () => go(Number(button.dataset.mobileChapter))));
    deck.addEventListener('touchstart', (event) => {
      if (!enabled || event.touches.length !== 1) return;
      if (event.target.closest('button,a,input,textarea,select,video,.nabz-archive__index,.nabz-fit-ledger__controls')) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener('touchend', (event) => {
      if (!enabled || !startY || event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      startX = 0;
      startY = 0;
      if (Math.abs(dy) < 48 || Math.abs(dy) <= Math.abs(dx) * 1.1) return;
      go(active + (dy < 0 ? 1 : -1));
    }, { passive: true });
    document.addEventListener('keydown', (event) => {
      if (!enabled || event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
      if (['ArrowDown', 'PageDown'].includes(event.key)) { event.preventDefault(); go(active + 1); }
      if (['ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); go(active - 1); }
    });
    mobile.addEventListener('change', () => mobile.matches ? enable() : disable());
    enable();
  };

  const boot = () => {
    enhanceProductRail();
    enhanceFit();
    enhanceStory();
    enhanceStaticForm();
    bootMobileDeck();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();