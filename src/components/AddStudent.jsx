import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function AddStudent(props) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function getClasses() {
      const { data } = await supabase.from('classes').select('id, class_name')
      setClasses(data || [])
    }
    getClasses()
  }, [])

  const handleSaveStudent = async (e) => {
    e.preventDefault()
    if (!selectedClass) return setMsg('Please select a class')

    const { error } = await supabase
      .from('students')
      .insert([{ 
        first_name: firstName, 
        middle_name: middleName,
        last_name: lastName,
        class_id: selectedClass,
        admission_number: 'ADM-' + Math.floor(1000 + Math.random() * 9000)
      }])

    if (error) setMsg(error.message)
    else {
      setMsg(`Student ${firstName} added to class!`)
			if (props.onAdd) props.onAdd();
      setFirstName(''); setMiddleName(''); setLastName('')
    }
  }

  return (
    <div style={{ border: '1px solid #666', padding: '20px', marginTop: '20px' }}>
      <h3>Add New Student</h3>
      <form onSubmit={handleSaveStudent}>
        <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input placeholder="Middle Name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
        <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        
        <select onChange={(e) => setSelectedClass(e.target.value)} required>
          <option value="">-- Select Class --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.class_name}</option>
          ))}
        </select>

        <button type="submit">Register Student</button>
      </form>
      <p>{msg}</p>
    </div>
  )
}

export default AddStudent