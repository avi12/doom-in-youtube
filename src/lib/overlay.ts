import { createClip } from "@/lib/clip";
import { FrameMessage, onFrameMessage, removeAllFrameListeners, sendStageState } from "@/lib/frame-messaging";
import "@/lib/overlay.css";
import type { DoomProjection } from "@/lib/tiles";
import { collectDoomProjection } from "@/lib/tiles";

const FRAME_PATH = "doom.html";
const ROOT_ACTIVE_CLASS = "doom-active";
const FRAME_ORIGIN = new URL(browser.runtime.getURL("/")).origin;

export function createOverlay() {
  let isOn = false;
  let rafId = 0;
  let clip: ReturnType<typeof createClip> | null = null;
  const elFrame = buildFrame();

  function enable() {
    if (isOn) {
      return;
    }

    isOn = true;
    document.documentElement.classList.add(ROOT_ACTIVE_CLASS);
    clip = createClip();
    document.body.append(elFrame);
    onFrameMessage(FrameMessage.DoomReady, () => {
      elFrame.classList.add("is-ready");
    });
    tick();
  }

  function disable() {
    if (!isOn) {
      return;
    }

    isOn = false;
    cancelAnimationFrame(rafId);
    removeAllFrameListeners();
    document.documentElement.classList.remove(ROOT_ACTIVE_CLASS);
    elFrame.classList.remove("is-ready");
    elFrame.remove();
    clip?.destroy();
    clip = null;
  }

  function toggle() {
    if (isOn) {
      disable();
    } else {
      enable();
    }

    return isOn;
  }

  function tick() {
    const projection = collectDoomProjection();
    clip?.update(projection?.peepholes ?? []);
    syncStage(projection);
    rafId = requestAnimationFrame(tick);
  }

  // stream the frame rect plus the peepholes so the frame can position #stage and re-clip its
  // canvas from the inside; the peepholes shift every frame on scroll, so this fires each tick
  function syncStage(projection: DoomProjection | null) {
    const targetWindow = elFrame.contentWindow;
    const isUnavailable = !projection || !targetWindow;
    if (isUnavailable) {
      return;
    }

    sendStageState({
      state: {
        rect: projection.frame,
        peepholes: projection.peepholes.map(({ rect, radius }) => ({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          radius
        }))
      },
      targetWindow,
      targetOrigin: FRAME_ORIGIN
    });
  }

  return { toggle };
}

function buildFrame() {
  const elFrame = document.createElement("iframe");
  elFrame.src = browser.runtime.getURL(`/${FRAME_PATH}`);
  elFrame.allow = "autoplay; gamepad; keyboard-map";
  elFrame.className = "doom-frame";
  return elFrame;
}
