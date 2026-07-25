import { ExtensionMessage, onMessage } from "@/lib/extension-messaging";
import { createOverlay } from "@/lib/overlay";

export default defineContentScript({
  matches: ["https://www.youtube.com/*"],
  main() {
    const overlay = createOverlay();

    onMessage(ExtensionMessage.ToggleDoom, () => {
      overlay.toggle();
    });
  }
});
