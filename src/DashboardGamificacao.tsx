import React, { useCallback, useEffect, useMemo, useState } from "react";
import sampleReport from "../docs/dashboard-payload-example.json";
import {
  Users,
  UserCircle2,
  School,
  Activity,
  Flame,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
  Trophy,
  Sparkles,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { SparklesText } from "@/components/ui/sparkles-text";
import { cn, formatCompact, formatNumber, formatPercent } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";

const API_URL =
  "https://pgee-api-staging-d8a9bf89a6c4.herokuapp.com/public/user_dashboard/5f983344-1221-4f6a-a0ac-1fb3a5a3cd7f";

// Tipagens do payload principal
interface Stage {
  stage_id: number;
  stage_name: string;
  users_count: number;
}

interface Mission {
  mission_id: number;
  mission_name: string;
  users_count: number;
}

interface SchoolRow {
  school_id: number;
  school_name: string;
  users_count: number;
}

interface ReportData {
  total_students: number;
  avatar_selection_count: number;
  stage_completion_counts: Stage[];
  daily_login_completions: { date: string; completions: number }[];
  evidence_mission_completion_counts: Mission[];
  school_user_counts: SchoolRow[];
  new_registrations_counts: { date: string; registrations: number }[];
}

type TrendStat = {
  current: number;
  previous: number;
  diff: number;
  percentage: number | null;
};

type MetricCard = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: TrendStat;
};

type Insight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const SAMPLE_REPORT = sampleReport as ReportData;

const COLORS = ["#22d3ee", "#a855f7", "#38bdf8", "#34d399", "#f472b6", "#f59e0b"];

const getArr = <T,>(v: unknown, map?: (x: any) => T): T[] =>
  Array.isArray(v) ? (map ? (v as any[]).map(map) : (v as T[])) : [];

const toNum = (n: unknown, fallback = 0) => {
  const v = typeof n === "number" && !Number.isNaN(n) ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
};

const toISODate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const formatLabelDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const formatLongDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
};

const computeTrend = (
  series: Array<{ date: string; acessos?: number; cadastros?: number }>,
  key: "acessos" | "cadastros",
): TrendStat => {
  if (!series.length) return { current: 0, previous: 0, diff: 0, percentage: null };
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const sum = (entries: typeof sorted) => entries.reduce((acc, entry) => acc + toNum(entry[key], 0), 0);
  const currentSlice = sorted.slice(-7);
  const previousSlice = sorted.slice(-14, -7);
  const current = sum(currentSlice);
  const previous = sum(previousSlice);
  const diff = current - previous;
  const percentage = previous > 0 ? (diff / previous) * 100 : null;
  return { current, previous, diff, percentage };
};

const Section = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-white md:text-lg">{title}</h2>
        {description ? <p className="text-xs text-slate-400 md:text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </div>
);

export default function DashboardGamificacao() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        }
        setIsFallbackData(false);
        const response = await fetch(API_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`Erro ao buscar dados: ${response.status}`);
        const json = (await response.json()) as ReportData;
        setData(json);
      } catch (err) {
        console.warn("Falha ao buscar dados em tempo real. Aplicando payload de exemplo.", err);
        setData(SAMPLE_REPORT);
        setIsFallbackData(true);
        if (err instanceof Error) setError(err.message);
      } finally {
        if (isInitial) setLoading(false);
        setLastUpdated(new Date());
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 15_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const derived = useMemo(() => {
    if (!data) return null;

    const totalStudents = toNum(data.total_students, 0);
    const avatarSelected = toNum(data.avatar_selection_count, 0);
    const avatarRate = totalStudents > 0 ? (avatarSelected / totalStudents) * 100 : 0;

    const stagesRaw = getArr<Stage>(data.stage_completion_counts).map((stage) => ({
      name: stage.stage_name.trim(),
      value: toNum(stage.users_count, 0),
    }));

    const totalStageCompletions = stagesRaw.reduce((acc, stage) => acc + stage.value, 0);
    const stageProgress = stagesRaw.map((stage) => ({
      ...stage,
      percentage: totalStageCompletions > 0 ? (stage.value / totalStageCompletions) * 100 : 0,
    }));

    const schoolsRaw = getArr<SchoolRow>(data.school_user_counts).map((row) => ({
      name: row.school_name,
      value: toNum(row.users_count, 0),
    }));

    const schools = [...schoolsRaw]
      .map((school) => ({
        ...school,
        percentage: totalStudents > 0 ? (school.value / totalStudents) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const acessos = getArr<{ date: string; completions: number }>(data.daily_login_completions).map((entry) => {
      const iso = toISODate(entry.date);
      return {
        date: iso,
        label: formatLabelDate(entry.date),
        tooltipDate: formatLongDate(entry.date),
        shortDate: formatShortDate(entry.date),
        acessos: toNum(entry.completions, 0),
      };
    });

    const cadastros = getArr<{ date: string; registrations: number }>(data.new_registrations_counts).map((entry) => {
      const iso = toISODate(entry.date);
      return {
        date: iso,
        label: formatLabelDate(entry.date),
        tooltipDate: formatLongDate(entry.date),
        shortDate: formatShortDate(entry.date),
        cadastros: toNum(entry.registrations, 0),
      };
    });

    const activeDays = acessos.filter((item) => toNum(item.acessos) > 0).length;
    const uniqueDays = new Set([...acessos, ...cadastros].map((item) => item.date)).size;

    const byDate: Record<
      string,
      {
        date: string;
        label: string;
        tooltipDate: string;
        acessos: number;
        cadastros: number;
      }
    > = {};

    acessos.forEach((item) => {
      byDate[item.date] = byDate[item.date] || {
        date: item.date,
        label: item.label,
        tooltipDate: item.tooltipDate,
        acessos: 0,
        cadastros: 0,
      };
      byDate[item.date].acessos += toNum(item.acessos);
    });

    cadastros.forEach((item) => {
      byDate[item.date] = byDate[item.date] || {
        date: item.date,
        label: item.label,
        tooltipDate: item.tooltipDate,
        acessos: 0,
        cadastros: 0,
      };
      byDate[item.date].cadastros += toNum(item.cadastros);
    });

    const mergedSeries = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({
        date: row.label,
        tooltipDate: row.tooltipDate,
        acessos: row.acessos,
        cadastros: row.cadastros,
      }));

    const totalLogins = acessos.reduce((acc, item) => acc + toNum(item.acessos, 0), 0);
    const totalRegistrations = cadastros.reduce((acc, item) => acc + toNum(item.cadastros, 0), 0);

    const missionsRaw = getArr<Mission>(data.evidence_mission_completion_counts).map((mission) => ({
      name: mission.mission_name,
      value: toNum(mission.users_count, 0),
    }));

    const missionsSorted = [...missionsRaw].sort((a, b) => b.value - a.value);
    const topMissionValue = missionsSorted[0]?.value ?? 0;
    const missionEngagement = missionsSorted.slice(0, 6).map((mission) => ({
      ...mission,
      percentageOfTop: topMissionValue > 0 ? (mission.value / topMissionValue) * 100 : 0,
    }));

    const loginsTrend = computeTrend(acessos, "acessos");
    const registrationsTrend = computeTrend(cadastros, "cadastros");

    const peakRegistrationDay = [...cadastros]
      .filter((item) => toNum(item.cadastros) > 0)
      .sort((a, b) => toNum(b.cadastros) - toNum(a.cadastros))[0];

    const peakLoginDay = [...acessos]
      .filter((item) => toNum(item.acessos) > 0)
      .sort((a, b) => toNum(b.acessos) - toNum(a.acessos))[0];

    const topStage = [...stageProgress].sort((a, b) => b.value - a.value)[0];
    const topSchool = schools[0];

    const insights: Insight[] = [
      peakRegistrationDay
        ? {
            title: "Pico de cadastros",
            description: `${formatNumber(toNum(peakRegistrationDay.cadastros))} novos cadastros em ${peakRegistrationDay.tooltipDate.toLowerCase()}`,
            icon: CalendarDays,
          }
        : null,
      topStage
        ? {
            title: "Fase de maior conclusão",
            description: `${topStage.name} reúne ${formatPercent(topStage.percentage)} dos envios de evidência`,
            icon: Trophy,
          }
        : null,
      missionsSorted[0]
        ? {
            title: "Missão destaque",
            description: `${missionsSorted[0].name} recebeu ${formatNumber(missionsSorted[0].value)} registros`,
            icon: Sparkles,
          }
        : null,
      topSchool
        ? {
            title: "Escola mais engajada",
            description: `${topSchool.name} concentra ${formatPercent(topSchool.percentage)} dos alunos ativos`,
            icon: School,
          }
        : null,
      peakLoginDay
        ? {
            title: "Maior fluxo de acessos",
            description: `${formatNumber(toNum(peakLoginDay.acessos))} sessões em ${peakLoginDay.tooltipDate.toLowerCase()}`,
            icon: LineChart,
          }
        : null,
    ].filter(Boolean) as Insight[];

    const radialData = [
      {
        name: "Acessos ativos",
        value: uniqueDays > 0 ? Math.min(100, (activeDays / uniqueDays) * 100) : 0,
        fill: "#34d399",
      },
      {
        name: "Avatar escolhido",
        value: Math.min(100, avatarRate),
        fill: "#38bdf8",
      },
    ];

    return {
      kpi: {
        totalStudents,
        avatarSelected,
        avatarRate,
        activeDays,
        schoolsCount: schools.length,
        totalLogins,
        totalRegistrations,
        averageStudentsPerSchool: schools.length > 0 ? totalStudents / schools.length : 0,
        engagementRate: uniqueDays > 0 ? (activeDays / uniqueDays) * 100 : 0,
      },
      stageProgress,
      missionEngagement,
      schools,
      mergedSeries,
      trends: { logins: loginsTrend, registrations: registrationsTrend },
      insights,
      radialData,
      dateRange: mergedSeries.length
        ? `${mergedSeries[0].tooltipDate} — ${mergedSeries[mergedSeries.length - 1].tooltipDate}`
        : null,
    };
  }, [data]);

  if (loading || !derived) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Carregando dados analíticos...
      </div>
    );
  }

  const metrics: MetricCard[] = [
    {
      key: "students",
      label: "Alunos cadastrados",
      value: formatNumber(derived.kpi.totalStudents),
      icon: Users,
      subtitle: `${formatCompact(derived.trends.registrations.current)} cadastros nos últimos 7 dias`,
      trend: derived.trends.registrations,
    },
    {
      key: "avatar",
      label: "Aderência ao avatar",
      value: formatPercent(derived.kpi.avatarRate),
      icon: UserCircle2,
      subtitle: `${formatNumber(derived.kpi.avatarSelected)} alunos já personalizaram o perfil`,
    },
    {
      key: "activity",
      label: "Acessos semanais",
      value: formatCompact(derived.trends.logins.current),
      icon: Activity,
      subtitle: `${formatPercent(derived.kpi.engagementRate)} dos dias monitorados têm acessos registrados`,
      trend: derived.trends.logins,
    },
    {
      key: "schools",
      label: "Média por escola",
      value: formatNumber(Math.round(derived.kpi.averageStudentsPerSchool || 0)),
      icon: School,
      subtitle: `${derived.kpi.schoolsCount} escolas ativas na plataforma`,
    },
  ];

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-slate-950 pb-16 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 translate-x-1/2 bg-[radial-gradient(circle,_rgba(56,189,248,0.18),_transparent_55%)] blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-12 lg:px-12">
        <header className="space-y-4">
          <SparklesText className="text-3xl font-semibold md:text-4xl">
            Dashboard — Gamificação nas Escolas
          </SparklesText>
          <p className="max-w-2xl text-sm text-slate-400 md:text-base">
            Monitoramento em tempo real do engajamento estudantil. Os dados são atualizados automaticamente a cada
            15 segundos. Explore os fluxos de acesso, a evolução das fases e os destaques das missões.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-emerald-400" />
              {derived.kpi.totalLogins.toLocaleString("pt-BR")} acessos registrados
            </span>
            {isFallbackData ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-400/10 px-3 py-1.5 text-amber-200">
                <BarChart3 className="h-3.5 w-3.5" />
                Renderizando payload de exemplo (docs/dashboard-payload-example.json)
              </span>
            ) : null}
            {error ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-rose-200">
                Falha em tempo real: {error}
              </span>
            ) : null}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const trend = metric.trend;
            const isPositive = trend ? trend.diff >= 0 : true;
            const trendValue = trend
              ? trend.percentage !== null
                ? `${isPositive ? "+" : "-"}${formatPercent(Math.abs(trend.percentage))}`
                : `${isPositive ? "+" : "-"}${formatNumber(Math.abs(trend.diff))}`
              : null;

            return (
              <MagicCard key={metric.key} className="h-full p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  {trendValue ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                        isPositive
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "bg-rose-500/15 text-rose-200",
                      )}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                      {trendValue}
                    </span>
                  ) : null}
                </div>
                <div className="mt-8 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{metric.label}</p>
                  <p className="text-3xl font-semibold text-white">{metric.value}</p>
                  {metric.subtitle ? <p className="text-xs text-slate-400">{metric.subtitle}</p> : null}
                </div>
              </MagicCard>
            );
          })}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <MagicCard className="p-6">
            <Section
              title="Fluxo diário de acessos e cadastros"
              description={derived.dateRange ?? undefined}
              action={
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  <LineChart className="h-3.5 w-3.5 text-sky-400" />
                  Tendência semanal: {formatPercent(Math.abs(derived.trends.logins.percentage ?? 0))}
                </span>
              }
            >
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={derived.mergedSeries} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcessos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#cbd5f5", fontSize: 11 }} tickMargin={10} interval="preserveEnd" />
                    <YAxis tick={{ fill: "#cbd5f5", fontSize: 11 }} allowDecimals={false} width={70} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: 16,
                        padding: 12,
                      }}
                      labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                      formatter={(value: number, name: string) => [formatNumber(value), name]}
                      labelFormatter={(label, payload) => {
                        const typedPayload = payload as TooltipProps<number, string>["payload"];
                        const longLabel = typedPayload?.[0]?.payload?.tooltipDate;
                        return typeof longLabel === "string" ? longLabel : label;
                      }}
                    />
                    <Legend wrapperStyle={{ color: "#cbd5f5" }} verticalAlign="top" height={40} iconType="circle" />
                    <Area type="monotone" dataKey="acessos" name="Acessos" stroke="#22c55e" strokeWidth={2.4} fill="url(#colorAcessos)" />
                    <Area type="monotone" dataKey="cadastros" name="Cadastros" stroke="#38bdf8" strokeWidth={2.4} fill="url(#colorCadastros)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </MagicCard>

          <MagicCard className="p-6">
            <Section title="Engajamento geral" description="Indicadores percentuais">
              <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-center">
                <div className="mx-auto h-[260px] w-full max-w-[320px] md:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      innerRadius="35%"
                      outerRadius="100%"
                      barSize={22}
                      data={derived.radialData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar cornerRadius={24} background dataKey="value" />
                      <Legend
                        iconSize={12}
                        iconType="circle"
                        layout="vertical"
                        align="center"
                        verticalAlign="bottom"
                        wrapperStyle={{ color: "#cbd5f5", fontSize: "0.75rem", paddingTop: 12 }}
                      />
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0">
                        {formatPercent(derived.kpi.avatarRate)}
                      </text>
                      <text x="50%" y="57%" textAnchor="middle" fill="#94a3b8" fontSize={12}>
                        Avatar escolhido
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="space-y-4 text-xs text-slate-300">
                  <li>
                    <span className="font-semibold text-white">{formatNumber(derived.kpi.activeDays)}</span> dias com acessos registrados no período
                  </li>
                  <li>
                    {derived.kpi.schoolsCount} escolas ativas resultam em uma média de {formatNumber(Math.round(derived.kpi.averageStudentsPerSchool || 0))} alunos por unidade.
                  </li>
                  <li>
                    {formatNumber(derived.kpi.totalRegistrations)} cadastros e {formatNumber(derived.kpi.totalLogins)} sessões acumuladas.
                  </li>
                </ul>
              </div>
            </Section>
          </MagicCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <MagicCard className="p-6">
            <Section title="Conclusões por fase" description="Distribuição por trilha pedagógica">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.stageProgress} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#cbd5f5", fontSize: 12 }} tickMargin={12} />
                    <YAxis tick={{ fill: "#cbd5f5", fontSize: 12 }} width={64} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        borderRadius: 16,
                        padding: 12,
                      }}
                      formatter={(value: number) => [formatNumber(value), "Conclusões"]}
                    />
                    <Bar dataKey="value" radius={[16, 16, 6, 6]}>
                      {derived.stageProgress.map((stage, index) => (
                        <Cell key={stage.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </MagicCard>

          <MagicCard className="p-6">
            <Section title="Missões com maior engajamento" description="Top 6 atividades com evidências enviadas">
              <div className="space-y-4">
                {derived.missionEngagement.map((mission, index) => (
                  <div key={mission.name} className="space-y-2 rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{mission.name}</p>
                        <p className="text-xs text-slate-400">{formatNumber(mission.value)} alunos</p>
                      </div>
                      <span className="text-xs text-slate-300">#{index + 1}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
                        style={{ width: `${mission.percentageOfTop || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </MagicCard>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <MagicCard className="p-6">
            <Section title="Ranking de escolas" description="Ordenado por número de alunos ativos">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Escola</th>
                      <th className="px-4 py-3 text-right font-medium">Alunos</th>
                      <th className="px-4 py-3 text-right font-medium">Participação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derived.schools.map((school, index) => (
                      <tr
                        key={school.name}
                        className={cn(
                          "bg-slate-900/40",
                          index % 2 === 0 ? "bg-transparent" : "bg-white/5",
                          "text-slate-200",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">#{index + 1}</span>
                            <span>{school.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">
                          {formatNumber(school.value)}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-slate-300">
                          {formatPercent(school.percentage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </MagicCard>

          <MagicCard className="p-6">
            <Section title="Insights acionáveis" description="Entenda o que impulsiona o engajamento">
              <ul className="space-y-4 text-sm text-slate-300">
                {derived.insights.map((insight) => {
                  const Icon = insight.icon;
                  return (
                    <li key={insight.title} className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{insight.title}</p>
                        <p className="text-xs text-slate-300">{insight.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>
          </MagicCard>
        </div>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>Fonte: API pública — {API_URL}</span>
          <span>
            Última atualização: {lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </span>
        </footer>
      </main>
    </div>
  );
}
