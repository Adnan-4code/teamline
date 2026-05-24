import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', exact: true, icon: '⊞' },
  { to: '/projects', label: 'Projects', icon: '◫' },
  { to: '/tasks', label: 'My Tasks', icon: '✓' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080c14', fontFamily: "'DM Sans',sans-serif", color: '#e2e8f0' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#0a0e1a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>T</div>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Teamline</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, color: '#475569', fontWeight: 600, letterSpacing: '0.1em', padding: '4px 8px 8px', textTransform: 'uppercase' }}>Menu</p>
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 8, textDecoration: 'none', marginBottom: 2, fontSize: 13, fontWeight: 500,
                background: isActive ? '#0f172a' : 'transparent',
                color: isActive ? '#6366f1' : '#94a3b8',
                transition: 'all 0.15s',
              })}>
              <span style={{ fontSize: 15 }}>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{user?.avatar}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize: 10, color: user?.role === 'Admin' ? '#818cf8' : '#64748b' }}>{user?.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 14 }}>⇥</button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet context={{ showToast: (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); } }} />
      </main>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? '#7f1d1d' : '#14532d', border: `1px solid ${toast.type === 'error' ? '#ef4444' : '#22c55e'}`, color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
