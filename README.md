# Kas OMK St. Carolus Houben — Paroki Nanga Mahap

Aplikasi statis pencatatan keuangan OMK. Bisa dipublikasikan gratis dengan GitHub Pages; sinkronisasi data menggunakan Supabase.

## Publikasi gratis melalui GitHub Pages
1. Buat repository **Public** baru di GitHub, misalnya `kas-omk-carolus-houben`.
2. Unggah semua isi folder ini ke **root** repository (pastikan `index.html` berada langsung di root, bukan di subfolder).
3. Buka repository **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**, branch `main`, folder `/(root)`, lalu **Save**.
5. Tunggu deploy selesai. URL biasanya berbentuk `https://USERNAME.github.io/NAMA-REPOSITORY/`.

## Aktifkan sinkronisasi Supabase
1. Di Supabase Dashboard, pilih **SQL Editor → New query**.
2. Salin isi `supabase-setup.sql`, lalu tekan **Run**.
3. Buka URL GitHub Pages aplikasi → **Pengaturan → Sinkronisasi Cloud**.
4. Buat satu akun untuk dipakai di laptop dan HP. Verifikasi email jika diminta.
5. Login pertama dari perangkat yang berisi transaksi sebenarnya. Tekan **Jadikan data perangkat ini sebagai data cloud** untuk menginisialisasi data.
6. Login di perangkat lain memakai akun yang sama. Data akan dimuat dari cloud dan tersinkron otomatis.

## Keamanan dan backup
- Aplikasi memakai Supabase `anon`/public key; tabel dilindungi Row Level Security dan setiap akun hanya dapat mengakses barisnya sendiri.
- Jangan menaruh atau membagikan `service_role` key maupun password database.
- Backup JSON aplikasi tetap disarankan secara berkala.
