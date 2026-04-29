import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

function ScoreEntry({ showToast }) { // Destructured showToast from props
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [term, setTerm] = useState('First Term 2026')
  
  const [scores, setScores] = useState({}) 
  const [loading, setLoading] = useState(false)

  // Divine Lifting Custom Grading Scale
  const getGrade = (total) => {
    const score = Number(total);
    if (score >= 80) return { grade: 'A+', remark: 'Distinction', color: '#10b981' };
    if (score >= 70) return { grade: 'A1', remark: 'Excellent', color: '#34d399' };
    if (score >= 60) return { grade: 'B',  remark: 'Very Good', color: '#38bdf8' };
    if (score >= 50) return { grade: 'C',  remark: 'Credit',     color: '#f59e0b' };
    if (score >= 40) return { grade: 'D',  remark: 'Pass',       color: '#94a3b8' };
    return { grade: 'F', remark: 'Fail', color: '#ef4444' };
  };

  useEffect(() => {
    const setup = async () => {
      const { data: cls } = await supabase.from('classes').select('*')
      const { data: sub } = await supabase.from('subjects').select('*')
      setClasses(cls || [])
      setSubjects(sub || [])
    }
    setup()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      const fetchStudents = async () => {
        const { data } = await supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('class_id', selectedClass)
        setStudents(data || [])
        
        const initialScores = {}
        data.forEach(s => {
          initialScores[s.id] = { ca: '', exam: '' }
        })
        setScores(initialScores)
      }
      fetchStudents()
    }
  }, [selectedClass])

  const handleScoreChange = (studentId, field, value) => {
    setScores(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }))
  }

  const saveAllScores = async () => {
    if (!selectedSubject || !selectedClass) {
        showToast("Please select both a Class and a Subject first!", "error");
        return;
    }

    // --- Validation Logic ---
    let invalidEntry = false;
    students.forEach(s => {
      const ca = parseFloat(scores[s.id].ca || 0);
      const exam = parseFloat(scores[s.id].exam || 0);
      if (ca > 40 || exam > 60) invalidEntry = true;
    });

    if (invalidEntry) {
      showToast("Validation Error: CA cannot exceed 40 and Exam cannot exceed 60.", "error");
      return;
    }

    setLoading(true)
    const updates = students.map(s => ({
      student_id: s.id,
      subject_id: selectedSubject,
      class_id: selectedClass,
      ca_score: parseFloat(scores[s.id].ca || 0),
      exam_score: parseFloat(scores[s.id].exam || 0),
      term: term,
      academic_year: '2025/2026'
    }))

    const { error } = await supabase
        .from('exam_scores')
        .upsert(updates, { 
            onConflict: 'student_id,subject_id,term,academic_year' 
        })

    setLoading(false)
    if (error) {
        showToast("Error saving: " + error.message, "error")
    } else {
        showToast(`Successfully saved results for ${students.length} students!`, "success")
    }
  }

  return (
    <div className="admin-table-container">
      <h2 style={{ color: '#f8fafc', marginBottom: '20px' }}>Academic Gradebook</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
        <div className="form-group">
          <label className="text-dim" style={{fontSize: '0.8rem'}}>Class</label>
          <select className="counter" onChange={(e) => setSelectedClass(e.target.value)} style={{width: '100%', background: '#1e293b', color: 'white'}}>
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="text-dim" style={{fontSize: '0.8rem'}}>Subject</label>
          <select className="counter" onChange={(e) => setSelectedSubject(e.target.value)} style={{width: '100%', background: '#1e293b', color: 'white'}}>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="text-dim" style={{fontSize: '0.8rem'}}>Term</label>
          <select className="counter" value={term} onChange={(e) => setTerm(e.target.value)} style={{width: '100%', background: '#1e293b', color: 'white'}}>
            <option>First Term 2026</option>
            <option>Second Term 2026</option>
            <option>Third Term 2026</option>
          </select>
        </div>
      </div>

      {selectedClass && selectedSubject && students.length > 0 ? (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th style={{ width: '120px' }}>CA (40)</th>
                <th style={{ width: '120px' }}>Exam (60)</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Total & Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const total = (parseFloat(scores[s.id]?.ca || 0) + parseFloat(scores[s.id]?.exam || 0)) || 0;
                const gradeInfo = getGrade(total);

                return (
                  <tr key={s.id}>
                    <td style={{fontWeight: '500'}}>{s.first_name} {s.last_name}</td>
                    <td>
                      <input 
                        type="number" 
                        className="counter" 
                        style={{background: '#0f172a', border: '1px solid #334155'}}
                        placeholder="0"
                        value={scores[s.id]?.ca || ''}
                        onChange={(e) => handleScoreChange(s.id, 'ca', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="counter" 
                        style={{background: '#0f172a', border: '1px solid #334155'}}
                        placeholder="0"
                        value={scores[s.id]?.exam || ''}
                        onChange={(e) => handleScoreChange(s.id, 'exam', e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: gradeInfo.color, fontSize: '1.1rem' }}>
                        {total}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: gradeInfo.color }}>
                        Grade: {gradeInfo.grade}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button 
            onClick={saveAllScores} 
            disabled={loading}
            className="btn-delete" 
            style={{ background: '#38bdf8', marginTop: '20px', width: '200px' }}
          >
            {loading ? 'Saving...' : '💾 Save All Results'}
          </button>
        </>
      ) : selectedClass && selectedSubject ? (
        <p className="text-dim" style={{padding: '20px'}}>No students found in this class.</p>
      ) : (
        <p className="text-dim" style={{padding: '20px', textAlign: 'center', border: '1px dashed #334155', borderRadius: '8px'}}>
          Please select a class and subject to begin grading.
        </p>
      )}
    </div>
  )
}

export default ScoreEntry