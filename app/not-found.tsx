import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-32 text-center">
      <p className="label">404</p>
      <h1 className="display-lg mt-5 text-ink">Nothing at this address.</h1>
      <p className="lede mx-auto mt-5 max-w-md">The page may have moved as the lineup changes.</p>
      <div className="mt-9 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Home</Link>
        <Link href="/products" className="btn-ghost">Products</Link>
      </div>
    </section>
  );
}
