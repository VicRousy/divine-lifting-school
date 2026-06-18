import { useState, useEffect, useCallback } from 'react'
import { useUnsavedChanges } from '../../utils/useUnsavedChanges'
import { supabase } from '../../supabaseClient'
import { safeQuery } from '../../utils/safeQuery'
import { sendWelcomeEmail } from '../../services/emailService'

const CHUNK_SIZE = 20
const EMAIL_CONCURRENCY = 5

const generateId = (prefix: string) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  const array = new Uint32Array(8)
  crypto.getRandomValues(array)
  return Array.from(array).map((n) => chars[n % chars.length]).join('')
}

interface BulkImportProps {
  showToast?: (msg: string, type: string) => void
  requireReAuth?: (description: string, callback: () => Promise<void>) => void
}

function BulkImport({ showToast, requireReAuth }: BulkImportProps) {
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState({ students: 0, parents: 0 })
  const [errors, setErrors] = useState<string[]>([])
  const [classMap, setClassMap] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)
  useUnsavedChanges(dirty)

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await safeQuery(() => supabase.from('classes').select('id, class_name'))
      if (data) {
        const map: Record<string, string> = {}
        data.forEach((c: any) => { map[c.class_name.toLowerCase().trim()] = c.id })
        setClassMap(map)
      }
    }
    fetchClasses()
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')))

      if (rows.length > 0) {
        setHeaders(rows[0])
        setCsvData(rows.slice(1).filter(row => row.length > 1))
        setDirty(true)
      }
    }
    reader.readAsText(file)
  }

  const doImport = useCallback(async () => {
    setLoading(true)
    setErrors([])
    let studentCount = 0
    let parentCount = 0
    const importErrors: string[] = []
    const emailQueue: Array<{
      email: string
      parentId: string
      parentPassword: string
      studentId: string
      studentPassword: string
      parentName: string
      studentName: string
    }> = []

    for (let chunkStart = 0; chunkStart < csvData.length; chunkStart += CHUNK_SIZE) {
      const chunk = csvData.slice(chunkStart, chunkStart + CHUNK_SIZE)

      const chunkParentResults = await Promise.all(chunk.map(async (row, idx) => {
        const rowIndex = chunkStart + idx
        const [firstName, middleName, lastName, className, parentEmail, parentFirstName, parentLastName, parentPhone] = row

        if (!firstName || !lastName || !className) {
          return { error: `Row ${rowIndex + 1}: Missing required fields (first name, last name, class)`, parentData: null as any, row }
        }

        const classId = classMap[className.toLowerCase().trim()]
        if (!classId) {
          return { error: `Row ${rowIndex + 1}: Class "${className}" not found`, parentData: null, row }
        }

        const studentId = generateId('STU')
        const parentId = generateId('PAR')
        const studentPassword = generatePassword()
        const parentPassword = generatePassword()
        const fullStudentName = `${firstName} ${middleName || ''} ${lastName}`.trim()
        const parentEmailAddr = (parentEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.com`).trim().toLowerCase()

        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .insert([{
            parent_id: parentId,
            first_name: parentFirstName || firstName,
            middle_name: '-',
            last_name: parentLastName || lastName,
            email: parentEmailAddr,
            phone: parentPhone || '',
            password: parentPassword,
          }])
          .select('id, email')
          .single()

        if (parentError) {
          return { error: `Row ${rowIndex + 1}: Parent insert failed - ${parentError.message}`, parentData: null, row }
        }

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
          return { error: `Row ${rowIndex + 1}: Student insert failed - ${studentError.message}`, parentData: null, row }
        }

        emailQueue.push({
          email: parentData.email,
          parentId,
          parentPassword,
          studentId,
          studentPassword,
          parentName: `${parentFirstName || firstName} ${parentLastName || lastName}`.trim(),
          studentName: fullStudentName,
        })

        return { error: null, parentData, row }
      }))

      for (const result of chunkParentResults) {
        if (result.error) {
          importErrors.push(result.error)
        } else {
          studentCount++
          parentCount++
        }
      }
    }

    let emailSent = 0
    let emailFailed = 0

    for (let i = 0; i < emailQueue.length; i += EMAIL_CONCURRENCY) {
      const batch = emailQueue.slice(i, i + EMAIL_CONCURRENCY)
      const results = await Promise.allSettled(batch.map(async (item) => {
        try {
          await sendWelcomeEmail(item.email, item.parentId, item.parentPassword, 'parent', item.parentName, item.studentName)
          await sendWelcomeEmail(item.email, item.studentId, item.studentPassword, 'student', null, item.studentName)
          return true
        } catch {
          return false
        }
      }))
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) emailSent++
        else emailFailed++
      }
    }

    setImported({ students: studentCount, parents: parentCount })
    setErrors(importErrors)
    setLoading(false)

    if (studentCount > 0) {
      const emailMsg = emailSent > 0 ? `. ${emailSent} email pairs sent.` : '.'
      showToast?.(`Imported ${studentCount} students + ${parentCount} parent accounts${emailMsg}`, 'success')
    }
    if (importErrors.length > 0) {
      showToast?.(`${importErrors.length} errors occurred. Check details below.`, 'error')
    }
    if (emailFailed > 0) {
      showToast?.(`${emailFailed} emails failed to send.`, 'warning')
    }
    setDirty(false)
  }, [csvData, classMap, showToast])

  const handleImport = () => {
    if (csvData.length === 0) {
      showToast?.('No data to import.', 'error')
      return
    }
    if (requireReAuth) {
      requireReAuth('Enter your password to bulk import students', doImport)
    } else {
      doImport()
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
                    <th scope="col" key={i} style={{ padding: '10px', color: '#94a3b8', textAlign: 'left' }}>{h}</th>
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
          Imported {imported.students} students and {imported.parents} parent accounts.
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
