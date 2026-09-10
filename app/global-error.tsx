"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Aplikasi bermasalah</h1>
        <p style={{ color: "#666", fontSize: 14 }}>
          Terjadi kesalahan fatal. Muat ulang halaman.
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: 12, color: "#999" }}>
            {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  );
}
