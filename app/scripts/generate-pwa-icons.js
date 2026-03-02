import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const sizes = [192, 512];

// Inline SVG matching favicon style (gradient rect, no problematic text)
function getSvg(size) {
  const pad = Math.round(size * 0.1);
  const r = Math.round(size * 0.13);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5c47f5"/>
      <stop offset="1" stop-color="#f05aaa"/>
    </linearGradient>
  </defs>
  <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${r}" fill="url(#bg)"/>
</svg>`
  );
}

async function generate() {
  for (const size of sizes) {
    const outPath = join(publicDir, `icon-${size}.png`);
    const svg = getSvg(size);
    await sharp(svg).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
