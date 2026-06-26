import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { format, parseISO, subDays, differenceInDays } from "date-fns";
import { Activity, Award, Target, TrendingUp } from "lucide-react";

import { fetchJobs, STATUS_META, type JobStatus } from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Trackr" }] }),
  component: Analytics,
});

const TOOLTIP = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.75rem",
  fontSize: "0.75rem",
};

function Analytics() {
  const { data: jobs, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const list = jobs ?? [];
  const total = list.length;
  const offers = list.filter((j) => j.status === "offer").length;
  const interviews = list.filter((j) => j.status === "interview" || j.status === "offer").length;
  const rejected = list.filter((j) => j.status === "rejected").length;

  const interviewRate = total ? Math.round((interviews / total) * 100) : 0;
  const offerRate = total ? Math.round((offers / total) * 100) : 0;
  const rejectionRate = total ? Math.round((rejected / total) * 100) : 0;

  // 30 day trend
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i);
    const k = format(d, "yyyy-MM-dd");
    return {
      day: format(d, "MMM d"),
      apps: list.filter((j) => j.created_at.startsWith(k)).length,
    };
  });

  // Top companies
  const companyMap = new Map<string, number>();
  list.forEach((j) => companyMap.set(j.company, (companyMap.get(j.company) ?? 0) + 1));
  const topCompanies = Array.from(companyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Status pie
  const statusColors: Record<JobStatus, string> = {
    applied: "var(--color-chart-1)",
    interview: "var(--color-chart-4)",
    offer: "var(--color-success)",
    rejected: "var(--color-destructive)",
  };
  const pieData = (Object.keys(STATUS_META) as JobStatus[]).map((s) => ({
    name: STATUS_META[s].label,
    value: list.filter((j) => j.status === s).length,
    status: s,
  })).filter((d) => d.value > 0);

  // Funnel radial
  const funnel = [
    { name: "Applied", value: total, fill: "var(--color-chart-1)" },
    { name: "Interview+", value: interviews, fill: "var(--color-chart-4)" },
    { name: "Offer", value: offers, fill: "var(--color-success)" },
  ];

  // Avg days to interview/offer (rough)
  const avgDays = (() => {
    const moved = list.filter((j) => j.status !== "applied" && j.application_date);
    if (!moved.length) return 0;
    const sum = moved.reduce((acc, j) => acc + Math.max(0, differenceInDays(parseISO(j.updated_at), parseISO(j.application_date!))), 0);
    return Math.round(sum / moved.length);
  })();

  const kpis = [
    { label: "Interview rate", value: `${interviewRate}%`, icon: Activity, accent: "from-chart-4 to-warning" },
    { label: "Offer rate", value: `${offerRate}%`, icon: Award, accent: "from-success to-chart-3" },
    { label: "Rejection rate", value: `${rejectionRate}%`, icon: Target, accent: "from-destructive to-chart-5" },
    { label: "Avg. days to move", value: `${avgDays}d`, icon: TrendingUp, accent: "from-chart-1 to-chart-2" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights from {total} application{total === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Card className="glass shadow-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <p className="font-display mt-1 text-3xl font-bold">{k.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${k.accent} flex h-9 w-9 items-center justify-center rounded-xl`}>
                  <k.icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass shadow-card p-5 lg:col-span-2">
          <h3 className="font-display mb-4 font-semibold">Activity (30 days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Area type="monotone" dataKey="apps" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#ag)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="font-display mb-4 font-semibold">Funnel</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="30%" outerRadius="100%" data={funnel} startAngle={90} endAngle={-270}>
                <RadialBar background dataKey="value" cornerRadius={8} />
                <Tooltip contentStyle={TOOLTIP} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {funnel.map((f) => (
              <div key={f.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: f.fill }} />
                  {f.name}
                </span>
                <span className="text-muted-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass shadow-card p-5 lg:col-span-2">
          <h3 className="font-display mb-4 font-semibold">Top companies</h3>
          {topCompanies.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCompanies} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip cursor={{ fill: "var(--color-muted)" }} contentStyle={TOOLTIP} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="var(--color-chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="glass shadow-card p-5">
          <h3 className="font-display mb-4 font-semibold">Status mix</h3>
          {pieData.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">No data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {pieData.map((d) => (
                      <Cell key={d.status} fill={statusColors[d.status]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
