import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function ClassRoster({ teacherId, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!teacherId) { setLoading(false); return; }
      try {
        let teacherBigIntId = null;
        if (/^\d+$/.test(String(teacherId))) {
          teacherBigIntId = Number(teacherId);
        } else {
          const { data: t } = await supabase
            .from("teachers")
            .select("id")
            .or(`login_id.eq.${teacherId},email.eq.${teacherId}`)
            .maybeSingle();
          teacherBigIntId = t?.id;
        }

        if (!teacherBigIntId) { setLoading(false); return; }

        const { data } = await supabase
          .from("teacher_assignments")
          .select(`class_id, classes (id, class_name)`)
          .eq("teacher_id", teacherBigIntId);

        // Deduplicate classes
        const seen = new Set();
        const unique = (data || []).filter((a) => {
          if (seen.has(a.class_id)) return false;
          seen.add(a.class_id);
          return true;
        });
        setAssignments(unique);
        if (unique.length > 0) setSelectedClassId(String(unique[0].class_id));
      } catch (e) {
        showToast?.("Failed to load classes.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId, showToast]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId) { setStudents([]); return; }
      setLoadingStudents(true);
      try {
        const { data } = await supabase
          .from("students")
          .select("id, first_name, middle_name, last_name, admission_number, date_of_birth, gender")
          .eq("class_id", selectedClassId)
          .eq("is_active", true)
          .order("last_name", { ascending: true });
        setStudents(data || []);
      } catch (e) {
        showToast?.("Failed to load students.", "error");
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [selectedClassId, showToast]);

  const selectedClassName = assignments.find(
    (a) => String(a.class_id) === String(selectedClassId)
  )?.classes?.class_name || "";

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        Loading roster...
      </div>
    );
  }

  return (
    <div style={{ padding: 30, minHeight: "100vh", background: "#0f172a" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 6px", color: "#f8fafc" }}>Class Roster</h2>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
          View students in your assigned classes.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>
          No class assignments yet. Contact the administrator.
        </div>
      ) : (
        <>
          {/* Class selector */}
          <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {assignments.map((a) => (
              <button
                key={a.class_id}
                onClick={() => setSelectedClassId(String(a.class_id))}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "1px solid",
                  borderColor: String(a.class_id) === String(selectedClassId) ? "#38bdf8" : "#334155",
                  background: String(a.class_id) === String(selectedClassId) ? "rgba(56,189,248,0.1)" : "transparent",
                  color: String(a.class_id) === String(selectedClassId) ? "#38bdf8" : "#94a3b8",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {a.classes?.class_name}
              </button>
            ))}
          </div>

          {/* Student count */}
          <div style={{ marginBottom: 16, color: "#94a3b8", fontSize: "0.9rem" }}>
            {selectedClassName} —{" "}
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>
              {students.length} student{students.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loadingStudents ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>
              No active students in this class.
            </div>
          ) : (
            <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    {["#", "STUDENT NAME", "ADMISSION NO.", "GENDER", "DATE OF BIRTH"].map((h) => (
                      <th scope="col" key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseOver={(e) => e.currentTarget.style.background = "rgba(56,189,248,0.04)"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "0.85rem" }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#f8fafc", fontWeight: 600 }}>
                        {s.last_name}, {s.first_name}{s.middle_name ? ` ${s.middle_name}` : ""}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8", fontFamily: "monospace" }}>
                        {s.admission_number || "—"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8" }}>
                        {s.gender || "—"}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#94a3b8" }}>
                        {s.date_of_birth
                          ? new Date(s.date_of_birth).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}