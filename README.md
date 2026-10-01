# Goose Bang — playable ad

**Stack:** PixiJS 8, Spine (spine-pixi-v8), Howler.js, Vite + vite-plugin-singlefile

## Run

```bash
npm install
npm run dev     # dev server
npm run build   # production build -> dist/
```

## Build size

Single-file build: all JS, CSS, images, fonts, sounds and Spine data are inlined into `dist/index.html`.

| | Size |
|---|---|
| `dist/index.html` | 5.5 MB |
| gzipped | 3.7 MB |
