/**
 * THE FREE VAULT IS BACK (Tom, 2026-11-01: "a RETURNS feeling to the free vault - make it so users believe it was gone
 * for a while and returned. DS FREE VAULT IS BACK, to give users joy").
 *
 * True to what happened: the Free Vault's downloads came down on 2026-10-29 while every tool was rebuilt for v3.2,
 * and it reopened on the v3.2 relaunch with a new tool in it. While RETURN is on, the site says so in four places,
 * all quiet and typographic (no badges, glows or pop-ups): one line above the header (dismissable, hidden on the Free
 * Vault page itself), the Free Vault page's opening, the Free Vault card and row on the home page, and the members'
 * Free Vault. After `until` it switches itself off and the Free Vault simply reads as the Free Vault again.
 *
 * TOM: to keep it on longer, move `until`. To turn it off now, set `on: false`.
 * Which tools wear "New" is content/catalog/site.json ("markNew").
 */
import CATALOG from "./catalog/site.json";
import { FREE_PRODUCTS, listOf } from "./vaults";

export const RETURN = {
  on: true,
  /** The day it reopened: the v3.2 relaunch. */
  reopened: "2026-11-01",
  /** The "is back" framing retires itself on this day. */
  until: "2026-12-15",
  /** Remembers a visitor who closed the line above the header (one key per return, so a later one shows again). */
  key: "ds-return-2026-11",
} as const;

const MARK = new Set<string>((CATALOG as { markNew?: string[] }).markNew ?? []);
/** Does this tool wear "New" on the shelves and in the vault? */
export const isMarkedNew = (slug: string) => MARK.has(slug);

/** Is the return framing on right now? Read per request, so it switches off on its own. */
export const returnOn = (now = Date.now()) => RETURN.on && now < Date.parse(`${RETURN.until}T00:00:00-05:00`);

/** "1 November 2026" */
export const REOPENED = new Date(`${RETURN.reopened}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** The free tools that are new with the return, and the ones that came back. */
export const FRESH = FREE_PRODUCTS.filter((p) => MARK.has(p.slug));
export const BACK = FREE_PRODUCTS.filter((p) => !MARK.has(p.slug));
/** "DS HTF PO3" / "DS A and DS B" - empty when nothing is new. */
export const FRESH_NAMES = listOf(FRESH.map((p) => p.name));
