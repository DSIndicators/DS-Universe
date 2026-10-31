"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ASK_LIMITS, HELP, isEmail } from "@/content/help";

/**
 * ESSENTIALS SITE, 2026-10-31: ported again unchanged in behaviour, with two changes - a product page is
 * /essentials/<slug> or /free-vault/<slug>, and the marker is a HORIZONTAL BAR at the bottom right (Tom:
 * "horizontal this time, not vertical. longer and noticeable but elegant"): the DS mark, HELP, a hairline,
 * one line saying what is inside, and an arrow, on solid teal with square corners. The notes below on
 * the flag describe the earlier marker.
 *
 * The Help marker and its panel (2026-10-02; ported to the white site
 * 2026-10-27: same behaviour line for line, restyled in the white + teal
 * system with plain classes, hp-* in app/globals.css, and the helmet mark
 * in place of the old badge). What it is and why it is not
 * "chat" is in content/help.ts; what the server does with a message is in
 * app/api/ask/route.ts. This file is how it looks and behaves.
 *
 * THE MARKER. Every chart our customers look at has one small flag pinned to
 * its right edge: the last-price marker on the price axis. The Help marker is
 * that flag — flush against the right edge of the window, notched on the left,
 * a mono label and one gold tick. It is not a round bubble with a speech icon,
 * which is what every site's chat widget is, and it takes 34px of height.
 *
 * THE PANEL. Two tabs in the label voice, like the store's Covers | Price list.
 *  · ANSWERS — on a product page, that product's own facts first (price,
 *    markets, platform, trial), then a search over the store's questions.
 *    When nothing matches, the words typed go into the message, so nobody
 *    types a question twice.
 *  · ASK US — an address and a question. It says who answers and when BEFORE
 *    the form, and after sending it shows the visitor their own message, where
 *    the reply will go, and nothing that pretends someone is typing.
 * On a desktop it is a 384px panel beside the page — the page stays readable
 * and usable behind it (it is not modal, and a click on the page does not
 * close it). On a phone — or any window too short for the panel, such as a
 * phone on its side — it is a sheet from the bottom with the page dimmed and
 * switched off behind it (inert), which IS modal and says so (aria-modal).
 *
 * NOBODY IS STRANDED. If the site cannot send (sending not switched on yet, the
 * mail server down, no connection), the message is kept and offered as an
 * email in the visitor's own mail app, with the address beside it to copy.
 *
 * BEHAVIOUR THAT IS EASY TO GET WRONG
 *  · Opening moves focus to the panel itself, not to a field: focusing a field
 *    would throw the keyboard up on a phone before anything has been read.
 *    Escape closes; closing returns focus to whatever opened it — the marker,
 *    or the button on the page (WAI-ARIA dialog). Wherever a control removes
 *    itself (Send, Ask another, the About tag) focus is moved, never dropped.
 *  · Fields are 16px on phones — below that iOS zooms the page on focus.
 *  · On a phone the sheet rides above the on-screen keyboard (visualViewport),
 *    so Send is never underneath it.
 *  · A draft survives page changes (this component lives in the layout) and a
 *    reload (sessionStorage, which may be unavailable — every use is guarded).
 *  · Links inside the sheet close it on a phone, so a tap never leaves the
 *    visitor under a sheet on a new page.
 *  · Nothing animates for visitors who ask for reduced motion.
 *  · The inside of the panel is not built until it is first opened, so a page
 *    nobody asks for help on carries the marker and the answers as data (about
 *    2.5 KB compressed), not a second copy of them as markup.
 *  · Other parts of the site open it with
 *      window.dispatchEvent(new CustomEvent("ds:help", { detail: { tab: "ask", text?: "…" } }))
 *  (`text` fills an empty question box: "Get notified" uses it.)
 */

export type HelpProduct = { name: string; price: string; runs: string; trial: string; trialHref: string };
type Faq = { q: string; a: string; link?: { href: string; label: string } };
type Tab = "answers" | "ask";
type Status = "idle" | "sending" | "sent" | "fallback" | "rate";

const DRAFT = "ds-help-draft";
/** When the panel is a sheet from the bottom instead of a panel beside the page:
 *  a narrow window, or a short one (a phone on its side). The same two numbers
 *  are in globals.css — keep them together. */
const SHEET = "(max-width: 639px), (max-height: 520px)";

export function HelpPanel({ faq, products, email: supportEmail, platform }: { faq: Faq[]; products: Record<string, HelpProduct>; email: string; platform: string }) {
  const pathname = usePathname() || "/";
  const id = useId();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false); // opened at least once: only then is the panel's inside built
  const [tab, setTab] = useState<Tab>("answers");
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [trap, setTrap] = useState(""); // the field people cannot see
  const [cleared, setCleared] = useState<string | null>(null); // "not about this product"
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});
  const [sent, setSent] = useState<{ email: string; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false); // the stored draft has been read
  const [sheet, setSheet] = useState(false); // laid out as a sheet (see SHEET)
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLButtonElement>(null);
  const sentBox = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null); // what had focus when it opened
  const askSince = useRef(0); // when the form was first on screen
  const restore = useRef(false); // return focus to the opener after closing

  const slug = useMemo(() => {
    // A product's page is under /essentials or, for a free one, /free-vault.
    const m = /^\/(?:essentials|free-vault)\/([a-z0-9-]+)\/?$/.exec(pathname);
    // hasOwn: /products/constructor is a 404 that still carries this layout.
    return m && Object.hasOwn(products, m[1]) ? m[1] : null;
  }, [pathname, products]);
  const about = slug && cleared !== slug ? slug : null;
  const product = slug ? products[slug] : null;

  /* --------------------------------------------------------- stepping aside
     On a phone the marker floats over the page at the right edge, and over an
     interactive chart it sits on the chart's own controls (DS Replay's speed
     switch and rail, 2026-10-10 mobile pass). Anything marked data-help-yield
     makes it step aside while it passes under the marker's spot; it returns
     the moment the page moves on. The spot is computed from the marker's
     resting place (its CSS bottom), never from where it is drawn, so sliding
     it away cannot flip the test. Phones only: from 640px it sits in the
     margin, clear of the content. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    let raf = 0;
    const check = () => {
      raf = 0;
      const m = marker.current;
      if (!m) return;
      let over = false;
      if (mq.matches) {
        const bottom = parseFloat(getComputedStyle(m).bottom) || 0;
        const zb = window.innerHeight - bottom, zt = zb - m.offsetHeight, zl = window.innerWidth - m.offsetWidth;
        for (const el of document.querySelectorAll<HTMLElement>("[data-help-yield]")) {
          const r = el.getBoundingClientRect();
          if (r.top < zb && r.bottom > zt && r.right > zl) { over = true; break; }
        }
      }
      if (over) m.dataset.yield = ""; else delete m.dataset.yield;
    };
    const ask = () => { if (!raf) raf = requestAnimationFrame(check); };
    ask();
    window.addEventListener("scroll", ask, { passive: true });
    window.addEventListener("resize", ask);
    mq.addEventListener("change", ask);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", ask);
      window.removeEventListener("resize", ask);
      mq.removeEventListener("change", ask);
    };
  }, [pathname]);

  /* ------------------------------------------------------------- the draft */
  useEffect(() => {
    try {
      const d = JSON.parse(sessionStorage.getItem(DRAFT) || "null");
      if (d && typeof d.email === "string" && typeof d.message === "string") {
        setEmail(d.email.slice(0, ASK_LIMITS.email));
        setMessage(d.message.slice(0, ASK_LIMITS.message));
      }
    } catch {
      /* no storage, or not ours: start empty */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    // Not before the stored draft has been read: the first run of this effect
    // sees two empty fields and would otherwise erase what the visitor left.
    if (!ready) return;
    try {
      if (email || message) sessionStorage.setItem(DRAFT, JSON.stringify({ email, message }));
      else sessionStorage.removeItem(DRAFT);
    } catch {
      /* private window, storage blocked: the draft simply lives in memory */
    }
  }, [email, message, ready]);

  /* -------------------------------------------------------- open and close */
  const show = useCallback((t?: Tab) => {
    const from = document.activeElement;
    // Remember who opened it (the marker, or a button on the page) — unless it
    // is already open, when the thing with focus is inside the panel itself.
    if (!panel.current?.contains(from)) opener.current = from instanceof HTMLElement && from !== document.body ? from : null;
    if (t) setTab(t);
    setSeen(true);
    setOpen(true);
    // Already open and asked for again (a page button): bring focus back in.
    panel.current?.focus({ preventScroll: true });
  }, []);
  const hide = useCallback(() => {
    restore.current = true;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (open) panel.current?.focus({ preventScroll: true });
    else if (restore.current) {
      restore.current = false;
      // Back to whatever opened it; the marker if that has left the page.
      const to = opener.current && opener.current.isConnected ? opener.current : marker.current;
      to?.focus({ preventScroll: true });
    }
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia(SHEET);
    const set = () => setSheet(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // A dialog on top of us (the picture viewer) owns Escape first.
      if (document.querySelector("dialog[open]")) return;
      // Beside the page the panel is not modal: Escape pressed while working in
      // the page (the phone menu, a field somewhere) is not ours to take.
      const at = document.activeElement;
      const ours = !at || at === document.body || at === marker.current || !!panel.current?.contains(at);
      if (ours || window.matchMedia(SHEET).matches) hide();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, hide]);

  // As a sheet it covers the page and the page is dimmed — so it IS modal there,
  // and the page behind is switched off for the keyboard and for screen readers
  // too (inert), not only for the eye. Beside the page nothing is switched off.
  useEffect(() => {
    if (!open || !sheet) return;
    const mine = root.current;
    const others = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== mine && !el.hasAttribute("inert"));
    for (const el of others) el.setAttribute("inert", "");
    return () => {
      for (const el of others) el.removeAttribute("inert");
    };
  }, [open, sheet]);

  // A phone's keyboard slides over anything pinned to the bottom of the window
  // — which is exactly where the sheet is. The visual viewport says how much of
  // the window is still in view, so the sheet sits on top of the keyboard and
  // is never taller than what can be seen. (CSS reads the two values only in
  // the sheet layout; see .help-panel in globals.css.)
  useEffect(() => {
    const vv = window.visualViewport;
    const el = panel.current;
    if (!open || !vv || !el) return;
    const fit = () => {
      const covered = Math.max(0, document.documentElement.clientHeight - vv.height - vv.offsetTop);
      el.style.setProperty("--help-kb", `${Math.round(covered)}px`);
      el.style.setProperty("--help-vh", `${Math.round(vv.height)}px`);
    };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => {
      vv.removeEventListener("resize", fit);
      vv.removeEventListener("scroll", fit);
    };
  }, [open]);

  // Other parts of the site can open it (the Contact page, the store FAQ).
  useEffect(() => {
    const onAsk = (e: Event) => {
      const d = (e as CustomEvent<{ tab?: Tab; text?: string }>).detail;
      // "Get notified" (2026-10-29) arrives with its request already written; a
      // draft the visitor has started is never overwritten.
      if (d?.text) setMessage((m) => (m.trim() ? m : d.text!.slice(0, ASK_LIMITS.message)));
      show(d?.tab === "ask" ? "ask" : "answers");
    };
    window.addEventListener("ds:help", onAsk);
    return () => window.removeEventListener("ds:help", onAsk);
  }, [show]);

  useEffect(() => {
    if (open && tab === "ask" && !askSince.current) askSince.current = performance.now();
  }, [open, tab]);

  /** As a sheet the panel covers the page: a link inside it closes it. Focus is
   *  left to the browser, which moves it to where the link went. */
  const followed = () => {
    if (window.matchMedia(SHEET).matches) setOpen(false);
  };

  // After sending, focus goes to the confirmation: the form that held it is
  // gone, and this is also what makes a screen reader read "Sent".
  useEffect(() => {
    if (status === "sent") sentBox.current?.focus({ preventScroll: true });
  }, [status]);

  /* --------------------------------------------------------------- answers */
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length ? faq.filter((f) => words.every((w) => `${f.q} ${f.a}`.toLowerCase().includes(w))) : faq;

  const askInstead = () => {
    if (query.trim() && !message.trim()) setMessage(query.trim().slice(0, ASK_LIMITS.message));
    setTab("ask");
    // The button just pressed is in the pane that is now hidden.
    document.getElementById(`${id}-tab-ask`)?.focus();
  };

  /* ------------------------------------------------------------------- ask */
  const subject = about ? `A question about ${products[about].name}` : "A question";
  const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message.trim()}\n\n(Sent from ${pathname})`)}`;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const em = email.trim();
    const msg = message.trim();
    const bad: typeof errors = {};
    if (!isEmail(em)) bad.email = HELP.ask.needEmail;
    if (!msg) bad.message = HELP.ask.needMessage;
    else if (msg.length > ASK_LIMITS.message) bad.message = HELP.ask.tooLong;
    setErrors(bad);
    if (bad.email || bad.message) {
      document.getElementById(bad.email ? `${id}-email` : `${id}-message`)?.focus();
      return;
    }
    setStatus("sending");
    // A connection that hangs must end in the fallback, not in "Sending" forever.
    const abort = new AbortController();
    const timer = window.setTimeout(() => abort.abort(), 45_000);
    try {
      // The server drops anything sent sooner than a person could have typed it
      // (app/api/ask/route.ts) and answers "ok" — which is right for a bot and
      // would be a silent loss for a person whose draft was restored and who
      // pressed Send at once. So a fast Send waits here; it is never dropped.
      const early = 1700 - (performance.now() - askSince.current);
      if (early > 0) await new Promise((r) => window.setTimeout(r, early));
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: em, message: msg, page: pathname, product: about ?? "", hp: trap, elapsed: Math.round(performance.now() - askSince.current) }),
        signal: abort.signal,
      });
      // "Sent" only on the route's own word for it. A bare 200 is not enough: a
      // host that redirected the POST would answer 200 from the status check.
      const j = (await res.json().catch(() => null)) as { ok?: boolean; field?: string } | null;
      if (res.ok && j?.ok === true) {
        setSent({ email: em, message: msg });
        setMessage("");
        setStatus("sent");
      } else if (res.status === 400) {
        setErrors(j?.field === "email" ? { email: HELP.ask.needEmail } : { message: msg.length > ASK_LIMITS.message ? HELP.ask.tooLong : HELP.ask.needMessage });
        setStatus("idle");
      } else if (res.status === 429) {
        setStatus("rate");
      } else {
        setStatus("fallback");
      }
    } catch {
      setStatus("fallback");
    } finally {
      window.clearTimeout(timer);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no clipboard permission: the address is on screen to select */
    }
  };

  const tabKeys = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next: Tab = tab === "answers" ? "ask" : "answers";
    setTab(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  // 16px wherever there is no mouse: below that iOS zooms the page on focus.
  const box = "hp-box";
  const field = "hp-box hp-field";
  const sending = status === "sending";
  const over = message.length > ASK_LIMITS.message;

  return (
    <div ref={root} className="hp-root">
      {/* ------------------------------------------------------------ marker */}
      <button
        ref={marker}
        type="button"
        onClick={() => (open ? hide() : show())}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={open ? "Close help" : "Help: answers, and a way to ask us"}
        className="help-bar"
      >
        <img src="/brand/ds-mark-white-48.png" srcSet="/brand/ds-mark-white-48.png 46w, /brand/ds-mark-white-96.png 93w" sizes="18px" width={441} height={456} alt="" className="help-bar-mark" />
        <span className="help-bar-label">{HELP.marker}</span>
        <span className="help-bar-rule" aria-hidden="true" />
        <span className="help-bar-text">
          <span className="help-bar-long">{open ? HELP.markerLineOpen : HELP.markerLine}</span>
          <span className="help-bar-short">{open ? HELP.markerLineOpen : HELP.markerLineShort}</span>
        </span>
        <svg viewBox="0 0 16 16" width="14" height="14" className="help-bar-arrow" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
          {open ? <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /> : <path d="M3 8h10M9 4l4 4-4 4" />}
        </svg>
      </button>

      {/* As a sheet: the page is dimmed and a tap on it closes the sheet. */}
      {open && <div className="help-backdrop" style={{ touchAction: "none" }} onClick={hide} aria-hidden="true" />}

      {/* ------------------------------------------------------------- panel */}
      <div
        id={`${id}-panel`}
        ref={panel}
        role="dialog"
        aria-label={`${HELP.title} help`}
        aria-modal={open && sheet ? true : undefined}
        tabIndex={-1}
        hidden={!open}
        data-open={open ? "" : undefined}
        className="help-panel"
      >
        {seen && (
          <>
        {/* header */}
        <div className="hp-head">
          <div className="hp-brand">
            <img src="/brand/ds-mark-white-48.png" srcSet="/brand/ds-mark-white-48.png 46w, /brand/ds-mark-white-96.png 93w" sizes="22px" width={441} height={456} alt="" className="hp-mark" />
            <span className="hp-title" data-nobio="">{HELP.title}</span>
            <span className="hp-kicker">{HELP.marker}</span>
          </div>
          <button type="button" onClick={hide} aria-label="Close help" className="hp-x">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </div>

        {/* tabs */}
        <div role="tablist" aria-label="Help" onKeyDown={tabKeys} className="hp-tabs">
          {(["answers", "ask"] as Tab[]).map((t) => (
            <button
              key={t}
              id={`${id}-tab-${t}`}
              type="button"
              role="tab"
              aria-selected={tab === t}
              aria-controls={`${id}-pane-${t}`}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)}
              className="hp-tab"
            >
              {HELP.tabs[t]}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------- answers */}
        <div id={`${id}-pane-answers`} role="tabpanel" aria-labelledby={`${id}-tab-answers`} hidden={tab !== "answers"} className="hp-pane">
          {product && (
            <div className="hp-facts">
              <p className="hp-kicker">{HELP.answers.onThisPage}</p>
              <p className="hp-name">{product.name}</p>
              <dl className="hp-dl">
                {product.price && (
                  <>
                    <dt>Price</dt>
                    <dd>{product.price}</dd>
                  </>
                )}
                {product.runs && (
                  <>
                    <dt>Runs on</dt>
                    <dd>
                      <a href="#markets" onClick={followed} className="lnk">
                        {product.runs}
                      </a>
                    </dd>
                  </>
                )}
                <dt>Platform</dt>
                <dd>{platform}</dd>
                {product.trial && (
                  <>
                    <dt>Trial</dt>
                    <dd>
                      <a href={product.trialHref} onClick={followed} className="lnk">
                        {product.trial}
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <label htmlFor={`${id}-q`} className="hp-sr">
            {HELP.answers.search}
          </label>
          <input id={`${id}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={HELP.answers.search} autoComplete="off" enterKeyHint="search" className={box} />

          {hits.length > 0 ? (
            <ul className="hp-faq">
              {hits.map((f) => (
                <li key={f.q}>
                  <details className="hp-q">
                    <summary>
                      <span>{f.q}</span>
                      <svg viewBox="0 0 16 16" width="14" height="14" className="hp-plus" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                        <path d="M8 2.5v11M2.5 8h11" />
                      </svg>
                    </summary>
                    <p className="hp-a">
                      {f.a}
                      {f.link && (
                        <>
                          {" "}
                          <a href={f.link.href} onClick={followed} className="lnk">
                            {f.link.label}
                          </a>
                          .
                        </>
                      )}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hp-note" role="status">
              {HELP.answers.none}{" "}
              <button type="button" onClick={askInstead} className="hp-link">
                {HELP.answers.askInstead}
              </button>
              .
            </p>
          )}

          {hits.length > 0 && (
            <p className="hp-note">
              {HELP.answers.notHere}{" "}
              <button type="button" onClick={askInstead} className="hp-link">
                {HELP.answers.notHereCta}
              </button>
              .
            </p>
          )}
        </div>

        {/* ----------------------------------------------------------- ask */}
        <div id={`${id}-pane-ask`} role="tabpanel" aria-labelledby={`${id}-tab-ask`} hidden={tab !== "ask"} className="hp-pane">
          {status === "sent" && sent ? (
            <div ref={sentBox} tabIndex={-1} className="hp-sent">
              {/* Their own words, as sent — a record, not a pretend conversation. */}
              <p className="hp-quote">{sent.message}</p>
              <p className="hp-sent-line">
                <strong>{HELP.ask.sent}</strong> <span>{HELP.ask.sentBody(sent.email)}</span>
              </p>
              <p className="hp-small">{HELP.ask.lede}</p>
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setSent(null);
                  panel.current?.focus({ preventScroll: true }); // this button is about to go
                }}
                className="hp-ghost"
              >
                {HELP.ask.again}
              </button>
            </div>
          ) : (
            <form onSubmit={send} noValidate>
              <p className="hp-note hp-lede">{HELP.ask.lede}</p>

              {about && (
                <p className="hp-about">
                  <span className="hp-about-t">
                    <span className="hp-kicker">{HELP.ask.about}</span> <span>{products[about].name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCleared(about);
                      panel.current?.focus({ preventScroll: true }); // this button is about to go
                    }}
                    aria-label={HELP.ask.aboutClear} title={HELP.ask.aboutClear} className="hp-x hp-x-sm">
                    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                    </svg>
                  </button>
                </p>
              )}

              <label htmlFor={`${id}-email`} className="hp-label">
                {HELP.ask.email}
              </label>
              <input
                id={`${id}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={ASK_LIMITS.email}
                readOnly={sending}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                }}
                placeholder={HELP.ask.emailHint}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? `${id}-email-err` : undefined}
                className={field}
              />
              {errors.email && (
                <p id={`${id}-email-err`} role="alert" className="hp-err">
                  {errors.email}
                </p>
              )}

              <label htmlFor={`${id}-message`} className="hp-label">
                {HELP.ask.message}
              </label>
              <textarea
                id={`${id}-message`}
                rows={5}
                readOnly={sending}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((x) => ({ ...x, message: undefined }));
                }}
                onFocus={(e) => {
                  // A phone's keyboard covers the bottom of the sheet: bring the box into view once it is up.
                  const el = e.currentTarget;
                  window.setTimeout(() => el.scrollIntoView({ block: "center", behavior: "auto" }), 320);
                }}
                placeholder={HELP.ask.messageHint}
                aria-invalid={!!errors.message || over}
                aria-describedby={`${id}-message-note`}
                className={`${field} hp-area`}
              />
              <p id={`${id}-message-note`} className="hp-count">
                <span role={errors.message || over ? "alert" : undefined} className="hp-err-t">
                  {errors.message || (over ? HELP.ask.tooLong : "")}
                </span>
                {message.length >= ASK_LIMITS.counterFrom && (
                  <span className={over ? "hp-n hp-n-over" : "hp-n"}>
                    {message.length} / {ASK_LIMITS.message}
                  </span>
                )}
              </p>

              {/* The field people cannot see. A bot fills it; the server then says "ok" and sends
                  nothing. Its name and label are deliberately ones no browser autofill or
                  password manager recognises — a field called "company" gets filled in for
                  real people, whose question would then vanish. */}
              <div aria-hidden="true" className="hp-trap">
                <label>
                  Leave this field empty
                  <input type="text" name="ds-hp-7" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                </label>
              </div>
              <p className="hp-sr" role="status">
                {sending ? HELP.ask.sending : ""}
              </p>

              {(status === "fallback" || status === "rate") && (
                <div role="alert" className="hp-fallback">
                  <p className="hp-fb-t">{status === "rate" ? HELP.ask.tooMany : HELP.ask.fallbackTitle}</p>
                  {status === "fallback" && <p className="hp-small">{HELP.ask.fallbackBody}</p>}
                  <div className="hp-fb-acts">
                    <a href={mailto} className="hp-ghost">
                      {HELP.ask.openMail}
                    </a>
                    <button type="button" onClick={copy} className="hp-ghost">
                      <span aria-live="polite">{copied ? HELP.ask.copied : HELP.ask.copy}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="hp-send">
                <button type="submit" disabled={sending} className="btn">
                  {sending ? HELP.ask.sending : status === "fallback" ? HELP.ask.retry : HELP.ask.send}
                </button>
              </div>
              <p className="hp-small hp-privacy">
                {HELP.ask.privacy} {HELP.ask.direct}{" "}
                <a href={`mailto:${supportEmail}`} className="lnk">
                  {supportEmail}
                </a>
                .
              </p>
            </form>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
