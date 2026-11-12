/* V4 interactive ambient field: lightweight, optional pointer effects. No scroll hijacking. */
(() => {
  'use strict';
  const fine=matchMedia('(pointer:fine)').matches;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const field=document.querySelector('.kinetic-field');
  if (!field) return;
  const page=document.documentElement;
  if (fine && !reduced){
    let raf=0, wantedX=0, wantedY=0;
    window.addEventListener('pointermove', e=>{
      wantedX=(e.clientX/window.innerWidth-.5)*34;
      wantedY=(e.clientY/window.innerHeight-.5)*28;
      if(raf)return;
      raf=requestAnimationFrame(()=>{
        field.style.setProperty('--ambient-x', `${wantedX.toFixed(1)}px`);
        field.style.setProperty('--ambient-y', `${wantedY.toFixed(1)}px`);
        raf=0;
      });
    },{passive:true});
  }
  if (!reduced){
    let last=window.scrollY, pending=false;
    window.addEventListener('scroll',()=>{
      if(pending)return;
      pending=true;
      requestAnimationFrame(()=>{
        const current=window.scrollY, speed=Math.min(1,Math.abs(current-last)/110);
        // Only background ambience gets a motion smear; never artwork or text.
        field.style.setProperty('--scroll-trail',speed.toFixed(2));
        field.style.setProperty('--scroll-offset',`${Math.max(-14,Math.min(14,(current-last)*.12)).toFixed(1)}px`);
        last=current;pending=false;
      });
    },{passive:true});
  }
  // All clickable projects and featured rail work with keyboard and touchscreen.
  const portal=document.querySelector('#portalScreen');
  if(portal){
    portal.tabIndex=0;
    portal.setAttribute('role','button');
    portal.setAttribute('aria-label','Open the currently featured project');
    const slugs=['amazon','betla','linkedin-tc','tata','jcb'];
    const activate=()=>{
      const index=[...document.querySelectorAll('.portal-select')].findIndex(b=>b.classList.contains('is-current'));
      const slug=slugs[Math.max(0,index)];
      const button=document.querySelector(`[data-slug="${slug}"]`);
      if(button){button.click();return;}
      const url=new URL(location.href);url.searchParams.set('project',slug);location.href=url.href;
    };
    portal.addEventListener('click',activate);
    portal.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
  }
  // Pause ambient motion in inactive tabs and while modal imagery is being inspected.
  const syncMotion=()=>document.body.classList.toggle('kinetic-paused',document.hidden||!!document.querySelector('dialog[open]'));
  document.addEventListener('visibilitychange',syncMotion);
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',syncMotion));
  document.addEventListener('click',()=>requestAnimationFrame(syncMotion));
})();
