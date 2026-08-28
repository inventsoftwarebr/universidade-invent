import { describe, expect, it } from "vitest";
import {
  checkCourseForPublish,
  type CourseForPublish,
  type LessonForPublish,
} from "./publish-checks";

function lesson(overrides: Partial<LessonForPublish> = {}): LessonForPublish {
  return {
    title: "Aula",
    type: "video",
    durationSeconds: 600,
    contentRef: { kind: "video", videoAssetId: "abc" },
    video: { status: "ready" },
    ...overrides,
  };
}

function course(overrides: Partial<CourseForPublish> = {}): CourseForPublish {
  return {
    summary: "Resumo do curso.",
    modules: [{ title: "Módulo 1", lessons: [lesson()] }],
    ...overrides,
  };
}

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe("checkCourseForPublish", () => {
  it("aprova um curso completo", () => {
    const result = checkCourseForPublish(course());
    expect(result.blockers).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("barra curso sem módulos", () => {
    const result = checkCourseForPublish(course({ modules: [] }));
    expect(codes(result.blockers)).toContain("no_modules");
  });

  it("barra módulo sem aulas", () => {
    const result = checkCourseForPublish(
      course({ modules: [{ title: "Vazio", lessons: [] }] }),
    );
    expect(codes(result.blockers)).toContain("empty_module");
    expect(result.blockers[0]?.message).toContain("Vazio");
  });

  it("barra aula de vídeo sem arquivo enviado", () => {
    const result = checkCourseForPublish(
      course({
        modules: [
          { title: "M", lessons: [lesson({ video: null, contentRef: {} })] },
        ],
      }),
    );
    expect(codes(result.blockers)).toContain("video_missing");
  });

  it("barra vídeo ainda processando e vídeo com erro", () => {
    const processing = checkCourseForPublish(
      course({
        modules: [{ title: "M", lessons: [lesson({ video: { status: "processing" } })] }],
      }),
    );
    expect(codes(processing.blockers)).toContain("video_not_ready");

    const errored = checkCourseForPublish(
      course({
        modules: [{ title: "M", lessons: [lesson({ video: { status: "errored" } })] }],
      }),
    );
    expect(codes(errored.blockers)).toContain("video_errored");
  });

  it("barra aula de texto vazia — o bug que tornava a aula de texto inútil", () => {
    const result = checkCourseForPublish(
      course({
        modules: [
          {
            title: "M",
            lessons: [
              lesson({
                type: "text",
                video: null,
                contentRef: { kind: "text", mdx: "   " },
              }),
            ],
          },
        ],
      }),
    );
    expect(codes(result.blockers)).toContain("text_empty");
  });

  it("barra aula ao vivo sem link", () => {
    const result = checkCourseForPublish(
      course({
        modules: [
          {
            title: "M",
            lessons: [lesson({ type: "live", video: null, contentRef: { kind: "live" } })],
          },
        ],
      }),
    );
    expect(codes(result.blockers)).toContain("live_without_url");
  });

  it("avisa sem barrar quando falta duração ou resumo", () => {
    const result = checkCourseForPublish(
      course({
        summary: "",
        modules: [{ title: "M", lessons: [lesson({ durationSeconds: null })] }],
      }),
    );
    expect(result.blockers).toEqual([]);
    expect(codes(result.warnings)).toContain("missing_duration");
    expect(codes(result.warnings)).toContain("missing_summary");
  });

  it("acumula os problemas de todas as aulas", () => {
    const result = checkCourseForPublish(
      course({
        modules: [
          { title: "M1", lessons: [lesson({ video: null, contentRef: {} })] },
          { title: "M2", lessons: [] },
        ],
      }),
    );
    expect(result.blockers.length).toBe(2);
  });
});
