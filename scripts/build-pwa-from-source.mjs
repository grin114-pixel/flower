import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const sourcePath = path.join(root, 'assets', 'icon-source.png')

if (!fs.existsSync(sourcePath)) {
  console.log('아이콘 소스가 없습니다:', sourcePath)
  console.log('`assets/icon-source.png` 를 추가한 뒤 다시 실행해주세요.')
  process.exit(0)
}

console.log('TODO: 아이콘 생성 스크립트는 필요시 추가 구현하세요.')
console.log('현재는 SVG 아이콘(public/pwa-icon.svg)을 사용하도록 설정돼 있습니다.')

