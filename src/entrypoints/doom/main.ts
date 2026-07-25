import { FrameMessage, postToFrame, readFrameMessage } from "@/lib/frame-messaging";

const EMULATOR_PATH_PREFIX = "/vendor/emulators/";
const DOOM_BUNDLE_URL = "/assets/doom.jsdos";
const DEFAULT_VOLUME = 0.6;

function bootDoom() {
  const elStage = document.querySelector<HTMLElement>("#stage");
  if (!elStage) {
    return;
  }

  Dos(elStage, {
    url: DOOM_BUNDLE_URL,
    pathPrefix: EMULATOR_PATH_PREFIX,
    kiosk: true,
    autoStart: true,
    mouseCapture: true,
    noCloud: true,
    volume: DEFAULT_VOLUME
  });

  wireParentBridge();
  notifyReady();
}

function wireParentBridge() {
  addEventListener("message", e => {
    const message = readFrameMessage(e);
    if (message === FrameMessage.Deactivate && document.pointerLockElement) {
      document.exitPointerLock();
    }
  });

  document.addEventListener("pointerlockchange", () => {
    if (!document.pointerLockElement) {
      postToParent(FrameMessage.Released);
    }
  });
}

function notifyReady() {
  postToParent(FrameMessage.Ready);
}

function postToParent(message: FrameMessage) {
  if (parent !== self) {
    postToFrame({
      target: parent,
      message
    });
  }
}

bootDoom();
