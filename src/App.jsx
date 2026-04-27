import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'

// Core Dashboard Components
import DashboardStats from './components/Dashboard/DashboardStats'
import RecentActivity from './components/Dashboard/RecentActivity'

// Registration Components
import AddTeacher from './components/Teachers/AddTeacher'
import AddClass from './components/Classes/AddClass'
import AddStudent from './components/Students/AddStudent'

// Management Components
import StudentList from './components/Students/StudentList'
import TeacherList from './components/Teachers/TeacherList'
import ClassList from './components/Classes/ClassList'
import SubjectList from './components/Subjects/SubjectList'
import TeacherAssignments from './components/Teachers/TeacherAssignments'

// NEW COMPONENT IMPORT
import StudentProfile from './components/Students/StudentProfile'

function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchUserRole(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchUserRole(session.user.id)
      else { setUserRole(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).single()
    setUserRole(data?.role || null)
    setLoading(false)
  }

  const handleLogin = (role) => setUserRole(role)
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUserRole(null)
  }

  const refreshData = () => setRefreshTrigger(prev => prev + 1)

  const getHeaderTitle = () => {
    // If we are viewing a profile, update the header title
    if (activeTab === 'student-list' && selectedStudentProfile) return 'Student Detailed Record'

    const titles = {
      'overview': 'Dashboard Overview',
      'teachers': 'Teacher Registration',
      'classes': 'Classroom Setup',
      'students': 'Student Admission',
      'student-list': 'Student Master List',
      'teacher-list': 'Staff Directory',
      'class-list': 'Classroom Manager',
      'subjects': 'Subject Curriculum',
      'assignments': 'Teacher Assignments'
    }
    return titles[activeTab] || activeTab.toUpperCase()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: '#94a3b8' }}>
        Loading...
      </div>
    )
  }

  if (!session) return <Login onLogin={handleLogin} />

  if (userRole !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: '#ef4444' }}>
        Teacher/Student portals coming soon. Admin only for now.
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">DIVINE LIFTING SCHOOL</div>
        
        {/* We add setSelectedStudentProfile(null) to all nav clicks to reset the view */}
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setSelectedStudentProfile(null); }}>
          🏠 Dashboard Home
        </div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">REGISTRATION</small>

        <div className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => { setActiveTab('teachers'); setSelectedStudentProfile(null); }}>
          ➕ Add Teacher
        </div>
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => { setActiveTab('classes'); setSelectedStudentProfile(null); }}>
          ➕ Add Classroom
        </div>
        <div className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setSelectedStudentProfile(null); }}>
          ➕ Admit Student
        </div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">MANAGEMENT</small>

        <div className={`nav-item ${activeTab === 'student-list' ? 'active' : ''}`} onClick={() => { setActiveTab('student-list'); setSelectedStudentProfile(null); }}>
          📋 Student Master List
        </div>
        <div className={`nav-item ${activeTab === 'teacher-list' ? 'active' : ''}`} onClick={() => { setActiveTab('teacher-list'); setSelectedStudentProfile(null); }}>
          👩‍🏫 Staff Directory
        </div>
        <div className={`nav-item ${activeTab === 'class-list' ? 'active' : ''}`} onClick={() => { setActiveTab('class-list'); setSelectedStudentProfile(null); }}>
          🏫 Classroom Manager
        </div>
        <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => { setActiveTab('subjects'); setSelectedStudentProfile(null); }}>
          📚 Subject Master
        </div>
        <div className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setSelectedStudentProfile(null); }}>
          🔗 Teacher Assignments
        </div>

        <hr className="sidebar-divider" />
        <div className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
          🚪 Logout
        </div>
      </aside>

      <main className="main-content">
        <DashboardStats refreshTrigger={refreshTrigger} />

        <div className="dashboard-card">
          <h2 className="content-title">{getHeaderTitle()}</h2>
          
          {activeTab === 'overview' && (
            <div>
              <p className="text-dim">Welcome, Administrator. Here is the current state of the school.</p>
              <hr className="content-divider" />
              <RecentActivity refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'teachers' && <AddTeacher onAdd={refreshData} />}
          {activeTab === 'classes' && <AddClass onAdd={refreshData} />}
          {activeTab === 'students' && <AddStudent onAdd={refreshData} />}
          
          {/* UPDATED STUDENT LIST LOGIC */}
          {activeTab === 'student-list' && (
            selectedStudentProfile ? (
              <StudentProfile 
                student={selectedStudentProfile} 
                onBack={() => setSelectedStudentProfile(null)} 
              />
            ) : (
              <StudentList 
                refreshTrigger={refreshTrigger} 
                onUpdate={refreshData} 
                onSelectStudent={setSelectedStudentProfile} 
              />
            )
          )}

          {activeTab === 'teacher-list' && <TeacherList refreshTrigger={refreshTrigger} onUpdate={refreshData} />}
          {activeTab === 'class-list' && <ClassList refreshTrigger={refreshTrigger} onUpdate={refreshData} />}
          {activeTab === 'subjects' && <SubjectList refreshTrigger={refreshTrigger} />}
          {activeTab === 'assignments' && <TeacherAssignments refreshTrigger={refreshTrigger} />}
        </div>
      </main>
    </div>
  )
}

export default App