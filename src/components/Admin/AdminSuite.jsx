import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  loadAnnouncementFeed,
  publishAnnouncement,
} from "../../services/announcementService";
import {
  TERM_NAMES,
  formatTermSession,
  getAcademicYearOptions,
  getNextTermAfter,
  getPreferredTerm,
  getUpcomingFirstTermAcademicYear,
  normalizeTermRows,
} from "../../utils/academicSession";

const panelStyle = {
  background: "rgba(30, 41, 59, 0.6)",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 20,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#f8fafc",
  boxSizing: "border-box",
};

const buttonStyle = {
  border: "none",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const getFullName = (person) =>
  [person?.first_name, person?.middle_name, person?.last_name]
    .filter(Boolean)
    .join(" ") || person?.email || "Unnamed";

const toCurrency = (value) => `N${Number(value || 0).toLocaleString()}`;

const getScoreTotal = (score) =>
  Number(
    score?.total_score ??
      Number(score?.ca1_score || 0) +
        Number(score?.ca2_score || 0) +
        Number(score?.exam_score || 0)
  );

const downloadCsv = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function AdminShell({ title, subtitle, children, actions }) {
  return (
    <div className="admin-table-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#f8fafc" }}>{title}</h2>
          {subtitle && (
            <p style={{ margin: "8px 0 0", color: "#94a3b8" }}>{subtitle}</p>
          )}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{ ...panelStyle, textAlign: "center", color: "#94a3b8" }}>
      {message}
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div
      style={{
        ...panelStyle,
        borderColor: "rgba(239, 68, 68, 0.35)",
        color: "#fecaca",
      }}
    >
      {message}
    </div>
  );
}

export function BulkImportStudents({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [rawCsv, setRawCsv] = useState("");
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, class_name")
        .eq("is_active", true)
        .order("class_name");
      setClasses(data || []);
    };
    load();
  }, []);

  useEffect(() => {
    const lines = rawCsv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    setPreview(
      lines.slice(0, 20).map((line) => {
        const [firstName, middleName, lastName, admissionNumber] = line
          .split(",")
          .map((value) => value.trim());
        return { firstName, middleName, lastName, admissionNumber };
      })
    );
  }, [rawCsv]);

  const importStudents = async () => {
    if (!selectedClass) {
      showToast("Select a class before importing.", "error");
      return;
    }
    const rows = preview.filter((row) => row.firstName && row.lastName);
    if (rows.length === 0) {
      showToast("Paste at least one valid student row.", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("students").insert(
      rows.map((row) => ({
        first_name: row.firstName,
        middle_name: row.middleName || "",
        last_name: row.lastName,
        admission_number: row.admissionNumber || null,
        class_id: selectedClass,
        is_active: true,
      }))
    );
    setLoading(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(`${rows.length} students imported.`, "success");
      setRawCsv("");
    }
  };

  return (
    <AdminShell
      title="Bulk Student Import"
      subtitle="Paste CSV rows as: first_name,middle_name,last_name,admission_number."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={panelStyle}>
          <label className="text-dim">Target class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ ...inputStyle, margin: "8px 0 16px" }}
          >
            <option value="">Select class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>
          <textarea
            value={rawCsv}
            onChange={(e) => setRawCsv(e.target.value)}
            rows={14}
            placeholder={"John,,Okafor,ADM-001\nAmina,Rose,Bello,ADM-002"}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          <button
            onClick={importStudents}
            disabled={loading}
            style={{ ...buttonStyle, background: "#38bdf8", marginTop: 14 }}
          >
            {loading ? "Importing..." : "Import Students"}
          </button>
        </div>
        <div style={panelStyle}>
          <h3 style={{ color: "#f8fafc", marginTop: 0 }}>Preview</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>First</th>
                <th>Middle</th>
                <th>Last</th>
                <th>Admission No.</th>
              </tr>
            </thead>
            <tbody>
              {preview.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ color: "#94a3b8", padding: 18 }}>
                    Paste rows to preview them here.
                  </td>
                </tr>
              ) : (
                preview.map((row, index) => (
                  <tr key={`${row.firstName}-${index}`}>
                    <td>{row.firstName}</td>
                    <td>{row.middleName}</td>
                    <td>{row.lastName}</td>
                    <td>{row.admissionNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

export function GradeApproval({ showToast }) {
  const [submissions, setSubmissions] = useState([]);
  const [lookups, setLookups] = useState({
    teachers: {},
    classes: {},
    subjects: {},
    scores: {},
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadScores = async () => {
    setLoading(true);
    setError("");

    const { data: submissionRows, error: submissionError } = await supabase
      .from("grade_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (submissionError) {
      setSubmissions([]);
      setLoading(false);
      setError(
        `Grade submissions are not configured. Run supabase_setup.sql in Supabase. ${submissionError.message}`
      );
      return;
    }

    const [teacherRes, classRes, subjectRes, scoreRes] = await Promise.all([
      supabase
        .from("teachers")
        .select("id, first_name, middle_name, last_name"),
      supabase.from("classes").select("id, class_name"),
      supabase.from("subjects").select("id, subject_name"),
      supabase
        .from("exam_scores")
        .select(
          "class_id, subject_id, term, academic_year, ca1_score, ca2_score, exam_score, total_score"
        ),
    ]);

    const teacherMap = Object.fromEntries(
      (teacherRes.data || []).map((teacher) => [String(teacher.id), teacher])
    );
    const classMap = Object.fromEntries(
      (classRes.data || []).map((cls) => [String(cls.id), cls])
    );
    const subjectMap = Object.fromEntries(
      (subjectRes.data || []).map((subject) => [String(subject.id), subject])
    );
    const scoreMap = {};
    for (const score of scoreRes.data || []) {
      const key = [
        score.class_id,
        score.subject_id,
        score.term,
        score.academic_year,
      ]
        .map(String)
        .join("|");
      if (!scoreMap[key]) scoreMap[key] = { count: 0, total: 0 };
      scoreMap[key].count += 1;
      scoreMap[key].total += getScoreTotal(score);
    }

    setLookups({
      teachers: teacherMap,
      classes: classMap,
      subjects: subjectMap,
      scores: scoreMap,
    });
    setSubmissions(submissionRows || []);
    setLoading(false);
  };

  useEffect(() => {
    loadScores();
  }, []);

  const getSubmissionKey = (submission) =>
    [
      submission.class_id,
      submission.subject_id,
      submission.term,
      submission.academic_year,
    ]
      .map(String)
      .join("|");

  const approveSubmission = async (submission) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: updateError } = await supabase
      .from("grade_submissions")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user?.id || null,
        rejection_reason: null,
      })
      .eq("id", submission.id);
    if (updateError) {
      showToast(updateError.message, "error");
    } else {
      showToast("Submission approved in Supabase.", "success");
      loadScores();
    }
  };

  return (
    <AdminShell
      title="Grade Approval"
      subtitle="Review recorded scores before publishing report cards."
    >
      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <EmptyState message="Loading scores..." />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Class</th>
              <th>Subject</th>
              <th>Term</th>
              <th>Scores</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ color: "#94a3b8", padding: 20 }}>
                  No grade submissions yet. Ask the teacher to submit the
                  gradebook again after the Supabase setup is complete.
                </td>
              </tr>
            ) : (
              submissions.map((submission) => {
                const teacher = lookups.teachers[String(submission.teacher_id)];
                const cls = lookups.classes[String(submission.class_id)];
                const subject = lookups.subjects[String(submission.subject_id)];
                const summary = lookups.scores[getSubmissionKey(submission)] || {
                  count: 0,
                  total: 0,
                };
                const average =
                  summary.count > 0 ? (summary.total / summary.count).toFixed(1) : "0.0";
                const isApproved = submission.status === "approved";
                return (
                  <tr key={submission.id}>
                    <td>{getFullName(teacher)}</td>
                    <td>{cls?.class_name || "-"}</td>
                    <td>{subject?.subject_name || "-"}</td>
                    <td>{submission.term}</td>
                    <td style={{ color: "#38bdf8", fontWeight: 700 }}>
                      {summary.count} score{summary.count === 1 ? "" : "s"} / {average}% avg
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => approveSubmission(submission)}
                        disabled={Boolean(isApproved)}
                        style={{
                          ...buttonStyle,
                          background: isApproved ? "#334155" : "#10b981",
                          color: isApproved ? "#94a3b8" : "#fff",
                          cursor: isApproved ? "default" : "pointer",
                        }}
                      >
                        {isApproved ? "Approved" : "Approve"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}

export function ReportCards() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const defaultTerms = useMemo(() => normalizeTermRows([]), []);
  const [terms, setTerms] = useState(defaultTerms);
  const [selectedTermKey, setSelectedTermKey] = useState(
    getPreferredTerm(defaultTerms)?.__key || ""
  );
  const [scores, setScores] = useState([]);
  const selectedTerm = useMemo(
    () =>
      terms.find((item) => item.__key === selectedTermKey) ||
      getPreferredTerm(terms),
    [terms, selectedTermKey]
  );
  const term = selectedTerm?.__label || "";
  const academicYear = selectedTerm?.__academicYear || "";

  useEffect(() => {
    const loadSetup = async () => {
      const [{ data: studentData }, { data: termData }] = await Promise.all([
        supabase
        .from("students")
        .select("id, first_name, middle_name, last_name, classes(class_name)")
        .eq("is_active", true)
          .order("last_name"),
        supabase.from("terms").select("*").order("id", { ascending: true }),
      ]);
      const normalizedTerms = normalizeTermRows(termData || []);
      setStudents(studentData || []);
      setTerms(normalizedTerms);
      setSelectedTermKey((current) =>
        normalizedTerms.some((item) => item.__key === current)
          ? current
          : getPreferredTerm(normalizedTerms)?.__key || ""
      );
    };
    loadSetup();
  }, []);

  useEffect(() => {
    const loadScores = async () => {
      if (!selectedStudent) {
        setScores([]);
        return;
      }
      const { data } = await supabase
        .from("exam_scores")
        .select("*, subjects(subject_name)")
        .eq("student_id", selectedStudent)
        .eq("term", term)
        .eq("academic_year", academicYear);
      setScores(data || []);
    };
    loadScores();
  }, [selectedStudent, term, academicYear]);

  const selected = students.find((student) => student.id === selectedStudent);
  const total = scores.reduce(
    (sum, score) =>
      sum +
      Number(
        score.total_score ??
          Number(score.ca1_score || 0) +
            Number(score.ca2_score || 0) +
            Number(score.exam_score || 0)
      ),
    0
  );
  const average = scores.length ? (total / scores.length).toFixed(1) : "0.0";

  const printReport = () => {
    window.print();
  };

  return (
    <AdminShell
      title="Report Cards"
      subtitle="Generate and print terminal report cards for students."
      actions={
        <button
          onClick={printReport}
          style={{ ...buttonStyle, background: "#a855f7", color: "#fff" }}
        >
          Print
        </button>
      }
    >
      <div style={{ ...panelStyle, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 14 }}>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {getFullName(student)} - {student.classes?.class_name || "No class"}
              </option>
            ))}
          </select>
          <select value={selectedTermKey} onChange={(e) => setSelectedTermKey(e.target.value)} style={inputStyle}>
            {terms.map((item) => (
              <option key={item.__key} value={item.__key}>
                {item.__label} ({item.__academicYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selected ? (
        <EmptyState message="Select a student to generate a report card." />
      ) : (
        <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, color: "#f8fafc" }}>{getFullName(selected)}</h3>
              <p style={{ margin: "6px 0 0", color: "#94a3b8" }}>
                {selected.classes?.class_name || "No class"} - {formatTermSession(term, academicYear)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#94a3b8" }}>Average</div>
              <div style={{ color: "#38bdf8", fontSize: 28, fontWeight: 800 }}>
                {average}%
              </div>
            </div>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>CA1</th>
                <th>CA2</th>
                <th>Exam</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ color: "#94a3b8", padding: 20 }}>
                    No scores recorded for this term.
                  </td>
                </tr>
              ) : (
                scores.map((score) => (
                  <tr key={score.id}>
                    <td>{score.subjects?.subject_name}</td>
                    <td>{score.ca1_score}</td>
                    <td>{score.ca2_score}</td>
                    <td>{score.exam_score}</td>
                    <td style={{ color: "#38bdf8", fontWeight: 700 }}>
                      {score.total_score ??
                        Number(score.ca1_score || 0) +
                          Number(score.ca2_score || 0) +
                          Number(score.exam_score || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

export function GradeScale({ showToast }) {
  const [rows, setRows] = useState([
    { grade: "A+", min_score: 80, max_score: 100, remark: "Distinction" },
    { grade: "A1", min_score: 70, max_score: 79, remark: "Excellent" },
    { grade: "B", min_score: 60, max_score: 69, remark: "Very Good" },
    { grade: "C", min_score: 50, max_score: 59, remark: "Credit" },
    { grade: "D", min_score: 40, max_score: 49, remark: "Pass" },
    { grade: "F", min_score: 0, max_score: 39, remark: "Fail" },
  ]);

  const updateRow = (index, key, value) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row
      )
    );
  };

  const saveScale = async () => {
    const { error } = await supabase.from("grade_scales").upsert(rows);
    if (error) {
      showToast(`Create grade_scales table to save: ${error.message}`, "error");
    } else {
      showToast("Grade scale saved.", "success");
    }
  };

  return (
    <AdminShell
      title="Grade Scale"
      subtitle="Configure the grading bands used on report cards."
      actions={
        <button onClick={saveScale} style={{ ...buttonStyle, background: "#38bdf8" }}>
          Save Scale
        </button>
      }
    >
      <table className="admin-table">
        <thead>
          <tr>
            <th>Grade</th>
            <th>Min</th>
            <th>Max</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.grade}>
              <td>
                <input
                  value={row.grade}
                  onChange={(e) => updateRow(index, "grade", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.min_score}
                  onChange={(e) => updateRow(index, "min_score", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={row.max_score}
                  onChange={(e) => updateRow(index, "max_score", e.target.value)}
                  style={inputStyle}
                />
              </td>
              <td>
                <input
                  value={row.remark}
                  onChange={(e) => updateRow(index, "remark", e.target.value)}
                  style={inputStyle}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}

export function TermSetup({ showToast }) {
  const [terms, setTerms] = useState([]);
  const [form, setForm] = useState({
    term_name: "First Term",
    academic_year: getUpcomingFirstTermAcademicYear(),
    is_active: true,
  });
  const [error, setError] = useState("");

  const loadTerms = async () => {
    const { data, error: fetchError } = await supabase
      .from("terms")
      .select("*")
      .order("id", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else {
      const rows = data || [];
      setTerms(rows);
      const latestTerm = rows[rows.length - 1];
      if (latestTerm) {
        const nextTerm = getNextTermAfter(latestTerm);
        setForm((current) => ({
          ...current,
          term_name: nextTerm.term_name,
          academic_year: nextTerm.academic_year,
        }));
      }
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const addTerm = async () => {
    const { error: insertError } = await supabase.from("terms").insert([form]);
    if (insertError) showToast(insertError.message, "error");
    else {
      showToast("Term added.", "success");
      loadTerms();
    }
  };

  const setActiveTerm = async (term) => {
    await supabase.from("terms").update({ is_active: false }).neq("id", term.id);
    const { error: updateError } = await supabase
      .from("terms")
      .update({ is_active: true })
      .eq("id", term.id);
    if (updateError) showToast(updateError.message, "error");
    else {
      showToast(`${term.term_name || term.name} is now active.`, "success");
      loadTerms();
    }
  };

  return (
    <AdminShell title="Term Setup" subtitle="Manage academic terms and active sessions.">
      {error && <ErrorState message={`Terms table issue: ${error}`} />}
      <div style={{ ...panelStyle, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12 }}>
          <select
            value={form.term_name}
            onChange={(e) => setForm({ ...form, term_name: e.target.value })}
            style={inputStyle}
          >
            {TERM_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={form.academic_year}
            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            style={inputStyle}
          >
            {getAcademicYearOptions().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button onClick={addTerm} style={{ ...buttonStyle, background: "#38bdf8" }}>
            Add Term
          </button>
        </div>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Term</th>
            <th>Academic Year</th>
            <th>Status</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {terms.map((term) => (
            <tr key={term.id}>
              <td>{term.term_name || term.name || term.title}</td>
              <td>{term.academic_year || "-"}</td>
              <td style={{ color: term.is_active ? "#10b981" : "#94a3b8" }}>
                {term.is_active ? "Active" : "Inactive"}
              </td>
              <td className="text-right">
                <button
                  onClick={() => setActiveTerm(term)}
                  style={{ ...buttonStyle, background: "#334155", color: "#f8fafc" }}
                >
                  Make Active
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminShell>
  );
}

export function FeeManagement({ showToast }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const defaultFeeTerms = useMemo(() => normalizeTermRows([]), []);
  const defaultFeeTermValue = formatTermSession(
    getPreferredTerm(defaultFeeTerms)?.__label,
    getPreferredTerm(defaultFeeTerms)?.__academicYear
  );
  const [termOptions, setTermOptions] = useState(defaultFeeTerms);
  const [term, setTerm] = useState(defaultFeeTermValue);
  const [fees, setFees] = useState([]);

  const loadStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("id, first_name, middle_name, last_name, classes(class_name, base_fee)")
      .eq("is_active", true)
      .order("last_name");
    setStudents(data || []);
  };

  const loadFees = async () => {
    const { data } = await supabase
      .from("fees")
      .select("*, students(first_name,middle_name,last_name, classes(class_name, base_fee))")
      .order("payment_date", { ascending: false });
    setFees(data || []);
  };

  const loadTerms = async () => {
    const { data } = await supabase.from("terms").select("*").order("id", { ascending: true });
    const normalizedTerms = normalizeTermRows(data || []);
    setTermOptions(normalizedTerms);
    setTerm((current) => {
      const preferred = getPreferredTerm(normalizedTerms);
      if (current && current !== defaultFeeTermValue) return current;
      return formatTermSession(preferred?.__label, preferred?.__academicYear);
    });
  };

  useEffect(() => {
    loadStudents();
    loadFees();
    loadTerms();
  }, []);

  const selected = students.find((student) => student.id === selectedStudent);

  const recordPayment = async () => {
    if (!selectedStudent || !amount) {
      showToast("Select a student and enter an amount.", "error");
      return;
    }
    const { error } = await supabase.from("fees").insert([
      {
        student_id: selectedStudent,
        amount_paid: Number(amount),
        payment_method: method,
        term,
        total_tuition: selected?.classes?.base_fee || 0,
      },
    ]);
    if (error) showToast(error.message, "error");
    else {
      showToast("Payment recorded.", "success");
      setAmount("");
      loadFees();
    }
  };

  const totalRevenue = fees.reduce((sum, fee) => sum + Number(fee.amount_paid || 0), 0);

  return (
    <AdminShell title="Fee Management" subtitle="Record payments and monitor revenue.">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>Recent Payments</h3>
          <div style={{ color: "#10b981", fontSize: 28, fontWeight: 800, marginBottom: 14 }}>
            {toCurrency(totalRevenue)}
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Term</th>
                <th>Method</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id}>
                  <td>{getFullName(fee.students)}</td>
                  <td>{fee.students?.classes?.class_name || "-"}</td>
                  <td>{fee.term}</td>
                  <td>{fee.payment_method}</td>
                  <td className="text-right" style={{ color: "#10b981", fontWeight: 700 }}>
                    {toCurrency(fee.amount_paid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>Record Payment</h3>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            style={{ ...inputStyle, marginBottom: 10 }}
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {getFullName(student)}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount paid"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{ ...inputStyle, marginBottom: 10 }}
          >
            <option>Cash</option>
            <option>Bank Transfer</option>
            <option>POS</option>
            <option>Cheque</option>
          </select>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            style={{ ...inputStyle, marginBottom: 14 }}
          >
            {termOptions.map((item) => (
              <option key={item.__key} value={formatTermSession(item.__label, item.__academicYear)}>
                {formatTermSession(item.__label, item.__academicYear)}
              </option>
            ))}
          </select>
          <button
            onClick={recordPayment}
            style={{ ...buttonStyle, width: "100%", background: "#10b981", color: "#fff" }}
          >
            Save Payment
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

export function ExportReports({ showToast }) {
  const exportStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("first_name,middle_name,last_name,admission_number,classes(class_name)")
      .order("last_name");
    if (error) {
      showToast(error.message, "error");
      return;
    }
    downloadCsv("students.csv", [
      ["First Name", "Middle Name", "Last Name", "Admission No.", "Class"],
      ...(data || []).map((student) => [
        student.first_name,
        student.middle_name,
        student.last_name,
        student.admission_number,
        student.classes?.class_name,
      ]),
    ]);
  };

  const exportPayments = async () => {
    const { data, error } = await supabase
      .from("fees")
      .select("payment_date,term,payment_method,amount_paid,students(first_name,last_name)");
    if (error) {
      showToast(error.message, "error");
      return;
    }
    downloadCsv("payments.csv", [
      ["Date", "Student", "Term", "Method", "Amount"],
      ...(data || []).map((fee) => [
        fee.payment_date,
        getFullName(fee.students),
        fee.term,
        fee.payment_method,
        fee.amount_paid,
      ]),
    ]);
  };

  return (
    <AdminShell title="Export Reports" subtitle="Download operational reports as CSV.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>Student Register</h3>
          <p style={{ color: "#94a3b8" }}>Names, admission numbers, and classes.</p>
          <button onClick={exportStudents} style={{ ...buttonStyle, background: "#38bdf8" }}>
            Download CSV
          </button>
        </div>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>Payment Report</h3>
          <p style={{ color: "#94a3b8" }}>Fee payments by date, term, method, and amount.</p>
          <button
            onClick={exportPayments}
            style={{ ...buttonStyle, background: "#10b981", color: "#fff" }}
          >
            Download CSV
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

export function Announcements({ showToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const [source, setSource] = useState("database");
  const [fallbackNote, setFallbackNote] = useState("");

  const loadAnnouncements = async () => {
    const result = await loadAnnouncementFeed([
      "all",
      "teachers",
      "students",
      "parents",
    ]);
    setAnnouncements(result.data || []);
    setSource(result.source);
    setFallbackNote(result.error?.message || "");
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const publish = async () => {
    if (!form.title || !form.body) {
      showToast("Title and message are required.", "error");
      return;
    }
    const result = await publishAnnouncement(form);
    if (result.error) {
      showToast(
        "Announcements table is missing. Run supabase_setup.sql in Supabase.",
        "error"
      );
      setSource("unconfigured");
      setFallbackNote(result.error.message);
      return;
    }
    showToast("Announcement published.", "success");
    setForm({ title: "", body: "", audience: "all" });
    loadAnnouncements();
  };

  return (
    <AdminShell title="Announcements" subtitle="Publish school-wide updates.">
      {source === "unconfigured" && (
        <div
          style={{
            ...panelStyle,
            marginBottom: 16,
            borderColor: "rgba(245, 158, 11, 0.45)",
            color: "#fbbf24",
          }}
        >
          Supabase announcements are not configured yet. Run
          <strong> supabase_setup.sql </strong>
          in the Supabase SQL Editor. {fallbackNote}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
        <div style={panelStyle}>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <select
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value })}
            style={{ ...inputStyle, marginBottom: 10 }}
          >
            <option value="all">All users</option>
            <option value="teachers">Teachers</option>
            <option value="students">Students</option>
            <option value="parents">Parents</option>
          </select>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Message"
            rows={8}
            style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }}
          />
          <button
            onClick={publish}
            style={{ ...buttonStyle, width: "100%", background: "#38bdf8" }}
          >
            Publish
          </button>
        </div>
        <div style={panelStyle}>
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>Published</h3>
          {announcements.length === 0 ? (
            <p style={{ color: "#94a3b8" }}>No announcements yet.</p>
          ) : (
            announcements.map((item) => (
              <div
                key={item.id}
                style={{ borderBottom: "1px solid #334155", padding: "12px 0" }}
              >
                <strong style={{ color: "#f8fafc" }}>{item.title}</strong>
                <p style={{ color: "#94a3b8", margin: "6px 0" }}>{item.body}</p>
                <span style={{ color: "#38bdf8", fontSize: 12 }}>
                  {item.audience || "all"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}

export function UserManagement({ showToast }) {
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState({});
  const [error, setError] = useState("");

  const loadUsers = async () => {
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, first_name, middle_name, last_name, email, role, school_id")
      .order("email");
    if (fetchError) setError(fetchError.message);
    else {
      setProfiles(data || []);
      setRoles(
        Object.fromEntries((data || []).map((profile) => [profile.id, profile.role || ""]))
      );
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const saveRole = async (profile) => {
    const role = roles[profile.id];
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", profile.id);
    if (updateError) showToast(updateError.message, "error");
    else {
      await supabase.from("user_roles").upsert(
        [{ user_id: profile.id, role }],
        { onConflict: "user_id,role" }
      );
      showToast("User role updated.", "success");
      loadUsers();
    }
  };

  return (
    <AdminShell title="User Management" subtitle="Review portal accounts and assign roles.">
      {error ? (
        <ErrorState message={error} />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>School ID</th>
              <th>Role</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{getFullName(profile)}</td>
                <td>{profile.email}</td>
                <td>{profile.school_id}</td>
                <td>
                  <select
                    value={roles[profile.id] || ""}
                    onChange={(e) =>
                      setRoles({ ...roles, [profile.id]: e.target.value })
                    }
                    style={inputStyle}
                  >
                    <option value="">Unassigned</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => saveRole(profile)}
                    style={{ ...buttonStyle, background: "#38bdf8" }}
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminShell>
  );
}

export function AuditLog() {
  const [profiles, setProfiles] = useState([]);
  const [fees, setFees] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [profileRes, feeRes, scoreRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, role, school_id")
          .order("school_id", { ascending: false })
          .limit(10),
        supabase
          .from("fees")
          .select("id, amount_paid, payment_date, students(first_name,last_name)")
          .order("payment_date", { ascending: false })
          .limit(10),
        supabase
          .from("exam_scores")
          .select("id, term, total_score, students(first_name,last_name)")
          .limit(10),
      ]);
      setProfiles(profileRes.data || []);
      setFees(feeRes.data || []);
      setScores(scoreRes.data || []);
    };
    load();
  }, []);

  const events = useMemo(
    () => [
      ...profiles.map((profile) => ({
        type: "User",
        detail: `${profile.email || profile.school_id} has role ${profile.role || "unassigned"}`,
      })),
      ...fees.map((fee) => ({
        type: "Finance",
        detail: `${getFullName(fee.students)} paid ${toCurrency(fee.amount_paid)}`,
      })),
      ...scores.map((score) => ({
        type: "Academics",
        detail: `${getFullName(score.students)} score saved for ${score.term}`,
      })),
    ],
    [profiles, fees, scores]
  );

  return (
    <AdminShell
      title="Audit Log"
      subtitle="Operational activity summary from users, payments, and score records."
    >
      <div style={panelStyle}>
        {events.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No activity available yet.</p>
        ) : (
          events.map((event, index) => (
            <div
              key={`${event.type}-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid #334155",
              }}
            >
              <span style={{ color: "#38bdf8", fontWeight: 700 }}>{event.type}</span>
              <span style={{ color: "#e2e8f0" }}>{event.detail}</span>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
