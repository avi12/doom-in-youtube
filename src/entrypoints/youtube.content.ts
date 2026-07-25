import { onMessage, TOGGLE_EVENT } from "@/lib/extension-messaging";
import { createOverlay } from "@/lib/overlay";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  runAt: "document_idle",
  main() {
    const overlay = createOverlay();

    onMessage("toggleDoom", () => {
      overlay.toggle();
    });
    addEventListener(TOGGLE_EVENT, () => {
      overlay.toggle();
    });
  }
});
