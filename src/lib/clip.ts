const SVG_NS = "http://www.w3.org/2000/svg";
const CLIP_ID = "doom-in-youtube-holes";

interface Peephole {
  rect: DOMRect;
  radius: number;
}

export function createClip() {
  const elSvg = document.createElementNS(SVG_NS, "svg");
  elSvg.setAttribute("class", "doom-clip");

  const elClipPath = document.createElementNS(SVG_NS, "clipPath");
  elClipPath.setAttribute("id", CLIP_ID);
  elClipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
  elSvg.append(elClipPath);
  document.body.append(elSvg);

  function update(peepholes: Peephole[]) {
    syncRectCount({
      elClipPath,
      count: peepholes.length
    });

    const elRects = elClipPath.children;

    for (let i = 0; i < peepholes.length; i++) {
      applyRect({
        elRect: elRects[i],
        peephole: peepholes[i]
      });
    }
  }

  function destroy() {
    elSvg.remove();
  }

  return {
    update,
    destroy
  };
}

function syncRectCount({ elClipPath, count }: {
  elClipPath: SVGClipPathElement;
  count: number;
}) {
  while (elClipPath.childElementCount < count) {
    elClipPath.append(document.createElementNS(SVG_NS, "rect"));
  }

  while (elClipPath.childElementCount > count) {
    elClipPath.lastElementChild?.remove();
  }
}

function applyRect({ elRect, peephole }: {
  elRect: Element | undefined;
  peephole: Peephole | undefined;
}) {
  if (!elRect || !peephole) {
    return;
  }

  const { rect, radius } = peephole;
  elRect.setAttribute("x", `${rect.left}`);
  elRect.setAttribute("y", `${rect.top}`);
  elRect.setAttribute("width", `${rect.width}`);
  elRect.setAttribute("height", `${rect.height}`);
  elRect.setAttribute("rx", `${radius}`);
  elRect.setAttribute("ry", `${radius}`);
}
