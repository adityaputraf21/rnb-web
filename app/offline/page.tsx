export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl">📡</p>
      <h1 className="text-xl font-semibold">Kamu sedang offline</h1>
      <p className="text-sm text-muted-foreground">
        RnB butuh koneksi internet. Cek jaringan lalu coba lagi.
      </p>
    </div>
  );
}
