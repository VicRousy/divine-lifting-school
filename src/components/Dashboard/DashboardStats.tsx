import { useState, useEffect, memo } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'

interface StatItem {
  students: number
  teachers: number
  classes: number
  assignments: number
  feesPending: number
  attendanceToday: number
}

interface AcademicData {
  averageGrade: number
  activityIndex: number
  retentionRate: number
  classDistribution: Array<{ name: string; count: number }>
  teacherDistribution: Array<{ name: string; count: number }>
  assignmentCompletion: number
  performanceTrend: number[]
  performanceLabels: string[]
}

const defaultAcademicData: AcademicData = {
  averageGrade: 0,
  activityIndex: 0,
  retentionRate: 0,
  classDistribution: [],
  teacherDistribution: [],
  assignmentCompletion: 0,
  performanceTrend: [0, 0, 0, 0, 0, 0],
  performanceLabels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Current'],
}

interface DashboardStatsProps {
  refreshTrigger?: number
  onNavigate?: (tab: string) => void
  showToast?: (msg: string, type?: string) => void
}

function DashboardStats({ refreshTrigger, onNavigate, showToast }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatItem>({
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
  const [academicData, setAcademicData] = useState<AcademicData>(defaultAcademicData)
  const [academicLoading, setAcademicLoading] = useState(true)

  const fetchAllStats = async () => {
    setLoading(true)
    setAcademicLoading(true)
    try {
      const { data, error } = await safeQuery(
        () => supabase.rpc('get_dashboard_stats'),
        { cacheKey: 'dashboard_stats' }
      )

      if (error) throw error

      const result = typeof data === 'string' ? JSON.parse(data || '{}') : (data || {})

      const newStats: StatItem = {
        students: result.students || 0,
        teachers: result.teachers || 0,
        classes: result.classes || 0,
        assignments: result.assignments || 0,
        feesPending: result.feesPending || 0,
        attendanceToday: result.attendanceToday || 0,
      }

      setStats(newStats)
      setHasData(newStats.students > 0 || newStats.teachers > 0 || newStats.classes > 0)

      const perfTrend: Array<{ term: string; avg: number }> = result.performanceTrend || []
      const perfVals = perfTrend.length > 0 ? perfTrend.map((t: any) => Math.round(t.avg || 0)) : defaultAcademicData.performanceTrend
      const perfLabels = perfTrend.length > 0 ? perfTrend.map((t: any) => t.term || '') : defaultAcademicData.performanceLabels

      const avgGrade = parseFloat(result.averageGrade) || 0
      const totalScoresEst = perfTrend.reduce((sum: number, t: any) => sum + (t.count || 0), 0)
      const assignCompletion = newStats.assignments > 0 && newStats.students > 0
        ? Math.min(100, Math.round((totalScoresEst / (newStats.assignments * newStats.students)) * 100))
        : 0

      setAcademicData({
        averageGrade: avgGrade,
        activityIndex: result.activityIndex || 0,
        retentionRate: result.retentionRate ?? 100,
        classDistribution: result.classDistribution || [],
        teacherDistribution: result.teacherDistribution || [],
        assignmentCompletion: assignCompletion,
        performanceTrend: perfVals,
        performanceLabels: perfLabels,
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      showToast?.('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
      setAcademicLoading(false)
    }
  }

  useEffect(() => {
    fetchAllStats()
  }, [refreshTrigger])

  const maxVal = Math.max(stats.students, stats.teachers, stats.classes, 1)

  const handleCardClick = (tab: string) => {
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
        <h2 style={{ margin: '0 0 10px', color: '#f8fafc' }}>Welcome to Divine Lifting School Admin</h2>
        <p style={{ margin: '0 0 30px', color: '#94a3b8' }}>Your school management system is ready. Start by adding your first records.</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>1</div>
            <h4 style={{ margin: '0 0 5px', color: '#38bdf8' }}>Add Classes</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Define your school structure (JSS1, SSS1, etc.)</p>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>2</div>
            <h4 style={{ margin: '0 0 5px', color: '#a855f7' }}>Register Staff</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Add teachers and assign them to subjects.</p>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 20, width: 200, textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>3</div>
            <h4 style={{ margin: '0 0 5px', color: '#10b981' }}>Enroll Students</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Register students and link them to parents.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="Total Students" value={stats.students} color="#38bdf8" icon="👨‍🎓" onClick={() => handleCardClick('student-list')} />
        <StatCard title="Staff Members" value={stats.teachers} color="#a855f7" icon="👩‍🏫" onClick={() => handleCardClick('teacher-list')} />
        <StatCard title="Classrooms" value={stats.classes} color="#fbbf24" icon="🏫" onClick={() => handleCardClick('class-list')} />
        <StatCard title="Active Assignments" value={stats.assignments} color="#10b981" icon="📝" onClick={() => handleCardClick('assignments')} />
        <StatCard title="Pending Fees" value={`N${stats.feesPending.toLocaleString()}`} color="#ef4444" icon="💰" onClick={() => handleCardClick('fees')} />
        <StatCard title="Present Today" value={stats.attendanceToday} color="#22c55e" icon="✅" onClick={() => handleCardClick('attendance')} />
      </div>

      <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 16, padding: expandedChart ? 40 : 30, marginBottom: 40, transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem' }}>School Overview Distribution</h3>
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
            {expandedChart ? 'Close Detailed View' : 'View Detailed Report'}
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
          <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div>
              <h4 style={{ margin: '0 0 15px', color: '#38bdf8', fontSize: '0.9rem' }}>Students per Classroom</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {academicData.classDistribution.length > 0 ? academicData.classDistribution.map((c, i) => {
                  const maxCount = Math.max(...academicData.classDistribution.map(x => x.count), 1)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="chart-label">{c.name}</span>
                      <div style={{ flex: 1, height: 20, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(c.count / maxCount) * 100}%`, height: '100%', background: '#38bdf8', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ width: 30, fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>{c.count}</span>
                    </div>
                  )
                }) : <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No data</span>}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 15px', color: '#a855f7', fontSize: '0.9rem' }}>Teachers by Subject</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {academicData.teacherDistribution.length > 0 ? academicData.teacherDistribution.map((t, i) => {
                  const maxCount = Math.max(...academicData.teacherDistribution.map(x => x.count), 1)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="chart-label">{t.name}</span>
                      <div style={{ flex: 1, height: 20, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(t.count / maxCount) * 100}%`, height: '100%', background: '#a855f7', transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ width: 30, fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>{t.count}</span>
                    </div>
                  )
                }) : <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No data</span>}
              </div>
            </div>

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

      <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #334155', borderRadius: 16, padding: 30, marginBottom: 40 }}>
        <h3 style={{ margin: '0 0 20px', color: '#f8fafc', fontSize: '1.1rem' }}>School Academic Success & Vitality Index</h3>

        {academicLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading academic data...</div>
        ) : (
          <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                  {[0, 25, 50, 75, 100].map((val) => (
                    <line key={val} x1="0" y1={150 - (val / 100) * 150} x2="400" y2={150 - (val / 100) * 150} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  <path
                    d={`M 0 ${150 - (academicData.performanceTrend[0] / 100) * 150} ${academicData.performanceTrend.map((v, i) => `L ${(i / (academicData.performanceTrend.length - 1)) * 400} ${150 - (v / 100) * 150}`).join(' ')} L 400 150 L 0 150 Z`}
                    fill="url(#perfGrad)"
                  />
                  <polyline
                    points={academicData.performanceTrend.map((v, i) => `${(i / (academicData.performanceTrend.length - 1)) * 400},${150 - (v / 100) * 150}`).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
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

            <div>
              <h4 style={{ margin: '0 0 15px', color: '#94a3b8', fontSize: '0.85rem' }}>KEY PERFORMANCE METRICS</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <MetricCard
                  label="Average School GPA"
                  value={academicData.averageGrade}
                  suffix="/4.0"
                  color="#38bdf8"
                  icon="🎓"
                />
                <MetricCard
                  label="Classroom Activity Index"
                  value={academicData.activityIndex}
                  suffix="%"
                  color="#a855f7"
                  icon="📈"
                />
                <MetricCard
                  label="Student Retention Rate"
                  value={academicData.retentionRate}
                  suffix="%"
                  color="#10b981"
                  icon="📊"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  color: string
  icon: string
  onClick?: () => void
}

function StatCard({ title, value, color, icon, onClick }: StatCardProps) {
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
          Click to view
        </div>
      )}
    </div>
  )
}

interface ChartBarProps {
  label: string
  value: number
  max: number
  color: string
}

function ChartBar({ label, value, max, color }: ChartBarProps) {
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

interface MetricCardProps {
  label: string
  value: number | string
  suffix: string
  color: string
  icon: string
}

function MetricCard({ label, value, suffix, color, icon }: MetricCardProps) {
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
