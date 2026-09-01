import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  addDays,
  businessDaysBetween,
  daysBetween,
  endOfMonth,
  endOfWeek,
  formatDay,
  lastMonths,
  startOfWeek,
  toDayString,
} from "@/lib/domain/dates";

describe("datas", () => {
  it("converte instante para o dia em São Paulo, não em UTC", () => {
    // 2026-09-02T02:00:00Z ainda é 1º de setembro, 23h, em São Paulo (UTC-3).
    expect(toDayString(new Date("2026-09-02T02:00:00Z"))).toBe("2026-09-01");
  });

  it("conta dias entre datas", () => {
    expect(daysBetween("2026-09-01", "2026-09-10")).toBe(9);
    expect(daysBetween("2026-09-10", "2026-09-01")).toBe(-9);
    expect(daysBetween("2026-09-01", "2026-09-01")).toBe(0);
  });

  it("atravessa virada de mês e de ano", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(daysBetween("2026-02-27", "2026-03-01")).toBe(2);
  });

  it("semana começa na segunda e termina no domingo", () => {
    // 2026-09-01 é uma terça-feira.
    expect(startOfWeek("2026-09-01")).toBe("2026-08-31");
    expect(endOfWeek("2026-09-01")).toBe("2026-09-06");
    expect(startOfWeek("2026-08-31")).toBe("2026-08-31");
    expect(startOfWeek("2026-09-06")).toBe("2026-08-31");
  });

  it("calcula o fim do mês, inclusive fevereiro", () => {
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28");
    expect(endOfMonth("2028-02-10")).toBe("2028-02-29");
    expect(endOfMonth("2026-09-01")).toBe("2026-09-30");
  });

  it("conta dias úteis ignorando fim de semana", () => {
    // Segunda a sexta da mesma semana.
    expect(businessDaysBetween("2026-08-31", "2026-09-04")).toBe(5);
    // Sexta a segunda: dois dias úteis.
    expect(businessDaysBetween("2026-09-04", "2026-09-07")).toBe(2);
  });

  it("soma dias úteis pulando o fim de semana", () => {
    // Sexta + 1 dia útil = segunda.
    expect(addBusinessDays("2026-09-04", 1)).toBe("2026-09-07");
    expect(addBusinessDays("2026-08-31", 5)).toBe("2026-09-07");
  });

  it("formata em DD/MM/AAAA", () => {
    expect(formatDay("2026-09-01")).toBe("01/09/2026");
    expect(formatDay(null)).toBe("—");
  });

  it("lista os últimos meses terminando no mês da data", () => {
    expect(lastMonths("2026-02-15", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});
