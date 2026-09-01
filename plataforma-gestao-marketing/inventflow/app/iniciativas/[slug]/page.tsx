import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { listPeople, loadInitiative } from "@/lib/queries";
import { daysBetween, formatDay, today } from "@/lib/domain/dates";
import { nextTaskStatuses } from "@/lib/domain/rules";
import { DueChip, PortfolioTag, StatusChip } from "@/components/ui";
import { CheckinForm, NewTask, TaskMove } from "@/components/forms";
import { LineChart, Viz } from "@/components/charts";

export const dynamic = "force-dynamic";

const CADENCE_LABEL: Record<string, string> = {
  diaria: "diária",
  semanal: "semanal",
  quinzenal: "quinzenal",
  mensal: "mensal",
};

export default async function IniciativaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const initiative = await loadInitiative(slug);
  if (!initiative) notFound();

  const day = today();
  const people = await listPeople();
  const openTasks = initiative.tasks.filter((t) => t.status !== "concluida");
  const history = [...initiative.checkins].reverse();
  const target =
    initiative.targetValue === null ? null : Number(initiative.targetValue);

  return (
    <main className="page">
      <div className="pagehead">
        <div>
          <p className="eyebrow">
            <PortfolioTag
              name={initiative.portfolio.name}
              colorIndex={initiative.portfolio.colorIndex}
            />
          </p>
          <h1>{initiative.title}</h1>
          <p className="sub">{initiative.description}</p>
        </div>
      </div>

      <dl className="tiles" style={{ marginBottom: 24 }}>
        <div className="tile">
          <dt>Cadência</dt>
          <dd style={{ fontSize: 17 }}>{CADENCE_LABEL[initiative.cadence]}</dd>
        </div>
        <div className="tile">
          <dt>Owner</dt>
          <dd style={{ fontSize: 17 }}>{initiative.owner.name}</dd>
        </div>
        <div className="tile">
          <dt>Indicador</dt>
          <dd style={{ fontSize: 17 }}>{initiative.indicatorName}</dd>
          <p className="hint">
            meta {initiative.targetValue ?? "—"} {initiative.indicatorUnit}
          </p>
        </div>
        <div className="tile">
          <dt>Último check-in</dt>
          <dd style={{ fontSize: 17 }}>
            {initiative.checkins[0]
              ? `há ${daysBetween(initiative.checkins[0].periodEnd, day)}d`
              : "nunca"}
          </dd>
        </div>
        <div className="tile">
          <dt>Tarefas em aberto</dt>
          <dd>{openTasks.length}</dd>
        </div>
      </dl>

      <div className="grid cols-2" style={{ marginBottom: 26 }}>
        <Viz
          id="Indicador"
          name={`${initiative.indicatorName} por período`}
          ask="A rotina está rendendo o que se combinou?"
          table={{
            head: ["Período", initiative.indicatorUnit],
            rows: history.map((c) => [
              formatDay(c.periodEnd),
              c.indicatorValue === null ? "—" : Number(c.indicatorValue),
            ]),
          }}
          foot={
            target !== null
              ? `A linha verde é a meta de ${target} ${initiative.indicatorUnit} por período.`
              : undefined
          }
        >
          {history.length < 2 ? (
            <p className="pending">
              Ainda não há série suficiente. A partir do segundo check-in o gráfico aparece.
            </p>
          ) : (
            <LineChart
              points={history.map((c) => ({
                label: formatDay(c.periodEnd).slice(0, 5),
                value: c.indicatorValue === null ? null : Number(c.indicatorValue),
              }))}
              target={target !== null ? { value: target, label: "meta" } : undefined}
              format={(value) => String(Math.round(value * 10) / 10)}
            />
          )}
        </Viz>

        <div className="card card-pad">
          <CheckinForm
            initiativeId={initiative.id}
            indicatorName={initiative.indicatorName}
            indicatorUnit={initiative.indicatorUnit}
            target={initiative.targetValue}
          />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
            Três campos, cadência {CADENCE_LABEL[initiative.cadence]}. Se levar mais de cinco
            minutos, o formulário está errado — avise a coordenação.
          </p>
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Tarefas</h2>
          <span className="count">
            {openTasks.length} em aberto de {initiative.tasks.length}
          </span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <NewTask
            people={people}
            parents={{ projects: [], initiatives: [] }}
            fixedParent={{
              kind: "iniciativa",
              id: initiative.id,
              title: initiative.title,
            }}
          />
        </div>

        {openTasks.length === 0 ? (
          <p className="empty">Nenhuma tarefa em aberto nesta iniciativa.</p>
        ) : (
          <div className="rows">
            {openTasks.map((task) => (
              <div className="row" key={task.id}>
                <div className="grow">
                  <p className="title">{task.title}</p>
                  <div className="meta">
                    <span>{task.assignee?.name ?? "sem responsável"}</span>
                    <StatusChip status={task.status} />
                    <DueChip dueDate={task.dueDate} today={day} />
                  </div>
                </div>
                <TaskMove
                  taskId={task.id}
                  status={task.status}
                  next={nextTaskStatuses(task.status)}
                  people={people}
                  hasAssignee={task.assigneeId !== null}
                  hasDueDate={task.dueDate !== null}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Check-ins</h2>
          <span className="count">{initiative.checkins.length}</span>
        </div>
        {initiative.checkins.length === 0 ? (
          <p className="empty">Nenhum check-in registrado ainda.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="num">{initiative.indicatorName}</th>
                  <th>O que rodou</th>
                  <th>O que travou</th>
                  <th>Autor</th>
                </tr>
              </thead>
              <tbody>
                {initiative.checkins.slice(0, 14).map((checkin) => (
                  <tr key={checkin.id}>
                    <td className="mono tnum">
                      {formatDay(checkin.periodStart)} – {formatDay(checkin.periodEnd)}
                    </td>
                    <td className="num">
                      {checkin.indicatorValue === null
                        ? "—"
                        : `${Number(checkin.indicatorValue)} ${initiative.indicatorUnit}`}
                    </td>
                    <td>{checkin.whatRan}</td>
                    <td className={checkin.whatBlocked ? "" : "muted"}>
                      {checkin.whatBlocked || "—"}
                    </td>
                    <td>{checkin.author.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
