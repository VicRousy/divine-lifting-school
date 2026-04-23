import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function AddTeacher(props) {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('') // New Middle Name box
  const [lastName, setLastName] = useState('')
  const [teachers, setTeachers] = useState([])
  const [msg, setMsg] = useState('')

  const fetchTeachers = async () => {
    const { data, error } = await supabase.from('teachers').select('*')
    if (error) console.log('Error fetching:', error)
    else setTeachers(data)
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg('Saving...')

    const { error } = await supabase
      .from('teachers')
      .insert([{ 
        first_name: firstName, 
        middle_name: middleName, // Now saving middle name!
        last_name: lastName,
        staff_id: 'TCH-' + Math.floor(Math.random() * 1000),
        email: firstName.toLowerCase() + '@school.com'
      }])

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Teacher added successfully!')
			if (props.onAdd) props.onAdd();
      setFirstName('')
      setMiddleName('') // Clear the box
      setLastName('')
      fetchTeachers()
    }
  }

  return (
    <div style={{ marginTop: '20px', padding: '20px' }}>
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
        <h3>Add New Teacher</h3>
        <form onSubmit={handleSave}>
          <input 
            placeholder="First Name" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            required 
          />
          <input 
            placeholder="Middle Name" 
            value={middleName} 
            onChange={(e) => setMiddleName(e.target.value)} 
          />
          <input 
            placeholder="Last Name" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            required 
          />
          <button type="submit">Save Teacher</button>
        </form>
        <p>{msg}</p>
      </div>

      <h3>Current Teachers List</h3>
      <ul>
        {teachers.map((t) => (
          <li key={t.id}>
            {t.first_name} {t.middle_name} {t.last_name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AddTeacher