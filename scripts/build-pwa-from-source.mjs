import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// 헤더 아이콘(꽃그림)을 홈화면 아이콘으로 사용
// (원본 header-flower.png에는 테두리가 있어, 리컬러된 버전을 사용)
const sourcePath = path.join(root, 'src', 'assets', 'header-flower-hotpink.png')
const outDir = path.join(root, 'public')

const BG = '#FFB7C5' // 메인색

async function buildOne(size, filename) {
  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })

  // 원본 꽃 아이콘을 크게 확대해서 중앙 배치
  const scale = 0.78
  const inner = Math.round(size * scale)
  const resized = await sharp(sourcePath)
    .resize(inner, inner, { fit: 'contain' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // 일부 소스 이미지에 포함된 얇은 검은 테두리(라인) 제거
  const buf = Buffer.from(resized.data)
  const { width, height, channels } = resized.info
  for (let i = 0; i < width * height * channels; i += channels) {
    const r = buf[i]
    const g = buf[i + 1]
    const b = buf[i + 2]
    const a = buf[i + 3]
    if (a < 5) continue
    // very dark pixels -> transparent
    if (r < 35 && g < 35 && b < 35) {
      buf[i + 3] = 0
    }
  }

  const flower = await sharp(buf, { raw: { width, height, channels: 4 } }).png().toBuffer()

  await canvas
    .composite([{ input: flower, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, filename))
}

await buildOne(512, 'pwa-512.png')
await buildOne(192, 'pwa-192.png')
await buildOne(180, 'pwa-icon.png') // iOS 홈화면(apple-touch-icon)용

console.log('OK: pwa-512.png, pwa-192.png, pwa-icon.png')

