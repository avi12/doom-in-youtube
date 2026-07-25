import { TOGGLE_ACTION, TOGGLE_EVENT } from "@/lib/messaging";
import { createOverlay } from "@/lib/overlay";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_idle",
  main() {
    const overlay = createOverlay();

    browser.runtime.onMessage.addListener(message => {
      if (message === TOGGLE_ACTION) {
        overlay.toggle();
      }
    });

    addEventListener(TOGGLE_EVENT, () => overlay.toggle());
  }
});
