# V6.4 Contact System — Final Setup

This version introduces the functional contact form UI (HR/Recruiter, Project/Client, and General Enquiry) without changing any project images or portfolios. The buttons are interactive, but **actual email delivery needs your own Web3Forms access key**. No address or profile links have been invented.

## 1. Connect an inbox — free

1. Open https://web3forms.com and request a free access key with the email inbox where you want to receive enquiries.
2. Verify that inbox when the service emails you a verification message.
3. Open `contact-config.js` beside `index.html`.
4. Paste your received access key inside the quotes for `web3formsAccessKey`. Save the file.
5. Host the updated entire folder on a free static hosting platform (for example Cloudflare Pages) or serve locally for tests.
6. Send **one** test enquiry through the form, then check your email inbox and spam folder. Only call delivery verified after the message arrives.

Official Web3Forms API endpoint: https://api.web3forms.com/submit; free plan currently 250 enquiries/month (subject to service terms).

**How forms are routed:** A single verified inbox receives enquiries, with a different subject and inquiry type for Job Opportunity, Project/Collaboration, or General Enquiry. The form does not require separate backend hosting.

If no access key is configured, clicking Send will display a clear message that delivery is not active — it will NOT falsely claim a message was sent. This is deliberate.

## 2. Optional direct contact links

In `contact-config.js`, you may add your LinkedIn URL, Instagram URL, public email address, telephone, and WhatsApp number (digits including country code, no `+`). The four footer cards (LinkedIn, Instagram, Email, Phone) are ALWAYS visible for design review. Until configured, they display a pending status and are NOT clickable. As soon as each valid value is filled in, its corresponding card becomes a working link automatically. No personal details are included by default.

If WhatsApp is configured, visitors can tap Continue on WhatsApp. The drafted message opens in WhatsApp, and the visitor must tap **Send**; automatic WhatsApp delivery is not part of this free solution.

## 3. Safety/production checks

- Do not place a private API secret or email password in `contact-config.js`. Web3Forms access keys are intended to be public in browser forms.
- Enable advanced spam protection/hCaptcha in the service dashboard if necessary. The form includes a simple hidden honeypot field.
- Test from a real public HTTPS origin before declaring the contact workflow live.
- Test job, project, and general categories; each should reach the same inbox with the correct subject.
- To update the website, republish the changed `contact-config.js` with the rest of your files.

## 4. What was preserved

All 158 render views, all 14 project stories, both themes, the original brand logos, V6.1 BETLA clipping fix, and V6.2 title-edge typography fix remain unchanged. This release adds just the universal contact system.

## 5. V6.4 footer improvement
The new bottom-of-page “Let's stay connected.” area consistently shows four professionally styled cards for LinkedIn, Instagram, Email, and Phone. Empty settings keep those cards visibly inactive, not hidden. After saving real details in `contact-config.js`, reload the page and the corresponding cards become functional automatically. Test in a normal browser, then test once on your published HTTPS site.
