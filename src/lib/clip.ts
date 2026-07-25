import { StagePeephole } from "@/lib/frame-messaging";
import { TilePeephole } from "@/lib/tiles";

const SVG_NS = "http://www.w3.org/2000/svg";
const CLIP_ID = "doom-in-youtube-holes";

export function createClip() {
  const elSvg = document.createElementNS(SVG_NS, "svg");
  elSvg.setAttribute("class", "doom-clip");

  const elClipPath = document.createElementNS(SVG_NS, "clipPath");
  elClipPath.setAttribute("id", CLIP_ID);
  elClipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
  elSvg.append(elClipPath);
  document.body.append(elSvg);

  function update(peepholes: TilePeephole[]) {
    syncClipRects({
      elClipPath,
      rects: peepholes.map(({ rect, radius }) => ({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        radius
      }))
    });
  }

  function destroy() {
    elSvg.remove();
  }

  return {
    update,
    destroy
  };
}

// Shared by the page overlay and the in-frame stage clip: mirror `rects` onto the clipPath's
// child <rect>s, growing or shrinking the pool to match.
export function syncClipRects({ elClipPath, rects }: {
  elClipPath: SVGClipPathElement;
  rects: StagePeephole[];
}) {
  while (elClipPath.childElementCount < rects.length) {
    elClipPath.append(document.createElementNS(SVG_NS, "rect"));
  }

  while (elClipPath.childElementCount > rects.length) {
    elClipPath.lastElementChild?.remove();
  }

  const elRects = elClipPath.children;
  for (let i = 0; i < rects.length; i++) {
    applyRect({
      elRect: elRects[i],
      rect: rects[i]
    });
  }
}

function applyRect({ elRect, rect }: {
  elRect: Element | undefined;
  rect: StagePeephole | undefined;
}) {
  if (!elRect || !rect) {
    return;
  }

  elRect.setAttribute("x", `${rect.x}`);
  elRect.setAttribute("y", `${rect.y}`);
  elRect.setAttribute("width", `${rect.width}`);
  elRect.setAttribute("height", `${rect.height}`);
  elRect.setAttribute("rx", `${rect.radius}`);
  elRect.setAttribute("ry", `${rect.radius}`);
}
