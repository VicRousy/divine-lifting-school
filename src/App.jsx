import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AddTeacher from './components/AddTeacher'
import AddClass from './components/AddClass'
import AddStudent from './components/AddStudent'
import RecentActivity from './components/RecentActivity'
import StudentList from './components/StudentList'
import TeacherList from './components/TeacherList'
import ClassList from './components/ClassList'
import SubjectList from './components/SubjectList'
import DashboardStats from './components/DashboardStats'

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  // This trigger tells the Stats and Lists to refresh their data
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Helper to refresh the entire dashboard data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Helper to format tab names for the header (e.g. "student-list" -> "Student Master List")
  const getHeaderTitle = () => {
    if (activeTab === 'student-list') return 'Student Master List'
    if (activeTab === 'teacher-list') return 'Staff Directory'
    if (activeTab === 'class-list') return 'Classroom Manager'
    return activeTab.replace('-', ' ').toUpperCase()
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">DIVINE LIFTING SCHOOL</div>
        
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} 
             onClick={() => setActiveTab('overview')}>
          🏠 Dashboard Home
        </div>

        <hr style={{ borderColor: '#334155', margin: '10px 0' }} />
        <small style={{ color: '#64748b', marginLeft: '15px', fontSize: '0.7rem' }}>REGISTRATION</small>

        <div className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`} 
             onClick={() => setActiveTab('teachers')}>
          ➕ Add Teacher
        </div>
        
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} 
             onClick={() => setActiveTab('classes')}>
          ➕ Add Classroom
        </div>
        
        <div className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} 
             onClick={() => setActiveTab('students')}>
          ➕ Admit Student
        </div>

        <hr style={{ borderColor: '#334155', margin: '10px 0' }} />
        <small style={{ color: '#64748b', marginLeft: '15px', fontSize: '0.7rem' }}>MANAGEMENT</small>

        <div className={`nav-item ${activeTab === 'student-list' ? 'active' : ''}`} 
             onClick={() => setActiveTab('student-list')}>
          📋 Student Master List
        </div>

        <div className={`nav-item ${activeTab === 'teacher-list' ? 'active' : ''}`} 
             onClick={() => setActiveTab('teacher-list')}>
          👩‍🏫 Staff Directory
        </div>

        <div className={`nav-item ${activeTab === 'class-list' ? 'active' : ''}`} 
             onClick={() => setActiveTab('class-list')}>
          🏫 Classroom Manager
        </div>

        <div className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`} 
             onClick={() => setActiveTab('subjects')}>
          📚 Subject Master
        </div>
      </aside>

      <main className="main-content">
        {/* The new Stats component handles all the counting now */}
        <DashboardStats refreshTrigger={refreshTrigger} />

        <div className="dashboard-card">
          {activeTab === 'overview' ? (
            <div>
              <h2 style={{marginTop: 0}}>Welcome, Administrator</h2>
              <p style={{color: '#94a3b8'}}>School overview and recent system updates.</p>
              <hr style={{borderColor: '#334155', margin: '20px 0'}} />
              <RecentActivity refreshTrigger={refreshTrigger} />
            </div>
          ) : (
            <>
              <h2 style={{marginTop: 0, color: '#f8fafc'}}>{getHeaderTitle()}</h2>
              
              {/* --- REGISTRATION FORMS --- */}
              {activeTab === 'teachers' && <AddTeacher onAdd={refreshData} />}
              {activeTab === 'classes' && <AddClass onAdd={refreshData} />}
              {activeTab === 'students' && <AddStudent onAdd={refreshData} />}

              {/* --- MASTER LISTS --- */}
              {activeTab === 'student-list' && (
                <StudentList refreshTrigger={refreshTrigger} onUpdate={refreshData} />
              )}
              {activeTab === 'teacher-list' && (
                <TeacherList refreshTrigger={refreshTrigger} onUpdate={refreshData} />
              )}
              {activeTab === 'class-list' && (
                <ClassList refreshTrigger={refreshTrigger} onUpdate={refreshData} />
              )}
              {activeTab === 'subjects' && (
                <SubjectList refreshTrigger={refreshTrigger} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App