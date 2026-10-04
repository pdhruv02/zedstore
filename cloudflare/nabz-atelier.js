(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const chapterNav = document.querySelector('.chapter-nav');
  const progress = document.querySelector('.page-progress i');
  const links = [...document.querySelectorAll('.chapter-nav a, .header-nav a')];
  let scheduled = false;
  const updateChapter = () => {
    scheduled = false;
    const header = document.querySelector('.site-header').offsetHeight;
    const line = header + (innerHeight-header)*.3;
    let active = chapters[0];
    for (const chapter of chapters) if (chapter.getBoundingClientRect().top <= line) active = chapter;
    links.forEach(link => {
      if (link.hash === '#'+active.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    chapterNav.classList.toggle('is-dark',['products','story','contact'].includes(active.id));
    const max = document.documentElement.scrollHeight-innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1,Math.max(0,scrollY/max)) : 0})`;
  };
  const schedule = () => {if (!scheduled) {scheduled = true; requestAnimationFrame(updateChapter);}};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  updateChapter();
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('is-enhanced');
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}
    }),{threshold:.06});
    document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
  }
  const cards = [...document.querySelectorAll('[data-product-card]')];
  const selectors = [...document.querySelectorAll('[data-product-select]')];
  const stage = document.querySelector('.gallery-stage');
  const viewer = document.querySelector('.image-viewer');
  let selected = 0,transition;
  const count = index => `${String(index+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
  const syncViewer = () => {
    const img = cards[selected].querySelector('img'),large = viewer.querySelector('img');
    large.src=img.src;large.alt=img.alt;
    document.querySelector('#viewer-title').textContent=selectors[selected].querySelector('b').textContent;
    viewer.querySelector('[data-viewer-count]').textContent=count(selected);
  };
  const select = (index,animate=true) => {
    selected=(index+cards.length)%cards.length;transition?.cancel();
    cards.forEach((card,i)=>card.hidden=i!==selected);
    selectors.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
    document.querySelector('[data-product-title]').textContent=selectors[selected].querySelector('b').textContent;
    document.querySelector('[data-product-count]').textContent=count(selected);
    if(animate&&!reduced)transition=cards[selected].animate([{opacity:.3,transform:'scale(1.015)'},{opacity:1,transform:'scale(1)'}],{duration:420,easing:'cubic-bezier(.22,.68,.2,1)'});
    if(matchMedia('(max-width:700px)').matches){const rail=document.querySelector('.product-index'),button=selectors[selected];rail.scrollTo({left:button.offsetLeft-rail.offsetLeft-(rail.clientWidth-button.clientWidth)/2,behavior:reduced?'instant':'smooth'});}
    if(viewer.open)syncViewer();
  };
  selectors.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
  document.querySelector('[data-product-previous]').addEventListener('click',()=>select(selected-1));
  document.querySelector('[data-product-next]').addEventListener('click',()=>select(selected+1));
  stage.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();select(selected+(event.key==='ArrowRight'?1:-1));}});
  let touch;
  stage.addEventListener('touchstart',event=>{if(event.touches.length===1)touch={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
  stage.addEventListener('touchend',event=>{if(!touch||event.changedTouches.length!==1){touch=null;return;}const dx=event.changedTouches[0].clientX-touch.x,dy=event.changedTouches[0].clientY-touch.y;touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.6)select(selected+(dx<0?1:-1));},{passive:true});
  stage.addEventListener('touchcancel',()=>touch=null,{passive:true});
  cards.forEach(card=>card.querySelector('button').addEventListener('click',()=>{syncViewer();viewer.showModal();}));
  viewer.querySelector('[data-viewer-close]').addEventListener('click',()=>viewer.close());
  viewer.querySelector('[data-viewer-previous]').addEventListener('click',()=>select(selected-1,false));
  viewer.querySelector('[data-viewer-next]').addEventListener('click',()=>select(selected+1,false));
  viewer.addEventListener('click',event=>{if(event.target===viewer){const box=viewer.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)viewer.close();}});
  viewer.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();select(selected+(event.key==='ArrowRight'?1:-1),false);}});
  viewer.addEventListener('close',()=>cards[selected].querySelector('button').focus({preventScroll:true}));
  select(0,false);
  const tabs=[...document.querySelectorAll('.fit-tabs [role="tab"]')];
  const setTab=index=>tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>setTab(i));tab.addEventListener('keydown',event=>{const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:event.key==='ArrowRight'?(i+1)%tabs.length:event.key==='ArrowLeft'?(i-1+tabs.length)%tabs.length:null;if(next!==null){event.preventDefault();setTab(next);tabs[next].focus();}});});
  const video=document.querySelector('[data-story-video]'),play=document.querySelector('[data-story-play]'),filmError=document.querySelector('[data-story-error]');
  video.controls=false;
  const showFilmError=()=>{filmError.hidden=false;play.hidden=true;video.controls=true;};
  play.addEventListener('click',async()=>{try{video.controls=true;await video.play();filmError.hidden=true;play.hidden=true;}catch{showFilmError();}});
  video.addEventListener('play',()=>{play.hidden=true;video.controls=true;});
  video.addEventListener('ended',()=>{play.hidden=false;play.querySelector('span:last-child').innerHTML='Watch again<small>01:12</small>';});
  video.addEventListener('error',showFilmError);video.querySelector('source').addEventListener('error',showFilmError);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting&&!video.paused)video.pause();},{threshold:0}).observe(video);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
  document.querySelector('[data-static-contact-form]').addEventListener('submit',event=>event.preventDefault());
})();
