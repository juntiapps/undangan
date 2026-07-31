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

  /* ─── Countdown timer ─────────────────────────────────────── */
  const WEDDING_DATE = new Date('2025-03-15T09:00:00');

  function updateCountdown() {
    const now  = new Date();
    const diff = WEDDING_DATE - now;

    if (diff <= 0) {
      document.querySelectorAll('.countdown-num').forEach(el => { el.textContent = '00'; });
      const note = document.querySelector('.countdown-note');
      if (note) note.textContent = '// Barakallahu lakuma wa baraka alaikuma wa jama\'a bainakuma fi khair';
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

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', e => {
      e.preventDefault();
      const name    = document.getElementById('rsvp-name').value.trim();
      const attend  = document.getElementById('rsvp-attend').value;
      const guests  = document.getElementById('rsvp-guests').value;
      const message = document.getElementById('rsvp-message').value.trim();

      if (!name || !attend) return;

      // Store wish locally and display it
      addWish({ name, attend, message, time: new Date() });

      rsvpForm.reset();
      rsvpForm.style.display = 'none';
      if (rsvpSuccess) rsvpSuccess.style.display = 'block';
    });
  }

  /* ─── Wishes list ─────────────────────────────────────────── */
  const seedWishes = [
    { name: 'Rizky Pratama', attend: 'hadir', message: 'Barakallahu lakuma, semoga menjadi keluarga sakinah mawaddah wa rahmah! 🤍', time: new Date(Date.now() - 3600000 * 2) },
    { name: 'Dewi Lestari', attend: 'hadir', message: 'Selamat ya! Semoga rumah tangganya penuh berkah, dan codenya selalu compile tanpa error 😄', time: new Date(Date.now() - 3600000 * 5) },
    { name: 'Budi Santoso', attend: 'tidak', message: 'Maaf tidak bisa hadir, tapi doa selalu menyertai. Semoga bahagia selalu!', time: new Date(Date.now() - 3600000 * 8) },
    { name: 'Sari Indah', attend: 'hadir', message: 'Selamat menempuh hidup baru! Semoga servernya uptime 100% dan connection-nya tidak pernah lost 💑', time: new Date(Date.now() - 3600000 * 12) },
  ];

  function formatTimeAgo(date) {
    const diff = Date.now() - date;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (days  > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins  > 0) return `${mins}m ago`;
    return 'just now';
  }

  function addWish(wish) {
    const list = document.getElementById('wishes-list');
    if (!list) return;

    const el = document.createElement('div');
    el.className = 'wish-item';
    el.innerHTML = `
      <div class="wish-meta">
        <span class="wish-name">@${wish.name.replace(/\s/g, '_').toLowerCase()}</span>
        <span class="wish-status ${wish.attend === 'hadir' ? 'hadir' : 'tidak'}">${wish.attend === 'hadir' ? '✓ Hadir' : '✗ Tidak Hadir'}</span>
      </div>
      ${wish.message ? `<p class="wish-text">${wish.message}</p>` : ''}
      <div class="wish-commit">
        <span>⎇</span>
        <span>commit ${Math.random().toString(16).slice(2, 9)}</span>
        <span>·</span>
        <span>${formatTimeAgo(wish.time)}</span>
      </div>
    `;

    list.prepend(el);
  }

  seedWishes.forEach(w => addWish(w));

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
