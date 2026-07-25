import { TOGGLE_ACTION } from "@/lib/messaging";

export default defineBackground(() => {
  browser.action.onClicked.addListener(tab => {
    if (tab.id !== undefined) {
      browser.tabs.sendMessage(tab.id, TOGGLE_ACTION).catch(() => {});
    }
  });
});
