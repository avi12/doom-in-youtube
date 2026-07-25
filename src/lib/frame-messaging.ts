import { defineWindowMessaging } from "@webext-core/messaging/page";

export const FrameMessage = {
  DoomReady: "doomReady"
} as const;

interface FrameProtocol {
  doomReady(): void;
}

const FRAME_NAMESPACE = "doom-in-youtube-frame";

export const {
  sendMessage: sendFrameMessage,
  onMessage: onFrameMessage,
  removeAllListeners: removeAllFrameListeners
} = defineWindowMessaging<FrameProtocol>({
  namespace: FRAME_NAMESPACE
});

// where the DOOM frame should sit, in the parent's viewport coordinates
export interface StageRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// the stage rect streams on every layout change (scroll, resize, thumbnail load), so it
// rides a raw one-way postMessage channel instead of the request/response messaging above,
// which would leak an unanswered response listener per send across the frame boundary
const STAGE_RECT_TYPE = "doom-in-youtube:stage-rect";

export function sendStageRect({ rect, targetWindow, targetOrigin }: {
  rect: StageRect;
  targetWindow: Window;
  targetOrigin: string;
}) {
  targetWindow.postMessage({
    type: STAGE_RECT_TYPE,
    rect
  }, targetOrigin);
}

export function onStageRect({ handler, allowedOrigin }: {
  handler: (rect: StageRect) => void;
  allowedOrigin: string;
}) {
  function listener(e: MessageEvent) {
    const isStageRect = e.origin === allowedOrigin && e.data?.type === STAGE_RECT_TYPE;
    if (!isStageRect) {
      return;
    }

    handler(e.data.rect);
  }

  addEventListener("message", listener);
  return () => removeEventListener("message", listener);
}
