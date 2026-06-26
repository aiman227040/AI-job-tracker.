import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { GripVertical, MapPin } from "lucide-react";
import { toast } from "sonner";

import {
  fetchJobs,
  STATUS_META,
  STATUS_ORDER,
  updateJobStatus,
  type Job,
  type JobStatus,
} from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/kanban")({
  head: () => ({ meta: [{ title: "Kanban — Trackr" }] }),
  component: KanbanPage,
});

function KanbanPage() {
  const qc = useQueryClient();
  const { data: jobs, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const grouped = useMemo(() => {
    const g: Record<JobStatus, Job[]> = { applied: [], interview: [], offer: [], rejected: [] };
    (jobs ?? []).forEach((j) => g[j.status].push(j));
    return g;
  }, [jobs]);

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) => updateJobStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["jobs"] });
      const prev = qc.getQueryData<Job[]>(["jobs"]);
      qc.setQueryData<Job[]>(["jobs"], (old) =>
        (old ?? []).map((j) => (j.id === id ? { ...j, status } : j)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["jobs"], ctx.prev);
      toast.error("Could not move job");
    },
    onSuccess: () => toast.success("Job moved"),
  });

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = String(over.id) as JobStatus;
    const job = (jobs ?? []).find((j) => j.id === active.id);
    if (!job || job.status === newStatus) return;
    move.mutate({ id: job.id, status: newStatus });
  };

  const activeJob = activeId ? (jobs ?? []).find((j) => j.id === activeId) : null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Kanban</h1>
        <p className="mt-1 text-sm text-muted-foreground">Drag jobs across columns to update their status.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((s) => <Skeleton key={s} className="h-96 rounded-2xl" />)}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STATUS_ORDER.map((status) => (
              <KanbanColumn key={status} status={status} jobs={grouped[status]} />
            ))}
          </div>
          <DragOverlay>
            {activeJob ? <KanbanCard job={activeJob} dragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function KanbanColumn({ status, jobs }: { status: JobStatus; jobs: Job[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  return (
    <div
      ref={setNodeRef}
      className={`glass shadow-card flex flex-col rounded-2xl p-4 transition ${
        isOver ? "ring-primary/40 ring-2" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
            {meta.label}
          </h3>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
          {jobs.length}
        </span>
      </div>
      <div className="flex min-h-[200px] flex-1 flex-col gap-2">
        {jobs.length === 0 ? (
          <div className="border-border/60 text-muted-foreground flex flex-1 items-center justify-center rounded-xl border border-dashed py-12 text-center text-xs">
            Drop jobs here
          </div>
        ) : (
          jobs.map((job) => <DraggableCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}

function DraggableCard({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: job.id });
  return (
    <motion.div
      ref={setNodeRef}
      layout
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <KanbanCard job={job} />
    </motion.div>
  );
}

function KanbanCard({ job, dragging }: { job: Job; dragging?: boolean }) {
  return (
    <Card
      className={`group bg-card/90 cursor-grab active:cursor-grabbing border p-3 transition ${
        dragging ? "shadow-elevated rotate-2" : "hover:shadow-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{job.company}</p>
          <p className="text-muted-foreground truncate text-xs">{job.role}</p>
        </div>
        <GripVertical className="text-muted-foreground/40 group-hover:text-muted-foreground h-4 w-4 shrink-0" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {job.location && (
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <MapPin className="h-3 w-3" /> {job.location}
          </span>
        )}
        {job.salary && (
          <Badge variant="secondary" className="text-xs">{job.salary}</Badge>
        )}
      </div>
    </Card>
  );
}
