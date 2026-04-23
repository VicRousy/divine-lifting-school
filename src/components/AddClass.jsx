import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function AddClass(props) {
  const [className, setClassName] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [teachers, setTeachers] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    // We need to get teachers so we can link one to this class
    async function getTeachers() {
      const { data } = await supabase.from('teachers').select('id, first_name, last_name')
      setTeachers(data || [])
    }
    getTeachers()
  }, [])

  const handleSaveClass = async (e) => {
    e.preventDefault()
    if (!selectedTeacher) return setMsg('Please select a teacher')

    const { error } = await supabase
      .from('classes')
      .insert([{ 
        class_name: className, 
        class_teacher_id: selectedTeacher 
      }])

    if (error) setMsg(error.message)
    else {
      setMsg(`Class "${className}" created!`)
			if (props.onAdd) props.onAdd();
      setClassName('')
    }
  }

  return (
    <div style={{ border: '1px solid #444', padding: '20px', marginTop: '20px' }}>
      <h3>Create a New Class</h3>
      <form onSubmit={handleSaveClass}>
        <input 
          placeholder="Class Name (e.g. Primary 1)" 
          value={className} 
          onChange={(e) => setClassName(e.target.value)} 
          required 
        />
        
        <select onChange={(e) => setSelectedTeacher(e.target.value)} required>
          <option value="">-- Select Teacher --</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>
              {t.first_name} {t.last_name}
            </option>
          ))}
        </select>

        <button type="submit">Create Class</button>
      </form>
      <p>{msg}</p>
    </div>
  )
}

export default AddClass