import { describe, expect, it } from "vitest";
import { computeHealth, type HealthInput } from "@/lib/domain/health";

const base: HealthInput = {
  today: "2026-09-01",
  status: "em_execucao",
  lastStatusUpdateOn: "2026-08-31",
  createdOn: "2026-07-01",
  tasks: [],
  milestones: [],
  override: null,
};

describe("farol de saúde", () => {
  it("fica verde quando não há sinal de risco", () => {
    const result = computeHealth({
      ...base,
      tasks: [{ status: "em_execucao", dueDate: "2026-09-20", blockedSince: null }],
      milestones: [{ dueDate: "2026-10-01", status: "pendente" }],
    });
    expect(result.health).toBe("verde");
  });

  it("fica vermelho com marco vencido", () => {
    const result = computeHealth({
      ...base,
      milestones: [{ dueDate: "2026-08-20", status: "pendente" }],
    });
    expect(result.health).toBe("vermelho");
    expect(result.reasons[0]).toContain("marco vencido");
  });

  it("ignora marco vencido que já foi concluído", () => {
    const result = computeHealth({
      ...base,
      milestones: [{ dueDate: "2026-08-20", status: "concluido" }],
    });
    expect(result.health).toBe("verde");
  });

  it("amarela por silêncio a partir de 8 dias sem atualização", () => {
    expect(
      computeHealth({ ...base, lastStatusUpdateOn: "2026-08-24" }).health,
    ).toBe("amarelo");
  });

  it("fica vermelho depois de 15 dias sem atualização", () => {
    expect(
      computeHealth({ ...base, lastStatusUpdateOn: "2026-08-17" }).health,
    ).toBe("vermelho");
  });

  it("usa a data de criação quando nunca houve atualização de status", () => {
    const result = computeHealth({ ...base, lastStatusUpdateOn: null });
    expect(result.health).toBe("vermelho");
  });

  it("amarela entre 10% e 25% de tarefas atrasadas", () => {
    const tasks = Array.from({ length: 10 }, (_, index) => ({
      status: "em_execucao" as const,
      dueDate: index < 2 ? "2026-08-20" : "2026-09-30",
      blockedSince: null,
    }));
    expect(computeHealth({ ...base, tasks }).health).toBe("amarelo");
  });

  it("fica vermelho acima de 25% de tarefas atrasadas", () => {
    const tasks = Array.from({ length: 10 }, (_, index) => ({
      status: "em_execucao" as const,
      dueDate: index < 3 ? "2026-08-20" : "2026-09-30",
      blockedSince: null,
    }));
    expect(computeHealth({ ...base, tasks }).health).toBe("vermelho");
  });

  it("não conta tarefa concluída como atrasada", () => {
    const tasks = Array.from({ length: 4 }, () => ({
      status: "concluida" as const,
      dueDate: "2026-08-01",
      blockedSince: null,
    }));
    expect(computeHealth({ ...base, tasks }).health).toBe("verde");
  });

  it("fica vermelho com bloqueio de mais de 5 dias", () => {
    const result = computeHealth({
      ...base,
      tasks: [{ status: "bloqueada", dueDate: "2026-09-30", blockedSince: "2026-08-20" }],
    });
    expect(result.health).toBe("vermelho");
  });

  it("apenas amarela com bloqueio recente", () => {
    const result = computeHealth({
      ...base,
      tasks: [{ status: "bloqueada", dueDate: "2026-09-30", blockedSince: "2026-08-30" }],
    });
    expect(result.health).toBe("amarelo");
  });

  it("não avalia projeto fora de execução", () => {
    const result = computeHealth({
      ...base,
      status: "cancelado",
      milestones: [{ dueDate: "2026-01-01", status: "pendente" }],
    });
    expect(result.health).toBe("verde");
  });

  it("respeita o override do owner mas preserva o cálculo", () => {
    const result = computeHealth({
      ...base,
      milestones: [{ dueDate: "2026-08-20", status: "pendente" }],
      override: { health: "amarelo", reason: "Fornecedor já confirmou nova data." },
    });
    expect(result.health).toBe("amarelo");
    expect(result.computed).toBe("vermelho");
    expect(result.overridden).toBe(true);
    expect(result.reasons[0]).toContain("Fornecedor");
  });

  it("não marca override quando a declaração coincide com o cálculo", () => {
    const result = computeHealth({
      ...base,
      override: { health: "verde", reason: "Tudo certo." },
    });
    expect(result.overridden).toBe(false);
  });
});
