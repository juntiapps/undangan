# undangan

Website undangan dengan backend RSVP menggunakan Node.js + Express + SQLite.

## Menjalankan project

1. Install dependency:

```bash
npm install
```

2. Jalankan server:

```bash
npm start
```

Catatan: server otomatis membaca file .env saat startup.

3. Buka di browser:

```text
http://localhost:3000
```

Panel admin:

```text
http://localhost:3000/admin
```

Di panel admin, sekarang Anda bisa mengubah konten undangan secara dinamis:

- Data pasangan
- Jadwal akad/resepsi
- Lokasi, alamat, dan link Google Maps
- Tanggal countdown

## Autentikasi Admin

Halaman admin dilindungi Basic Auth:

- `GET /admin`

Endpoint API admin mendukung 2 mode autentikasi:

- Bearer Token (direkomendasikan untuk script/automation)
- Basic Auth (kompatibilitas/manual access)

Endpoint API admin:

- `GET /api/admin/rsvps`
- `GET /api/admin/rsvps.csv`
- `GET /api/admin/config`
- `PUT /api/admin/config`

Set kredensial lewat environment variable:

- `ADMIN_USER`
- `ADMIN_PASS`
- `ADMIN_API_TOKEN` (opsional, untuk Bearer)

Contoh cepat di macOS/Linux:

```bash
ADMIN_USER=myadmin ADMIN_PASS=mysecret ADMIN_API_TOKEN='token-rahasia-panjang' npm start
```

Contoh akses API admin dengan Bearer token:

```bash
curl -H 'Authorization: Bearer token-rahasia-panjang' \
	http://localhost:3000/api/admin/rsvps
```

Atau buat file `.env` dari `.env.example` lalu export variabelnya sesuai kebutuhan shell Anda.

Catatan:

- Jika tidak di-set, default fallback adalah `admin` / `change-me`.
- Sangat disarankan mengganti default sebelum dipakai di server publik.
- Jika `ADMIN_API_TOKEN` tidak di-set, mode Bearer nonaktif dan API admin hanya menerima Basic Auth.

## Endpoint RSVP

- `GET /api/rsvp` mengambil daftar RSVP terbaru untuk halaman undangan.
- `GET /api/config` mengambil konfigurasi konten undangan untuk halaman publik.
- `POST /api/rsvp` menyimpan RSVP baru.
- `GET /api/admin/rsvps` mengambil data RSVP untuk panel admin.
- `GET /api/admin/rsvps.csv` export RSVP dalam format CSV.

## Penyimpanan SQLite

- Data RSVP sekarang disimpan di `data/rsvps.db`.
- Saat startup, server otomatis migrasi data lama dari `data/rsvps.json` jika file tersebut ada.
- Setelah migrasi, backend tetap memakai SQLite sebagai sumber data utama.

## Anti-spam RSVP

Backend sudah dilengkapi proteksi sederhana:

- Rate limit per IP untuk `POST /api/rsvp`.
- Cegah submit duplikat dalam periode cooldown.

Konfigurasi opsional via environment variable:

- `RSVP_WINDOW_MS` (default `60000`) untuk jendela rate limit.
- `RSVP_MAX_REQUESTS` (default `3`) jumlah request maksimal per jendela.
- `RSVP_DUPLICATE_COOLDOWN_MS` (default `300000`) blokir kirim data RSVP identik.

Respon yang mungkin:

- `201` RSVP tersimpan.
- `409` RSVP duplikat baru-baru ini.
- `429` terlalu banyak request.

Contoh payload `POST /api/rsvp`:

```json
{
	"name": "Nama Tamu",
	"attend": "hadir",
	"guests": 2,
	"message": "Selamat menempuh hidup baru"
}
```