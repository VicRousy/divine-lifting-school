import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function FeeManagement({ showToast }) {
  const [activeTab, setActiveTab] = useState('status')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [fees, setFees] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const [newFee, setNewFee] = useState({ class_id: '', term: 'First Term', fee_type: 'Tuition', amount: '' })
  const [newPayment, setNewPayment] = useState({ student_id: '', amount: '', method: 'Cash', reference: '' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: classesData } = await supabase.from('classes').select('id, class_name')
    setClasses(classesData || [])

    const { data: studentsData } = await supabase.from('students').select('id, first_name, last_name, class_name, class_id')
    setStudents(studentsData || [])

    const { data: feesData } = await supabase.from('fees').select('*, classes(class_name)')
    setFees(feesData || [])

    const { data: paymentsData } = await supabase.from('payments').select('*, students(first_name, last_name), fees(fee_type)')
    setPayments(paymentsData || [])

    setLoading(false)
  }

  const handleSetFee = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('fees').insert([newFee])
    if (error) {
      showToast('Error setting fee: ' + error.message, 'error')
    } else {
      showToast('Fee set successfully!', 'success')
      setNewFee({ class_id: '', term: 'First Term', fee_type: 'Tuition', amount: '' })
      loadData()
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('payments').insert([newPayment])
    if (error) {
      showToast('Error recording payment: ' + error.message, 'error')
    } else {
      showToast('Payment recorded successfully!', 'success')
      setNewPayment({ student_id: '', amount: '', method: 'Cash', reference: '' })
      loadData()
    }
  }

  const getStudentBalance = (studentId) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return { totalFees: 0, totalPaid: 0, balance: 0 }
    
    const studentFees = fees.filter(f => f.class_id === student.class_id)
    const totalFees = studentFees.reduce((sum, f) => sum + Number(f.amount), 0)
    const totalPaid = payments
      .filter(p => p.student_id === studentId)
      .reduce((sum, p) => sum + Number(p.amount_paid), 0)
    return { totalFees, totalPaid, balance: totalFees - totalPaid }
  }

  if (loading) return <div className="dashboard-card">Loading Fee Data...</div>

  return (
    <div className="dashboard-card">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('status')} style={{ padding: '8px 16px', background: activeTab === 'status' ? '#38bdf8' : 'transparent', color: activeTab === 'status' ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Fee Status</button>
        <button onClick={() => setActiveTab('set')} style={{ padding: '8px 16px', background: activeTab === 'set' ? '#38bdf8' : 'transparent', color: activeTab === 'set' ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Set Fees</button>
        <button onClick={() => setActiveTab('record')} style={{ padding: '8px 16px', background: activeTab === 'record' ? '#38bdf8' : 'transparent', color: activeTab === 'record' ? '#0f172a' : '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Record Payment</button>
      </div>

      {activeTab === 'status' && (
        <div>
          <h3>Student Fee Status</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #334155', textAlign: 'left' }}>
                <th style={{ padding: '10px', color: '#94a3b8' }}>Student</th>
                <th style={{ padding: '10px', color: '#94a3b8' }}>Class</th>
                <th style={{ padding: '10px', color: '#94a3b8' }}>Total Fees</th>
                <th style={{ padding: '10px', color: '#94a3b8' }}>Paid</th>
                <th style={{ padding: '10px', color: '#94a3b8' }}>Balance</th>
                <th style={{ padding: '10px', color: '#94a3b8' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const { totalFees, totalPaid, balance } = getStudentBalance(student.id)
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '10px' }}>{student.first_name} {student.last_name}</td>
                    <td style={{ padding: '10px' }}>{student.class_name}</td>
                    <td style={{ padding: '10px' }}>₦{totalFees.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>₦{totalPaid.toLocaleString()}</td>
                    <td style={{ padding: '10px', color: balance > 0 ? '#ef4444' : '#10b981' }}>₦{balance.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: balance > 0 ? '#ef444422' : '#10b98122', color: balance > 0 ? '#ef4444' : '#10b981', fontSize: '0.8rem' }}>
                        {balance > 0 ? 'Owing' : 'Paid'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'set' && (
        <form onSubmit={handleSetFee} style={{ maxWidth: '500px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Class</label>
            <select value={newFee.class_id} onChange={e => setNewFee({...newFee, class_id: e.target.value})} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} required>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Fee Type</label>
            <input type="text" value={newFee.fee_type} onChange={e => setNewFee({...newFee, fee_type: e.target.value})} placeholder="e.g. Tuition, Books" style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} required />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Amount (₦)</label>
            <input type="number" value={newFee.amount} onChange={e => setNewFee({...newFee, amount: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} required />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Set Fee</button>
        </form>
      )}

      {activeTab === 'record' && (
        <form onSubmit={handleRecordPayment} style={{ maxWidth: '500px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Student</label>
            <select value={newPayment.student_id} onChange={e => setNewPayment({...newPayment, student_id: e.target.value})} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} required>
              <option value="">Select Student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Amount Paid (₦)</label>
            <input type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} placeholder="0.00" style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} required />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Payment Method</label>
            <select value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value})} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}>
              <option value="Cash">Cash</option>
              <option value="Transfer">Transfer</option>
              <option value="POS">POS</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Reference (Optional)</label>
            <input type="text" value={newPayment.reference} onChange={e => setNewPayment({...newPayment, reference: e.target.value})} placeholder="Transaction ID" style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Record Payment</button>
        </form>
      )}
    </div>
  )
}

export default FeeManagement
