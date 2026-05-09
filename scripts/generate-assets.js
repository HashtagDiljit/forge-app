#!/usr/bin/env node
// Generates placeholder PNG assets required by app.json.
// Runs automatically via the postinstall npm hook.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
}

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = t[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([t, data]);
  return Buffer.concat([u32(data.length), t, data, u32(crc32(combined))]);
}

function makePNG(width, height, r, g, b) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  const ihdr = pngChunk('IHDR', ihdrData);

  const row = Buffer.from([0, ...Array(width).fill([r, g, b]).flat()]);
  const raw = Buffer.concat(Array(height).fill(row));
  const idat = pngChunk('IDAT', zlib.deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const assets = [
  { name: 'icon.png',          w: 64,  h: 64,  r: 8,   g: 10,  b: 12  },
  { name: 'adaptive-icon.png', w: 64,  h: 64,  r: 0,   g: 212, b: 255 },
  { name: 'splash.png',        w: 64,  h: 64,  r: 8,   g: 10,  b: 12  },
  { name: 'splash-icon.png',   w: 64,  h: 64,  r: 0,   g: 212, b: 255 },
  { name: 'favicon.png',       w: 32,  h: 32,  r: 8,   g: 10,  b: 12  },
];

let generated = 0;
for (const { name, w, h, r, g, b } of assets) {
  const out = path.join(assetsDir, name);
  fs.writeFileSync(out, makePNG(w, h, r, g, b));
  generated++;
}
console.log(`forge-app: generated ${generated} asset placeholder(s) in assets/`);
