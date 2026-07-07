# Web Image Editor

A private, browser-based image editor. All editing happens locally — no server uploads, no accounts.

Built with React, TypeScript, Vite, and [Fabric.js](http://fabricjs.com/). Stickers powered by [OpenMoji](https://openmoji.org/) (CC BY-SA 4.0).

## Features

- Open PNG, JPEG, WebP, GIF, BMP, SVG, AVIF, and TIFF files
- Draw, erase, crop, resize, and flip
- Add text, shapes (rectangle, circle, line, arrow, star, callout), and OpenMoji stickers
- Image adjustments: brightness, contrast, saturation, blur, pixelate, grayscale, sepia
- Export as PNG, JPEG, WebP, or SVG with configurable quality and scale
- Keyboard shortcuts: Ctrl+Z undo, Ctrl+Y redo, Delete to remove selection
- Drag-and-drop file opening
- Undo / redo history

## Local Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Deployment

Deploys automatically to GitHub Pages on push to `main` via the included GitHub Actions workflow.

## License

[MIT](LICENSE)
