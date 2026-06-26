import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  Briefcase,
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

import {
  createJob,
  deleteJob,
  fetchJobs,
  STATUS_META,
  STATUS_ORDER,
  updateJob,
  type Job,
  type JobInput,
  type JobStatus,
} from "@/lib/jobs";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JobForm } from "@/components/job-form";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Trackr" }] }),
  component: JobsPage,
});

type SortKey = "created" | "company" | "deadline";

function JobsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: jobs, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<JobStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("created");
  const [editing, setEditing] = useState<Job | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Job | null>(null);

  const create = useMutation({
    mutationFn: (input: JobInput) => createJob(input, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job added");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: JobInput }) => updateJob(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job updated");
      setOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job removed");
      setConfirmDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    let list = jobs ?? [];
    if (filter !== "all") list = list.filter((j) => j.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q) ||
          (j.location?.toLowerCase() ?? "").includes(q),
      );
    }
    const sorted = [...list];
    if (sort === "company") sorted.sort((a, b) => a.company.localeCompare(b.company));
    else if (sort === "deadline")
      sorted.sort((a, b) => (a.deadline ?? "9999") .localeCompare(b.deadline ?? "9999"));
    return sorted;
  }, [jobs, search, filter, sort]);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (j: Job) => {
    setEditing(j);
    setOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">All your applications in one place.</p>
        </div>
        <Button onClick={openNew} className="gradient-brand shadow-glow text-primary-foreground">
          <Plus className="mr-1 h-4 w-4" /> Add job
        </Button>
      </header>

      <Card className="glass shadow-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, location…"
              className="pl-9"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as JobStatus | "all")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Newest first</SelectItem>
              <SelectItem value="company">Company A→Z</SelectItem>
              <SelectItem value="deadline">Deadline soonest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={openNew} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <JobCard
                  job={job}
                  onEdit={() => openEdit(job)}
                  onDelete={() => setConfirmDelete(job)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="glass-strong sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing ? "Edit job" : "Add a new job"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "Update details for this application." : "Track a new application."}
            </DialogDescription>
          </DialogHeader>
          <JobForm
            initial={editing}
            submitting={create.isPending || update.isPending}
            onCancel={() => { setOpen(false); setEditing(null); }}
            onSubmit={(values) =>
              editing
                ? update.mutate({ id: editing.id, input: values })
                : create.mutate(values)
            }
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && `${confirmDelete.company} · ${confirmDelete.role}`} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function JobCard({
  job,
  onEdit,
  onDelete,
}: {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = STATUS_META[job.status];
  return (
    <Card className="glass shadow-card group hover:shadow-elevated relative flex h-full flex-col p-5 transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display truncate text-lg font-semibold">{job.company}</h3>
          <p className="text-muted-foreground truncate text-sm">{job.role}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Badge variant="outline" className={`${meta.color} mt-3 w-fit`}>
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </Badge>
      <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        {job.location && (
          <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{job.location}</p>
        )}
        {job.salary && (
          <p className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" />{job.salary}</p>
        )}
        {job.deadline && (
          <p>Deadline: {format(parseISO(job.deadline), "MMM d, yyyy")}</p>
        )}
      </div>
      {job.job_link && (
        <a
          href={job.job_link}
          target="_blank"
          rel="noreferrer"
          className="text-primary mt-4 inline-flex items-center gap-1 text-xs font-medium hover:underline"
        >
          View posting <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </Card>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="glass shadow-card flex flex-col items-center justify-center py-16 text-center">
      <div className="gradient-brand-soft mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <Briefcase className="text-primary h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">No jobs yet</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        Add your first application to start tracking. You can edit, filter, and drag jobs through your pipeline.
      </p>
      <Button onClick={onAdd} className="gradient-brand shadow-glow mt-6 text-primary-foreground">
        <Plus className="mr-1 h-4 w-4" /> Add your first job
      </Button>
    </Card>
  );
}
