import { supabase } from "../supabaseClient";
import { safeQuery } from "../utils/safeQuery";

export const loadAnnouncementFeed = async (audiences = ["all"]) => {
  const { data } = await safeQuery(() => supabase
    .from("announcements")
    .select("*")
    .in("audience", audiences)
    .order("created_at", { ascending: false }));

  if (data) {
    return { data: data || [], source: "database", error: null };
  }

  return {
    data: [],
    source: "unconfigured",
    error: null,
  };
};

export const publishAnnouncement = async ({ title, body, audience }) => {
  const record = {
    title: title.trim(),
    body: body.trim(),
    audience: audience || "all",
  };

  const { data } = await safeQuery(() => supabase
    .from("announcements")
    .insert([record])
    .select()
    .single());

  return { data: data || null, source: data ? "database" : "unconfigured", error: null };
};
