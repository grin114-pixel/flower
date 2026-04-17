import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Loader2, Star, Trash2, X } from 'lucide-react'
import { compressAndUploadMany, deleteImages } from '../lib/imageUtils'

function uniq(arr) {
  const out = []
  const seen = new Set()
  for (const x of arr) {
    if (!x) continue
    if (seen.has(x)) continue
    seen.add(x)
    out.push(x)
  }
  return out
}

export default function FlowerModal({ onClose, onSave, initialData }) {
  const isEdit = !!initialData
  const [name, setName] = useState(initialData?.name || '')
  const [imageUrls, setImageUrls] = useState(() => uniq(initialData?.image_urls || []))
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null) // { index, total }
  const fileRef = useRef()

  const removedRef = useRef(new Set())
  const initialUrls = useMemo(() => uniq(initialData?.image_urls || []), [initialData])

  useEffect(() => {
    removedRef.current = new Set()
  }, [initialData])

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean)
    if (!files.length) return

    setUploading(true)
    setUploadProgress({ index: 0, total: files.length })
    try {
      const urls = await compressAndUploadMany(files, {
        folder: 'flowers',
        onProgress: ({ index, total }) => setUploadProgress({ index, total }),
      })
      setImageUrls((prev) => uniq([...prev, ...urls]))
    } catch (err) {
      const msg = err?.message || err?.code || String(err)
      console.error('이미지 업로드 실패:', err)
      alert(`이미지 업로드에 실패했습니다.\n${msg}`)
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const moveToFront = (url) => {
    setImageUrls((prev) => {
      const arr = prev.filter((u) => u !== url)
      return [url, ...arr]
    })
  }

  const removeOne = (url) => {
    setImageUrls((prev) => prev.filter((u) => u !== url))
    if (initialUrls.includes(url)) removedRef.current.add(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return alert('꽃 이름을 입력해주세요.')
    if (uploading) return alert('이미지 업로드 중입니다. 잠시 기다려주세요.')
    setSaving(true)

    try {
      const removed = Array.from(removedRef.current)
      if (isEdit && removed.length) await deleteImages(removed)

      await onSave({
        name: name.trim(),
        image_urls: imageUrls.length ? imageUrls : [],
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>{isEdit ? '꽃 수정' : '꽃 등록'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            aria-label="이미지 첨부"
            title="이미지 첨부"
          >
            {uploading ? <Loader2 size={16} className="spin" aria-hidden /> : <Camera size={16} aria-hidden />}
            <span>이미지 첨부</span>
            {uploadProgress ? (
              <span className="attach-progress">
                ({uploadProgress.index + 1}/{uploadProgress.total})
              </span>
            ) : null}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />

          {imageUrls.length ? (
            <div className="thumb-grid" aria-label="첨부된 사진 목록">
              {imageUrls.map((url, idx) => (
                <div key={url} className="thumb">
                  <img src={url} alt={`사진 ${idx + 1}`} />
                  <div className="thumb-actions">
                    <button
                      type="button"
                      className={`thumb-btn ${idx === 0 ? 'active' : ''}`}
                      onClick={() => moveToFront(url)}
                      title="대표로 설정"
                      aria-label="대표로 설정"
                    >
                      <Star size={14} fill={idx === 0 ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      className="thumb-btn danger"
                      onClick={() => removeOne(url)}
                      title="삭제"
                      aria-label="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="form-group">
            <label>꽃 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="꽃 이름을 입력하세요"
              className="text-input"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving || uploading}>
            {saving ? <Loader2 size={18} className="spin" /> : null}
            {isEdit ? '수정 완료' : '등록하기'}
          </button>
        </form>
      </div>
    </div>
  )
}

