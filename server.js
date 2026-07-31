'use strict';

require('dotenv').config();

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const app = express();
const PORT = process.env.PORT || 3000;
const RSVP_WINDOW_MS = Number(process.env.RSVP_WINDOW_MS || 60000);
const RSVP_MAX_REQUESTS = Number(process.env.RSVP_MAX_REQUESTS || 3);
const RSVP_DUPLICATE_COOLDOWN_MS = Number(process.env.RSVP_DUPLICATE_COOLDOWN_MS || 300000);
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me';
const ADMIN_API_TOKEN = String(process.env.ADMIN_API_TOKEN || '').trim();

const DEFAULT_SITE_CONFIG = {
  couple: {
    groomName: 'Ahmad Fauzan Maulana',
    groomShortName: 'Ahmad Fauzan',
    groomSuffix: 'S.Kom',
    groomProfession: 'Backend Engineer',
    groomParents: 'Putra pertama dari\nBapak H. Muhamad Ridwan\nIbu Hj. Siti Aminah',
    brideName: 'Nurul Hidayah Putri',
    brideShortName: 'Nurul Hidayah',
    brideSuffix: 'S.T.',
    brideProfession: 'Cloud Infrastructure Engineer',
    brideParents: 'Putri pertama dari\nBapak H. Agus Setiawan\nIbu Hj. Nuraini'
  },
  hero: {
    dayLabel: 'Sabtu',
    dateLabel: '15.03.2025',
    cityLabel: 'Bandung',
    countdownNote: '// Menuju hari bahagia 15 Maret 2025 — Insya Allah',
    countdownExpiredNote: '// Barakallahu lakuma wa baraka alaikuma wa jama\'a bainakuma fi khair',
    countdownDateIso: '2025-03-15T09:00:00'
  },
  events: {
    akadDate: 'Sabtu, 15 Maret 2025',
    akadTime: '08.00 — 10.00 WIB',
    akadLocation: 'Masjid Al-Ikhlas\nJl. Raya Cibiru No. 12, Bandung',
    akadDresscode: 'Busana Muslim / Islami',
    resepsiDate: 'Sabtu, 15 Maret 2025',
    resepsiTime: '11.00 — 15.00 WIB',
    resepsiLocation: 'Aula Gedung Serbaguna\nJl. Cihampelas No. 88, Bandung',
    resepsiDresscode: 'Busana Muslim — Hijau / Tosca'
  },
  locations: {
    akadName: 'Masjid Al-Ikhlas',
    akadAddress: 'Jl. Raya Cibiru No. 12\nCibiru, Bandung\nJawa Barat 40615',
    akadMapUrl: 'https://maps.google.com/?q=Masjid+Al-Ikhlas+Cibiru+Bandung',
    resepsiName: 'Aula Gedung Serbaguna',
    resepsiAddress: 'Jl. Cihampelas No. 88\nCidadap, Bandung\nJawa Barat 40141',
    resepsiMapUrl: 'https://maps.google.com/?q=Jl+Cihampelas+88+Bandung'
  },
  gifts: {
    account1Bank: 'Bank BCA',
    account1Name: 'Ahmad Fauzan Maulana',
    account1Number: '1234 5678 9012',
    account1CopyValue: '123456789012',
    account2Bank: 'Bank Mandiri',
    account2Name: 'Nurul Hidayah Putri',
    account2Number: '9876 5432 1098',
    account2CopyValue: '987654321098'
  },
  branding: {
    pageTitle: 'Undangan Pernikahan | Ahmad & Nurul',
    metaDescription: 'Undangan Pernikahan Ahmad Fauzan Maulana & Nurul Hidayah Putri — 15 Maret 2025',
    ogTitle: 'Undangan Pernikahan — Ahmad & Nurul',
    ogDescription: 'Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir.',
    heroDateAriaLabel: 'Tanggal pernikahan: Sabtu, 15 Maret 2025',
    loaderCloneCommand: 'git clone https://heaven.islam/nikah/ahmad-nurul.git',
    codeGroomName: 'Ahmad Fauzan',
    codeBrideName: 'Nurul Hidayah',
    giftAccountName1: 'Ahmad Fauzan Maulana',
    giftAccountName2: 'Nurul Hidayah Putri',
    closingGroomName: 'Ahmad Fauzan Maulana',
    closingBrideName: 'Nurul Hidayah Putri',
    footerBranding: 'Ahmad & Nurul Wedding © 2025'
  }
};

const DATA_DIR = path.join(__dirname, 'data');
const RSVP_FILE = path.join(DATA_DIR, 'rsvps.json');
const RSVP_DB_FILE = path.join(DATA_DIR, 'rsvps.db');
const rsvpRequestLog = new Map();
let db;

app.use(express.json());
app.use(express.static(__dirname));

async function ensureStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  db = await open({
    filename: RSVP_DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      attend TEXT NOT NULL CHECK(attend IN ('hadir', 'tidak')),
      guests INTEGER NOT NULL CHECK(guests BETWEEN 1 AND 10),
      message TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);
    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      config_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.run(
    `INSERT OR IGNORE INTO site_config (id, config_json, updated_at)
     VALUES (1, ?, ?)`,
    [JSON.stringify(DEFAULT_SITE_CONFIG), new Date().toISOString()]
  );

  await migrateJsonToSqlite();
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  return String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim()
    .slice(0, maxLength);
}

function cleanUrl(value) {
  const text = String(value || '').trim().slice(0, 500);
  if (!text) return '';
  try {
    const url = new URL(text);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

function normalizeSiteConfig(payload) {
  const source = payload && typeof payload === 'object' ? payload : {};
  const couple = source.couple || {};
  const hero = source.hero || {};
  const events = source.events || {};
  const locations = source.locations || {};
  const gifts = source.gifts || {};
  const branding = source.branding || {};

  const groomName = cleanText(couple.groomName, 100) || DEFAULT_SITE_CONFIG.couple.groomName;
  const groomShortName = cleanText(couple.groomShortName, 60) || DEFAULT_SITE_CONFIG.couple.groomShortName;
  const brideName = cleanText(couple.brideName, 100) || DEFAULT_SITE_CONFIG.couple.brideName;
  const brideShortName = cleanText(couple.brideShortName, 60) || DEFAULT_SITE_CONFIG.couple.brideShortName;

  const dayLabel = cleanText(hero.dayLabel, 40) || DEFAULT_SITE_CONFIG.hero.dayLabel;
  const dateLabel = cleanText(hero.dateLabel, 40) || DEFAULT_SITE_CONFIG.hero.dateLabel;
  const cityLabel = cleanText(hero.cityLabel, 60) || DEFAULT_SITE_CONFIG.hero.cityLabel;

  return {
    couple: {
      groomName,
      groomShortName,
      groomSuffix: cleanText(couple.groomSuffix, 30),
      groomProfession: cleanText(couple.groomProfession, 80) || DEFAULT_SITE_CONFIG.couple.groomProfession,
      groomParents: cleanMultiline(couple.groomParents, 240) || DEFAULT_SITE_CONFIG.couple.groomParents,
      brideName,
      brideShortName,
      brideSuffix: cleanText(couple.brideSuffix, 30),
      brideProfession: cleanText(couple.brideProfession, 80) || DEFAULT_SITE_CONFIG.couple.brideProfession,
      brideParents: cleanMultiline(couple.brideParents, 240) || DEFAULT_SITE_CONFIG.couple.brideParents,
    },
    hero: {
      dayLabel,
      dateLabel,
      cityLabel,
      countdownNote: cleanText(hero.countdownNote, 220) || DEFAULT_SITE_CONFIG.hero.countdownNote,
      countdownExpiredNote: cleanText(hero.countdownExpiredNote, 220) || DEFAULT_SITE_CONFIG.hero.countdownExpiredNote,
      countdownDateIso: cleanText(hero.countdownDateIso, 40) || DEFAULT_SITE_CONFIG.hero.countdownDateIso,
    },
    events: {
      akadDate: cleanText(events.akadDate, 100) || DEFAULT_SITE_CONFIG.events.akadDate,
      akadTime: cleanText(events.akadTime, 100) || DEFAULT_SITE_CONFIG.events.akadTime,
      akadLocation: cleanMultiline(events.akadLocation, 220) || DEFAULT_SITE_CONFIG.events.akadLocation,
      akadDresscode: cleanText(events.akadDresscode, 120) || DEFAULT_SITE_CONFIG.events.akadDresscode,
      resepsiDate: cleanText(events.resepsiDate, 100) || DEFAULT_SITE_CONFIG.events.resepsiDate,
      resepsiTime: cleanText(events.resepsiTime, 100) || DEFAULT_SITE_CONFIG.events.resepsiTime,
      resepsiLocation: cleanMultiline(events.resepsiLocation, 220) || DEFAULT_SITE_CONFIG.events.resepsiLocation,
      resepsiDresscode: cleanText(events.resepsiDresscode, 120) || DEFAULT_SITE_CONFIG.events.resepsiDresscode,
    },
    locations: {
      akadName: cleanText(locations.akadName, 100) || DEFAULT_SITE_CONFIG.locations.akadName,
      akadAddress: cleanMultiline(locations.akadAddress, 260) || DEFAULT_SITE_CONFIG.locations.akadAddress,
      akadMapUrl: cleanUrl(locations.akadMapUrl) || DEFAULT_SITE_CONFIG.locations.akadMapUrl,
      resepsiName: cleanText(locations.resepsiName, 100) || DEFAULT_SITE_CONFIG.locations.resepsiName,
      resepsiAddress: cleanMultiline(locations.resepsiAddress, 260) || DEFAULT_SITE_CONFIG.locations.resepsiAddress,
      resepsiMapUrl: cleanUrl(locations.resepsiMapUrl) || DEFAULT_SITE_CONFIG.locations.resepsiMapUrl,
    },
    gifts: {
      account1Bank: cleanText(gifts.account1Bank, 80) || DEFAULT_SITE_CONFIG.gifts.account1Bank,
      account1Name: cleanText(gifts.account1Name, 100) || groomName,
      account1Number: cleanText(gifts.account1Number, 60) || DEFAULT_SITE_CONFIG.gifts.account1Number,
      account1CopyValue: cleanText(gifts.account1CopyValue, 80) || DEFAULT_SITE_CONFIG.gifts.account1CopyValue,
      account2Bank: cleanText(gifts.account2Bank, 80) || DEFAULT_SITE_CONFIG.gifts.account2Bank,
      account2Name: cleanText(gifts.account2Name, 100) || brideName,
      account2Number: cleanText(gifts.account2Number, 60) || DEFAULT_SITE_CONFIG.gifts.account2Number,
      account2CopyValue: cleanText(gifts.account2CopyValue, 80) || DEFAULT_SITE_CONFIG.gifts.account2CopyValue,
    },
    branding: {
      pageTitle: cleanText(branding.pageTitle, 120) || `Undangan Pernikahan | ${groomShortName} & ${brideShortName}`,
      metaDescription: cleanText(branding.metaDescription, 220) || `Undangan Pernikahan ${groomName} & ${brideName} — ${dateLabel}`,
      ogTitle: cleanText(branding.ogTitle, 120) || `Undangan Pernikahan — ${groomShortName} & ${brideShortName}`,
      ogDescription: cleanText(branding.ogDescription, 220) || DEFAULT_SITE_CONFIG.branding.ogDescription,
      heroDateAriaLabel: cleanText(branding.heroDateAriaLabel, 140) || `Tanggal pernikahan: ${dayLabel}, ${dateLabel}`,
      loaderCloneCommand: cleanText(branding.loaderCloneCommand, 220) || DEFAULT_SITE_CONFIG.branding.loaderCloneCommand,
      codeGroomName: cleanText(branding.codeGroomName, 60) || groomShortName,
      codeBrideName: cleanText(branding.codeBrideName, 60) || brideShortName,
      giftAccountName1: cleanText(branding.giftAccountName1, 100) || groomName,
      giftAccountName2: cleanText(branding.giftAccountName2, 100) || brideName,
      closingGroomName: cleanText(branding.closingGroomName, 100) || groomName,
      closingBrideName: cleanText(branding.closingBrideName, 100) || brideName,
      footerBranding: cleanText(branding.footerBranding, 140) || `${groomShortName} & ${brideShortName} Wedding`,
    }
  };
}

async function getSiteConfig() {
  const row = await db.get('SELECT config_json AS configJson FROM site_config WHERE id = 1');
  if (!row || !row.configJson) return DEFAULT_SITE_CONFIG;
  try {
    const parsed = JSON.parse(row.configJson);
    return normalizeSiteConfig(parsed);
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

async function saveSiteConfig(config) {
  await db.run(
    `UPDATE site_config
     SET config_json = ?, updated_at = ?
     WHERE id = 1`,
    [JSON.stringify(config), new Date().toISOString()]
  );
}

async function migrateJsonToSqlite() {
  try {
    const raw = await fs.readFile(RSVP_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [];
    if (items.length === 0) return;

    await db.exec('BEGIN TRANSACTION');
    for (const item of items) {
      const entry = normalizeLegacyItem(item);
      await db.run(
        `INSERT OR IGNORE INTO rsvps (id, name, attend, guests, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [entry.id, entry.name, entry.attend, entry.guests, entry.message, entry.createdAt]
      );
    }
    await db.exec('COMMIT');
  } catch (err) {
    // Ignore when JSON legacy storage does not exist or is invalid.
    if (String(err && err.code) !== 'ENOENT') {
      console.warn('Lewati migrasi JSON ke SQLite:', err.message);
    }
  }
}

function normalizeLegacyItem(item) {
  const randomId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  return {
    id: String(item?.id || randomId),
    name: String(item?.name || 'Tamu').trim().slice(0, 80),
    attend: item?.attend === 'tidak' ? 'tidak' : 'hadir',
    guests: Math.max(1, Math.min(10, Number(item?.guests || 1) | 0)),
    message: String(item?.message || '').slice(0, 500),
    createdAt: new Date(item?.createdAt || item?.time || Date.now()).toISOString()
  };
}

async function readRsvps(limit = 100) {
  const max = Math.max(1, Math.min(1000, Number(limit) || 100));
  return db.all(
    `SELECT id, name, attend, guests, message, created_at AS createdAt
     FROM rsvps
     ORDER BY created_at DESC
     LIMIT ?`,
    [max]
  );
}

async function writeRsvp(entry) {
  await db.run(
    `INSERT INTO rsvps (id, name, attend, guests, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.name, entry.attend, entry.guests, entry.message, entry.createdAt]
  );
}

async function hasDuplicateRecent(payload) {
  const cutoff = new Date(Date.now() - RSVP_DUPLICATE_COOLDOWN_MS).toISOString();
  const row = await db.get(
    `SELECT COUNT(1) AS total
     FROM rsvps
     WHERE LOWER(TRIM(name)) = LOWER(?)
       AND attend = ?
       AND guests = ?
       AND TRIM(message) = ?
       AND created_at >= ?`,
    [payload.name, payload.attend, payload.guests, payload.message, cutoff]
  );
  return Number(row?.total || 0) > 0;
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRsvpCsv(items) {
  const header = ['id', 'name', 'attend', 'guests', 'message', 'createdAt'];
  const lines = [header.join(',')];
  for (const item of items) {
    lines.push([
      csvEscape(item.id),
      csvEscape(item.name),
      csvEscape(item.attend),
      csvEscape(item.guests),
      csvEscape(item.message),
      csvEscape(item.createdAt),
    ].join(','));
  }
  return lines.join('\n');
}

function validatePayload(payload) {
  const name = String(payload?.name || '').trim();
  const attend = String(payload?.attend || '').trim();
  const guests = Number(payload?.guests || 1);
  const message = String(payload?.message || '').trim();

  if (!name || name.length < 2 || name.length > 80) {
    return { ok: false, error: 'Nama harus diisi (2-80 karakter).' };
  }

  if (attend !== 'hadir' && attend !== 'tidak') {
    return { ok: false, error: 'Status kehadiran tidak valid.' };
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
    return { ok: false, error: 'Jumlah tamu harus 1-10.' };
  }

  if (message.length > 500) {
    return { ok: false, error: 'Pesan maksimal 500 karakter.' };
  }

  return {
    ok: true,
    value: { name, attend, guests, message }
  };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(clientIp) {
  const now = Date.now();
  const requests = rsvpRequestLog.get(clientIp) || [];
  const recent = requests.filter((ts) => now - ts < RSVP_WINDOW_MS);

  if (recent.length >= RSVP_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((RSVP_WINDOW_MS - (now - recent[0])) / 1000)
    };
  }

  recent.push(now);
  rsvpRequestLog.set(clientIp, recent);
  return { allowed: true };
}

function safeEqualText(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function parseBasicAuth(authorization) {
  if (!authorization || typeof authorization !== 'string') return null;
  const [scheme, encoded] = authorization.split(' ');
  if (!scheme || !encoded || scheme.toLowerCase() !== 'basic') return null;

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep === -1) return null;

    return {
      username: decoded.slice(0, sep),
      password: decoded.slice(sep + 1)
    };
  } catch {
    return null;
  }
}

function parseBearerAuth(authorization) {
  if (!authorization || typeof authorization !== 'string') return null;
  const [scheme, token] = authorization.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

function isValidAdminBasic(authorization) {
  const auth = parseBasicAuth(authorization);
  const validUser = auth && safeEqualText(auth.username, ADMIN_USER);
  const validPass = auth && safeEqualText(auth.password, ADMIN_PASS);
  return Boolean(validUser && validPass);
}

function isValidAdminBearer(authorization) {
  if (!ADMIN_API_TOKEN) return false;
  const token = parseBearerAuth(authorization);
  if (!token) return false;
  return safeEqualText(token, ADMIN_API_TOKEN);
}

function requireAdminAuth(req, res, next) {
  if (!isValidAdminBasic(req.headers.authorization)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="RSVP Admin", charset="UTF-8"');
    return res.status(401).send('Unauthorized');
  }

  return next();
}

function requireAdminApiAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (isValidAdminBearer(authorization) || isValidAdminBasic(authorization)) {
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized admin API. Gunakan Bearer token atau Basic Auth.'
  });
}

app.use('/admin', requireAdminAuth);
app.use('/api/admin', requireAdminApiAuth);

app.get('/api/rsvp', async (_req, res) => {
  const items = await readRsvps(100);
  res.json({ data: items });
});

app.get('/api/config', async (_req, res) => {
  const config = await getSiteConfig();
  res.json({ data: config });
});

app.get('/api/admin/rsvps', async (req, res) => {
  const requestedLimit = Number(req.query.limit || 500);
  const items = await readRsvps(requestedLimit);
  res.json({ data: items });
});

app.get('/api/admin/config', async (_req, res) => {
  const config = await getSiteConfig();
  res.json({ data: config });
});

app.put('/api/admin/config', async (req, res) => {
  const normalized = normalizeSiteConfig(req.body);
  await saveSiteConfig(normalized);
  res.json({ message: 'Konfigurasi undangan tersimpan.', data: normalized });
});

app.get('/api/admin/rsvps.csv', async (_req, res) => {
  const items = await readRsvps(5000);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rsvps.csv"');
  res.status(200).send(toRsvpCsv(items));
});

app.post('/api/rsvp', async (req, res) => {
  const clientIp = getClientIp(req);
  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    res.set('Retry-After', String(rate.retryAfterSec));
    return res.status(429).json({
      error: 'Terlalu banyak request RSVP. Coba lagi sebentar.'
    });
  }

  const validation = validatePayload(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  if (await hasDuplicateRecent(validation.value)) {
    return res.status(409).json({
      error: 'RSVP serupa sudah terkirim baru-baru ini.'
    });
  }

  const entry = {
    id: crypto.randomUUID(),
    ...validation.value,
    createdAt: new Date().toISOString()
  };

  await writeRsvp(entry);

  return res.status(201).json({ message: 'RSVP tersimpan', data: entry });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

ensureStorage()
  .then(() => {
    if (ADMIN_USER === 'admin' && ADMIN_PASS === 'change-me') {
      console.warn('Peringatan: gunakan ADMIN_USER dan ADMIN_PASS agar akses admin lebih aman.');
    }

    if (!ADMIN_API_TOKEN) {
      console.warn('Info: ADMIN_API_TOKEN belum di-set. API admin saat ini hanya bisa diakses via Basic Auth.');
    }

    app.listen(PORT, () => {
      console.log(`Server jalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Gagal menyiapkan storage RSVP:', err);
    process.exit(1);
  });
