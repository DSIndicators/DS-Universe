/**
 * Site-wide facts and the disclosures. The disclosures are copied VERBATIM
 * from DS-Universe-White content/site.ts (NinjaTrader Vendor Professional and
 * Compliance Guidelines rev 2.11.2025: risk, hypothetical and trademark in
 * the footer of every page, in visible body text). Do not reword them.
 */
import { COUNT } from "./vaults";

export const SITE = {
  name: "DS Universe",
  tagline: "Indicators for NinjaTrader 8",
  url: "https://dsuniverse.net",
  description: `Order-flow, volume and level indicators for NinjaTrader 8 in two vaults: ${COUNT.free} free tools in the Free Vault, and every paid DS indicator in the Essentials Vault membership.`,
  email: "support@dsuniverse.net",
  city: "New York City",
  platform: "NinjaTrader 8",
  /** The oldest build the shipped archives import into (Info.xml of every archive, checked 2026-09-25). */
  minBuild: "8.1.8.1",
};

export const DISCLOSURE = {
  short:
    "DS Universe tools are charting and research software for educational and informational purposes. They are not investment advice and no output is a forecast or a guarantee of any result. Trading futures and other leveraged instruments carries substantial risk of loss and is not suitable for every investor.",
  long: "Nothing on this site presents a performance record; no win rate, return or account figure is published anywhere on it. Past behavior of any analytical method does not guarantee future outcomes. DS Universe is not a broker-dealer, an introducing broker, or a registered investment adviser, and does not manage accounts or place trades on anyone's behalf.",
  risk: "Futures and forex trading contains substantial risk and is not for every investor. An investor could potentially lose all or more than the initial investment. Risk capital is money that can be lost without jeopardizing ones' financial security or life style. Only risk capital should be used for trading and only those with sufficient risk capital should consider trading. Past performance is not necessarily indicative of future results.",
  hypothetical:
    "Hypothetical performance results have many inherent limitations, some of which are described below. No representation is being made that any account will or is likely to achieve profits or losses similar to those shown; in fact, there are frequently sharp differences between hypothetical performance results and the actual results subsequently achieved by any particular trading program. One of the limitations of hypothetical performance results is that they are generally prepared with the benefit of hindsight. In addition, hypothetical trading does not involve financial risk, and no hypothetical trading record can completely account for the impact of financial risk of actual trading. For example, the ability to withstand losses or to adhere to a particular trading program in spite of trading losses are material points which can also adversely affect actual trading results. There are numerous other factors related to the markets in general or to the implementation of any specific trading program which cannot be fully accounted for in the preparation of hypothetical performance results and all which can adversely affect trading results.",
  /**
   * The line that travels WITH a chart picture, wherever the footer cannot be
   * seen from it — under the storefront picture row, and inside the lightbox,
   * where a modal in the top layer hides the whole page behind it.
   *
   * The vendor guidelines (rev 2.11.2025, p.2) forbid "video content or chart
   * images without being accompanied by relevant Risk Disclosures and
   * Hypothetical Performance Disclosures". The footer carries both in full on
   * every page; this is the same warning within sight of the picture, in body
   * text, and it links to the full text on /disclosures.
   */
  chart:
    "Chart pictures are illustrations of the software, not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  /**
   * The line under the HOME hero, which now holds a screen recording AND still
   * chart pictures on one rotation (2026-09-23). `short` alone no longer covers
   * it: the guidelines (rev 2.11.2025, p.2) require "video content or chart
   * images" to be accompanied by Risk AND Hypothetical Performance Disclosures,
   * and a market replay is simulated by definition. One paragraph, three
   * sentences, in body text — recording and pictures first, then what the
   * software is and is not, then the risk. The footer still carries both
   * verbatim texts in full on every page.
   */
  screen:
    "The charts above are a screen recording and pictures of the software, not a performance record; hypothetical and simulated results have inherent limitations that may differ materially from live trading. DS Universe tools are charting and research software — not investment advice, and no output is a forecast or a guarantee of any result. Trading futures and other leveraged instruments carries substantial risk of loss and is not suitable for every investor.",
  /**
   * The line that sits ABOVE a demo player. The footer carries the full text on
   * every page and the video opens on the card, but a visitor scrolling past
   * should not have to hunt for either: the guidelines require video "be
   * accompanied by relevant Risk Disclosures", and directly above the thing it
   * refers to is the only placement that is unambiguously accompanying.
   */
  demo:
    "These are screen recordings of the software, not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  /**
   * The line under a product page's first gallery when it leads with a
   * showcase recording (2026-09-28). The same two disclosures as `chart`, with
   * the recording named — the guidelines (rev 2.11.2025, p.2) cover "video
   * content or chart images", and this sits directly under both.
   */
  showcase:
    "The recording and chart pictures above show the software running; they are not a performance record. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  /**
   * Under DS Replay (2026-10-09, v4): what the visitor is driving, and the two
   * disclosures the vendor guidelines require beside any chart in motion. The
   * examples are composed scenarios (tools/showcase/design.ts): the pattern is
   * written for the example, every candle is a recorded one; the line says so.
   */
  replay:
    "DS Replay examples are illustrative: each scenario is composed for the example from recorded one-minute futures candles, to show the conditions a tool is built for, and is not a recording of a trading session. The tool drawing on it runs its shipped rules unchanged. They show how the software reads price; they are not a performance record, no trade is taken or shown, and live markets often behave differently. Futures trading carries substantial risk of loss and is not suitable for every investor, and hypothetical or simulated results have inherent limitations that may differ materially from live trading.",
  trademark:
    "NinjaTrader® is a registered trademark of NinjaTrader Group, LLC. No NinjaTrader company has any affiliation with the owner, developer, or provider of the products or services described herein, or any interest, ownership or otherwise, in any such product or service, or endorses, recommends or approves any such product or service.",
};

