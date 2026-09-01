import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  listActiveParents,
  listPeople,
  loadMyTasks,
  loadPendingCheckins,
  loadPersonStats,
  loadProjectOverviews,
  type TaskWithParent,
} from "@/lib/queries";
import { daysBetween, endOfWeek, formatDay, today } from "@/lib/domain/dates";
import { nextTaskStatuses } from "@/lib/domain/rules";
import { DueChip, Farol, ParentLink, PriorityChip, StatusChip } from "@/components/ui";
import { NewTask, TaskMove } from "@/components/forms";

export const dynamic = "force-dynamic";

/** A tela de abertura do time: o que é meu, o que venceu, o que trava. */
export default async function MinhaSemanaPage() {
  const user = await requireUser();
  const day = today();

  const [myTasks, pendingCheckins, overviews, stats, people, parents] = await Promise.all([
    loadMyTasks(user.id),
    loadPendingCheckins(user.id),
    loadProjectOverviews({ statuses: ["aprovado", "em_execucao", "em_revisao"] }),
    loadPersonStats(user.id),
    listPeople(),
    listActiveParents(),
  ]);

  const weekEnd = endOfWeek(day);

  const blocked = myTasks.filter((t) => t.status === "bloqueada");
  const rest = myTasks.filter((t) => t.status !== "bloqueada");
  const late = rest.filter((t) => t.dueDate !== null && daysBetween(t.dueDate, day) > 0);
  const dueToday = rest.filter((t) => t.dueDate === day);
  const thisWeek = rest.filter(
    (t) =>
      t.dueDate !== null &&
      daysBetween(day, t.dueDate) > 0 &&
      daysBetween(t.dueDate, weekEnd) >= 0,
  );
  const later = rest.filter(
    (t) => t.dueDate === null || daysBetween(weekEnd, t.dueDate) > 0,
  );

  const myProjects = overviews.filter((o) => o.project.ownerId === user.id);

  return (
    <main className="page">
      <div className="pagehead">
        <div>
          <p className="eyebrow">{formatDay(day)}</p>
          <h1>Minha Semana</h1>
          <p className="sub">
            {user.name.split(" ")[0]}, você tem {myTasks.length} tarefa(s) em aberto.
          </p>
        </div>
      </div>

      <dl className="tiles" style={{ marginBottom: 26 }}>
        <div className={`tile ${late.length > 0 ? "is-crit" : ""}`}>
          <dt>Atrasadas</dt>
          <dd>{late.length}</dd>
        </div>
        <div className={`tile ${dueToday.length > 0 ? "is-warn" : ""}`}>
          <dt>Vencem hoje</dt>
          <dd>{dueToday.length}</dd>
        </div>
        <div className="tile">
          <dt>Esta semana</dt>
          <dd>{thisWeek.length}</dd>
        </div>
        <div className={`tile ${blocked.length > 0 ? "is-crit" : ""}`}>
          <dt>Bloqueadas</dt>
          <dd>{blocked.length}</dd>
        </div>
        <div className="tile is-ok">
          <dt>Concluídas no prazo</dt>
          <dd>
            {stats.completed === 0 ? "—" : `${Math.round((stats.onTime / stats.completed) * 100)}%`}
            <small>de {stats.completed}</small>
          </dd>
        </div>
      </dl>

      <div className="section">
        <NewTask people={people} parents={parents} />
      </div>

      <Bucket
        title="Atrasadas"
        tone="crit"
        tasks={late}
        people={people}
        day={day}
        emptyText="Nada atrasado. É o estado normal — mantenha assim."
      />
      <Bucket
        title="Bloqueadas"
        tone="crit"
        tasks={blocked}
        people={people}
        day={day}
        emptyText="Sem bloqueios no seu nome."
      />
      <Bucket
        title="Vencem hoje"
        tone="warn"
        tasks={dueToday}
        people={people}
        day={day}
        emptyText="Nada vence hoje."
      />
      <Bucket
        title="Ainda esta semana"
        tasks={thisWeek}
        people={people}
        day={day}
        emptyText="Nada mais vence até domingo."
      />
      <Bucket
        title="Depois desta semana"
        tasks={later}
        people={people}
        day={day}
        emptyText="Sem tarefas futuras atribuídas a você."
      />

      {pendingCheckins.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <h2>Check-ins que estão com você</h2>
            <span className="count">{pendingCheckins.length}</span>
          </div>
          <div className="rows">
            {pendingCheckins.map((item) => (
              <div className="row" key={item.initiative.id}>
                <div className="grow">
                  <Link className="title" href={`/iniciativas/${item.initiative.slug}`}>
                    {item.initiative.title}
                  </Link>
                  <div className="meta">
                    <span>cadência {item.initiative.cadence}</span>
                    <span>
                      {item.lastCheckinOn
                        ? `último check-in há ${item.daysSinceCheckin} dias`
                        : "nenhum check-in registrado"}
                    </span>
                  </div>
                </div>
                <Link className="btn ghost small" href={`/iniciativas/${item.initiative.slug}`}>
                  Fazer check-in
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {myProjects.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <h2>Projetos que você conduz</h2>
            <span className="count">{myProjects.length}</span>
          </div>
          <div className="rows">
            {myProjects.map((item) => (
              <div className="row" key={item.project.id}>
                <div className="grow">
                  <Link className="title" href={`/projetos/${item.project.slug}`}>
                    {item.project.title}
                  </Link>
                  <div className="meta">
                    <span>{Math.round(item.progress * 100)}% concluído</span>
                    {item.nextMilestone ? (
                      <span>
                        próximo marco: {item.nextMilestone.title} ·{" "}
                        {formatDay(item.nextMilestone.dueDate)}
                      </span>
                    ) : null}
                    <span>
                      {item.lastStatusUpdateOn
                        ? `status há ${daysBetween(item.lastStatusUpdateOn, day)} dias`
                        : "sem atualização de status"}
                    </span>
                  </div>
                </div>
                <Farol health={item.health.health} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Bucket({
  title,
  tasks,
  people,
  day,
  emptyText,
  tone,
}: {
  title: string;
  tasks: TaskWithParent[];
  people: Awaited<ReturnType<typeof listPeople>>;
  day: string;
  emptyText: string;
  tone?: "crit" | "warn";
}) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 style={tone ? { color: `var(--${tone})` } : undefined}>{title}</h2>
        <span className="count">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <div className="rows">
          {tasks.map((task) => (
            <div className="row" key={task.id}>
              <div className="grow">
                <p className="title">{task.title}</p>
                <div className="meta">
                  <ParentLink
                    kind={task.parentKind}
                    slug={task.parentSlug}
                    title={task.parentTitle}
                  />
                  <StatusChip status={task.status} />
                  <PriorityChip priority={task.priority} />
                  <DueChip dueDate={task.dueDate} today={day} />
                </div>
                {task.blockedReason ? (
                  <p className="meta" style={{ color: "var(--crit)" }}>
                    {task.blockedReason}
                  </p>
                ) : null}
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
  );
}
