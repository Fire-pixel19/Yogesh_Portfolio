/* V6.3 — Universal contact system. No fake success responses or invented contact details. */
(() => {
  'use strict';
  const $ = (sel,root=document) => root.querySelector(sel);
  const $$ = (sel,root=document) => Array.from(root.querySelectorAll(sel));
  const settings = window.PORTFOLIO_CONTACT || {};
  const dialog = $('#contactDialog');
  const form = $('#contactEnquiryForm');
  if (!dialog || !form) return;

  const labels = {
    job: {
      tag:'RECRUITMENT ENQUIRY',
      hint:'Share a little about the role and your studio. I’ll have the context to respond.',
      company:'Company / Studio', subject:'Job position / role',
      subjectPlaceholder:'3D Artist, Unreal Engine Artist…',
      message:'Opportunity details',
      messagePlaceholder:'Share the role, location, team and what you’re looking for…',
      mailSubject:'Portfolio — Job Opportunity'
    },
    project: {
      tag:'PROJECT / COLLABORATION',
      hint:'Tell me what you’re imagining. A short project brief is the perfect start.',
      company:'Company / Brand', subject:'Project type / scope',
      subjectPlaceholder:'Exhibition, stage, visualization…',
      message:'Your project brief',
      messagePlaceholder:'Tell me about the experience, location, scope or approximate timeline…',
      mailSubject:'Portfolio — Project Collaboration'
    },
    general: {
      tag:'GENERAL ENQUIRY',
      hint:'A quick introduction or a question is absolutely welcome.',
      company:'Organization (optional)', subject:'Subject',
      subjectPlaceholder:'What would you like to discuss?',
      message:'Your message',
      messagePlaceholder:'Write a short note and I’ll get back to you…',
      mailSubject:'Portfolio — General Enquiry'
    }
  };
  let purpose = 'job';
  let isSending = false;
  const status = $('#contactFormStatus');
  const send = $('#contactSend');
  const company = $('#enquiryCompany');
  const subject = $('#enquirySubject');
  const message = $('#enquiryMessage');
  const whatsapp = $('#contactWhatsapp');
  const action = $('#contactAction');
  const hire = $('#hireAction');

  function setStatus(text, kind='info') {
    status.textContent = text;
    status.dataset.state = kind;
    status.hidden = !text;
  }
  function setPurpose(next) {
    if (!labels[next]) return;
    purpose = next;
    const config = labels[next];
    $$('.contact-route').forEach(button => {
      const on=button.dataset.contactPurpose===next;
      button.classList.toggle('selected',on);
      button.setAttribute('aria-pressed',String(on));
    });
    $('#contactPurposeTag').textContent=config.tag;
    $('#contactPurposeHint').textContent=config.hint;
    $('#companyLabel').textContent=config.company;
    $('#subjectLabel').textContent=config.subject;
    $('#messageLabel').replaceChildren(document.createTextNode(config.message+' '));
    const required=document.createElement('b'); required.textContent='*'; $('#messageLabel').append(required);
    subject.placeholder=config.subjectPlaceholder;
    message.placeholder=config.messagePlaceholder;
    setStatus('');
  }
  $$('.contact-route').forEach(button=>button.addEventListener('click',()=>setPurpose(button.dataset.contactPurpose)));

  // The existing 'Let's Collaborate' button opens the modal through script.js.
  // Its preset is selected before the original click handler runs.
  if (action) action.addEventListener('click',()=>setPurpose('project'),{capture:true});
  if (hire) hire.addEventListener('click',()=>{
    setPurpose('job');
    if (!dialog.open) {
      action?.click();
      setPurpose('job');
    }
    $('#enquiryName').focus({preventScroll:true});
  });
  // Keep the user's last completed content if switching categories while filling form.
  dialog.addEventListener('close',()=>{
    // Clear sensitive form data after closing the enquiry flow.
    form.reset();
    setStatus('');
    setSending(false);
  });

  function setSending(value) {
    isSending=value;
    send.disabled=value;
    send.setAttribute('aria-busy',String(value));
    send.innerHTML=value?'SENDING… <span aria-hidden="true">◌</span>':'SEND ENQUIRY <span aria-hidden="true">↗</span>';
  }
  function validKey() {
    return typeof settings.web3formsAccessKey==='string' && /^[a-f0-9]{8}-[a-f0-9-]{20,}$/i.test(settings.web3formsAccessKey.trim());
  }
  function whatsappNumber() {
    const number=String(settings.whatsapp || '').replace(/\D/g,'');
    return /^\d{10,15}$/.test(number)?number:'';
  }
  function draftText() {
    const data=new FormData(form);
    return `${labels[purpose].mailSubject}\nName: ${data.get('name')||''}\nEmail: ${data.get('email')||''}\nCompany: ${data.get('organization')||'Not provided'}\n${labels[purpose].subject}: ${data.get('opportunity')||'Not provided'}\n\n${data.get('message')||''}`;
  }
  const waNumber=whatsappNumber();
  if(waNumber) {
    whatsapp.hidden=false;
    whatsapp.addEventListener('click',event=>{
      event.preventDefault();
      if(!form.reportValidity()) return;
      const text=encodeURIComponent(draftText());
      window.open(`https://wa.me/${waNumber}?text=${text}`,'_blank','noopener,noreferrer');
      setStatus('WhatsApp opened with a prefilled message. Please press Send there to deliver it.','info');
    });
  }
  function safeWebLink(url,domain) {
    try {const u=new URL(url);return u.protocol==='https:' && (!domain || (u.hostname===domain || u.hostname.endsWith('.'+domain)))?u.href:null;}catch(_){return null;}
  }
  const direct=$('#contactDirectLinks');
  const directOptions=[
    {title:'LinkedIn',url:safeWebLink(settings.linkedin,'linkedin.com')},
    {title:'Instagram',url:safeWebLink(settings.instagram,'instagram.com')},
    {title:'Email',url:typeof settings.email==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.trim())?'mailto:'+settings.email.trim():null},
    {title:'Phone',url:typeof settings.phone==='string' && /^\+?[\d ()-]{10,20}$/.test(settings.phone.trim())?'tel:'+settings.phone.replace(/[^+\d]/g,''):null}
  ].filter(x=>x.url);
  if(direct && directOptions.length) {
    direct.hidden=false;
    directOptions.forEach(x=>{const a=document.createElement('a');a.href=x.url;a.textContent=x.title+' ↗';a.className='contact-direct-link';if(x.url.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer';}direct.append(a);});
  }

  // V6.4: always render the four channels in the footer so their presence is
  // visually clear, but activate links ONLY when real contact details exist.
  const footerDetails = {
    LinkedIn: 'OPEN LINKEDIN PROFILE ↗',
    Instagram: 'OPEN INSTAGRAM PROFILE ↗',
    Email: String(settings.email || '').trim(),
    Phone: String(settings.phone || '').trim()
  };
  for (const item of directOptions) {
    const card = document.querySelector(`[data-contact-channel="${item.title.toLowerCase()}"]`);
    if (!card) continue;
    const detail = card.querySelector('[data-contact-detail]');
    if (item.url) {
      card.href = item.url;
      card.classList.remove('is-pending');
      card.removeAttribute('aria-disabled');
      if (item.url.startsWith('https:')) {
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
      }
      if (detail) detail.textContent = footerDetails[item.title] || 'CONNECT ↗';
      card.setAttribute('aria-label', item.title === 'Email' ? 'Send an email to ' + footerDetails.Email : item.title === 'Phone' ? 'Call ' + footerDetails.Phone : 'Open ' + item.title + ' profile');
      if (item.title === 'LinkedIn' || item.title === 'Instagram') card.title = 'Open ' + item.title + ' profile';
    } else {
      card.removeAttribute('href');
      card.setAttribute('aria-disabled','true');
      card.classList.add('is-pending');
    }
  }


  setPurpose('job');
  setStatus('');
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(isSending) return;
    if(!form.reportValidity()) return;
    if($('#contactTrap').value) {setStatus('Your enquiry could not be processed. Please try again.','error');return;}
    if(!validKey()) {
      setStatus('Email delivery is not connected yet. The portfolio owner needs to activate the enquiry inbox before this form can send.','setup');
      return;
    }
    setSending(true);
    setStatus('Sending your enquiry securely…','info');
    const data=new FormData(form);
    const payload={
      access_key:settings.web3formsAccessKey.trim(),
      subject:labels[purpose].mailSubject,
      from_name:'Yogesh Vikhankar Portfolio',
      name:String(data.get('name')||'').trim(),
      email:String(data.get('email')||'').trim(),
      inquiry_type:labels[purpose].tag,
      organization:String(data.get('organization')||'').trim() || 'Not specified',
      opportunity_or_subject:String(data.get('opportunity')||'').trim() || 'Not specified',
      message:String(data.get('message')||'').trim(),
      botcheck:false
    };
    try {
      const response=await fetch('https://api.web3forms.com/submit',{
        method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)
      });
      const result=await response.json();
      if(response.ok && result.success===true) {
        form.reset();
        setStatus('Enquiry sent successfully. Thank you — I’ll respond as soon as I can.','success');
      } else {
        setStatus('Your message was not sent. Please try again, or use a direct contact link if available.','error');
      }
    } catch(_) {
      setStatus('Unable to connect to the message service. Please check your internet connection and retry.','error');
    } finally {setSending(false);}
  });
})();
