import { notFound } from "next/navigation";
import { requireUser, canEditProject } from "@/lib/auth";
import { listPeople, loadProjectDetail } from "@/lib/queries";
import { daysBetween, formatDay, today } from "@/lib/domain/dates";
import {
  TASK_BOARD_ORDER,
  nextProjectStatuses,
  nextTaskStatuses,
  projectStatusLabel,
  taskStatusLabel,
} from "@/lib/domain/rules";
import { DueChip, Farol, PortfolioTag, PriorityChip, Progress } from "@/components/ui";
import {
  MilestoneDone,
  NewTask,
  ProjectStatusChange,
  StatusUpdateForm,
  TaskMove,
} from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function ProjetoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const detail = await loadProjectDetail(slug);
  if (!detail) notFound();

  const day = today();
  const people = await listPeople();
  const editable = canEditProject(user, detail.project);
  const replanned =
    detail.project.baselineDueDate !== null &&
    detail.project.dueDate !== null &&
    detail.project.baselineDueDate !== detail.project.dueDate;

  return (
    <main className="page">
      <div className="pagehead">
        <div>
          <p className="eyebrow">
            <PortfolioTag
              name={detail.portfolio.name}
              colorIndex={detail.portfolio.colorIndex}
            />
          </p>
          <h1>{detail.project.title}</h1>
          <p className="sub">{detail.project.objective}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <Farol health={detail.health.health} />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 6, maxWidth: 280 }}>
            {detail.health.reasons[0]}
          </p>
        </div>
      </div>

      {detail.health.overridden ? (
        <div className="notice">
          <b>Farol sobrescrito.</b> O owner declarou {detail.health.health} enquanto o cálculo
          aponta {detail.health.computed}. Essa divergência aparece no relatório executivo.
        </div>
      ) : null}

      {detail.project.stopReason ? (
        <div className="notice">
          <b>{projectStatusLabel(detail.project.status)}.</b> {detail.project.stopReason}
        </div>
      ) : null}

      <dl className="tiles" style={{ marginBottom: 24 }}>
        <div className="tile">
          <dt>Status</dt>
          <dd style={{ fontSize: 17 }}>{projectStatusLabel(detail.project.status)}</dd>
        </div>
        <div className="tile">
          <dt>Owner</dt>
          <dd style={{ fontSize: 17 }}>{detail.owner.name}</dd>
        </div>
        <div className="tile">
          <dt>Data-alvo</dt>
          <dd style={{ fontSize: 17 }} className="tnum">
            {formatDay(detail.project.dueDate)}
          </dd>
          {replanned ? (
            <p className="hint">
              Baseline: {formatDay(detail.project.baselineDueDate)} — replanejado em{" "}
              {daysBetween(detail.project.baselineDueDate!, detail.project.dueDate!)} dias
            </p>
          ) : (
            <p className="hint">Baseline da aprovação, não reescrita</p>
          )}
        </div>
        <div className="tile">
          <dt>Progresso</dt>
          <dd>{Math.round(detail.progress * 100)}%</dd>
          <p className="hint">
            {detail.taskList.filter((t) => t.status === "concluida").length} de{" "}
            {detail.taskCount} tarefas
          </p>
        </div>
        <div className={`tile ${detail.lateCount > 0 ? "is-crit" : ""}`}>
          <dt>Atrasadas</dt>
          <dd>{detail.lateCount}</dd>
        </div>
        <div className="tile">
          <dt>Último status</dt>
          <dd style={{ fontSize: 17 }}>
            {detail.lastStatusUpdateOn
              ? `há ${daysBetween(detail.lastStatusUpdateOn, day)}d`
              : "nunca"}
          </dd>
          <p className="hint">Atualização semanal do owner</p>
        </div>
      </dl>

      <div className="grid cols-2" style={{ marginBottom: 26 }}>
        <div className="card card-pad">
          <Progress ratio={detail.progress} />
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            Motivos do farol: {detail.health.reasons.join(" ")}
          </p>
        </div>
        <div className="card card-pad">
          {editable ? (
            <>
              <StatusUpdateForm
                projectId={detail.project.id}
                computedHealth={detail.health.computed}
              />
              <ProjectStatusChange
                projectId={detail.project.id}
                status={detail.project.status}
                next={nextProjectStatuses(detail.project.status)}
                hasDueDate={detail.project.dueDate !== null}
              />
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              Este projeto é conduzido por {detail.owner.name}. Só o owner ou a coordenação
              atualizam status e prazo — comente com quem conduz em vez de editar.
            </p>
          )}
        </div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>Marcos</h2>
          <span className="count">
            {detail.milestoneList.filter((m) => m.status === "concluido").length} de{" "}
            {detail.milestoneList.length} concluídos
          </span>
        </div>
        {detail.milestoneList.length === 0 ? (
          <p className="empty">
            Este projeto não tem marcos. Sem marco não há como enxergar risco antes do prazo
            final chegar.
          </p>
        ) : (
          <div className="rows">
            {detail.milestoneList.map((milestone) => {
              const overdue =
                milestone.status === "pendente" && daysBetween(milestone.dueDate, day) > 0;
              return (
                <div className="row" key={milestone.id}>
                  <div className="grow">
                    <p className="title">{milestone.title}</p>
                    <div className="meta">
                      <span className="tnum">{formatDay(milestone.dueDate)}</span>
                      {milestone.actualDate ? (
                        <span style={{ color: "var(--ok)" }}>
                          concluído em {formatDay(milestone.actualDate)}
                          {daysBetween(milestone.actualDate, milestone.baselineDate) < 0
                            ? ` · ${Math.abs(daysBetween(milestone.baselineDate, milestone.actualDate))} dias após o planejado`
                            : " · no prazo"}
                        </span>
                      ) : overdue ? (
                        <span className="chip late">
                          vencido há {daysBetween(milestone.dueDate, day)}d
                        </span>
                      ) : (
                        <span className="muted">em {daysBetween(day, milestone.dueDate)} dias</span>
                      )}
                    </div>
                  </div>
                  {milestone.status === "pendente" && editable ? (
                    <MilestoneDone milestoneId={milestone.id} />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Quadro de tarefas</h2>
          <span className="count">{detail.taskCount} tarefas</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <NewTask
            people={people}
            parents={{ projects: [], initiatives: [] }}
            fixedParent={{
              kind: "projeto",
              id: detail.project.id,
              title: detail.project.title,
            }}
          />
        </div>

        <div className="board">
          {TASK_BOARD_ORDER.map((status) => {
            const columnTasks = detail.taskList.filter((t) => t.status === status);
            return (
              <div className="board-col" key={status}>
                <header>
                  <span>{taskStatusLabel(status)}</span>
                  <span className="tnum">{columnTasks.length}</span>
                </header>
                <div className="board-cards">
                  {columnTasks.map((task) => {
                    const overdue =
                      task.status !== "concluida" &&
                      task.dueDate !== null &&
                      daysBetween(task.dueDate, day) > 0;
                    return (
                      <article className={`tcard ${overdue ? "is-late" : ""}`} key={task.id}>
                        <p className="t">{task.title}</p>
                        <div className="m">
                          <span>{task.assigneeName ?? "sem responsável"}</span>
                          <PriorityChip priority={task.priority} />
                          <DueChip
                            dueDate={task.dueDate}
                            today={day}
                            done={task.status === "concluida"}
                          />
                        </div>
                        {task.blockedReason ? (
                          <p className="block-note">
                            {task.blockedReason}
                            {detail.blockedSince.get(task.id)
                              ? ` · há ${daysBetween(detail.blockedSince.get(task.id)!, day)} dias`
                              : ""}
                          </p>
                        ) : null}
                        <TaskMove
                          taskId={task.id}
                          status={task.status}
                          next={nextTaskStatuses(task.status)}
                          people={people}
                          hasAssignee={task.assigneeId !== null}
                          hasDueDate={task.dueDate !== null}
                        />
                      </article>
                    );
                  })}
                  {columnTasks.length === 0 ? (
                    <p className="muted" style={{ fontSize: 12.5 }}>
                      vazio
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Atualizações de status</h2>
          <span className="count">{detail.updates.length}</span>
        </div>
        {detail.updates.length === 0 ? (
          <p className="empty">
            Nenhuma atualização registrada. O farol amarela sozinho depois de 8 dias de
            silêncio — silêncio é sinal, não neutralidade.
          </p>
        ) : (
          <div className="rows">
            {detail.updates.map((update) => (
              <div className="row" key={update.id}>
                <div className="grow">
                  <p className="title" style={{ fontWeight: 400 }}>
                    {update.summary}
                  </p>
                  <div className="meta">
                    <span>{update.author}</span>
                    <span className="tnum">
                      {formatDay(update.at.toISOString().slice(0, 10))}
                    </span>
                  </div>
                </div>
                <Farol health={update.declaredHealth} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
