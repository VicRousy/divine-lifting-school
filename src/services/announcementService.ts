import { supabase } from '../supabaseClient';
import { safeQuery } from '../utils/safeQuery';

interface Announcement {
  id?: number;
  title: string;
  body: string;
  audience: string;
  created_at?: string;
}

interface LoadResult {
  data: Announcement[];
  source: string;
  error: string | null;
}

interface PublishResult {
  data: Announcement | null;
  source: string;
  error: string | null;
}

export const loadAnnouncementFeed = async (audiences: string[] = ['all']): Promise<LoadResult> => {
  const { data } = await safeQuery(() => supabase
    .from('announcements')
    .select('id, title, body, audience, created_at')
    .in('audience', audiences)
    .order('created_at', { ascending: false }));

  if (data) {
    return { data: data || [], source: 'database', error: null };
  }

  return {
    data: [],
    source: 'unconfigured',
    error: null,
  };
};

export const publishAnnouncement = async ({ title, body, audience }: { title: string; body: string; audience?: string }): Promise<PublishResult> => {
  const record = {
    title: title.trim(),
    body: body.trim(),
    audience: audience || 'all',
  };

  const { data } = await safeQuery(() => supabase
    .from('announcements')
    .insert([record])
    .select()
    .single());

  return { data: data || null, source: data ? 'database' : 'unconfigured', error: null };
};
