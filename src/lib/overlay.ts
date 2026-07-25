import { createClip } from "@/lib/clip";
import {
  FrameMessage,
  onFrameMessage,
  removeAllFrameListeners,
  sendStageRect,
  StageRect
} from "@/lib/frame-messaging";
import "@/lib/overlay.css";
import { collectDoomProjection } from "@/lib/tiles";

const FRAME_PATH = "doom.html";
const ROOT_ACTIVE_CLASS = "doom-active";
const FRAME_ORIGIN = new URL(browser.runtime.getURL("/")).origin;

export function createOverlay() {
  let isOn = false;
  let rafId = 0;
  let clip: ReturnType<typeof createClip> | null = null;
  let lastStageRect: StageRect | null = null;
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
      // the frame only starts listening for stage rects once its script boots, so the initial
      // send can arrive before anyone is listening; clear the cache to force a fresh send now
      lastStageRect = null;
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
    lastStageRect = null;
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
    syncStageRect(projection?.frame ?? null);
    rafId = requestAnimationFrame(tick);
  }

  function syncStageRect(rect: StageRect | null) {
    const targetWindow = elFrame.contentWindow;
    if (!rect || !targetWindow) {
      return;
    }

    if (isSameStageRect(lastStageRect, rect)) {
      return;
    }

    lastStageRect = rect;
    sendStageRect({
      rect,
      targetWindow,
      targetOrigin: FRAME_ORIGIN
    });
  }

  return { toggle };
}

function isSameStageRect(prev: StageRect | null, next: StageRect) {
  return prev !== null
    && prev.left === next.left
    && prev.top === next.top
    && prev.width === next.width
    && prev.height === next.height;
}

function buildFrame() {
  const elFrame = document.createElement("iframe");
  elFrame.src = browser.runtime.getURL(`/${FRAME_PATH}`);
  elFrame.allow = "autoplay; gamepad; keyboard-map";
  elFrame.className = "doom-frame";
  return elFrame;
}
