import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listPortfolios, loadProjectOverviews } from "@/lib/queries";
import { daysBetween, formatDay, today } from "@/lib/domain/dates";
import { projectStatusLabel } from "@/lib/domain/rules";
import { Farol, PortfolioTag, Progress } from "@/components/ui";

export const dynamic = "force-dynamic";

const ACTIVE = ["aprovado", "em_execucao", "em_revisao"] as const;

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ pilar?: string; ver?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const day = today();

  const [overviews, portfolios] = await Promise.all([
    loadProjectOverviews(),
    listPortfolios(),
  ]);

  const showAll = params.ver === "todos";
  const byStatus = showAll
    ? overviews
    : overviews.filter((o) => (ACTIVE as readonly string[]).includes(o.project.status));
  const visible = params.pilar
    ? byStatus.filter((o) => o.portfolio.slug === params.pilar)
    : byStatus;

  const active = visible.filter((o) => (ACTIVE as readonly string[]).includes(o.project.status));
  const counts = {
    verde: active.filter((o) => o.health.health === "verde").length,
    amarelo: active.filter((o) => o.health.health === "amarelo").length,
    vermelho: active.filter((o) => o.health.health === "vermelho").length,
  };

  return (
    <main className="page">
      <div className="pagehead">
        <div>
          <p className="eyebrow">Projetos — têm início, meio e fim</p>
          <h1>Portfólio</h1>
          <p className="sub">
            {active.length} projeto(s) em andamento
            {showAll ? ` · ${visible.length} no total, incluindo encerrados` : ""}.
          </p>
        </div>
        <div className="actions">
          <Link
            className="btn ghost small"
            href={showAll ? pathWith(params, { ver: undefined }) : pathWith(params, { ver: "todos" })}
          >
            {showAll ? "Ver só os ativos" : "Incluir encerrados"}
          </Link>
        </div>
      </div>

      <dl className="tiles" style={{ marginBottom: 22 }}>
        <div className="tile is-ok">
          <dt>Verde</dt>
          <dd>{counts.verde}</dd>
          <p className="hint">Sem sinal de risco</p>
        </div>
        <div className="tile is-warn">
          <dt>Amarelo</dt>
          <dd>{counts.amarelo}</dd>
          <p className="hint">Marco em risco, silêncio ou atrasos</p>
        </div>
        <div className="tile is-crit">
          <dt>Vermelho</dt>
          <dd>{counts.vermelho}</dd>
          <p className="hint">Marco vencido, bloqueio longo ou status parado</p>
        </div>
        <div className="tile">
          <dt>Marcos em 30 dias</dt>
          <dd>
            {active.filter(
              (o) =>
                o.nextMilestone !== null &&
                daysBetween(day, o.nextMilestone.dueDate) >= 0 &&
                daysBetween(day, o.nextMilestone.dueDate) <= 30,
            ).length}
          </dd>
        </div>
      </dl>

      <nav className="tabs" style={{ marginBottom: 20 }}>
        <Link
          href={pathWith(params, { pilar: undefined })}
          aria-current={params.pilar ? undefined : "page"}
        >
          Todos os pilares
        </Link>
        {portfolios.map((portfolio) => (
          <Link
            key={portfolio.id}
            href={pathWith(params, { pilar: portfolio.slug })}
            aria-current={params.pilar === portfolio.slug ? "page" : undefined}
          >
            {portfolio.name}
          </Link>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="empty">Nenhum projeto neste recorte.</p>
      ) : (
        <div className="grid cols-2">
          {visible.map((item) => {
            const tracked = (ACTIVE as readonly string[]).includes(item.project.status);
            return (
              <article
                key={item.project.id}
                className={`project-card ${tracked ? `stripe-${item.health.health}` : "stripe-neutro"}`}
              >
                <div className="top">
                  <Link className="name" href={`/projetos/${item.project.slug}`}>
                    {item.project.title}
                  </Link>
                  {tracked ? (
                    <Farol health={item.health.health} />
                  ) : (
                    <span className="chip">{projectStatusLabel(item.project.status)}</span>
                  )}
                </div>

                <div className="facts">
                  <PortfolioTag
                    name={item.portfolio.name}
                    colorIndex={item.portfolio.colorIndex}
                  />
                  <span>{item.owner.name}</span>
                  {item.project.dueDate ? (
                    <span className="tnum">
                      alvo {formatDay(item.project.dueDate)}
                      {item.project.baselineDueDate &&
                      item.project.baselineDueDate !== item.project.dueDate
                        ? " (replanejado)"
                        : ""}
                    </span>
                  ) : null}
                </div>

                <Progress ratio={item.progress} />

                <div className="facts">
                  <span>{Math.round(item.progress * 100)}% concluído</span>
                  <span>{item.taskCount} tarefas</span>
                  {item.lateCount > 0 ? (
                    <span style={{ color: "var(--crit)" }}>{item.lateCount} atrasadas</span>
                  ) : null}
                  {item.blockedCount > 0 ? (
                    <span style={{ color: "var(--crit)" }}>{item.blockedCount} bloqueadas</span>
                  ) : null}
                </div>

                {item.nextMilestone ? (
                  <div className="facts">
                    <span>
                      próximo marco: <strong>{item.nextMilestone.title}</strong> ·{" "}
                      {formatDay(item.nextMilestone.dueDate)}
                    </span>
                  </div>
                ) : null}

                {tracked ? (
                  <p className="reason">
                    {item.health.reasons[0]}
                    {item.health.overridden ? " · farol sobrescrito pelo owner" : ""}
                  </p>
                ) : item.project.stopReason ? (
                  <p className="reason">{item.project.stopReason}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

function pathWith(
  current: { pilar?: string; ver?: string },
  changes: { pilar?: string | undefined; ver?: string | undefined },
): string {
  const next = { ...current, ...changes };
  const search = new URLSearchParams();
  if (next.pilar) search.set("pilar", next.pilar);
  if (next.ver) search.set("ver", next.ver);
  const query = search.toString();
  return query ? `/portfolio?${query}` : "/portfolio";
}
