(() => {
  'use strict';
  const projects = window.PORTFOLIO_PROJECTS || [];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const themeSwitch = $('#themeSwitch');
  const projectGrid = $('#projectGrid');
  const projectDialog = $('#projectDialog');
  const detailBody = $('#projectDialogBody');
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightboxImage');
  const lightboxCounter = $('#lightboxCounter');
  const contactDialog = $('#contactDialog');
  let currentProject = null;
  let currentLightboxIndex = 0;
  let projectImages = [];

  // Theme: stored on this browser; both modes keep the same content.
  const applyTheme = (theme, persist=true) => {
    const colorful = theme === 'colorful';
    document.body.classList.toggle('theme-colorful', colorful);
    document.body.classList.toggle('theme-dark', !colorful);
    themeSwitch.setAttribute('aria-pressed', String(colorful));
    themeSwitch.setAttribute('aria-label', colorful ? 'Switch to dark gradient theme' : 'Switch to colorful gradient theme');
    $('.theme-label', themeSwitch).textContent = colorful ? 'COLOR' : 'DARK';
    $('meta[name="theme-color"]').setAttribute('content', colorful ? '#273b78' : '#0a1220');
    if (persist) { try { localStorage.setItem('yv-portfolio-theme',theme); } catch (_) {} }
  };
  let saved='dark';
  try { saved=localStorage.getItem('yv-portfolio-theme') || 'dark'; } catch (_) {}
  applyTheme(saved, false);
  themeSwitch.addEventListener('click',()=>applyTheme(document.body.classList.contains('theme-colorful') ? 'dark' : 'colorful'));

  // Lightweight project cards (images load as needed).
  const observer=('IntersectionObserver' in window && !reducedMotion)
    ? new IntersectionObserver((entries)=>{
        entries.forEach(({target,isIntersecting})=>{
          if(isIntersecting){target.classList.add('is-visible');observer.unobserve(target);}
        });
      },{threshold:.09,rootMargin:'0px 0px 30px 0px'}) : null;
  const observe = (node) => {
    if (!observer) node.classList.add('is-visible');
    else observer.observe(node);
  };
  $$('.reveal').forEach(observe);

  function renderCards(filter='All') {
    const list = projects.filter(p=>filter==='All' || p.category===filter);
    projectGrid.innerHTML='';
    list.forEach((p,i)=>{
      const card = document.createElement('button');
      card.type='button';
      card.className=`project-card reveal ${filter==='All' && (i===0 || i===list.length-1) ? 'v6-wide' : ''} ${filter!=='All' && list.length%2===1 && i===list.length-1 ? 'v6-wide' : ''}`;
      card.dataset.slug=p.slug;
      card.dataset.heroSrc=p.images[0].src;
      card.style.setProperty('--project-date',JSON.stringify(p.timeline||''));
      card.style.setProperty('--card-tone', ({amazon:'#7354e8',betla:'#21695a',jcb:'#b18032','linkedin-tc':'#315ea3',jio:'#7e6b60',tata:'#4c6fcd',phonepe:'#ab4ac1'})[p.slug]||'#6f6c9b');
      card.setAttribute('aria-label',`View ${p.title} project and gallery`);
      card.innerHTML=`
        <div class="project-media"><div class="project-media-mat"><img src="${p.images[0].src}" alt="${p.images[0].caption}" loading="lazy" decoding="async"></div><span class="project-num">${String(projects.indexOf(p)+1).padStart(2,'0')} / ${projects.length}</span><span class="project-enter" aria-hidden="true">↗</span></div>
        <div class="project-body"><div><span class="project-type">${p.type}</span><h3>${p.title}</h3><span class="project-timeline">${p.timelineLabel||'Project date'} · ${p.timeline||''}</span><p>${p.subtitle}</p></div><span class="project-chevron" aria-hidden="true">↗</span></div>`;
      card.addEventListener('click',()=>openProject(p.slug));
      if(finePointer && !reducedMotion){
        card.addEventListener('pointermove',e=>{
          const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width;const y=(e.clientY-r.top)/r.height;
          card.style.setProperty('--tilt-y',`${(x-.5)*6}deg`);
          card.style.setProperty('--tilt-x',`${(.5-y)*5}deg`);
          card.style.setProperty('--glow-x',`${x*100}%`);card.style.setProperty('--glow-y',`${y*100}%`);card.style.setProperty('--hot-x',`${x*100}%`);card.style.setProperty('--hot-y',`${y*100}%`);
        },{passive:true});
        card.addEventListener('pointerleave',()=>{card.style.removeProperty('--tilt-y');card.style.removeProperty('--tilt-x');card.style.removeProperty('--hot-x');card.style.removeProperty('--hot-y');});
      }
      projectGrid.appendChild(card);
      observe(card);
    });
    if(!list.length)projectGrid.innerHTML='<p>No projects in this category yet.</p>';
  }
  renderCards();
  $$('.filter').forEach(b=>b.addEventListener('click',()=>{
    $$('.filter').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});
    b.classList.add('active');b.setAttribute('aria-pressed','true');
    renderCards(b.dataset.filter);
  }));

  // Project case study: editorial imagery + metadata + a navigable zone journey.
  function renderProject(p){
    const clean = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const highlights=p.highlights.map(x=>`<span>${clean(x)}</span>`).join('');
    const imgs=p.images.map((x,i)=>`<button type="button" class="gallery-frame" data-image-index="${i}" data-zone="${clean(x.zone||'Selected views')}" aria-label="Enlarge render ${i+1}: ${clean(x.caption)}"><div class="gallery-media"><img src="${clean(x.src)}" alt="${clean(x.caption)}" loading="lazy" decoding="async"><span class="gallery-zoom" aria-hidden="true">↗</span></div><span class="frame-caption"><b>${String(i+1).padStart(2,'0')} / ${clean(x.caption)}</b><small class="detail-zone">${clean(x.zone||'SELECTED VIEW')}</small></span></button>`).join('');
    const zones=[...new Set(p.images.map(im=>im.zone||'Selected views'))];
    const zoneButtons=zones.length>1?`<div class="zone-navigation"><p class="kicker">NAVIGATE THE EXPERIENCE</p><div class="zone-filters" id="zoneFilters"><button type="button" class="zone-filter active" data-zone="ALL" aria-pressed="true">ALL VIEWS <sup>${p.images.length}</sup></button>${zones.map((z,i)=>`<button type="button" class="zone-filter" data-zone="${clean(z)}" aria-pressed="false"><span class="zone-count">${String(i+1).padStart(2,'0')}</span> ${clean(z)}</button>`).join('')}</div></div>`:'';
    const venue=p.venue?`<div><span>VENUE / LOCATION</span><strong>${clean(p.venue)}</strong></div>`:'';
    const timeline=p.timeline?`<div><span>${clean(p.timelineLabel||'PROJECT TIMELINE').toUpperCase()}</span><strong>${clean(p.timeline)}</strong></div>`:'';
    const specialGuest=p.specialGuest?`<div><span>SPECIAL GUEST</span><strong>${clean(p.specialGuest)}</strong></div>`:'';
    const note=p.project_note?`<p class="project-note">${clean(p.project_note)}</p>`:'';
    detailBody.innerHTML=`
      <button class="overlay-close" id="projectClose" type="button" aria-label="Close project">×</button>
      <div class="detail-hero"><img src="${clean(p.images[0].src)}" alt="${clean(p.images[0].caption)}" decoding="async"><div class="detail-hero-info"><p class="kicker">${clean(p.category.toUpperCase())} / ${clean(p.type.toUpperCase())}</p><h2>${clean(p.title)}</h2><p>${clean(p.subtitle)}</p></div></div>
      <div class="detail-content"><p class="detail-section-number">THE STORY / 01</p><div class="detail-intro"><div class="detail-lead">${clean(p.summary)}</div><aside>${venue}${timeline}${specialGuest}<div><span>MY CONTRIBUTION</span><strong>${clean(p.role)}</strong></div><div><span>SOFTWARE</span><strong>${clean(p.software.join(' · '))}</strong></div><div><span>PROJECT TYPE</span><strong>${clean(p.type)}</strong></div></aside></div>
      <div class="detail-columns"><div><h3>Project scope</h3><p>${clean(p.scope)}</p></div><div><h3>Design approach</h3><p>${clean(p.story)}</p></div></div>
      <div class="detail-highlights">${highlights}</div>${note}
      <div class="detail-gallery-heading" id="detailGalleryHeading"><div><p class="detail-section-number">THE EXPERIENCE / 02</p><h3>Explore the work.</h3></div><span>${p.images.length} RENDER VIEWS</span></div>
      ${zoneButtons}<div class="detail-gallery">${imgs}</div>
      <div class="detail-end"><span>END OF PROJECT / ${clean(p.title.toUpperCase())}</span><button type="button" id="shareProject">COPY PROJECT LINK ↗</button></div></div>`;
    $('#projectClose',detailBody).addEventListener('click',()=>projectDialog.close());
    $$('.zone-filter',detailBody).forEach(b=>b.addEventListener('click',()=>{
      $$('.zone-filter',detailBody).forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b));});
      $$('.detail-gallery button',detailBody).forEach(item=>item.hidden=b.dataset.zone!=='ALL' && item.dataset.zone!==b.dataset.zone);
    }));
    $$('.detail-gallery button',detailBody).forEach(b=>b.addEventListener('click',()=>openLightbox(Number(b.dataset.imageIndex))));
    $('#shareProject',detailBody).addEventListener('click',async()=>{
      const button=$('#shareProject',detailBody);
      try { await navigator.clipboard.writeText(location.href);button.textContent='PROJECT LINK COPIED ✓'; }
      catch(_) {button.textContent='COPY THE URL FROM YOUR BROWSER';}
    });
  }
  function openProject(slug, updateUrl=true){
    const p=projects.find(x=>x.slug===slug);
    if(!p)return;
    if(projectDialog.open) projectDialog.close();
    currentProject=p;
    projectImages=p.images;
    if(p.images[0]){const next=new Image();next.src=p.images[0].src;}
    renderProject(p);
    projectDialog.scrollTop=0;
    projectDialog.showModal();
    projectDialog.scrollTop=0;detailBody.scrollTop=0;
    document.querySelector('.detail-hero')?.scrollIntoView({block:'start',behavior:'instant'});
    projectDialog.scrollTop=0;
    requestAnimationFrame(()=>{projectDialog.scrollTop=0;detailBody.scrollTop=0;});
    setCursorHost();
    document.body.classList.add('dialog-open');
    if(updateUrl){const u=new URL(location.href);u.searchParams.set('project',p.slug);history.pushState({project:p.slug},'',u);}
  }
  projectDialog.addEventListener('close',()=>{
    setCursorHost();
    document.body.classList.remove('dialog-open');
    const u=new URL(location.href);
    if(u.searchParams.has('project')){u.searchParams.delete('project');history.replaceState({},'',u);}
  });
  projectDialog.addEventListener('click',(e)=>{if(e.target===projectDialog)projectDialog.close();});
  window.addEventListener('popstate',()=>{
    const slug=new URL(location.href).searchParams.get('project');
    if(slug && (!projectDialog.open || currentProject?.slug!==slug))openProject(slug,false);
    else if(!slug && projectDialog.open)projectDialog.close();
  });
  const initialSlug=new URL(location.href).searchParams.get('project');
  if(initialSlug)openProject(initialSlug,false);

  // Nested full-screen image lightbox supports arrows and Escape.
  function renderLightbox(){
    const it=projectImages[currentLightboxIndex];
    if(!it)return;
    lightboxImage.src=it.src;
    [-1,1].forEach(delta=>{const upcoming=projectImages[(currentLightboxIndex+delta+projectImages.length)%projectImages.length];if(upcoming){const preload=new Image();preload.src=upcoming.src;}});
    lightboxImage.alt=`${currentProject.title}: ${it.caption}`;
    lightboxCounter.textContent=`${currentLightboxIndex+1} / ${projectImages.length}  ·  ${it.caption}`;
    $$('.lightbox-thumb', $('#lightboxThumbnails')).forEach((el,i)=>{
      el.classList.toggle('active',i===currentLightboxIndex);
      if(i===currentLightboxIndex){const strip=$('#lightboxThumbnails'); if(strip)strip.scrollTo({left:Math.max(0,el.offsetLeft-strip.offsetLeft-strip.clientWidth/2+el.clientWidth/2),behavior:'auto'});}
    });
  }
  function openLightbox(i){
    currentLightboxIndex=i;
    $('#lightboxThumbnails').innerHTML=projectImages.map((im,j)=>`<button type="button" class="lightbox-thumb" data-index="${j}" aria-label="View image ${j+1}"><img loading="lazy" src="${im.src}" alt=""></button>`).join('');
    $$('.lightbox-thumb', $('#lightboxThumbnails')).forEach(b=>b.addEventListener('click',()=>{currentLightboxIndex=Number(b.dataset.index);renderLightbox();}));
    renderLightbox();lightbox.showModal();setCursorHost();
  }
  function moveImage(n){currentLightboxIndex=(currentLightboxIndex+n+projectImages.length)%projectImages.length;renderLightbox();}
  $('#lightboxClose').addEventListener('click',()=>lightbox.close());
  $('#lightboxPrev').addEventListener('click',()=>moveImage(-1));
  $('#lightboxNext').addEventListener('click',()=>moveImage(1));
  lightbox.addEventListener('click',(e)=>{if(e.target===lightbox)lightbox.close();});
  lightbox.addEventListener('close',()=>setCursorHost());
  // Horizontal finger swipe changes the image; vertical swipes keep normal scrolling.
  let touchX=0,touchY=0;
  lightboxImage.addEventListener('touchstart',e=>{if(e.touches.length===1){touchX=e.touches[0].clientX;touchY=e.touches[0].clientY;}},{passive:true});
  lightboxImage.addEventListener('touchend',e=>{if(!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)moveImage(dx<0?1:-1);},{passive:true});
  document.addEventListener('keydown',e=>{
    if(!lightbox.open)return;
    if(e.key==='ArrowRight'){e.preventDefault();moveImage(1);}
    if(e.key==='ArrowLeft'){e.preventDefault();moveImage(-1);}
  });

  // Contact: no guessed email address or unapproved public social account.
  $('#contactAction').addEventListener('click',()=>{contactDialog.showModal();setCursorHost();});
  contactDialog.addEventListener('close',()=>setCursorHost());
  $('#contactClose').addEventListener('click',()=>contactDialog.close());
  contactDialog.addEventListener('click',e=>{if(e.target===contactDialog)contactDialog.close();});
  // V6.3: functional contact form handling is in contact.js.

  // Header, mobile menu, and reading progress.
  const header=$('.site-header');
  const bar=$('.scroll-progress');
  let scrollFrame=0;
  function onScroll(){
    if(scrollFrame)return;
    scrollFrame=requestAnimationFrame(()=>{
      header.classList.toggle('scrolled',scrollY>25);
      const max=document.documentElement.scrollHeight-innerHeight;
      bar.style.transform=`scaleX(${max>0 ? Math.min(1,scrollY/max) : 0})`;
      scrollFrame=0;
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
  const menuToggle=$('#menuToggle');
  const mobileNav=$('#mobileNav');
  function closeMenu(){mobileNav.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu');}
  menuToggle.addEventListener('click',()=>{
    mobileNav.hidden=!mobileNav.hidden;
    menuToggle.setAttribute('aria-expanded',String(!mobileNav.hidden));
    menuToggle.setAttribute('aria-label',mobileNav.hidden ? 'Open menu' : 'Close menu');
  });
  $$('#mobileNav a').forEach(a=>a.addEventListener('click',closeMenu));
  $('#year').textContent=new Date().getFullYear();

  // Spatial cursor and light 3D card parallax, only for precise pointer + motion preference.
  const cursor=$('#cursor');
  // A native <dialog> enters the browser's top layer. Move the reticle into
  // the active topmost dialog so it remains visible in galleries/lightbox.
  function setCursorHost(){
    const quick=$('#quickViewDialog'); const host=lightbox.open?lightbox:(contactDialog.open?contactDialog:(projectDialog.open?projectDialog:(quick?.open?quick:document.body)));
    if(cursor.parentElement!==host)host.appendChild(cursor);
  }
  // One wide interactive render portal replaces the old thumbnail tree.
  const slides=[
    {src:'assets/amazon-01.webp',alt:'Amazon Sambhav illuminated Mandala Experience',title:'THE MANDALA EXPERIENCE',client:'AMAZON SAMBHAV SUMMIT',eyebrow:'EXPERIENTIAL SPACES / 01'},
    {src:'assets/betla-03.webp',alt:'BETLA immersive forest and river environment',title:'A WORLD INSIDE THE WILD',client:'BETLA NIC · JHARKHAND',eyebrow:'IMMERSIVE ENVIRONMENTS / 02'},
    {src:'assets/linkedin-tc-01.webp',alt:'LinkedIn Talent Connect stage and ballroom',title:'SPACES BUILT TO CONNECT',client:'LINKEDIN TALENT CONNECT',eyebrow:'CORPORATE EXPERIENCES / 03'},
    {src:'assets/tata-01.webp',alt:'Tata Motors conceptual corporate event stage',title:'BEYOND THE EXPECTED',client:'TATA MOTORS · PITCH CONCEPT',eyebrow:'STAGE DESIGN VISUALIZATION / 04'},
    {src:'assets/jcb-02.webp',alt:'JCB exhibition machinery and event site aerial view',title:'BUILT FOR THE EXPERIENCE',client:'JCB · BHARAT MOBILITY EXPO',eyebrow:'INDUSTRIAL EXHIBITION / 05'}
  ];
  const portalImage=$('#portalImage');let slideIndex=0;let slideTimer;
  let portalRequest=0;
  const readySlides=slides.map(slide=>{const pic=new Image();pic.src=slide.src;return pic;});
  function selectPortalSlide(index){
    slideIndex=index;
    const v=slides[index];
    const ticket=++portalRequest;
    const ready=readySlides[index];
    const commit=()=>{
      if(ticket!==portalRequest)return;
      portalImage.classList.add('swap');
      portalImage.src=v.src;portalImage.alt=v.alt;
      $('#portalTitle').textContent=v.title;$('#portalClient').textContent=v.client;
      $('#portalEyebrow').textContent=v.eyebrow;$('#portalIndex').textContent=String(index+1).padStart(2,'0');
      requestAnimationFrame(()=>portalImage.classList.remove('swap'));
    };
    if(ready.complete)commit();else ready.addEventListener('load',commit,{once:true});
    $$('.portal-select').forEach((b,i)=>{b.classList.toggle('is-current',i===index);b.setAttribute('aria-pressed',String(i===index));});
  }
  function startPortal(){if(reducedMotion)return;clearInterval(slideTimer);slideTimer=setInterval(()=>selectPortalSlide((slideIndex+1)%slides.length),6800);}
  $$('.portal-select').forEach((b,i)=>b.addEventListener('click',()=>{selectPortalSlide(i);startPortal();}));
  startPortal();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(slideTimer);else startPortal();});
  const portal=$('#portalScreen');
  if(portal && finePointer && !reducedMotion){
    portal.addEventListener('pointermove',e=>{
      const r=portal.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;
      portal.style.transform=`rotateY(${x*1.7}deg) rotateX(${-y*1.7}deg)`;
    },{passive:true});
    portal.addEventListener('pointerleave',()=>{portal.style.transform='';});
  }

  if(finePointer && !reducedMotion){
    document.body.classList.add('has-cursor');
    let desiredX=-80,desiredY=-80,framePending=false;
    const renderCursor=()=>{cursor.style.transform=`translate3d(${desiredX-8}px,${desiredY-8}px,0)`;framePending=false;};
    document.addEventListener('pointermove',e=>{
      desiredX=e.clientX;desiredY=e.clientY;
      cursor.classList.add('visible');
      if(!framePending){framePending=true;requestAnimationFrame(renderCursor);}
    },{passive:true});
    document.addEventListener('pointerover',e=>{
      const hover=e.target.closest('button,a,.project-card');
      cursor.classList.toggle('active',!!hover);
      $('.cursor-label',cursor).textContent=e.target.closest('.project-card,.gallery-frame')?'VIEW':hover?'OPEN':'';
    });
    document.addEventListener('pointerout',e=>{if(!e.relatedTarget)cursor.classList.remove('visible');});
  }

  // Recruiter shortcut: a compact, optional reading path, not an obstacle to the full experience.
  const qv=$('#quickViewDialog');
  const qvButton=$('#quickViewOpen');
  if(qv&&qvButton){
    qvButton.addEventListener('click',()=>{qv.showModal();setCursorHost();});
    const mobileQuick=$('#mobileQuickView'); if(mobileQuick)mobileQuick.addEventListener('click',()=>{closeMenu();qv.showModal();setCursorHost();});
    $('#quickViewClose').addEventListener('click',()=>qv.close());
    qv.addEventListener('click',e=>{if(e.target===qv)qv.close();});
    qv.addEventListener('close',setCursorHost);
    $('#quickProjectLinks').innerHTML=projects.filter(p=>['jcb','amazon','betla','linkedin-tc','jio','phonepe'].includes(p.slug)).map(p=>`<button type="button" data-open-project="${p.slug}">${p.title}<span aria-hidden="true">↗</span></button>`).join('');
    $$('#quickProjectLinks button').forEach(b=>b.addEventListener('click',()=>{qv.close();openProject(b.dataset.openProject);}));
    $('#quickAboutLink').addEventListener('click',()=>qv.close());
  }
  // Scene-reactive ambience is purposely restrained and does not alter project artwork.
  const sceneTones={amazon:'70,158,210',betla:'54,141,107',jcb:'213,161,48','linkedin-tc':'55,123,217',jio:'136,122,96',phonepe:'185,95,199',tata:'59,141,227'};
  if('IntersectionObserver' in window){
    const atmosphereObserver=new IntersectionObserver(entries=>{
      const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(active)document.body.style.setProperty('--scene-rgb',sceneTones[active.target.dataset.slug]||'84,74,156');
    },{threshold:[.15,.35,.55]});
    const gridObserver=new MutationObserver(()=>$$('.project-card').forEach(card=>atmosphereObserver.observe(card)));
    gridObserver.observe(projectGrid,{childList:true});
    $$('.project-card').forEach(card=>atmosphereObserver.observe(card));
  }
})();
