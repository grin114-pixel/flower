import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

// 헤더 아이콘(꽃그림)을 홈화면 아이콘으로 사용
const sourcePath = path.join(root, 'src', 'assets', 'header-flower.png')
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
  const flower = await sharp(sourcePath)
    .resize(inner, inner, { fit: 'contain' })
    .png()
    .toBuffer()

  await canvas
    .composite([{ input: flower, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, filename))
}

await buildOne(512, 'pwa-512.png')
await buildOne(192, 'pwa-192.png')
await buildOne(180, 'pwa-icon.png') // iOS 홈화면(apple-touch-icon)용

console.log('OK: pwa-512.png, pwa-192.png, pwa-icon.png')

