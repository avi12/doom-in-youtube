import { ExtensionMessage, sendMessage } from "@/lib/extension-messaging";

async function toggleDoom(tabId: number) {
  const isDelivered = await sendMessage(ExtensionMessage.ToggleDoom, undefined, tabId).then(
    () => true,
    () => false
  );
  if (isDelivered) {
    return;
  }

  await browser.scripting.executeScript({
    target: {
      tabId
    },
    files: ["/content-scripts/youtube.js"]
  });
  await sendMessage(ExtensionMessage.ToggleDoom, undefined, tabId);
}

export default defineBackground(() => {
  browser.action.onClicked.addListener(tab => {
    const { id: tabId } = tab;
    if (!tabId) {
      return;
    }

    toggleDoom(tabId).catch(() => {});
  });
});
