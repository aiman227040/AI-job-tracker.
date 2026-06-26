import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  skills: string[];
  resume_url: string | null;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: ins, error: insErr } = await supabase
      .from("profiles")
      .insert({ id: userId })
      .select()
      .single();
    if (insErr) throw insErr;
    return ins as Profile;
  }
  return data as Profile;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function uploadResume(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${userId}/resume-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("resumes")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function signedUrl(bucket: "avatars" | "resumes", path: string, expires = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expires);
  if (error) throw error;
  return data.signedUrl;
}
