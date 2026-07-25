import { defineExtensionMessaging } from "@webext-core/messaging";

export const TOGGLE_EVENT = "doom-in-youtube:toggle";

interface ToggleProtocol {
  toggleDoom(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ToggleProtocol>();
