import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { format, subDays, parseISO, isAfter } from "date-fns";

import { fetchJobs, STATUS_META, type Job, type JobStatus } from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Trackr" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: jobs, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });

  if (isLoading) return <DashboardSkeleton />;

  const list = jobs ?? [];
  const counts: Record<JobStatus, number> = {
    applied: 0, interview: 0, offer: 0, rejected: 0,
  };
  list.forEach((j) => { counts[j.status]++; });
  const pending = counts.applied + counts.interview;

  const stats = [
    { label: "Applications", value: list.length, icon: Briefcase, accent: "from-chart-1 to-chart-2" },
    { label: "Interviews", value: counts.interview, icon: CalendarClock, accent: "from-chart-4 to-warning" },
    { label: "Offers", value: counts.offer, icon: CheckCircle2, accent: "from-success to-chart-3" },
    { label: "Rejections", value: counts.rejected, icon: XCircle, accent: "from-destructive to-chart-5" },
    { label: "Pending", value: pending, icon: Clock, accent: "from-info to-chart-2" },
  ];

  const pieData = (Object.keys(counts) as JobStatus[])
    .map((s) => ({ name: STATUS_META[s].label, value: counts[s], status: s }))
    .filter((d) => d.value > 0);

  // Last 14 days line chart
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const key = format(d, "yyyy-MM-dd");
    return {
      day: format(d, "MMM d"),
      applications: list.filter((j) => j.created_at.startsWith(key)).length,
    };
  });

  // Bar by status
  const barData = (Object.keys(counts) as JobStatus[]).map((s) => ({
    name: STATUS_META[s].label,
    value: counts[s],
    status: s,
  }));

  const recent = [...list].slice(0, 5);
  const upcoming = list
    .filter((j) => j.deadline && isAfter(parseISO(j.deadline), subDays(new Date(), 1)))
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 5);

  const statusColors: Record<JobStatus, string> = {
    applied: "var(--color-chart-1)",
    interview: "var(--color-chart-4)",
    offer: "var(--color-success)",
    rejected: "var(--color-destructive)",
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's how your job hunt is going.
          </p>
        </div>
        <Button asChild className="gradient-brand shadow-glow text-primary-foreground">
          <Link to="/jobs">Manage jobs <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
          >
            <Card className="glass shadow-card overflow-hidden p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="font-display mt-1 text-3xl font-bold">{s.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${s.accent} flex h-9 w-9 items-center justify-center rounded-xl opacity-90`}>
                  <s.icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="glass shadow-card lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold">Applications over time</h3>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--color-chart-1)" />
                    <stop offset="100%" stopColor="var(--color-chart-2)" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Line type="monotone" dataKey="applications" stroke="url(#lg)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="font-display mb-4 font-semibold">Pipeline breakdown</h3>
          {pieData.length === 0 ? (
            <EmptyMini text="No jobs yet" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {pieData.map((d) => (
                      <Cell key={d.status} fill={statusColors[d.status]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.75rem",
                      fontSize: "0.75rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {pieData.map((d) => (
              <div key={d.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: statusColors[d.status] }} />
                  <span>{d.name}</span>
                </div>
                <span className="text-muted-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass shadow-card lg:col-span-3 p-5">
          <h3 className="font-display mb-4 font-semibold">By status</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)" }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {barData.map((d) => (
                    <Cell key={d.status} fill={statusColors[d.status as JobStatus]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent + Upcoming */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass shadow-card p-5">
          <h3 className="font-display mb-4 font-semibold">Recent activity</h3>
          {recent.length === 0 ? (
            <Empty
              title="No applications yet"
              hint="Add your first job to start tracking."
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((j) => (
                <RecentRow key={j.id} job={j} />
              ))}
            </ul>
          )}
        </Card>
        <Card className="glass shadow-card p-5">
          <h3 className="font-display mb-4 font-semibold">Upcoming deadlines</h3>
          {upcoming.length === 0 ? (
            <Empty title="Nothing upcoming" hint="Deadlines you set will appear here." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((j) => (
                <li key={j.id} className="bg-muted/40 flex items-center justify-between rounded-xl p-3 text-sm">
                  <div>
                    <p className="font-medium">{j.company} · <span className="text-muted-foreground">{j.role}</span></p>
                    <p className="text-xs text-muted-foreground">
                      Due {format(parseISO(j.deadline!), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_META[j.status].color}>
                    {STATUS_META[j.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function RecentRow({ job }: { job: Job }) {
  return (
    <li className="bg-muted/40 flex items-center justify-between rounded-xl p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{job.company}</p>
        <p className="text-muted-foreground truncate text-xs">{job.role}</p>
      </div>
      <Badge variant="outline" className={STATUS_META[job.status].color}>
        {STATUS_META[job.status].label}
      </Badge>
    </li>
  );
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center text-sm">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs">{hint}</p>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
      {text}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
