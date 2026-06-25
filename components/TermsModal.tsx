"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Footer "Terms" link → opens the Terms & Conditions modal.
 *
 * Source of truth: DS-Universe-Terms-and-Conditions_2.md (repo root). If that
 * document changes, mirror the edits here.
 *
 * NOTE: a couple of bracketed placeholders remain from the source doc and still
 * need to be filled before launch: [LEGAL ENTITY NAME], [CURRENCY], the
 * "Last updated" date, and the governing-law jurisdiction line.
 */
const SUPPORT_EMAIL = "support@dsuniverse.net";
const LAST_UPDATED = "06/13/2026";

type Block = { p?: string; ul?: string[] };
type Section = { heading: string; blocks: Block[] };

const PREAMBLE =
  'These Terms and Conditions ("Terms") govern your purchase, download, installation, and use of the DS Universe Indicators software (the "Software"), including all indicators, panels, overlays, registries, documentation, and related materials provided by DS Universe ("we," "us," or "the Provider"). By purchasing, downloading, installing, or using the Software, you ("you," "the User," or "Licensee") agree to be bound by these Terms. If you do not agree, do not install or use the Software.';

const SECTIONS: Section[] = [
  {
    heading: "1. The Software",
    blocks: [
      {
        p: "DS Universe is a collection of custom NinjaScript indicators designed for the NinjaTrader 8 platform, offered in the following components:",
      },
      {
        ul: [
          "DS Radars (paid) — panel overlay indicators, comprising DS Pilots, DS Sweeper, and DS Beacon.",
          "DS Systems (paid) — chart overlay indicators, comprising DS Orbit, DS Stars, DS Balance, DS Council, DS Ember, and DS Pulse, together with the shared OrbitStarsRegistry component on which certain of them depend.",
          "DS Crewmates (free) — the DS BC, DS SR, and DS TL indicators, provided free of charge.",
          "DS Carepack (included free with each DS Systems purchase, or available as a separate paid purchase) — the DS CL (Checklist), DS Risk-Reward, and DS Pen tools, together with the DS P&L companion dashboard.",
          "DS Playbook and DS Pattern guides (included free with each DS Systems purchase) — educational reference guides provided at no additional charge.",
        ],
      },
      {
        p: 'The specific components included in your access are those listed at the point of sale or download. We may add, modify, retire, or rename components over time at our sole discretion. References in these Terms to "the Software" apply to whichever components you obtain, whether paid or free.',
      },
    ],
  },
  {
    heading: "2. License Grant",
    blocks: [
      {
        p: "Subject to your compliance with these Terms and payment of all applicable fees (where applicable), we grant you a lifetime, non-exclusive, non-transferable license to install and use the Software for your own personal trading or evaluation purposes on the number of machines or accounts specified at the point of sale or download.",
      },
      {
        p: '"Lifetime" means the license continues for the operational lifetime of the Provider and is not subject to recurring fees. The license remains in effect until either (a) you breach these Terms, or (b) the Provider ceases operations, as described in Section 14.',
      },
      {
        p: "This is a license, not a sale of the Software itself. We retain all right, title, and interest in and to the Software. No rights are granted except those expressly stated in these Terms.",
      },
    ],
  },
  {
    heading: "3. License Restrictions",
    blocks: [
      { p: "You may not, and may not permit any third party to:" },
      {
        ul: [
          "Resell, sublicense, lease, rent, lend, distribute, or otherwise make the Software available to any third party;",
          "Copy, reproduce, or redistribute the Software or any portion of it, except for a single reasonable backup copy;",
          "Decompile, disassemble, reverse-engineer, or attempt to derive the source code, structure, algorithms, or underlying logic of any compiled component, except to the extent this restriction is prohibited by applicable law;",
          "Modify, adapt, translate, or create derivative works based on the Software for the purpose of redistribution or commercial exploitation;",
          "Remove, alter, or obscure any proprietary notices, branding, or attribution contained in the Software;",
          "Share, publish, or distribute your license credentials, keys, or download links;",
          "Use the Software to develop a competing product or service.",
        ],
      },
      { p: "These restrictions apply equally to the free DS Crewmates components." },
    ],
  },
  {
    heading: "4. Intellectual Property",
    blocks: [
      {
        p: 'All intellectual property rights in the Software — including source code, compiled code, methodologies, scoring engines, visual designs, panel layouts, naming, documentation, branding, and the "DS Universe," "DS Radars," "DS Systems," and "DS Crewmates" marks — are and remain the exclusive property of the Provider. These Terms do not transfer any ownership rights to you, whether you obtain paid or free components.',
      },
    ],
  },
  {
    heading: "5. Third-Party Platform",
    blocks: [
      {
        p: "The Software is built for and depends on the NinjaTrader 8 platform. NinjaTrader is a third-party product, and we are not affiliated with, endorsed by, or sponsored by NinjaTrader Group, LLC or any of its affiliates. You are solely responsible for obtaining, licensing, and maintaining a valid and compatible installation of NinjaTrader 8 and any required data feeds. We are not responsible for changes to the NinjaTrader platform, NinjaScript API, or third-party data feeds that may affect the Software's functionality.",
      },
    ],
  },
  {
    heading: "6. No Financial Advice",
    blocks: [
      {
        p: "The Software is a set of technical analysis and charting tools. It is not, and does not provide, financial, investment, trading, tax, or legal advice.",
      },
      {
        p: "The indicators, signals, scores, dialogue outputs, zones, and visual elements produced by the Software are informational and educational only. They do not constitute a recommendation, solicitation, or offer to buy or sell any futures contract, security, or financial instrument. We are not a registered investment adviser, broker-dealer, commodity trading advisor, or futures commission merchant. You are solely responsible for all trading and investment decisions you make, and you should consult a licensed professional before making any such decisions.",
      },
    ],
  },
  {
    heading: "7. Risk Disclosure",
    blocks: [
      {
        p: "Trading futures and other leveraged instruments involves substantial risk of loss and is not suitable for every investor. You may lose some or all of your invested capital, and in some cases more than your initial deposit. You should not trade with money you cannot afford to lose.",
      },
      { p: "You acknowledge and accept that:" },
      {
        ul: [
          "No indicator, system, or tool can predict market movements or guarantee profitable outcomes;",
          "Past performance is not indicative of future results;",
          "Any outputs of the Software may be inaccurate, delayed, incomplete, or in error;",
          "You bear full responsibility for your own risk management, position sizing, and trade execution.",
        ],
      },
    ],
  },
  {
    heading: "8. Hypothetical and Simulated Performance Disclaimer",
    blocks: [
      {
        p: "Any performance results, examples, backtests, or illustrations associated with the Software — whether in the Software itself, marketing materials, documentation, or otherwise — are hypothetical or simulated and have inherent limitations. Hypothetical performance results do not represent actual trading, and there are frequently sharp differences between hypothetical results and the actual results subsequently achieved by any trading program. No representation is being made that any account will or is likely to achieve profits or losses similar to those shown.",
      },
    ],
  },
  {
    heading: "9. No Warranty",
    blocks: [
      {
        p: 'THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, ACCURACY, AND NON-INFRINGEMENT. This disclaimer applies fully to the free DS Crewmates components.',
      },
      {
        p: "We do not warrant that the Software will be uninterrupted, error-free, secure, or free of defects, or that it will meet your requirements or operate in any combination with other software, hardware, or data feeds you may use.",
      },
    ],
  },
  {
    heading: "10. Limitation of Liability",
    blocks: [
      {
        p: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL THE PROVIDER, ITS OWNERS, AFFILIATES, OR CONTRIBUTORS BE LIABLE FOR ANY TRADING LOSSES, LOST PROFITS, LOST DATA, OR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO THE SOFTWARE OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
      },
      {
        p: "OUR TOTAL AGGREGATE LIABILITY FOR ANY AND ALL CLAIMS ARISING OUT OF OR RELATED TO THE SOFTWARE OR THESE TERMS SHALL NOT EXCEED THE TOTAL AMOUNT YOU ACTUALLY PAID FOR THE SOFTWARE. For the free DS Crewmates components, for which no fee is paid, our aggregate liability shall not exceed USD $0.",
      },
      {
        p: "Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.",
      },
    ],
  },
  {
    heading: "11. Indemnification",
    blocks: [
      {
        p: "You agree to indemnify, defend, and hold harmless the Provider and its owners, affiliates, and contributors from and against any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of or related to your use of the Software, your trading decisions, or your breach of these Terms.",
      },
    ],
  },
  {
    heading: "12. Payment, Licensing Term, Updates, and Support",
    blocks: [
      {
        ul: [
          "DS Radars, DS Systems, and DS Carepack (paid). Each is offered as a one-time purchase granting a lifetime license, payable in USD at the point of sale. There are no recurring or subscription fees. The DS Carepack is included free with each DS Systems purchase and is also available to buy separately.",
          "DS Crewmates (free). The DS Crewmates components are provided free of charge. We may modify, limit, or discontinue the availability of the free components at any time without notice or liability.",
          "Lifetime scope. Your lifetime license entitles you to continued use of the components you obtained for the operational lifetime of the Provider. It does not entitle you to any specific future component, feature, or platform-compatibility guarantee.",
          "Updates. Any updates, patches, or new versions we choose to provide are governed by these Terms and are offered at our discretion. We are under no obligation to provide updates or to maintain compatibility with future NinjaTrader or operating-system versions.",
        ],
      },
    ],
  },
  {
    heading: "13. Refunds — All Sales Final",
    blocks: [
      {
        p: "All sales are final and non-refundable. Because the Software is delivered digitally and can be copied upon delivery, no refunds, exchanges, or credits are provided once download access, license keys, or files have been issued, except where a refund is required by applicable law. By completing your purchase, you expressly acknowledge and consent to this policy. The free DS Crewmates components are provided without charge and are likewise non-refundable.",
      },
    ],
  },
  {
    heading: "14. Term and Termination",
    blocks: [
      {
        p: "This license is effective upon delivery and continues for the operational lifetime of the Provider, subject to the following:",
      },
      {
        ul: [
          "Breach. We may suspend or terminate your license immediately, without notice, if you breach any of these Terms. Upon such termination, you must cease all use of the Software and delete all copies in your possession.",
          "Cessation of operations. Should the Provider cease operations, wind down, or otherwise discontinue the business, the lifetime license and any associated updates, support, licensing infrastructure, or services will naturally end. No refund or further obligation of any kind shall arise from such cessation, and the disclaimers and limitations in these Terms continue to apply to any copies you retain.",
        ],
      },
      {
        p: "Sections relating to intellectual property, disclaimers, risk, limitation of liability, indemnification, and governing law survive termination.",
      },
    ],
  },
  {
    heading: "15. Changes to These Terms",
    blocks: [
      {
        p: 'We may update these Terms from time to time. The "Last updated" date above reflects the most recent revision. Your continued use of the Software after changes take effect constitutes acceptance of the revised Terms.',
      },
    ],
  },
  {
    heading: "16. Governing Law and Dispute Resolution",
    blocks: [
      {
        p: "These Terms are governed by and construed in accordance with the laws of the State of New York, without regard to its conflict-of-law principles. You agree that any dispute arising out of or relating to these Terms or the Software shall be subject to the exclusive jurisdiction of the state and federal courts located in NY.",
      },
    ],
  },
  {
    heading: "17. Severability and Entire Agreement",
    blocks: [
      {
        p: "If any provision of these Terms is held unenforceable, the remaining provisions will remain in full force and effect. These Terms, together with any order or purchase documentation, constitute the entire agreement between you and the Provider regarding the Software and supersede all prior agreements and understandings.",
      },
    ],
  },
  {
    heading: "18. Contact",
    blocks: [
      { p: "Questions about these Terms may be directed to:" },
      { p: `DS Universe · ${SUPPORT_EMAIL} · dsuniverse.net` },
    ],
  },
];

export function TermsModal() {
  const [open, setOpen] = useState(false);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left text-sm text-ink-gray transition-colors hover:text-ink-white"
      >
        Terms
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Terms and Conditions"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-space-black/80 backdrop-blur-sm"
          />

          {/* Panel */}
          <div className="glass-strong relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl">
            <div className="bg-ai pointer-events-none absolute -inset-x-10 -top-24 h-48 opacity-[0.08] blur-3xl" />

            <div className="relative flex items-start justify-between gap-4 border-b border-[#e3b24f]/[0.06] px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-accent-teal">
                  Legal
                </span>
                <h2 className="font-sans text-xl font-bold tracking-tight text-ink-white">
                  Terms &amp; Conditions
                </h2>
                <span className="text-xs text-ink-gray/70">
                  Last updated: {LAST_UPDATED}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close terms"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e3b24f]/[0.06] bg-white/[0.03] text-ink-gray transition-colors hover:border-[#e3b24f]/[0.16] hover:text-ink-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="relative flex flex-col gap-6 overflow-y-auto px-6 py-6 text-sm leading-relaxed text-ink-gray sm:px-8 [scrollbar-width:thin]">
              <p>{PREAMBLE}</p>

              {SECTIONS.map((s) => (
                <div key={s.heading} className="flex flex-col gap-2.5">
                  <h3 className="font-sans text-sm font-semibold text-ink-white">
                    {s.heading}
                  </h3>
                  {s.blocks.map((b, i) =>
                    b.ul ? (
                      <ul key={i} className="flex flex-col gap-1.5 pl-1">
                        {b.ul.map((li) => (
                          <li key={li} className="flex gap-2.5">
                            <span
                              aria-hidden
                              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-teal/70"
                            />
                            <span>{li}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p key={i}>{b.p}</p>
                    ),
                  )}
                </div>
              ))}

              <p className="border-t border-[#e3b24f]/[0.05] pt-5 text-xs italic text-ink-gray/70">
                By installing or using DS Universe Indicators, you acknowledge that
                you have read, understood, and agree to be bound by these Terms and
                Conditions.
              </p>
            </div>

            <div className="relative border-t border-[#e3b24f]/[0.06] px-6 py-4 text-xs text-ink-gray/70 sm:px-8">
              Questions? Contact{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-accent-teal hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </div>
          </div>
        </div>
      )}
    </>
  );
}
