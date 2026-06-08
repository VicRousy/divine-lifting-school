import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { sendWelcomeEmail } from '../../services/emailService'

const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
const generatePassword = () => Math.random().toString(36).slice(-8)

function BulkImport({ showToast }) {
  const [csvData, setCsvData] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState({ students: 0, parents: 0 })
  const [errors, setErrors] = useState([])
  const [classMap, setClassMap] = useState({})

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('id, class_name')
      if (data) {
        const map = {}
        data.forEach(c => { map[c.class_name.toLowerCase().trim()] = c.id })
        setClassMap(map)
      }
    }
    fetchClasses()
  }, [])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))

      if (rows.length > 0) {
        setHeaders(rows[0])
        setCsvData(rows.slice(1).filter(row => row.length > 1))
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (csvData.length === 0) {
      showToast('No data to import.', 'error')
      return
    }

    setLoading(true)
    setErrors([])
    let studentCount = 0
    let parentCount = 0
    const importErrors = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      try {
        const [
          firstName, middleName, lastName, className,
          parentEmail, parentFirstName, parentLastName, parentPhone
        ] = row

        if (!firstName || !lastName || !className) {
          importErrors.push(`Row ${i + 1}: Missing required fields (first name, last name, class)`)
          continue
        }

        const classId = classMap[className.toLowerCase().trim()]
        if (!classId) {
          importErrors.push(`Row ${i + 1}: Class "${className}" not found`)
          continue
        }

        const studentId = generateId('STU')
        const parentId = generateId('PAR')
        const studentPassword = generatePassword()
        const parentPassword = generatePassword()
        const fullStudentName = `${firstName} ${middleName || ''} ${lastName}`.trim()

        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .insert([{
            parent_id: parentId,
            first_name: parentFirstName || firstName,
            middle_name: '-',
            last_name: parentLastName || lastName,
            email: (parentEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.com`).trim().toLowerCase(),
            phone: parentPhone || '',
            password: parentPassword,
          }])
          .select()
          .single()

        if (parentError) {
          importErrors.push(`Row ${i + 1}: Parent insert failed - ${parentError.message}`)
          continue
        }
        parentCount++

        const { error: studentError } = await supabase
          .from('students')
          .insert([{
            first_name: firstName,
            middle_name: middleName || '-',
            last_name: lastName,
            student_id: studentId,
            login_id: studentId,
            class_id: classId,
            parent_id: parentData.id,
            password: studentPassword,
            is_active: true,
          }])

        if (studentError) {
          importErrors.push(`Row ${i + 1}: Student insert failed - ${studentError.message}`)
          continue
        }
        studentCount++

        try {
          await sendWelcomeEmail(
            parentData.email,
            parentId,
            parentPassword,
            'parent',
            `${parentFirstName || firstName} ${parentLastName || lastName}`.trim(),
            fullStudentName,
          )
          await sendWelcomeEmail(
            parentData.email,
            studentId,
            studentPassword,
            'student',
            null,
            fullStudentName,
          )
        } catch {
          importErrors.push(`Row ${i + 1}: Student saved but welcome email failed (check email config)`)
        }
      } catch (err) {
        importErrors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    setImported({ students: studentCount, parents: parentCount })
    setErrors(importErrors)
    setLoading(false)

    if (studentCount > 0) {
      showToast(`Imported ${studentCount} students + ${parentCount} parent accounts. Emails sent.`, 'success')
    }
    if (importErrors.length > 0) {
      showToast(`${importErrors.length} errors occurred. Check details below.`, 'error')
    }
  }

  return (
    <div className="dashboard-card">
      <h2>Bulk Import Students</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        Upload a CSV file with columns: <strong>First Name, Middle Name, Last Name, Class, Parent Email, Parent First Name, Parent Last Name, Parent Phone</strong>
      </p>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ padding: '10px', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '6px', width: '100%' }}
        />
      </div>

      {csvData.length > 0 && (
        <>
          <div style={{ marginBottom: '15px', padding: '10px', background: '#1e293b', borderRadius: '6px' }}>
            <strong style={{ color: '#38bdf8' }}>{csvData.length}</strong> rows detected from CSV
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155' }}>
                  {headers.map((h, i) => (
                    <th key={i} style={{ padding: '10px', color: '#94a3b8', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '8px', color: '#f8fafc' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && (
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '10px' }}>
                Showing 5 of {csvData.length} rows
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: loading ? '#64748b' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Importing...' : `Import ${csvData.length} Students`}
          </button>
        </>
      )}

      {imported.students > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#10b98122', border: '1px solid #10b98144', borderRadius: '8px', color: '#10b981' }}>
          Imported {imported.students} students and {imported.parents} parent accounts. Welcome emails sent.
        </div>
      )}

      {errors.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#ef444422', border: '1px solid #ef444444', borderRadius: '8px' }}>
          <strong style={{ color: '#ef4444' }}>Import Errors:</strong>
          <ul style={{ margin: '10px 0 0', paddingLeft: '20px', color: '#ef4444' }}>
            {errors.slice(0, 10).map((err, i) => (
              <li key={i} style={{ marginBottom: '5px' }}>{err}</li>
            ))}
            {errors.length > 10 && <li>...and {errors.length - 10} more errors</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export default BulkImport
