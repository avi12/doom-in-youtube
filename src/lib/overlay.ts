import { createClip } from "@/lib/clip";
import { FrameMessage, postToFrame, readFrameMessage } from "@/lib/messaging";
import "@/lib/overlay.css";
import { collectVisibleTileRects } from "@/lib/tiles";

const FRAME_PATH = "doom.html";
const ROOT_ACTIVE_CLASS = "doom-active";

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function createOverlay() {
  let isOn = false;
  let isActive = false;
  let rafId = 0;
  let latestRects: DOMRect[] = [];

  const clip = createClip();
  const elFrame = buildFrame();

  function enable() {
    if (isOn) {
      return;
    }

    isOn = true;
    document.documentElement.classList.add(ROOT_ACTIVE_CLASS);
    document.body.append(elFrame);
    addEventListener("message", onFrameMessage);
    document.addEventListener("pointerdown", onCapturePointerDown, true);
    document.addEventListener("click", onCaptureClick, true);
    tick();
  }

  function disable() {
    if (!isOn) {
      return;
    }

    isOn = false;
    deactivate();
    cancelAnimationFrame(rafId);
    removeEventListener("message", onFrameMessage);
    document.removeEventListener("pointerdown", onCapturePointerDown, true);
    document.removeEventListener("click", onCaptureClick, true);
    document.documentElement.classList.remove(ROOT_ACTIVE_CLASS);
    elFrame.classList.remove("is-ready");
    elFrame.remove();
    clip.update([]);
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
    latestRects = collectVisibleTileRects();
    const bounds = computeBounds(latestRects);
    if (bounds) {
      positionFrame(bounds);
      clip.update(
        toFrameLocalRects({
          rects: latestRects,
          bounds
        })
      );
    } else {
      clip.update([]);
    }

    rafId = requestAnimationFrame(tick);
  }

  function positionFrame({ left, top, width, height }: Bounds) {
    elFrame.style.setProperty("--doom-x", `${left}px`);
    elFrame.style.setProperty("--doom-y", `${top}px`);
    elFrame.style.setProperty("--doom-width", `${width}px`);
    elFrame.style.setProperty("--doom-height", `${height}px`);
  }

  function activate() {
    if (isActive) {
      return;
    }

    isActive = true;
    elFrame.classList.add("is-active");
    elFrame.focus();
  }

  function deactivate() {
    if (!isActive) {
      return;
    }

    isActive = false;
    elFrame.classList.remove("is-active");

    if (elFrame.contentWindow) {
      postToFrame({
        target: elFrame.contentWindow,
        message: FrameMessage.Deactivate
      });
    }
  }

  function isGuardedTilePointer(e: MouseEvent) {
    return !isActive && isPointInsideTile({
      x: e.clientX,
      y: e.clientY,
      rects: latestRects
    });
  }

  function onCapturePointerDown(e: PointerEvent) {
    if (!isGuardedTilePointer(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  function onCaptureClick(e: MouseEvent) {
    if (!isGuardedTilePointer(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    activate();
  }

  function onFrameMessage(e: MessageEvent) {
    const message = readFrameMessage(e);
    if (message === FrameMessage.Ready) {
      elFrame.classList.add("is-ready");
      return;
    }

    if (message === FrameMessage.Released) {
      deactivate();
    }
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

function computeBounds(rects: DOMRect[]) {
  if (rects.length === 0) {
    return null;
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;

  for (const rect of rects) {
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return {
    left,
    top,
    width: right - left,
    height: bottom - top
  } satisfies Bounds;
}

function toFrameLocalRects({ rects, bounds }: {
  rects: DOMRect[];
  bounds: Bounds;
}) {
  return rects.map(rect => new DOMRect(rect.left - bounds.left, rect.top - bounds.top, rect.width, rect.height));
}

function isPointInsideTile({ x, y, rects }: {
  x: number;
  y: number;
  rects: DOMRect[];
}) {
  for (const rect of rects) {
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return true;
    }
  }

  return false;
}
