import sharp from 'sharp'
import { fileURLToPath } from 'url'

const INPUT = fileURLToPath(new URL('../src/assets/header-flower.png', import.meta.url))
const OUTPUT = fileURLToPath(new URL('../src/assets/header-flower-yellow.png', import.meta.url))

const BG = { r: 0xff, g: 0xb7, b: 0xc5 } // #FFB7C5 (header main)
const PETAL = { r: 0xff, g: 0xd8, b: 0x4d } // warm yellow
const OUTLINE = { r: 0xd6, g: 0x9a, b: 0x00 } // darker yellow outline

function clamp01(x) {
  return Math.max(0, Math.min(1, x))
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

const { data, info } = await sharp(INPUT)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

const buf = Buffer.from(data)
const { width, height, channels } = info

for (let i = 0; i < width * height * channels; i += channels) {
  const r = buf[i]
  const g = buf[i + 1]
  const b = buf[i + 2]
  const a = buf[i + 3]

  // treat fully transparent as background
  if (a < 8) {
    buf[i] = BG.r
    buf[i + 1] = BG.g
    buf[i + 2] = BG.b
    buf[i + 3] = 255
    continue
  }

  // near-white background → header pink
  if (r > 235 && g > 235 && b > 235) {
    buf[i] = BG.r
    buf[i + 1] = BG.g
    buf[i + 2] = BG.b
    buf[i + 3] = 255
    continue
  }

  // map remaining pixels (flower) to yellow with outline contrast
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  // darker pixels → outline, lighter → petal
  const t = clamp01((lum - 0.2) / 0.7)

  buf[i] = lerp(OUTLINE.r, PETAL.r, t)
  buf[i + 1] = lerp(OUTLINE.g, PETAL.g, t)
  buf[i + 2] = lerp(OUTLINE.b, PETAL.b, t)
  buf[i + 3] = 255
}

await sharp(buf, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(OUTPUT)

console.log('OK:', OUTPUT)

