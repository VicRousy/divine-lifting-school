import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AddTeacher from './components/AddTeacher'
import AddClass from './components/AddClass'
import AddStudent from './components/AddStudent'
import RecentActivity from './components/RecentActivity'
import StudentList from './components/StudentList' // 1. Import the new list component

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
        <div className="sidebar-logo">DIVINE LIFTING</div>
        
        <div className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} 
             onClick={() => setActiveTab('overview')}>
          Dashboard Home
        </div>

        {/* 2. Added the Master List Tab */}
        <div className={`nav-item ${activeTab === 'student-list' ? 'active' : ''}`} 
             onClick={() => setActiveTab('student-list')}>
          📋 Student Master List
        </div>

        <div className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`} 
             onClick={() => setActiveTab('teachers')}>
          Staff Management
        </div>
        
        <div className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`} 
             onClick={() => setActiveTab('classes')}>
          Classrooms
        </div>
        
        <div className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} 
             onClick={() => setActiveTab('students')}>
          Student Registry
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
              <p style={{color: '#94a3b8'}}>Here is a summary of the school's current status.</p>
              <hr style={{borderColor: '#334155', margin: '20px 0'}} />
              <RecentActivity />
            </div>
          ) : (
            <>
              <h2 style={{marginTop: 0}}>{activeTab.replace('-', ' ').toUpperCase()}</h2>
              {/* 3. Logic to show the Master List */}
              {activeTab === 'student-list' && <StudentList refreshTrigger={stats.students} onUpdate={fetchCounts} />}
              {activeTab === 'teachers' && <AddTeacher onAdd={fetchCounts} />}
              {activeTab === 'classes' && <AddClass onAdd={fetchCounts} />}
              {activeTab === 'students' && <AddStudent onAdd={fetchCounts} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App