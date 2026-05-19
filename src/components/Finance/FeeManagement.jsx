import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function FeeManagement({ showToast }) {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [feeType, setFeeType] = useState('Tuition')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')
  const [dueDate, setDueDate] = useState('')
  const [sendInvoice, setSendInvoice] = useState(false)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('record') // 'record' or 'history'

  useEffect(() => {
    const setup = async () => {
      const { data: cls } = await supabase.from('classes').select('id, class_name').order('class_name')
      setClasses(cls || [])
    }
    setup()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      const fetchStudents = async () => {
        const { data } = await supabase.from('students').select('id, first_name, middle_name, last_name, student_id').eq('class_id', selectedClass).eq('is_active', true).order('last_name')
        setStudents(data || [])
      }
      fetchStudents()
    }
  }, [selectedClass])

  useEffect(() => {
    if (view === 'history') {
      fetchPayments()
    }
  }, [view])

  const fetchPayments = async () => {
    setLoading(true)
    const { data } = await supabase.from('payments').select('*, students(first_name, last_name, student_id), classes(class_name)').order('created_at', { ascending: false })
    setPayments(data || [])
    setLoading(false)
  }

  const recordPayment = async (e) => {
    e.preventDefault()
    if (!selectedStudent || !amount || !dueDate) {
      showToast?.('Please fill in all required fields', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('payments').insert({
        student_id: Number(selectedStudent),
        class_id: Number(selectedClass),
        fee_type: feeType,
        amount: Number(amount),
        status,
        due_date: dueDate,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      })

      if (error) throw error

      // Send Invoice Email if requested
      if (sendInvoice && status === 'pending') {
        showToast?.('Sending invoice email...', 'info')
        
        // Fetch parent email
        const { data: studentData } = await supabase.from('students').select('parent_id').eq('id', Number(selectedStudent)).single()
        let parentEmail = null
        if (studentData?.parent_id) {
          const { data: parentData } = await supabase.from('parents').select('email').eq('id', studentData.parent_id).single()
          parentEmail = parentData?.email
        }

        if (parentEmail) {
          const response = await fetch('http://localhost:3001/api/send-fee-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: parentEmail,
              studentName: selectedStudentName,
              feeType,
              amount: Number(amount),
              dueDate,
            })
          })
          if (!response.ok) throw new Error('Failed to send invoice email')
          showToast?.('Invoice email sent to parent!', 'success')
        } else {
          showToast?.('Payment recorded, but no parent email found for invoice.', 'warning')
        }
      } else {
        showToast?.('Payment record saved successfully!', 'success')
      }

      setAmount('')
      setDueDate('')
      setStatus('pending')
      setSendInvoice(false)
    } catch (err) {
      showToast?.('Failed: ' + err.message, 'error')
    }
    setSaving(false)
  }

  const markAsPaid = async (paymentId) => {
    const { error } = await supabase.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', paymentId)
    if (error) {
      showToast?.('Failed to update payment', 'error')
    } else {
      showToast?.('Payment marked as paid', 'success')
      fetchPayments()
    }
  }

  const deletePayment = async (paymentId) => {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId)
    if (error) {
      showToast?.('Failed to delete payment', 'error')
    } else {
      showToast?.('Payment record deleted', 'success')
      fetchPayments()
    }
  }

  const selectedStudentName = students.find((s) => String(s.id) === String(selectedStudent))
    ? `${students.find((s) => String(s.id) === String(selectedStudent)).first_name} ${students.find((s) => String(s.id) === String(selectedStudent)).last_name}`
    : ''

  const totalPending = payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0)
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Fee Management</h2>
          <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Record payments and track fee status</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setView('record')} style={{ padding: '8px 16px', background: view === 'record' ? '#38bdf8' : '#1e293b', color: view === 'record' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Record Payment</button>
          <button onClick={() => setView('history')} style={{ padding: '8px 16px', background: view === 'history' ? '#38bdf8' : '#1e293b', color: view === 'history' ? '#0f172a' : '#94a3b8', border: '1px solid #334155', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Payment History</button>
        </div>
      </div>

      {view === 'record' && (
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', color: '#38bdf8' }}>Record New Payment</h3>
          <form onSubmit={recordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Class</label>
                <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent('') }} required style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
                  <option value="">Select class</option>
                  {classes.map((c) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Student</label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
                  <option value="">Select student</option>
                  {students.map((s) => (<option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Fee Type</label>
                <select value={feeType} onChange={(e) => setFeeType(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
                  <option>Tuition</option>
                  <option>Development</option>
                  <option>Uniform</option>
                  <option>Books</option>
                  <option>Transport</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Amount (₦)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 6 }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: 12, background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#e2e8f0', outline: 'none' }}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="sendInvoice" checked={sendInvoice} onChange={(e) => setSendInvoice(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <label htmlFor="sendInvoice" style={{ color: '#e2e8f0', cursor: 'pointer', fontSize: '0.9rem' }}>📧 Send Invoice Email to Parent</label>
            </div>

            <button type="submit" disabled={saving} style={{ padding: '12px 24px', background: saving ? '#334155' : '#10b981', color: saving ? '#94a3b8' : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}>
              {saving ? 'Saving...' : '💾 Record Payment'}
            </button>
          </form>
        </div>
      )}

      {view === 'history' && (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: 4 }}>Total Pending</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>₦{totalPending.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: 4 }}>Total Paid</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>₦{totalPaid.toLocaleString()}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading payments...</div>
          ) : payments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No payment records found.</div>
          ) : (
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      {['STUDENT', 'CLASS', 'FEE TYPE', 'AMOUNT', 'DUE DATE', 'STATUS', 'ACTION'].map((h) => (
                        <th key={h} style={{ padding: 14, textAlign: h === 'STUDENT' || h === 'FEE TYPE' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{p.students?.first_name} {p.students?.last_name}</td>
                        <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{p.classes?.class_name}</td>
                        <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{p.fee_type}</td>
                        <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0', fontWeight: 700 }}>₦{p.amount?.toLocaleString()}</td>
                        <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{new Date(p.due_date).toLocaleDateString()}</td>
                        <td style={{ padding: 14, textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                            background: p.status === 'paid' ? 'rgba(16,185,129,0.15)' : p.status === 'overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: p.status === 'paid' ? '#10b981' : p.status === 'overdue' ? '#ef4444' : '#f59e0b',
                          }}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: 14, textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                          {p.status !== 'paid' && (
                            <button onClick={() => markAsPaid(p.id)} style={{ padding: '6px 12px', background: '#10b981', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Mark Paid</button>
                          )}
                          <button onClick={() => deletePayment(p.id)} style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
