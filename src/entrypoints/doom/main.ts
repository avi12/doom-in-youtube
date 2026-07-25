import { syncClipRects } from "@/lib/clip";
import {
  FrameMessage,
  onStageState,
  sendFrameMessage,
  StageRect,
  StageState
} from "@/lib/frame-messaging";

const PARENT_ORIGIN = "https://www.youtube.com";
const SVG_NS = "http://www.w3.org/2000/svg";
const STAGE_CLIP_ID = "doom-stage-peepholes";

function bootDoom() {
  const elStage = document.querySelector<HTMLElement>("#stage");
  if (!elStage) {
    return;
  }

  const elClipPath = createStageClip(elStage);

  onStageState({
    allowedOrigin: PARENT_ORIGIN,
    handler(state) {
      applyStageRect({
        elStage,
        rect: state.rect
      });
      syncStageClip({
        elClipPath,
        state
      });
    }
  });

  Dos(elStage, {
    url: "/assets/doom.jsdos",
    pathPrefix: "/vendor/emulators/",
    kiosk: true,
    autoStart: true,
    mouseCapture: true,
    noCloud: true,
    volume: 0.6
  });

  notifyReady();
}

// the parent hands us an already 4:3-fitted rect (in its viewport coords); map #stage onto it and
// let CSS stretch the DOOM canvas to fill it, so the frame's edges line up with the thumbnail box
function applyStageRect({ elStage, rect }: {
  elStage: HTMLElement;
  rect: StageRect;
}) {
  elStage.style.inset = "auto";
  elStage.style.left = `${rect.left}px`;
  elStage.style.top = `${rect.top}px`;
  elStage.style.width = `${rect.width}px`;
  elStage.style.height = `${rect.height}px`;
}

// the WebGL canvas is its own compositor layer and slips past the parent iframe's clip-path in the
// gutters between thumbnails; clipping #stage from inside its own document clips that layer directly
function createStageClip(elStage: HTMLElement) {
  const elSvg = document.createElementNS(SVG_NS, "svg");
  elSvg.style.position = "fixed";
  elSvg.style.width = "0";
  elSvg.style.height = "0";

  const elClipPath = document.createElementNS(SVG_NS, "clipPath");
  elClipPath.id = STAGE_CLIP_ID;
  elClipPath.setAttribute("clipPathUnits", "userSpaceOnUse");
  elSvg.append(elClipPath);
  document.body.append(elSvg);

  elStage.style.clipPath = `url(#${STAGE_CLIP_ID})`;
  return elClipPath;
}

// the peepholes arrive in the parent's viewport coordinates; #stage's clip runs in its own user
// space, so shift each rect by #stage's top-left before mirroring them onto the clipPath
function syncStageClip({ elClipPath, state }: {
  elClipPath: SVGClipPathElement;
  state: StageState;
}) {
  syncClipRects({
    elClipPath,
    rects: state.peepholes.map(peephole => ({
      ...peephole,
      x: peephole.x - state.rect.left,
      y: peephole.y - state.rect.top
    }))
  });
}

function notifyReady() {
  if (parent === self) {
    return;
  }

  void sendFrameMessage(FrameMessage.DoomReady, undefined, PARENT_ORIGIN, parent);
}

bootDoom();
