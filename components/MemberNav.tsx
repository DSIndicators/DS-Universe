"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The members area's own menu: where you are, and which vault is open. */
export function MemberNav({ first, email, essentials }: { first: string; email: string; essentials: boolean }) {
  const path = usePathname();
  const items = [
    { href: "/members", label: "Overview" },
    { href: "/members/essentials", label: "Essentials Vault", state: essentials ? "Open" : "Locked", open: essentials },
    { href: "/members/free-vault", label: "Free Vault", state: "Open", open: true },
    { href: "/members/account", label: "Account" },
  ];
  return (
    <nav className="mem-nav" aria-label="Your vault">
      <div className="mem-who">
        <p className="d4">{first}</p>
        <p className="tiny" style={{ wordBreak: "break-all" }}>{email}</p>
      </div>
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={path === i.href ? "page" : undefined}>
          <span>{i.label}</span>
          {i.state && <span className={`state${i.open ? " state-open" : ""}`}>{i.state}</span>}
        </Link>
      ))}
    </nav>
  );
}
