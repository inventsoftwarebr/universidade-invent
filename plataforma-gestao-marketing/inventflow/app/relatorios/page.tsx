import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { loadPersonStats, loadReportData } from "@/lib/queries";
import {
  addDays,
  daysBetween,
  formatDay,
  formatMonth,
  lastMonths,
  nextWeekStarts,
  today,
} from "@/lib/domain/dates";
import {
  agingWip,
  capacityGrid,
  checkinAdherence,
  cumulativeFlow,
  cycleTimeByParent,
  deliveriesByMonth,
  effortByPortfolio,
  effortSplit,
  healthCounts,
  onTimeByMonth,
  reworkRate,
} from "@/lib/domain/metrics";
import { PROJECT_ACTIVE_STATUSES, taskStatusLabel } from "@/lib/domain/rules";
import { Farol } from "@/components/ui";
import {
  AgingPlot,
  BarsWithMarker,
  Donut,
  GroupedBars,
  LineChart,
  Legend,
  NoData,
  Sparkline,
  SplitBar,
  StackedArea,
  StackedBars,
  Viz,
} from "@/components/charts";

export const dynamic = "force-dynamic";

type Tab = "executivo" | "gestao" | "individual";

const TABS: { id: Tab; label: string; who: string }[] = [
  { id: "executivo", label: "Executivo", who: "Diretoria" },
  { id: "gestao", label: "Gestão da área", who: "Coordenação" },
  { id: "individual", label: "Individual", who: "Cada pessoa" },
];

const pct = (value: number | null): string =>
  value === null ? "—" : `${Math.round(value * 100)}%`;
const hoursFmt = (value: number): string => `${Math.round(value)}h`;
const daysFmt = (value: number): string => `${Math.round(value * 10) / 10}d`;

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.id === params.aba) ? (params.aba as Tab) : "executivo";

  const data = await loadReportData();
  const day = today();

  const active = data.overviews.filter((o) =>
    PROJECT_ACTIVE_STATUSES.includes(o.project.status),
  );

  return (
    <main className="page">
      <div className="pagehead">
        <div>
          <p className="eyebrow">Atualizado em {formatDay(day)}</p>
          <h1>Relatórios</h1>
          <p className="sub">
            Cada gráfico responde a uma pergunta escrita ao lado dele. Gráfico sem pergunta
            é enfeite.
          </p>
        </div>
      </div>

      <nav className="tabs">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/relatorios?aba=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
          >
            {item.label}
            <span className="muted" style={{ fontSize: 11, marginLeft: 7 }}>
              {item.who}
            </span>
          </Link>
        ))}
      </nav>

      {tab === "executivo" ? <Executivo data={data} active={active} day={day} /> : null}
      {tab === "gestao" ? <Gestao data={data} day={day} /> : null}
      {tab === "individual" ? <Individual userId={user.id} data={data} day={day} /> : null}
    </main>
  );
}

/* =========================== ABA EXECUTIVO ============================== */

async function Executivo({
  data,
  active,
  day,
}: {
  data: Awaited<ReturnType<typeof loadReportData>>;
  active: Awaited<ReturnType<typeof loadReportData>>["overviews"];
  day: string;
}) {
  const months = lastMonths(day, 12);
  const counts = healthCounts(active.map((o) => o.health.health));
  const onTime = onTimeByMonth(data.deliveries, months);
  const deliveries = deliveriesByMonth(data.deliveries, months);
  const effort = effortByPortfolio(data.effort);
  const split = effortSplit(data.effort);

  const activeInitiatives = data.initiatives.filter((i) => i.initiative.status === "ativa");
  const adherence = checkinAdherence(
    activeInitiatives.map((i) => ({
      cadence: i.initiative.cadence,
      lastCheckinOn: i.lastCheckinOn,
    })),
    day,
  );

  const upcoming = active
    .flatMap((o) =>
      o.nextMilestone && o.nextMilestone.status === "pendente"
        ? [{ project: o.project.title, slug: o.project.slug, milestone: o.nextMilestone }]
        : [],
    )
    .filter((m) => daysBetween(day, m.milestone.dueDate) <= 30)
    .sort((a, b) => a.milestone.dueDate.localeCompare(b.milestone.dueDate));

  const overdueMilestones = upcoming.filter((m) => daysBetween(m.milestone.dueDate, day) > 0);

  // A última janela com entregas — dizer "0%" onde não houve entrega seria mentira.
  const lastWithData = [...onTime].reverse().find((p) => p.ratio !== null) ?? null;

  const silent = active.filter(
    (o) => o.lastStatusUpdateOn === null || daysBetween(o.lastStatusUpdateOn, day) >= 8,
  );
  const overridden = active.filter((o) => o.health.overridden);

  return (
    <>
      <dl className="tiles" style={{ marginBottom: 22 }}>
        <div className="tile">
          <dt>Projetos ativos</dt>
          <dd>{active.length}</dd>
        </div>
        <div className="tile is-ok">
          <dt>Entregas no prazo</dt>
          <dd>{lastWithData ? pct(lastWithData.ratio) : "—"}</dd>
          <p className="hint">
            {lastWithData ? `${formatMonth(lastWithData.month)} · meta 80%` : "sem entregas"}
          </p>
        </div>
        <div className={`tile ${counts.vermelho > 0 ? "is-crit" : counts.amarelo > 0 ? "is-warn" : "is-ok"}`}>
          <dt>Projetos em risco</dt>
          <dd>{counts.amarelo + counts.vermelho}</dd>
          <p className="hint">
            {counts.vermelho} vermelho · {counts.amarelo} amarelo
          </p>
        </div>
        <div className="tile">
          <dt>Marcos em 30 dias</dt>
          <dd>{upcoming.length}</dd>
          <p className="hint">{overdueMilestones.length} já vencido(s)</p>
        </div>
        <div className="tile">
          <dt>Iniciativas ativas</dt>
          <dd>{activeInitiatives.length}</dd>
        </div>
        <div className={`tile ${adherence.ratio !== null && adherence.ratio < 0.8 ? "is-warn" : ""}`}>
          <dt>Aderência dos check-ins</dt>
          <dd>{pct(adherence.ratio)}</dd>
          <p className="hint">Confiabilidade do dado abaixo</p>
        </div>
      </dl>

      <div className="grid cols-2" style={{ marginBottom: 16 }}>
        <Viz
          id="E1"
          name="Saúde do portfólio"
          ask="Quantos projetos estão verdes, amarelos e vermelhos?"
          table={{
            head: ["Farol", "Projetos"],
            rows: [
              ["Verde", counts.verde],
              ["Amarelo", counts.amarelo],
              ["Vermelho", counts.vermelho],
            ],
          }}
          foot="O farol é calculado a partir de marcos, prazos, bloqueios e idade da última atualização de status."
        >
          {active.length === 0 ? (
            <NoData>Nenhum projeto em execução.</NoData>
          ) : (
            <Donut
              total={active.length}
              centerLabel="projetos"
              segments={[
                { label: "Verde", value: counts.verde, color: "var(--ok)" },
                { label: "Amarelo", value: counts.amarelo, color: "var(--warn)" },
                { label: "Vermelho", value: counts.vermelho, color: "var(--crit)" },
              ]}
            />
          )}
        </Viz>

        <Viz
          id="E2"
          name="Entregas no prazo — 12 meses"
          ask="Estamos melhorando ou piorando em cumprir prazo?"
          table={{
            head: ["Mês", "Entregas", "No prazo", "%"],
            rows: onTime.map((p) => [formatMonth(p.month), p.total, p.onTime, pct(p.ratio)]),
          }}
          foot="No prazo = conclusão real dentro da data planejada original. Replanejamento não recalcula a baseline."
        >
          <LineChart
            points={onTime.map((p) => ({ label: formatMonth(p.month), value: p.ratio }))}
            target={{ value: 0.8, label: "meta" }}
            format={(value) => `${Math.round(value * 100)}%`}
            maxY={1}
          />
        </Viz>

        <Viz
          id="E3"
          name="Onde foi o esforço"
          ask="O esforço do time bate com a prioridade estratégica?"
          table={{
            head: ["Pilar", "Estimado (h)", "Entregue (h)"],
            rows: effort.map((e) => [
              e.portfolioName,
              Math.round(e.planned),
              Math.round(e.delivered),
            ]),
          }}
          foot="Horas estimadas, não apontadas — a plataforma não tem timesheet por decisão de escopo."
        >
          {effort.length === 0 ? (
            <NoData>Sem tarefas estimadas.</NoData>
          ) : (
            <>
              <GroupedBars
                rows={effort.map((e) => ({
                  label: e.portfolioName,
                  values: [e.planned, e.delivered],
                }))}
                series={[
                  { label: "Estimado", color: "var(--cat-1)" },
                  { label: "Entregue", color: "var(--cat-2)" },
                ]}
                format={hoursFmt}
              />
              <Legend
                items={[
                  { label: "Estimado", color: "var(--cat-1)" },
                  { label: "Entregue", color: "var(--cat-2)" },
                ]}
              />
            </>
          )}
        </Viz>

        <Viz
          id="E5"
          name="Projeto × Iniciativa"
          ask="Quanto do time está em trabalho com fim e quanto em rotina?"
          table={{
            head: ["Tipo", "Horas estimadas"],
            rows: [
              ["Projeto", Math.round(split.projeto)],
              ["Iniciativa", Math.round(split.iniciativa)],
            ],
          }}
          foot="Rotina demais sufoca projeto; projeto demais deixa a operação sem dono. O número certo é uma decisão da diretoria, não do sistema."
        >
          <SplitBar
            format={hoursFmt}
            parts={[
              { label: "Projetos", value: split.projeto, color: "var(--cat-1)" },
              { label: "Iniciativas", value: split.iniciativa, color: "var(--cat-2)" },
            ]}
          />
        </Viz>

        <Viz
          id="E6"
          name="Entregas concluídas por mês"
          ask="O time está produzindo mais ou menos?"
          table={{
            head: ["Mês", "Projetos", "Marcos"],
            rows: deliveries.map((d) => [formatMonth(d.month), d.projetos, d.marcos]),
          }}
        >
          <>
            <StackedBars
              groups={deliveries.map((d) => ({
                label: formatMonth(d.month),
                values: [d.projetos, d.marcos],
              }))}
              series={[
                { label: "Projetos", color: "var(--cat-1)" },
                { label: "Marcos", color: "var(--cat-2)" },
              ]}
            />
            <Legend
              items={[
                { label: "Projetos concluídos", color: "var(--cat-1)" },
                { label: "Marcos concluídos", color: "var(--cat-2)" },
              ]}
            />
          </>
        </Viz>

        <Viz
          id="E4"
          name="Marcos dos próximos 30 dias"
          ask="O que vence nas próximas semanas e o que já venceu?"
        >
          {upcoming.length === 0 ? (
            <NoData>Nenhum marco nos próximos 30 dias.</NoData>
          ) : (
            <div className="rows" style={{ marginTop: 4 }}>
              {upcoming.map((item) => {
                const left = daysBetween(day, item.milestone.dueDate);
                return (
                  <div className="row" key={item.milestone.id}>
                    <div className="grow">
                      <Link className="title" href={`/projetos/${item.slug}`}>
                        {item.milestone.title}
                      </Link>
                      <div className="meta">
                        <span>{item.project}</span>
                        <span className="tnum">{formatDay(item.milestone.dueDate)}</span>
                      </div>
                    </div>
                    {left < 0 ? (
                      <span className="chip late">vencido há {Math.abs(left)}d</span>
                    ) : left <= 7 ? (
                      <span className="chip due-soon">em {left}d</span>
                    ) : (
                      <span className="chip">em {left}d</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Viz>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>E7 — Painel de iniciativas</h2>
          <span className="count">{activeInitiatives.length} ativas</span>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Iniciativa</th>
                <th>Owner</th>
                <th>Cadência</th>
                <th>Último check-in</th>
                <th className="num">Indicador</th>
                <th>Tendência</th>
              </tr>
            </thead>
            <tbody>
              {activeInitiatives.map((item) => {
                const last = item.history.at(-1)?.value ?? null;
                return (
                  <tr key={item.initiative.id}>
                    <td>
                      <Link href={`/iniciativas/${item.initiative.slug}`}>
                        {item.initiative.title}
                      </Link>
                    </td>
                    <td>{item.owner.name}</td>
                    <td>{item.initiative.cadence}</td>
                    <td>
                      {item.overdue ? (
                        <span className="chip late">
                          {item.lastCheckinOn ? `há ${item.daysSinceCheckin}d` : "nunca"}
                        </span>
                      ) : (
                        <span className="mono tnum muted">{formatDay(item.lastCheckinOn)}</span>
                      )}
                    </td>
                    <td className="num">
                      {last === null ? "—" : `${last} ${item.initiative.indicatorUnit}`}
                      {item.initiative.targetValue ? (
                        <span className="muted"> / {Number(item.initiative.targetValue)}</span>
                      ) : null}
                    </td>
                    <td>
                      <Sparkline
                        values={item.history.map((h) => h.value)}
                        target={
                          item.initiative.targetValue === null
                            ? null
                            : Number(item.initiative.targetValue)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>O que mudou e o que precisa de atenção</h2>
        </div>
        <div className="card card-pad" style={{ display: "grid", gap: 10 }}>
          {overdueMilestones.length > 0 ? (
            <p>
              <strong style={{ color: "var(--crit)" }}>
                {overdueMilestones.length} marco(s) vencido(s):
              </strong>{" "}
              {overdueMilestones.map((m) => m.milestone.title).join(" · ")}
            </p>
          ) : (
            <p className="muted">Nenhum marco vencido.</p>
          )}

          {silent.length > 0 ? (
            <p>
              <strong style={{ color: "var(--warn)" }}>
                {silent.length} projeto(s) sem atualização de status há mais de 7 dias:
              </strong>{" "}
              {silent.map((o) => o.project.title).join(" · ")}
            </p>
          ) : (
            <p className="muted">Todos os projetos com status atualizado na última semana.</p>
          )}

          {overridden.length > 0 ? (
            <p>
              <strong>Farol sobrescrito pelo owner em {overridden.length} projeto(s):</strong>{" "}
              {overridden.map((o) => o.project.title).join(" · ")} — onde a percepção diverge
              do cálculo.
            </p>
          ) : (
            <p className="muted">Nenhum farol sobrescrito: percepção e cálculo estão juntos.</p>
          )}
        </div>
      </section>
    </>
  );
}

/* ============================ ABA GESTÃO =============================== */

async function Gestao({
  data,
  day,
}: {
  data: Awaited<ReturnType<typeof loadReportData>>;
  day: string;
}) {
  const wipStatuses = ["em_execucao", "em_revisao"] as const;
  const wip = data.flowTasks.filter((t) =>
    (wipStatuses as readonly string[]).includes(t.status),
  ).length;
  const blocked = data.flowTasks.filter((t) => t.status === "bloqueada").length;

  const lateTasks = data.overviews.reduce((sum, o) => sum + o.lateCount, 0);

  const days = Array.from({ length: 60 }, (_, i) => addDays(day, -(59 - i)));
  const flow = cumulativeFlow(data.flowTasks, data.events, days);
  const flowOrder = ["a_fazer", "em_execucao", "bloqueada", "em_revisao", "concluida"] as const;
  const flowColor: Record<string, string> = {
    a_fazer: "var(--flow-1)",
    em_execucao: "var(--flow-2)",
    bloqueada: "var(--crit)",
    em_revisao: "var(--flow-3)",
    concluida: "var(--flow-4)",
  };

  const cycle = cycleTimeByParent(data.flowTasks);
  const completedIds = data.flowTasks.filter((t) => t.completedAt !== null).map((t) => t.id);
  const rework = reworkRate(completedIds, data.events);

  const aging = agingWip(data.openTasks).slice(0, 40);

  const weeks = nextWeekStarts(day, 4);
  const capacity = capacityGrid(
    data.people.map((p) => ({
      id: p.id,
      name: p.name,
      weeklyCapacityHours: p.weeklyCapacityHours,
    })),
    data.capacityTasks,
    weeks,
    data.absences,
  );

  const overloaded = capacity.filter((row) => row.cells.some((cell) => cell.ratio > 1));

  const blockedTasks = data.overviews.flatMap((o) =>
    o.blockedCount > 0 ? [{ project: o.project.title, count: o.blockedCount }] : [],
  );

  const avgCycle = cycle.reduce(
    (acc, row) => (row.average === null ? acc : acc + row.average * row.count),
    0,
  );
  const cycleCount = cycle.reduce((acc, row) => acc + row.count, 0);

  return (
    <>
      <dl className="tiles" style={{ marginBottom: 22 }}>
        <div className="tile">
          <dt>Em andamento (WIP)</dt>
          <dd>{wip}</dd>
        </div>
        <div className={`tile ${lateTasks > 0 ? "is-crit" : "is-ok"}`}>
          <dt>Tarefas atrasadas</dt>
          <dd>{lateTasks}</dd>
        </div>
        <div className={`tile ${blocked > 0 ? "is-crit" : "is-ok"}`}>
          <dt>Bloqueios ativos</dt>
          <dd>{blocked}</dd>
        </div>
        <div className="tile">
          <dt>Cycle time médio</dt>
          <dd>{cycleCount === 0 ? "—" : daysFmt(avgCycle / cycleCount)}</dd>
          <p className="hint">Da entrada em execução à conclusão</p>
        </div>
        <div className={`tile ${rework !== null && rework > 0.2 ? "is-warn" : ""}`}>
          <dt>Retrabalho</dt>
          <dd>{pct(rework)}</dd>
          <p className="hint">Voltou de “em revisão” para “em execução”</p>
        </div>
        <div className={`tile ${overloaded.length > 0 ? "is-warn" : "is-ok"}`}>
          <dt>Acima da capacidade</dt>
          <dd>{overloaded.length}</dd>
          <p className="hint">Pessoas nas próximas 4 semanas</p>
        </div>
      </dl>

      <section className="section">
        <div className="section-head">
          <h2>G1 — Carga por pessoa × semana</h2>
          <span className="count">Quem vai estourar nas próximas 4 semanas?</span>
        </div>
        <div className="tablewrap">
          <table className="heat">
            <thead>
              <tr>
                <th>Pessoa</th>
                {weeks.map((week) => (
                  <th key={week} className="num">
                    {formatDay(week).slice(0, 5)}
                  </th>
                ))}
                <th className="num">Capacidade</th>
              </tr>
            </thead>
            <tbody>
              {capacity.map((row) => {
                const person = data.people.find((p) => p.id === row.personId);
                return (
                  <tr key={row.personId}>
                    <td className="name">{row.personName}</td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.weekStart}
                        className={
                          cell.allocated === 0
                            ? "h0"
                            : cell.ratio > 1
                              ? "h3"
                              : cell.ratio > 0.8
                                ? "h2"
                                : "h1"
                        }
                        title={`${row.personName} · semana de ${formatDay(cell.weekStart)}: ${Math.round(cell.allocated)}h de ${Math.round(cell.capacity)}h`}
                      >
                        {cell.allocated === 0 ? "—" : `${Math.round(cell.allocated)}h`}
                      </td>
                    ))}
                    <td className="num muted">{person?.weeklyCapacityHours ?? 30}h/sem</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="foot" style={{ marginTop: 8 }}>
          A tarefa pesa na semana do seu prazo. Vermelho é alocação acima da capacidade — é
          pauta obrigatória do weekly, não um detalhe. Férias e ausências já reduzem a
          capacidade da semana.
        </p>
      </section>

      <div className="grid cols-2" style={{ marginBottom: 16 }}>
        <Viz
          id="G2"
          name="Fluxo acumulado — 60 dias"
          ask="O trabalho está fluindo ou empoçando?"
          foot="A faixa “em revisão” engordando denuncia gargalo de aprovação, não de execução."
        >
          <>
            <StackedArea
              days={days}
              series={flowOrder.map((status) => ({
                label: taskStatusLabel(status),
                color: flowColor[status]!,
                values: flow.map((f) => f.counts[status]),
              }))}
            />
            <Legend
              items={flowOrder.map((status) => ({
                label: taskStatusLabel(status),
                color: flowColor[status]!,
              }))}
            />
          </>
        </Viz>

        <Viz
          id="G3"
          name="Envelhecimento do trabalho em andamento"
          ask="O que está parado há tempo demais?"
          table={{
            head: ["Tarefa", "Dias em aberto", "Status"],
            rows: aging
              .slice(0, 12)
              .map((p) => [p.title, p.days, taskStatusLabel(p.status)]),
          }}
          foot="Cada ponto é uma tarefa. A linha marca 10 dias — passou disso, ou é grande demais ou está esquecida."
        >
          {aging.length === 0 ? (
            <NoData>Nada em andamento.</NoData>
          ) : (
            <AgingPlot
              alertDays={10}
              points={aging.map((p) => ({
                label: `${p.title} (${p.assignee})`,
                days: p.days,
                group: taskStatusLabel(p.status),
                color: flowColor[p.status]!,
              }))}
            />
          )}
        </Viz>

        <Viz
          id="G4"
          name="Cycle time por tipo de trabalho"
          ask="Quanto tempo leva cada tipo de trabalho?"
          table={{
            head: ["Tipo", "Tarefas", "Média", "P85"],
            rows: cycle.map((c) => [
              c.label,
              c.count,
              c.average === null ? "—" : daysFmt(c.average),
              c.p85 === null ? "—" : daysFmt(c.p85),
            ]),
          }}
          foot="O P85 é o número que serve para prometer prazo — a média deixa uma em cada duas promessas furar."
        >
          {cycleCount === 0 ? (
            <NoData>Nenhuma tarefa concluída ainda.</NoData>
          ) : (
            <BarsWithMarker
              rows={cycle.map((c) => ({
                label: c.label,
                value: c.average ?? 0,
                marker: c.p85,
                count: c.count,
              }))}
              format={daysFmt}
            />
          )}
        </Viz>

        <Viz
          id="G7"
          name="Onde estão os bloqueios"
          ask="O que trava o time repetidamente?"
          table={{
            head: ["Projeto", "Tarefas bloqueadas"],
            rows: blockedTasks.map((b) => [b.project, b.count]),
          }}
        >
          {blockedTasks.length === 0 ? (
            <NoData>Nenhum bloqueio ativo.</NoData>
          ) : (
            <GroupedBars
              rows={blockedTasks.map((b) => ({ label: b.project, values: [b.count] }))}
              series={[{ label: "Bloqueadas", color: "var(--crit)" }]}
              format={(value) => String(Math.round(value))}
            />
          )}
        </Viz>
      </div>

      <div className="grid cols-2">
        <div className="pending">
          <b>G5 — Fila e SLA de design</b> e <b>G6 — Origem das demandas</b> ainda não têm dado.
          Os dois dependem do módulo de intake (formulário de solicitação, fila e relógio de
          SLA), que é a próxima entrega do roadmap. Preferimos deixar o espaço vazio a
          preencher com número inventado.
        </div>
        <div className="pending">
          <b>G8 — Retrabalho</b> já aparece como indicador no topo desta aba; a série mensal
          entra quando houver três meses de histórico com dado real — antes disso a linha
          diria mais sobre o seed do que sobre o time.
        </div>
      </div>
    </>
  );
}

/* ========================== ABA INDIVIDUAL ============================= */

async function Individual({
  userId,
  data,
  day,
}: {
  userId: string;
  data: Awaited<ReturnType<typeof loadReportData>>;
  day: string;
}) {
  const stats = await loadPersonStats(userId);
  const person = data.people.find((p) => p.id === userId);
  const weeks = nextWeekStarts(day, 4);

  const myCapacity = capacityGrid(
    person
      ? [{ id: person.id, name: person.name, weeklyCapacityHours: person.weeklyCapacityHours }]
      : [],
    data.capacityTasks,
    weeks,
    data.absences,
  )[0];

  const myProjects = data.overviews.filter((o) => o.project.ownerId === userId);
  const myInitiatives = data.initiatives.filter((i) => i.initiative.ownerId === userId);

  return (
    <>
      <div className="notice">
        <b>Esta aba é para conversa, não para ranking.</b> Ela existe para o one-on-one e para
        a retrospectiva. Não há — e não haverá — tela de comparação entre pessoas: ferramenta
        de gestão que vira placar público faz o time parar de registrar o trabalho real.
      </div>

      <dl className="tiles" style={{ marginBottom: 22 }}>
        <div className="tile">
          <dt>Em aberto</dt>
          <dd>{stats.open}</dd>
        </div>
        <div className={`tile ${stats.late > 0 ? "is-crit" : "is-ok"}`}>
          <dt>Atrasadas</dt>
          <dd>{stats.late}</dd>
        </div>
        <div className="tile">
          <dt>Concluídas</dt>
          <dd>{stats.completed}</dd>
        </div>
        <div className="tile is-ok">
          <dt>No prazo</dt>
          <dd>
            {stats.completed === 0 ? "—" : pct(stats.onTime / stats.completed)}
          </dd>
        </div>
        <div className="tile">
          <dt>Capacidade</dt>
          <dd>{person?.weeklyCapacityHours ?? 30}<small>h/sem</small></dd>
        </div>
      </dl>

      <section className="section">
        <div className="section-head">
          <h2>Minha carga nas próximas 4 semanas</h2>
        </div>
        {myCapacity ? (
          <div className="tablewrap">
            <table className="heat">
              <thead>
                <tr>
                  {myCapacity.cells.map((cell) => (
                    <th key={cell.weekStart} className="num">
                      semana de {formatDay(cell.weekStart).slice(0, 5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {myCapacity.cells.map((cell) => (
                    <td
                      key={cell.weekStart}
                      className={
                        cell.allocated === 0
                          ? "h0"
                          : cell.ratio > 1
                            ? "h3"
                            : cell.ratio > 0.8
                              ? "h2"
                              : "h1"
                      }
                    >
                      {Math.round(cell.allocated)}h de {Math.round(cell.capacity)}h
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <NoData>Sem dados de capacidade.</NoData>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>O que eu conduzo</h2>
          <span className="count">
            {myProjects.length} projeto(s) · {myInitiatives.length} iniciativa(s)
          </span>
        </div>
        {myProjects.length === 0 && myInitiatives.length === 0 ? (
          <p className="empty">Você não é owner de nenhum projeto ou iniciativa no momento.</p>
        ) : (
          <div className="rows">
            {myProjects.map((item) => (
              <div className="row" key={item.project.id}>
                <div className="grow">
                  <Link className="title" href={`/projetos/${item.project.slug}`}>
                    {item.project.title}
                  </Link>
                  <div className="meta">
                    <span>{Math.round(item.progress * 100)}% concluído</span>
                    <span>{item.health.reasons[0]}</span>
                  </div>
                </div>
                <Farol health={item.health.health} />
              </div>
            ))}
            {myInitiatives.map((item) => (
              <div className="row" key={item.initiative.id}>
                <div className="grow">
                  <Link className="title" href={`/iniciativas/${item.initiative.slug}`}>
                    {item.initiative.title}
                  </Link>
                  <div className="meta">
                    <span>cadência {item.initiative.cadence}</span>
                    <span>
                      {item.lastCheckinOn
                        ? `último check-in em ${formatDay(item.lastCheckinOn)}`
                        : "sem check-in"}
                    </span>
                  </div>
                </div>
                {item.overdue ? (
                  <span className="chip late">check-in atrasado</span>
                ) : (
                  <span className="chip st-concluida">em dia</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
