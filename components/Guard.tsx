"use client";

import { useEffect } from "react";

/**
 * PICTURE PROTECTION. The charts and covers are DS Universe's own work, so the
 * browser's "Save image as", "Open image in new tab" and "Copy image" are not
 * offered on them, and they cannot be dragged off the page.
 *
 * Two layers: every <img> takes no pointer events (globals.css), so a right
 * click or a long press lands on the frame around the picture, never on the
 * picture itself, even with scripts off; and here, the menu is suppressed over
 * the picture frames, and any drag that starts on one is cancelled. The rest
 * of the page keeps its normal menu (copy text, open a link in a new tab).
 *
 * It deters casual saving. Nothing on a web page can stop a screenshot or a
 * look at the browser's developer tools.
 */
const FRAMES = ".wide-img, .stage-box, .vault-pic, .thumb-a, .pp-cover, .ftr-logo, .nt-devices, .nt-mark, .kt-mark, img";

export function Guard() {
  useEffect(() => {
    const inFrame = (t: EventTarget | null) => t instanceof Element && !!t.closest(FRAMES);
    const menu = (e: MouseEvent) => { if (inFrame(e.target)) e.preventDefault(); };
    const drag = (e: DragEvent) => { if (inFrame(e.target)) e.preventDefault(); };
    document.addEventListener("contextmenu", menu);
    document.addEventListener("dragstart", drag);
    return () => {
      document.removeEventListener("contextmenu", menu);
      document.removeEventListener("dragstart", drag);
    };
  }, []);
  return null;
}
