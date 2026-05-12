import { useEffect, useState } from 'react'
import { Search, Shuffle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FlowerCard from './FlowerCard'
import ImageViewerModal from './ImageViewerModal'
import headerFlowerIcon from '../assets/flower-header-line.png'
import '../App.css'

function FlowerLogo() {
  return (
    <span className="app-logo-wrap">
      <img className="app-logo-img" src={headerFlowerIcon} alt="" width="21" height="21" />
    </span>
  )
}

export default function SamplePage() {
  const [flowers, setFlowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')

      const envId = (import.meta.env.VITE_SAMPLE_USER_ID ?? '').trim()
      let ownerId = envId || null
      if (!ownerId) {
        const { data: rpcId, error: rpcErr } = await supabase.rpc('sample_user_id')
        if (cancelled) return
        if (rpcErr || !rpcId) {
          setError(
            '샘플 계정(grin114@naver.com) 연결이 필요해요. Supabase에 sample_user_id() 함수와 ' +
              'flowers_select_sample 정책(authenticated 포함)을 적용하거나, .env에 VITE_SAMPLE_USER_ID를 넣어주세요.'
          )
          setFlowers([])
          setLoading(false)
          return
        }
        ownerId = rpcId
      }

      const { data, error: fetchErr } = await supabase
        .from('flowers')
        .select('*')
        .eq('user_id', ownerId)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (fetchErr) {
        setError(fetchErr.message || '샘플 데이터를 불러오지 못했어요.')
        setFlowers([])
      } else {
        setFlowers(data || [])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const q = searchQuery.trim().toLowerCase()
  const filtered =
    q.length > 0 ? flowers.filter((f) => (f.name || '').toLowerCase().includes(q)) : flowers

  const shuffle = () => {
    setFlowers((prev) => {
      const arr = [...prev]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    })
  }

  const goToOwnDictionary = async () => {
    await supabase.auth.signOut()
    window.history.pushState(null, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <FlowerLogo />
            <h1
              className="app-title app-title-link"
              onClick={() => {
                setSearchQuery('')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              role="button"
              tabIndex={0}
              title="메인으로"
              aria-label="메인으로 이동"
            >
              나의 꽃사전
            </h1>
          </div>

          <div className="header-center">
            <div className="header-search">
              <Search className="header-search-icon" size={12} aria-hidden />
              <input
                type="search"
                className="header-search-input"
                placeholder="검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                enterKeyHint="search"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="header-right">
            {filtered.length > 1 && (
              <button
                type="button"
                className="header-random-btn"
                onClick={shuffle}
                title="랜덤 섞기"
                aria-label="랜덤 섞기"
              >
                <Shuffle size={11} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content main-content--sample-cta">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <p>{error}</p>
          </div>
        ) : flowers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌸</span>
            <p>아직 등록된 꽃이 없어요.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <p>검색 결과가 없어요.</p>
          </div>
        ) : (
          <div className="food-grid">
            {filtered.map((flower) => (
              <FlowerCard
                key={flower.id}
                flower={flower}
                readOnly
                onViewImages={(urls, index) => setViewer({ urls, index })}
              />
            ))}
          </div>
        )}
      </main>

      {viewer?.urls?.length ? (
        <ImageViewerModal
          urls={viewer.urls}
          initialIndex={viewer.index || 0}
          onClose={() => setViewer(null)}
        />
      ) : null}

      <div className="sample-cta-floating">
        <button
          type="button"
          className="sample-cta-btn"
          onClick={goToOwnDictionary}
        >
          나만의 꽃사전 만들기
        </button>
      </div>
    </div>
  )
}
