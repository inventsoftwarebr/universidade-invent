/**
 * Teste de integração do fluxo de aprendizagem contra um Postgres real.
 *
 * Roda só quando `TEST_DATABASE_URL` está setado — sem banco, o arquivo é
 * pulado em vez de falhar, para o `pnpm test` continuar rodando em máquina
 * limpa. Para rodar local:
 *
 *   pnpm db:migrate   (contra o banco de teste)
 *   TEST_DATABASE_URL=postgresql://... pnpm test
 */
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DATABASE_URL ? describe : describe.skip;

// `db/client.ts` lê DATABASE_URL na primeira query (lazy), então basta
// definir antes de qualquer import que toque o banco.
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describeDb("fluxo de catálogo → matrícula → progresso", () => {
  const ids = {
    instructor: randomUUID(),
    student: randomUUID(),
    outsider: randomUUID(),
    category: randomUUID(),
    publishedCourse: randomUUID(),
    draftCourse: randomUUID(),
    privateCourse: randomUUID(),
    module: randomUUID(),
    lessonA: randomUUID(),
    lessonB: randomUUID(),
    enrollment: randomUUID(),
  };
  const suffix = ids.publishedCourse.slice(0, 8);
  const slugs = {
    published: `curso-publicado-${suffix}`,
    draft: `curso-rascunho-${suffix}`,
    private: `curso-privado-${suffix}`,
    category: `categoria-${suffix}`,
  };

  type Db = typeof import("@/db/client").db;
  let db: Db;
  let schema: typeof import("@/db/schema");
  let catalog: typeof import("@/lib/catalog/queries");
  let learn: typeof import("@/lib/learn/queries");
  let store: typeof import("@/lib/learn/progress-store");

  beforeAll(async () => {
    ({ db } = await import("@/db/client"));
    schema = await import("@/db/schema");
    catalog = await import("@/lib/catalog/queries");
    learn = await import("@/lib/learn/queries");
    store = await import("@/lib/learn/progress-store");

    // profiles tem FK lógica para auth.users; inserimos direto porque o
    // teste não sobe o Supabase Auth.
    await db.execute(sql`
      insert into auth.users (id, email) values
        (${ids.instructor}, ${`instrutor-${suffix}@invent.local`}),
        (${ids.student}, ${`aluno-${suffix}@invent.local`}),
        (${ids.outsider}, ${`outro-${suffix}@invent.local`})
      on conflict do nothing;
    `);

    await db
      .insert(schema.profiles)
      .values([
        { id: ids.instructor, fullName: "Renata Souza", role: "instrutor" },
        { id: ids.student, fullName: "Carlos Mendes", role: "aluno" },
        { id: ids.outsider, fullName: "Visitante", role: "aluno" },
      ])
      .onConflictDoNothing();

    await db.insert(schema.categories).values({
      id: ids.category,
      slug: slugs.category,
      nameI18n: { "pt-BR": "Gestão Fiscal" },
      order: 99,
    });

    await db.insert(schema.courses).values([
      {
        id: ids.publishedCourse,
        slug: slugs.published,
        titleI18n: { "pt-BR": "Apuração Fiscal com TaxPlus" },
        summaryI18n: { "pt-BR": "ICMS, SPED e obrigações acessórias." },
        descriptionI18n: { "pt-BR": "Curso completo de apuração." },
        categoryId: ids.category,
        level: "intermediate",
        status: "published",
        visibility: "public",
        instructorOwnerId: ids.instructor,
        estimatedMinutes: 220,
        publishedAt: new Date(),
      },
      {
        id: ids.draftCourse,
        slug: slugs.draft,
        titleI18n: { "pt-BR": "Rascunho de curso" },
        categoryId: ids.category,
        status: "draft",
        visibility: "public",
        instructorOwnerId: ids.instructor,
      },
      {
        id: ids.privateCourse,
        slug: slugs.private,
        titleI18n: { "pt-BR": "Curso só para matriculados" },
        categoryId: ids.category,
        status: "published",
        visibility: "enrolled_only",
        instructorOwnerId: ids.instructor,
      },
    ]);

    await db.insert(schema.modules).values({
      id: ids.module,
      courseId: ids.publishedCourse,
      titleI18n: { "pt-BR": "Visão geral" },
      order: 1,
    });

    await db.insert(schema.lessons).values([
      {
        id: ids.lessonA,
        moduleId: ids.module,
        titleI18n: { "pt-BR": "Bem-vindo" },
        type: "text",
        order: 1,
        durationSeconds: 240,
        isPreview: true,
        contentRef: { kind: "text", mdx: "# Olá" },
      },
      {
        id: ids.lessonB,
        moduleId: ids.module,
        titleI18n: { "pt-BR": "Parametrização tributária" },
        type: "text",
        order: 2,
        durationSeconds: 600,
        contentRef: { kind: "text", mdx: "# Parametrização" },
      },
    ]);

    await db.insert(schema.enrollments).values({
      id: ids.enrollment,
      courseId: ids.publishedCourse,
      profileId: ids.student,
      source: "self",
      status: "active",
    });
  });

  afterAll(async () => {
    if (!TEST_DATABASE_URL) return;
    await db.delete(schema.courses).where(eq(schema.courses.id, ids.publishedCourse));
    await db.delete(schema.courses).where(eq(schema.courses.id, ids.draftCourse));
    await db.delete(schema.courses).where(eq(schema.courses.id, ids.privateCourse));
    await db.delete(schema.categories).where(eq(schema.categories.id, ids.category));
    for (const id of [ids.instructor, ids.student, ids.outsider]) {
      await db.delete(schema.profiles).where(eq(schema.profiles.id, id));
      await db.execute(sql`delete from auth.users where id = ${id}`);
    }
  });

  describe("catálogo", () => {
    it("lista só cursos publicados e públicos", async () => {
      const rows = await catalog.listPublishedCourses({ category: slugs.category });
      const listedSlugs = rows.map((r) => r.slug);
      expect(listedSlugs).toContain(slugs.published);
      expect(listedSlugs).not.toContain(slugs.draft);
      expect(listedSlugs).not.toContain(slugs.private);
    });

    it("conta as aulas do curso", async () => {
      const [course] = await catalog.listPublishedCourses({
        category: slugs.category,
      });
      expect(course?.lessonCount).toBe(2);
      expect(course?.title).toBe("Apuração Fiscal com TaxPlus");
    });

    it("filtra por busca textual e por nível", async () => {
      const found = await catalog.listPublishedCourses({ q: "Apuração" });
      expect(found.map((r) => r.slug)).toContain(slugs.published);

      const missing = await catalog.listPublishedCourses({ q: "jabuticaba" });
      expect(missing.map((r) => r.slug)).not.toContain(slugs.published);

      const wrongLevel = await catalog.listPublishedCourses({
        category: slugs.category,
        level: "advanced",
      });
      expect(wrongLevel).toHaveLength(0);
    });

    it("não expõe content_ref na ementa pública", async () => {
      const course = await catalog.getPublicCourseBySlug(slugs.published);
      const lesson = course?.modules[0]?.lessons[0];
      expect(lesson?.title).toBe("Bem-vindo");
      expect(lesson).not.toHaveProperty("contentRef");
      expect(JSON.stringify(course)).not.toContain("# Olá");
    });

    it("devolve null para curso não publicado", async () => {
      expect(await catalog.getPublicCourseBySlug(slugs.draft)).toBeNull();
      expect(await catalog.getPublicCourseBySlug(slugs.private)).toBeNull();
    });
  });

  describe("acesso à aula", () => {
    it("nega quem não tem matrícula", async () => {
      const data = await learn.getPlayerData(
        slugs.published,
        ids.lessonA,
        ids.outsider,
      );
      expect(data).toBeNull();
    });

    it("libera o aluno matriculado e resolve o conteúdo", async () => {
      const data = await learn.getPlayerData(
        slugs.published,
        ids.lessonA,
        ids.student,
      );
      expect(data?.lesson.markdown).toBe("# Olá");
      expect(data?.totalLessons).toBe(2);
      expect(data?.previousLessonId).toBeNull();
      expect(data?.nextLessonId).toBe(ids.lessonB);
    });

    it("nega aula que não pertence ao curso", async () => {
      const data = await learn.getPlayerData(
        slugs.published,
        randomUUID(),
        ids.student,
      );
      expect(data).toBeNull();
    });
  });

  describe("progresso", () => {
    it("acumula tempo assistido em vez de sobrescrever", async () => {
      await store.writeLessonProgress({
        enrollmentId: ids.enrollment,
        lessonId: ids.lessonA,
        positionSeconds: 10,
        watchedDeltaSeconds: 10,
        event: "heartbeat",
      });
      await store.writeLessonProgress({
        enrollmentId: ids.enrollment,
        lessonId: ids.lessonA,
        positionSeconds: 20,
        watchedDeltaSeconds: 10,
        event: "heartbeat",
      });

      const [row] = await db
        .select()
        .from(schema.lessonProgress)
        .where(eq(schema.lessonProgress.lessonId, ids.lessonA));

      expect(row?.watchedSecondsTotal).toBe(20);
      expect(row?.watchPositionSeconds).toBe(20);
      expect(row?.status).toBe("in_progress");
    });

    it("registra cada evento no log append-only", async () => {
      const events = await db
        .select()
        .from(schema.lessonEvents)
        .where(eq(schema.lessonEvents.lessonId, ids.lessonA));
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.every((e) => e.enrollmentId === ids.enrollment)).toBe(true);
    });

    it("não deixa um heartbeat atrasado reverter uma aula concluída", async () => {
      await store.writeLessonProgress({
        enrollmentId: ids.enrollment,
        lessonId: ids.lessonA,
        positionSeconds: 240,
        watchedDeltaSeconds: 0,
        event: "complete",
      });
      await store.writeLessonProgress({
        enrollmentId: ids.enrollment,
        lessonId: ids.lessonA,
        positionSeconds: 30,
        watchedDeltaSeconds: 5,
        event: "heartbeat",
      });

      const [row] = await db
        .select()
        .from(schema.lessonProgress)
        .where(eq(schema.lessonProgress.lessonId, ids.lessonA));

      expect(row?.status).toBe("completed");
      expect(row?.completedAt).not.toBeNull();
    });

    it("recalcula o percentual da matrícula", async () => {
      const half = await store.recalculateEnrollmentProgress(
        ids.enrollment,
        ids.publishedCourse,
      );
      expect(half).toBe(50);

      await store.writeLessonProgress({
        enrollmentId: ids.enrollment,
        lessonId: ids.lessonB,
        positionSeconds: 600,
        watchedDeltaSeconds: 0,
        event: "complete",
      });

      const full = await store.recalculateEnrollmentProgress(
        ids.enrollment,
        ids.publishedCourse,
      );
      expect(full).toBe(100);

      const [enrollment] = await db
        .select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.id, ids.enrollment));
      expect(enrollment?.status).toBe("completed");
      expect(enrollment?.completedAt).not.toBeNull();
    });

    it("mantém o acesso depois de concluir o curso", async () => {
      const data = await learn.getPlayerData(
        slugs.published,
        ids.lessonA,
        ids.student,
      );
      expect(data).not.toBeNull();
      expect(data?.completedLessons).toBe(2);

      const enrolled = await learn.listEnrolledCourses(ids.student);
      const course = enrolled.find((e) => e.courseSlug === slugs.published);
      expect(course?.progressPct).toBe(100);
    });
  });
});
