/**
 * A PANEL SPLITTER (2026-10-26 late night — Tom: "all white while scrolling can
 * confuse users on where they are ... i want ... other panel splitters,
 * including all tabs ... teal"). A full-width teal bar that opens each major
 * section of every page with its number, its name and, where it helps, one
 * line about it. It is also a waypoint: the header reads `data-section` off
 * the bar the reader has scrolled past and names it beside the wordmark, so
 * the page always says where you are.
 */
export function SectionBar({ n, title, sub, id, as: H = "h2" }: { n: string; title: string; sub?: string; id?: string; as?: "h2" | "h3" }) {
  return (
    <div className="sbar" data-section={title} id={id}>
      <div className="wb sbar-in">
        <span className="sbar-n num" aria-hidden="true">
          {n}
        </span>
        <H className="sbar-t">{title}</H>
        {sub && <p className="sbar-s">{sub}</p>}
      </div>
    </div>
  );
}
