import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Job, JobInput, JobStatus } from "@/lib/jobs";

const schema = z.object({
  company: z.string().min(1, "Required"),
  role: z.string().min(1, "Required"),
  status: z.enum(["applied", "interview", "offer", "rejected"]),
  salary: z.string().optional(),
  location: z.string().optional(),
  application_date: z.string().optional(),
  deadline: z.string().optional(),
  job_link: z.string().url("Must be a URL").or(z.literal("")).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function JobForm({
  initial,
  onSubmit,
  submitting,
  onCancel,
}: {
  initial?: Job | null;
  onSubmit: (values: JobInput) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: initial?.company ?? "",
      role: initial?.role ?? "",
      status: (initial?.status as JobStatus) ?? "applied",
      salary: initial?.salary ?? "",
      location: initial?.location ?? "",
      application_date: initial?.application_date ?? "",
      deadline: initial?.deadline ?? "",
      job_link: initial?.job_link ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const submit = (v: FormValues) =>
    onSubmit({
      company: v.company,
      role: v.role,
      status: v.status,
      salary: v.salary || null,
      location: v.location || null,
      application_date: v.application_date || null,
      deadline: v.deadline || null,
      job_link: v.job_link || null,
      notes: v.notes || null,
    });

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Company" error={form.formState.errors.company?.message}>
          <Input {...form.register("company")} placeholder="Stripe" />
        </Field>
        <Field label="Role" error={form.formState.errors.role?.message}>
          <Input {...form.register("role")} placeholder="Senior Engineer" />
        </Field>
        <Field label="Status">
          <Select
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as JobStatus)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Salary">
          <Input {...form.register("salary")} placeholder="$140k – $180k" />
        </Field>
        <Field label="Location">
          <Input {...form.register("location")} placeholder="Remote · Berlin" />
        </Field>
        <Field label="Job link" error={form.formState.errors.job_link?.message}>
          <Input {...form.register("job_link")} placeholder="https://…" />
        </Field>
        <Field label="Application date">
          <Input type="date" {...form.register("application_date")} />
        </Field>
        <Field label="Deadline">
          <Input type="date" {...form.register("deadline")} />
        </Field>
      </div>
      <Field label="Notes">
        <Textarea rows={4} {...form.register("notes")} placeholder="Recruiter, contacts, prep notes…" />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="gradient-brand text-primary-foreground">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Save changes" : "Add job"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
