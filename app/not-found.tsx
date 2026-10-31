import Link from "next/link";

export default function NotFound() {
  return (
    <section className="hero">
      <div className="wrap stack" style={{ maxWidth: 640 }}>
        <p className="kicker">Not found</p>
        <h1 className="d1">This page is not in either vault.</h1>
        <p className="lead">It may have moved when the site was simplified. Everything is one click from here.</p>
        <div className="actions">
          <Link className="btn" href="/">Home</Link>
          <Link className="btn btn-line" href="/essentials">Essentials Vault</Link>
          <Link className="btn btn-line" href="/free-vault">Free Vault</Link>
        </div>
      </div>
    </section>
  );
}
