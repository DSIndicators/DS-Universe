# Showcase image map — DS Universe

How every picture in the showcase guides + homepage rotation is wired, and how to swap one
without breaking anything. All these files are committed on `main`, so they stay put until you
deliberately change them.

## How to change ANY picture (two ways)

**Easiest — no code:** replace the file in `public/...` with a new image using the **exact same
filename**, then redeploy (push to `main`). The section picks it up automatically.

**Or change which file a section points at:** edit the one `<img src="...">` line in the guide
HTML (`public/guides/*.html`) or `components/Capabilities.tsx`, then redeploy.

After a deploy, hard-refresh (Ctrl+Shift+R). Guide pages are set to always-revalidate, so updates
show immediately.

---

## DS P&L showcase  (`public/guides/carepack.html`)

| Section | Picture file |
|---|---|
| 05 · Overview | `public/pnl/overview.webp` |
| 06 · Calendar | `public/pnl/calendar.webp` |
| 07 · Trade Log | `public/pnl/tradelog.png` |
| 07 · Instruments | `public/pnl/instruments.png` |
| 08 · Performance Graphs | `public/pnl/graphs.png` |
| 09 · Appearance (themes) | `public/pnl/appearance.png` |
| 09 · My Space · Editor | `public/pnl/myspace-editor.png` |
| 09 · My Space · In Use | `public/pnl/myspace-inuse.png` |
| 10 · Dark | `public/pnl/dark.png` |
| 10 · Light | `public/pnl/light.png` |
| 11 · Import | `public/pnl/import.png` |

## Carepack tool panels  (`public/guides/carepack.html`)

| Section | Picture file |
|---|---|
| 02 · DS Checklist | `public/promos/checklist.png` |
| 03 · DS Risk-Reward | `public/promos/riskreward.png` |
| 01 · Carepack hero (composite) | `public/guides/DS_20260619_003557.png` |

## DS Systems guide  (`public/guides/systems.html`)

| Section | Picture file |
|---|---|
| 02 · One glance, four reads | `public/promos/glance-4-reads.png` |
| DS Orbit · confidence-scored zones | `public/promos/orbit-zones.png` |

## Homepage rotation  (`components/Capabilities.tsx` → `CAPS` array)

Promo cards in the scrolling strip: `public/promos/systems.png`, `pulse.png`, `carepack.png`,
`riskreward.png`, `checklist.png` (plus the existing `capabilities/*.webp` and
`indicators/panels/*.webp` product shots). To add/remove/reorder, edit the `CAPS` array.

---

_Last updated 2026-06-20. Source screenshots for the P&L set live in
`Website Command Center/Showcase/` (the `Screenshot 2026-06-16 00xxxx.png` series)._
