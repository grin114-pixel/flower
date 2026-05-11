import { useState } from 'react'
import { supabase } from '../lib/supabase'
import headerFlowerIcon from '../assets/header-flower-hotpink-transparent.png'
import './LoginPage.css'

const PIN_SUFFIX = 'flower'
const REMEMBER_KEY = 'flower.remember-device'

function toAuthPassword(pin) {
  return pin + PIN_SUFFIX
}

function onlyDigits(val) {
  return val.replace(/\D/g, '').slice(0, 4)
}

export default function LoginPage({ recoveryMode = false, onPasswordReset }) {
  const [view, setView] = useState(recoveryMode ? 'reset' : 'login')

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(() => {
    return typeof window !== 'undefined' && window.localStorage.getItem(REMEMBER_KEY) === 'true'
  })

  // Signup
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPin, setSignupPin] = useState('')
  const [signupPin2, setSignupPin2] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotDone, setForgotDone] = useState(false)

  // Change password
  const [changeEmail, setChangeEmail] = useState('')
  const [changeCurrentPin, setChangeCurrentPin] = useState('')
  const [changeNewPin, setChangeNewPin] = useState('')
  const [changeError, setChangeError] = useState('')
  const [changeLoading, setChangeLoading] = useState(false)
  const [changeDone, setChangeDone] = useState(false)

  // Reset password (via email link)
  const [resetPin, setResetPin] = useState('')
  const [resetPin2, setResetPin2] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    if (!loginEmail.trim()) { setLoginError('이메일을 입력해주세요.'); return }
    if (loginPin.length !== 4) { setLoginError('비밀번호 4자리를 입력해주세요.'); return }
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: toAuthPassword(loginPin),
    })
    setLoginLoading(false)
    if (error) {
      setLoginError('이메일 또는 비밀번호가 올바르지 않아요.')
      return
    }
    if (rememberDevice) {
      window.localStorage.setItem(REMEMBER_KEY, 'true')
    } else {
      window.localStorage.removeItem(REMEMBER_KEY)
      window.sessionStorage.setItem('flower.session-only', 'true')
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setSignupError('')
    if (!signupEmail.trim()) { setSignupError('이메일을 입력해주세요.'); return }
    if (signupPin.length !== 4) { setSignupError('비밀번호 4자리를 입력해주세요.'); return }
    if (signupPin !== signupPin2) { setSignupError('비밀번호가 일치하지 않아요.'); return }
    setSignupLoading(true)
    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: toAuthPassword(signupPin),
    })
    setSignupLoading(false)
    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        setSignupError('이미 가입된 이메일이에요.')
      } else {
        setSignupError('가입에 실패했어요. 다시 시도해주세요.')
      }
    } else {
      setSignupDone(true)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail.trim()) { setForgotError('이메일을 입력해주세요.'); return }
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin,
    })
    setForgotLoading(false)
    if (error) {
      setForgotError('전송에 실패했어요. 다시 시도해주세요.')
    } else {
      setForgotDone(true)
    }
  }

  async function handleChange(e) {
    e.preventDefault()
    setChangeError('')
    if (!changeEmail.trim()) { setChangeError('이메일을 입력해주세요.'); return }
    if (changeCurrentPin.length !== 4) { setChangeError('현재 비밀번호 4자리를 입력해주세요.'); return }
    if (changeNewPin.length !== 4) { setChangeError('새 비밀번호 4자리를 입력해주세요.'); return }
    setChangeLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: changeEmail.trim(),
      password: toAuthPassword(changeCurrentPin),
    })
    if (signInError) {
      setChangeLoading(false)
      setChangeError('이메일 또는 현재 비밀번호가 올바르지 않아요.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: toAuthPassword(changeNewPin),
    })
    setChangeLoading(false)

    if (updateError) {
      setChangeError('비밀번호 변경에 실패했어요.')
    } else {
      await supabase.auth.signOut()
      setChangeDone(true)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setResetError('')
    if (resetPin.length !== 4) { setResetError('새 비밀번호 4자리를 입력해주세요.'); return }
    if (resetPin !== resetPin2) { setResetError('비밀번호가 일치하지 않아요.'); return }
    setResetLoading(true)
    const { error } = await supabase.auth.updateUser({
      password: toAuthPassword(resetPin),
    })
    setResetLoading(false)
    if (error) {
      setResetError('비밀번호 변경에 실패했어요.')
    } else {
      setResetDone(true)
      await supabase.auth.signOut()
      onPasswordReset?.()
    }
  }

  function goLogin() {
    setView('login')
    setLoginError('')
    setSignupError('')
    setForgotError('')
    setChangeError('')
    setSignupDone(false)
    setForgotDone(false)
    setChangeDone(false)
  }

  const brand = (
    <div className="auth-brand">
      <img src={headerFlowerIcon} className="auth-logo" alt="나의 꽃사전" />
      <span className="auth-brand-name">나의 꽃사전</span>
    </div>
  )

  if (view === 'reset') {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          {brand}
          <h2 className="auth-subtitle">새 비밀번호 설정</h2>
          {resetDone ? (
            <div className="auth-done">
              <p>비밀번호를 변경했어요.</p>
              <p>새 비밀번호로 다시 로그인해주세요.</p>
              <button className="auth-btn-primary" onClick={goLogin}>로그인으로 이동</button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleReset}>
              <label className="auth-field">
                <span>새 비밀번호 (숫자 4자리)</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={resetPin}
                  onChange={(e) => setResetPin(onlyDigits(e.target.value))}
                />
              </label>
              <label className="auth-field">
                <span>새 비밀번호 확인</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={resetPin2}
                  onChange={(e) => setResetPin2(onlyDigits(e.target.value))}
                />
              </label>
              {resetError && <p className="auth-error">{resetError}</p>}
              <button type="submit" className="auth-btn-primary" disabled={resetLoading}>
                {resetLoading ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  if (view === 'signup') {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          {brand}
          <h2 className="auth-subtitle">회원 가입하기</h2>
          {signupDone ? (
            <div className="auth-done">
              <p>가입 확인 이메일을 보냈어요.</p>
              <p>이메일을 확인한 뒤 로그인해주세요.</p>
              <button className="auth-btn-primary" onClick={goLogin}>로그인으로 이동</button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <label className="auth-field">
                <span>이메일</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </label>
              <label className="auth-field">
                <span>비밀번호 (숫자 4자리)</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={signupPin}
                  onChange={(e) => setSignupPin(onlyDigits(e.target.value))}
                />
              </label>
              <label className="auth-field">
                <span>비밀번호 확인</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={signupPin2}
                  onChange={(e) => setSignupPin2(onlyDigits(e.target.value))}
                />
              </label>
              {signupError && <p className="auth-error">{signupError}</p>}
              <button type="submit" className="auth-btn-primary" disabled={signupLoading}>
                {signupLoading ? '가입 중...' : '가입하기'}
              </button>
            </form>
          )}
          <div className="auth-bottom-links auth-bottom-links--center">
            <button type="button" className="auth-link" onClick={goLogin}>
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'forgot') {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          {brand}
          <h2 className="auth-subtitle">비밀번호 찾기</h2>
          {forgotDone ? (
            <div className="auth-done">
              <p>비밀번호 재설정 링크를 이메일로 보냈어요.</p>
              <p>이메일을 확인해주세요.</p>
              <button className="auth-btn-primary" onClick={goLogin}>로그인으로 이동</button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleForgot}>
              <label className="auth-field">
                <span>이메일</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </label>
              {forgotError && <p className="auth-error">{forgotError}</p>}
              <button type="submit" className="auth-btn-primary" disabled={forgotLoading}>
                {forgotLoading ? '전송 중...' : '재설정 링크 보내기'}
              </button>
            </form>
          )}
          <div className="auth-bottom-links auth-bottom-links--center">
            <button type="button" className="auth-link" onClick={goLogin}>
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'change') {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          {brand}
          <h2 className="auth-subtitle">비밀번호 변경하기</h2>
          {changeDone ? (
            <div className="auth-done">
              <p>비밀번호를 변경했어요.</p>
              <p>새 비밀번호로 다시 로그인해주세요.</p>
              <button className="auth-btn-primary" onClick={goLogin}>로그인으로 이동</button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleChange}>
              <label className="auth-field">
                <span>이메일</span>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={changeEmail}
                  onChange={(e) => setChangeEmail(e.target.value)}
                />
              </label>
              <label className="auth-field">
                <span>현재 비밀번호</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={changeCurrentPin}
                  onChange={(e) => setChangeCurrentPin(onlyDigits(e.target.value))}
                />
              </label>
              <label className="auth-field">
                <span>새 비밀번호</span>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  value={changeNewPin}
                  onChange={(e) => setChangeNewPin(onlyDigits(e.target.value))}
                />
              </label>
              {changeError && <p className="auth-error">{changeError}</p>}
              <button type="submit" className="auth-btn-primary" disabled={changeLoading}>
                {changeLoading ? '변경 중...' : '비밀번호 변경하기'}
              </button>
            </form>
          )}
          <div className="auth-bottom-links auth-bottom-links--center">
            <button type="button" className="auth-link" onClick={goLogin}>
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {brand}
        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-field">
            <span>이메일</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>비밀번호 (숫자 4자리)</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={loginPin}
              onChange={(e) => setLoginPin(onlyDigits(e.target.value))}
              autoComplete="current-password"
            />
          </label>
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            <span>이 기기 기억하기</span>
          </label>
          {loginError && <p className="auth-error">{loginError}</p>}
          <button type="submit" className="auth-btn-primary" disabled={loginLoading}>
            {loginLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="auth-bottom-links">
          <button
            type="button"
            className="auth-link"
            onClick={() => { setView('signup'); setSignupError(''); setSignupDone(false) }}
          >
            회원 가입하기
          </button>
          <button
            type="button"
            className="auth-link"
            onClick={() => { setView('forgot'); setForgotError(''); setForgotDone(false) }}
          >
            비밀번호 찾기
          </button>
          <button
            type="button"
            className="auth-link"
            onClick={() => { setView('change'); setChangeError(''); setChangeDone(false) }}
          >
            비밀번호 변경하기
          </button>
        </div>
      </div>
    </div>
  )
}
