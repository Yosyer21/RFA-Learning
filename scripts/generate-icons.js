// ═══════════════════════════════════════════════════════════
// RFA.Learning — Generador de iconos PWA
// Crea iconos PNG (192x192 y 512x512) sin dependencias externas
// Uso: node scripts/generate-icons.js
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── Generador de PNG mínimo (RGBA) ──
function createPng(width, height, pixelFn) {
  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const offset = rowStart + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const chunks = [];
  chunks.push(Buffer.concat([Buffer.from('IHDR', 'ascii'), ihdr]));
  chunks.push(Buffer.concat([Buffer.from('IDAT', 'ascii'), zlib.deflateSync(raw)]));
  chunks.push(Buffer.from('IEND', 'ascii'));

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const body = Buffer.concat(
    chunks.map((chunk) => {
      const type = chunk.slice(0, 4);
      const data = chunk.slice(4);
      const crc = crc32(Buffer.concat([type, data]));
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length, 0);
      const crcBuf = Buffer.alloc(4);
      crcBuf.writeUInt32BE(crc >>> 0, 0);
      return Buffer.concat([len, type, data, crcBuf]);
    })
  );

  return Buffer.concat([signature, body]);
}

// ── CRC32 ──
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ 0xffffffff;
}

// ── Diseño del icono: fondo degradado + "RFA" ──
function drawIcon(size) {
  const scale = size / 512;
  const center = size / 2;

  // Colores del tema
  const primary = [58, 123, 255]; // #3a7bff
  const accent = [50, 180, 255]; // #32b4ff
  const bgDark = [6, 11, 24]; // #060b18

  return createPng(size, size, (x, y) => {
    const dx = x - center;
    const dy = y - center;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = center;

    // Fondo degradado radial (primary -> accent)
    const t = Math.min(1, dist / maxDist);
    const r = Math.round(primary[0] + (accent[0] - primary[0]) * t);
    const g = Math.round(primary[1] + (accent[1] - primary[1]) * t);
    const b = Math.round(primary[2] + (accent[2] - primary[2]) * t);

    // Esquinas redondeadas (máscara)
    const corner = size * 0.18;
    const inCorner =
      (x < corner && y < corner) ||
      (x > size - corner && y < corner) ||
      (x < corner && y > size - corner) ||
      (x > size - corner && y > size - corner);
    if (inCorner) {
      const cx = x < corner ? corner : size - corner;
      const cy = y < corner ? corner : size - corner;
      const cd = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (cd > corner) return [0, 0, 0, 0];
    }

    // Dibujar "RFA" como barras estilizadas (simplificado)
    // Barra vertical izquierda
    const barW = size * 0.09;
    const barH = size * 0.5;
    const barX = size * 0.28;
    const barY = size * 0.25;
    if (x >= barX && x <= barX + barW && y >= barY && y <= barY + barH) {
      return [255, 255, 255, 255];
    }

    // Barra vertical derecha
    const barX2 = size * 0.63;
    if (x >= barX2 && x <= barX2 + barW && y >= barY && y <= barY + barH) {
      return [255, 255, 255, 255];
    }

    // Barra horizontal (conecta)
    const barH2 = size * 0.09;
    const barY2 = size * 0.25;
    if (x >= barX && x <= barX2 + barW && y >= barY2 && y <= barY2 + barH2) {
      return [255, 255, 255, 255];
    }

    // Barra diagonal (para la "A")
    // Línea diagonal izquierda de la A
    const diagX = size * 0.36;
    const diagY = size * 0.25;
    const diagLen = size * 0.5;
    for (let i = 0; i < diagLen; i++) {
      const px = diagX + i * 0.5;
      const py = diagY + i * 0.5;
      if (Math.abs(x - px) < barW / 2 && Math.abs(y - py) < barW / 2) {
        return [255, 255, 255, 255];
      }
    }

    // Línea diagonal derecha de la A
    const diagX2 = size * 0.72;
    for (let i = 0; i < diagLen; i++) {
      const px = diagX2 - i * 0.5;
      const py = diagY + i * 0.5;
      if (Math.abs(x - px) < barW / 2 && Math.abs(y - py) < barW / 2) {
        return [255, 255, 255, 255];
      }
    }

    // Barra horizontal de la A
    const barY3 = size * 0.5;
    if (x >= size * 0.36 && x <= size * 0.72 && y >= barY3 && y <= barY3 + barH2) {
      return [255, 255, 255, 255];
    }

    return [r, g, b, 255];
  });
}

// ── Main ──
const outDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
];

sizes.forEach(({ size, file }) => {
  const png = drawIcon(size);
  const outPath = path.join(outDir, file);
  fs.writeFileSync(outPath, png);
  console.log(`✓ Generado ${file} (${size}x${size}) — ${png.length} bytes`);
});

console.log('Iconos PWA generados correctamente.');
