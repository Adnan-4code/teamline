import { useState } from 'react'

const STATUSES = ['Todo', 'In Progress', 'Review', 'Done']
const PRIORITIES = ['Low', 'Medium', 'High']

export default function TaskModal({ type, task, defaultStatus, projectId, members, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(task ? {
    title: task.title || '',
    description: task.description || '',
    assigneeId: task.assignee_id || task.assignee?.id || '',
    status: task.status || 'Todo',
    priority: task.priority || 'Medium',
    dueDate: task.due_date ? task.due_date.split('T')[0] : '',
  } : {
    title: '', description: '',
    assigneeId: members[0]?.id || '',
    status: defaultStatus || 'Todo',
    priority: 'Medium', dueDate: '',
  })
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    onSave({ ...form, assigneeId: form.assigneeId || null, dueDate: form.dueDate || null })
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={modalTitle}>{type === 'create' ? 'New Task' : 'Edit Task'}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Title" value={form.title} onChange={v => setForm({ ...form, title: v })} placeholder="Task title..." />
        <div>
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional details..."
            style={{ width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 64, outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <SelectField label="Status" value={form.status} onChange={v => setForm({ ...form, status: v })} options={STATUSES} />
          <SelectField label="Priority" value={form.priority} onChange={v => setForm({ ...form, priority: v })} options={PRIORITIES} />
          <div>
            <label style={labelStyle}>Assignee</label>
            <select value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })} style={selectStyle}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
              style={{ ...selectStyle, colorScheme: 'dark' }} />
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 10 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: type === 'edit' ? 'space-between' : 'flex-end', marginTop: 24, gap: 10 }}>
        {type === 'edit' && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)}
            style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#2d0f0f', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>
            🗑 Delete
          </button>
        )}
        {confirmDelete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#ef4444' }}>Sure?</span>
            <button onClick={onDelete} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Yes, delete</button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>No</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={submit} style={btnSave}>Save Task</button>
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

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
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
const selectStyle = { width: '100%', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }
const modalTitle = { fontFamily: "'Space Grotesk',sans-serif", fontSize: 17, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }
const btnCancel = { padding: '9px 18px', borderRadius: 8, border: '1px solid #1e293b', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }
const btnSave = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
