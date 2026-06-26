import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Loader2, Plus, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import {
  fetchProfile, updateProfile, uploadAvatar, uploadResume, signedUrl,
} from "@/lib/profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Trackr" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const avatarInput = useRef<HTMLInputElement>(null);
  const resumeInput = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: () => fetchProfile(user!.id),
  });

  const [form, setForm] = useState({
    full_name: "", headline: "", location: "", website: "", bio: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      headline: profile.headline ?? "",
      location: profile.location ?? "",
      website: profile.website ?? "",
      bio: profile.bio ?? "",
    });
    setSkills(profile.skills ?? []);
    if (profile.avatar_url) {
      signedUrl("avatars", profile.avatar_url).then(setAvatarPreview).catch(() => {});
    }
    if (profile.resume_url) {
      signedUrl("resumes", profile.resume_url).then(setResumeUrl).catch(() => {});
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateProfile(user!.id, { ...form, skills }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatarMut = useMutation({
    mutationFn: async (file: File) => {
      const path = await uploadAvatar(user!.id, file);
      await updateProfile(user!.id, { avatar_url: path });
      return path;
    },
    onSuccess: async (path) => {
      queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      const url = await signedUrl("avatars", path);
      setAvatarPreview(url);
      toast.success("Avatar updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadResumeMut = useMutation({
    mutationFn: async (file: File) => {
      const path = await uploadResume(user!.id, file);
      await updateProfile(user!.id, { resume_url: path });
      return path;
    },
    onSuccess: async (path) => {
      queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      const url = await signedUrl("resumes", path);
      setResumeUrl(url);
      toast.success("Resume uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills([...skills, s]);
    setSkillInput("");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6 md:p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const initial = form.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Make yourself look as good on paper as you are in person.
        </p>
      </header>

      <Card className="glass shadow-card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="relative">
            <Avatar className="ring-primary/40 h-24 w-24 ring-2">
              {avatarPreview && <AvatarImage src={avatarPreview} alt="" />}
              <AvatarFallback className="gradient-brand text-2xl text-primary-foreground">
                {initial}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInput.current?.click()}
              className="bg-primary text-primary-foreground absolute -bottom-1 -right-1 rounded-full p-2 shadow-md transition hover:opacity-90"
            >
              {uploadAvatarMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatarMut.mutate(f);
              }}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-display text-xl font-semibold">{form.full_name || "Add your name"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {form.headline && <p className="text-primary mt-1 text-sm">{form.headline}</p>}
          </div>
        </div>
      </Card>

      <Card className="glass shadow-card space-y-4 p-6">
        <h3 className="font-display font-semibold">Personal details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Headline">
            <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Senior Frontend Engineer" />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Berlin, DE" />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
          </Field>
        </div>
        <Field label="Bio">
          <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short summary recruiters will love." />
        </Field>
      </Card>

      <Card className="glass shadow-card space-y-4 p-6">
        <h3 className="font-display font-semibold">Skills</h3>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="Add a skill and press Enter"
          />
          <Button type="button" onClick={addSkill} variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 && <p className="text-muted-foreground text-xs">No skills yet.</p>}
          {skills.map((s) => (
            <Badge key={s} variant="secondary" className="pl-3 pr-1.5 py-1">
              {s}
              <button
                onClick={() => setSkills(skills.filter((x) => x !== s))}
                className="hover:bg-muted ml-1.5 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="glass shadow-card space-y-4 p-6">
        <h3 className="font-display font-semibold">Resume</h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/15 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{profile?.resume_url ? "Resume on file" : "No resume yet"}</p>
              {resumeUrl && (
                <a href={resumeUrl} target="_blank" rel="noreferrer" className="text-primary text-xs hover:underline">
                  View current
                </a>
              )}
            </div>
          </div>
          <Button variant="secondary" onClick={() => resumeInput.current?.click()} disabled={uploadResumeMut.isPending}>
            {uploadResumeMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
          <input
            ref={resumeInput}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadResumeMut.mutate(f);
            }}
          />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="gradient-brand shadow-glow text-primary-foreground"
        >
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
