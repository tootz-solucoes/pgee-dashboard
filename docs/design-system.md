# PGEE Dashboard Design System

Este documento serve como referência visual e técnica para evoluções da dashboard de gamificação. Todas as novas telas ou componentes devem respeitar estes princípios para preservar consistência, legibilidade e qualidade de implementação.

---

## 1. Fundamentos

### 1.1 Stack base
- **Framework:** React 18 com Vite (TypeScript).
- **Estilos utilitários:** Tailwind CSS 3 (modo dark).
- **Animações:** Framer Motion.
- **Iconografia:** `lucide-react`.
- **Gráficos:** Recharts.
- **Helpers:** `src/lib/utils.ts` (`cn`, `formatNumber`, `formatCompact`, `formatPercent`).

### 1.2 Tokens principais
- **Tipografia:** `Inter`, fallback `system-ui`. Uso preferencial via classes Tailwind (`text-sm`, `font-semibold`, etc.).
- **Radius:** 24px principal (`rounded-3xl`) para cartões, 16px secundário (`rounded-2xl`).
- **Sombra base:** `shadow-[0_0_80px_rgba(15,118,110,0.12)]` aplicada em cartões “Magic”.
- **Opacidade:** Camadas translúcidas com `bg-white/5` e `border-white/10` criam efeito glassmorphism.
- **Espaçamentos:** Grid 8px utilizando utilitários Tailwind (`gap-4`, `p-6`, `px-3 py-1.5`).

---

## 2. Paleta cromática

| Token                          | Código / Classe Tailwind                 | Uso principal                               |
|-------------------------------|-------------------------------------------|---------------------------------------------|
| **Plano de fundo**            | `bg-slate-950`, `bg-[radial-gradient…]`   | Fundo da página com gradientes sutis        |
| **Texto primário**            | `text-white`, `text-slate-100`            | Títulos, valores principais                  |
| **Texto secundário**          | `text-slate-300`, `text-slate-400`        | Subtítulos, descrições, metadados            |
| **Bordas & superfícies**      | `border-white/10`, `bg-white/5`           | Cartões e caixas de destaque                 |
| **Acento principal**          | `text-emerald-200`, `from-emerald-300`    | Ícones, gradientes hero                      |
| **Acento complementar**       | `via-cyan-200`, `to-sky-400`              | Gradientes, gráficos e indicadores           |
| **Alertas positivos**         | `bg-emerald-500/15`, `text-emerald-200`   | Badges de tendência ascendente               |
| **Alertas negativos**         | `bg-rose-500/15`, `text-rose-200`         | Badges de tendência descendente              |
| **Avisos / fallback**         | `bg-amber-400/10`, `text-amber-200`       | Indicador de payload de exemplo              |

> **Diretriz:** Sempre que precisar de novas cores, derive tons das paletas Tailwind **emerald**, **cyan**, **sky** e **slate** para manter coerência.

---

## 3. Componentes reutilizáveis

### 3.1 `MagicCard`
- Local: `src/components/ui/magic-card.tsx`.
- Estrutura de cartão com bordas translúcidas, gradiente interno e animação de entrada (`motion.div`).
- **Uso:** envolver blocos de conteúdo, gráficos e tabelas. Adicionar `className` com espaçamentos internos (`p-6`) e layout específico.

### 3.2 `SparklesText`
- Local: `src/components/ui/sparkles-text.tsx`.
- Título com gradiente e animação de fade-in/up.
- **Uso:** títulos principais de página ou seções hero. Evitar sobreuso em textos menores para preservar impacto.

### 3.3 Grid de métricas
- Construído combinando `MagicCard` + ícone circular (`bg-emerald-500/10`), título e valor (`text-3xl font-semibold`).
- Badges de tendência usam `ArrowUpRight` / `ArrowDownRight` com cores de status.
- **Uso:** métricas resumidas no topo; manter quatro colunas em desktops (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`).

### 3.4 Listas de insights / missões
- Itens com `rounded-2xl bg-white/5 p-4`.
- Ícone dentro de container `h-9 w-9` com fundo translúcido de acento.
- **Diretriz:** limitar texto a duas linhas; usar `text-xs text-slate-300` para descrições.

---

## 4. Gráficos e visualização de dados

### 4.1 Biblioteca
- **Recharts** é a camada padrão. Novos gráficos devem seguir a mesma base para manter responsividade e tema.
- Sempre usar `ResponsiveContainer` com `width="100%"` e altura definida (`h-[320px]`, etc.).

### 4.2 Estilo global
- Grades (`CartesianGrid`) com `stroke="rgba(148, 163, 184, 0.12~0.15)"` e `strokeDasharray="3 3"`.
- Eixos (`XAxis`, `YAxis`) com `tick={{ fill: "#cbd5f5", fontSize: 11/12 }}`.
- Tooltips com fundo `#0f172a`, borda translúcida e `borderRadius: 16`.
- Legendas no topo com `iconType="circle"` para reforçar a identidade circular suave.

### 4.3 Paletas específicas
- **Gráfico de linha/área:** `stroke` em `#22c55e` (acessos) e `#38bdf8` (cadastros) com `linearGradient` correspondente.
- **Barras:** utilizar array `COLORS` (`#22d3ee`, `#a855f7`, `#38bdf8`, `#34d399`, `#f472b6`, `#f59e0b`). Em novas visualizações, reutilizar ou extender a paleta mantendo saturação média/alta.
- **Radial chart:** manter `innerRadius ~35%`, `outerRadius 100%`, `barSize >= 20` para legibilidade. Legendas posicionadas em centro/parte inferior.

### 4.4 Dados e formatação
- Funções `formatNumber`, `formatCompact`, `formatPercent` garantem internacionalização pt-BR.
- Datas: `formatLabelDate` para rótulos curtos, `formatLongDate` no tooltip.
- Tendências semanais calculadas com janela de 7 dias via `computeTrend`.

---

## 5. Layout e responsividade

- Largura máxima do conteúdo: `max-w-7xl` (~1280px).
- Padding horizontal padrão: `px-6` (mobile), `lg:px-12` (desktop).
- Seções separadas por `gap-6` ou `gap-10` para respiração visual.
- Em telas médias, gráficos ocupam duas colunas (`md:grid-cols-2`), ajustando para colunas definidas manualmente em desktop (`xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`).
- Sempre que adicionar novas seções, utilizar o wrapper `Section` (título, descrição, ação) para consistência.

---

## 6. Interações e animações

- Framer Motion aplicado em `MagicCard` e `SparklesText`: entrada suave (`duration 0.4~0.45`, `easeOut`).
- Evitar animações contínuas ou interativas excessivas; priorizar transições de entrada e hovers sutis (já entregues através do brilho dos cartões).
- Elementos informativos como badges e gradients podem ser complementados por `position: absolute` com `blur` para dar profundidade (seguindo padrões já usados).

---

## 7. Ícones e ilustrações

- Fonte oficial: `lucide-react`.
- Tamanho padrão: `w-5 h-5` em cards e `w-6 h-6` em métricas KPI.
- Ao introduzir novos ícones, manter coerência de stroke (1.5px) e aplicar cores através de utilitários (`text-emerald-300`, `text-sky-400`).

---

## 8. Diretrizes de conteúdo

- Títulos em português com hifenização consistente (“Dashboard — Gamificação…”).
- Subtítulos curtos (≤ 80 caracteres) para evitar quebra excessiva.
- Indicadores numéricos sempre formatados com `toLocaleString("pt-BR")`.
- Informações de status / fallback (ex.: uso de payload de exemplo) devem ser exibidas em chips (`inline-flex`, borda translúcida) na região do cabeçalho.

---

## 9. Estrutura de pastas relevante

```
src/
  App.tsx                # Monta a página e renderiza DashboardGamificacao
  DashboardGamificacao.tsx
  components/
    ui/
      magic-card.tsx
      sparkles-text.tsx
  lib/
    utils.ts
docs/
  dashboard-payload-example.json
  design-system.md       # Este documento
```

---

## 10. Próximos passos sugeridos

1. Ao criar novos componentes, derivar de `MagicCard` ou manter o mesmo padrão de vidro translúcido.
2. Estender `tailwind.config.cjs` apenas se necessários tokens adicionais (cores customizadas, animações).
3. Manter gráficos em Recharts com os estilos definidos; qualquer lib alternativa deve replicar fielmente as configurações visuais descritas aqui.
4. Atualizar esta documentação quando novos tokens ou padrões forem introduzidos.

---

Seguir estas diretrizes garante que a experiência da dashboard continue coesa, moderna e alinhada à identidade estabelecida nesta primeira versão aprimorada.
