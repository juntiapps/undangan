/* ── Floating particles (binary rain) ─────────────────────── */
(function () {
  'use strict';

  /* ─── Particle canvas ─────────────────────────────────────── */
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let drops = [];
    const chars = '01アイウエオカキクケコサシスセソタチ<>{}[]()#$%@!'.split('');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initDrops();
    }

    function initDrops() {
      const cols = Math.floor(canvas.width / 18);
      drops = Array.from({ length: cols }, () => ({
        x: 0,
        y: (Math.random() * canvas.height / 16) | 0,
        speed: 0.15 + Math.random() * 0.4,
        opacity: 0.05 + Math.random() * 0.15,
        char: chars[(Math.random() * chars.length) | 0],
      }));
      drops.forEach((d, i) => { d.x = i * 18; });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '13px Consolas, monospace';
      drops.forEach(d => {
        ctx.fillStyle = `rgba(0,212,170,${d.opacity})`;
        ctx.fillText(d.char, d.x, d.y * 16);
        d.y++;
        if (d.y * 16 > canvas.height && Math.random() > 0.975) {
          d.y = 0;
          d.char = chars[(Math.random() * chars.length) | 0];
        }
        if (Math.random() > 0.97) {
          d.char = chars[(Math.random() * chars.length) | 0];
        }
      });
    }

    let animId;
    function loop() { drawParticles(); animId = requestAnimationFrame(loop); }
    window.addEventListener('resize', resize);
    resize();
    loop();
  }

  /* ─── Loading screen ──────────────────────────────────────── */
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent   = document.getElementById('main-content');

  if (loadingScreen && mainContent) {
    // Hide main content until loading done
    mainContent.style.opacity = '0';
    mainContent.style.transition = 'opacity 0.6s ease';

    // After animation completes (~3.8 s) dismiss loader
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        mainContent.style.opacity = '1';
      }, 600);
    }, 4200);
  }

  /* ─── Scroll reveal ───────────────────────────────────────── */
  const revealEls = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nlToBr(value) {
    return escapeHtml(value).replace(/\n/g, '<br />');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(value || '');
  }

  function setHtmlFromMultiline(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = nlToBr(String(value || ''));
  }

  function setHref(id, value) {
    const el = document.getElementById(id);
    if (!el || !value) return;
    el.setAttribute('href', value);
  }

  function setMeta(id, content) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('content', String(content || ''));
  }

  function setDataAttribute(id, key, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute(`data-${key}`, String(value || ''));
  }

  async function fetchSiteConfig() {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Gagal mengambil konfigurasi undangan');
    }

    const payload = await response.json();
    return payload.data || null;
  }

  /* ─── Countdown timer ─────────────────────────────────────── */
  let weddingDate = new Date('2025-03-15T09:00:00');
  let countdownExpiredNote = '// Barakallahu lakuma wa baraka alaikuma wa jama\'a bainakuma fi khair';

  function applySiteConfig(config) {
    if (!config) return;

    const couple = config.couple || {};
    const hero = config.hero || {};
    const events = config.events || {};
    const locations = config.locations || {};
    const gifts = config.gifts || {};
    const branding = config.branding || {};

    setText('hero-groom-name', couple.groomShortName);
    setText('hero-groom-suffix', couple.groomSuffix ? ` ${couple.groomSuffix}` : '');
    setText('hero-bride-name', couple.brideShortName);
    setText('hero-bride-suffix', couple.brideSuffix ? ` ${couple.brideSuffix}` : '');
    setText('couple-groom-name', couple.groomName);
    setText('couple-bride-name', couple.brideName);
    setText('couple-groom-profession', couple.groomProfession);
    setHtmlFromMultiline('couple-groom-parents', couple.groomParents);
    setText('couple-bride-profession', couple.brideProfession);
    setHtmlFromMultiline('couple-bride-parents', couple.brideParents);

    setText('hero-day-label', hero.dayLabel);
    setText('hero-date-label', hero.dateLabel);
    setText('hero-city-label', hero.cityLabel);
    setText('countdown-note', hero.countdownNote);
    if (hero.countdownExpiredNote) {
      countdownExpiredNote = hero.countdownExpiredNote;
    }
    setText('loader-clone-cmd', branding.loaderCloneCommand);

    const heroDateBadge = document.getElementById('hero-date-badge');
    if (heroDateBadge && branding.heroDateAriaLabel) {
      heroDateBadge.setAttribute('aria-label', branding.heroDateAriaLabel);
    }

    if (branding.pageTitle) {
      document.title = branding.pageTitle;
    }
    setMeta('meta-description', branding.metaDescription);
    setMeta('meta-og-title', branding.ogTitle);
    setMeta('meta-og-description', branding.ogDescription);

    setText('akad-date', events.akadDate);
    setText('akad-time', events.akadTime);
    setHtmlFromMultiline('akad-event-location', events.akadLocation);
    setText('akad-dresscode', events.akadDresscode);

    setText('resepsi-date', events.resepsiDate);
    setText('resepsi-time', events.resepsiTime);
    setHtmlFromMultiline('resepsi-event-location', events.resepsiLocation);
    setText('resepsi-dresscode', events.resepsiDresscode);

    setText('akad-location-name', locations.akadName);
    setHtmlFromMultiline('akad-location-address', locations.akadAddress);
    setHref('akad-map-link', locations.akadMapUrl);

    setText('resepsi-location-name', locations.resepsiName);
    setHtmlFromMultiline('resepsi-location-address', locations.resepsiAddress);
    setHref('resepsi-map-link', locations.resepsiMapUrl);

    setText('gift-bank-1', gifts.account1Bank ? `// ${gifts.account1Bank}` : '');
    setText('gift-account-name-1', gifts.account1Name || branding.giftAccountName1);
    setText('gift-account-num-1', gifts.account1Number);
    setDataAttribute('gift-copy-btn-1', 'copy', gifts.account1CopyValue || gifts.account1Number || '');

    setText('gift-bank-2', gifts.account2Bank ? `// ${gifts.account2Bank}` : '');
    setText('gift-account-name-2', gifts.account2Name || branding.giftAccountName2);
    setText('gift-account-num-2', gifts.account2Number);
    setDataAttribute('gift-copy-btn-2', 'copy', gifts.account2CopyValue || gifts.account2Number || '');

    setText('closing-groom-name', branding.closingGroomName);
    setText('closing-bride-name', branding.closingBrideName);
    setText('footer-branding', branding.footerBranding);
    setText('code-groom-name', branding.codeGroomName);
    setText('code-bride-name', branding.codeBrideName);

    const parsedDate = new Date(hero.countdownDateIso);
    if (!Number.isNaN(parsedDate.getTime())) {
      weddingDate = parsedDate;
    }
  }

  function updateCountdown() {
    const now  = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      document.querySelectorAll('.countdown-num').forEach(el => { el.textContent = '00'; });
      const note = document.querySelector('.countdown-note');
      if (note) note.textContent = countdownExpiredNote;
      return;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');

    const elDays    = document.getElementById('cd-days');
    const elHours   = document.getElementById('cd-hours');
    const elMinutes = document.getElementById('cd-minutes');
    const elSeconds = document.getElementById('cd-seconds');

    if (elDays)    elDays.textContent    = pad(days);
    if (elHours)   elHours.textContent   = pad(hours);
    if (elMinutes) elMinutes.textContent = pad(minutes);
    if (elSeconds) elSeconds.textContent = pad(seconds);
  }

  fetchSiteConfig()
    .then((config) => {
      applySiteConfig(config);
      updateCountdown();
    })
    .catch(() => {
      // Keep static fallback from HTML when config is unavailable.
    });

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ─── Copy account number ─────────────────────────────────── */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓ Disalin!';
        btn.style.color = 'var(--accent-green)';
        btn.style.borderColor = 'var(--accent-green)';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 2000);
      }).catch(() => {
        const range = document.createRange();
        const span  = document.createElement('span');
        span.textContent = text;
        span.style.position = 'fixed';
        span.style.top = '-9999px';
        document.body.appendChild(span);
        range.selectNode(span);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        document.body.removeChild(span);
        btn.textContent = '✓ Disalin!';
        setTimeout(() => { btn.textContent = '⎘ Salin Nomor'; }, 2000);
      });
    });
  });

  /* ─── RSVP Form ───────────────────────────────────────────── */
  const rsvpForm    = document.getElementById('rsvp-form');
  const rsvpSuccess = document.getElementById('rsvp-success');
  const rsvpSubmit  = rsvpForm ? rsvpForm.querySelector('button[type="submit"]') : null;

  async function fetchRsvps() {
    const response = await fetch('/api/rsvp');
    if (!response.ok) {
      throw new Error('Gagal mengambil data RSVP');
    }

    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async function createRsvp(data) {
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Gagal menyimpan RSVP');
    }

    return payload.data;
  }

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name    = document.getElementById('rsvp-name').value.trim();
      const attend  = document.getElementById('rsvp-attend').value;
      const guests  = Number(document.getElementById('rsvp-guests').value || 1);
      const message = document.getElementById('rsvp-message').value.trim();

      if (!name || !attend) return;

      const originalButtonText = rsvpSubmit ? rsvpSubmit.textContent : null;
      if (rsvpSubmit) {
        rsvpSubmit.disabled = true;
        rsvpSubmit.textContent = '$ posting --rsvp';
      }

      try {
        const saved = await createRsvp({ name, attend, guests, message });
        addWish(saved, true);

        rsvpForm.reset();
        rsvpForm.style.display = 'none';
        if (rsvpSuccess) rsvpSuccess.style.display = 'block';
      } catch (err) {
        const errorText = err instanceof Error ? err.message : 'Terjadi kesalahan saat kirim RSVP.';
        window.alert(errorText);
      } finally {
        if (rsvpSubmit) {
          rsvpSubmit.disabled = false;
          rsvpSubmit.textContent = originalButtonText;
        }
      }
    });
  }

  /* ─── Wishes list ─────────────────────────────────────────── */
  const seedWishes = [
    { name: 'Rizky Pratama', attend: 'hadir', message: 'Barakallahu lakuma, semoga menjadi keluarga sakinah mawaddah wa rahmah! 🤍', time: new Date(Date.now() - 3600000 * 2) },
    { name: 'Dewi Lestari', attend: 'hadir', message: 'Selamat ya! Semoga rumah tangganya penuh berkah, dan codenya selalu compile tanpa error 😄', time: new Date(Date.now() - 3600000 * 5) },
    { name: 'Budi Santoso', attend: 'tidak', message: 'Maaf tidak bisa hadir, tapi doa selalu menyertai. Semoga bahagia selalu!', time: new Date(Date.now() - 3600000 * 8) },
    { name: 'Sari Indah', attend: 'hadir', message: 'Selamat menempuh hidup baru! Semoga servernya uptime 100% dan connection-nya tidak pernah lost 💑', time: new Date(Date.now() - 3600000 * 12) },
  ];

  function formatTimeAgo(dateLike) {
    const date = new Date(dateLike);
    const diff = Date.now() - date.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (days  > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins  > 0) return `${mins}m ago`;
    return 'just now';
  }

  function addWish(wish, prepend = true) {
    const list = document.getElementById('wishes-list');
    if (!list) return;

    const safeName = escapeHtml(wish.name || 'Tamu');
    const safeMessage = escapeHtml(wish.message || '');
    const commitId = wish.id ? String(wish.id).slice(-7) : Math.random().toString(16).slice(2, 9);

    const el = document.createElement('div');
    el.className = 'wish-item';
    el.innerHTML = `
      <div class="wish-meta">
        <span class="wish-name">@${safeName.replace(/\s/g, '_').toLowerCase()}</span>
        <span class="wish-status ${wish.attend === 'hadir' ? 'hadir' : 'tidak'}">${wish.attend === 'hadir' ? '✓ Hadir' : '✗ Tidak Hadir'}</span>
      </div>
      ${safeMessage ? `<p class="wish-text">${safeMessage}</p>` : ''}
      <div class="wish-commit">
        <span>⎇</span>
        <span>commit ${escapeHtml(commitId)}</span>
        <span>·</span>
        <span>${formatTimeAgo(wish.createdAt || wish.time)}</span>
      </div>
    `;

    if (prepend) {
      list.prepend(el);
      return;
    }
    list.appendChild(el);
  }

  async function initWishes() {
    const list = document.getElementById('wishes-list');
    if (!list) return;

    list.innerHTML = '';

    try {
      const items = await fetchRsvps();
      if (items.length === 0) {
        seedWishes.forEach(w => addWish(w, false));
        return;
      }

      items.forEach(item => addWish(item, false));
    } catch {
      seedWishes.forEach(w => addWish(w, false));
    }
  }

  initWishes();

  /* ─── Music toggle placeholder ────────────────────────────── */
  const musicBtn = document.getElementById('music-toggle');
  let musicPlaying = false;

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      musicPlaying = !musicPlaying;
      musicBtn.textContent = musicPlaying ? '⏸' : '♪';
      musicBtn.title = musicPlaying ? 'Jeda Musik' : 'Putar Musik';
    });
  }

})();
