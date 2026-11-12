/* V5 / Ambient Spatial Gallery. Colors are sampled from each real source image offline. */
(() => {
  'use strict';
  const palettes=window.RENDER_PALETTES||{};
  const root=document.documentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(pointer: fine)').matches;
  const channels=(path)=>palettes[path]||[[77,130,190],[166,122,159]];
  const assign=(element,path)=>{
    if(!element)return;
    const [a,b]=channels(path);
    element.style.setProperty('--v5-glow-a',a.join(','));
    element.style.setProperty('--v5-glow-b',b.join(','));
  };
  const grid=document.getElementById('projectGrid');
  const portalImage=document.getElementById('portalImage');
  const portalArt=document.getElementById('heroArt');
  const detailBody=document.getElementById('projectDialogBody');
  const lightbox=document.getElementById('lightbox');
  const projectDialog=document.getElementById('projectDialog');
  const lightboxImage=document.getElementById('lightboxImage');
  // Mutations originate from the normal filter and project/gallery mechanics.
  const seen=new WeakSet();
  let cardObserver=null;
  if('IntersectionObserver' in window){
    cardObserver=new IntersectionObserver(entries=>{
      entries.forEach(({target,isIntersecting})=>target.classList.toggle('v5-in-view',isIntersecting));
    },{rootMargin:'-10% 0px -14% 0px',threshold:.12});
  }
  function enhanceCards(){
    grid.querySelectorAll('.project-card').forEach(card=>{
      if(seen.has(card))return;
      seen.add(card);
      assign(card,card.dataset.heroSrc||card.querySelector('img')?.getAttribute('src'));
      cardObserver?.observe(card);
    });
  }
  enhanceCards();
  new MutationObserver(enhanceCards).observe(grid,{childList:true});
  assign(portalArt,portalImage?.getAttribute('src'));
  if(portalImage)new MutationObserver(()=>assign(portalArt,portalImage.getAttribute('src'))).observe(portalImage,{attributes:true,attributeFilter:['src']});
  function enhanceCaseStudy(){
    if(!detailBody)return;
    const hero=detailBody.querySelector('.detail-hero');
    if(hero)assign(hero,hero.querySelector('img')?.getAttribute('src'));
    detailBody.querySelectorAll('.gallery-frame').forEach(frame=>assign(frame,frame.querySelector('img')?.getAttribute('src')));
  }
  new MutationObserver(enhanceCaseStudy).observe(detailBody,{childList:true,subtree:false});
  const colorLightbox=()=>{
    const src=lightboxImage?.getAttribute('src');
    if(src)assign(lightbox,src);
  };
  if(lightboxImage){colorLightbox();new MutationObserver(colorLightbox).observe(lightboxImage,{attributes:true,attributeFilter:['src']});}
  // Helpful, interactive services: users can jump straight to matching work.
  document.querySelectorAll('[data-service-filter]').forEach(link=>link.addEventListener('click',()=>{
    const requested=link.dataset.serviceFilter;
    const button=[...document.querySelectorAll('.filter')].find(x=>x.dataset.filter===requested) || document.querySelector('.filter[data-filter="All"]');
    button?.click();
  }));
  // Subtle geometric atmospheric drift; DOM content remains in normal native scroll flow.
  if(!reduced){
    const work=document.querySelector('.work-section');
    let busy=false,last=0;
    const onScroll=()=>{
      if(busy)return;busy=true;
      requestAnimationFrame(()=>{
        const current=window.scrollY;
        if(work)work.style.setProperty('--v5-ambient-parallax',`${Math.max(-18,Math.min(18,(current-last)*.18))}px`);
        last=current;busy=false;
      });
    };
    window.addEventListener('scroll',onScroll,{passive:true});
  }
  // Watch for theme switch so ambient layer always remains legible; no heavy canvas per-frame sampling.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',document.body.classList.contains('theme-colorful')?'#273b78':'#0a1220');
})();
