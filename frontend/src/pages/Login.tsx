import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/authService'
import '../App.css'

type IconProps = {
  className?: string
}

const metrics = [
  { accent: 'mint', value: '99.8%', label: 'Security check' },
  { accent: 'cyan', value: '12', label: 'Devices synced' },
  { accent: 'rose', value: '38', label: 'Open tasks' },
]

const bars = [42, 68, 50, 76, 62, 88, 72]

function SparkIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="M5 14l.9 2.6L8.5 18l-2.6.9L5 21l-.9-2.1L2 18l2.1-1.4L5 14Z" />
      <path d="M19 3l.7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7L19 3Z" />
    </svg>
  )
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l7 3v5.4c0 4.2-2.8 8-7 9.6-4.2-1.6-7-5.4-7-9.6V6l7-3Z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  )
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8.4 12.2l2.3 2.3 4.9-5" />
    </svg>
  )
}

function MailIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v12H4V6Z" />
      <path d="M5 7l7 6 7-6" />
    </svg>
  )
}

function LockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7.8a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.5" />
    </svg>
  )
}

function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  )
}

function EyeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.8 5.4A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a18 18 0 0 1-3.2 4.2" />
      <path d="M14.1 14.6A3 3 0 0 1 9.4 10" />
      <path d="M6.1 7.2A18 18 0 0 0 2.5 12s3.5 7 9.5 7c1 0 1.9-.2 2.8-.5" />
    </svg>
  )
}

function ArrowIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading
  }, [email, password, loading])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setError('')
    setLoading(true)

    try {
      await loginUser({
        email: email.trim(),
        password,
      })

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="hero-panel" aria-label="Workspace overview">
        <div className="brand-lockup">
          <div className="brand-mark">
            <SparkIcon />
          </div>
          <div>
            <p className="brand-name">IT Help Desk</p>
            <p className="brand-subtitle">Team command center</p>
          </div>
        </div>

        <div className="access-pill">
          <ShieldIcon />
          <span>Protected workspace access</span>
        </div>

        <div className="hero-copy">
          <h1>
            Welcome back <span>to your flow.</span>
          </h1>
          <p>
            Sign in to review projects, approvals, and live team updates from
            one focused dashboard.
          </p>
        </div>

        <article className="status-card">
          <div className="status-header">
            <div>
              <p className="eyebrow">Workspace health</p>
              <h2>All systems clear</h2>
            </div>
            <div className="status-icon">
              <CheckIcon />
            </div>
          </div>

          <div className="metric-list">
            {metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <span className={`metric-swatch ${metric.accent}`} />
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card" aria-label="Open task trend">
          <div className="chart-heading">
            <span>Today</span>
            <strong>+24%</strong>
          </div>
          <div className="chart-bars" aria-hidden="true">
            {bars.map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>
      </section>

      <section className="form-panel" aria-label="Login form">
        <div className="form-wrap">
          <p className="form-kicker">Login</p>
          <h2>Access your account</h2>
          <p className="form-intro">
            Use your company email and password to continue.
          </p>

          <form className="login-card" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>Email address</span>
              <span className="field-control">
                <MailIcon className="field-icon" />
                <input
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>

            <label className="field-group">
              <span>Password</span>
              <span className="field-control with-action">
                <LockIcon className="field-icon" />
                <input
                  autoComplete="current-password"
                  placeholder="Enter password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="icon-button"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </span>
            </label>

            <div className="form-options">
              <label className="check-row">
                <input
                  checked={rememberMe}
                  type="checkbox"
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#forgot-password">Forgot password?</a>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="submit-button" disabled={!canSubmit} type="submit">
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowIcon />
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login