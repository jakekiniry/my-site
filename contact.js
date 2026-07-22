/* ==========================================================================
   CONTACT.JS (v2 — hardened against JS-executing scrapers)
   ==========================================================================
   HONEST LIMITS FIRST: no client-side technique makes an email address
   100% unscrapable — a human eventually has to see the real address to
   click it, and a bot built specifically to target this exact page could
   follow the same steps a human does. What this does do is remove your
   address from every place a bot would normally look for it "for free":
   the raw HTML, the parsed DOM right after page load, and any attribute
   that's readable without interacting with the page. That's enough to
   stop the vast majority of scrapers, which work by scanning many sites
   quickly and don't bother simulating a real click on each one.

   HOW IT WORKS:
   1. Your address is stored as a comma-separated list of character
      codes, each shifted by a small key — so the literal characters
      never appear in the page's HTML at all, not even as fragments.
   2. The address is only decoded when a link receives a genuine click
      or Enter keypress (checked via event.isTrusted). Loading the page
      or running its JavaScript does nothing on its own — the address
      stays encoded until that specific interaction happens.

   TO ADD A NEW EMAIL LINK:
     <a class="js-email" data-key="7" data-codes="1,2,3,..." data-label="keep" href="#">
       Get in touch
     </a>
   - data-key: any small integer you choose.
   - data-codes: your address, encoded — see ENCODE HELPER at the bottom
     of this file for a snippet you can run once in your browser console.
   - data-label="keep" is optional — include it if the link should keep
     its own text (e.g. a button that says "Get notified") instead of
     being replaced with the decoded address once revealed.
   ========================================================================== */

(function () {
  function decode(codes, key) {
    return codes
      .split(',')
      .map(function (n) { return String.fromCharCode(parseInt(n, 10) - key); })
      .join('');
  }

  function reveal(link) {
    if (link.dataset.revealed === 'true') return;
    var key = parseInt(link.dataset.key, 10);
    var address = decode(link.dataset.codes, key);
    link.href = 'mailto:' + address;
    if (link.dataset.label !== 'keep') {
      link.textContent = address;
    }
    link.dataset.revealed = 'true';
  }

  function onActivate(event) {
    // Ignore anything that isn't a real, user-generated event. Basic
    // scrapers that call element.click() or dispatch a synthetic
    // MouseEvent trigger this handler but fail this check.
    if (!event.isTrusted) return;

    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    reveal(event.currentTarget);
  }

  document.querySelectorAll('.js-email').forEach(function (link) {
    link.addEventListener('click', onActivate);
    link.addEventListener('keydown', onActivate);
  });
})();

/* ==========================================================================
   ENCODE HELPER — not run by the page, just for you.
   ==========================================================================
   To generate data-codes for your real address:
   1. Open any page in your browser, open the console (F12), paste this:

        function encodeEmail(address, key) {
          return address.split('').map(function (c) {
            return c.charCodeAt(0) + key;
          }).join(',');
        }

   2. Then run, e.g.:  encodeEmail("jake@jakekiniry.com", 11)
   3. Copy the result into data-codes, and use the same number (11 in
      this example) as data-key on that link.
   Pick any key you like — it doesn't need to be secret, it just needs
   to be consistent between data-key and how you encoded data-codes.
   ========================================================================== */
