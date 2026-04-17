import { useState } from 'react'
import { Plus, Search, Shuffle } from 'lucide-react'
import { useFlowers } from './hooks/useFlowers'
import FlowerCard from './components/FlowerCard'
import FlowerModal from './components/FlowerModal'
import ImageViewerModal from './components/ImageViewerModal'
import ConfirmModal from './components/ConfirmModal'
import headerFlowerIcon from './assets/header-flower-hotpink.png'
import './App.css'

function FlowerLogo() {
  return (
    <img className="app-logo-img" src={headerFlowerIcon} alt="꽃사전" width="22" height="22" />
  )
}

export default function App() {
  const { flowers, loading, addFlower, updateFlower, deleteFlower, shuffleFlowers, refetch } =
    useFlowers()
  const [showFlowerModal, setShowFlowerModal] = useState(false)
  const [editFlower, setEditFlower] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewer, setViewer] = useState(null) // { urls: string[], index: number }

  const q = searchQuery.trim().toLowerCase()
  const filtered =
    q.length > 0 ? flowers.filter((f) => (f.name || '').toLowerCase().includes(q)) : flowers

  const handleSave = async (data) => {
    if (editFlower) {
      await updateFlower(editFlower.id, data)
    } else {
      await addFlower(data)
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
                꽃사전
              </h1>
            </div>

            <div className="header-center">
              <div className="header-search">
                <Search className="header-search-icon" size={18} aria-hidden />
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
                  onClick={shuffleFlowers}
                  title="랜덤 섞기"
                  aria-label="랜덤 섞기"
                >
                  <Shuffle size={16} aria-hidden />
                  <span>랜덤</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
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

