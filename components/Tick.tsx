/** A drawn check, hairline weight. Decorative: the words beside it carry the meaning. */
export function Tick() {
  return (
    <svg className="tick" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d="M2 7.4 5.4 10.6 12 3.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}
/** A drawn padlock, for things that open with the Essentials Vault. */
export function Lock() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true" focusable="false">
      <rect x="0.75" y="5.25" width="9.5" height="6" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.75 5.25V3.5a2.75 2.75 0 0 1 5.5 0v1.75" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
export function Arrow() {
  return (
    <svg className="arrow" width="14" height="10" viewBox="0 0 14 10" aria-hidden="true" focusable="false">
      <path d="M0 5h12.5M8.5 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
