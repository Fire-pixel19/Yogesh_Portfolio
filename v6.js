/* V6: deterministic layout + render-edge color emission. Never redraws any brand logo. */
(()=>{
 'use strict';
 const palette=window.RENDER_EDGE_PALETTES||{};
 const edges=['top','right','bottom','left'];
 const applyEdges=(el,src)=>{
  if(!el||!src)return;
  const colors=palette[src];
  if(!colors)return;
  edges.forEach((e,i)=>el.style.setProperty(`--edge-${e}`,colors[i].join(',')));
 };
 const grid=document.querySelector('#projectGrid');
 const detail=document.querySelector('#projectDialogBody');
 const portalArt=document.querySelector('#heroArt');
 const portalImage=document.querySelector('#portalImage');
 const lightbox=document.querySelector('#lightbox');
 const lightboxImg=document.querySelector('#lightboxImage');
 const paintCards=()=>grid?.querySelectorAll('.project-card').forEach(card=>applyEdges(card,card.dataset.heroSrc||card.querySelector('img')?.getAttribute('src')));
 const layoutGallery=()=>{
  if(!detail)return;
  const hero=detail.querySelector('.detail-hero');
  if(hero)applyEdges(hero,hero.querySelector('img')?.getAttribute('src'));
  const frames=[...detail.querySelectorAll('.gallery-frame')];
  frames.forEach(frame=>{
   applyEdges(frame,frame.querySelector('img')?.getAttribute('src'));
   frame.classList.remove('v6-gallery-wide');
  });
  const visible=frames.filter(f=>!f.hidden);
  if(visible.length%2 && visible.length>1)visible[visible.length-1]?.classList.add('v6-gallery-wide');
 };
 paintCards();layoutGallery();
 if(grid)new MutationObserver(paintCards).observe(grid,{childList:true});
 if(detail)new MutationObserver(layoutGallery).observe(detail,{childList:true,subtree:false});
 document.addEventListener('click',e=>{
  if(e.target.closest('.zone-filter'))requestAnimationFrame(layoutGallery);
 },{passive:true});
 const updatePortal=()=>applyEdges(portalArt,portalImage?.getAttribute('src'));
 updatePortal();
 if(portalImage)new MutationObserver(updatePortal).observe(portalImage,{attributes:true,attributeFilter:['src']});
 const updateLightbox=()=>applyEdges(lightbox,lightboxImg?.getAttribute('src'));
 updateLightbox();
 if(lightboxImg)new MutationObserver(updateLightbox).observe(lightboxImg,{attributes:true,attributeFilter:['src']});
 // Accessibility / modal scroll restoration: always start at first hero, no inherited scroll offset.
 const dialog=document.querySelector('#projectDialog');
 if(dialog){
  new MutationObserver(()=>{
   if(!dialog.open)return;
   dialog.scrollTop=0;
   requestAnimationFrame(()=>{dialog.scrollTop=0;document.querySelector('#projectDialogBody')?.scrollTo({top:0,behavior:'instant'});});
  }).observe(detail,{childList:true,subtree:false});
 }
 // Actual user-supplied originals are embedded as-is; eight others are monochrome crops from approved prior logo preview.
 const brandList=[
  ['amazon','Amazon','amazon'],['linkedin','LinkedIn','linkedin-tc'],['jioblackrock','Jio BlackRock','jio'],
  ['phonepe','PhonePe','phonepe'],['saintgobain','Saint-Gobain','saint-gobain'],['castrol','Castrol','castrol'],
  ['anymind','AnyMind','anymind'],['tata','TATA Motors','tata'],['jcb','JCB','jcb'],
  ['botanical','Botanical Garden Visapur','botanical-visapur'],['fancode','FanCode Shop','fancode'],
  ['palamau','Palamau Tiger Reserve / BETLA NIC','betla']
 ];
 const root=document.querySelector('#brandMarqueeTrack');
 if(root){
  const mkset=(duplicate=false)=>{
   const set=document.createElement('div');set.className='brand-marquee-set';
   if(duplicate)set.setAttribute('aria-hidden','true');
   for(const [key,name,slug] of brandList){
    const btn=document.createElement('button');btn.type='button';btn.className='brand-marquee-logo';btn.dataset.brand=key;
    btn.setAttribute('aria-label',`Open ${name} project`);if(duplicate)btn.tabIndex=-1;
    const img=document.createElement('img');img.src=`assets/logos/${key}.png`;img.alt=name;img.loading='lazy';img.decoding='async';
    btn.append(img);
    if(key==='palamau'){const lbl=document.createElement('span');lbl.className='logo-caption';lbl.textContent='BETLA NIC';btn.append(lbl);}
    btn.addEventListener('click',()=>{
     const match=document.querySelector(`[data-slug="${slug}"]`);
     if(match){match.click();return;}
     document.querySelector('.filter[data-filter="All"]')?.click();
     requestAnimationFrame(()=>document.querySelector(`[data-slug="${slug}"]`)?.click());
    });
    set.appendChild(btn);
   }
   return set;
  };
  root.replaceChildren(mkset(),mkset(true));
 }
 // Keep the legal distinction between concept work and completed real-world installations in view.
 // No automatic ambient mode toggle: intensity responds to hovering the original image/card.
})();
