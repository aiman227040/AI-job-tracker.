import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { fetchInterviews, createInterview, deleteInterview } from "@/lib/interviews";
import { fetchJobs } from "@/lib/jobs";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Trackr" }] }),
  component: CalendarPage,
});

function CalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: interviews, isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: fetchInterviews,
  });
  const { data: jobs } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });

  const del = useMutation({
    mutationFn: deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Interview removed");
    },
  });

  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) days.push(d);

  const byDay = new Map<string, typeof interviews>();
  (interviews ?? []).forEach((i) => {
    const k = format(parseISO(i.scheduled_at), "yyyy-MM-dd");
    const arr = byDay.get(k) ?? [];
    arr.push(i);
    byDay.set(k, arr as typeof interviews);
  });

  const upcoming = (interviews ?? [])
    .filter((i) => parseISO(i.scheduled_at) >= new Date(Date.now() - 86400000))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule and track your upcoming interviews.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand shadow-glow text-primary-foreground">
              <CalendarPlus className="mr-2 h-4 w-4" /> Add interview
            </Button>
          </DialogTrigger>
          <InterviewDialog
            jobs={jobs ?? []}
            userId={user!.id}
            onDone={() => setOpen(false)}
          />
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass shadow-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold">{format(month, "MMMM yyyy")}</h3>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMonth(new Date())}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1 font-medium">{d}</div>
            ))}
          </div>
          {isLoading ? (
            <Skeleton className="mt-2 h-72 w-full rounded-xl" />
          ) : (
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((day) => {
                const k = format(day, "yyyy-MM-dd");
                const events = byDay.get(k) ?? [];
                const inMonth = isSameMonth(day, month);
                const today = isSameDay(day, new Date());
                return (
                  <motion.div
                    key={k}
                    whileHover={{ scale: 1.02 }}
                    className={[
                      "min-h-16 rounded-lg border p-1.5 text-left text-xs transition",
                      inMonth ? "bg-card/60" : "bg-muted/20 text-muted-foreground/60",
                      today ? "ring-2 ring-primary" : "border-border",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className={today ? "font-bold text-primary" : ""}>{format(day, "d")}</span>
                      {events.length > 0 && (
                        <span className="gradient-brand rounded-full px-1.5 text-[10px] text-primary-foreground">
                          {events.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {events.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className="bg-primary/15 text-primary truncate rounded px-1 py-0.5 text-[10px]"
                          title={e.job?.company ?? "Interview"}
                        >
                          {format(parseISO(e.scheduled_at), "HH:mm")} {e.job?.company}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="font-display mb-4 font-semibold">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No upcoming interviews. Add one to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((i) => (
                <li key={i.id} className="bg-muted/40 group flex items-start justify-between gap-2 rounded-xl p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.job?.company ?? "—"}</p>
                    <p className="text-muted-foreground truncate text-xs">{i.job?.role}</p>
                    <p className="mt-1 text-xs text-primary">
                      {format(parseISO(i.scheduled_at), "MMM d · HH:mm")}
                    </p>
                  </div>
                  <button
                    onClick={() => del.mutate(i.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function InterviewDialog({
  jobs, userId, onDone,
}: { jobs: { id: string; company: string; role: string }[]; userId: string; onDone: () => void }) {
  const [jobId, setJobId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      if (!jobId || !date) throw new Error("Pick a job and date");
      const scheduled_at = new Date(`${date}T${time}:00`).toISOString();
      return createInterview({ job_id: jobId, scheduled_at, notes: notes || null }, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Interview scheduled");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Schedule interview</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Job</Label>
          <Select value={jobId} onValueChange={setJobId}>
            <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
            <SelectContent>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.company} — {j.role}</SelectItem>
              ))}
              {jobs.length === 0 && (
                <div className="text-muted-foreground p-2 text-xs">Add a job first.</div>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Time</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Round, interviewers, prep…" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending} className="gradient-brand text-primary-foreground">
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Schedule
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
