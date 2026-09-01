"use client";

import { useActionState, useState } from "react";
import type { Health, Person, ProjectStatus, TaskStatus } from "@/db/schema";
import { emptyState } from "@/lib/action-state";
import {
  criarTarefa,
  concluirMarco,
  moverTarefa,
  mudarStatusProjeto,
  registrarCheckin,
  registrarStatus,
} from "@/app/actions";
import { projectStatusLabel, taskStatusLabel } from "@/lib/domain/rules";

function Errors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="errors" role="alert">
      <ul>
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------- mover tarefa ----------------------------- */

export function TaskMove({
  taskId,
  status,
  next,
  people,
  hasAssignee,
  hasDueDate,
}: {
  taskId: string;
  status: TaskStatus;
  next: TaskStatus[];
  people: Person[];
  hasAssignee: boolean;
  hasDueDate: boolean;
}) {
  const [state, action, pending] = useActionState(moverTarefa, emptyState);
  const [target, setTarget] = useState<TaskStatus | null>(null);

  // Os campos aparecem quando a transição escolhida vai exigi-los — a regra é
  // exigida na hora da transição, e não escondida atrás de um erro.
  const leavingBacklog = status === "a_fazer";
  const needsAssignee = leavingBacklog && !hasAssignee;
  const needsDueDate = leavingBacklog && !hasDueDate;
  const needsReason = target === "bloqueada";
  const showFields = needsReason || ((needsAssignee || needsDueDate) && target !== null);

  return (
    <form action={action} className="actions" style={{ width: "100%" }}>
      <input type="hidden" name="taskId" value={taskId} />
      <Errors errors={state.errors} />

      {showFields ? (
        <div style={{ width: "100%", marginBottom: 8 }}>
          {needsAssignee ? (
            <div className="field">
              <label htmlFor={`assignee-${taskId}`}>Responsável</label>
              <select id={`assignee-${taskId}`} name="assigneeId" defaultValue="">
                <option value="">Selecione</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {needsDueDate ? (
            <div className="field">
              <label htmlFor={`due-${taskId}`}>Prazo</label>
              <input id={`due-${taskId}`} type="date" name="dueDate" />
            </div>
          ) : null}
          {needsReason ? (
            <div className="field">
              <label htmlFor={`block-${taskId}`}>Motivo do bloqueio e quem destrava</label>
              <textarea
                id={`block-${taskId}`}
                name="blockedReason"
                placeholder="Ex.: aguardando aprovação da peça — Ana Ribeiro destrava."
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {next.map((to) => (
        <button
          key={to}
          className="ghost small"
          type="submit"
          name="to"
          value={to}
          disabled={pending}
          onClick={() => setTarget(to)}
        >
          {to === "concluida" ? "Concluir" : `→ ${taskStatusLabel(to)}`}
        </button>
      ))}
    </form>
  );
}

/* ----------------------------- nova tarefa ----------------------------- */

export function NewTask({
  people,
  parents,
  fixedParent,
}: {
  people: Person[];
  parents: { projects: { id: string; title: string }[]; initiatives: { id: string; title: string }[] };
  fixedParent?: { kind: "projeto" | "iniciativa"; id: string; title: string };
}) {
  const [state, action, pending] = useActionState(criarTarefa, emptyState);

  return (
    <details className="panel">
      <summary>Nova tarefa</summary>
      <div>
        <form action={action}>
          <Errors errors={state.errors} />
          {state.ok ? <p className="muted">Tarefa criada.</p> : null}

          <div className="field">
            <label htmlFor="task-title">O que precisa ser feito</label>
            <input id="task-title" type="text" name="title" required />
          </div>

          {fixedParent ? (
            <input type="hidden" name="parent" value={`${fixedParent.kind}:${fixedParent.id}`} />
          ) : (
            <div className="field">
              <label htmlFor="task-parent">Projeto ou iniciativa</label>
              <select id="task-parent" name="parent" required defaultValue="">
                <option value="" disabled>
                  Toda tarefa pertence a um dos dois
                </option>
                <optgroup label="Projetos">
                  {parents.projects.map((p) => (
                    <option key={p.id} value={`projeto:${p.id}`}>
                      {p.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Iniciativas">
                  {parents.initiatives.map((i) => (
                    <option key={i.id} value={`iniciativa:${i.id}`}>
                      {i.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          <div className="field-row">
            <div className="field">
              <label htmlFor="task-assignee">Responsável</label>
              <select id="task-assignee" name="assigneeId" defaultValue="">
                <option value="">Definir depois</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="task-due">Prazo</label>
              <input id="task-due" type="date" name="dueDate" />
            </div>
            <div className="field">
              <label htmlFor="task-estimate">Estimativa (h)</label>
              <input id="task-estimate" type="number" name="estimateHours" min="0.5" step="0.5" />
            </div>
            <div className="field">
              <label htmlFor="task-priority">Prioridade</label>
              <select id="task-priority" name="priority" defaultValue="p2">
                <option value="p0">P0 — para hoje, com custo</option>
                <option value="p1">P1 — este ciclo</option>
                <option value="p2">P2 — próximo ciclo</option>
                <option value="p3">P3 — quando couber</option>
              </select>
            </div>
          </div>

          <p className="muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Responsável, prazo e estimativa podem ficar para depois — mas a tarefa não sai
            de “A fazer” sem os dois primeiros.
          </p>

          <button type="submit" disabled={pending}>
            {pending ? "Criando…" : "Criar tarefa"}
          </button>
        </form>
      </div>
    </details>
  );
}

/* -------------------------- status do projeto -------------------------- */

export function StatusUpdateForm({
  projectId,
  computedHealth,
}: {
  projectId: string;
  computedHealth: Health;
}) {
  const [state, action, pending] = useActionState(registrarStatus, emptyState);
  const [declared, setDeclared] = useState<Health>(computedHealth);
  const [override, setOverride] = useState(false);

  const diverges = declared !== computedHealth;

  return (
    <details className="panel">
      <summary>Atualizar status da semana</summary>
      <div>
        <form action={action}>
          <input type="hidden" name="projectId" value={projectId} />
          <Errors errors={state.errors} />
          {state.ok ? <p className="muted">Status registrado.</p> : null}

          <div className="field">
            <label htmlFor="status-summary">Como está o projeto (duas linhas bastam)</label>
            <textarea id="status-summary" name="summary" required />
          </div>

          <div className="field">
            <label htmlFor="status-health">Farol declarado</label>
            <select
              id="status-health"
              name="declaredHealth"
              value={declared}
              onChange={(event) => setDeclared(event.target.value as Health)}
            >
              <option value="verde">Verde</option>
              <option value="amarelo">Amarelo</option>
              <option value="vermelho">Vermelho</option>
            </select>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>
              O sistema calculou <strong>{computedHealth}</strong> a partir de marcos, prazos e
              atualizações.
            </p>
          </div>

          {diverges ? (
            <div className="field">
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  name="override"
                  checked={override}
                  onChange={(event) => setOverride(event.target.checked)}
                  style={{ width: "auto" }}
                />
                Sobrescrever o farol calculado
              </label>
              {override ? (
                <textarea
                  name="overrideReason"
                  placeholder="Justifique por escrito — o relatório mostra à diretoria onde o farol foi sobrescrito."
                  style={{ marginTop: 8 }}
                />
              ) : null}
            </div>
          ) : null}

          <button type="submit" disabled={pending}>
            {pending ? "Registrando…" : "Registrar status"}
          </button>
        </form>
      </div>
    </details>
  );
}

export function ProjectStatusChange({
  projectId,
  status,
  next,
  hasDueDate,
}: {
  projectId: string;
  status: ProjectStatus;
  next: ProjectStatus[];
  hasDueDate: boolean;
}) {
  const [state, action, pending] = useActionState(mudarStatusProjeto, emptyState);
  const [target, setTarget] = useState<ProjectStatus | null>(null);

  const needsReason = target === "pausado" || target === "cancelado";
  const needsDue = target === "aprovado" && !hasDueDate;

  return (
    <details className="panel">
      <summary>Mudar status do projeto ({projectStatusLabel(status)})</summary>
      <div>
        <form action={action}>
          <input type="hidden" name="projectId" value={projectId} />
          <Errors errors={state.errors} />

          {needsDue ? (
            <div className="field">
              <label htmlFor="proj-due">Data-alvo</label>
              <input id="proj-due" type="date" name="dueDate" />
              <p className="muted" style={{ fontSize: 12.5, marginTop: 5 }}>
                Esta data vira a baseline do projeto e não é reescrita depois — é contra ela
                que a entrega no prazo é medida.
              </p>
            </div>
          ) : null}

          {needsReason ? (
            <div className="field">
              <label htmlFor="proj-reason">
                Por que o projeto está sendo {target === "pausado" ? "pausado" : "cancelado"}?
              </label>
              <textarea id="proj-reason" name="stopReason" />
            </div>
          ) : null}

          <div className="actions">
            {next.map((to) => (
              <button
                key={to}
                className="ghost small"
                type="submit"
                name="to"
                value={to}
                disabled={pending}
                onClick={() => setTarget(to)}
              >
                {projectStatusLabel(to)}
              </button>
            ))}
          </div>
        </form>
      </div>
    </details>
  );
}

export function MilestoneDone({ milestoneId }: { milestoneId: string }) {
  const [state, action, pending] = useActionState(concluirMarco, emptyState);
  return (
    <form action={action}>
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <button className="ghost small" type="submit" disabled={pending}>
        Concluir
      </button>
      {state.errors.length > 0 ? (
        <span className="muted" style={{ fontSize: 12 }}>
          {state.errors[0]}
        </span>
      ) : null}
    </form>
  );
}

/* ------------------------------- check-in ------------------------------ */

export function CheckinForm({
  initiativeId,
  indicatorName,
  indicatorUnit,
  target,
}: {
  initiativeId: string;
  indicatorName: string;
  indicatorUnit: string;
  target: string | null;
}) {
  const [state, action, pending] = useActionState(registrarCheckin, emptyState);

  return (
    <details className="panel">
      <summary>Fazer check-in do período</summary>
      <div>
        <form action={action}>
          <input type="hidden" name="initiativeId" value={initiativeId} />
          <Errors errors={state.errors} />
          {state.ok ? <p className="muted">Check-in registrado.</p> : null}

          <div className="field-row">
            <div className="field">
              <label htmlFor={`ind-${initiativeId}`}>
                {indicatorName} ({indicatorUnit})
              </label>
              <input
                id={`ind-${initiativeId}`}
                type="number"
                name="indicatorValue"
                step="0.01"
                placeholder={target ? `meta: ${target}` : undefined}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`ran-${initiativeId}`}>O que rodou</label>
            <textarea id={`ran-${initiativeId}`} name="whatRan" required />
          </div>
          <div className="field">
            <label htmlFor={`blk-${initiativeId}`}>O que travou (opcional)</label>
            <textarea id={`blk-${initiativeId}`} name="whatBlocked" />
          </div>
          <button type="submit" disabled={pending}>
            {pending ? "Registrando…" : "Registrar check-in"}
          </button>
        </form>
      </div>
    </details>
  );
}
