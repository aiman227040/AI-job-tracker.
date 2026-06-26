import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Brain, Copy, FileText, Lightbulb, Loader2, MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

import { generateAiContent } from "@/lib/ai.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Trackr" }] }),
  component: Assistant,
});

type Task = "interview-questions" | "cover-letter" | "resume-tips" | "skills";

const TASKS: { id: Task; label: string; icon: typeof Brain; desc: string }[] = [
  { id: "interview-questions", label: "Interview Questions", icon: MessageSquare, desc: "Likely questions for this role" },
  { id: "cover-letter", label: "Cover Letter", icon: FileText, desc: "A tailored, confident draft" },
  { id: "resume-tips", label: "Resume Tips", icon: Lightbulb, desc: "Targeted improvements" },
  { id: "skills", label: "Skill Suggestions", icon: Sparkles, desc: "Skills to highlight" },
];

function Assistant() {
  const [task, setTask] = useState<Task>("interview-questions");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");

  const callAi = useServerFn(generateAiContent);

  const mut = useMutation({
    mutationFn: async () => {
      if (!role.trim()) throw new Error("Enter a role");
      const res = await callAi({ data: { task, role, company, notes } });
      return res.text;
    },
    onSuccess: (text) => setOutput(text),
    onError: (e: Error) => {
      const msg = e.message || "Something went wrong";
      if (msg.includes("429")) toast.error("Rate limit hit. Try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits in Settings → Plans & credits.");
      else toast.error(msg);
    },
  });

  const copy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
            <span className="gradient-text">AI Assistant</span>
            <Brain className="text-primary h-7 w-7" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate interview prep, cover letters, and resume tips in seconds.
          </p>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TASKS.map((t) => {
          const active = task === t.id;
          return (
            <motion.button
              key={t.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setTask(t.id)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                active
                  ? "gradient-brand text-primary-foreground shadow-glow border-transparent"
                  : "glass hover:border-primary/40",
              ].join(" ")}
            >
              <t.icon className="mb-2 h-5 w-5" />
              <p className="font-display font-semibold">{t.label}</p>
              <p className={`mt-0.5 text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>
                {t.desc}
              </p>
            </motion.button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass shadow-card space-y-4 p-5">
          <h3 className="font-display font-semibold">Context</h3>
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Senior Product Designer" />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Linear" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Job description bullets, your background, anything to tailor the output…"
              rows={6}
            />
          </div>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="gradient-brand shadow-glow w-full text-primary-foreground"
          >
            {mut.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Wand2 className="mr-2 h-4 w-4" /> Generate</>
            )}
          </Button>
        </Card>

        <Card className="glass shadow-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold">Output</h3>
            {output && (
              <Button variant="ghost" size="sm" onClick={copy}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            )}
          </div>
          {mut.isPending ? (
            <div className="text-muted-foreground flex h-72 flex-col items-center justify-center gap-3 text-sm">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
              Thinking…
            </div>
          ) : output ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-muted-foreground flex h-72 flex-col items-center justify-center gap-2 text-center text-sm">
              <Sparkles className="text-primary h-8 w-8 opacity-60" />
              <p>Pick a task, add context, and hit Generate.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
