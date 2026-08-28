import { describe, expect, it } from "vitest";
import { formatClock, formatDuration, formatMinutes, ptBR } from "./text";

describe("ptBR", () => {
  it("prefere pt-BR", () => {
    expect(ptBR({ "pt-BR": "Apuração fiscal", en: "Tax closing" })).toBe(
      "Apuração fiscal",
    );
  });

  it("cai para outro idioma antes de renderizar vazio", () => {
    expect(ptBR({ en: "Tax closing" })).toBe("Tax closing");
    expect(ptBR({ es: "Cierre fiscal" })).toBe("Cierre fiscal");
  });

  it("usa o fallback quando o jsonb é nulo, vazio ou de outro tipo", () => {
    expect(ptBR(null, "(sem título)")).toBe("(sem título)");
    expect(ptBR({}, "(sem título)")).toBe("(sem título)");
    expect(ptBR("string solta", "(sem título)")).toBe("(sem título)");
    expect(ptBR({ "pt-BR": "" }, "(sem título)")).toBe("(sem título)");
  });
});

describe("formatDuration", () => {
  it("formata segundos em horas e minutos", () => {
    expect(formatDuration(240)).toBe("4min");
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(8520)).toBe("2h 22min");
  });

  it("mostra travessão quando não há duração", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(0)).toBe("—");
  });
});

describe("formatMinutes", () => {
  it("converte minutos do curso", () => {
    expect(formatMinutes(220)).toBe("3h 40min");
    expect(formatMinutes(null)).toBe("—");
  });
});

describe("formatClock", () => {
  it("omite a hora em vídeos curtos", () => {
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(0)).toBe("0:00");
  });

  it("inclui a hora em vídeos longos", () => {
    expect(formatClock(3725)).toBe("1:02:05");
  });

  it("trata posição negativa como zero", () => {
    expect(formatClock(-10)).toBe("0:00");
  });
});
