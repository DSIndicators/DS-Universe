/**
 * TEMPORARY — "Store Coming Soon" notice bar.
 *
 * The website is live but the store/checkout is NOT operational yet (per Tom).
 * This is a slim, fixed bar pinned to the very top of every page.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  TO REMOVE (single switch): set SHOW = false below — the bar disappears.
 *  To fully delete: remove <StoreBanner /> from app/layout.tsx, revert the
 *  Navbar's `top-9` back to `top-0`, and delete this file.
 * ─────────────────────────────────────────────────────────────────────────
 */

// Flip to false to hide the banner. (Bar is h-9 / 36px — the Navbar offset in
// components/Navbar.tsx, `top-9`, must match this height while SHOW is true.)
const SHOW = true;

export function StoreBanner() {
  if (!SHOW) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center border-b border-black/10 bg-gradient-to-r from-[#ff7a2f] via-[#ff9d52] to-[#ff7a2f] px-4 text-center shadow-[0_2px_18px_rgba(255,122,47,0.35)]"
    >
      <p className="whitespace-nowrap font-mono text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-space-black sm:text-[0.66rem]">
        <span aria-hidden="true">✦ </span>
        Store coming soon
        <span className="hidden sm:inline"> — checkout isn’t live yet</span>
      </p>
    </div>
  );
}
