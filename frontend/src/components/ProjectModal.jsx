import { useState } from 'react'

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4']

export default function ProjectModal({ type, project, allUsers, currentUser, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(project ? {
    name: project.name || '',
    description: project.description || '',
    color: project.color || COLORS[0],
    memberIds: (project.members || []).map(m => m.id),
  } : {
    name: '', description: '', color: COLORS[0], memberIds: [currentUser.id],
  })
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = () => {
    if (!form.name.trim()) { setError('Project name is required'); return }
    onSave(form)
  }

  const toggleMember = (uid) => {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(uid)
        ? f.memberIds.filter(id => id !== uid)
        : [...f.memberIds, uid],
    }))
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={modalTitle}>{type === 'create' ? 'New Project' : 'Edit Project'}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Project Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Website Redesign" />
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="What is this project about?"
            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 70, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setForm({ ...form, color: c })}
                style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', transition: 'all 0.15s' }} />
            ))}
          </div>
        </div>
        {allUsers.length > 0 && (
          <div>
            <label style={labelStyle}>Members</label>
            <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {allUsers.map(u => (
                <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 8px', borderRadius: 8, background: form.memberIds.includes(u.id) ? '#0f172a' : 'transparent' }}>
                  <input type="checkbox" checked={form.memberIds.includes(u.id)} onChange={() => toggleMember(u.id)} style={{ accentColor: '#6366f1' }} />
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{u.avatar}</div>
                  <span style={{ fontSize: 13, color: '#e2e8f0', flex: 1 }}>{u.name}</span>
                  <span style={{ fontSize: 10, color: u.role === 'Admin' ? '#818cf8' : '#64748b' }}>{u.role}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 10 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: type === 'edit' ? 'space-between' : 'flex-end', marginTop: 24, gap: 10 }}>
        {type === 'edit' && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)}
            style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#2d0f0f', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
            🗑 Delete Project
          </button>
        )}
        {confirmDelete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#ef4444' }}>Delete all tasks too?</span>
            <button onClick={() => onDelete(project.id)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Yes</button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>No</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={submit} style={btnSave}>Save Project</button>
        </div>
      </div>
    </Overlay>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
    </div>
  )
}

function Overlay({ children, onClose }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#0a0e1a', border: '1px solid #1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

const labelStyle = { fontSize: 12, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }
const modalTitle = { fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }
const btnCancel = { padding: '9px 18px', borderRadius: 8, border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }
const btnSave = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
