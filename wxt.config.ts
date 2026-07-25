import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  manifest: {
    name: "DOOM in YouTube",
    description: "Click the icon and every YouTube thumbnail becomes a peephole onto one live DOOM",
    action: {
      default_title: "Play DOOM through the thumbnails"
    },
    permissions: ["activeTab", "scripting"],
    host_permissions: ["https://www.youtube.com/*"],
    web_accessible_resources: [
      {
        resources: ["doom.html", "vendor/*", "assets/*"],
        matches: ["https://www.youtube.com/*"]
      }
    ],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    }
  }
});
