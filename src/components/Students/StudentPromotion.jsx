import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { getAcademicYearOptions, getUpcomingFirstTermAcademicYear } from '../../utils/academicSession'

function StudentPromotion({ showToast }) {
  const [classes, setClasses] = useState([])
  const [fromClass, setFromClass] = useState('')
  const [toClass, setToClass] = useState('')
  const [academicYear, setAcademicYear] = useState(getUpcomingFirstTermAcademicYear())
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Select classes, 2: Select students, 3: Confirm

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('is_active', true)
      .order('class_name')
    setClasses(data || [])
  }

  const fetchStudentsForPromotion = async () => {
    if (!fromClass) return
    
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('id, first_name, middle_name, last_name, admission_number, class_id, classes(class_name)')
      .eq('class_id', fromClass)
      .eq('is_active', true)
      .order('last_name')
    
    setStudents(data || [])
    setSelectedStudents(data?.map(s => s.id) || []) // Select all by default
    setLoading(false)
    setStep(2)
  }

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handlePromote = async () => {
    if (!toClass || selectedStudents.length === 0) {
      showToast("Please select destination class and at least one student", "error")
      return
    }

    setLoading(true)
    
    try {
      // 1. Get the current logged-in user first
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      // 2. Update student class_ids
      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          class_id: toClass,
          last_promotion_date: new Date().toISOString()
        })
        .in('id', selectedStudents)

      if (updateError) throw updateError

      // 3. Prepare records for promotion history
      const promotionRecords = selectedStudents.map(studentId => ({
        student_id: studentId,
        from_class_id: fromClass,
        to_class_id: toClass,
        academic_year: academicYear,
        promotion_date: new Date().toISOString(),
        promoted_by: currentUserId // Use the variable retrieved above
      }))

      const { error: historyError } = await supabase
        .from('promotion_history')
        .insert(promotionRecords)

      if (historyError) throw historyError

      showToast(`Successfully promoted ${selectedStudents.length} students!`, "success")
      setStep(1)
      setFromClass('')
      setToClass('')
      setStudents([])
      setSelectedStudents([])
      
    } catch (err) {
      showToast("Promotion failed: " + err.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const getFullName = (s) => `${s.first_name} ${s.middle_name ? s.middle_name + ' ' : ''}${s.last_name}`

  const getClassName = (id) => classes.find(c => c.id === id)?.class_name || 'Unknown'

  return (
    <div className="admin-table-container">
      <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>🎓 Student Promotion System</h2>

      {step === 1 && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '30px' }}>
            <h4 style={{ color: '#38bdf8', marginTop: 0 }}>Promotion Wizard</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Move students from their current class to the next level. This will update their class assignment and record the promotion history.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="text-dim" style={{ fontSize: '0.85rem' }}>Academic Year</label>
              <select 
                className="counter" 
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                style={{ width: '100%', background: '#1e293b', color: 'white' }}
              >
                {getAcademicYearOptions().map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="text-dim" style={{ fontSize: '0.85rem' }}>From Class (Current)</label>
                <select 
                  className="counter" 
                  value={fromClass}
                  onChange={(e) => setFromClass(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', color: 'white' }}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-dim" style={{ fontSize: '0.85rem' }}>To Class (New)</label>
                <select 
                  className="counter" 
                  value={toClass}
                  onChange={(e) => setToClass(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', color: 'white' }}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={fetchStudentsForPromotion}
              disabled={!fromClass || !toClass || fromClass === toClass || loading}
              className="btn-delete"
              style={{ 
                background: fromClass && toClass && fromClass !== toClass ? '#38bdf8' : '#64748b',
                marginTop: '10px',
                height: '45px',
                border: 'none',
                borderRadius: '8px',
                color: 'black',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'View Students'}
            </button>
            
            {fromClass === toClass && fromClass !== '' && (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>
                Cannot promote to same class
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: '#f8fafc', margin: 0 }}>
                Promoting from {getClassName(fromClass)} to {getClassName(toClass)}
              </h3>
              <p style={{ color: '#94a3b8', margin: '5px 0 0 0', fontSize: '0.85rem' }}>
                {students.length} students found. Select students to promote.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setStep(1)}
                className="btn-cancel"
                style={{ padding: '8px 16px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                disabled={selectedStudents.length === 0}
                className="btn-delete"
                style={{ 
                  background: selectedStudents.length > 0 ? '#38bdf8' : '#64748b',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'black',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Continue ({selectedStudents.length} selected)
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setSelectedStudents(students.map(s => s.id))}
              style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Select All
            </button>
            <button 
              onClick={() => setSelectedStudents([])}
              style={{ background: 'transparent', border: '1px solid #94a3b8', color: '#94a3b8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Deselect All
            </button>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Select</th>
                <th>Student Name</th>
                <th>Admission No.</th>
                <th>Current Class</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr 
                  key={s.id} 
                  style={{ 
                    opacity: selectedStudents.includes(s.id) ? 1 : 0.5,
                    background: selectedStudents.includes(s.id) ? 'rgba(56, 189, 248, 0.05)' : 'transparent'
                  }}
                >
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() => handleToggleStudent(s.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ fontWeight: '500' }}>{getFullName(s)}</td>
                  <td className="text-dim">{s.admission_number}</td>
                  <td className="text-accent">{s.classes?.class_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {step === 3 && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '30px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎓</div>
            <h3 style={{ color: '#f8fafc', margin: '0 0 10px 0' }}>Confirm Promotion</h3>
            <p style={{ color: '#94a3b8', marginBottom: '25px' }}>
              You are about to promote <strong style={{ color: '#38bdf8' }}>{selectedStudents.length}</strong> students from <strong>{getClassName(fromClass)}</strong> to <strong>{getClassName(toClass)}</strong> for the academic year <strong>{academicYear}</strong>.
            </p>
            
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => setStep(2)}
                className="btn-cancel"
                style={{ padding: '12px 24px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Review Selection
              </button>
              <button 
                onClick={handlePromote}
                disabled={loading}
                className="btn-delete"
                style={{ 
                  background: loading ? '#64748b' : '#10b981',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Processing...' : 'Confirm Promotion'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(251, 191, 36, 0.05)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <p style={{ color: '#fbbf24', fontSize: '0.85rem', margin: 0 }}>
              ⚠️ Note: This action will update student records immediately. Ensure you have selected the correct students and destination class.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentPromotion
