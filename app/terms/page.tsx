import Link from "next/link";

export const metadata = { title: "Ketentuan Layanan" };

export default function TermsPage() {
  return (
    <div className="prose prose-sm mx-auto max-w-2xl dark:prose-invert">
      <h1>Ketentuan Layanan</h1>
      <p className="text-muted-foreground">Terakhir diperbarui: 10 September 2026</p>

      <p>
        Dengan masuk dan menggunakan RnB (&quot;layanan&quot;), kamu setuju dengan
        ketentuan di bawah ini. Kalau tidak setuju, jangan gunakan layanan.
      </p>

      <h2>1. Akun</h2>
      <ul>
        <li>Login memakai akun Discord. Kamu bertanggung jawab atas aktivitas di akunmu.</li>
        <li>Satu orang, satu akun. Dilarang membuat akun untuk menghindari sanksi.</li>
        <li>Layanan ini untuk pengguna berusia 13 tahun ke atas.</li>
      </ul>

      <h2>2. Perilaku</h2>
      <p>Kamu dilarang:</p>
      <ul>
        <li>Memposting konten ilegal, kekerasan, pelecehan, ujaran kebencian, atau seksual eksplisit.</li>
        <li>Spam, penipuan, atau menjual barang/jasa ilegal di Pasar.</li>
        <li>Menyalahgunakan fitur (mengganggu panggilan, merusak halaman wiki, dsb).</li>
        <li>Mengakses sistem tanpa izin atau membebani infrastruktur secara sengaja.</li>
      </ul>

      <h2>3. Konten kamu</h2>
      <ul>
        <li>Kamu tetap pemilik konten yang kamu buat.</li>
        <li>
          Kamu memberi RnB izin menyimpan dan menampilkan kontenmu selama
          diperlukan untuk menjalankan layanan.
        </li>
        <li>
          Konten wiki bersifat kolaboratif — pengguna lain dapat menyuntingnya.
        </li>
      </ul>

      <h2>4. Moderasi</h2>
      <p>
        Moderator dapat menghapus konten, membisukan, atau memblokir akun
        (sementara atau permanen) yang melanggar ketentuan ini. Kamu bisa
        mengajukan banding lewat halaman akun yang diblokir.
      </p>

      <h2>5. Pasar (Marketplace)</h2>
      <p>
        RnB hanya menyediakan tempat memasang iklan. Semua transaksi dan
        komunikasi terjadi langsung antar pengguna. RnB bukan pihak dalam
        transaksi dan tidak bertanggung jawab atas barang, pembayaran, atau
        sengketa. Berhati-hatilah.
      </p>

      <h2>6. Tanpa jaminan</h2>
      <p>
        Layanan disediakan &quot;apa adanya&quot;. Kami tidak menjamin layanan
        bebas gangguan atau error, dan tidak bertanggung jawab atas kehilangan
        data atau kerugian yang timbul dari penggunaan layanan.
      </p>

      <h2>7. Perubahan &amp; penghentian</h2>
      <p>
        Kami dapat mengubah atau menghentikan layanan (atau fitur tertentu) kapan
        saja. Ketentuan ini bisa diperbarui; perubahan berlaku saat dipublikasikan.
      </p>

      <h2>8. Menghapus akun</h2>
      <p>
        Kamu bisa menghapus akun kapan saja dari <Link href="/settings">Pengaturan</Link>.
        Lihat <Link href="/privacy">Kebijakan Privasi</Link> untuk detail data.
      </p>

      <p>
        <Link href="/">← Kembali</Link>
      </p>
    </div>
  );
}
