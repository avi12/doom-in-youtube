# Vendored js-dos patches

js-dos v8.4.1 is vendored here (not an npm dep). Two small patches were applied to
`emulators/emulators.js` so it runs inside an MV3 extension page, whose CSP is
`script-src 'self' 'wasm-unsafe-eval'` - no `'unsafe-eval'`, no `blob:` sources.

Both are the same class of problem: js-dos loads code by fetching text and running it
from an `eval`/`blob:` source, which MV3 forbids. Each patch swaps that for a real
same-origin `<script>`/module URL, which `'self'` allows.

## 1. DOSBox/libzip glue loader (was string `eval`)
`emulators.js` fetched the wdosbox/wlibzip glue JS as text and ran it with
`eval.call(window, p)`. Replaced with injecting a `<script src=e>` (the glue URL) and
awaiting its load - identical global-scope execution, no eval.

## 2. Audio worklet (was a `blob:` URL)
`createAudioPort` built the AudioWorklet from `URL.createObjectURL(new Blob([source]))`
and called `audioWorklet.addModule(<blob url>)`, which the CSP blocks. The inline worklet
source was extracted to `emulators/jsdos-audio-worklet.js` and the call changed to
`addModule("/vendor/emulators/jsdos-audio-worklet.js")`.

If js-dos is ever re-vendored, re-apply both (or re-extract the worklet) against the new build.
