import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { loadAnnouncementFeed } from "../../services/announcementService";

const shellStyle = {
  minHeight: "100vh",
  background: "#0f172a",
  padding: 30,
};

const panelStyle = {
  background: "rgba(30, 41, 59, 0.55)",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 20,
};

const mutedText = {
  color: "#94a3b8",
  margin: 0,
};

function TeacherPageShell({ title, subtitle, children }) {
  return (
    <div style={shellStyle}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: "#f8fafc", margin: "0 0 6px" }}>{title}</h2>
        <p style={mutedText}>{subtitle}</p>
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

export function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("database");
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    const loadAnnouncements = async () => {
      setLoading(true);
      const result = await loadAnnouncementFeed(["all", "teachers"]);
      setAnnouncements(result.data || []);
      setSource(result.source);
      setSetupError(result.error?.message || "");
      setLoading(false);
    };

    loadAnnouncements();
  }, []);

  return (
    <TeacherPageShell
      title="Announcements"
      subtitle="School updates published by the administrator."
    >
      {loading ? (
        <EmptyState message="Loading announcements..." />
      ) : source === "unconfigured" ? (
        <EmptyState
          message={`Supabase announcements are not configured yet. Run supabase_setup.sql. ${setupError}`}
        />
      ) : announcements.length === 0 ? (
        <EmptyState message="No announcements yet." />
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {announcements.map((item) => (
            <article key={item.id} style={panelStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  marginBottom: 8,
                }}
              >
                <h3 style={{ color: "#f8fafc", margin: 0 }}>{item.title}</h3>
                <span style={{ color: "#38bdf8", fontSize: 12, fontWeight: 700 }}>
                  {(item.audience || "all").toUpperCase()}
                </span>
              </div>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: "8px 0 0" }}>
                {item.body}
              </p>
              {item.created_at && (
                <p style={{ color: "#64748b", fontSize: 12, margin: "12px 0 0" }}>
                  {new Date(item.created_at).toLocaleString("en-NG")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </TeacherPageShell>
  );
}

export function TeacherNotifications({ teacherId, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [assignmentRes, announcementRes] = await Promise.all([
        teacherId
          ? supabase
              .from("teacher_assignments")
              .select("id, classes(class_name), subjects(subject_name)")
              .eq("teacher_id", teacherId)
          : Promise.resolve({ data: [] }),
        loadAnnouncementFeed(["all", "teachers"]),
      ]);

      if (assignmentRes.error) {
        showToast?.("Could not load assignment notifications.", "error");
      }
      setAssignments(assignmentRes.data || []);
      setAnnouncements((announcementRes.data || []).slice(0, 5));
      setLoading(false);
    };

    load();
  }, [teacherId, showToast]);

  const notifications = useMemo(() => {
    const assignmentItems = assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      label: "Assignment",
      title: `${assignment.classes?.class_name || "Class"} - ${
        assignment.subjects?.subject_name || "Subject"
      }`,
      body: "You are assigned to this class and subject.",
      color: "#38bdf8",
    }));

    const announcementItems = announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      label: "Announcement",
      title: announcement.title,
      body: announcement.body,
      color: "#a855f7",
    }));

    return [...assignmentItems, ...announcementItems];
  }, [assignments, announcements]);

  return (
    <TeacherPageShell
      title="Notifications"
      subtitle="Your current assignments and recent school updates."
    >
      {loading ? (
        <EmptyState message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState message="No notifications yet." />
      ) : (
        <div style={panelStyle}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 16,
                padding: "14px 0",
                borderBottom: "1px solid #334155",
              }}
            >
              <span style={{ color: notification.color, fontWeight: 800 }}>
                {notification.label}
              </span>
              <div>
                <strong style={{ color: "#f8fafc" }}>{notification.title}</strong>
                <p style={{ color: "#94a3b8", margin: "4px 0 0", lineHeight: 1.5 }}>
                  {notification.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherPageShell>
  );
}

export default TeacherAnnouncements;
