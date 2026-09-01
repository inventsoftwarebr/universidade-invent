import { describe, expect, it } from "vitest";
import {
  canActivateInitiative,
  canOverrideHealth,
  canTransitionProject,
  canTransitionTask,
} from "@/lib/domain/rules";

describe("transição de tarefa", () => {
  const complete = {
    assigneeId: "11111111-1111-1111-1111-111111111111",
    dueDate: "2026-09-10",
    blockedReason: null,
  };

  it("não deixa sair de A fazer sem responsável", () => {
    const guard = canTransitionTask({
      from: "a_fazer",
      to: "em_execucao",
      ...complete,
      assigneeId: null,
    });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors.join()).toContain("responsável");
  });

  it("não deixa sair de A fazer sem prazo", () => {
    const guard = canTransitionTask({
      from: "a_fazer",
      to: "em_execucao",
      ...complete,
      dueDate: null,
    });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors.join()).toContain("prazo");
  });

  it("cobra os dois campos de uma vez", () => {
    const guard = canTransitionTask({
      from: "a_fazer",
      to: "em_execucao",
      assigneeId: null,
      dueDate: null,
      blockedReason: null,
    });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors).toHaveLength(2);
  });

  it("deixa iniciar com responsável e prazo", () => {
    expect(canTransitionTask({ from: "a_fazer", to: "em_execucao", ...complete }).ok).toBe(true);
  });

  it("exige motivo para bloquear", () => {
    const guard = canTransitionTask({
      from: "em_execucao",
      to: "bloqueada",
      ...complete,
    });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors.join()).toContain("motivo do bloqueio");
  });

  it("aceita bloqueio com motivo", () => {
    expect(
      canTransitionTask({
        from: "em_execucao",
        to: "bloqueada",
        ...complete,
        blockedReason: "Aguardando aprovação — Ana destrava.",
      }).ok,
    ).toBe(true);
  });

  it("rejeita motivo que é só espaço em branco", () => {
    expect(
      canTransitionTask({
        from: "em_execucao",
        to: "bloqueada",
        ...complete,
        blockedReason: "   ",
      }).ok,
    ).toBe(false);
  });

  it("recusa transição que não existe na máquina de estados", () => {
    const guard = canTransitionTask({ from: "a_fazer", to: "concluida", ...complete });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors[0]).toContain("Transição inválida");
  });

  it("permite reabrir uma tarefa concluída", () => {
    expect(canTransitionTask({ from: "concluida", to: "em_execucao", ...complete }).ok).toBe(true);
  });

  it("trata transição para o mesmo estado como no-op válido", () => {
    expect(
      canTransitionTask({ from: "bloqueada", to: "bloqueada", ...complete }).ok,
    ).toBe(true);
  });
});

describe("transição de projeto", () => {
  const base = {
    ownerId: "11111111-1111-1111-1111-111111111111",
    dueDate: "2026-12-01",
    stopReason: null,
  };

  it("não aprova sem data-alvo", () => {
    const guard = canTransitionProject({
      from: "em_avaliacao",
      to: "aprovado",
      ...base,
      dueDate: null,
    });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors.join()).toContain("data-alvo");
  });

  it("não aprova sem owner", () => {
    const guard = canTransitionProject({
      from: "em_avaliacao",
      to: "aprovado",
      ...base,
      ownerId: null,
    });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors.join()).toContain("owner");
  });

  it("aprova com owner e data-alvo", () => {
    expect(canTransitionProject({ from: "em_avaliacao", to: "aprovado", ...base }).ok).toBe(true);
  });

  it("exige justificativa para pausar", () => {
    const guard = canTransitionProject({ from: "em_execucao", to: "pausado", ...base });
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errors.join()).toContain("pausado");
  });

  it("exige justificativa para cancelar", () => {
    const guard = canTransitionProject({ from: "em_execucao", to: "cancelado", ...base });
    expect(guard.ok).toBe(false);
  });

  it("aceita cancelamento justificado", () => {
    expect(
      canTransitionProject({
        from: "em_execucao",
        to: "cancelado",
        ...base,
        stopReason: "Conflita com a política comercial vigente.",
      }).ok,
    ).toBe(true);
  });

  it("não pula de ideia direto para execução", () => {
    expect(canTransitionProject({ from: "ideia", to: "em_execucao", ...base }).ok).toBe(false);
  });
});

describe("outras regras invioláveis", () => {
  it("não ativa iniciativa sem indicador", () => {
    expect(canActivateInitiative(null).ok).toBe(false);
    expect(canActivateInitiative("  ").ok).toBe(false);
    expect(canActivateInitiative("Reuniões agendadas").ok).toBe(true);
  });

  it("não sobrescreve o farol sem justificativa escrita", () => {
    expect(canOverrideHealth("verde", null).ok).toBe(false);
    expect(canOverrideHealth("verde", "").ok).toBe(false);
    expect(canOverrideHealth("verde", "Cliente confirmou nova data por escrito.").ok).toBe(true);
  });

  it("não exige nada quando não há override", () => {
    expect(canOverrideHealth(null, null).ok).toBe(true);
  });
});
