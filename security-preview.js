/* Optional security-preview prototype. Not a screenshot/recording blocker. */
(() => {
  'use strict';
  // Only presentation renders; brand logos, buttons, forms and portrait are unaffected.
  const renderSelectors = [
    '#portalImage', '#lightboxImage',
    '.project-card img', '.detail-hero img',
    '.gallery-frame img', '.lightbox-thumb img'
  ];
  const selector = renderSelectors.join(',');
  function markImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (!img.matches(selector)) return;
    img.draggable = false;
    img.setAttribute('data-preview-protected','');
  }
  const markAll = root => {
    if (root.matches && root.matches(selector)) markImage(root);
    root.querySelectorAll?.(selector).forEach(markImage);
  };
  markAll(document);
  const roots=['#projectGrid','#projectDialogBody','#lightboxThumbnails'];
  roots.forEach(s=>{
    const el=document.querySelector(s);
    if(!el)return;
    new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(node=>{
      if(node.nodeType===1) markAll(node);
    }))).observe(el,{childList:true,subtree:true});
  });
  let toastTimeout;
  function showNotice() {
    let toast=document.getElementById('previewSecurityNotice');
    if(!toast){
      toast=document.createElement('div');
      toast.id='previewSecurityNotice';
      toast.className='preview-security-notice';
      toast.setAttribute('role','status');
      toast.textContent='Display preview only · Full-resolution masters are not included';
      document.body.appendChild(toast);
    }
    toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout=setTimeout(()=>toast.classList.remove('is-visible'),2600);
  }
  document.addEventListener('contextmenu',e=>{
    if(!(e.target instanceof Element))return;
    if(!e.target.matches(selector))return;
    e.preventDefault();
    showNotice();
  });
  document.addEventListener('dragstart',e=>{
    if(e.target instanceof Element && e.target.matches(selector)) e.preventDefault();
  });
})();
