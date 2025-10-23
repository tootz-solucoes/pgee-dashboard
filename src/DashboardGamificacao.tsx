import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, UserCircle2, School } from "lucide-react";
import { motion } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";

// Tipagens
 type Stage = { stage_id: number; stage_name: string; users_count: number };
 type Mission = { mission_id: number; mission_name: string; users_count: number };
 type SchoolRow = { school_id: number; school_name: string; users_count: number };
 type ReportData = {
  total_students: number;
  avatar_selection_count: number;
  stage_completion_counts: Stage[];
  daily_login_completions: { date: string; completions: number }[];
  evidence_mission_completion_counts: Mission[];
  school_user_counts: SchoolRow[];
  new_registrations_counts: { date: string; registrations: number }[];
};

const API_URL = "https://pgee-api-staging-d8a9bf89a6c4.herokuapp.com/public/user_dashboard/5f983344-1221-4f6a-a0ac-1fb3a5a3cd7f";

const getArr = <T,>(v: unknown, map?: (x: any) => T): T[] =>
  Array.isArray(v) ? (map ? (v as any[]).map(map) : (v as T[])) : [];

const toNum = (n: unknown, fallback = 0) => {
  const v = typeof n === "number" && !Number.isNaN(n) ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { month: "2-digit", day: "2-digit" });

const COLORS = ["#22c55e", "#3b82f6", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc0cb", "#b2dfdb", "#ffab91"];

const KPI: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string }> = ({ icon, label, value, sub }) => (
  <Card className="rounded-2xl shadow-md bg-gray-900 text-gray-100">
    <CardContent className="p-5 flex items-center gap-4">
      <div className="p-3 rounded-2xl bg-gray-800">{icon}</div>
      <div>
        <div className="text-sm text-gray-400">{label}</div>
        <div className="text-2xl font-semibold leading-tight text-white">{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </CardContent>
  </Card>
);

const Section: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between text-white">
      <h2 className="text-lg font-semibold">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

export default function DashboardGamificacao() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(API_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`Erro ao buscar dados: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Primeiro carregamento
    fetchData(true);
    // Auto refresh a cada 10 segundos
    const id = setInterval(() => fetchData(false), 10_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const derived = useMemo(() => {
    if (!data) return null;
    const total = toNum(data.total_students, 0);
    const avatar = toNum(data.avatar_selection_count, 0);
    const avatarRate = total > 0 ? (avatar / total) * 100 : 0;

    const stages = getArr<Stage>(data.stage_completion_counts).map((s) => ({ name: s.stage_name.trim(), value: toNum(s.users_count, 0) }));
    const schools = getArr<SchoolRow>(data.school_user_counts).map((s) => ({ name: s.school_name, value: toNum(s.users_count, 0) }));

    const acessos = getArr<{ date: string; completions: number }>(data.daily_login_completions)
      .map((d) => ({ date: d.date, formattedDate: formatDate(d.date), acessos: toNum(d.completions, 0) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const cadastros = getArr<{ date: string; registrations: number }>(data.new_registrations_counts)
      .map((d) => ({ date: d.date, formattedDate: formatDate(d.date), cadastros: toNum(d.registrations, 0) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const activeDays = acessos.filter((d) => d.acessos > 0).length;

    const byDate: Record<string, { date: string; acessos?: number; cadastros?: number }> = {};
    for (const l of acessos) byDate[l.formattedDate] = { ...(byDate[l.formattedDate] || { date: l.formattedDate }), acessos: l.acessos };
    for (const r of cadastros) byDate[r.formattedDate] = { ...(byDate[r.formattedDate] || { date: r.formattedDate }), cadastros: r.cadastros };
    const mergedSeries = Object.values(byDate).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

    return {
      kpi: { totalStudents: total, avatarSelected: avatar, avatarRate, activeDays, schoolsCount: schools.length },
      stages,
      schools,
      mergedSeries,
    };
  }, [data]);

  if (loading) return <div className="p-10 text-center text-gray-400 bg-gray-950 min-h-screen">Carregando dados...</div>;
  if (error) return <div className="p-10 text-center text-red-500 bg-gray-950 min-h-screen">Erro: {error}</div>;
  if (!derived) return <div className="p-10 text-center text-gray-400 bg-gray-950 min-h-screen">Sem dados disponíveis</div>;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-8 bg-gray-950 text-gray-100 min-h-screen">
      <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Dashboard — Gamificação nas Escolas</h1>
          <p className="text-sm text-gray-400 mt-1">Dados em tempo real da API pública — atualiza automaticamente a cada 10s</p>
        </div>
      </motion.header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={<Users className="w-6 h-6 text-green-400" />} label="Alunos" value={derived.kpi.totalStudents.toLocaleString("pt-BR")} />
        <KPI icon={<UserCircle2 className="w-6 h-6 text-blue-400" />} label="Selecionaram avatar" value={derived.kpi.avatarSelected.toLocaleString("pt-BR")} sub={`${derived.kpi.avatarRate.toFixed(1)}% de adesão`} />
        <KPI icon={<TrendingUp className="w-6 h-6 text-yellow-400" />} label="Dias com acesso" value={derived.kpi.activeDays.toString()} sub="atividade registrada" />
        <KPI icon={<School className="w-6 h-6 text-pink-400" />} label="Escolas" value={derived.kpi.schoolsCount.toString()} />
      </motion.div>

      <Section title="Acessos vs Cadastros (por dia)" right={<span className="text-xs text-gray-400">Últimos meses</span>}>
        <Card className="rounded-2xl bg-gray-900 text-gray-100">
          <CardContent className="p-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.mergedSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#ccc' }} interval={Math.floor(Math.max(derived.mergedSeries.length, 1) / 8)} />
                <YAxis tick={{ fontSize: 12, fill: '#ccc' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#ccc' }} />
                <Bar dataKey="acessos" name="Acessos" fill="#22c55e" />
                <Bar dataKey="cadastros" name="Cadastros" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      <Section title="Conclusões por Fase">
        <Card className="rounded-2xl bg-gray-900 text-gray-100">
          <CardContent className="p-4 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.stages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#ccc' }} />
                <YAxis tick={{ fill: '#ccc' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                <Bar dataKey="value">
                  {derived.stages.map((row, i) => (
                    <Cell key={row.name + i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      <Section title="Alunos por Escola">
        <Card className="rounded-2xl bg-gray-900 text-gray-100">
          <CardContent className="p-4 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.schools} layout="vertical" margin={{ left: 80, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#ccc' }} />
                <YAxis type="category" dataKey="name" width={260} tick={{ fontSize: 12, fill: '#ccc' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                <Bar dataKey="value" barSize={20}>
                  {derived.schools.map((row, i) => (
                    <Cell key={row.name + i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      <footer className="text-xs text-gray-500 pt-4 text-center border-t border-gray-800">
        Fonte: API pública — {API_URL}
      </footer>
    </div>
  );
}
