import { supabase } from "@/integrations/supabase/client";

export type JobStatus = "applied" | "interview" | "offer" | "rejected";

export type Job = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  salary: string | null;
  location: string | null;
  application_date: string | null;
  deadline: string | null;
  status: JobStatus;
  notes: string | null;
  job_link: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type JobInput = {
  company: string;
  role: string;
  salary?: string | null;
  location?: string | null;
  application_date?: string | null;
  deadline?: string | null;
  status: JobStatus;
  notes?: string | null;
  job_link?: string | null;
};

export const STATUS_META: Record<JobStatus, { label: string; color: string; dot: string }> = {
  applied: { label: "Applied", color: "bg-info/15 text-info border-info/20", dot: "bg-info" },
  interview: { label: "Interview", color: "bg-warning/15 text-warning border-warning/20", dot: "bg-warning" },
  offer: { label: "Offer", color: "bg-success/15 text-success border-success/20", dot: "bg-success" },
  rejected: { label: "Rejected", color: "bg-destructive/15 text-destructive border-destructive/20", dot: "bg-destructive" },
};

export const STATUS_ORDER: JobStatus[] = ["applied", "interview", "offer", "rejected"];

export async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function createJob(input: JobInput, userId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as Job;
}

export async function updateJob(id: string, input: Partial<JobInput>) {
  const { data, error } = await supabase.from("jobs").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Job;
}

export async function updateJobStatus(id: string, status: JobStatus) {
  const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}
