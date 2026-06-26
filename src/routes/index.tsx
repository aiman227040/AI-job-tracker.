import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, Calendar, KanbanSquare, Sparkles, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trackr — Track every application. Land every offer." },
      {
        name: "description",
        content:
          "Trackr is the premium AI job tracker. Manage applications, interviews and offers in one beautiful, intelligent workspace.",
      },
      { property: "og:title", content: "Trackr — AI Job Application Tracker" },
      {
        property: "og:description",
        content: "Track every application. Land every offer.",
      },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

const features = [
  { icon: KanbanSquare, title: "Kanban pipeline", desc: "Drag jobs through Applied → Interview → Offer." },
  { icon: BarChart3, title: "Live analytics", desc: "Conversion rates, velocity, and trends at a glance." },
  { icon: Calendar, title: "Interview calendar", desc: "Never miss a deadline or interview again." },
  { icon: Brain, title: "AI assistant", desc: "Generate cover letters, prep questions, and skill gaps." },
  { icon: Target, title: "Smart reminders", desc: "Nudges when applications go cold." },
  { icon: Sparkles, title: "Resume polish", desc: "AI-suggested improvements per role." },
];

function Landing() {
  return (
    <div className="mesh-bg min-h-screen overflow-hidden">
      {/* Nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-brand shadow-glow flex h-9 w-9 items-center justify-center rounded-xl">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">Trackr</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition hover:text-foreground">Features</a>
          <a href="#how" className="transition hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gradient-brand shadow-glow text-primary-foreground">
            <Link to="/auth">
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-12 text-center md:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs"
        >
          <span className="bg-success h-1.5 w-1.5 rounded-full" />
          <span className="text-muted-foreground">AI-powered · Built for serious job seekers</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
        >
          Track every application.{" "}
          <span className="gradient-text">Land every offer.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          The premium workspace for your job hunt. Pipeline, analytics, interview prep — and an AI
          assistant that helps you stand out.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg" className="gradient-brand shadow-glow h-12 px-7 text-primary-foreground">
            <Link to="/auth">
              Start tracking free <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="glass h-12 px-7">
            <a href="#features">See features</a>
          </Button>
        </motion.div>

        {/* Preview mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="gradient-brand shadow-glow absolute -inset-x-10 -top-10 h-40 rounded-full opacity-30 blur-3xl" />
          <div className="glass-strong shadow-elevated relative rounded-3xl p-2">
            <div className="bg-card grid grid-cols-1 gap-3 rounded-2xl p-4 md:grid-cols-4">
              {(["Applied", "Interview", "Offer", "Rejected"] as const).map((s, i) => (
                <div key={s} className="bg-muted/50 rounded-xl p-3 text-left">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {s}
                    </span>
                    <span className="bg-background rounded-full px-2 py-0.5 text-xs">{[12, 5, 2, 4][i]}</span>
                  </div>
                  <div className="space-y-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="bg-background rounded-lg p-3 text-xs">
                        <div className="font-semibold">{["Stripe", "Linear", "Vercel", "Figma"][((i + j) % 4)]}</div>
                        <div className="text-muted-foreground">Senior Engineer</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 pb-32">
        <div className="mb-14 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need, <span className="gradient-text">nothing you don't</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Built for the modern job hunt. Designed to keep you in flow.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass shadow-card rounded-2xl p-6 transition hover:-translate-y-0.5"
            >
              <div className="gradient-brand-soft mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
                <f.icon className="text-primary h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="glass-strong shadow-elevated rounded-3xl p-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Your next role is one good system away.
          </h2>
          <p className="mt-3 text-muted-foreground">Start free. No credit card required.</p>
          <Button asChild size="lg" className="gradient-brand shadow-glow mt-8 h-12 px-7 text-primary-foreground">
            <Link to="/auth">
              Create your account <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Trackr. Built with care.
      </footer>
    </div>
  );
}
