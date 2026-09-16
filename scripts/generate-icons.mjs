#!/usr/bin/env node
/**
 * Generates simple dark/red Frida mark PNGs for the PWA.
 * Pure Node (zlib) — no extra deps.
 */
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/icons')

const BG = [10, 10, 10, 255]
const RED = [196, 30, 58, 255]
const RED_HOT = [255, 45, 85, 255]

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(size, pixels) {
  // pixels: Uint8Array RGBA length size*size*4
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filter none
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

function blend(dst, i, r, g, b, a) {
  if (a <= 0) return
  const da = dst[i + 3] / 255
  const sa = a
  const outA = sa + da * (1 - sa)
  if (outA <= 0) return
  dst[i] = Math.round((r * sa + dst[i] * da * (1 - sa)) / outA)
  dst[i + 1] = Math.round((g * sa + dst[i + 1] * da * (1 - sa)) / outA)
  dst[i + 2] = Math.round((b * sa + dst[i + 2] * da * (1 - sa)) / outA)
  dst[i + 3] = Math.round(outA * 255)
}

function fillRect(px, size, r, g, b, a) {
  for (let i = 0; i < size * size; i++) {
    const o = i * 4
    px[o] = r
    px[o + 1] = g
    px[o + 2] = b
    px[o + 3] = a
  }
}

function fillCircle(px, size, cx, cy, radius, r, g, b) {
  const x0 = Math.max(0, Math.floor(cx - radius - 1))
  const x1 = Math.min(size - 1, Math.ceil(cx + radius + 1))
  const y0 = Math.max(0, Math.floor(cy - radius - 1))
  const y1 = Math.min(size - 1, Math.ceil(cy + radius + 1))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      const cover = Math.max(0, Math.min(1, radius + 0.55 - d))
      if (cover > 0) blend(px, (y * size + x) * 4, r, g, b, cover)
    }
  }
}

function strokeCircle(px, size, cx, cy, radius, width, r, g, b) {
  const x0 = Math.max(0, Math.floor(cx - radius - width - 1))
  const x1 = Math.min(size - 1, Math.ceil(cx + radius + width + 1))
  const y0 = Math.max(0, Math.floor(cy - radius - width - 1))
  const y1 = Math.min(size - 1, Math.ceil(cy + radius + width + 1))
  const half = width / 2
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
      const cover = Math.max(0, Math.min(1, half + 0.55 - Math.abs(d - radius)))
      if (cover > 0) blend(px, (y * size + x) * 4, r, g, b, cover)
    }
  }
}

function drawMark(size, { pad = 0.14 } = {}) {
  const px = Buffer.alloc(size * size * 4)
  fillRect(px, size, ...BG)
  const cx = size / 2
  const cy = size / 2
  const usable = size * (1 - pad * 2)
  const outer = usable * 0.42
  const stroke = Math.max(2, usable * 0.085)
  const inner = usable * 0.13
  strokeCircle(px, size, cx, cy, outer, stroke, RED[0], RED[1], RED[2])
  fillCircle(px, size, cx, cy, inner, RED_HOT[0], RED_HOT[1], RED_HOT[2])
  return px
}

async function writePng(name, size, pad) {
  const png = encodePng(size, drawMark(size, { pad }))
  const dest = join(outDir, name)
  await new Promise((resolve, reject) => {
    const ws = createWriteStream(dest)
    ws.on('finish', resolve)
    ws.on('error', reject)
    ws.end(png)
  })
  console.log('wrote', dest, `(${size}x${size})`)
}

await mkdir(outDir, { recursive: true })
await writePng('icon-192.png', 192, 0.12)
await writePng('icon-512.png', 512, 0.12)
await writePng('icon-512-maskable.png', 512, 0.22)
await writePng('apple-touch-icon.png', 180, 0.14)
