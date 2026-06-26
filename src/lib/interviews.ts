import { supabase } from "@/integrations/supabase/client";

export type Interview = {
  id: string;
  user_id: string;
  job_id: string;
  scheduled_at: string;
  notes: string | null;
  created_at: string;
};

export type InterviewWithJob = Interview & {
  job: { id: string; company: string; role: string } | null;
};

export async function fetchInterviews(): Promise<InterviewWithJob[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*, job:jobs(id, company, role)")
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as InterviewWithJob[];
}

export async function createInterview(input: {
  job_id: string;
  scheduled_at: string;
  notes?: string | null;
}, userId: string) {
  const { data, error } = await supabase
    .from("interviews")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Interview;
}

export async function deleteInterview(id: string) {
  const { error } = await supabase.from("interviews").delete().eq("id", id);
  if (error) throw error;
}
