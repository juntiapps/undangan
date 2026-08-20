(function () {
  'use strict';

  const tbody = document.getElementById('rsvp-tbody');
  const state = document.getElementById('state');
  const refreshBtn = document.getElementById('refresh-btn');
  const configForm = document.getElementById('site-config-form');
  const saveConfigBtn = document.getElementById('save-config-btn');
  const savePreviewBtn = document.getElementById('save-preview-btn');
  const configState = document.getElementById('config-state');

  const statTotal = document.getElementById('stat-total');
  const statHadir = document.getElementById('stat-hadir');
  const statTidak = document.getElementById('stat-tidak');
  const statGuests = document.getElementById('stat-guests');

  const configFields = {
    published: document.getElementById('cfg-published'),
    groomName: document.getElementById('cfg-groom-name'),
    groomShortName: document.getElementById('cfg-groom-short'),
    groomSuffix: document.getElementById('cfg-groom-suffix'),
    groomProfession: document.getElementById('cfg-groom-profession'),
    groomParents: document.getElementById('cfg-groom-parents'),
    brideName: document.getElementById('cfg-bride-name'),
    brideShortName: document.getElementById('cfg-bride-short'),
    brideSuffix: document.getElementById('cfg-bride-suffix'),
    brideProfession: document.getElementById('cfg-bride-profession'),
    brideParents: document.getElementById('cfg-bride-parents'),
    dayLabel: document.getElementById('cfg-day-label'),
    dateLabel: document.getElementById('cfg-date-label'),
    cityLabel: document.getElementById('cfg-city-label'),
    countdownDateIso: document.getElementById('cfg-countdown-iso'),
    countdownNote: document.getElementById('cfg-countdown-note'),
    countdownExpiredNote: document.getElementById('cfg-countdown-expired-note'),
    akadDate: document.getElementById('cfg-akad-date'),
    akadTime: document.getElementById('cfg-akad-time'),
    akadLocation: document.getElementById('cfg-akad-event-location'),
    akadDresscode: document.getElementById('cfg-akad-dresscode'),
    resepsiDate: document.getElementById('cfg-resepsi-date'),
    resepsiTime: document.getElementById('cfg-resepsi-time'),
    resepsiLocation: document.getElementById('cfg-resepsi-event-location'),
    resepsiDresscode: document.getElementById('cfg-resepsi-dresscode'),
    akadName: document.getElementById('cfg-akad-location-name'),
    akadAddress: document.getElementById('cfg-akad-address'),
    akadMapUrl: document.getElementById('cfg-akad-map-url'),
    resepsiName: document.getElementById('cfg-resepsi-location-name'),
    resepsiAddress: document.getElementById('cfg-resepsi-address'),
    resepsiMapUrl: document.getElementById('cfg-resepsi-map-url'),
    pageTitle: document.getElementById('cfg-page-title'),
    metaDescription: document.getElementById('cfg-meta-description'),
    ogTitle: document.getElementById('cfg-og-title'),
    ogDescription: document.getElementById('cfg-og-description'),
    heroDateAriaLabel: document.getElementById('cfg-hero-aria-label'),
    loaderCloneCommand: document.getElementById('cfg-loader-command'),
    codeGroomName: document.getElementById('cfg-code-groom-name'),
    codeBrideName: document.getElementById('cfg-code-bride-name'),
    giftAccountName1: document.getElementById('cfg-gift-account-name-1'),
    giftAccountName2: document.getElementById('cfg-gift-account-name-2'),
    closingGroomName: document.getElementById('cfg-closing-groom-name'),
    closingBrideName: document.getElementById('cfg-closing-bride-name'),
    footerBranding: document.getElementById('cfg-footer-branding'),
    youtubeVideoId: document.getElementById('cfg-youtube-video-id'),
    giftBank1: document.getElementById('cfg-gift-bank-1'),
    giftName1: document.getElementById('cfg-gift-name-1'),
    giftNumber1: document.getElementById('cfg-gift-number-1'),
    giftCopy1: document.getElementById('cfg-gift-copy-1'),
    giftBank2: document.getElementById('cfg-gift-bank-2'),
    giftName2: document.getElementById('cfg-gift-name-2'),
    giftNumber2: document.getElementById('cfg-gift-number-2'),
    giftCopy2: document.getElementById('cfg-gift-copy-2')
  };

  function formatDate(isoValue) {
    const d = new Date(isoValue);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderStats(items) {
    const hadir = items.filter((item) => item.attend === 'hadir').length;
    const tidak = items.filter((item) => item.attend === 'tidak').length;
    const totalGuests = items.reduce((acc, item) => acc + Number(item.guests || 0), 0);

    statTotal.textContent = String(items.length);
    statHadir.textContent = String(hadir);
    statTidak.textContent = String(tidak);
    statGuests.textContent = String(totalGuests);
  }

  function renderRows(items) {
    tbody.innerHTML = '';

    if (items.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="5">Belum ada RSVP tersimpan.</td>';
      tbody.appendChild(row);
      return;
    }

    for (const item of items) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(formatDate(item.createdAt))}</td>
        <td>${escapeHtml(item.name || '-')}</td>
        <td><span class="badge ${item.attend === 'hadir' ? 'hadir' : 'tidak'}">${item.attend === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</span></td>
        <td>${escapeHtml(String(item.guests || 0))}</td>
        <td class="message">${escapeHtml(item.message || '-')}</td>
      `;
      tbody.appendChild(row);
    }
  }

  function setConfigState(message, isError) {
    configState.textContent = message;
    configState.style.color = isError ? '#b72f4a' : '';
  }

  function assignConfigToForm(config) {
    const couple = config.couple || {};
    const hero = config.hero || {};
    const events = config.events || {};
    const locations = config.locations || {};
    const branding = config.branding || {};
    const gifts = config.gifts || {};

    configFields.published.checked = config.published !== false;
    configFields.groomName.value = couple.groomName || '';
    configFields.groomShortName.value = couple.groomShortName || '';
    configFields.groomSuffix.value = couple.groomSuffix || '';
    configFields.groomProfession.value = couple.groomProfession || '';
    configFields.groomParents.value = couple.groomParents || '';
    configFields.brideName.value = couple.brideName || '';
    configFields.brideShortName.value = couple.brideShortName || '';
    configFields.brideSuffix.value = couple.brideSuffix || '';
    configFields.brideProfession.value = couple.brideProfession || '';
    configFields.brideParents.value = couple.brideParents || '';

    configFields.dayLabel.value = hero.dayLabel || '';
    configFields.dateLabel.value = hero.dateLabel || '';
    configFields.cityLabel.value = hero.cityLabel || '';
    configFields.countdownDateIso.value = hero.countdownDateIso || '';
    configFields.countdownNote.value = hero.countdownNote || '';
    configFields.countdownExpiredNote.value = hero.countdownExpiredNote || '';

    configFields.akadDate.value = events.akadDate || '';
    configFields.akadTime.value = events.akadTime || '';
    configFields.akadLocation.value = events.akadLocation || '';
    configFields.akadDresscode.value = events.akadDresscode || '';
    configFields.resepsiDate.value = events.resepsiDate || '';
    configFields.resepsiTime.value = events.resepsiTime || '';
    configFields.resepsiLocation.value = events.resepsiLocation || '';
    configFields.resepsiDresscode.value = events.resepsiDresscode || '';

    configFields.akadName.value = locations.akadName || '';
    configFields.akadAddress.value = locations.akadAddress || '';
    configFields.akadMapUrl.value = locations.akadMapUrl || '';
    configFields.resepsiName.value = locations.resepsiName || '';
    configFields.resepsiAddress.value = locations.resepsiAddress || '';
    configFields.resepsiMapUrl.value = locations.resepsiMapUrl || '';

    configFields.pageTitle.value = branding.pageTitle || '';
    configFields.metaDescription.value = branding.metaDescription || '';
    configFields.ogTitle.value = branding.ogTitle || '';
    configFields.ogDescription.value = branding.ogDescription || '';
    configFields.heroDateAriaLabel.value = branding.heroDateAriaLabel || '';
    configFields.loaderCloneCommand.value = branding.loaderCloneCommand || '';
    configFields.codeGroomName.value = branding.codeGroomName || '';
    configFields.codeBrideName.value = branding.codeBrideName || '';
    configFields.giftAccountName1.value = branding.giftAccountName1 || '';
    configFields.giftAccountName2.value = branding.giftAccountName2 || '';
    configFields.closingGroomName.value = branding.closingGroomName || '';
    configFields.closingBrideName.value = branding.closingBrideName || '';
    configFields.footerBranding.value = branding.footerBranding || '';
    configFields.youtubeVideoId.value = branding.youtubeVideoId || '';

    configFields.giftBank1.value = gifts.account1Bank || '';
    configFields.giftName1.value = gifts.account1Name || '';
    configFields.giftNumber1.value = gifts.account1Number || '';
    configFields.giftCopy1.value = gifts.account1CopyValue || '';
    configFields.giftBank2.value = gifts.account2Bank || '';
    configFields.giftName2.value = gifts.account2Name || '';
    configFields.giftNumber2.value = gifts.account2Number || '';
    configFields.giftCopy2.value = gifts.account2CopyValue || '';
  }

  function collectConfigFromForm() {
    return {
      published: configFields.published.checked,
      couple: {
        groomName: configFields.groomName.value,
        groomShortName: configFields.groomShortName.value,
        groomSuffix: configFields.groomSuffix.value,
        groomProfession: configFields.groomProfession.value,
        groomParents: configFields.groomParents.value,
        brideName: configFields.brideName.value,
        brideShortName: configFields.brideShortName.value,
        brideSuffix: configFields.brideSuffix.value,
        brideProfession: configFields.brideProfession.value,
        brideParents: configFields.brideParents.value,
      },
      hero: {
        dayLabel: configFields.dayLabel.value,
        dateLabel: configFields.dateLabel.value,
        cityLabel: configFields.cityLabel.value,
        countdownDateIso: configFields.countdownDateIso.value,
        countdownNote: configFields.countdownNote.value,
        countdownExpiredNote: configFields.countdownExpiredNote.value,
      },
      events: {
        akadDate: configFields.akadDate.value,
        akadTime: configFields.akadTime.value,
        akadLocation: configFields.akadLocation.value,
        akadDresscode: configFields.akadDresscode.value,
        resepsiDate: configFields.resepsiDate.value,
        resepsiTime: configFields.resepsiTime.value,
        resepsiLocation: configFields.resepsiLocation.value,
        resepsiDresscode: configFields.resepsiDresscode.value,
      },
      locations: {
        akadName: configFields.akadName.value,
        akadAddress: configFields.akadAddress.value,
        akadMapUrl: configFields.akadMapUrl.value,
        resepsiName: configFields.resepsiName.value,
        resepsiAddress: configFields.resepsiAddress.value,
        resepsiMapUrl: configFields.resepsiMapUrl.value,
      },
      branding: {
        pageTitle: configFields.pageTitle.value,
        metaDescription: configFields.metaDescription.value,
        ogTitle: configFields.ogTitle.value,
        ogDescription: configFields.ogDescription.value,
        heroDateAriaLabel: configFields.heroDateAriaLabel.value,
        loaderCloneCommand: configFields.loaderCloneCommand.value,
        codeGroomName: configFields.codeGroomName.value,
        codeBrideName: configFields.codeBrideName.value,
        giftAccountName1: configFields.giftAccountName1.value,
        giftAccountName2: configFields.giftAccountName2.value,
        closingGroomName: configFields.closingGroomName.value,
        closingBrideName: configFields.closingBrideName.value,
        footerBranding: configFields.footerBranding.value,
        youtubeVideoId: configFields.youtubeVideoId.value,
      },
      gifts: {
        account1Bank: configFields.giftBank1.value,
        account1Name: configFields.giftName1.value,
        account1Number: configFields.giftNumber1.value,
        account1CopyValue: configFields.giftCopy1.value,
        account2Bank: configFields.giftBank2.value,
        account2Name: configFields.giftName2.value,
        account2Number: configFields.giftNumber2.value,
        account2CopyValue: configFields.giftCopy2.value,
      }
    };
  }

  async function loadSiteConfig() {
    setConfigState('Memuat pengaturan...', false);

    try {
      const response = await fetch('/api/admin/config');
      if (!response.ok) {
        throw new Error('Gagal mengambil pengaturan konten.');
      }

      const payload = await response.json();
      assignConfigToForm(payload.data || {});
      setConfigState('Pengaturan berhasil dimuat.', false);
    } catch (err) {
      setConfigState(err instanceof Error ? err.message : 'Terjadi kesalahan.', true);
    }
  }

  async function saveSiteConfig(event) {
    event.preventDefault();
    if (!configForm) return;

    const submitterId = event.submitter && event.submitter.id ? event.submitter.id : '';
    const shouldPreview = submitterId === 'save-preview-btn';

    if (!configForm.reportValidity()) {
      setConfigState('Lengkapi field yang wajib diisi.', true);
      return;
    }

    saveConfigBtn.disabled = true;
    if (savePreviewBtn) savePreviewBtn.disabled = true;
    setConfigState('Menyimpan pengaturan...', false);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(collectConfigFromForm())
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Gagal menyimpan pengaturan.');
      }

      assignConfigToForm(payload.data || {});
      setConfigState(payload.message || 'Pengaturan tersimpan.', false);

      if (shouldPreview) {
        window.open('/', '_blank', 'noopener');
      }
    } catch (err) {
      setConfigState(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.', true);
    } finally {
      saveConfigBtn.disabled = false;
      if (savePreviewBtn) savePreviewBtn.disabled = false;
    }
  }

  async function loadRsvps() {
    state.textContent = 'Memuat data RSVP...';
    refreshBtn.disabled = true;

    try {
      const response = await fetch('/api/admin/rsvps?limit=500');
      if (!response.ok) {
        throw new Error('Gagal mengambil data RSVP');
      }

      const payload = await response.json();
      const items = Array.isArray(payload.data) ? payload.data : [];

      renderRows(items);
      renderStats(items);
      state.textContent = `Menampilkan ${items.length} data RSVP.`;
    } catch (err) {
      state.textContent = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data.';
    } finally {
      refreshBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener('click', loadRsvps);
  if (configForm) {
    configForm.addEventListener('submit', saveSiteConfig);
  }

  loadSiteConfig();
  loadRsvps();
})();
