/* preis.works — ui.js
   Nav scroll-pill · hamburger · footer year
   Loaded by every main page (About, Photography, Projects, 404). */

(function () {
  /* Nav pill on scroll */
  const nav = document.querySelector('.nav');
  if (nav) {
    let pending = false;
    window.addEventListener('scroll', () => {
      if (!pending) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 1);
          pending = false;
        });
        pending = true;
      }
    });
  }

  /* Hamburger */
  const btn    = document.getElementById('hamburger');
  const drawer = document.getElementById('nav-drawer');
  if (btn && drawer) {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = btn.classList.toggle('open');
      drawer.classList.toggle('open', open);
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav') && !e.target.closest('#nav-drawer')) {
        btn.classList.remove('open');
        drawer.classList.remove('open');
      }
    });
  }

  /* Footer year */
  const copy = document.getElementById('footer-copy');
  if (copy) copy.textContent = '© ' + new Date().getFullYear() + ' Florian Preis';
}());
