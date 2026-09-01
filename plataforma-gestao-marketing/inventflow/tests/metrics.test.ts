import { describe, expect, it } from "vitest";
import {
  capacityGrid,
  checkinAdherence,
  cumulativeFlow,
  cycleTimeDays,
  effortByPortfolio,
  effortSplit,
  leadTimeDays,
  mean,
  onTimeByMonth,
  percentile,
  reworkRate,
} from "@/lib/domain/metrics";

describe("entrega no prazo", () => {
  it("mede contra a baseline, não contra a data replanejada", () => {
    const rows = [
      { month: "2026-08", actualDate: "2026-08-10", baselineDate: "2026-08-12", kind: "projeto" as const },
      { month: "2026-08", actualDate: "2026-08-20", baselineDate: "2026-08-15", kind: "marco" as const },
    ];
    const [point] = onTimeByMonth(rows, ["2026-08"]);
    expect(point?.total).toBe(2);
    expect(point?.onTime).toBe(1);
    expect(point?.ratio).toBe(0.5);
  });

  it("conta como no prazo a entrega no próprio dia planejado", () => {
    const rows = [
      { month: "2026-08", actualDate: "2026-08-12", baselineDate: "2026-08-12", kind: "projeto" as const },
    ];
    expect(onTimeByMonth(rows, ["2026-08"])[0]?.ratio).toBe(1);
  });

  it("devolve null — e não 0% — em mês sem entrega", () => {
    expect(onTimeByMonth([], ["2026-08"])[0]?.ratio).toBeNull();
  });

  it("ignora entrega sem baseline registrada", () => {
    const rows = [
      { month: "2026-08", actualDate: "2026-08-10", baselineDate: null, kind: "projeto" as const },
    ];
    expect(onTimeByMonth(rows, ["2026-08"])[0]?.total).toBe(0);
  });
});

describe("esforço", () => {
  const rows = [
    { portfolioId: "a", portfolioName: "Growth", parent: "projeto" as const, estimateHours: 10, status: "concluida" as const },
    { portfolioId: "a", portfolioName: "Growth", parent: "projeto" as const, estimateHours: 5, status: "em_execucao" as const },
    { portfolioId: "b", portfolioName: "Marca", parent: "iniciativa" as const, estimateHours: 4, status: "concluida" as const },
  ];

  it("separa estimado de entregue por pilar", () => {
    const result = effortByPortfolio(rows);
    expect(result[0]).toMatchObject({ portfolioName: "Growth", planned: 15, delivered: 10 });
    expect(result[1]).toMatchObject({ portfolioName: "Marca", planned: 4, delivered: 4 });
  });

  it("divide o esforço entre projeto e iniciativa", () => {
    expect(effortSplit(rows)).toEqual({ projeto: 15, iniciativa: 4 });
  });
});

describe("tempo", () => {
  const task = {
    id: "t1",
    status: "concluida" as const,
    createdAt: new Date("2026-08-01T09:00:00Z"),
    startedAt: new Date("2026-08-03T09:00:00Z"),
    completedAt: new Date("2026-08-08T09:00:00Z"),
    parent: "projeto" as const,
  };

  it("cycle time conta da entrada em execução", () => {
    expect(cycleTimeDays(task)).toBe(5);
  });

  it("lead time conta da criação — é o que o solicitante sente", () => {
    expect(leadTimeDays(task)).toBe(7);
  });

  it("usa a criação como origem quando a tarefa nunca entrou em execução", () => {
    expect(cycleTimeDays({ ...task, startedAt: null })).toBe(7);
  });

  it("devolve null para tarefa não concluída", () => {
    expect(cycleTimeDays({ ...task, completedAt: null })).toBeNull();
  });

  it("calcula percentil e média", () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 85)).toBe(9);
    expect(percentile([], 85)).toBeNull();
    expect(mean([2, 4])).toBe(3);
  });
});

describe("retrabalho", () => {
  it("conta a tarefa que voltou da revisão, uma vez só", () => {
    const events = [
      { taskId: "t1", fromStatus: "em_revisao" as const, toStatus: "em_execucao" as const, at: new Date() },
      { taskId: "t1", fromStatus: "em_revisao" as const, toStatus: "em_execucao" as const, at: new Date() },
      { taskId: "t2", fromStatus: "em_execucao" as const, toStatus: "concluida" as const, at: new Date() },
    ];
    expect(reworkRate(["t1", "t2"], events)).toBe(0.5);
  });

  it("devolve null sem tarefas concluídas", () => {
    expect(reworkRate([], [])).toBeNull();
  });
});

describe("fluxo acumulado", () => {
  it("reconstrói o status de cada tarefa em cada dia", () => {
    const tasks = [
      {
        id: "t1",
        status: "concluida" as const,
        createdAt: new Date("2026-08-01T09:00:00Z"),
        startedAt: new Date("2026-08-02T09:00:00Z"),
        completedAt: new Date("2026-08-03T09:00:00Z"),
        parent: "projeto" as const,
      },
    ];
    const events = [
      { taskId: "t1", fromStatus: "a_fazer" as const, toStatus: "em_execucao" as const, at: new Date("2026-08-02T09:00:00Z") },
      { taskId: "t1", fromStatus: "em_execucao" as const, toStatus: "concluida" as const, at: new Date("2026-08-03T09:00:00Z") },
    ];
    const flow = cumulativeFlow(tasks, events, ["2026-08-01", "2026-08-02", "2026-08-03"]);
    expect(flow[0]?.counts.a_fazer).toBe(1);
    expect(flow[1]?.counts.em_execucao).toBe(1);
    expect(flow[2]?.counts.concluida).toBe(1);
  });

  it("não conta tarefa antes de ela existir", () => {
    const tasks = [
      {
        id: "t1",
        status: "a_fazer" as const,
        createdAt: new Date("2026-08-05T09:00:00Z"),
        startedAt: null,
        completedAt: null,
        parent: "projeto" as const,
      },
    ];
    const flow = cumulativeFlow(tasks, [], ["2026-08-01"]);
    expect(flow[0]?.counts.a_fazer).toBe(0);
  });
});

describe("capacidade", () => {
  const people = [{ id: "p1", name: "Camila", weeklyCapacityHours: 30 }];
  const weeks = ["2026-08-31"];

  it("aloca a tarefa na semana do prazo", () => {
    const grid = capacityGrid(
      people,
      [
        { assigneeId: "p1", dueDate: "2026-09-02", estimateHours: 12, status: "em_execucao" },
        { assigneeId: "p1", dueDate: "2026-09-10", estimateHours: 8, status: "a_fazer" },
      ],
      weeks,
    );
    expect(grid[0]?.cells[0]?.allocated).toBe(12);
    expect(grid[0]?.cells[0]?.ratio).toBeCloseTo(0.4);
  });

  it("não conta tarefa concluída", () => {
    const grid = capacityGrid(
      people,
      [{ assigneeId: "p1", dueDate: "2026-09-02", estimateHours: 12, status: "concluida" }],
      weeks,
    );
    expect(grid[0]?.cells[0]?.allocated).toBe(0);
  });

  it("férias reduzem a capacidade da semana", () => {
    const grid = capacityGrid(
      people,
      [{ assigneeId: "p1", dueDate: "2026-09-02", estimateHours: 12, status: "a_fazer" }],
      weeks,
      [{ personId: "p1", startDate: "2026-08-31", endDate: "2026-09-04" }],
    );
    expect(grid[0]?.cells[0]?.capacity).toBe(0);
    // Alocação com capacidade zerada precisa aparecer como estouro, não como vazio.
    expect(grid[0]?.cells[0]?.ratio).toBeGreaterThan(1);
  });
});

describe("aderência de check-in", () => {
  it("aceita até 1,5x a cadência combinada", () => {
    const result = checkinAdherence(
      [
        { cadence: "semanal", lastCheckinOn: "2026-08-28" },
        { cadence: "semanal", lastCheckinOn: "2026-08-01" },
      ],
      "2026-09-01",
    );
    expect(result.onTime).toBe(1);
    expect(result.late).toBe(1);
    expect(result.ratio).toBe(0.5);
  });

  it("conta como atrasada a iniciativa sem nenhum check-in", () => {
    const result = checkinAdherence([{ cadence: "mensal", lastCheckinOn: null }], "2026-09-01");
    expect(result.late).toBe(1);
  });
});
