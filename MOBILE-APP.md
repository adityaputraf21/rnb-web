# Aplikasi mobile RnB

Web-nya sudah **PWA penuh** — bisa dipasang langsung tanpa app store:

## Cara pasang (pengguna)

**Android (Chrome):** buka https://rnb-web.vercel.app → muncul banner "Pasang aplikasi",
atau menu ⋮ → "Install app" / "Tambahkan ke layar utama".

**iPhone (Safari):** buka situs → tombol Share → "Add to Home Screen".

Setelah dipasang, jalan fullscreen seperti app biasa, dengan ikon sendiri,
notifikasi push, dan halaman offline.

---

## Bikin APK untuk Google Play Store (Android)

Pakai **PWABuilder** (gratis, berbasis web — tidak perlu Android Studio):

1. Buka https://www.pwabuilder.com
2. Masukkan `https://rnb-web.vercel.app` → **Start**
3. Tab **Android** → **Generate Package**
   - Package ID: `app.vercel.rnb_web.twa` (atau bebas, catat)
   - Pilih **"Signing key: Create new"** → PWABuilder kasih file `.keystore` + password. **SIMPAN baik-baik**, ini dipakai selamanya untuk update.
4. Download ZIP. Di dalamnya ada `assetlinks.json` dan sidik jari **SHA-256**.
5. Di Vercel → Settings → Environment Variables, tambahkan:
   ```
   ANDROID_PACKAGE_NAME = app.vercel.rnb_web.twa
   ANDROID_CERT_SHA256  = <SHA256 dari PWABuilder>
   ```
   lalu **redeploy**. Cek `https://rnb-web.vercel.app/.well-known/assetlinks.json`
   sudah berisi datanya (bukan `[]`).
6. Upload `.aab` ke [Google Play Console](https://play.google.com/console)
   (perlu akun developer, sekali bayar $25). Isi listing, screenshot, dsb.

Setelah `assetlinks.json` cocok, app buka fullscreen tanpa address bar Chrome.

---

## iOS App Store

Butuh:
- Mac dengan Xcode
- Akun Apple Developer ($99/tahun)
- Bungkus dengan **Capacitor** atau **PWABuilder → iOS** (menghasilkan project Xcode)

Lebih ribet dari Android. Untuk sekarang, "Add to Home Screen" di Safari sudah
memberi pengalaman mendekati native (termasuk push sejak iOS 16.4).

---

## Update aplikasi

- **PWA & TWA/Android:** otomatis. Setiap deploy web = app ikut terbarui
  (TWA cuma "jendela" ke situs). Tidak perlu upload ulang ke Play Store
  kecuali ganti ikon/nama/package.
- **iOS wrapper:** perlu build & submit ulang.
