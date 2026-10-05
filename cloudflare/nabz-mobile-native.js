(() => {
  const mobile = matchMedia('(max-width: 960px)');
  const desktop = matchMedia('(min-width: 961px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const deck = document.querySelector('[data-nabz-home]');
  if (!deck) return;
  const chapters = [...deck.querySelectorAll('[data-nabz-chapter]')];
  const names = ['Identity', 'Surface', 'Fit', 'Story', 'Contact'];
  const detailToggle=document.querySelector('[data-detail-toggle]');
  const detail=document.querySelector('#NabzThreadDetail');
  const closeDetail=()=>{if(!detailToggle)return;detailToggle.setAttribute('aria-expanded','false');detail.hidden=true;document.querySelector('.nabz-identity').classList.remove('is-detail');detailToggle.firstElementChild.textContent='Thread, seen closer';};
  detailToggle?.addEventListener('click',()=>{const open=detailToggle.getAttribute('aria-expanded')!=='true';detailToggle.setAttribute('aria-expanded',String(open));detail.hidden=!open;document.querySelector('.nabz-identity').classList.toggle('is-detail',open);detailToggle.firstElementChild.textContent=open?'Back to the shirt':'Thread, seen closer';});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&detailToggle?.getAttribute('aria-expanded')==='true'){closeDetail();detailToggle.focus();}});
  let active = Math.max(0, chapters.findIndex(chapter => `#${chapter.id}` === location.hash));
  let mode = 'native';
  let touch = null;
  let wheel = 0;
  let wheelTimer;
  let wheelLock = 0;
  let wheelConsumed = false;
  let lastWheel = 0;
  const dock = document.createElement('nav');
  dock.className = 'nabz-mobile-deck-ui';
  dock.dataset.mobileDeckUi = '';
  dock.setAttribute('aria-label', 'Mobile chapter navigation');
  dock.innerHTML = `<div class="nabz-mobile-progress" aria-hidden="true"><i></i></div><div class="nabz-mobile-dock">${names.map((name, i) => `<button type="button" data-mobile-chapter="${i}" aria-label="${name} chapter"><span></span>${name}</button>`).join('')}</div>`;
  document.body.append(dock);
  const dockButtons = [...dock.querySelectorAll('button')];
  const progress = dock.querySelector('i');
  const count = deck.querySelector('[data-deck-count]');
  const live = deck.querySelector('[data-deck-live]');
  const setStates = () => {
    chapters.forEach((chapter, i) => {
      const state = i === active ? 'active' : i < active ? 'past' : 'future';
      delete chapter.dataset.deckState;
      delete chapter.dataset.mobileState;
      if (mode !== 'native') chapter.dataset[mode === 'mobile' ? 'mobileState' : 'deckState'] = state;
      chapter.classList.toggle('is-active', i === active);
      chapter.inert = mode !== 'native' && i !== active;
      if (mode === 'native') chapter.removeAttribute('aria-hidden');
      else chapter.setAttribute('aria-hidden', String(i !== active));
      if (i !== active) chapter.querySelectorAll('video').forEach(video => video.pause());
    });
    document.querySelectorAll('.nabz-site-header__nav a').forEach(link=>{if(link.hash==='#'+chapters[active].id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    dockButtons.forEach((button, i) => {
      button.classList.toggle('is-active', i === active);
      if (i === active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    progress.style.transform = `translateX(${active * 100}%)`;
    if (count) count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
  };
  const go = (index, updateHash = true) => {
    const next = (index + chapters.length) % chapters.length;
    if (next === active || document.body.classList.contains('nabz-intro-pending')) return;
    const previous = chapters[active];
    closeDetail();
    const hadFocus = previous.contains(document.activeElement);
    active = next;
    setStates();
    if (updateHash) history.replaceState(null, '', `#${chapters[active].id}`);
    if (mode === 'native') chapters[active].scrollIntoView({behavior: reduced ? 'instant' : 'smooth'});
    if (hadFocus) chapters[active].focus({preventScroll: true});
    if (live) live.textContent = `Chapter ${active + 1} of ${chapters.length}: ${names[active]}`;
  };
  const resize = () => {
    closeDetail();
    mode = mobile.matches ? 'mobile' : desktop.matches ? 'desktop' : 'native';
    document.body.classList.toggle('nabz-mobile-deck-active', mode === 'mobile');
    document.body.classList.toggle('nabz-deck-active', mode === 'desktop');
    if (mode === 'desktop') deck.dataset.nabzDeckReady = 'true';
    else delete deck.dataset.nabzDeckReady;
    setStates();
    syncFit();
    if (mode !== 'native') window.scrollTo(0, 0);
  };
  const canScroll = (target, delta) => {
    for (let node = target instanceof Element ? target : null; node && node !== deck; node = node.parentElement) {
      if (!/(auto|scroll)/.test(getComputedStyle(node).overflowY)) continue;
      if (delta > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 2) return true;
      if (delta < 0 && node.scrollTop > 2) return true;
    }
    return false;
  };
  chapters.forEach(chapter => chapter.tabIndex = -1);
  dockButtons.forEach((button, i) => button.addEventListener('click', () => go(i)));
  deck.querySelector('[data-deck-previous]')?.addEventListener('click', () => go(active - 1));
  deck.querySelector('[data-deck-next]')?.addEventListener('click', () => go(active + 1));
  const desktopUI=deck.querySelector('[data-deck-ui]');
  if(desktopUI)document.body.append(desktopUI);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const index = chapters.findIndex(chapter => `#${chapter.id}` === link.getAttribute('href'));
    if (index < 0 || mode === 'native') return;
    event.preventDefault();
    go(index);
  });
  window.addEventListener('hashchange', () => {
    const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
    if (index >= 0) go(index, false);
  });
  document.addEventListener('keydown', event => {
    if (mode === 'native' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('button,a,input,textarea,select,video,[contenteditable="true"]')) return;
    const keys = {ArrowDown: active + 1, PageDown: active + 1, ArrowUp: active - 1, PageUp: active - 1, Home: 0, End: chapters.length - 1};
    if (!(event.key in keys)) return;
    event.preventDefault();
    go(keys[event.key]);
  });
  document.addEventListener('wheel', event => {
    if (mode === 'native' || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    if (document.body.classList.contains('nabz-intro-pending')) { event.preventDefault(); return; }
    if (canScroll(event.target,event.deltaY)) return;
    event.preventDefault();
    const now=performance.now();
    if(now-lastWheel>500){wheelConsumed=false;wheel=0;}
    lastWheel=now;
    clearTimeout(wheelTimer);
    wheelTimer=setTimeout(()=>{wheel=0;wheelConsumed=false;},520);
    if(wheelConsumed||now<wheelLock)return;
    wheel+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
    if(Math.abs(wheel)<60)return;
    const next=Math.max(0,Math.min(chapters.length-1,active+Math.sign(wheel)));
    if(next!==active)go(next);
    wheelConsumed=true;wheel=0;
    wheelLock=now+(reduced?80:920);
  },{passive:false});
  deck.addEventListener('touchstart', event => {
    touch = null;
    if (mode === 'native' || event.touches.length !== 1 || event.target.closest('button,a,input,textarea,select,video,.nabz-archive__index')) return;
    const point = event.touches[0];
    const scrolls = [];
    for (let node = event.target; node && node !== deck; node = node.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) scrolls.push({top: node.scrollTop, maximum: node.scrollHeight - node.clientHeight});
    }
    touch = {x: point.clientX, y: point.clientY, target: event.target, scrolls};
  }, {passive: true});
  deck.addEventListener('touchend', event => {
    const start = touch;
    touch = null;
    if (!start || event.changedTouches.length !== 1 || document.body.classList.contains('nabz-intro-pending') || performance.now()<wheelLock) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dy) < 60 || Math.abs(dy) <= Math.abs(dx) * 1.2 || start.scrolls.some(scroll => dy < 0 ? scroll.top < scroll.maximum - 2 : scroll.top > 2)) return;
    go(Math.max(0,Math.min(chapters.length-1,active+(dy<0?1:-1))));
    wheelLock=performance.now()+(reduced?80:920);
  }, {passive: true});
  deck.addEventListener('touchcancel', () => touch = null, {passive: true});

  document.querySelectorAll('[data-product-archive]').forEach(archive => {
    const cards = [...archive.querySelectorAll('[data-product-card]')];
    archive.querySelectorAll('[data-product-select]').forEach((button, i) => {
      const thumb = document.createElement('img');
      thumb.src = cards[i].querySelector('img').src;
      thumb.alt = '';
      thumb.loading = 'lazy';
      button.prepend(thumb);
      button.addEventListener('click', () => {
        if (!mobile.matches) return;
        const rail = button.parentElement;
        rail.scrollTo({left: button.offsetLeft - rail.offsetLeft - (rail.clientWidth - button.clientWidth) / 2, behavior: reduced ? 'instant' : 'smooth'});
      });
    });
  });

  const fits = [...document.querySelectorAll('[data-fit-selector]')];
  fits.forEach(ledger => {
    const nav = document.createElement('div');
    nav.className = 'nabz-mobile-fit-nav';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Fit explanation');
    nav.innerHTML = ['problem', 'illustration', 'system'].map((name, i) => `<button type="button" role="tab" data-mobile-fit-tab="${name}" aria-selected="${i === 0}" aria-controls="${name === 'illustration' ? 'NabzFitIllustration' : name === 'system' ? 'NabzFitSystem' : 'NabzFitProblem'}">${name[0].toUpperCase() + name.slice(1)}</button>`).join('');
    ledger.prepend(nav);
    const instrument = ledger.querySelector('.nabz-fit-ledger__instrument');
    instrument.id = 'NabzFitIllustration';
    ledger.dataset.mobileFit = 'problem';
    nav.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      ledger.dataset.mobileFit = button.dataset.mobileFitTab;
      syncFit();
    });
    nav.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const buttons = [...nav.querySelectorAll('button')];
      const index = (buttons.indexOf(event.target) + (event.key === 'ArrowRight' ? 1 : -1) + 3) % 3;
      buttons[index].click();
      buttons[index].focus();
    });
  });
  function syncFit() {
    fits.forEach(ledger => {
      const state = ledger.dataset.mobileFit || 'problem';
      ledger.querySelectorAll('[data-mobile-fit-tab]').forEach(button => {
        const selected = button.dataset.mobileFitTab === state;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      const selected = mobile.matches ? (state === 'system' ? 'solution' : state) : ledger.querySelector('[data-fit-story-tab].is-active')?.dataset.fitStoryTab || 'problem';
      ledger.querySelectorAll('[data-fit-story-panel]').forEach(panel => {
        const visible = panel.dataset.fitStoryPanel === selected;
        panel.hidden = !visible;
        panel.classList.toggle('is-active', visible);
        panel.setAttribute('aria-hidden', String(!visible));
      });
    });
  }
  document.querySelectorAll('[data-story-film]').forEach(film => {
    const video = film.querySelector('video');
    const play = film.querySelector('[data-story-play]');
    const error = film.querySelector('[data-story-error]');
    video.controls=false;film.classList.add('has-film-player');
    const showError = () => { error.hidden = false; play.hidden = true; video.controls=true; };
    video.addEventListener('error', showError);
    video.querySelector('source')?.addEventListener('error', showError);
    play.addEventListener('click', async () => {
      try { video.controls=true; await video.play(); } catch { showError(); }
    });
    video.addEventListener('play', () => { play.hidden = true; error.hidden = true; });
    video.addEventListener('pause', () => { if(video.currentTime===0)play.hidden=false; });
    video.addEventListener('ended', () => { play.hidden = false; });
  });
  document.querySelectorAll('[data-static-contact-form]').forEach(form=>{
    const note=document.createElement('p');note.className='nabz-static-form-note';note.setAttribute('role','status');
    note.textContent='Online enquiries are currently paused.';form.prepend(note);
    form.querySelectorAll('input,textarea,button').forEach(field=>field.disabled=true);
    const button=form.querySelector('button');button.firstChild.textContent='Enquiries paused ';
    form.addEventListener('submit',event=>event.preventDefault());
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(video=>video.pause());});
  mobile.addEventListener('change', resize);
  desktop.addEventListener('change', resize);
  resize();
})();
