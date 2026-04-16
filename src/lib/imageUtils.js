import imageCompression from 'browser-image-compression'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { bucketsToTry, storage, storageForBucket } from './firebase'

function safeBaseName(name) {
  const base = String(name || 'image').replace(/[/\\]/g, '_')
  const cleaned = base.replace(/[^\w.\-가-힣]/g, '_')
  return cleaned.slice(0, 120) || 'image.jpg'
}

function pathFromDownloadUrl(url) {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('firebasestorage.googleapis.com')) return null
    const i = u.pathname.indexOf('/o/')
    if (i === -1) return null
    const encoded = u.pathname.slice(i + 3)
    return decodeURIComponent(encoded)
  } catch {
    return null
  }
}

async function compressFile(file) {
  const options = {
    // 업로드 속도 우선: 더 작은 해상도/용량으로 압축
    maxSizeMB: 0.12,
    maxWidthOrHeight: 720,
    useWebWorker: true,
    initialQuality: 0.62,
  }
  try {
    return await imageCompression(file, options)
  } catch {
    try {
      return await imageCompression(file, { ...options, maxSizeMB: 0.2 })
    } catch {
      if (file.size <= 6 * 1024 * 1024) return file
      throw new Error('이미지 압축에 실패했습니다. 용량이 작은 사진으로 다시 시도해 주세요.')
    }
  }
}

async function runWithConcurrency(items, limit, worker) {
  const arr = Array.from(items || [])
  const results = new Array(arr.length)
  let nextIndex = 0

  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const i = nextIndex
      nextIndex += 1
      if (i >= arr.length) return
      results[i] = await worker(arr[i], i)
    }
  })

  await Promise.all(runners)
  return results
}

export async function compressAndUpload(file, { folder = 'flowers' } = {}) {
  const blob = await compressFile(file)
  const name = `${Date.now()}_${safeBaseName(file.name)}`
  const fileName = `${folder}/${name}`
  const mime = blob.type || file.type || 'image/jpeg'

  // storage는 이미 bucketsToTry[0] 기준으로 생성됨 → 중복 재시도 방지
  const storages = [storage, ...bucketsToTry.slice(1).map((b) => storageForBucket(b))]
  let lastErr = null

  for (const st of storages) {
    const storageRef = ref(st, fileName)
    try {
      const url = await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob, { contentType: mime })
        const timer = setTimeout(() => {
          try {
            task.cancel()
          } catch {
            // ignore
          }
          reject(new Error('TIMEOUT'))
        }, 25000)

        task.on(
          'state_changed',
          () => {},
          (err) => {
            clearTimeout(timer)
            reject(err)
          },
          async () => {
            clearTimeout(timer)
            try {
              const u = await getDownloadURL(task.snapshot.ref)
              resolve(u)
            } catch (e) {
              reject(e)
            }
          },
        )
      })
      return url
    } catch (err) {
      lastErr = err
      const code = err?.code || ''
      // 권한 문제가면 재시도해도 의미 없음
      if (code === 'storage/unauthorized') break
      // 네트워크/버킷 문제는 다음 후보 버킷으로 재시도
    }
  }

  const code = lastErr?.code || ''
  const msg = lastErr?.message || String(lastErr)

  if (msg === 'TIMEOUT' || msg?.includes?.('TIMEOUT')) {
    throw new Error(
      '이미지 업로드에 실패했습니다.\n업로드 시간이 초과됐습니다.\n\n- Firebase Console → Storage가 활성화/생성되어 있는지 확인\n- Storage Rules에서 읽기/쓰기를 허용했는지 확인\n(Firebase Console → Storage → Rules)',
    )
  }
  if (code === 'storage/unauthorized') {
    throw new Error(
      `Firebase Storage 권한 오류입니다. (${code})\nFirebase Console → Storage → Rules에서\n아래 규칙으로 변경해주세요:\n\nallow read, write: if true;`,
    )
  }
  if (code === 'storage/object-not-found' || code === 'storage/bucket-not-found') {
    throw new Error(
      `Firebase Storage 버킷을 찾지 못했습니다. (${code})\n\n- Firebase Console → Storage에서 버킷이 생성되어 있는지 확인\n- `.env`의 \`VITE_FIREBASE_STORAGE_BUCKET\` 값이 실제 버킷명인지 확인(예: \`${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com\`)`,
    )
  }

  throw new Error(`이미지 업로드 실패 (${code || 'unknown'}): ${msg}`)
}

export async function compressAndUploadMany(files, { folder = 'flowers', onProgress } = {}) {
  const arr = Array.from(files || []).filter(Boolean)

  // 너무 많은 병렬 업로드는 오히려 느려질 수 있어 2개로 제한
  let done = 0
  const urls = await runWithConcurrency(arr, 2, async (file) => {
    const url = await compressAndUpload(file, { folder })
    done += 1
    onProgress?.({ index: Math.max(0, done - 1), total: arr.length })
    return url
  })

  return urls.filter(Boolean)
}

export async function deleteImage(url) {
  if (!url) return
  const path = pathFromDownloadUrl(url)
  if (!path) return
  try {
    await deleteObject(ref(storage, path))
  } catch {
    // ignore
  }
}

export async function deleteImages(urls) {
  const arr = Array.from(urls || []).filter(Boolean)
  await Promise.all(arr.map((u) => deleteImage(u)))
}

