import { FrameMessage, onStageRect, sendFrameMessage, StageRect } from "@/lib/frame-messaging";

const PARENT_ORIGIN = "https://www.youtube.com";

function bootDoom() {
  const elStage = document.querySelector<HTMLElement>("#stage");
  if (!elStage) {
    return;
  }

  onStageRect({
    allowedOrigin: PARENT_ORIGIN,
    handler: rect => applyStageRect({
      elStage,
      rect
    })
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

function notifyReady() {
  if (parent === self) {
    return;
  }

  void sendFrameMessage(FrameMessage.DoomReady, undefined, PARENT_ORIGIN, parent);
}

bootDoom();
