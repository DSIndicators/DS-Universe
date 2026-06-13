"use client";

import { useEffect } from "react";

/**
 * Delegated handler for in-page anchor links (href="/#id" or "#id").
 * If the target section exists on the current page, smooth-scrolls to it and
 * keeps the URL clean (no "#id" appended). Links to other pages fall through
 * to normal navigation. Mounted once near the root.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const target = e.target as Element | null;
      const a = target?.closest("a");
      if (!a) return;

      const href = a.getAttribute("href") || "";
      const m = href.match(/^\/?#(.+)$/);
      if (!m) return;

      const id = m[1];
      const el =
        id === "top" ? document.body : document.getElementById(id);
      // Only intercept when the section is actually on this page.
      if (id !== "top" && !el) return;

      e.preventDefault();
      if (id === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        el!.scrollIntoView({ behavior: "smooth" });
      }
      // Keep the address bar clean — no "#id".
      history.replaceState(null, "", location.pathname + location.search);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
