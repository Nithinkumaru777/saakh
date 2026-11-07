import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="empty" style={{ minHeight: "100vh", display: "grid", placeContent: "center", gap: 16 }}>
      <h1 className="display-m">Page not found</h1>
      <p style={{ margin: 0 }}>This page does not exist or has moved.</p>
      <div>
        <Link className="btn btn-primary" href="/">Back to home</Link>
      </div>
    </main>
  );
}
