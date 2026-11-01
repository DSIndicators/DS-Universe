"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Arrow } from "./Tick";

/**
 * One quiet line above the header while the Free Vault return is on (content/returns.ts): words on the page's own
 * ground, a hairline under them, one teal link. Closing it is remembered on this browser (the class is set before
 * first paint in app/layout.tsx, so it never flashes back). Not shown on the Free Vault pages themselves - that is
 * where it leads.
 */
export function ReturnStrip({ count, fresh, freshCount, storageKey }: { count: number; fresh: string; freshCount: number; storageKey: string }) {
  const path = usePathname();
  if (path === "/free-vault" || path.startsWith("/free-vault/") || path.startsWith("/members/free-vault")) return null;
  const close = () => {
    document.documentElement.classList.add("ret-off");
    try {
      localStorage.setItem(storageKey, "closed");
    } catch {
      /* private mode: closed for this page only */
    }
  };
  return (
    <div className="ret" role="region" aria-label="The DS Free Vault is back">
      <div className="wrap ret-in">
        <p className="ret-text">
          <span className="ret-mark">Back</span>
          <span>The DS Free Vault is open again</span>
          <span className="ret-long">
            : {count} free tools, back after the v3.2 rebuild{fresh ? <>, and {freshCount === 1 ? "one" : freshCount} new: {fresh}</> : null}.
          </span>
          <span className="ret-short">.</span>
        </p>
        <Link className="ret-link" href="/free-vault">
          Open<span className="ret-long"> the Free Vault</span> <Arrow />
        </Link>
        <button className="ret-x" type="button" aria-label="Close this note" onClick={close}>
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  );
}
