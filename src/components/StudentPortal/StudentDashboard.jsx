import React from "react";

export default function StudentDashboard({ user, studentId, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div
        style={{
          width: 260,
          background: "#1e293b",
          borderRight: "1px solid #334155",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "0 20px 20px",
            borderBottom: "1px solid #334155",
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, color: "#22c55e", fontSize: "1.2rem" }}>
            Student Portal
          </h2>
          <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "0.8rem" }}>
            Divine Lifting School
          </p>
        </div>

        <div style={{ flex: 1, padding: "0 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: "0.8rem", marginBottom: 10, color: "#64748b" }}>
            ACCOUNT
          </div>
          <div style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>
            <div>
              <span style={{ color: "#e2e8f0" }}>Email:</span>{" "}
              {user?.email ?? "—"}
            </div>
            <div>
              <span style={{ color: "#e2e8f0" }}>Student ID:</span>{" "}
              {studentId ?? "Not linked yet"}
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(34, 197, 94, 0.25)",
              background: "rgba(34, 197, 94, 0.06)",
              color: "#bbf7d0",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            This portal is ready for the next step: showing your timetable, scores,
            attendance, and profile — limited to you only.
          </div>
        </div>

        <div style={{ padding: 20, borderTop: "1px solid #334155" }}>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              padding: "10px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: 28, color: "#e2e8f0" }}>
        <h1 style={{ marginTop: 0, fontSize: "1.4rem" }}>Welcome</h1>
        <p style={{ color: "#94a3b8", maxWidth: 720, lineHeight: 1.7 }}>
          Once we wire the student role to the `students` table, you’ll only see
          your own attendance, scores, subjects, and announcements here.
        </p>
      </div>
    </div>
  );
}

