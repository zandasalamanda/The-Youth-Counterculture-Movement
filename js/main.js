/* ============================================
   MAIN — Scroll Animations & Nav
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Active nav link on scroll ----
  const sections = document.querySelectorAll('[data-section]');
  const navLinks = document.querySelectorAll('#navbar nav a');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('data-section');
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => navObserver.observe(s));

  // ---- Reveal on scroll ----
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // ---- Navbar background on scroll ----
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.style.background = window.scrollY > 60
      ? 'rgba(13, 11, 20, 0.95)'
      : 'rgba(13, 11, 20, 0.75)';
  }, { passive: true });

  // ---- Animated counter ----
  function animateCounters() {
    document.querySelectorAll('.count-up').forEach(el => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      let start = 0;
      const duration = 1800;
      const step = target / (duration / 16);
      const tick = () => {
        start = Math.min(start + step, target);
        el.textContent = Math.round(start).toLocaleString() + suffix;
        if (start < target) requestAnimationFrame(tick);
      };
      tick();
    });
  }

  // Trigger counters once the stat cards are visible
  const statsSection = document.querySelector('.stat-grid');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        animateCounters();
        statsObserver.disconnect();
      }
    }, { threshold: 0.5 });
    statsObserver.observe(statsSection);
  }

  // ---- Psychedelic floating peace signs (hero) ----
  const hero = document.getElementById('hero');
  if (hero) {
    const symbols = ['\u262E', '\u270C', '\u273F', '\u2726', '\u266A', '\u273F'];
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('div');
      el.className = 'float-symbol';
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.position = 'absolute';
      el.style.fontSize = (Math.random() * 1.2 + 0.8) + 'rem';
      el.style.left = (Math.random() * 100) + '%';
      el.style.top = (Math.random() * 80 + 10) + '%';
      el.style.opacity = (Math.random() * 0.3 + 0.1);
      el.style.animation = 'floatSymbol ' + (Math.random() * 8 + 6) + 's ease-in-out infinite';
      el.style.animationDelay = (Math.random() * 4) + 's';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '1';
      el.style.userSelect = 'none';
      hero.appendChild(el);
    }

    // Inject float keyframes dynamically
    var floatStyle = document.createElement('style');
    floatStyle.textContent = '@keyframes floatSymbol { 0% { transform: translateY(0px) rotate(0deg); } 33% { transform: translateY(-18px) rotate(5deg); } 66% { transform: translateY(8px) rotate(-4deg); } 100% { transform: translateY(0px) rotate(0deg); } }';
    document.head.appendChild(floatStyle);
  }

  // ---- Leader card modal tooltip ----
  document.querySelectorAll('.leader-row').forEach(function(card) {
    card.addEventListener('click', function() {
      var quote = card.getAttribute('data-quote');
      if (!quote) return;
      var existing = document.getElementById('leader-modal');
      if (existing) existing.remove();

      var modal = document.createElement('div');
      modal.id = 'leader-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(24,17,10,0.88);display:flex;align-items:center;justify-content:center;padding:2rem;animation:fadeIn 0.2s ease;';

      var name = card.querySelector('h3').textContent;
      var role = card.querySelector('.role').textContent;

      var inner = document.createElement('div');
      inner.style.cssText = 'background:#211608;border:3px solid #e8c840;padding:2.2rem;max-width:500px;width:100%;position:relative;';

      var closeBtn = document.createElement('button');
      closeBtn.id = 'modal-close';
      closeBtn.style.cssText = 'position:absolute;top:0.8rem;right:1rem;background:none;border:none;color:#9e9480;font-size:1.2rem;cursor:pointer;';
      closeBtn.innerHTML = '&#x2715;';

      var tagLine = document.createElement('p');
      tagLine.style.cssText = "color:#e8c840;font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;font-family:'Special Elite',cursive;margin-bottom:0.4rem;";
      tagLine.textContent = 'Key Figure';

      var nameEl = document.createElement('h3');
      nameEl.style.cssText = "font-family:'Playfair Display',serif;font-size:1.4rem;color:#ede8d8;margin-bottom:0.15rem;";
      nameEl.textContent = name;

      var roleEl = document.createElement('p');
      roleEl.style.cssText = "color:#1e9e96;font-size:0.75rem;font-family:'Special Elite',cursive;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:1rem;";
      roleEl.textContent = role;

      var quoteEl = document.createElement('blockquote');
      quoteEl.style.cssText = "font-family:'Special Elite',cursive;font-size:0.98rem;color:#ede8d8;line-height:1.7;border-left:4px solid #e8c840;padding-left:1rem;";
      quoteEl.textContent = '"' + quote + '"';

      inner.appendChild(closeBtn);
      inner.appendChild(tagLine);
      inner.appendChild(nameEl);
      inner.appendChild(roleEl);
      inner.appendChild(quoteEl);
      modal.appendChild(inner);
      document.body.appendChild(modal);

      var fadeStyle = document.createElement('style');
      fadeStyle.textContent = '@keyframes fadeIn { from{opacity:0} to{opacity:1} }';
      document.head.appendChild(fadeStyle);

      modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
      closeBtn.addEventListener('click', function() { modal.remove(); });
    });
  });

});
