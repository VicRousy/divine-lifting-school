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

function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ teachers: 0, classes: 0, students: 0 })

  const fetchCounts = async () => {
    const { count: tCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true })
    const { count: cCount } = await supabase.from('classes').select('*', { count: 'exact', head: true })
    const { count: sCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
    
    setStats({
      teachers: tCount || 0,
      classes: cCount || 0,
      students: sCount || 0
    })
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">DIVINE LIFTING SCHOOL</div>
        
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} 
             onClick={() => setActiveTab('overview')}>
          Dashboard Home
        </div>

        <hr style={{ borderColor: '#334155', margin: '10px 0' }} />
        <small style={{ color: '#64748b', marginLeft: '15px' }}>REGISTRATION</small>

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
        <small style={{ color: '#64748b', marginLeft: '15px' }}>MANAGEMENT</small>

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
        <div className="stats-grid">
          <div className="stat-box">
            <h4>Total Teachers</h4>
            <p>{stats.teachers.toString().padStart(2, '0')}</p>
          </div>
          <div className="stat-box">
            <h4>Active Classes</h4>
            <p>{stats.classes.toString().padStart(2, '0')}</p>
          </div>
          <div className="stat-box">
            <h4>Registered Students</h4>
            <p>{stats.students.toString().padStart(2, '0')}</p>
          </div>
        </div>

        <div className="dashboard-card">
          {activeTab === 'overview' ? (
            <div>
              <h2 style={{marginTop: 0}}>Welcome, Administrator</h2>
              <p style={{color: '#94a3b8'}}>School overview and recent system updates.</p>
              <hr style={{borderColor: '#334155', margin: '20px 0'}} />
              <RecentActivity />
            </div>
          ) : (
            <>
              <h2 style={{marginTop: 0}}>{activeTab.replace('-', ' ').toUpperCase()}</h2>
              {/* --- REGISTRATION FORMS --- */}
              {activeTab === 'teachers' && <AddTeacher onAdd={fetchCounts} />}
              {activeTab === 'classes' && <AddClass onAdd={fetchCounts} />}
              {activeTab === 'students' && <AddStudent onAdd={fetchCounts} />}

              {/* --- MASTER LISTS --- */}
              {activeTab === 'student-list' && <StudentList refreshTrigger={stats.students} onUpdate={fetchCounts} />}
              {activeTab === 'teacher-list' && <TeacherList refreshTrigger={stats.teachers} onUpdate={fetchCounts} />}
              {activeTab === 'class-list' && <ClassList refreshTrigger={stats.classes} onUpdate={fetchCounts} />}
              {activeTab === 'subjects' && <SubjectList refreshTrigger={stats.students} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App