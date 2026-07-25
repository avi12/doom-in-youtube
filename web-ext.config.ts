import { resolve } from "node:path";
import { defineWebExtConfig } from "wxt";

export default defineWebExtConfig({
  chromiumProfile: resolve(process.env.LOCALAPPDATA ?? ".", "doom-dev-profile"),
  keepProfileChanges: true,
  startUrls: ["https://www.youtube.com/results?search_query=doom+gameplay"],
  chromiumArgs: ["--remote-debugging-port=9333", "--no-first-run", "--no-default-browser-check"]
});
