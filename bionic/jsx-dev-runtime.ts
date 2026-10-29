/** Development twin of ./jsx-runtime.ts (next dev uses jsxDEV). */
import * as D from "react/jsx-dev-runtime";
import * as R from "react/jsx-runtime";
import { bio } from "./transform";

export * from "react/jsx-dev-runtime";

// One processed string = ONE inline <span class="bt">, so inside a flex or
// grid container (a button, a label with an icon) it stays a single item:
// as loose pieces each <b> became its own flex item and the container's gap
// tore words apart ("B uy a t t he foun ders", 2026-10-27).
const make = (parts: Array<string | { b: string }>) =>
  R.jsxs("span", { className: "bt", children: parts.map((p) => (typeof p === "string" ? p : R.jsx("b", { className: "bf", children: p.b }))) });

type DevFn = typeof D.jsxDEV;
export const jsxDEV: DevFn = (type, props, key, isStatic, source, self) =>
  D.jsxDEV(type, bio(type, props as Record<string, unknown>, make) as typeof props, key, isStatic, source, self);
