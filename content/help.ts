/**
 * HELP — the marker at the bottom right of every page (2026-10-02).
 *
 * Tom: "a little chat on the bottom right side, unique and elegant, where it
 * has FAQ and a chat where users can send us questions via email. That way
 * users aren't left stranded."
 *
 * WHAT IT IS, HONESTLY. Not live chat: nobody is typing back in real time, and
 * a box that looks like live chat and then goes quiet is worse than no box.
 * So it is labelled Help, it opens on the answers we already have, and its
 * second tab sends one message to the support mailbox — the same address as
 * the Contact page — and says who answers and when. (Nielsen Norman Group's
 * chat guidelines: tell people how fast they will get a response, be upfront
 * about what is on the other end, keep the page they are on in view, and never
 * make them type a question twice.)
 *
 * THE WORDS live here. The questions themselves are content/faq.ts — one list,
 * shown on the store page and in this panel, so the two cannot disagree. On a
 * product page the panel leads with that product's own facts (price, markets,
 * trial), taken from content/pricing.ts, content/markets.ts and
 * content/trial.ts by components/Help.tsx.
 *
 * No outcome wording, no "instant", no "24/7": the reply promise is the one the
 * Contact page already makes.
 */

export const HELP = {
  /** The marker. One word, in the label voice. */
  marker: "Help",
  markerOpen: "Close",
  title: "DS Universe",
  tabs: { answers: "Answers", ask: "Ask us" },

  answers: {
    /** Above a product's own facts, on its page. */
    onThisPage: "On this page",
    search: "Search the answers",
    /** Nothing in the list matches what was typed. */
    none: "Nothing here matches that.",
    /** Carries the typed words into the message, so they are not typed twice. */
    askInstead: "Send it to us instead",
    notHere: "Not here?",
    notHereCta: "Ask us",
  },

  ask: {
    /** Who is on the other end, and when — the Contact page's own promise. */
    lede: "A person answers, by email. Replies go out during US market hours, usually the same day.",
    about: "About",
    aboutClear: "Not about this product",
    email: "Your email",
    emailHint: "name@example.com",
    message: "Your question",
    messageHint: "Which product, and what you are trying to do. For an install question, add your NinjaTrader build.",
    send: "Send",
    sending: "Sending",
    privacy: "Your address is used only to reply to you.",
    /** After it has gone. */
    sent: "Sent.",
    sentBody: (email: string) => `We will reply to ${email}.`,
    again: "Ask another",
    /** Validation, said plainly beside the field. */
    needEmail: "Enter the email address we should reply to.",
    needMessage: "Write your question first.",
    tooLong: "That is longer than this box sends. Shorten it, or email us instead.",
    /** The site could not send it (not switched on yet, or the mail server said no). */
    fallbackTitle: "This page could not send it.",
    fallbackBody: "Your message is not lost. Open it in your own mail app, or copy our address.",
    tooMany: "That is a lot of messages in a short time. Please email us directly.",
    openMail: "Open in mail app",
    copy: "Copy address",
    copied: "Copied",
    retry: "Try again",
    /** Under the form, always: the address itself, for people who prefer it. */
    direct: "Or write to",
  },
} as const;

/** Limits shared by the form and the route, so the two cannot disagree. */
export const ASK_LIMITS = {
  /** OWASP input-validation guidance: an address is at most 254 characters. */
  email: 254,
  message: 2000,
  /** Show the counter from here on. */
  counterFrom: 1600,
} as const;

/** Syntactic check only — the same expression on both sides. Whether the
 *  mailbox exists is something only a reply can prove.
 *  The part before the @ is an ALLOW-list of plain ASCII (RFC 5322's "atext"),
 *  not a list of what to refuse: this address is the one thing a visitor types
 *  that reaches the email's headers (Reply-To, and the subject), so control
 *  characters, invisible or direction-changing Unicode and an encoded word
 *  ("=?utf-8?...") must not be able to ride in on it. */
export const EMAIL_RE = /^(?!.*=\?)[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export const isEmail = (s: string) => s.length <= ASK_LIMITS.email && EMAIL_RE.test(s);
