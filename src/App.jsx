import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import Login from './components/Login'
import ConfirmModal from './components/ConfirmModal'
import Toast from './components/Toast' // Import the new Toast component

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

// Academic Components
import StudentProfile from './components/Students/StudentProfile'
import ScoreEntry from './components/Academics/ScoreEntry'

function App() {
  // --- STATE ---
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null)
  
  // --- TOAST STATE ---
  const [toast, setToast] = useState(null) // Holds { message, type }

  // --- CONFIRMATION STATE ---
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Prevent double-initialization on refresh
  const initialized = useRef(false)

  // Helper to trigger a toast from anywhere
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (error) throw error
      setUserRole(data?.role || null)
    } catch (err) {
      console.error("Role fetch error:", err)
      setUserRole(null)
    }
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const prepareApp = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          setSession(currentSession)
          await fetchUserRole(currentSession.user.id)
        }
      } catch (error) {
        console.error("Initialization error:", error)
      } finally {
        setLoading(false)
      }
    }

    prepareApp()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        if (newSession) await fetchUserRole(newSession.user.id)
        setLoading(false)
      }
      
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUserRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = (role, user) => {
    setSession(user)
    setUserRole(role)
    setLoading(false)
    showToast("Welcome back, Admin!", "success")
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    setLoading(true)
    await supabase.auth.signOut()
    setSession(null)
    setUserRole(null)
    setActiveTab('overview')
    setLoading(false)
  }

  const refreshData = () => setRefreshTrigger(prev => prev + 1)

  const getHeaderTitle = () => {
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
      'assignments': 'Teacher Assignments',
      'score-entry': 'Result Manager & Gradebook'
    }
    return titles[activeTab] || activeTab.toUpperCase()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: '#38bdf8' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Verifying Access...</h2>
          <p style={{ color: '#475569' }}>Connecting to school database</p>
        </div>
      </div>
    )
  }

  if (!session) return <Login onLogin={handleLogin} />

  if (session && userRole !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#020617', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
        <h2 style={{ color: '#f8fafc' }}>Welcome to Divine Lifting</h2>
        <p>The Administrator dashboard is restricted. Your account does not have access.</p>
        <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      {/* RENDER TOAST IF ACTIVE */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">DIVINE LIFTING SCHOOL</div>
        
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setSelectedStudentProfile(null); }}>🏠 Dashboard Home</div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">REGISTRATION</small>
        <div className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`} onClick={() => { setActiveTab('teachers'); setSelectedStudentProfile(null); }}>➕ Add Teacher</div>
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => { setActiveTab('classes'); setSelectedStudentProfile(null); }}>➕ Add Classroom</div>
        <div className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setSelectedStudentProfile(null); }}>➕ Admit Student</div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">MANAGEMENT</small>
        <div className={`nav-item ${activeTab === 'student-list' ? 'active' : ''}`} onClick={() => { setActiveTab('student-list'); setSelectedStudentProfile(null); }}>📋 Student Master List</div>
        <div className={`nav-item ${activeTab === 'teacher-list' ? 'active' : ''}`} onClick={() => { setActiveTab('teacher-list'); setSelectedStudentProfile(null); }}>👩‍🏫 Staff Directory</div>
        <div className={`nav-item ${activeTab === 'class-list' ? 'active' : ''}`} onClick={() => { setActiveTab('class-list'); setSelectedStudentProfile(null); }}>🏫 Classroom Manager</div>
        <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => { setActiveTab('subjects'); setSelectedStudentProfile(null); }}>📚 Subject Master</div>
        <div className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setSelectedStudentProfile(null); }}>🔗 Teacher Assignments</div>

        <hr className="sidebar-divider" />
        <small className="sidebar-label">ACADEMICS</small>
        <div className={`nav-item ${activeTab === 'score-entry' ? 'active' : ''}`} onClick={() => { setActiveTab('score-entry'); setSelectedStudentProfile(null); }}>📝 Result Manager</div>

        <hr className="sidebar-divider" />
        <div className="nav-item" onClick={() => setShowLogoutConfirm(true)} style={{ color: '#ef4444', marginTop: 'auto' }}>🚪 Logout</div>
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

          {/* Note: In the next step, we will pass showToast as a prop to these components */}
          {activeTab === 'teachers' && <AddTeacher onAdd={refreshData} showToast={showToast} />}
          {activeTab === 'classes' && <AddClass onAdd={refreshData} showToast={showToast} />}
          {activeTab === 'students' && <AddStudent onAdd={refreshData} showToast={showToast} />}
          
          {activeTab === 'student-list' && (
            selectedStudentProfile ? (
              <StudentProfile student={selectedStudentProfile} onBack={() => setSelectedStudentProfile(null)} />
            ) : (
              <StudentList refreshTrigger={refreshTrigger} onUpdate={refreshData} onSelectStudent={setSelectedStudentProfile} showToast={showToast} />
            )
          )}

          {activeTab === 'teacher-list' && <TeacherList refreshTrigger={refreshTrigger} onUpdate={refreshData} showToast={showToast} />}
          {activeTab === 'class-list' && <ClassList refreshTrigger={refreshTrigger} onUpdate={refreshData} showToast={showToast} />}
          {activeTab === 'subjects' && <SubjectList refreshTrigger={refreshTrigger} showToast={showToast} />}
          {activeTab === 'assignments' && <TeacherAssignments refreshTrigger={refreshTrigger} showToast={showToast} />}
          {activeTab === 'score-entry' && <ScoreEntry showToast={showToast} />}
        </div>
      </main>

      <ConfirmModal 
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of the Divine Lifting Admin Portal? Any unsaved progress will be lost."
        confirmText="Logout"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        type="danger"
      />
    </div>
  )
}

export default App