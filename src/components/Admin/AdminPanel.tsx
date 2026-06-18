import { useState } from 'react'
import DashboardStats from '../Dashboard/DashboardStats'
import RecentActivity from '../Dashboard/RecentActivity'
import StudentList from '../Students/StudentList'
import AddStudent from '../Students/AddStudent'
import StudentProfile from '../Students/StudentProfile'
import BulkImport from '../Students/BulkImport'
import TeacherList from '../Teachers/TeacherList'
import AddTeacher from '../Teachers/AddTeacher'
import TeacherAssignments from '../Teachers/TeacherAssignments'
import SubjectList from '../Subjects/SubjectList'
import ClassList from '../Classes/ClassList'
import AddClass from '../Classes/AddClass'
import ClassPromotion from '../Academics/ClassPromotion'
import GradeApproval from '../Academics/GradeApproval'
import GradeScale from '../Academics/GradeScale'
import ReportCards from '../Academics/ReportCards'
import FeeManagement from '../Finance/FeeManagement'
import AttendanceMarking from '../Academics/AttendanceMarking'
import ScoreEntry from '../Academics/ScoreEntry'
import ResetPassword from './ResetPassword'
import ContactMessages from './ContactMessages'
import Applications from './Applications'
import Announcements from './Announcements'
import PostNews from './PostNews'
import ManageNews from './ManageNews'
import SchoolSettings from '../Settings/SchoolSettings'
import MfaSetup from '../Settings/MfaSetup'

interface AdminPanelProps {
  activePage: string
  showToast: (msg: string, type?: string) => void
  requireReAuth: (desc: string, action: any) => void
  refreshTrigger: number
  triggerRefresh: () => void
  studentProfile: any
  setStudentProfile: (s: any) => void
  setActivePage: (page: string) => void
}

export default function AdminPanel({ activePage, showToast, requireReAuth, refreshTrigger, triggerRefresh, studentProfile, setStudentProfile, setActivePage }: AdminPanelProps) {
  const [localProfile, setLocalProfile] = useState<any>(null)
  const profile = studentProfile || localProfile
  const setProfile = typeof setStudentProfile === 'function' ? setStudentProfile : setLocalProfile

  switch (activePage) {
    case 'dashboard':
      return (
        <>
          <div className="responsive-actions" style={{ marginBottom: '30px' }}>
            <input type="text" aria-label="Search students, staff, or classes" placeholder="Search students, staff, or classes..."
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
              onKeyDown={(e) => { if (e.key === 'Enter') setActivePage('students') }} />
            <button aria-label="Add new student" onClick={() => setActivePage('add-student')}
              style={{ padding: '12px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Student</button>
            <button aria-label="Open fee management" onClick={() => setActivePage('fees')}
              style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fee</button>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Welcome, Administrator. Here is the current state of the school.</p>
          <DashboardStats showToast={showToast} />
          <RecentActivity showToast={showToast} refreshTrigger={refreshTrigger} />
        </>
      )
    case 'students':
      return <StudentList showToast={showToast} requireReAuth={requireReAuth} onStudentSelect={(s: any) => setProfile(s)} />
    case 'add-student':
      return <AddStudent showToast={showToast} onAdd={triggerRefresh} />
    case 'student-profile':
      return profile ? <StudentProfile student={profile} onBack={() => setProfile(null)} /> : null
    case 'bulk-import':
      return <BulkImport showToast={showToast} />
    case 'teachers':
      return <TeacherList showToast={showToast} />
    case 'add-teacher':
      return <AddTeacher showToast={showToast} onAdd={triggerRefresh} />
    case 'assignments':
      return <TeacherAssignments refreshTrigger={refreshTrigger} showToast={showToast} />
    case 'subjects':
      return <SubjectList showToast={showToast} />
    case 'classes':
      return <ClassList showToast={showToast} />
    case 'add-class':
      return <AddClass showToast={showToast} onAdd={triggerRefresh} />
    case 'promotion':
      return <ClassPromotion showToast={showToast} requireReAuth={requireReAuth} />
    case 'grade-approval':
      return <GradeApproval showToast={showToast} requireReAuth={requireReAuth} />
    case 'grade-scale':
      return <GradeScale showToast={showToast} />
    case 'report-cards':
      return <ReportCards showToast={showToast} />
    case 'fees':
      return <FeeManagement showToast={showToast} requireReAuth={requireReAuth} />
    case 'attendance':
      return <AttendanceMarking showToast={showToast} />
    case 'scores':
      return <ScoreEntry showToast={showToast} requireReAuth={requireReAuth} />
    case 'reset-password':
      return <ResetPassword showToast={showToast} />
    case 'messages':
      return <ContactMessages showToast={showToast} />
    case 'applications':
      return <Applications showToast={showToast} />
    case 'announcements':
      return <Announcements showToast={showToast} />
    case 'post-news':
      return <PostNews showToast={showToast} />
    case 'manage-news':
      return <ManageNews showToast={showToast} />
    case 'settings':
      return <SchoolSettings showToast={showToast} />
    case 'mfa':
      return <MfaSetup />
    default:
      return (
        <>
          <div className="responsive-actions" style={{ marginBottom: '30px' }}>
            <input type="text" aria-label="Search students, staff, or classes" placeholder="Search students, staff, or classes..."
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
              onKeyDown={(e) => { if (e.key === 'Enter') setActivePage('students') }} />
            <button aria-label="Add new student" onClick={() => setActivePage('add-student')}
              style={{ padding: '12px 20px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Student</button>
            <button aria-label="Open fee management" onClick={() => setActivePage('fees')}
              style={{ padding: '12px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fee</button>
          </div>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Welcome, Administrator. Here is the current state of the school.</p>
          <DashboardStats showToast={showToast} />
          <RecentActivity showToast={showToast} refreshTrigger={refreshTrigger} />
        </>
      )
  }
}
