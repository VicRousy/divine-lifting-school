import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import AnnouncementsWidget from '../Common/AnnouncementsWidget'
import PasswordChangeModal from '../PasswordChangeModal'

interface TeacherDashboardProps {
  userInfo: any
  onLogout: () => void
  showToast: (msg: string, type: string) => void
}

export default function TeacherDashboard({ userInfo, onLogout, showToast }: TeacherDashboardProps) {
  const [stats, setStats] = useState<any>({ students: 0, classes: 0, subjects: 0 })
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [userInfo])

  const fetchData = async () => {
    if (!userInfo?.login_id) return
    let teacherBigIntId: number | null = null
    if (/^\d+$/.test(String(userInfo.login_id))) {
      teacherBigIntId = Number(userInfo.login_id)
    } else {
      const { data: t } = await supabase.from('teachers').select('id').or(`login_id.eq.${userInfo.login_id},email.eq.${userInfo.login_id}`).maybeSingle()
      teacherBigIntId = t?.id
    }
    if (!teacherBigIntId) return

    const { data: asgn } = await safeQuery(() => supabase
      .from('teacher_assignments')
      .select('id, classes(class_name), subjects(subject_name)')
      .eq('teacher_id', teacherBigIntId))
    setAssignments(asgn || [])

    const classIds = [...new Set((asgn || []).map((a: any) => a.classes?.id).filter(Boolean))]
    const { data: studentCount } = await safeQuery(() => supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .in('class_id', classIds)
      .eq('is_active', true))
    setStats({ students: (studentCount as any)?.length || 0, classes: classIds.length, subjects: (asgn || []).length })
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading dashboard...</div>

  return (
    <div style={{ padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.5rem' }}>Welcome, {userInfo?.name || 'Teacher'}</h2>
          <p style={{ margin: '4px 0 0', color: '#94a3b8' }}>Teacher Dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowPasswordModal(true)} style={{ padding: '8px 16px', background: '#475569', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Change Password</button>
          <button onClick={onLogout} style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 30 }}>
        <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#38bdf8' }}>{stats.classes}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Assigned Classes</div>
        </div>
        <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{stats.students}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Total Students</div>
        </div>
        <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#a855f7' }}>{stats.subjects}</div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Assigned Subjects</div>
        </div>
      </div>

      {assignments.length > 0 && (
        <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 14, padding: 20, marginBottom: 30 }}>
          <h3 style={{ margin: '0 0 16px', color: '#f8fafc' }}>My Assignments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assignments.map((a: any) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(15,23,42,0.5)', borderRadius: 8 }}>
                <span style={{ color: '#e2e8f0' }}>{a.classes?.class_name}</span>
                <span style={{ color: '#94a3b8' }}>{a.subjects?.subject_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div role="button" tabIndex={0} onClick={() => {}} onKeyDown={(e) => { if (e.key === 'Enter') {} }}
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📚</div>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>Gradebook</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Manage student scores</div>
        </div>
        <div role="button" tabIndex={0} onClick={() => {}} onKeyDown={(e) => { if (e.key === 'Enter') {} }}
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>Attendance</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Mark daily attendance</div>
        </div>
        <div role="button" tabIndex={0} onClick={() => {}} onKeyDown={(e) => { if (e.key === 'Enter') {} }}
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📝</div>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>Homework</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Post assignments</div>
        </div>
        <div role="button" tabIndex={0} onClick={() => {}} onKeyDown={(e) => { if (e.key === 'Enter') {} }}
          style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #334155', borderRadius: 12, padding: 20, cursor: 'pointer' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📢</div>
          <div style={{ color: '#f8fafc', fontWeight: 600 }}>Announcements</div>
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>School updates</div>
        </div>
      </div>

      <AnnouncementsWidget role="teachers" />

      {showPasswordModal && (
        <PasswordChangeModal userInfo={userInfo} userRole="teacher" onClose={() => setShowPasswordModal(false)} showToast={showToast} />
      )}
    </div>
  )
}
