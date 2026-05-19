import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import AnnouncementsWidget from '../Common/AnnouncementsWidget'

export default function ParentDashboard({ userInfo, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [fees, setFees] = useState([])
  const [homework, setHomework] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userInfo?.parentId || userInfo?.id) {
      fetchChildren()
    }
  }, [userInfo])

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.id)
    }
  }, [selectedChild])

  const fetchChildren = async () => {
    setLoading(true)
    try {
      const parentId = userInfo.parentId || userInfo.id
      const { data } = await supabase
        .from('students')
        .select('id, first_name, middle_name, last_name, class_id, student_id, classes(class_name)')
        .eq('parent_id', parentId)
        .eq('is_active', true)

      const childList = data || []
      setChildren(childList)
      if (childList.length > 0) {
        setSelectedChild(childList[0])
      }
    } catch (err) {
      console.error('Failed to fetch children:', err)
    }
    setLoading(false)
  }

  const fetchChildData = async (childId) => {
    setLoading(true)
    try {
      const [{ data: gradesData }, { data: attendanceData }, { data: feesData }, { data: homeworkData }] = await Promise.all([
        supabase.from('exam_scores').select('*, subjects(subject_name)').eq('student_id', childId).eq('approval_status', 'approved').order('created_at', { ascending: false }),
        supabase.from('attendance').select('*').eq('student_id', childId).order('date', { ascending: false }).limit(30),
        supabase.from('payments').select('*').eq('student_id', childId).order('created_at', { ascending: false }),
        supabase.from('homeworks').select('*').order('created_at', { ascending: false }),
      ])

      setGrades(gradesData || [])
      setAttendance(attendanceData || [])
      setFees(feesData || [])
      setHomework(homeworkData || [])
    } catch (err) {
      console.error('Failed to fetch child data:', err)
    }
    setLoading(false)
  }

  const getGradeInfo = (total) => {
    const score = Number(total)
    if (score >= 90) return { grade: 'A+', color: '#10b981' }
    if (score >= 80) return { grade: 'A', color: '#34d399' }
    if (score >= 70) return { grade: 'B+', color: '#38bdf8' }
    if (score >= 60) return { grade: 'B', color: '#f59e0b' }
    if (score >= 50) return { grade: 'C', color: '#fbbf24' }
    return { grade: 'F', color: '#ef4444' }
  }

  const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0)
  const paidFees = fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0)
  const pendingFees = totalFees - paidFees

  const presentDays = attendance.filter((a) => a.status === 'present').length
  const absentDays = attendance.filter((a) => a.status === 'absent').length
  const attendanceRate = attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 0

  if (loading && !selectedChild) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#94a3b8' }}>
        Loading parent portal...
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#94a3b8' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>No children registered</h2>
          <p>Contact the school administration to link your child's account.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#f8fafc' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #334155' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#a855f7' }}>Parent Portal</h2>
          <p style={{ margin: '5px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Divine Lifting School</p>
        </div>

        <nav style={{ flex: 1, padding: '20px 0' }}>
          {[
            { key: 'overview', icon: '📊', label: 'Overview' },
            { key: 'grades', icon: '', label: 'Grades' },
            { key: 'attendance', icon: '', label: 'Attendance' },
            { key: 'fees', icon: '💰', label: 'Fees' },
            { key: 'homework', icon: '', label: 'Homework' },
          ].map((item) => (
            <div
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer',
                background: activeTab === item.key ? '#334155' : 'transparent',
                borderLeft: activeTab === item.key ? '3px solid #a855f7' : '3px solid transparent',
                color: activeTab === item.key ? '#f8fafc' : '#94a3b8',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { if (activeTab !== item.key) e.currentTarget.style.background = '#33415544' }}
              onMouseOut={(e) => { if (activeTab !== item.key) e.currentTarget.style.background = 'transparent' }}
            >
              <span>{item.icon}</span>
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
          <button onClick={onLogout} style={{ width: '100%', padding: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#f8fafc' }}>Divine Lifting School</h1>
            <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>Parent Portal</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Child Selector */}
            {children.length > 1 && (
              <select
                value={selectedChild?.id || ''}
                onChange={(e) => setSelectedChild(children.find((c) => String(c.id) === e.target.value))}
                style={{ padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', outline: 'none' }}
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0f172a', padding: '8px 15px', borderRadius: 10, border: '1px solid #334155' }}>
              <div style={{ width: 35, height: 35, background: '#a855f7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f172a' }}>
                {userInfo?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{userInfo?.name || 'Parent'}</div>
                <div style={{ fontSize: '0.75rem', color: '#a855f7' }}>{userInfo?.parentId || 'Parent'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, padding: 30 }}>
          {selectedChild && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Welcome, {userInfo?.name}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8 }}>Child</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>{selectedChild.first_name} {selectedChild.last_name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>{selectedChild.classes?.class_name}</div>
                    </div>
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8 }}>Attendance Rate</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: attendanceRate >= 80 ? '#10b981' : '#f59e0b' }}>{attendanceRate}%</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>{presentDays} present / {absentDays} absent</div>
                    </div>
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8 }}>Fees Pending</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: pendingFees > 0 ? '#ef4444' : '#10b981' }}>₦{pendingFees.toLocaleString()}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>Paid: ₦{paidFees.toLocaleString()}</div>
                    </div>
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 8 }}>Pending Homework</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{homework.length}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>Assignments</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, padding: 24 }}>
                    <h3 style={{ margin: '0 0 16px', color: '#f8fafc' }}>Recent Activity</h3>
                    {grades.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {grades.slice(0, 5).map((g) => {
                          const total = Number(g.ca1_score || 0) + Number(g.ca2_score || 0) + Number(g.exam_score || 0)
                          const gradeInfo = getGradeInfo(total)
                          return (
                            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                              <div>
                                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{g.subjects?.subject_name}</div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>CA1: {g.ca1_score} | CA2: {g.ca2_score} | Exam: {g.exam_score}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: gradeInfo.color }}>{gradeInfo.grade}</div>
                                <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{total}/100</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>No grades available yet.</div>
                    )}
                  </div>

                  {/* Announcements */}
                  <AnnouncementsWidget role="parents" />
                </div>
              )}

              {/* Grades Tab */}
              {activeTab === 'grades' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Academic Grades</h2>
                  {grades.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No grades available yet.</div>
                  ) : (
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #334155' }}>
                            {['SUBJECT', 'CA1 (20)', 'CA2 (20)', 'EXAM (60)', 'TOTAL', 'GRADE', 'STATUS'].map((h) => (
                              <th key={h} style={{ padding: 14, textAlign: h === 'SUBJECT' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {grades.map((g) => {
                            const total = Number(g.ca1_score || 0) + Number(g.ca2_score || 0) + Number(g.exam_score || 0)
                            const gradeInfo = getGradeInfo(total)
                            return (
                              <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{g.subjects?.subject_name}</td>
                                <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{g.ca1_score}</td>
                                <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{g.ca2_score}</td>
                                <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{g.exam_score}</td>
                                <td style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: '#e2e8f0' }}>{total}</td>
                                <td style={{ padding: 14, textAlign: 'center', fontWeight: 700, color: gradeInfo.color }}>{gradeInfo.grade}</td>
                                <td style={{ padding: 14, textAlign: 'center' }}>
                                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Approved</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Attendance Record</h2>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                    <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: 4 }}>Present</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{presentDays} days</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: 4 }}>Absent</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{absentDays} days</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(56,189,248,0.1)', border: '1px solid #38bdf8', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#38bdf8', marginBottom: 4 }}>Attendance Rate</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>{attendanceRate}%</div>
                    </div>
                  </div>

                  {attendance.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No attendance records found.</div>
                  ) : (
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #334155' }}>
                            {['DATE', 'STATUS'].map((h) => (
                              <th key={h} style={{ padding: 14, textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.map((a) => (
                            <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0' }}>{new Date(a.date).toLocaleDateString()}</td>
                              <td style={{ padding: 14, textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 12px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600,
                                  background: a.status === 'present' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: a.status === 'present' ? '#10b981' : '#ef4444',
                                }}>
                                  {a.status === 'present' ? '✅ Present' : '❌ Absent'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Fees Tab */}
              {activeTab === 'fees' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Fee Status</h2>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                    <div style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: 4 }}>Total Pending</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>₦{pendingFees.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: 4 }}>Total Paid</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>₦{paidFees.toLocaleString()}</div>
                    </div>
                  </div>

                  {fees.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No fee records found.</div>
                  ) : (
                    <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #334155' }}>
                            {['FEE TYPE', 'AMOUNT', 'DUE DATE', 'STATUS', 'PAID DATE'].map((h) => (
                              <th key={h} style={{ padding: 14, textAlign: h === 'FEE TYPE' ? 'left' : 'center', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fees.map((f) => (
                            <tr key={f.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <td style={{ padding: 14, color: '#e2e8f0', fontWeight: 600 }}>{f.fee_type}</td>
                              <td style={{ padding: 14, textAlign: 'center', color: '#e2e8f0', fontWeight: 700 }}>₦{f.amount?.toLocaleString()}</td>
                              <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>{new Date(f.due_date).toLocaleDateString()}</td>
                              <td style={{ padding: 14, textAlign: 'center' }}>
                                <span style={{
                                  padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                                  background: f.status === 'paid' ? 'rgba(16,185,129,0.15)' : f.status === 'overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: f.status === 'paid' ? '#10b981' : f.status === 'overdue' ? '#ef4444' : '#f59e0b',
                                }}>
                                  {f.status}
                                </span>
                              </td>
                              <td style={{ padding: 14, textAlign: 'center', color: '#94a3b8' }}>
                                {f.paid_at ? new Date(f.paid_at).toLocaleDateString() : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Homework Tab */}
              {activeTab === 'homework' && (
                <div>
                  <h2 style={{ margin: '0 0 20px', color: '#f8fafc' }}>Homework & Assignments</h2>
                  {homework.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', border: '1px dashed #334155', borderRadius: 14 }}>No homework assigned yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {homework.map((hw) => (
                        <div key={hw.id} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>{hw.title}</h4>
                              <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.9rem' }}>{hw.description}</p>
                              <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#64748b' }}>
                                <span>📅 Due: {new Date(hw.due_date).toLocaleDateString()}</span>
                                <span>🏫 Class ID: {hw.class_id}</span>
                              </div>
                            </div>
                            <span style={{
                              padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                              background: new Date(hw.due_date) < new Date() ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                              color: new Date(hw.due_date) < new Date() ? '#ef4444' : '#f59e0b',
                            }}>
                              {new Date(hw.due_date) < new Date() ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
