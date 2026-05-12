import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Search, Lock, Check, RefreshCw, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import flowerIcon from '../assets/flower-icon-pink.png'
import './AdminPage.css'

const PIN_SUFFIX = 'flower'
function toAuthPassword(pin) { return pin + PIN_SUFFIX }
function onlyDigits(val) { return val.replace(/\D/g, '').slice(0, 4) }

function formatDate(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function AdminPage({ session, onBack }) {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL

  // 클라이언트 측 관리자 가드
  if (session?.user?.email !== adminEmail) {
    return (
      <div className="adm-shell">
        <div className="adm-forbidden">
          <ShieldAlert size={40} className="adm-forbidden-icon" />
          <p>관리자 권한이 없습니다.</p>
          <button className="adm-btn-ghost" onClick={onBack}>
            <ArrowLeft size={14} /> 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return <AdminPageInner session={session} onBack={onBack} />
}

function AdminPageInner({ session, onBack }) {
  const [users, setUsers]           = useState([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [query, setQuery]           = useState('')
  const [selected, setSelected]     = useState(null)

  const [pin, setPin]       = useState('')
  const [pin2, setPin2]     = useState('')
  const [pinError, setPinError] = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }, [])

  const fetchUsers = useCallback(async () => {
    setFetchLoading(true)
    setFetchError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/admin-list-users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 404) {
        throw new Error(
          '⚠️ API를 찾을 수 없어요 (404).\n' +
          '로컬에서 테스트할 때는 npm run dev 대신 vercel dev 를 사용해주세요.'
        )
      }
      let json
      try { json = await res.json() }
      catch { throw new Error(`서버 응답을 읽지 못했어요 (HTTP ${res.status}).`) }
      if (!res.ok) throw new Error(json.error || `오류 (HTTP ${res.status})`)
      setUsers(json.users)
    } catch (e) {
      setFetchError(e.message)
    } finally {
      setFetchLoading(false)
    }
  }, [getToken])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleUpdatePassword(e) {
    e.preventDefault()
    setPinError('')
    if (pin.length !== 4) { setPinError('새 비밀번호 4자리를 입력해주세요.'); return }
    if (pin !== pin2)     { setPinError('비밀번호가 일치하지 않아요.'); return }
    setSaving(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/admin-update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selected.id, password: toAuthPassword(pin) }),
      })
      let json
      try { json = await res.json() }
      catch { throw new Error(`서버 응답을 읽지 못했어요 (HTTP ${res.status}).`) }
      if (!res.ok) throw new Error(json.error || `오류 (HTTP ${res.status})`)
      setDone(true)
      setPin('')
      setPin2('')
    } catch (e) {
      setPinError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleSelect(user) {
    setSelected(user)
    setPin('')
    setPin2('')
    setPinError('')
    setDone(false)
  }

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="adm-shell">
      {/* 헤더 */}
      <header className="adm-header">
        <button type="button" className="adm-back-btn" onClick={onBack}>
          <ArrowLeft size={15} aria-hidden /> 돌아가기
        </button>
        <span className="adm-header-title">사용자 관리</span>
        <button
          type="button"
          className="adm-refresh-btn"
          onClick={fetchUsers}
          disabled={fetchLoading}
          aria-label="새로고침"
        >
          <RefreshCw size={14} className={fetchLoading ? 'adm-spin' : ''} aria-hidden />
        </button>
      </header>

      <div className="adm-body">
        {/* ── 사용자 목록 패널 ── */}
        <section className="adm-panel adm-panel--users">
          <div className="adm-panel-head">
            <h2 className="adm-panel-title">사용자 목록</h2>
            {!fetchLoading && (
              <span className="adm-badge">{users.length}명</span>
            )}
          </div>

          <div className="adm-search-wrap">
            <Search size={13} className="adm-search-icon" aria-hidden />
            <input
              className="adm-search-input"
              type="search"
              placeholder="이메일로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          {fetchLoading ? (
            <div className="adm-center"><div className="adm-spinner" /></div>
          ) : fetchError ? (
            <div className="adm-center">
              <p className="adm-error-msg">{fetchError}</p>
              <button className="adm-btn-ghost adm-btn-sm" onClick={fetchUsers}>다시 시도</button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="adm-empty">
              {query ? '검색 결과가 없어요.' : '등록된 사용자가 없어요.'}
            </p>
          ) : (
            <ul className="adm-user-list">
              {filtered.map((user) => (
                <li
                  key={user.id}
                  className={`adm-user-item${selected?.id === user.id ? ' adm-user-item--sel' : ''}`}
                  onClick={() => handleSelect(user)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(user) }}
                >
                  <span className="adm-user-email">{user.email}</span>
                  <span className="adm-user-meta">마지막 로그인 {formatDate(user.last_sign_in_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 비밀번호 변경 패널 ── */}
        <section className="adm-panel adm-panel--pw">
          <div className="adm-panel-head">
            <h2 className="adm-panel-title">비밀번호 변경</h2>
          </div>

          {!selected ? (
            <p className="adm-empty adm-empty--hint">
              왼쪽 목록에서<br />사용자를 선택하세요.
            </p>
          ) : done ? (
            <div className="adm-done">
              <div className="adm-done-check">
                <Check size={22} aria-hidden />
              </div>
              <p className="adm-done-msg">
                <strong>{selected.email}</strong>의<br />비밀번호가 변경됐어요.
              </p>
              <button
                type="button"
                className="adm-btn-ghost adm-btn-sm"
                onClick={() => setDone(false)}
              >
                다시 변경하기
              </button>
            </div>
          ) : (
            <>
              <div className="adm-target-box">
                <Lock size={12} aria-hidden />
                <span className="adm-target-email">{selected.email}</span>
              </div>

              <form className="adm-form" onSubmit={handleUpdatePassword}>
                <label className="adm-field">
                  <span>새 비밀번호 (숫자 4자리)</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    value={pin}
                    onChange={(e) => setPin(onlyDigits(e.target.value))}
                    autoComplete="new-password"
                  />
                </label>
                <label className="adm-field">
                  <span>비밀번호 확인</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="0000"
                    value={pin2}
                    onChange={(e) => setPin2(onlyDigits(e.target.value))}
                    autoComplete="new-password"
                  />
                </label>

                {pinError && <p className="adm-field-error">{pinError}</p>}

                <button type="submit" className="adm-btn-primary" disabled={saving}>
                  <img src={flowerIcon} className="adm-btn-icon" alt="" aria-hidden />
                  {saving ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
