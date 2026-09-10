import Link from "next/link";

export const metadata = { title: "Kebijakan Privasi" };

export default function PrivacyPage() {
  return (
    <div className="prose prose-sm mx-auto max-w-2xl dark:prose-invert">
      <h1>Kebijakan Privasi</h1>
      <p className="text-muted-foreground">Terakhir diperbarui: 10 September 2026</p>

      <h2>Data yang kami kumpulkan</h2>
      <ul>
        <li>
          <strong>Dari Discord saat login:</strong> ID Discord, username, nama
          tampilan, avatar, alamat email, dan daftar server Discord kamu (untuk
          fitur verifikasi keanggotaan bila diaktifkan admin).
        </li>
        <li>
          <strong>Yang kamu buat:</strong> postingan, thread, status, komentar,
          story, pesan langsung &amp; grup, iklan Pasar, suntingan wiki, dan file
          yang kamu unggah (gambar, video, audio, dokumen).
        </li>
        <li>
          <strong>Otomatis:</strong> waktu aktivitas terakhir, dan data teknis
          standar yang dicatat penyedia hosting kami (alamat IP, jenis peramban)
          untuk keamanan.
        </li>
        <li>
          <strong>Panggilan:</strong> data koneksi sementara (signaling)
          disimpan sebentar lalu dihapus. Audio/video panggilan bersifat
          peer-to-peer dan <em>tidak</em> melewati atau disimpan di server kami.
        </li>
      </ul>

      <h2>Cara kami memakainya</h2>
      <ul>
        <li>Menjalankan dan menampilkan layanan kepada kamu dan pengguna lain.</li>
        <li>Moderasi, keamanan, dan pencegahan penyalahgunaan.</li>
        <li>Mengirim notifikasi (di aplikasi, push, dan email bila kamu mengaktifkannya).</li>
      </ul>
      <p>Kami tidak menjual data kamu.</p>

      <h2>Pihak ketiga</h2>
      <p>Data diproses oleh layanan yang kami pakai untuk menjalankan aplikasi:</p>
      <ul>
        <li><strong>Vercel</strong> — hosting &amp; penyimpanan file.</li>
        <li><strong>Neon</strong> — database.</li>
        <li><strong>Discord</strong> — autentikasi &amp; notifikasi webhook.</li>
        <li><strong>GIPHY</strong> — pencarian GIF (kata kunci pencarian dikirim ke GIPHY).</li>
        <li><strong>Resend</strong> — pengiriman email (hanya bila fitur email aktif).</li>
      </ul>

      <h2>Penyimpanan</h2>
      <p>
        Data disimpan selama akunmu aktif. Story terhapus otomatis setelah 24
        jam. Data signaling panggilan dan indikator mengetik bersifat sementara.
      </p>

      <h2>Hak kamu</h2>
      <ul>
        <li>
          <strong>Ekspor:</strong> unduh salinan datamu dari{" "}
          <Link href="/settings">Pengaturan</Link>.
        </li>
        <li>
          <strong>Hapus:</strong> hapus akunmu dari Pengaturan. Akun, pesan
          pribadi, dan langgananmu akan dihapus. Konten publik (thread, balasan,
          status, iklan) akan dianonimkan atau dihapus.
        </li>
        <li>
          <strong>Koreksi:</strong> ubah profil kapan saja dari Pengaturan.
        </li>
      </ul>

      <h2>Kontak</h2>
      <p>Hubungi admin komunitas di server Discord RnB untuk pertanyaan privasi.</p>

      <p>
        <Link href="/">← Kembali</Link>
      </p>
    </div>
  );
}
