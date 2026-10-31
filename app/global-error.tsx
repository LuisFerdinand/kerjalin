"use client";

/**
 * Penangkap galat terakhir bila layout utama sendiri gagal dirender. Memakai gaya inline karena
 * CSS situs bisa saja belum termuat pada keadaan ini.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#082052", background: "#fff" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 28, margin: "0 0 8px" }}>Terjadi kesalahan</h1>
            <p style={{ margin: "0 0 20px", color: "#4a5778", lineHeight: 1.6 }}>
              Maaf, situs belum bisa dimuat. Coba lagi sebentar lagi.
              {error.digest ? ` Kode: ${error.digest}` : ""}
            </p>
            <button
              onClick={() => retry()}
              style={{ background: "#082052", color: "#fff", border: 0, borderRadius: 12, padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
            >
              Coba lagi
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
