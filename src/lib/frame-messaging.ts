const DOOM_FRAME_ID = "doom-in-youtube-frame";

export enum FrameMessage {
  Ready = "doom:ready",
  Deactivate = "doom:deactivate",
  Released = "doom:released"
}

interface FrameEnvelope {
  source: typeof DOOM_FRAME_ID;
  message: FrameMessage;
}

export function postToFrame({ target, message }: {
  target: Window;
  message: FrameMessage;
}) {
  const envelope: FrameEnvelope = {
    source: DOOM_FRAME_ID,
    message
  };
  target.postMessage(envelope, "*");
}

export function readFrameMessage(e: MessageEvent): FrameMessage | null {
  const data: unknown = e.data;
  if (!isFrameEnvelope(data)) {
    return null;
  }

  return data.message;
}

function isFrameEnvelope(data: unknown): data is FrameEnvelope {
  return typeof data === "object" && data !== null && "source" in data && data.source === DOOM_FRAME_ID;
}
