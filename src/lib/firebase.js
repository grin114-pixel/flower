import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
const explicitBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim()

function normalizeBucket(bucket) {
  const b = String(bucket || '').trim()
  if (!b) return ''
  // allow "gs://bucket"
  const noProto = b.startsWith('gs://') ? b.slice(5) : b
  return noProto
}

export const normalizedExplicitBucket = normalizeBucket(explicitBucket) || ''
export const rawExplicitBucket = String(explicitBucket || '').trim()
export const defaultBucket = projectId ? `${projectId}.appspot.com` : ''

function uniqueBuckets(buckets) {
  const out = []
  const seen = new Set()
  for (const b of buckets) {
    const x = String(b || '').trim()
    if (!x) continue
    if (seen.has(x)) continue
    seen.add(x)
    out.push(x)
  }
  return out
}

// 성능 때문에 "정확히 입력한 값"을 1순위로 사용
export const bucketsToTry = uniqueBuckets([rawExplicitBucket, normalizedExplicitBucket, defaultBucket])

const storageBucket = bucketsToTry[0] || undefined

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const firebaseApp = app

export function storageForBucket(bucket) {
  const b = String(bucket || '').trim()
  if (!b) return getStorage(app)
  const noProto = b.startsWith('gs://') ? b.slice(5) : b
  return getStorage(app, `gs://${noProto}`)
}

export const storage = storageBucket ? storageForBucket(storageBucket) : getStorage(app)

