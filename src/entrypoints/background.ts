import { sendMessage } from "@/lib/extension-messaging";

export default defineBackground(() => {
  browser.action.onClicked.addListener(tab => {
    if (tab.id === undefined) {
      return;
    }

    sendMessage("toggleDoom", undefined, tab.id).catch(() => {});
  });
});
