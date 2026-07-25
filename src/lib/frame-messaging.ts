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

// a single peephole rect (a thumbnail), in the parent's viewport coordinates
export interface StagePeephole {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

// the frame needs the peepholes as well as the stage rect: a WebGL canvas is its own compositor
// layer and escapes the parent iframe's clip-path in the thin gutters between thumbnails, so the
// frame re-clips its canvas to the same peepholes from the inside
export interface StageState {
  rect: StageRect;
  peepholes: StagePeephole[];
}

// the stage state streams on every layout change (scroll, resize, thumbnail load), so it
// rides a raw one-way postMessage channel instead of the request/response messaging above,
// which would leak an unanswered response listener per send across the frame boundary
const STAGE_STATE_TYPE = "doom-in-youtube:stage-state";

export function sendStageState({ state, targetWindow, targetOrigin }: {
  state: StageState;
  targetWindow: Window;
  targetOrigin: string;
}) {
  targetWindow.postMessage({
    type: STAGE_STATE_TYPE,
    state
  }, targetOrigin);
}

export function onStageState({ handler, allowedOrigin }: {
  handler: (state: StageState) => void;
  allowedOrigin: string;
}) {
  function listener(e: MessageEvent) {
    const isStageState = e.origin === allowedOrigin && e.data?.type === STAGE_STATE_TYPE;
    if (!isStageState) {
      return;
    }

    handler(e.data.state);
  }

  addEventListener("message", listener);
  return () => removeEventListener("message", listener);
}
