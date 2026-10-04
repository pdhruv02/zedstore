  const bootEntry = () => {
    const entry = document.querySelector('[data-nabz-entry]');
    if (!entry || entry.dataset.nabzReady === 'true') return;
    entry.dataset.nabzReady = 'true';
    const deck = document.querySelector('[data-nabz-home]');
    const header = document.querySelector('[data-nabz-header]');
    document.body.classList.add('nabz-intro-pending');
    if (deck) deck.inert = true;
    if (header) header.inert = true;
    const animations = entry.getAnimations({subtree:true});
    animations.forEach(animation => { animation.pause(); animation.currentTime = 0; });
    let completed = false, fallback;
    const finish = () => {
      if (completed) return;
      completed = true;
      clearTimeout(fallback);
      entry.remove();
      document.body.classList.remove('nabz-intro-pending');
      if (deck) deck.inert = false;
      if (header) header.inert = false;
      document.dispatchEvent(new CustomEvent('nabz:intro-complete'));
    };
    entry.addEventListener('animationend', event => {
      if (event.target === entry && event.animationName === 'nabz-entry-release') finish();
    });
    const images = [entry.querySelector('img'),document.querySelector('.nabz-identity__portrait img')];
    const ready = Promise.allSettled([document.fonts.ready,...images.filter(Boolean).map(img => img.decode())]);
    Promise.race([ready,new Promise(resolve => setTimeout(resolve,1400))]).then(() => {
      if (completed) return;
      entry.classList.add('is-playing');
      animations.forEach(animation => animation.play());
      fallback = setTimeout(finish,reducedMotion ? 650 : 3400);
    });
  };
