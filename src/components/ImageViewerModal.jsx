import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

export default function ImageViewerModal({ urls, initialIndex = 0, onClose }) {
  const list = useMemo(() => (Array.isArray(urls) ? urls.filter(Boolean) : []), [urls])
  const [index, setIndex] = useState(() => clamp(initialIndex || 0, 0, Math.max(0, list.length - 1)))
  const scrollerRef = useRef(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const slide = el.querySelector('[data-slide]')
    if (!slide) return
    const w = slide.getBoundingClientRect().width
    el.scrollTo({ left: w * index, behavior: 'instant' })
  }, [index])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    const onScroll = () => {
      const slide = el.querySelector('[data-slide]')
      if (!slide) return
      const w = slide.getBoundingClientRect().width || 1
      const next = clamp(Math.round(el.scrollLeft / w), 0, Math.max(0, list.length - 1))
      setIndex(next)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [list.length])

  const go = (delta) => {
    const next = clamp(index + delta, 0, Math.max(0, list.length - 1))
    setIndex(next)
    const el = scrollerRef.current
    const slide = el?.querySelector('[data-slide]')
    const w = slide?.getBoundingClientRect().width
    if (el && w) el.scrollTo({ left: w * next, behavior: 'smooth' })
  }

  if (!list.length) return null

  return (
    <div className="viewer-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viewer-box" role="dialog" aria-label="사진 보기">
        <div className="viewer-topbar">
          <div className="viewer-count">
            {index + 1} / {list.length}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            <X size={22} />
          </button>
        </div>

        <div className="viewer-scroller" ref={scrollerRef} aria-label="사진 슬라이더">
          {list.map((u) => (
            <div className="viewer-slide" key={u} data-slide>
              <img src={u} alt="원본 사진" className="viewer-img" />
            </div>
          ))}
        </div>

        {list.length > 1 ? (
          <>
            <button
              type="button"
              className="viewer-nav left"
              onClick={() => go(-1)}
              aria-label="이전 사진"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="viewer-nav right"
              onClick={() => go(1)}
              aria-label="다음 사진"
            >
              <ChevronRight size={22} />
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

