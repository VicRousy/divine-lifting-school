import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generateReportCardPDF(student, className, termLabel, academicYear, totalStudents) {
  const doc = new jsPDF()
  
  // School Header
  doc.setFontSize(20)
  doc.setTextColor(30, 41, 59)
  doc.text('DIVINE LIFTING SCHOOL', 105, 20, { align: 'center' })
  
  doc.setFontSize(12)
  doc.setTextColor(100, 116, 139)
  doc.text('Academic Report Card', 105, 28, { align: 'center' })
  doc.text(`${termLabel} ${academicYear}`, 105, 34, { align: 'center' })
  
  // Student Info
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text(`Student Name: ${student.first_name} ${student.middle_name || ''} ${student.last_name}`, 14, 48)
  doc.text(`Admission No: ${student.admission_number || 'N/A'}`, 14, 56)
  
  doc.text(`Class: ${className}`, 140, 48)
  const positionSuffix = student.position === 1 ? 'st' : student.position === 2 ? 'nd' : student.position === 3 ? 'rd' : 'th'
  doc.text(`Position: ${student.position}${positionSuffix} out of ${totalStudents}`, 140, 56)
  
  // Grades Table
  const tableData = student.subjects.map((sub) => [
    sub.name,
    sub.ca1,
    sub.ca2,
    sub.exam,
    sub.total,
    sub.grade,
    sub.remark,
  ])
  
  doc.autoTable({
    startY: 65,
    head: [['Subject', 'CA1 (20)', 'CA2 (20)', 'Exam (60)', 'Total', 'Grade', 'Remark']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 30, halign: 'center' },
    },
  })
  
  // Summary Row
  const finalY = doc.lastAutoTable.finalY + 5
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.text('Total / Average', 14, finalY)
  doc.text(`${student.totalScore} / ${student.average}`, 140, finalY)
  doc.text(`${student.overallGrade} - ${student.overallRemark}`, 170, finalY)
  
  // Signatures
  const signatureY = finalY + 30
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  
  doc.line(14, signatureY, 74, signatureY)
  doc.text("Class Teacher's Signature", 14, signatureY + 5)
  
  doc.line(84, signatureY, 144, signatureY)
  doc.text("Principal's Signature", 84, signatureY + 5)
  
  doc.line(154, signatureY, 196, signatureY)
  doc.text("Parent's Signature", 154, signatureY + 5)
  
  // Footer
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' })
  
  // Save
  const fileName = `${student.last_name}_${student.first_name}_Report_${termLabel}_${academicYear}.pdf`
  doc.save(fileName)
}
