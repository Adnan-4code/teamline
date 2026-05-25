import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = async (e) => {
    e?.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 16, padding: 40, width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif", margin: '0 auto 16px' }}>T</div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Sign in to Teamline</p>
        </div>

        

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" placeholder="you@example.com" />
          <Field label="Password" value={form.password} onChange={v => setForm({ ...form, password: v })} type="password" placeholder="••••••••" onEnter={handle} />
        </div>

        {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 12 }}>{error}</p>}

        <button onClick={handle} disabled={loading}
          style={{ width: '100%', marginTop: 20, background: '#6366f1', border: 'none', color: '#fff', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
          No account? <Link to="/signup" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type, placeholder, onEnter }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
    </div>
  )
}
