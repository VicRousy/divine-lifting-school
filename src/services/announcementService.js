import { supabase } from "../supabaseClient";

export const loadAnnouncementFeed = async (audiences = ["all"]) => {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .in("audience", audiences)
    .order("created_at", { ascending: false });

  if (!error) {
    return { data: data || [], source: "database", error: null };
  }

  return {
    data: [],
    source: "unconfigured",
    error,
  };
};

export const publishAnnouncement = async ({ title, body, audience }) => {
  const record = {
    title: title.trim(),
    body: body.trim(),
    audience: audience || "all",
  };

  const { data, error } = await supabase
    .from("announcements")
    .insert([record])
    .select()
    .single();

  return { data: data || null, source: error ? "unconfigured" : "database", error };
};
