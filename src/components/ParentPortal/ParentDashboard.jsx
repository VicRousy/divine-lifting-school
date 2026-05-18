import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function ParentDashboard({ userInfo, onLogout }) {
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [childData, setChildData] = useState({
    scores: [],
    attendance: [],
    fees: { total: 0, paid: 0, balance: 0 },
    announcements: []
  })

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id)
    }
  }, [selectedChild])

  const loadChildren = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, middle_name, last_name, class_name, student_id')
      .eq('parent_id', userInfo?.id)

    if (error) {
      console.error('Error loading children:', error)
    } else {
      setChildren(data || [])
      if (data && data.length > 0) {
        setSelectedChild(data[0])
      }
    }
    setLoading(false)
  }

  const loadChildData = async (studentId) => {
    // Load scores
    const { data: scores } = await supabase
      .from('exam_scores')
      .select('*, subjects(subject_name)')
      .eq('student_id', studentId)
      .eq('approval_status', 'approved')

    // Load attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(30)

    // Load fees
    const student = children.find(c => c.id === studentId)
    let feesData = { total: 0, paid: 0, balance: 0 }
    if (student) {
      const { data: fees } = await supabase
        .from('fees')
        .select('amount')
        .eq('class_id', student.class_id)
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('student_id', studentId)

      const totalFees = fees?.reduce((sum, f) => sum + Number(f.amount), 0) || 0
      const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0
      feesData = { total: totalFees, paid: totalPaid, balance: totalFees - totalPaid }
    }

    // Load announcements
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .or('audience.eq.all,audience.eq.parents')
      .order('created_at', { ascending: false })
      .limit(10)

    setChildData({
      scores: scores || [],
      attendance: attendance || [],
      fees: feesData,
      announcements: announcements || []
    })
  }

  const getAttendanceStats = () => {
    const total = childData.attendance.length
    const present = childData.attendance.filter(a => a.status === 'present').length
    const absent = childData.attendance.filter(a => a.status === 'absent').length
    const late = childData.attendance.filter(a => a.status === 'late').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, absent, late, percentage }
  }

  const getAverageScore = () => {
    if (childData.scores.length === 0) return 0
    const total = childData.scores.reduce((sum, s) => sum + Number(s.total_score || 0), 0)
    return Math.round(total / childData.scores.length)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      </div>
    )
  }

  const attendanceStats = getAttendanceStats()
  const averageScore = getAverageScore()

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      {/* Header */}
      <header style={{ background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Divine Lifting School</h1>
          <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Parent Portal</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '8px 15px', borderRadius: '10px', border: '1px solid #334155' }}>
            <div style={{ width: '35px', height: '35px', background: '#a855f7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f172a' }}>
              {userInfo?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{userInfo?.name || 'Parent'}</div>
              <div style={{ fontSize: '0.75rem', color: '#a855f7' }}>{userInfo?.parentId || 'ID'}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
        {/* Sidebar */}
        <aside style={{ width: '260px', background: '#1e293b', borderRight: '1px solid #334155', padding: '20px 0' }}>
          {/* Child Switcher */}
          <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px' }}>My Children</h3>
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '5px',
                  background: selectedChild?.id === child.id ? '#334155' : 'transparent',
                  border: selectedChild?.id === child.id ? '1px solid #a855f7' : '1px solid transparent',
                  borderRadius: '6px',
                  color: selectedChild?.id === child.id ? '#f8fafc' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{child.first_name} {child.last_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{child.class_name}</div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <nav style={{ padding: '20px' }}>
            <button onClick={() => setActiveTab('overview')} style={{ width: '100%', padding: '10px', background: activeTab === 'overview' ? '#334155' : 'transparent', border: 'none', borderRadius: '6px', color: activeTab === 'overview' ? '#f8fafc' : '#94a3b8', cursor: 'pointer', textAlign: 'left', marginBottom: '5px' }}>Overview</button>
            <button onClick={() => setActiveTab('report-card')} style={{ width: '100%', padding: '10px', background: activeTab === 'report-card' ? '#334155' : 'transparent', border: 'none', borderRadius: '6px', color: activeTab === 'report-card' ? '#f8fafc' : '#94a3b8', cursor: 'pointer', textAlign: 'left', marginBottom: '5px' }}>Report Card</button>
            <button onClick={() => setActiveTab('attendance')} style={{ width: '100%', padding: '10px', background: activeTab === 'attendance' ? '#334155' : 'transparent', border: 'none', borderRadius: '6px', color: activeTab === 'attendance' ? '#f8fafc' : '#94a3b8', cursor: 'pointer', textAlign: 'left', marginBottom: '5px' }}>Attendance</button>
            <button onClick={() => setActiveTab('fees')} style={{ width: '100%', padding: '10px', background: activeTab === 'fees' ? '#334155' : 'transparent', border: 'none', borderRadius: '6px', color: activeTab === 'fees' ? '#f8fafc' : '#94a3b8', cursor: 'pointer', textAlign: 'left', marginBottom: '5px' }}>Fees</button>
            <button onClick={() => setActiveTab('announcements')} style={{ width: '100%', padding: '10px', background: activeTab === 'announcements' ? '#334155' : 'transparent', border: 'none', borderRadius: '6px', color: activeTab === 'announcements' ? '#f8fafc' : '#94a3b8', cursor: 'pointer', textAlign: 'left' }}>Announcements</button>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {selectedChild ? (
            <>
              {/* Child Header */}
              <div style={{ marginBottom: '30px', padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <h2 style={{ margin: '0 0 5px', color: '#f8fafc' }}>{selectedChild.first_name} {selectedChild.last_name}</h2>
                <p style={{ margin: 0, color: '#94a3b8' }}>Class: {selectedChild.class_name} | ID: {selectedChild.student_id}</p>
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Average Score</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#38bdf8' }}>{averageScore}%</div>
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Attendance</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{attendanceStats.percentage}%</div>
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Fee Balance</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: childData.fees.balance > 0 ? '#ef4444' : '#10b981' }}>₦{childData.fees.balance.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Subjects</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#a855f7' }}>{childData.scores.length}</div>
                    </div>
                  </div>

                  {/* Recent Announcements */}
                  <h3 style={{ color: '#f8fafc', marginBottom: '15px' }}>Recent Announcements</h3>
                  {childData.announcements.length > 0 ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {childData.announcements.slice(0, 3).map(ann => (
                        <div key={ann.id} style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                          <h4 style={{ margin: '0 0 5px', color: '#f8fafc' }}>{ann.title}</h4>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{ann.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b' }}>No announcements yet.</p>
                  )}
                </div>
              )}

              {/* Report Card Tab */}
              {activeTab === 'report-card' && (
                <div>
                  <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Academic Report</h3>
                  {childData.scores.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #334155' }}>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Subject</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>CA1</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>CA2</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Exam</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Total</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childData.scores.map(score => {
                          const total = Number(score.total_score || 0)
                          let grade = 'F'
                          if (total >= 70) grade = 'A'
                          else if (total >= 60) grade = 'B'
                          else if (total >= 50) grade = 'C'
                          else if (total >= 45) grade = 'D'
                          else if (total >= 40) grade = 'E'
                          
                          return (
                            <tr key={score.id} style={{ borderBottom: '1px solid #334155' }}>
                              <td style={{ padding: '10px' }}>{score.subjects?.subject_name}</td>
                              <td style={{ padding: '10px' }}>{score.ca1 || 0}</td>
                              <td style={{ padding: '10px' }}>{score.ca2 || 0}</td>
                              <td style={{ padding: '10px' }}>{score.exam_score || 0}</td>
                              <td style={{ padding: '10px', fontWeight: 'bold' }}>{total}</td>
                              <td style={{ padding: '10px' }}>
                                <span style={{ 
                                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                  background: total >= 50 ? '#10b98122' : '#ef444422',
                                  color: total >= 50 ? '#10b981' : '#ef4444'
                                }}>
                                  {grade}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#64748b' }}>No report card available yet.</p>
                  )}
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div>
                  <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Attendance Record</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{attendanceStats.present}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Present</div>
                    </div>
                    <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{attendanceStats.absent}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Absent</div>
                    </div>
                    <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{attendanceStats.late}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Late</div>
                    </div>
                    <div style={{ padding: '15px', background: '#1e293b', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{attendanceStats.percentage}%</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Attendance Rate</div>
                    </div>
                  </div>
                  
                  {childData.attendance.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #334155' }}>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Date</th>
                          <th style={{ padding: '10px', textAlign: 'left', color: '#94a3b8' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {childData.attendance.map(att => (
                          <tr key={att.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '10px' }}>{new Date(att.date).toLocaleDateString()}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ 
                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                                background: att.status === 'present' ? '#10b98122' : att.status === 'absent' ? '#ef444422' : '#f59e0b22',
                                color: att.status === 'present' ? '#10b981' : att.status === 'absent' ? '#ef4444' : '#f59e0b'
                              }}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#64748b' }}>No attendance records yet.</p>
                  )}
                </div>
              )}

              {/* Fees Tab */}
              {activeTab === 'fees' && (
                <div>
                  <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Fee Status</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '8px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Total Fees</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>₦{childData.fees.total.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '8px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Amount Paid</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>₦{childData.fees.paid.toLocaleString()}</div>
                    </div>
                    <div style={{ padding: '20px', background: '#1e293b', borderRadius: '8px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px' }}>Balance</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: childData.fees.balance > 0 ? '#ef4444' : '#10b981' }}>₦{childData.fees.balance.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {childData.fees.balance > 0 && (
                    <div style={{ padding: '15px', background: '#ef444422', border: '1px solid #ef444444', borderRadius: '8px', color: '#ef4444' }}>
                      <strong>Outstanding Balance:</strong> Please contact the school administrator to clear fees. Report cards will be blocked until fees are paid.
                    </div>
                  )}
                </div>
              )}

              {/* Announcements Tab */}
              {activeTab === 'announcements' && (
                <div>
                  <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>School Announcements</h3>
                  {childData.announcements.length > 0 ? (
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {childData.announcements.map(ann => (
                        <div key={ann.id} style={{ padding: '20px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, color: '#f8fafc' }}>{ann.title}</h4>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                              {new Date(ann.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#94a3b8', lineHeight: '1.6' }}>{ann.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b' }}>No announcements yet.</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
              <h3>No children linked to your account</h3>
              <p>Please contact the school administrator to link your children.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ParentDashboard
