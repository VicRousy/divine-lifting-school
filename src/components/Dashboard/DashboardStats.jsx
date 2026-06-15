import { useState, useEffect, memo } from 'react'
import { supabase } from '../../supabaseClient'

function DashboardStats({ refreshTrigger, onNavigate }) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
    assignments: 0,
    feesPending: 0,
    attendanceToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [expandedChart, setExpandedChart] = useState(false)
  const [academicData, setAcademicData] = useState({
    averageGrade: 0,
    activityIndex: 0,
    retentionRate: 0,
    classDistribution: [],
    teacherDistribution: [],
    assignmentCompletion: 0,
    performanceTrend: [],
    performanceLabels: [],
  })
  const [academicLoading, setAcademicLoading] = useState(true)

  const getStats = async () => {
    setLoading(true)
    try {
      const [resS, resT, resC, resA] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('teacher_assignments').select('id', { count: 'exact', head: true }),
      ])

      const [attRes, feeRes] = await Promise.all([
        supabase.from('attendance').select('id', { count: 'exact' }).eq('date', new Date().toISOString().split('T')[0]).eq('status', 'present'),
        supabase.from('payments').select('amount').eq('status', 'pending'),
      ])

      const feesPending = feeRes.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

      const newStats = {
        students: resS.count || 0,
        teachers: resT.count || 0,
        classes: resC.count || 0,
        assignments: resA.count || 0,
        feesPending,
        attendanceToday: attRes.count || 0,
      }

      setStats(newStats)
      setHasData(newStats.students > 0 || newStats.teachers > 0 || newStats.classes > 0)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicData = async () => {
    setAcademicLoading(true)
    try {
      // Fetch all exam scores for academic performance
      const { data: scores } = await supabase
        .from('exam_scores')
        .select('student_id, class_id, ca1_score, ca2_score, exam_score, approval_status')
        .eq('approval_status', 'approved')

      // Fetch class distribution
      const { data: classDist } = await supabase
        .from('students')
        .select('class_id, classes(class_name)')
        .eq('is_active', true)

      // Fetch teacher assignments for distribution
      const { data: teacherAssign } = await supabase
        .from('teacher_assignments')
        .select('subject_id, subjects(subject_name)')

      // Fetch attendance for activity index
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('status', 'present')

      // Calculate metrics
      const totalScores = scores || []
      const avgTotal = totalScores.length > 0
        ? totalScores.reduce((sum, s) => sum + (Number(s.ca1_score || 0) + Number(s.ca2_score || 0) + Number(s.exam_score || 0)), 0) / totalScores.length
        : 0

      // Map average to grade point (0-4.0 scale)
      const averageGrade = avgTotal > 0 ? ((avgTotal / 100) * 4).toFixed(2) : 0

      // Activity index based on attendance rate
      const totalAttendance = attendance?.length || 0
      const totalPossible = stats.students * 30 // Approximate school days
      const activityIndex = totalPossible > 0 ? Math.round((totalAttendance / totalPossible) * 100) : 0

      // Retention rate (simplified: active students / total registered)
      const { count: activeCount } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('is_active', true)
      const { count: totalCount } = await supabase.from('students').select('id', { count: 'exact', head: true })
      const retentionRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100

      // Class distribution
      const classMap = {}
      classDist?.forEach((s) => {
        const className = s.classes?.class_name || 'Unknown'
        classMap[className] = (classMap[className] || 0) + 1
      })
      const classDistribution = Object.entries(classMap).map(([name, count]) => ({ name, count }))

      // Teacher distribution by subject
      const subjectMap = {}
      teacherAssign?.forEach((a) => {
        const subjectName = a.subjects?.subject_name || 'Unknown'
        subjectMap[subjectName] = (subjectMap[subjectName] || 0) + 1
      })
      const teacherDistribution = Object.entries(subjectMap).map(([name, count]) => ({ name, count }))

      // Assignment completion (simplified: approved scores / total possible)
      const assignmentCompletion = stats.assignments > 0 ? Math.min(100, Math.round((totalScores.length / (stats.assignments * stats.students)) * 100)) : 0

      // Performance trend (last 6 terms dynamically)
      const termMap = {}
      totalScores.forEach(s => {
        const key = `${s.academic_year} - ${s.term}`
        if (!termMap[key]) termMap[key] = { total: 0, count: 0 }
        termMap[key].total += (Number(s.ca1_score || 0) + Number(s.ca2_score || 0) + Number(s.exam_score || 0))
        termMap[key].count++
      })

      const termAverages = Object.entries(termMap)
        .map(([key, val]) => ({
          term: key,
          avg: val.count > 0 ? val.total / val.count : 0
        }))
        .sort((a, b) => {
          // Sort by academic year then term
          const yearA = a.term.split(' - ')[0]
          const yearB = b.term.split(' - ')[0]
          if (yearA !== yearB) return yearA.localeCompare(yearB)
          return a.term.localeCompare(b.term)
        })
        .slice(-6) // Last 6 terms

      const performanceTrend = termAverages.length > 0
        ? termAverages.map(t => Math.round(t.avg))
        : [0, 0, 0, 0, 0, avgTotal > 0 ? Math.round(avgTotal) : 0]
      
      const performanceLabels = termAverages.length > 0
        ? termAverages.map(t => t.term)
        : ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Current']

      setAcademicData({
        averageGrade,
        activityIndex,
        retentionRate,
        classDistribution,
        teacherDistribution,
        assignmentCompletion,
        performanceTrend,
        performanceLabels,
      })
    } catch (err) {
      console.error('Error fetching academic data:', err);
    } finally {
      setAcademicLoading(false)
    }
  }

  useEffect(() => {
    getStats()
  }, [refreshTrigger])

  useEffect(() => {
    if (hasData) {
      fetchAcademicData()
    }
  }, [hasData, refreshTrigger])

  const maxVal = Math.max(stats.students, stats.teachers, stats.classes, 1)

  const handleCardClick = (tab) => {
    if (onNavigate) onNavigate(tab)
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, height: 100, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    )
  }

  if (!hasData) {
    return (
      <div style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.1), rgba(168,85,247,0.1))', border: '1px solid #38bdf8', borderRadius: 16, padding: 40, textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ margin: '0 0 10px', color: '#f8fafc' }}>≡ƒæï Welcome to Divine Lifting School Admin</h2>
        <p style={{ margin: '0 0 30px', color: '#94a3b8' }}>Your school management system is ready. Start by adding your first records.</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>1∩╕ÅΓâú</div>
            <h4 style={{ margin: '0 0 5px', color: '#38bdf8' }}>Add Classes</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Define your school structure (JSS1, SSS1, etc.)</p>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>2∩╕ÅΓâú</div>
            <h4 style={{ margin: '0 0 5px', color: '#a855f7' }}>Register Staff</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Add teachers and assign them to subjects.</p>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>3∩╕ÅΓâú</div>
            <h4 style={{ margin: '0 0 5px', color: '#10b981' }}>Enroll Students</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Register students and link them to parents.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Stats Grid - All Clickable */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="Total Students" value={stats.students} color="#38bdf8" icon="≡ƒÄô" onClick={() => handleCardClick('student-list')} />
        <StatCard title="Staff Members" value={stats.teachers} color="#a855f7" icon="≡ƒÆ╝" onClick={() => handleCardClick('teacher-list')} />
        <StatCard title="Classrooms" value={stats.classes} color="#fbbf24" icon="≡ƒÅ½" onClick={() => handleCardClick('class-list')} />
        <StatCard title="Active Assignments" value={stats.assignments} color="#10b981" icon="" onClick={() => handleCardClick('assignments')} />
        <StatCard title="Pending Fees" value={`Γéª${stats.feesPending.toLocaleString()}`} color="#ef4444" icon="≡ƒÆ░" onClick={() => handleCardClick('fees')} />
        <StatCard title="Present Today" value={stats.attendanceToday} color="#22c55e" icon="Γ£à" onClick={() => handleCardClick('teacher-attendance')} />
      </div>

      {/* Visual Chart Section */}
      <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 16, padding: expandedChart ? 40 : 30, marginBottom: 40, transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>≡ƒôè School Overview Distribution</h3>
          <button
            onClick={() => setExpandedChart(!expandedChart)}
            style={{
              padding: '8px 16px',
              background: expandedChart ? '#334155' : '#38bdf8',
              color: expandedChart ? '#94a3b8' : '#0f172a',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {expandedChart ? 'Γ£ò Close Detailed View' : '≡ƒôê View Detailed Report'}
          </button>
        </div>

        {!expandedChart ? (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, height: 200, paddingBottom: 20, borderBottom: '1px solid #334155' }}>
              <ChartBar label="Students" value={stats.students} max={maxVal} color="#38bdf8" />
              <ChartBar label="Teachers" value={stats.teachers} max={maxVal} color="#a855f7" />
              <ChartBar label="Classes" value={stats.classes} max={maxVal} color="#fbbf24" />
              <ChartBar label="Assignments" value={stats.assignments} max={maxVal} color="#10b981" />
            </div>
            <div style={{ marginTop: 15, fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
              Visual representation of current school data
            </div>
          </>
        ) : (
          <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30, marginTop: 20 }}>
            {/* Students per Classroom */}
            <div>
              <h4 style={{ margin: '0 0 15px', color: '#38bdf8', fontSize: '0.9rem' }}>Students per Classroom</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {academicData.classDistribution.length > 0 ? academicData.classDistribution.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 80, fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>{c.name}</span>
                    <div style={{ flex: 1, height: 20, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(c.count / Math.max(...academicData.classDistribution.map(x => x.count))) * 100}%`, height: '100%', background: '#38bdf8', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ width: 30, fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>{c.count}</span>
                  </div>
                )) : <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No data</span>}
              </div>
            </div>

            {/* Teachers by Department */}
            <div>
              <h4 style={{ margin: '0 0 15px', color: '#a855f7', fontSize: '0.9rem' }}>Teachers by Subject</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {academicData.teacherDistribution.length > 0 ? academicData.teacherDistribution.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 80, fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>{t.name}</span>
                    <div style={{ flex: 1, height: 20, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(t.count / Math.max(...academicData.teacherDistribution.map(x => x.count))) * 100}%`, height: '100%', background: '#a855f7', transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ width: 30, fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>{t.count}</span>
                  </div>
                )) : <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No data</span>}
              </div>
            </div>

            {/* Assignment Completion */}
            <div>
              <h4 style={{ margin: '0 0 15px', color: '#10b981', fontSize: '0.9rem' }}>Assignment Completion</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <div style={{ position: 'relative', width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray={`${academicData.assignmentCompletion * 2.51} 251`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>
                    {academicData.assignmentCompletion}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Academic Success & Vitality Index */}
      <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 16, padding: 30, marginBottom: 40 }}>
        <h3 style={{ margin: '0 0 20px', color: '#f8fafc', fontSize: '1.1rem' }}> School Academic Success & Vitality Index</h3>
        
        {academicLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading academic data...</div>
        ) : (
          <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
            {/* Performance Gauge */}
            <div>
              <h4 style={{ margin: '0 0 15px', color: '#94a3b8', fontSize: '0.85rem' }}>ACADEMIC PERFORMANCE TREND</h4>
              <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: 12, padding: 20, height: 200, position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((val) => (
                    <line key={val} x1="0" y1={150 - (val / 100) * 150} x2="400" y2={150 - (val / 100) * 150} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  {/* Area fill */}
                  <path
                    d={`M 0 ${150 - (academicData.performanceTrend[0] / 100) * 150} ${academicData.performanceTrend.map((v, i) => `L ${(i / (academicData.performanceTrend.length - 1)) * 400} ${150 - (v / 100) * 150}`).join(' ')} L 400 150 L 0 150 Z`}
                    fill="url(#perfGrad)"
                  />
                  {/* Line */}
                  <polyline
                    points={academicData.performanceTrend.map((v, i) => `${(i / (academicData.performanceTrend.length - 1)) * 400},${150 - (v / 100) * 150}`).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Data points */}
                  {academicData.performanceTrend.map((v, i) => (
                    <circle key={i} cx={(i / (academicData.performanceTrend.length - 1)) * 400} cy={150 - (v / 100) * 150} r="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  ))}
                </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.75rem', color: '#64748b' }}>
                    {academicData.performanceLabels.map((label, i) => (
                      <span key={i} style={{ flex: 1, textAlign: 'center', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
                        {label}
                      </span>
                    ))}
                  </div>
              </div>
            </div>

            {/* Metrics Summary Panel */}
            <div>
              <h4 style={{ margin: '0 0 15px', color: '#94a3b8', fontSize: '0.85rem' }}>KEY PERFORMANCE METRICS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <MetricCard
                  label="Average School GPA"
                  value={academicData.averageGrade}
                  suffix="/4.0"
                  color="#38bdf8"
                  icon="≡ƒôÜ"
                />
                <MetricCard
                  label="Classroom Activity Index"
                  value={academicData.activityIndex}
                  suffix="%"
                  color="#a855f7"
                  icon="≡ƒÅ½"
                />
                <MetricCard
                  label="Student Retention Rate"
                  value={academicData.retentionRate}
                  suffix="%"
                  color="#10b981"
                  icon="≡ƒæÑ"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({ title, value, color, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.borderColor = color
          e.currentTarget.style.boxShadow = `0 8px 25px -5px ${color}30`
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.borderColor = '#334155'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: color, textShadow: `0 0 15px ${color}40` }}>
        {value}
      </div>
      {onClick && (
        <div style={{ fontSize: '0.75rem', color: color, marginTop: 4, fontWeight: 600 }}>
          Click to view ΓåÆ
        </div>
      )}
    </div>
  )
}

function ChartBar({ label, value, max, color }) {
  const heightPercent = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
      <div style={{ width: 40, height: 120, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${heightPercent}%`,
          background: `linear-gradient(to top, ${color}, ${color}80)`,
          transition: 'height 0.5s ease-out',
          borderRadius: '0 0 8px 8px'
        }} />
      </div>
      <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function MetricCard({ label, value, suffix, color, icon }) {
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.5)',
      border: '1px solid #334155',
      borderRadius: 10,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 15,
    }}>
      <div style={{
        width: 45,
        height: 45,
        borderRadius: 10,
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.3rem',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: color }}>
          {value}{suffix}
        </div>
      </div>
    </div>
  )
}

export default memo(DashboardStats)
