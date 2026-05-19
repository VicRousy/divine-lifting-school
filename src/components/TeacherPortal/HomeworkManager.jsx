import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function HomeworkManager({ teacherId, showToast }) {
  const [classes, setClasses] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchHomeworks();
  }, [teacherId]);

  const fetchClasses = async () => {
    if (!teacherId) return;
    let teacherBigIntId = null;
    if (/^\d+$/.test(String(teacherId))) {
      teacherBigIntId = Number(teacherId);
    } else {
      const { data: t } = await supabase.from("teachers").select("id").or(`login_id.eq.${teacherId},email.eq.${teacherId}`).maybeSingle();
      teacherBigIntId = t?.id;
    }

    if (teacherBigIntId) {
      const { data } = await supabase.from("teacher_assignments").select("class_id, classes(id, class_name)").eq("teacher_id", teacherBigIntId);
      const seen = new Set();
      const assignedClasses = (data || []).filter((row) => row.classes?.id && !seen.has(row.classes.id) && seen.add(row.classes.id)).map((row) => row.classes);
      setClasses(assignedClasses);
    }
  };

  const fetchHomeworks = async () => {
    setLoading(true);
    const { data } = await supabase.from("homeworks").select("*").order("created_at", { ascending: false });
    setHomeworks(data || []);
    setLoading(false);
  };

  const createHomework = async (e) => {
    e.preventDefault();
    if (!selectedClass || !title || !dueDate) {
      showToast?.("Please fill in all required fields", "error");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("homeworks").insert({
        teacher_id: teacherId,
        class_id: selectedClass,
        title,
        description,
        due_date: dueDate,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      showToast?.("Homework posted successfully!", "success");
      setTitle("");
      setDescription("");
      setDueDate("");
      fetchHomeworks();
    } catch (err) {
      showToast?.("Failed to post homework: " + err.message, "error");
    }
    setSaving(false);
  };

  const deleteHomework = async (id) => {
    const { error } = await supabase.from("homeworks").delete().eq("id", id);
    if (error) {
      showToast?.("Failed to delete homework", "error");
    } else {
      showToast?.("Homework deleted", "success");
      fetchHomeworks();
    }
  };

  return (
    <div style={{ padding: 30, background: "#0f172a", minHeight: "100vh" }}>
      <h2 style={{ margin: "0 0 20px", color: "#f8fafc" }}>Homework Manager</h2>

      <div style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", borderRadius: 14, padding: 24, marginBottom: 30 }}>
        <h3 style={{ margin: "0 0 16px", color: "#38bdf8" }}>Post New Homework</h3>
        <form onSubmit={createHomework} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>Class</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} required style={{ width: "100%", padding: 12, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }}>
                <option value="">Select class</option>
                {classes.map((c) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required style={{ width: "100%", padding: 12, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Chapter 5 Exercises" style={{ width: "100%", padding: 12, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", marginBottom: 6 }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Detailed instructions..." style={{ width: "100%", padding: 12, background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none", resize: "vertical" }} />
          </div>
          <button type="submit" disabled={saving} style={{ padding: "12px 24px", background: saving ? "#334155" : "#a855f7", color: saving ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Posting..." : "📝 Post Homework"}
          </button>
        </form>
      </div>

      <h3 style={{ margin: "0 0 16px", color: "#f8fafc" }}>Posted Homework</h3>
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
      ) : homeworks.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>No homework posted yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {homeworks.map((hw) => (
            <div key={hw.id} style={{ background: "rgba(30,41,59,0.5)", border: "1px solid #334155", borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#e2e8f0" }}>{hw.title}</h4>
                <p style={{ margin: "0 0 8px", color: "#94a3b8", fontSize: "0.9rem" }}>{hw.description}</p>
                <div style={{ display: "flex", gap: 16, fontSize: "0.8rem", color: "#64748b" }}>
                  <span>📅 Due: {new Date(hw.due_date).toLocaleDateString()}</span>
                  <span>🏫 Class ID: {hw.class_id}</span>
                </div>
              </div>
              <button onClick={() => deleteHomework(hw.id)} style={{ padding: "6px 12px", background: "#ef4444", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: "0.8rem" }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
