import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Shuffle, Lock } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useFlowers } from './hooks/useFlowers'
import FlowerCard from './components/FlowerCard'
import FlowerModal from './components/FlowerModal'
import ImageViewerModal from './components/ImageViewerModal'
import ConfirmModal from './components/ConfirmModal'
import LoginPage from './components/LoginPage'
import SamplePage from './components/SamplePage'
import AdminPage from './components/AdminPage'
import headerFlowerIcon from './assets/flower-header-line.png'
import './App.css'

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return pathname
}

function FlowerLogo() {
  return (
    <span className="app-logo-wrap">
      <img className="app-logo-img" src={headerFlowerIcon} alt="" width="21" height="21" />
    </span>
  )
}

const REMEMBER_KEY = 'flower.remember-device'
const SESSION_ONLY_KEY = 'flower.session-only'

export default function App() {
  const pathname = usePathname()
  if (pathname === '/sample' || pathname.startsWith('/sample/')) {
    return <SamplePage />
  }
  return <AuthGate pathname={pathname} />
}

function AuthGate({ pathname }) {
  const [session, setSession] = useState(undefined) // undefined = checking, null = no session
  const [recoveryMode, setRecoveryMode] = useState(false)
  /** 비밀번호 재설정 링크로 온 세션은 '기억하기'가 없어도 로그아웃하면 안 됨 */
  const passwordRecoveryBypassRef = useRef(false)

  useEffect(() => {
    const syncRecoveryFromUrl = () => {
      if (typeof window === 'undefined') return
      try {
        const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type')
        const fromSearch = new URLSearchParams(window.location.search).get('type')
        if (fromHash === 'recovery' || fromSearch === 'recovery') {
          passwordRecoveryBypassRef.current = true
        }
      } catch {
        /* ignore */
      }
    }
    syncRecoveryFromUrl()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryBypassRef.current = true
        setRecoveryMode(true)
        setSession(sess ?? null)
        return
      }
      setSession(sess ?? null)
      if (event === 'SIGNED_OUT') {
        setRecoveryMode(false)
        passwordRecoveryBypassRef.current = false
        window.localStorage.removeItem(REMEMBER_KEY)
        window.sessionStorage.removeItem(SESSION_ONLY_KEY)
      }
    })

    const runInitialSessionCheck = async () => {
      // PASSWORD_RECOVERY 등 URL 처리가 끝난 뒤 세션을 읽도록 한 틱 미룸
      await new Promise((r) => setTimeout(r, 0))
      syncRecoveryFromUrl()
      const { data } = await supabase.auth.getSession()
      const sess = data.session
      if (sess) {
        const remember = window.localStorage.getItem(REMEMBER_KEY) === 'true'
        const sessionOnly = window.sessionStorage.getItem(SESSION_ONLY_KEY) === 'true'
        if (!remember && !sessionOnly && !passwordRecoveryBypassRef.current) {
          await supabase.auth.signOut()
          setSession(null)
          return
        }
      }
      setSession(sess ?? null)
    }
    void runInitialSessionCheck()

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="auth-shell">
        <div className="auth-checking">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (!session || recoveryMode) {
    return (
      <LoginPage
        key={recoveryMode ? 'password-recovery' : 'auth'}
        recoveryMode={recoveryMode}
        onPasswordReset={() => setRecoveryMode(false)}
      />
    )
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return (
      <AdminPage
        session={session}
        onBack={() => {
          window.history.pushState({}, '', '/')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }}
      />
    )
  }

  return <MainApp session={session} />
}

function MainApp({ session }) {
  const { flowers, loading, addFlower, updateFlower, deleteFlower, shuffleFlowers, refetch } =
    useFlowers(session?.user?.id)
  const [showFlowerModal, setShowFlowerModal] = useState(false)
  const [editFlower, setEditFlower] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewer, setViewer] = useState(null)

  const q = searchQuery.trim().toLowerCase()
  const filtered =
    q.length > 0 ? flowers.filter((f) => (f.name || '').toLowerCase().includes(q)) : flowers

  const handleSave = async (data) => {
    if (editFlower) {
      await updateFlower(editFlower.id, data)
    } else {
      await addFlower({ ...data, user_id: session?.user?.id })
    }
    setEditFlower(null)
  }

  const handleEdit = (flower) => {
    setEditFlower(flower)
    setShowFlowerModal(true)
  }

  const handleCloseModal = () => {
    setShowFlowerModal(false)
    setEditFlower(null)
  }

  const handleRequestDelete = (flower) => {
    setDeleteTarget(flower)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await deleteFlower(deleteTarget.id)
    await refetch()
    setDeleteTarget(null)
  }

  const handleLock = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSearchQuery('')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
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
              <button
                type="button"
                className="header-random-btn"
                onClick={shuffleFlowers}
                disabled={flowers.length < 2}
                title="랜덤 섞기"
                aria-label="랜덤 섞기"
              >
                <Shuffle size={11} aria-hidden />
              </button>
              <button
                type="button"
                className="header-lock-btn"
                onClick={handleLock}
                title="로그인 화면 돌아가기"
                aria-label="로그인 화면 돌아가기"
              >
                <Lock size={11} aria-hidden />
              </button>
            </div>
          </div>
        </header>

        <main className="main-content main-content--fab">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>불러오는 중...</p>
            </div>
          ) : flowers.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🌸</span>
              <p>꽃을 등록해보세요!</p>
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
                  onEdit={handleEdit}
                  onRequestDelete={handleRequestDelete}
                  onViewImages={(urls, index) => setViewer({ urls, index })}
                />
              ))}
            </div>
          )}
        </main>

        <button
          className="fab"
          onClick={() => setShowFlowerModal(true)}
          title="꽃 등록"
          aria-label="꽃 등록"
        >
          <Plus size={28} aria-hidden />
        </button>

        {showFlowerModal && (
          <FlowerModal onClose={handleCloseModal} onSave={handleSave} initialData={editFlower} />
        )}

        {viewer?.urls?.length ? (
          <ImageViewerModal
            urls={viewer.urls}
            initialIndex={viewer.index || 0}
            onClose={() => setViewer(null)}
          />
        ) : null}

        {deleteTarget && (
          <ConfirmModal
            message="삭제할까요?"
            cancelText="취소"
            confirmText="삭제"
            danger
            confirmVariant="pink"
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </>
  )
}
