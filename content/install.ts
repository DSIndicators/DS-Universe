import { ESSENTIALS } from "./vaults";

/**
 * Getting a tool onto the chart, in the words of the Whop listing FAQ
 * (00 Business Documents, 2026-10-30), so the site and the listings never
 * say two different things. The archive's file name is never printed (Tom,
 * 2026-09-18: it changes with every export); assembly names are, because
 * NinjaTrader shows them in Tools > Remove NinjaScript Assembly.
 */
export const INSTALL = [
  "Download the archive and leave it zipped: NinjaTrader reads it as it is.",
  "In the Control Center, open Tools, then Import, then NinjaScript Add-On, pick the archive and click Import. NinjaTrader confirms when it is done.",
  "Restart NinjaTrader once.",
  "On a chart press Ctrl+I. Essentials tools sit in the DSUniverseSuite folder, Free Vault tools in DSFreeVault. The folder starts collapsed: open it, double-click the tool, then click OK.",
];

export const UPDATE = [
  `Open Tools, then Remove NinjaScript Assembly, select the one you are updating (${ESSENTIALS.assembly} for the whole Essentials Vault, or the tool's own name) and click Remove.`,
  "Restart NinjaTrader. It keeps the old version loaded until it restarts.",
  "Import the new archive the same way as the first time.",
  "Remove the tool from your chart and add it again, so its new defaults load.",
];

/** The one-way-only rule, said wherever downloads are offered. */
export const ONE_WAY = `Take the whole vault in one archive (${ESSENTIALS.assembly}) or only the tools you use, each its own archive. One license runs them either way; install each tool one way, not both, or NinjaTrader reports duplicate compile errors.`;
