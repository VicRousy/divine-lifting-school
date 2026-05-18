import { useState } from 'react'
import { supabase } from '../../supabaseClient'

function BulkImport({ showToast }) {
  const [csvData, setCsvData] = useState([])
  const [headers, setHeaders] = useState([])
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState(0)
  const [errors, setErrors] = useState([])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()))
      
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
    let successCount = 0
    const importErrors = []

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      try {
        // Expected CSV format: First Name, Middle Name, Last Name, Class, Email
        const [firstName, middleName, lastName, className, email] = row
        
        if (!firstName || !lastName || !className) {
          importErrors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        const { error } = await supabase.from('students').insert([{
          first_name: firstName,
          middle_name: middleName || '-',
          last_name: lastName,
          class_name: className,
          email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.com`,
          student_id: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
          login_id: `STU-${Math.floor(1000 + Math.random() * 9000)}`
        }])

        if (error) {
          importErrors.push(`Row ${i + 1}: ${error.message}`)
        } else {
          successCount++
        }
      } catch (err) {
        importErrors.push(`Row ${i + 1}: ${err.message}`)
      }
    }

    setImported(successCount)
    setErrors(importErrors)
    setLoading(false)
    
    if (successCount > 0) {
      showToast(`Successfully imported ${successCount} students!`, 'success')
    }
    if (importErrors.length > 0) {
      showToast(`${importErrors.length} errors occurred. Check details below.`, 'error')
    }
  }

  return (
    <div className="dashboard-card">
      <h2>Bulk Import Students</h2>
      <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
        Upload a CSV file with columns: First Name, Middle Name, Last Name, Class, Email (optional)
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

      {imported > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#10b98122', border: '1px solid #10b98144', borderRadius: '8px', color: '#10b981' }}>
          Successfully imported {imported} students!
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
