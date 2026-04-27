import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function StudentProfile({ student, onBack }) {
  const [academicSquad, setAcademicSquad] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAcademicSquad = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          teachers (first_name, last_name),
          subjects (subject_name)
        `)
        .eq('class_id', student.class_id)

      if (!error) setAcademicSquad(data)
      setLoading(false)
    }

    if (student.class_id) fetchAcademicSquad()
    else setLoading(false)
  }, [student.class_id])

  return (
    <div className="profile-view" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <button onClick={onBack} className="btn-cancel" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          ← Back to Master List
        </button>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Admission Status:</span>
          <span style={{ color: '#10b981', marginLeft: '8px', fontWeight: 'bold' }}>● ACTIVE</span>
        </div>
      </div>

      {/* Main Student Identity Card */}
      <div style={{ 
        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8))', 
        padding: '40px', 
        borderRadius: '20px', 
        border: '1px solid rgba(56, 189, 248, 0.2)',
        display: 'flex',
        gap: '30px',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        {/* Profile Avatar Placeholder */}
        <div style={{ 
          width: '120px', 
          height: '120px', 
          background: 'linear-gradient(135deg, #38bdf8, #a855f7)', 
          borderRadius: '24px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          fontSize: '3rem',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.4)'
        }}>
          {student.first_name[0]}{student.last_name[0]}
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
            {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
          </h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <p className="text-dim" style={{ margin: 0 }}>
              ID: <span style={{ color: '#f8fafc', fontWeight: '600' }}>{student.admission_number || 'REG-00' + student.id}</span>
            </p>
            <div style={{ width: '1px', height: '15px', background: '#334155' }}></div>
            <p className="text-dim" style={{ margin: 0 }}>
              Class: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{student.classes?.class_name || 'Unassigned'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Academic Content Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* Left Column: Academic Squad */}
        <div>
          <h3 style={{ color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#a855f7' }}>⚡</span> Academic Squad
          </h3>
          
          {loading ? (
            <div className="text-dim">Consulting the archives...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {academicSquad.length > 0 ? academicSquad.map((item) => (
                <div key={item.id} style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {item.subjects?.subject_name}
                  </div>
                  <div style={{ color: '#f8fafc', fontWeight: '600' }}>
                    {item.teachers?.first_name} {item.teachers?.last_name}
                  </div>
                </div>
              )) : (
                <div className="text-dim" style={{ gridColumn: 'span 2', padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', textAlign: 'center', border: '1px dashed #334155' }}>
                  No teachers assigned to this student's class yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Quick Stats/Actions */}
        <div>
          <h3 style={{ color: '#f8fafc', marginBottom: '20px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn-delete" style={{ background: '#1e293b', border: '1px solid #334155', textAlign: 'left' }}>
              📊 View Attendance
            </button>
            <button className="btn-delete" style={{ background: '#1e293b', border: '1px solid #334155', textAlign: 'left' }}>
              📝 Exam Records
            </button>
            <button className="btn-delete" style={{ background: '#1e293b', border: '1px solid #334155', textAlign: 'left' }}>
              💳 Fee History
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default StudentProfile