import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { safeQuery } from "../../utils/safeQuery";

export default function QuickAttendance({ teacherId, showToast }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    if (!teacherId) return;
    let teacherBigIntId = null;
    if (/^\d+$/.test(String(teacherId))) {
      teacherBigIntId = Number(teacherId);
    } else {
      const { data: t } = await safeQuery(() => supabase.from("teachers").select("id").or(`login_id.eq.${teacherId},email.eq.${teacherId}`).maybeSingle());
      teacherBigIntId = t?.id;
    }

    if (teacherBigIntId) {
      const { data } = await safeQuery(() => supabase.from("teacher_assignments").select("class_id, classes(id, class_name)").eq("teacher_id", teacherBigIntId));
      const seen = new Set();
      const assignedClasses = (data || []).filter((row) => row.classes?.id && !seen.has(row.classes.id) && seen.add(row.classes.id)).map((row) => row.classes);
      setClasses(assignedClasses);
      if (assignedClasses.length > 0) setSelectedClass(assignedClasses[0].id);
    }
  };

  useEffect(() => {
    if (selectedClass && selectedDate) fetchStudentsAndAttendance();
  }, [selectedClass, selectedDate]);

  const fetchStudentsAndAttendance = async () => {
    setLoading(true);
    const { data: studentData } = await safeQuery(() => supabase.from("students").select("id, first_name, middle_name, last_name").eq("class_id", selectedClass).eq("is_active", true).order("last_name"));
    setStudents(studentData || []);

    const { data: attendanceData } = await safeQuery(() => supabase.from("attendance").select("*").eq("date", selectedDate).in("student_id", (studentData || []).map((s) => s.id)));

    const initialAttendance = {};
    studentData?.forEach((s) => {
      const existing = attendanceData?.find((a) => a.student_id === s.id);
      initialAttendance[s.id] = existing?.status || "present";
    });
    setAttendance(initialAttendance);
    setLoading(false);
  };

  const markAll = (status) => {
    const next = {};
    students.forEach((s) => (next[s.id] = status));
    setAttendance(next);
  };

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({ ...prev, [studentId]: prev[studentId] === "present" ? "absent" : "present" }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        date: selectedDate,
        status: attendance[s.id] || "present",
        marked_by: teacherId,
      }));

      const { error } = await supabase.from("attendance").upsert(payload, { onConflict: "student_id,date" });
      if (error) throw error;

      showToast?.("Attendance saved successfully!", "success");
    } catch (err) {
      showToast?.("Failed to save attendance: " + err.message, "error");
    }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter((v) => v === "present").length;
  const absentCount = Object.values(attendance).filter((v) => v === "absent").length;

  return (
    <div style={{ padding: 30, background: "#0f172a", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc" }}>Quick Attendance</h2>
          <p style={{ margin: "5px 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>One-click attendance marking for your classes</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => markAll("present")} style={{ padding: "8px 16px", background: "#10b981", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600 }}>✅ All Present</button>
          <button onClick={() => markAll("absent")} style={{ padding: "8px 16px", background: "#ef4444", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 600 }}>❌ All Absent</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: 6 }}>CLASS</div>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ width: "100%", padding: 12, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }}>
            {classes.map((c) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
          </select>
        </div>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: 6 }}>DATE</div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ width: "100%", padding: 12, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }} />
        </div>
      </div>

      {selectedClass && students.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", borderRadius: 10, padding: "12px 20px", color: "#10b981", fontWeight: 700 }}>✅ Present: {presentCount}</div>
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: 10, padding: "12px 20px", color: "#ef4444", fontWeight: 700 }}>❌ Absent: {absentCount}</div>
          </div>

          <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ padding: 14, textAlign: "left", color: "#94a3b8", fontSize: "0.8rem" }}>STUDENT</th>
                  <th style={{ padding: 14, textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", width: 150 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: 14, color: "#e2e8f0", fontWeight: 600 }}>{s.first_name} {s.middle_name ? `${s.middle_name} ` : ""}{s.last_name}</td>
                    <td style={{ padding: 14, textAlign: "center" }}>
                      <button
                        onClick={() => toggleAttendance(s.id)}
                        style={{
                          padding: "8px 20px",
                          borderRadius: 8,
                          border: "none",
                          background: attendance[s.id] === "present" ? "#10b981" : "#ef4444",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          transition: "all 0.2s",
                        }}
                      >
                        {attendance[s.id] === "present" ? "✅ Present" : "❌ Absent"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={saveAttendance} disabled={saving} style={{ marginTop: 20, padding: "12px 24px", background: saving ? "#334155" : "#38bdf8", color: saving ? "#94a3b8" : "#0f172a", border: "none", borderRadius: 10, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: "1rem" }}>
            {saving ? "Saving..." : "💾 Save Attendance"}
          </button>
        </>
      )}

      {loading && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading students...</div>}
      {selectedClass && students.length === 0 && !loading && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>No students in this class.</div>}
    </div>
  );
}
