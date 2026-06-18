import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../supabaseClient'
import { formatDisplayName } from '../../utils/nameUtils'
import AnnouncementsWidget from '../Common/AnnouncementsWidget'

interface TeacherDashboardProps {
  userInfo: any
  onNavigate?: (page: string) => void
  onLogout?: () => void
  showToast?: (msg: string, type: string) => void
}

function TeacherDashboard({ userInfo, onNavigate, onLogout, showToast }: TeacherDashboardProps) {
  const [teacherInfo, setTeacherInfo] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const teacherId = userInfo?.login_id || userInfo?.id

  const fetchTeacherData = useCallback(async () => {
    if (!teacherId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let teacherBigIntId: number | null = null
      if (/^\d+$/.test(String(teacherId))) {
        teacherBigIntId = Number(teacherId)
      } else {
        const { data: t } = await supabase
          .from('teachers')
          .select('id')
          .or(`login_id.eq.${teacherId},email.eq.${teacherId}`)
          .maybeSingle()
        teacherBigIntId = t?.id
      }

      if (!teacherBigIntId) {
        setLoading(false)
        return
      }

      const [{ data: teacher }, { data: assignmentData }] = await Promise.all([
        supabase.from('teachers').select('first_name, middle_name, last_name, staff_id, email').eq('id', teacherBigIntId).single(),
        supabase.from('teacher_assignments').select(`id, class_id, subject_id, classes (id, class_name), subjects (id, subject_name)`).eq('teacher_id', teacherBigIntId),
      ])

      setTeacherInfo(teacher)
      setAssignments(assignmentData || [])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    fetchTeacherData()
  }, [fetchTeacherData])

  const getFullName = () => {
    if (teacherInfo) {
      return formatDisplayName({
        first_name: teacherInfo.first_name,
        middle_name: teacherInfo.middle_name,
        last_name: teacherInfo.last_name,
      })
    }
    return formatDisplayName({
      full_name: userInfo?.user_metadata?.full_name,
      email: userInfo?.email,
    })
  }

  const getDisplayId = () => teacherInfo?.staff_id || userInfo?.staff_id || userInfo?.login_id || 'N/A'

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <div style={{ fontSize: '1.2rem' }}>Loading your dashboard...</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>ID: {teacherId || 'Awaiting ID...'}</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '30px' }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        border: '1px solid #334155',
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '2rem',
          background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Welcome, {getFullName()}
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#94a3b8' }}>
          Staff ID: {getDisplayId()}
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          <ActionCard
            icon="📋"
            title="Mark Attendance"
            description="Take daily roll call"
            onClick={() => onNavigate?.('full-attendance')}
            color="#10b981"
          />
          <ActionCard
            icon="📝"
            title="Enter Scores"
            description="Gradebook with grades and comments"
            onClick={() => onNavigate?.('scores')}
            color="#38bdf8"
          />
          <ActionCard
            icon="👥"
            title="View Classes"
            description="See your class rosters"
            onClick={() => onNavigate?.('roster')}
            color="#a855f7"
          />
        </div>
      </div>

      <div>
        <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>My Teaching Assignments</h2>
        {assignments.length > 0 ? (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #334155',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155' }}>
                  <th scope="col" style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>CLASS</th>
                  <th scope="col" style={{ padding: '12px', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>SUBJECT</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '15px', color: '#38bdf8', fontWeight: '600' }}>
                      {assignment.classes?.class_name}
                    </td>
                    <td style={{ padding: '15px', color: '#f8fafc' }}>
                      {assignment.subjects?.subject_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '12px',
            padding: '40px',
            border: '1px dashed #334155',
            textAlign: 'center',
            color: '#94a3b8',
          }}>
            No teaching assignments yet. Contact the administrator.
          </div>
        )}
      </div>

      <AnnouncementsWidget role="teachers" />
    </div>
  )
}

function ActionCard({ icon, title, description, onClick, color }: {
  icon: string; title: string; description: string; onClick: () => void; color: string
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '25px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)'
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.boxShadow = `0 10px 25px -5px ${color}40`
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#334155'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '15px', opacity: 0.9 }}>{icon}</div>
      <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.1rem' }}>{title}</h3>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{description}</p>
    </div>
  )
}

export default TeacherDashboard
