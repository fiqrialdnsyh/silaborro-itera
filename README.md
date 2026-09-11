# SILABORRO ITERA

SILABORRO ITERA adalah sebuah platform sistem informasi laboratorium yang dikembangkan untuk mendukung manajemen dan operasional laboratorium di Institut Teknologi Sumatera (ITERA). Proyek ini dirancang untuk memudahkan mahasiswa, dosen, dan staf administrasi dalam melakukan peminjaman alat, reservasi ruangan, serta mengelola inventaris laboratorium secara efisien.

## Fitur Utama
- **Manajemen Peminjaman:** Sistem otomatis untuk pengajuan, persetujuan, dan pengembalian alat atau ruangan laboratorium.
- **Katalog Inventaris:** Daftar lengkap peralatan dan fasilitas laboratorium yang tersedia beserta status ketersediaannya secara *real-time*.
- **Dasbor Pengguna:** Antarmuka khusus untuk mahasiswa, dosen, dan admin dengan hak akses yang berbeda sesuai dengan perannya.
- **Sistem Notifikasi:** Pemberitahuan terkait status peminjaman, jadwal pengembalian, dan pengumuman penting lainnya.
- **Pelaporan dan Analitik:** Pembuatan laporan penggunaan laboratorium dan alat untuk keperluan administrasi dan evaluasi.

## Teknologi yang Digunakan
Proyek ini dibangun menggunakan *stack* teknologi modern untuk memastikan kinerja yang optimal dan pengalaman pengguna yang responsif:
- **Framework Frontend:** Next.js (berdasarkan konfigurasi `next.config.mjs`)
- **Bahasa Pemrograman:** JavaScript/TypeScript (diindikasikan dari `jsconfig.json` dan struktur proyek Next.js)
- **Styling:** PostCSS (berdasarkan `postcss.config.mjs`), kemungkinan dikombinasikan dengan Tailwind CSS atau CSS Modules.
- **Manajemen Paket:** npm (diindikasikan oleh `package.json` dan `package-lock.json`)
- **Linting & Formatting:** ESLint (berdasarkan `eslint.config.mjs`)
- **CI/CD:** GitHub Actions (terdapat alur kerja `.github/workflows/update-readme.yml`)

## Prasyarat Instalasi
Sebelum Anda dapat menjalankan proyek ini di lingkungan lokal Anda, pastikan perangkat lunak berikut telah terinstal:
1.  **Node.js**: Versi terbaru atau versi LTS yang direkomendasikan (misalnya Node.js 18.x atau 20.x).
2.  **npm** atau **Yarn**: Sebagai manajer paket Node.js.
3.  **Git**: Untuk melakukan kloning repositori.
4.  **Teks Editor**: Visual Studio Code atau IDE pilihan Anda.

## Susunan Project
Struktur dasar dari repositori proyek ini adalah sebagai berikut:
- `.github/workflows/`: Berisi skrip otomatisasi GitHub Actions (misal: `update-readme.yml`).
- `public/`: Direktori untuk aset statis yang dapat diakses publik.
  - `Favicon.ico`, `RekayasaKeolahragaan.png`, `avatar.jpg`: Berbagai gambar dan ikon.
  - `berita/`: Gambar-gambar terkait berita atau pengumuman (`dibuka.png`, `webinar.png`).
  - `dosen/`: Direktori untuk menyimpan foto profil dosen (contoh: `Africo.jpg`).
- `package.json` & `package-lock.json`: File konfigurasi dependensi npm dan skrip proyek.
- `next.config.mjs`: File konfigurasi utama untuk Next.js.
- `eslint.config.mjs`: Konfigurasi untuk aturan *linting* ESLint.
- `postcss.config.mjs`: Konfigurasi pemrosesan CSS menggunakan PostCSS.
- `jsconfig.json`: Konfigurasi resolusi jalur (path resolution) untuk JavaScript.

## Contoh Penggunaan
Berikut adalah langkah-langkah untuk menjalankan aplikasi ini di komputer lokal Anda:

1.  **Kloning Repositori:**
    ```bash
    git clone [https://github.com/silaborro-itera/silaborro-itera.git](https://github.com/silaborro-itera/silaborro-itera.git)
    cd silaborro-itera
    ```

2.  **Instalasi Dependensi:**
    Jalankan perintah berikut untuk mengunduh semua paket yang dibutuhkan:
    ```bash
    npm install
    # atau jika menggunakan yarn
    yarn install
    ```

3.  **Menjalankan Development Server:**
    Mulai server pengembangan lokal:
    ```bash
    npm run dev
    # atau
    yarn dev
    ```

4.  **Akses Aplikasi:**
    Buka peramban web (browser) Anda dan akses alamat `http://localhost:3000`. Anda akan melihat antarmuka beranda SILABORRO ITERA. Dari sana, Anda dapat menjelajahi fitur-fitur seperti melihat daftar inventaris, mencoba membuat permintaan peminjaman simulasi, atau *login* menggunakan akun uji (jika disediakan).

## Kontribusi
Kami menyambut baik partisipasi dan kontribusi dari mahasiswa, dosen, maupun pengembang *open source* lainnya. Untuk berkontribusi pada proyek SILABORRO ITERA, ikuti langkah-langkah berikut:
1. Lakukan **Fork** pada repositori ini.
2. Buat branch fitur baru Anda (`git checkout -b fitur/NamaFitur`).
3. Lakukan perubahan pada kode dan simpan perubahan Anda (`git commit -m 'Menambahkan fitur XYZ'`).
4. Push ke branch Anda (`git push origin fitur/NamaFitur`).
5. Buat **Pull Request** baru ke repositori utama untuk ditinjau oleh pengelola.

Pastikan kode Anda mengikuti standar *linting* yang telah ditentukan di `eslint.config.mjs`.

## Lisensi
Proyek ini dilisensikan di bawah [MIT License](LICENSE).
