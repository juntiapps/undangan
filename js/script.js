/* ── Floating particles (binary rain) ─────────────────────── */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function announceStatus(message) {
    const status = document.getElementById("ui-status");
    if (!status) return;
    status.textContent = "";
    window.setTimeout(() => {
      status.textContent = message;
    }, 50);
  }

  /* ─── Theme toggle ────────────────────────────────────────── */
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = themeToggle
    ? themeToggle.querySelector(".theme-toggle-icon")
    : null;
  const themeText = themeToggle
    ? themeToggle.querySelector(".theme-toggle-text")
    : null;

  function setTheme(theme, announce = false) {
    const normalized = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", normalized);
    localStorage.setItem("theme-preference", normalized);

    if (!themeToggle) return;

    const isLight = normalized === "light";
    themeToggle.setAttribute("aria-pressed", isLight ? "true" : "false");
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Aktifkan tema gelap" : "Aktifkan tema terang",
    );
    if (themeIcon) themeIcon.textContent = isLight ? "🌙" : "☀";
    if (themeText)
      themeText.textContent = isLight ? "Tema gelap" : "Tema terang";
    if (announce) {
      announceStatus(isLight ? "Tema terang aktif." : "Tema gelap aktif.");
    }
  }

  function initTheme() {
    const stored = localStorage.getItem("theme-preference");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }

    const systemPrefersLight = window.matchMedia(
      "(prefers-color-scheme: light)",
    ).matches;
    setTheme(systemPrefersLight ? "light" : "dark");
  }

  initTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") || "dark";
      setTheme(current === "light" ? "dark" : "light", true);
    });
  }

  /* ─── Particle canvas ─────────────────────────────────────── */
  const canvas = document.getElementById("particles-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let drops = [];
    const chars = "01アイウエオカキクケコサシスセソタチ<>{}[]()#$%@!".split("");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initDrops();
    }

    function initDrops() {
      const cols = Math.floor(canvas.width / 18);
      drops = Array.from({ length: cols }, () => ({
        x: 0,
        y: ((Math.random() * canvas.height) / 16) | 0,
        speed: 0.15 + Math.random() * 0.4,
        opacity: 0.05 + Math.random() * 0.15,
        char: chars[(Math.random() * chars.length) | 0],
      }));
      drops.forEach((d, i) => {
        d.x = i * 18;
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "13px Consolas, monospace";
      drops.forEach((d) => {
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
    function loop() {
      drawParticles();
      animId = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", resize);
    resize();

    if (!prefersReducedMotion) {
      loop();
    } else {
      drawParticles();
    }
  }

  /* ─── Loading screen ──────────────────────────────────────── */
  const loadingScreen = document.getElementById("loading-screen");
  const mainContent = document.getElementById("main-content");
  const comingSoonMessage = document.getElementById("coming-soon-message");
  let isPublished = true;
  let configLoaded = false;
  let loadingDelayComplete = false;

  function updateLoadingScreen() {
    if (!loadingScreen || !mainContent) return;

    if (!isPublished) {
      loadingScreen.setAttribute("aria-label", "Coming Soon");
      loadingScreen.classList.add("coming-soon-active");
      if (comingSoonMessage) comingSoonMessage.hidden = false;
      return;
    }

    if (!configLoaded || !loadingDelayComplete) return;
    loadingScreen.classList.add("fade-out");
    window.setTimeout(() => {
      loadingScreen.style.display = "none";
      mainContent.style.opacity = "1";
    }, 600);
  }

  if (loadingScreen && mainContent) {
    // Hide main content until loading done
    mainContent.style.opacity = "0";
    mainContent.style.transition = "opacity 0.6s ease";

    // Wait for config so unpublished invitations remain on the loader.
    window.setTimeout(() => {
      loadingDelayComplete = true;
      updateLoadingScreen();
    }, 4200);
  }

  /* ─── Scroll reveal ───────────────────────────────────────── */
  const revealEls = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  revealEls.forEach((el) => observer.observe(el));

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nlToBr(value) {
    return escapeHtml(value).replace(/\n/g, "<br />");
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = String(value || "");
  }

  function setHtmlFromMultiline(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = nlToBr(String(value || ""));
  }

  function setHref(id, value) {
    const el = document.getElementById(id);
    if (!el || !value) return;
    el.setAttribute("href", value);
  }

  function setMeta(id, content) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute("content", String(content || ""));
  }

  function setDataAttribute(id, key, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute(`data-${key}`, String(value || ""));
  }

  async function fetchSiteConfig() {
    const response = await fetch("/api/config");
    if (!response.ok) {
      throw new Error("Gagal mengambil konfigurasi undangan");
    }

    const payload = await response.json();
    return payload.data || null;
  }

  /* ─── Countdown timer ─────────────────────────────────────── */
  const DEFAULT_YOUTUBE_VIDEO_ID = "QgaTQ5-XfMM";
  let selectedYoutubeVideoId = DEFAULT_YOUTUBE_VIDEO_ID;
  let weddingDate = new Date("2025-03-15T09:00:00");
  let countdownExpiredNote =
    "// Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fi khair";

  function normalizeYouTubeVideoId(value) {
    const text = String(value || "").trim();
    const idPattern = /^[a-zA-Z0-9_-]{11}$/;
    if (idPattern.test(text)) return text;

    if (!text) return "";
    try {
      const url = new URL(text);
      if (url.hostname.includes("youtu.be")) {
        const candidate = url.pathname.replace(/^\//, "").trim();
        return idPattern.test(candidate) ? candidate : "";
      }

      if (url.hostname.includes("youtube.com")) {
        const candidate = url.searchParams.get("v") || "";
        return idPattern.test(candidate) ? candidate : "";
      }
    } catch {
      return "";
    }

    return "";
  }

  function applySiteConfig(config) {
    if (!config) return;

    isPublished = config.published !== false;
    updateLoadingScreen();

    const couple = config.couple || {};
    const hero = config.hero || {};
    const events = config.events || {};
    const locations = config.locations || {};
    const gifts = config.gifts || {};
    const branding = config.branding || {};

    setText("hero-groom-name", couple.groomShortName);
    setText(
      "hero-groom-suffix",
      couple.groomSuffix ? ` ${couple.groomSuffix}` : "",
    );
    setText("hero-bride-name", couple.brideShortName);
    setText(
      "hero-bride-suffix",
      couple.brideSuffix ? ` ${couple.brideSuffix}` : "",
    );
    setText("couple-groom-name", couple.groomName);
    setText("couple-bride-name", couple.brideName);
    setText("couple-groom-profession", couple.groomProfession);
    setHtmlFromMultiline("couple-groom-parents", couple.groomParents);
    setText("couple-bride-profession", couple.brideProfession);
    setHtmlFromMultiline("couple-bride-parents", couple.brideParents);

    setText("hero-day-label", hero.dayLabel);
    setText("hero-date-label", hero.dateLabel);
    setText("hero-city-label", hero.cityLabel);
    setText("countdown-note", hero.countdownNote);
    if (hero.countdownExpiredNote) {
      countdownExpiredNote = hero.countdownExpiredNote;
    }
    setText("loader-clone-cmd", branding.loaderCloneCommand);

    const heroDateBadge = document.getElementById("hero-date-badge");
    if (heroDateBadge && branding.heroDateAriaLabel) {
      heroDateBadge.setAttribute("aria-label", branding.heroDateAriaLabel);
    }

    if (branding.pageTitle) {
      document.title = branding.pageTitle;
    }
    setMeta("meta-description", branding.metaDescription);
    setMeta("meta-og-title", branding.ogTitle);
    setMeta("meta-og-description", branding.ogDescription);

    setText("akad-date", events.akadDate);
    setText("akad-time", events.akadTime);
    setHtmlFromMultiline("akad-event-location", events.akadLocation);
    setText("akad-dresscode", events.akadDresscode);

    setText("resepsi-date", events.resepsiDate);
    setText("resepsi-time", events.resepsiTime);
    setHtmlFromMultiline("resepsi-event-location", events.resepsiLocation);
    setText("resepsi-dresscode", events.resepsiDresscode);

    setText("akad-location-name", locations.akadName);
    setHtmlFromMultiline("akad-location-address", locations.akadAddress);
    setHref("akad-map-link", locations.akadMapUrl);

    setText("resepsi-location-name", locations.resepsiName);
    setHtmlFromMultiline("resepsi-location-address", locations.resepsiAddress);
    setHref("resepsi-map-link", locations.resepsiMapUrl);

    setText(
      "gift-bank-1",
      gifts.account1Bank ? `// ${gifts.account1Bank}` : "",
    );
    setText(
      "gift-account-name-1",
      gifts.account1Name || branding.giftAccountName1,
    );
    setText("gift-account-num-1", gifts.account1Number);
    setDataAttribute(
      "gift-copy-btn-1",
      "copy",
      gifts.account1CopyValue || gifts.account1Number || "",
    );

    setText(
      "gift-bank-2",
      gifts.account2Bank ? `// ${gifts.account2Bank}` : "",
    );
    setText(
      "gift-account-name-2",
      gifts.account2Name || branding.giftAccountName2,
    );
    setText("gift-account-num-2", gifts.account2Number);
    setDataAttribute(
      "gift-copy-btn-2",
      "copy",
      gifts.account2CopyValue || gifts.account2Number || "",
    );

    setText("closing-groom-name", branding.closingGroomName);
    setText("closing-bride-name", branding.closingBrideName);
    setText("footer-branding", branding.footerBranding);
    setText("code-groom-name", branding.codeGroomName);
    setText("code-bride-name", branding.codeBrideName);

    function formatTanggalIndo(tanggalStr) {
      const namaBulan = {
        Januari: "01",
        Februari: "02",
        Maret: "03",
        April: "04",
        Mei: "05",
        Juni: "06",
        Juli: "07",
        Agustus: "08",
        September: "09",
        Oktober: "10",
        November: "11",
        Desember: "12",
      };

      // Hapus koma, lalu pisahkan berdasarkan spasi
      const parts = tanggalStr.replace(",", "").split(" ");

      // parts[0] = Hari (Sabtu)
      // parts[1] = Tanggal (15)
      // parts[2] = Bulan (Maret)
      // parts[3] = Tahun (2025)
      const tgl = parts[1].padStart(2, "0");
      const bln = namaBulan[parts[2]];
      const thn = parts[3];

      return `${thn}-${bln}-${tgl}`;
    }

    const cfgDate =
      events.akadDate || events.resepsiDate || hero.dateLabel || "";
    setText("config-date", formatTanggalIndo(cfgDate));

    const configuredYoutubeId = normalizeYouTubeVideoId(
      branding.youtubeVideoId,
    );
    if (configuredYoutubeId) {
      selectedYoutubeVideoId = configuredYoutubeId;
    }

    const parsedDate = new Date(hero.countdownDateIso);
    if (!Number.isNaN(parsedDate.getTime())) {
      weddingDate = parsedDate;
    }
  }

  function updateCountdown() {
    const now = new Date();
    const diff = weddingDate - now;

    if (diff <= 0) {
      document.querySelectorAll(".countdown-num").forEach((el) => {
        el.textContent = "00";
      });
      const note = document.querySelector(".countdown-note");
      if (note) note.textContent = countdownExpiredNote;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, "0");

    const elDays = document.getElementById("cd-days");
    const elHours = document.getElementById("cd-hours");
    const elMinutes = document.getElementById("cd-minutes");
    const elSeconds = document.getElementById("cd-seconds");

    if (elDays) elDays.textContent = pad(days);
    if (elHours) elHours.textContent = pad(hours);
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
    })
    .finally(() => {
      configLoaded = true;
      updateLoadingScreen();
      initMusicToggle();
    });

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ─── Copy account number ─────────────────────────────────── */
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.copy;
      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          const original = btn.textContent;
          btn.textContent = "✓ Disalin!";
          btn.style.color = "var(--accent-green)";
          btn.style.borderColor = "var(--accent-green)";
          announceStatus("Nomor rekening berhasil disalin.");
          setTimeout(() => {
            btn.textContent = original;
            btn.style.color = "";
            btn.style.borderColor = "";
          }, 2000);
        })
        .catch(() => {
          const range = document.createRange();
          const span = document.createElement("span");
          span.textContent = text;
          span.style.position = "fixed";
          span.style.top = "-9999px";
          document.body.appendChild(span);
          range.selectNode(span);
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(range);
          document.execCommand("copy");
          window.getSelection().removeAllRanges();
          document.body.removeChild(span);
          btn.textContent = "✓ Disalin!";
          announceStatus("Nomor rekening berhasil disalin.");
          setTimeout(() => {
            btn.textContent = "⎘ Salin Nomor";
          }, 2000);
        });
    });
  });

  /* ─── RSVP Form ───────────────────────────────────────────── */
  const rsvpForm = document.getElementById("rsvp-form");
  const rsvpSuccess = document.getElementById("rsvp-success");
  const rsvpSubmit = rsvpForm
    ? rsvpForm.querySelector('button[type="submit"]')
    : null;
  const rsvpFormError = document.getElementById("rsvp-form-error");

  function setRsvpFieldError(field, hasError) {
    if (!field) return;
    field.setAttribute("aria-invalid", hasError ? "true" : "false");
  }

  function clearRsvpErrors() {
    ["rsvp-name", "rsvp-attend", "rsvp-guests", "rsvp-message"].forEach(
      (id) => {
        setRsvpFieldError(document.getElementById(id), false);
      },
    );

    if (rsvpFormError) {
      rsvpFormError.hidden = true;
      rsvpFormError.textContent = "";
    }
  }

  function showRsvpError(message, fields) {
    if (Array.isArray(fields)) {
      fields.forEach((field) => setRsvpFieldError(field, true));
    }

    if (rsvpFormError) {
      rsvpFormError.textContent = message;
      rsvpFormError.hidden = false;
    }

    announceStatus(message);
  }

  async function fetchRsvps() {
    const response = await fetch("/api/rsvp");
    if (!response.ok) {
      throw new Error("Gagal mengambil data RSVP");
    }

    const payload = await response.json();
    return Array.isArray(payload.data) ? payload.data : [];
  }

  async function createRsvp(data) {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Gagal menyimpan RSVP");
    }

    return payload.data;
  }

  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearRsvpErrors();

      const nameField = document.getElementById("rsvp-name");
      const attendField = document.getElementById("rsvp-attend");
      const guestsField = document.getElementById("rsvp-guests");
      const messageField = document.getElementById("rsvp-message");

      const name = nameField.value.trim();
      const attend = attendField.value;
      const guests = Number(guestsField.value || 1);
      const message = messageField.value.trim();

      if (!name && !attend) {
        showRsvpError("Nama lengkap dan konfirmasi kehadiran wajib diisi.", [
          nameField,
          attendField,
        ]);
        nameField.focus();
        return;
      }

      if (!name) {
        showRsvpError("Nama lengkap wajib diisi.", [nameField]);
        nameField.focus();
        return;
      }

      if (!attend) {
        showRsvpError("Pilih status konfirmasi kehadiran terlebih dahulu.", [
          attendField,
        ]);
        attendField.focus();
        return;
      }

      if (!Number.isFinite(guests) || guests < 1 || guests > 10) {
        showRsvpError("Jumlah tamu harus antara 1 sampai 10.", [guestsField]);
        guestsField.focus();
        return;
      }

      const originalButtonText = rsvpSubmit ? rsvpSubmit.textContent : null;
      if (rsvpSubmit) {
        rsvpSubmit.disabled = true;
        rsvpSubmit.textContent = "$ posting --rsvp";
      }

      try {
        const saved = await createRsvp({ name, attend, guests, message });
        addWish(saved, true);

        rsvpForm.reset();
        rsvpForm.style.display = "none";
        if (rsvpSuccess) {
          rsvpSuccess.style.display = "block";
          announceStatus(
            "RSVP berhasil dikirim. Terima kasih atas konfirmasinya.",
          );
        }
      } catch (err) {
        const errorText =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat kirim RSVP.";
        showRsvpError(errorText, []);
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
    {
      name: "Rizky Pratama",
      attend: "hadir",
      message:
        "Barakallahu lakuma, semoga menjadi keluarga sakinah mawaddah wa rahmah! 🤍",
      time: new Date(Date.now() - 3600000 * 2),
    },
    {
      name: "Dewi Lestari",
      attend: "hadir",
      message:
        "Selamat ya! Semoga rumah tangganya penuh berkah, dan codenya selalu compile tanpa error 😄",
      time: new Date(Date.now() - 3600000 * 5),
    },
    {
      name: "Budi Santoso",
      attend: "tidak",
      message:
        "Maaf tidak bisa hadir, tapi doa selalu menyertai. Semoga bahagia selalu!",
      time: new Date(Date.now() - 3600000 * 8),
    },
    {
      name: "Sari Indah",
      attend: "hadir",
      message:
        "Selamat menempuh hidup baru! Semoga servernya uptime 100% dan connection-nya tidak pernah lost 💑",
      time: new Date(Date.now() - 3600000 * 12),
    },
  ];

  function formatTimeAgo(dateLike) {
    const date = new Date(dateLike);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  }

  function addWish(wish, prepend = true) {
    const list = document.getElementById("wishes-list");
    if (!list) return;

    const safeName = escapeHtml(wish.name || "Tamu");
    const safeMessage = escapeHtml(wish.message || "");
    const commitId = wish.id
      ? String(wish.id).slice(-7)
      : Math.random().toString(16).slice(2, 9);

    const el = document.createElement("div");
    el.className = "wish-item";
    el.innerHTML = `
      <div class="wish-meta">
        <span class="wish-name">@${safeName.replace(/\s/g, "_").toLowerCase()}</span>
        <span class="wish-status ${wish.attend === "hadir" ? "hadir" : "tidak"}">${wish.attend === "hadir" ? "✓ Hadir" : "✗ Tidak Hadir"}</span>
      </div>
      ${safeMessage ? `<p class="wish-text">${safeMessage}</p>` : ""}
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
    const list = document.getElementById("wishes-list");
    if (!list) return;

    list.innerHTML = "";

    try {
      const items = await fetchRsvps();
      if (items.length === 0) {
        seedWishes.forEach((w) => addWish(w, false));
        return;
      }

      items.forEach((item) => addWish(item, false));
    } catch {
      seedWishes.forEach((w) => addWish(w, false));
    }
  }

  initWishes();

  /* ─── Music toggle ────────────────────────────────────────── */
  function initMusicToggle() {
    const musicBtn = document.getElementById("music-toggle");
    const youtubePlayerHost = document.getElementById("youtube-player");
    let ytPlayer = null;
    let ytReady = false;
    let musicPlaying = false;

    function loadYouTubeApi() {
      return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
          resolve(window.YT);
          return;
        }

        const previousReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
          if (typeof previousReady === "function") {
            previousReady();
          }
          resolve(window.YT);
        };

        const existingScript = document.querySelector(
          'script[data-youtube-api="true"]',
        );
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = "https://www.youtube.com/iframe_api";
          script.async = true;
          script.defer = true;
          script.setAttribute("data-youtube-api", "true");
          script.onerror = () => reject(new Error("Gagal memuat YouTube API"));
          document.head.appendChild(script);
        }
      });
    }

    function setMusicButtonState(isPlaying) {
      if (!musicBtn) return;
      musicBtn.textContent = isPlaying ? "⏸" : "♪";
      musicBtn.title = isPlaying ? "Jeda Musik" : "Putar Musik";
      musicBtn.setAttribute(
        "aria-label",
        isPlaying ? "Jeda musik latar" : "Putar musik latar",
      );
      musicBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    }

    if (musicBtn && youtubePlayerHost) {
      musicBtn.disabled = true;
      musicBtn.title = "Menyiapkan audio YouTube";
      setMusicButtonState(false);

      loadYouTubeApi()
        .then((YT) => {
          ytPlayer = new YT.Player("youtube-player", {
            height: "0",
            width: "0",
            videoId: selectedYoutubeVideoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              onReady: () => {
                ytReady = true;
                musicBtn.disabled = false;
                musicBtn.title = "Putar Musik";
                ytPlayer.setVolume(45);
              },
              onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                  musicPlaying = true;
                  setMusicButtonState(true);
                  return;
                }

                if (
                  event.data === YT.PlayerState.PAUSED ||
                  event.data === YT.PlayerState.ENDED
                ) {
                  musicPlaying = false;
                  setMusicButtonState(false);
                }
              },
              onError: () => {
                musicBtn.disabled = true;
                musicBtn.title = "Audio YouTube gagal dimuat";
                announceStatus("Audio YouTube gagal dimuat.");
              },
            },
          });
        })
        .catch(() => {
          musicBtn.disabled = true;
          musicBtn.title = "YouTube API gagal dimuat";
          announceStatus("YouTube API gagal dimuat.");
        });

      musicBtn.addEventListener("click", () => {
        if (!ytPlayer || !ytReady) {
          announceStatus("Player YouTube belum siap.");
          return;
        }

        if (!musicPlaying) {
          ytPlayer.playVideo();
          announceStatus("Musik YouTube diputar.");
          return;
        }

        ytPlayer.pauseVideo();
        announceStatus("Musik YouTube dijeda.");
      });
    } else if (musicBtn) {
      musicBtn.disabled = true;
      musicBtn.title = "Player YouTube belum tersedia";
      musicBtn.setAttribute("aria-label", "Player YouTube belum tersedia");
    }
  }
})();
