import sharp from 'sharp'
import { fileURLToPath } from 'url'

const INPUT = fileURLToPath(new URL('../src/assets/header-flower.png', import.meta.url))
const OUTPUT = fileURLToPath(new URL('../src/assets/header-flower-purple.png', import.meta.url))

const BG = { r: 0xff, g: 0xb7, b: 0xc5 } // #FFB7C5
const PETAL = { r: 0xb3, g: 0x6a, b: 0xff } // soft purple
const OUTLINE = { r: 0x6f, g: 0x2d, b: 0xd6 } // darker purple outline

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

  if (a < 8) {
    buf[i] = BG.r
    buf[i + 1] = BG.g
    buf[i + 2] = BG.b
    buf[i + 3] = 255
    continue
  }

  if (r > 235 && g > 235 && b > 235) {
    buf[i] = BG.r
    buf[i + 1] = BG.g
    buf[i + 2] = BG.b
    buf[i + 3] = 255
    continue
  }

  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
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

