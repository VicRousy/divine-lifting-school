import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { getGradeInfo } from "../../utils/gradeUtils";
import {
  getPreferredTerm,
  getTermAcademicYear,
  getTermLabel,
  normalizeTermRows,
} from "../../utils/academicSession";
import { withTimeout } from "../../utils/asyncUtils";

function clampScore(value, max) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return "";
  return Math.max(0, Math.min(max, num));
}

export default function TeacherGradebook({ teacherId, showToast, onBack }) {
  const [setupLoading, setSetupLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [resolvedTeacherId, setResolvedTeacherId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const selectedAssignment = useMemo(
    () => assignments.find((a) => String(a.id) === String(selectedAssignmentId)),
    [assignments, selectedAssignmentId]
  );

  const selectedTerm = useMemo(
    () => terms.find((t) => String(t.id) === String(selectedTermId)),
    [terms, selectedTermId]
  );

  const selectedTermLabel = useMemo(
    () => getTermLabel(selectedTerm),
    [selectedTerm]
  );
  const selectedAcademicYear = useMemo(
    () => getTermAcademicYear(selectedTerm),
    [selectedTerm]
  );

  const isLocked = submissionStatus === "submitted" || submissionStatus === "approved";

  // ── Load assignments and terms ──────────────────────────────────────────
  useEffect(() => {
    const loadBasics = async () => {
      if (!teacherId) {
        setAssignments([]);
        setTerms([]);
        setSetupLoading(false);
        return;
      }
      setSetupLoading(true);
      setLoadError("");
      try {
        // Resolve BIGINT teacher id from teachers table (teacherId may be UUID or email)
        let teacherBigIntId = null;
        if (/^\d+$/.test(String(teacherId))) {
          teacherBigIntId = Number(teacherId);
        } else {
          const { data: t } = await supabase
            .from("teachers")
            .select("id")
            .or(`login_id.eq.${teacherId},email.eq.${teacherId}`)
            .maybeSingle();
          teacherBigIntId = t?.id ?? null;
        }
        setResolvedTeacherId(teacherBigIntId);

        // Parallel queries with minimal columns
        const [{ data: termData, error: termError }, { data: assignmentData, error: assignmentError }] =
          await withTimeout(
            Promise.all([
              supabase.from("terms").select("id, academic_year, is_active").order("id", { ascending: true }),
              teacherBigIntId
                ? supabase
                    .from("teacher_assignments")
                    .select(`id, class_id, subject_id,
                      classes (id, class_name),
                      subjects (id, subject_name)`)
                    .eq("teacher_id", teacherBigIntId)
                : Promise.resolve({ data: [], error: null }),
            ]),
            "Gradebook setup"
          );

        if (termError) throw termError;
        if (assignmentError) throw assignmentError;

        const normalizedTerms = normalizeTermRows(termData || []);
        setTerms(normalizedTerms);
        setAssignments(assignmentData || []);

        if (!selectedTermId && normalizedTerms.length > 0) {
          setSelectedTermId(String(getPreferredTerm(normalizedTerms).id));
        }
      } catch (e) {
        console.error("Gradebook setup error:", e);
        setLoadError(e.message || "Failed to load gradebook setup.");
        showToast?.("Failed to load gradebook setup.", "error");
      } finally {
        setSetupLoading(false);
      }
    };
    loadBasics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  // ─ Load roster, scores, and submission status ──────────────────────────
  useEffect(() => {
    const loadRosterAndScores = async () => {
      if (!selectedAssignment || !selectedTermLabel || !selectedAcademicYear) {
        setStudents([]);
        setScores({});
        setSubmissionStatus(null);
        return;
      }

      const classId = selectedAssignment.class_id ?? selectedAssignment.classes?.id;
      const subjectId = selectedAssignment.subject_id ?? selectedAssignment.subjects?.id;
      if (!classId || !subjectId) return;

      setRosterLoading(true);
      setLoadError("");
      try {
        const [
          { data: roster, error: rosterError },
          { data: existing, error: scoreError },
          { data: submission, error: submissionError },
        ] = await withTimeout(
          Promise.all([
            supabase
              .from("students")
              .select("id, first_name, middle_name, last_name")
              .eq("class_id", classId)
              .eq("is_active", true)
              .order("last_name", { ascending: true }),
            supabase
              .from("exam_scores")
              .select("student_id, ca1_score, ca2_score, exam_score, teacher_comment")
              .eq("class_id", classId)
              .eq("subject_id", subjectId)
              .eq("term", selectedTermLabel)
              .eq("academic_year", selectedAcademicYear),
            supabase
              .from("grade_submissions")
              .select("status, rejection_reason")
              .eq("teacher_id", resolvedTeacherId)
              .eq("class_id", classId)
              .eq("subject_id", subjectId)
              .eq("term", selectedTermLabel)
              .eq("academic_year", selectedAcademicYear)
              .maybeSingle(),
          ]),
          "Gradebook data"
        );

        if (rosterError) throw rosterError;
        if (scoreError) throw scoreError;
        if (submissionError) throw submissionError;

        const rosterList = roster || [];
        setStudents(rosterList);

        const initial = {};
        const initialComments = {};
        for (const s of rosterList) {
          initial[s.id] = { ca1: "", ca2: "", exam: "" };
          initialComments[s.id] = "";
        }
        for (const row of existing || []) {
          if (!initial[row.student_id]) continue;
          initial[row.student_id] = {
            ca1: row.ca1_score ?? "",
            ca2: row.ca2_score ?? "",
            exam: row.exam_score ?? "",
          };
          initialComments[row.student_id] = row.teacher_comment ?? "";
        }

        setScores(initial);
        setComments(initialComments);
        setSubmissionStatus(submission?.status ?? "draft");
        setRejectionReason(submission?.rejection_reason ?? "");
      } catch (e) {
        console.error("Gradebook data error:", e);
        setLoadError(e.message || "Failed to load gradebook data.");
        showToast?.("Failed to load gradebook data.", "error");
      } finally {
        setRosterLoading(false);
      }
    };
    loadRosterAndScores();
  }, [selectedAssignment, selectedTermLabel, selectedAcademicYear, resolvedTeacherId, showToast]);

  const updateScore = (studentId, field, rawValue) => {
    if (isLocked) return;
    const max = field === "exam" ? 60 : 20;
    const next = rawValue === "" ? "" : clampScore(rawValue, max);
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { ca1: "", ca2: "", exam: "" }), [field]: next },
    }));
  };

  const updateComment = (studentId, text) => {
    if (isLocked) return;
    setComments((prev) => ({ ...prev, [studentId]: text }));
  };

  const saveDraft = async () => {
    if (!selectedAssignment || !selectedTermLabel || !selectedAcademicYear) {
      showToast?.("Select assignment and term first.", "error");
      return;
    }
    if (isLocked) {
      showToast?.("Grades are locked after submission.", "error");
      return;
    }

    const classId = selectedAssignment.class_id ?? selectedAssignment.classes?.id;
    const subjectId = selectedAssignment.subject_id ?? selectedAssignment.subjects?.id;
    if (!classId || !subjectId) return;

    setSaving(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        class_id: classId,
        subject_id: subjectId,
        term: selectedTermLabel,
        academic_year: selectedAcademicYear,
        ca1_score: Number(scores[s.id]?.ca1 || 0),
        ca2_score: Number(scores[s.id]?.ca2 || 0),
        exam_score: Number(scores[s.id]?.exam || 0),
        teacher_comment: comments[s.id] || "",
      }));

      const { error } = await supabase.from("exam_scores").upsert(payload, {
        onConflict: "student_id,subject_id,term,academic_year",
      });

      if (error) {
        showToast?.("Save failed: " + error.message, "error");
      } else {
        showToast?.("Gradebook saved as draft.", "success");
      }
    } finally {
      setSaving(false);
    }
  };

  const submitToAdmin = async () => {
    if (!selectedAssignment || !selectedTermLabel || !selectedAcademicYear) return;
    if (students.length === 0) {
      showToast?.("No students to submit.", "error");
      return;
    }

    const classId = selectedAssignment.class_id ?? selectedAssignment.classes?.id;
    const subjectId = selectedAssignment.subject_id ?? selectedAssignment.subjects?.id;
    if (!classId || !subjectId) return;

    // Save scores first, then lock
    setSubmitting(true);
    try {
      const payload = students.map((s) => ({
        student_id: s.id,
        class_id: classId,
        subject_id: subjectId,
        term: selectedTermLabel,
        academic_year: selectedAcademicYear,
        ca1_score: Number(scores[s.id]?.ca1 || 0),
        ca2_score: Number(scores[s.id]?.ca2 || 0),
        exam_score: Number(scores[s.id]?.exam || 0),
        teacher_comment: comments[s.id] || "",
      }));

      const { error: scoreError } = await supabase
        .from("exam_scores")
        .upsert(payload, { onConflict: "student_id,subject_id,term,academic_year" });

      if (scoreError) {
        showToast?.("Failed to save scores before submission.", "error");
        return;
      }

      const { error: subError } = await supabase
        .from("grade_submissions")
        .upsert({
          teacher_id: resolvedTeacherId,
          class_id: classId,
          subject_id: subjectId,
          term: selectedTermLabel,
          academic_year: selectedAcademicYear,
          status: "submitted",
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
        }, { onConflict: "teacher_id,class_id,subject_id,term,academic_year" });

      if (subError) {
        showToast?.(
          "Grades saved, but submission failed. Run supabase_setup.sql, then submit again.",
          "error"
        );
      } else {
        setSubmissionStatus("submitted");
        showToast?.("Grades submitted to admin for review.", "success");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (setupLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
        Loading gradebook...
      </div>
    );
  }

  return (
    <div style={{ padding: 30, minHeight: "100vh", background: "#0f172a" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc" }}>Teacher Gradebook</h2>
          <div style={{ marginTop: 6, color: "#94a3b8", fontSize: "0.9rem" }}>
            CA1 (20) + CA2 (20) + Exam (60) = Total (100)
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onBack}
            style={{
              background: "transparent",
              border: "1px solid #334155",
              color: "#e2e8f0",
              padding: "10px 14px",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          {!isLocked && (
            <button
              onClick={saveDraft}
              disabled={saving || students.length === 0}
              style={{
                background: saving ? "#334155" : "#1e293b",
                border: "1px solid #334155",
                color: "#e2e8f0",
                padding: "10px 14px",
                borderRadius: 10,
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {saving ? "Saving..." : "💾 Save Draft"}
            </button>
          )}
          {!isLocked && (
            <button
              onClick={submitToAdmin}
              disabled={submitting || students.length === 0}
              style={{
                background: submitting ? "#334155" : "#10b981",
                border: "none",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 10,
                cursor: submitting ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {submitting ? "Submitting..." : "✅ Submit to Admin"}
            </button>
          )}
        </div>
      </div>

      {/* Submission status banner */}
      {submissionStatus === "submitted" && (
        <div style={{
          background: "rgba(16, 185, 129, 0.1)",
          border: "1px solid #10b981",
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 18,
          color: "#10b981",
          fontWeight: 600,
        }}>
          ✅ Grades submitted — awaiting admin approval. Editing is locked.
        </div>
      )}
      {submissionStatus === "approved" && (
        <div style={{
          background: "rgba(56, 189, 248, 0.1)",
          border: "1px solid #38bdf8",
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 18,
          color: "#38bdf8",
          fontWeight: 600,
        }}>
          🎉 Grades approved by admin.
        </div>
      )}
      {submissionStatus === "rejected" && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid #ef4444",
          borderRadius: 10,
          padding: "14px 20px",
          marginBottom: 18,
          color: "#ef4444",
          fontWeight: 600,
        }}>
          ❌ Grades rejected by admin.
          {rejectionReason && (
            <div style={{ marginTop: 6, fontWeight: 400, color: "#fca5a5" }}>
              Reason: {rejectionReason}
            </div>
          )}
          <div style={{ marginTop: 8, color: "#94a3b8", fontWeight: 400, fontSize: "0.85rem" }}>
            Make corrections and resubmit.
          </div>
        </div>
      )}

      {/* Selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: 6 }}>
            ASSIGNMENT (Class + Subject)
          </div>
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            style={{ width: "100%", padding: 12, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }}
          >
            <option value="">Select assignment</option>
            {assignments.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.classes?.class_name} — {a.subjects?.subject_name}
              </option>
            ))}
          </select>
          {assignments.length === 0 && (
            <div style={{ marginTop: 8, color: "#f59e0b", fontSize: "0.85rem" }}>
              No assignments yet. Admin must assign your classes/subjects.
            </div>
          )}
        </div>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: 6 }}>TERM</div>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            style={{ width: "100%", padding: 12, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", outline: "none" }}
          >
            <option value="">Select term</option>
            {terms.map((t) => (
              <option key={t.id} value={String(t.id)}>
                {t.__label || `Term ${t.id}`} ({t.__academicYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loadError && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 18,
          color: "#fecaca",
        }}>
          {loadError}
        </div>
      )}

      {/* Gradebook table */}
      {selectedAssignmentId && selectedTermId ? (
        rosterLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>
            Loading selected class...
          </div>
        ) : students.length > 0 ? (
          <div style={{ background: "rgba(30, 41, 59, 0.5)", border: "1px solid #334155", borderRadius: 14, overflow: "hidden" }}>
            {isLocked && (
              <div style={{ padding: "10px 20px", background: "rgba(100,116,139,0.2)", borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "0.85rem" }}>
                🔒 Gradebook is locked. Contact admin to make changes.
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #334155" }}>
                    {["STUDENT", "CA1 (20)", "CA2 (20)", "EXAM (60)", "TOTAL", "GRADE", "COMMENT"].map((h) => (
                      <th scope="col" key={h} style={{ padding: 14, textAlign: h === "STUDENT" || h === "COMMENT" ? "left" : "center", color: "#94a3b8", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const row = scores[s.id] || { ca1: "", ca2: "", exam: "" };
                    const total = Number(row.ca1 || 0) + Number(row.ca2 || 0) + Number(row.exam || 0);
                    const gradeInfo = getGradeInfo(total);
                    const comment = comments[s.id] || "";

                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: 14, color: "#e2e8f0", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {s.first_name} {s.middle_name ? `${s.middle_name} ` : ""}{s.last_name}
                        </td>
                        {["ca1", "ca2", "exam"].map((field) => (
                          <td key={field} style={{ padding: 14, textAlign: "center" }}>
                            <input
                              type="number"
                              min={0}
                              max={field === "exam" ? 60 : 20}
                              value={row[field]}
                              onChange={(e) => updateScore(s.id, field, e.target.value)}
                              disabled={isLocked}
                              style={{
                                width: 80,
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid #334155",
                                background: isLocked ? "#0f172a" : "#0f172a",
                                color: isLocked ? "#64748b" : "#e2e8f0",
                                outline: "none",
                                textAlign: "center",
                                cursor: isLocked ? "not-allowed" : "text",
                              }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: 14, textAlign: "center", color: total >= 50 ? "#22c55e" : "#f59e0b", fontWeight: 800, fontSize: "1rem" }}>
                          {total}
                        </td>
                        <td style={{ padding: 14, textAlign: "center", color: gradeInfo.color, fontWeight: 800 }}>
                          {gradeInfo.grade}
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>
                            {gradeInfo.remark}
                          </div>
                        </td>
                        <td style={{ padding: 14 }}>
                          <input
                            type="text"
                            value={comment}
                            onChange={(e) => updateComment(s.id, e.target.value)}
                            placeholder={isLocked ? "" : "Add comment..."}
                            disabled={isLocked}
                            style={{
                              width: "100%",
                              minWidth: 150,
                              padding: "8px 10px",
                              borderRadius: 8,
                              border: "1px solid #334155",
                              background: "#0f172a",
                              color: isLocked ? "#64748b" : "#e2e8f0",
                              outline: "none",
                              fontSize: "0.85rem",
                              cursor: isLocked ? "not-allowed" : "text",
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>
            No active students found in this class.
          </div>
        )
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", border: "1px dashed #334155", borderRadius: 14 }}>
          Select an assignment and term to start entering grades.
        </div>
      )}
    </div>
  );
}
