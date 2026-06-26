import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Loader2, LogOut, Moon, Palette, Shield, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { useAuth } from "@/hooks/use-auth";
import { fetchProfile, updateProfile } from "@/lib/profile";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Trackr" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  const { data: profile } = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: () => fetchProfile(user!.id),
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const toggleEmails = useMutation({
    mutationFn: (value: boolean) => updateProfile(user!.id, { email_notifications: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user!.id] });
      toast.success("Preferences updated");
    },
  });

  const changePass = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalize your Trackr experience.</p>
      </header>

      <Card className="glass shadow-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="text-primary h-5 w-5" />
          <h3 className="font-display font-semibold">Appearance</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={[
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm capitalize transition",
                theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
              ].join(" ")}
            >
              {t === "light" ? <Sun className="h-5 w-5" /> : t === "dark" ? <Moon className="h-5 w-5" /> : <Palette className="h-5 w-5" />}
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card className="glass shadow-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="text-primary h-5 w-5" />
          <h3 className="font-display font-semibold">Notifications</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-muted-foreground text-xs">Reminders about upcoming interviews and deadlines.</p>
          </div>
          <Switch
            checked={profile?.email_notifications ?? true}
            onCheckedChange={(v) => toggleEmails.mutate(v)}
          />
        </div>
      </Card>

      <Card className="glass shadow-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="text-primary h-5 w-5" />
          <h3 className="font-display font-semibold">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => changePass.mutate()}
              disabled={changePass.isPending || !newPassword}
              className="gradient-brand text-primary-foreground"
            >
              {changePass.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </div>
        </div>
      </Card>

      <Card className="glass shadow-card p-6">
        <h3 className="font-display mb-4 font-semibold">Account</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{user?.email}</p>
            <p className="text-muted-foreground text-xs">Signed in</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
