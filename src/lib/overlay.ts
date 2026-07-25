import { createClip } from "@/lib/clip";
import { FrameMessage, postToFrame, readFrameMessage } from "@/lib/frame-messaging";
import "@/lib/overlay.css";
import { collectVisibleTilePeepholes } from "@/lib/tiles";

const FRAME_PATH = "doom.html";
const ROOT_ACTIVE_CLASS = "doom-active";

export function createOverlay() {
  let isOn = false;
  let isActive = false;
  let rafId = 0;
  let latestPeepholes: ReturnType<typeof collectVisibleTilePeepholes> = [];

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
    bindListeners(true);
    tick();
  }

  function disable() {
    if (!isOn) {
      return;
    }

    isOn = false;
    deactivate();
    cancelAnimationFrame(rafId);
    bindListeners(false);
    document.documentElement.classList.remove(ROOT_ACTIVE_CLASS);
    elFrame.classList.remove("is-ready");
    elFrame.remove();
    clip?.destroy();
    clip = null;
  }

  function toggleCapture<EventName extends keyof DocumentEventMap>({ type, handler, isBinding }: {
    type: EventName;
    handler: (event: DocumentEventMap[EventName]) => void;
    isBinding: boolean;
  }) {
    if (isBinding) {
      document.addEventListener(type, handler, true);
      return;
    }

    document.removeEventListener(type, handler, true);
  }

  function bindListeners(isBinding: boolean) {
    if (isBinding) {
      addEventListener("message", onFrameMessage);
    } else {
      removeEventListener("message", onFrameMessage);
    }

    toggleCapture({
      type: "pointerdown",
      handler: onCapturePointerDown,
      isBinding
    });
    toggleCapture({
      type: "click",
      handler: onCaptureClick,
      isBinding
    });
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
    latestPeepholes = collectVisibleTilePeepholes();
    clip?.update(latestPeepholes);
    rafId = requestAnimationFrame(tick);
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
      rects: latestPeepholes.map(peephole => peephole.rect)
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
