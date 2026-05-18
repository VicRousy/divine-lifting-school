import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function ReportCards({ showToast }) {
  const [students, setStudents] = useState([])
  const [fees, setFees] = useState([])
  const [payments, setPayments] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedTerm, setSelectedTerm] = useState('First Term')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: studentsData } = await supabase.from('students').select('id, first_name, last_name, class_name, class_id')
    setStudents(studentsData || [])

    const { data: feesData } = await supabase.from('fees').select('*')
    setFees(feesData || [])

    const { data: paymentsData } = await supabase.from('payments').select('*')
    setPayments(paymentsData || [])

    setLoading(false)
  }

  const getStudentBalance = (studentId) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return 0
    
    const studentFees = fees.filter(f => f.class_id === student.class_id)
    const totalFees = studentFees.reduce((sum, f) => sum + Number(f.amount), 0)
    const totalPaid = payments
      .filter(p => p.student_id === studentId)
      .reduce((sum, p) => sum + Number(p.amount_paid), 0)
    return totalFees - totalPaid
  }

  const handleGenerateReport = async () => {
    if (!selectedStudent) {
      showToast('Please select a student.', 'error')
      return
    }

    const balance = getStudentBalance(selectedStudent.id)
    if (balance > 0) {
      showToast(`Cannot generate report card. Student owes ₦${balance.toLocaleString()}.`, 'error')
      return
    }

    setGenerating(true)
    
    // Generate report card logic here
    const { error } = await supabase.from('report_cards').insert([{
      student_id: selectedStudent.id,
      term: selectedTerm,
      academic_year: '2026/2027',
      generated_at: new Date().toISOString(),
      status: 'published'
    }])

    if (error) {
      showToast('Error generating report card: ' + error.message, 'error')
    } else {
      showToast('Report card generated successfully!', 'success')
    }
    setGenerating(false)
  }

  if (loading) return <div className="dashboard-card">Loading Report Card Data...</div>

  return (
    <div className="dashboard-card">
      <h2>Report Card Management</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Select Student</label>
          <select 
            value={selectedStudent?.id || ''} 
            onChange={e => setSelectedStudent(students.find(s => s.id === Number(e.target.value)))}
            style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}
          >
            <option value="">Choose a student...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name} - {s.class_name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#94a3b8' }}>Select Term</label>
          <select 
            value={selectedTerm} 
            onChange={e => setSelectedTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px' }}
          >
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
        </div>
      </div>

      {selectedStudent && (
        <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px', color: '#f8fafc' }}>Student Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Name</span>
              <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{selectedStudent.first_name} {selectedStudent.last_name}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Class</span>
              <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>{selectedStudent.class_name}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Fee Balance</span>
              <div style={{ color: getStudentBalance(selectedStudent.id) > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                ₦{getStudentBalance(selectedStudent.id).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleGenerateReport}
        disabled={generating || !selectedStudent}
        style={{ 
          padding: '12px 24px', 
          background: generating || !selectedStudent ? '#64748b' : '#38bdf8', 
          color: generating || !selectedStudent ? '#cbd5e1' : '#0f172a', 
          border: 'none', 
          borderRadius: '6px', 
          cursor: generating || !selectedStudent ? 'not-allowed' : 'pointer', 
          fontWeight: 'bold' 
        }}
      >
        {generating ? 'Generating...' : 'Generate Report Card'}
      </button>

      <div style={{ marginTop: '30px', padding: '15px', background: '#fef3c722', border: '1px solid #f59e0b44', borderRadius: '8px' }}>
        <strong style={{ color: '#f59e0b' }}>Note:</strong> Report cards can only be generated for students with zero fee balance. Students owing fees will be blocked.
      </div>
    </div>
  )
}

export default ReportCards
