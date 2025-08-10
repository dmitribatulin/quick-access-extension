/* Build PNG icons from SVG sources for Marketplace listing */
const fs = require('fs');
const path = require('path');

let sharp = null;
try { sharp = require('sharp'); } catch {}

let canvas = null;
try { canvas = require('canvas'); } catch {}

const root = path.resolve(__dirname, '..');
const mediaDir = path.join(root, 'media');
const svgLight = path.join(mediaDir, 'extension-icon-light.svg');
const outPng = path.join(mediaDir, 'extension-icon-light.png');

async function rasterizeWithSharp(svgPath, outPath, size = 256) {
  await sharp(svgPath, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function rasterizeWithCanvas(svgPath, outPath, size = 256) {
  const { createCanvas, loadImage } = canvas;
  const svg = fs.readFileSync(svgPath);
  const img = await loadImage('data:image/svg+xml;base64,' + svg.toString('base64'));
  const canvasEl = createCanvas(size, size);
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const scale = Math.min(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.drawImage(img, x, y, w, h);
  fs.writeFileSync(outPath, canvasEl.toBuffer('image/png'));
}

(async () => {
  try {
    if (!fs.existsSync(svgLight)) {
      console.warn('[build-icons] SVG source not found:', svgLight);
      process.exit(0);
    }
    if (sharp) {
      await rasterizeWithSharp(svgLight, outPng, 256);
      console.log('[build-icons] Wrote', outPng, '(sharp)');
      process.exit(0);
    }
    if (canvas && canvas.createCanvas && canvas.loadImage) {
      await rasterizeWithCanvas(svgLight, outPng, 256);
      console.log('[build-icons] Wrote', outPng, '(canvas)');
      process.exit(0);
    }
    console.warn('[build-icons] No rasterizer found (install devDependency "sharp" or "canvas"). Skipping PNG generation.');
    // Do not fail the build if rasterizer is not available.
    process.exit(0);
  } catch (e) {
    console.error('[build-icons] Failed:', e);
    process.exit(1);
  }
})();
