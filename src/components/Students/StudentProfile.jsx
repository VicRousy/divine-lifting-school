import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function StudentProfile({ student, onBack }) {
  const [academicSquad, setAcademicSquad] = useState([])
  const [feeHistory, setFeeHistory] = useState([])
  const [reportScores, setReportScores] = useState([]) // NEW: Academic data
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('finance') // NEW: Tab switcher
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  const [newPayment, setNewPayment] = useState({
    amount: '',
    method: 'Cash',
    term: 'First Term 2026'
  })

  // NEW LOGIC: Grading helper for the report
  const getGrade = (total) => {
    const score = Number(total);
    if (score >= 80) return { grade: 'A+', remark: 'Distinction' };
    if (score >= 70) return { grade: 'A1', remark: 'Excellent' };
    if (score >= 60) return { grade: 'B',  remark: 'Very Good' };
    if (score >= 50) return { grade: 'C',  remark: 'Credit' };
    if (score >= 40) return { grade: 'D',  remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
  };

  const tuitionFee = student.classes?.base_fee || 50000

  // NEW LOGIC: Report Card Printing
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    const totalObtained = reportScores.reduce((acc, s) => acc + s.total_score, 0);
    const average = reportScores.length > 0 ? (totalObtained / reportScores.length).toFixed(1) : 0;

    const reportContent = `
      <html>
        <head>
          <title>Report Card - ${student.first_name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #000; }
            .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; }
            .summary { display: flex; justify-content: space-between; margin-top: 30px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DIVINE LIFTING SCHOOL</h1>
            <h3>TERMINAL PROGRESS REPORT</h3>
            <p>NAME: ${student.first_name} ${student.last_name} | CLASS: ${student.classes?.class_name} | TERM: First Term 2026</p>
          </div>
          <table>
            <thead>
              <tr><th>SUBJECT</th><th>CA (40)</th><th>EXAM (60)</th><th>TOTAL</th><th>GRADE</th><th>REMARK</th></tr>
            </thead>
            <tbody>
              ${reportScores.map(s => `
                <tr>
                  <td style="text-align: left">${s.subjects?.subject_name}</td>
                  <td>${s.ca_score}</td>
                  <td>${s.exam_score}</td>
                  <td>${s.total_score}</td>
                  <td>${getGrade(s.total_score).grade}</td>
                  <td>${getGrade(s.total_score).remark}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div>Average: ${average}%</div>
            <div>Principal's Sign: _________________</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(reportContent);
    printWindow.document.close();
  };

  const handlePrintReceipt = (fee) => {
    const printWindow = window.open('', '_blank');
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${student.first_name} ${student.last_name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .receipt-container { max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 10px; }
            .header { text-align: center; border-bottom: 3px solid #38bdf8; padding-bottom: 20px; margin-bottom: 20px; }
            .school-name { font-size: 28px; font-weight: 800; color: #0f172a; }
            .receipt-label { text-transform: uppercase; letter-spacing: 3px; color: #64748b; font-size: 14px; margin-top: 5px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .detail-item { font-size: 14px; }
            .label { color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase; }
            .value { color: #0f172a; font-size: 16px; font-weight: 500; }
            .amount-section { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 1px solid #38bdf8; }
            .amount-label { font-size: 14px; color: #38bdf8; font-weight: bold; }
            .amount-value { font-size: 32px; font-weight: 800; color: #0f172a; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature-line { border-top: 1px solid #1e293b; width: 200px; text-align: center; font-size: 12px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="school-name">DIVINE LIFTING SCHOOL</div>
              <div class="receipt-label">Official Payment Receipt</div>
            </div>
            
            <div class="details-grid">
              <div class="detail-item"><div class="label">Student</div><div class="value">${student.first_name} ${student.last_name}</div></div>
              <div class="detail-item"><div class="label">Date</div><div class="value">${new Date(fee.payment_date).toLocaleDateString()}</div></div>
              <div class="detail-item"><div class="label">Class</div><div class="value">${student.classes?.class_name}</div></div>
              <div class="detail-item"><div class="label">Term</div><div class="value">${fee.term}</div></div>
              <div class="detail-item"><div class="label">Method</div><div class="value">${fee.payment_method}</div></div>
              <div class="detail-item"><div class="label">Receipt ID</div><div class="value">#REC-${fee.id.toString().slice(-5)}</div></div>
            </div>

            <div class="amount-section">
              <div class="amount-label">TOTAL AMOUNT PAID</div>
              <div class="amount-value">₦${Number(fee.amount_paid).toLocaleString()}</div>
            </div>

            <div class="footer">
              <div style="font-size: 10px; color: #94a3b8;">Generated on: ${new Date().toLocaleString()}</div>
              <div class="signature-line">School Bursar / Admin</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Fetch Teachers
    const { data: squad } = await supabase
      .from('teacher_assignments')
      .select(`id, teachers (first_name, last_name), subjects (subject_name)`)
      .eq('class_id', student.class_id)
    setAcademicSquad(squad || [])

    // 2. Fetch Fee History
    const { data: fees } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', student.id)
      .order('payment_date', { ascending: false })
    setFeeHistory(fees || [])

    // 3. NEW: Fetch Exam Scores for Report
    const { data: scores } = await supabase
      .from('exam_scores')
      .select('*, subjects(subject_name)')
      .eq('student_id', student.id)
      .eq('term', 'First Term 2026')
    setReportScores(scores || [])

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [student.id])

  const handleAddPayment = async () => {
    const { error } = await supabase.from('fees').insert([{
      student_id: student.id,
      amount_paid: parseFloat(newPayment.amount),
      payment_method: newPayment.method,
      term: newPayment.term,
      total_tuition: tuitionFee 
    }])

    if (error) alert(error.message)
    else {
      setShowPaymentModal(false)
      setNewPayment({ ...newPayment, amount: '' })
      fetchData() 
    }
  }

  const totalPaid = feeHistory.reduce((sum, record) => sum + Number(record.amount_paid), 0)
  const balance = tuitionFee - totalPaid

  return (
    <div className="profile-view" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header with Back Button and Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={onBack} className="btn-cancel" style={{ padding: '10px 20px' }}>← Back to Master List</button>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Financial Status:</span>
          <span style={{ 
            color: balance <= 0 ? '#10b981' : '#ef4444', 
            marginLeft: '8px', 
            fontWeight: 'bold' 
          }}>
            {balance <= 0 ? '● FULLY PAID' : `● OWING ₦${balance.toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* Student Banner */}
      <div style={{ 
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', 
        padding: '30px', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex', gap: '30px', alignItems: 'center', marginBottom: '20px'
      }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #38bdf8, #a855f7)', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', color: '#fff' }}>
          {student.first_name[0]}{student.last_name[0]}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{student.first_name} {student.last_name}</h2>
          <p className="text-dim" style={{ margin: 0 }}>Class: <span style={{ color: '#38bdf8' }}>{student.classes?.class_name}</span></p>
        </div>
      </div>

      {/* NEW: TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #334155' }}>
        <button 
          onClick={() => setActiveTab('finance')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'finance' ? '3px solid #38bdf8' : 'none', color: activeTab === 'finance' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}
        >
          💰 Finance & Fees
        </button>
        <button 
          onClick={() => setActiveTab('report')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'report' ? '3px solid #a855f7' : 'none', color: activeTab === 'report' ? '#a855f7' : '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📄 Terminal Report Card
        </button>
      </div>

      {/* TAB CONTENT: FINANCE */}
      {activeTab === 'finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          <div>
            <h3 style={{ color: '#f8fafc', marginBottom: '15px' }}>Payment History</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Term</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeHistory.map(fee => (
                    <tr key={fee.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '12px' }}>{new Date(fee.payment_date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>{fee.term}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#10b981' }}>₦{Number(fee.amount_paid).toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => handlePrintReceipt(fee)} style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.75rem' }}>
                          🖨️ Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <button onClick={() => setShowPaymentModal(true)} style={{ width: '100%', padding: '15px', background: '#38bdf8', color: '#020617', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }}>
              ➕ Record New Payment
            </button>
            <div style={{ padding: '20px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Fee Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span className="text-dim">Total Tuition:</span><span>₦{tuitionFee.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span className="text-dim">Total Paid:</span><span style={{ color: '#10b981' }}>₦{totalPaid.toLocaleString()}</span></div>
              <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Balance:</span><span style={{ color: balance > 0 ? '#ef4444' : '#10b981' }}>₦{balance.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPORT CARD */}
      {activeTab === 'report' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ color: '#f8fafc' }}>Academic Performance (2025/2026)</h3>
            <button 
              onClick={handlePrintReport}
              style={{ background: '#a855f7', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🖨️ Print Report Card
            </button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                <tr>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Subject</th>
                  <th style={{ padding: '15px' }}>CA (40)</th>
                  <th style={{ padding: '15px' }}>Exam (60)</th>
                  <th style={{ padding: '15px' }}>Total</th>
                  <th style={{ padding: '15px' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {reportScores.map(score => (
                  <tr key={score.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '15px' }}>{score.subjects?.subject_name}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{score.ca_score}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>{score.exam_score}</td>
                    <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#38bdf8' }}>{score.total_score}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                        {getGrade(score.total_score).grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {reportScores.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }} className="text-dim">No results recorded for this term yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal remains the same */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3>Record Payment</h3>
            <div className="form-group">
              <label>Amount (₦)</label>
              <input type="number" className="counter" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} placeholder="e.g. 20000" style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '8px' }} />
            </div>
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>Method</label>
              <select className="counter" value={newPayment.method} onChange={(e) => setNewPayment({...newPayment, method: e.target.value})} style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '8px' }}>
                <option value="Cash">Cash</option>
                <option value="Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
              </select>
            </div>
            <div className="action-group" style={{ marginTop: '25px' }}>
              <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
              <button className="btn-delete" style={{ background: '#38bdf8' }} onClick={handleAddPayment}>Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentProfile