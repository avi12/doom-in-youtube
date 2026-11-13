# What this is

A WXT MV3 Chrome extension. On `youtube.com`, clicking the toolbar icon renders ONE live DOOM
across the whole viewport, visible only through the video thumbnails - each thumbnail is a
peephole onto the same full-screen game. Sound, keyboard and mouse drive that single instance.

Architecture: a MAIN-world content script tracks thumbnail rects via YouTube's Polymer and clips
a single full-viewport `chrome-extension://` iframe (running js-dos DOOM) to the union of those
rects with an SVG `clipPath`. The iframe is extension-origin so the extension CSP - not YouTube's -
governs its WASM. A background service worker toggles it on the action click and manages a
`declarativeNetRequest` rule that relaxes YouTube's `frame-src` so the iframe can embed.

# Stack
- pnpm
- WXT extension framework, Manifest V3
- TypeScript (100% type safety, let TypeScript infer return types - never write them explicitly)
- js-dos v8 as the DOOM engine, VENDORED under `src/public/vendor` (not an npm dependency)
- Chromium (Chrome, Edge, Opera) MV3
- No Svelte, no backend, no Firebase - this is DOM + canvas only

# Dependencies
- Minimize supply-chain attack surface: MINIMIZE dependencies, do not forbid them. For a trivial
  utility that a few lines of code can replace, implement it yourself instead of pulling a package.
  For a real, non-trivial concern (e.g. typed cross-context messaging via `@webext-core/messaging`),
  a well-scoped dependency is fine
- Vendored js-dos is committed and reviewable under `src/public/vendor`. devDependencies are the
  build/lint toolchain (wxt, oxlint, fallow, tsgo)
- Never add a dependency for something a few lines of code can do

# Code style
- Apply DRY, separation of concerns, and tree-shaking-friendly structure everywhere: small
  single-purpose modules with named exports (no side effects at import time, no barrel re-exports
  that defeat tree shaking), each concern in its own file, zero duplicated logic
- Use early returns for readability and to keep nesting flat - guard and bail at the top
- Use the `browser` namespace
- Use functional programming
- Use async/await whenever possible
- Minimize indentation
- Use `for-of` instead of `.forEach`, and a plain `for` loop instead of `.reduce()`
- Use modern browser and CSS features
- Prefer semantic HTML elements over `div`/`span` with a `role`; only add ARIA when no native
  element carries the semantics, and never ARIA that restates the element
- Avoid `window.` prefixes unless it increases readability
- Avoid `setTimeout` unless absolutely necessary
- Avoid comments unless absolutely necessary - prefer descriptive names; default to zero comments
- Don't use em dashes - use regular hyphens
- If a callback arrow function has a typed param, don't annotate the type explicitly
- Functions with 2+ params take a single destructured object param (`f({ a, b })`) so every argument
  is self-documenting. EXEMPT: key/value accessors, and framework/runtime-positional callbacks
  (`.map`/`.filter`/`.forEach`/`addEventListener`, event handlers with first param `e`)
- Avoid nested try/catch - flatten with early returns or extracted functions
- Extract an `if`/ternary/guard condition into a descriptive `is`-prefixed boolean rather than
  inlining the raw expression
- Always prefer the `@/…` path alias over parent-relative (`../`) imports. Same-directory `./foo`
  stays relative

# Naming conventions
- Variables and functions: `camelCase`, full words (no abbreviations)
- Module-level constants: `SCREAMING_SNAKE_CASE`
- Event handler first parameter is always `e`

## Variable prefixes
- Element: `el` prefix (e.g. `elButton`)
- Index: `i` prefix (e.g. `iTile`), or bare `i` in a for loop
- Boolean: `is` prefix, phrased positively (`isActive`, not `isDisabled`)

# Hardcoded values
- Strings: use enums; if no enum fits, use a descriptive `SCREAMING_SNAKE_CASE` constant
- Numbers: use a descriptive `SCREAMING_SNAKE_CASE` constant

# CSS
- Use native CSS nesting - nest child and state selectors under their parent
- Always respect `prefers-reduced-motion` - never ship an ungated transition/animation
- Never the `transform` shorthand - use individual `translate`/`rotate`/`scale` properties
- Never hand-write vendor prefixes

# UI copy
- No full stops at end of messages
- Informal tone

# Linting
After completing a bug fix, feature, or refactor, run the full linter suite - never skip one:
- `pnpm lint` runs `oxlint --type-aware --fix` - oxlint owns logic/type-aware
  rules, ESLint owns the stylistic ones; always run with `--fix`
- `pnpm stylelint` runs `stylelint "**/*.css" --fix` for any CSS change - config extends
  `stylelint-config-ccb` (shared with youtube-time-manager), pinned deps in devDependencies
- `pnpm check` runs `tsgo --noEmit` for 100% type safety
- After every feature/refactor run a `pnpm fallow` dead-code audit (= `fallow audit --base HEAD`)
  and clean up newly orphaned imports/helpers/exports/files by hand. Never `pnpx fallow fix`.
  fallow is PINNED to 2.103.0 - always the local bin, never `pnpx`/`pnpm dlx`

# Dev server
Never build manually - the WXT dev server auto-rebuilds and hot-reloads on any `src/` change.
`pnpm ext:dev` (= `wxt`). Only build when explicitly asked.
