import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { loadInitiativeOverviews } from "@/lib/queries";
import { formatDay } from "@/lib/domain/dates";
import { PortfolioTag } from "@/components/ui";
import { Sparkline } from "@/components/charts";

export const dynamic = "force-dynamic";

const CADENCE_LABEL: Record<string, string> = {
  diaria: "diária",
  semanal: "semanal",
  quinzenal: "quinzenal",
  mensal: "mensal",
};

export default async function IniciativasPage() {
  await requireUser();
  const items = await loadInitiativeOverviews();

  const active = items.filter((i) => i.initiative.status === "ativa");
  const others = items.filter((i) => i.initiative.status !== "ativa");
  const late = active.filter((i) => i.overdue);

  return (
    <main className="page">
      <div className="pagehead">
        <div>
          <p className="eyebrow">Iniciativas — contínuas, sem data de fim</p>
          <h1>Iniciativas</h1>
          <p className="sub">
            {active.length} rodando em cadência. A pergunta aqui não é “entregou?”, é “está
            rodando e rendendo?”.
          </p>
        </div>
      </div>

      <dl className="tiles" style={{ marginBottom: 24 }}>
        <div className="tile">
          <dt>Ativas</dt>
          <dd>{active.length}</dd>
        </div>
        <div className={`tile ${late.length > 0 ? "is-warn" : "is-ok"}`}>
          <dt>Check-in atrasado</dt>
          <dd>{late.length}</dd>
          <p className="hint">Passou de 1,5× a cadência combinada</p>
        </div>
        <div className="tile">
          <dt>Aderência</dt>
          <dd>
            {active.length === 0
              ? "—"
              : `${Math.round(((active.length - late.length) / active.length) * 100)}%`}
          </dd>
          <p className="hint">Check-ins em dia</p>
        </div>
        <div className="tile">
          <dt>Tarefas em aberto</dt>
          <dd>{active.reduce((sum, i) => sum + i.openTasks, 0)}</dd>
        </div>
      </dl>

      <section className="section">
        <div className="section-head">
          <h2>Em operação</h2>
          <span className="count">{active.length}</span>
        </div>
        <div className="rows">
          {active.map((item) => (
            <div className="row" key={item.initiative.id}>
              <div className="grow">
                <Link className="title" href={`/iniciativas/${item.initiative.slug}`}>
                  {item.initiative.title}
                </Link>
                <div className="meta">
                  <PortfolioTag
                    name={item.portfolio.name}
                    colorIndex={item.portfolio.colorIndex}
                  />
                  <span>{item.owner.name}</span>
                  <span>cadência {CADENCE_LABEL[item.initiative.cadence]}</span>
                  <span>{item.openTasks} tarefa(s) em aberto</span>
                </div>
              </div>

              <div style={{ minWidth: 150 }}>
                <p className="muted" style={{ fontSize: 11.5 }}>
                  {item.initiative.indicatorName} ({item.initiative.indicatorUnit})
                </p>
                <Sparkline
                  values={item.history.map((h) => h.value)}
                  target={
                    item.initiative.targetValue === null
                      ? null
                      : Number(item.initiative.targetValue)
                  }
                />
              </div>

              <div style={{ minWidth: 130, textAlign: "right" }}>
                {item.overdue ? (
                  <span className="chip late">check-in atrasado</span>
                ) : (
                  <span className="chip st-concluida">em dia</span>
                )}
                <p className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                  {item.lastCheckinOn
                    ? `último: ${formatDay(item.lastCheckinOn)}`
                    : "sem check-in"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {others.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <h2>Pausadas e encerradas</h2>
            <span className="count">{others.length}</span>
          </div>
          <div className="rows">
            {others.map((item) => (
              <div className="row" key={item.initiative.id}>
                <div className="grow">
                  <Link className="title" href={`/iniciativas/${item.initiative.slug}`}>
                    {item.initiative.title}
                  </Link>
                  <div className="meta">
                    <span>{item.initiative.status}</span>
                    {item.initiative.stopReason ? <span>{item.initiative.stopReason}</span> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
