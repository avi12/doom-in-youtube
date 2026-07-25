import { defineExtensionMessaging } from "@webext-core/messaging";

export const ExtensionMessage = {
  ToggleDoom: "toggleDoom"
} as const;

interface ExtensionProtocol {
  toggleDoom(): void;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ExtensionProtocol>();
