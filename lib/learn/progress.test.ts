import { describe, expect, it } from "vitest";
import { computeProgressPct } from "./progress";

describe("computeProgressPct", () => {
  it("retorna 0 para curso sem aulas — evita divisão por zero", () => {
    expect(computeProgressPct(0, 0)).toBe(0);
    expect(computeProgressPct(3, 0)).toBe(0);
  });

  it("arredonda para inteiro", () => {
    expect(computeProgressPct(1, 3)).toBe(33);
    expect(computeProgressPct(2, 3)).toBe(67);
  });

  it("chega a 100 só com todas as aulas concluídas", () => {
    expect(computeProgressPct(7, 8)).toBe(88);
    expect(computeProgressPct(8, 8)).toBe(100);
  });

  it("satura em 100 se o contador vier inconsistente", () => {
    expect(computeProgressPct(12, 8)).toBe(100);
  });

  it("nunca retorna negativo", () => {
    expect(computeProgressPct(-4, 8)).toBe(0);
  });
});
