/**
 * Reordenação contra Postgres real — ver cabeçalho de
 * `lib/learn/learn-flow.test.ts` para como rodar.
 *
 * O ponto do teste é a constraint: `modules_course_order_unique` e
 * `lessons_module_order_unique` fazem uma troca ingênua de posições
 * estourar. Sem banco de verdade, esse erro não aparece.
 */
import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { asc, eq, sql } from "drizzle-orm";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeDb = TEST_DATABASE_URL ? describe : describe.skip;
if (TEST_DATABASE_URL) process.env.DATABASE_URL = TEST_DATABASE_URL;

describeDb("reordenação de módulos e aulas", () => {
  const ids = {
    instructor: randomUUID(),
    course: randomUUID(),
    moduleA: randomUUID(),
    moduleB: randomUUID(),
    moduleC: randomUUID(),
    lessonA: randomUUID(),
    lessonB: randomUUID(),
  };

  type Db = typeof import("@/db/client").db;
  let db: Db;
  let schema: typeof import("@/db/schema");
  let ordering: typeof import("@/lib/instructor/ordering");

  const moduleOrder = async () => {
    const rows = await db
      .select({ id: schema.modules.id, order: schema.modules.order })
      .from(schema.modules)
      .where(eq(schema.modules.courseId, ids.course))
      .orderBy(asc(schema.modules.order));
    return rows.map((r) => r.id);
  };

  beforeAll(async () => {
    ({ db } = await import("@/db/client"));
    schema = await import("@/db/schema");
    ordering = await import("@/lib/instructor/ordering");

    await db.execute(sql`
      insert into auth.users (id, email)
      values (${ids.instructor}, ${`ord-${ids.instructor}@invent.local`})
      on conflict do nothing;
    `);
    await db
      .insert(schema.profiles)
      .values({ id: ids.instructor, fullName: "Renata", role: "instrutor" })
      .onConflictDoNothing();

    await db.insert(schema.courses).values({
      id: ids.course,
      slug: `curso-ordem-${ids.course.slice(0, 8)}`,
      titleI18n: { "pt-BR": "Curso de ordenação" },
      status: "draft",
      visibility: "public",
      instructorOwnerId: ids.instructor,
    });

    await db.insert(schema.modules).values([
      { id: ids.moduleA, courseId: ids.course, titleI18n: { "pt-BR": "A" }, order: 1 },
      { id: ids.moduleB, courseId: ids.course, titleI18n: { "pt-BR": "B" }, order: 2 },
      { id: ids.moduleC, courseId: ids.course, titleI18n: { "pt-BR": "C" }, order: 3 },
    ]);

    await db.insert(schema.lessons).values([
      {
        id: ids.lessonA,
        moduleId: ids.moduleA,
        titleI18n: { "pt-BR": "Aula 1" },
        type: "text",
        order: 1,
        contentRef: { kind: "text", mdx: "a" },
      },
      {
        id: ids.lessonB,
        moduleId: ids.moduleA,
        titleI18n: { "pt-BR": "Aula 2" },
        type: "text",
        order: 2,
        contentRef: { kind: "text", mdx: "b" },
      },
    ]);
  });

  afterAll(async () => {
    if (!TEST_DATABASE_URL) return;
    await db.delete(schema.courses).where(eq(schema.courses.id, ids.course));
    await db.delete(schema.profiles).where(eq(schema.profiles.id, ids.instructor));
    await db.execute(sql`delete from auth.users where id = ${ids.instructor}`);
  });

  it("desce um módulo sem violar a constraint de ordem", async () => {
    expect(await ordering.moveModule(ids.moduleA, "down")).toBe(true);
    expect(await moduleOrder()).toEqual([ids.moduleB, ids.moduleA, ids.moduleC]);
  });

  it("sobe um módulo de volta", async () => {
    expect(await ordering.moveModule(ids.moduleA, "up")).toBe(true);
    expect(await moduleOrder()).toEqual([ids.moduleA, ids.moduleB, ids.moduleC]);
  });

  it("não faz nada nas pontas", async () => {
    expect(await ordering.moveModule(ids.moduleA, "up")).toBe(false);
    expect(await ordering.moveModule(ids.moduleC, "down")).toBe(false);
    expect(await moduleOrder()).toEqual([ids.moduleA, ids.moduleB, ids.moduleC]);
  });

  it("mantém a ordem contígua depois de várias trocas", async () => {
    await ordering.moveModule(ids.moduleC, "up");
    await ordering.moveModule(ids.moduleC, "up");
    const rows = await db
      .select({ order: schema.modules.order })
      .from(schema.modules)
      .where(eq(schema.modules.courseId, ids.course))
      .orderBy(asc(schema.modules.order));
    expect(rows.map((r) => r.order)).toEqual([1, 2, 3]);
  });

  it("reordena aulas dentro do módulo", async () => {
    expect(await ordering.moveLesson(ids.lessonB, "up")).toBe(true);
    const rows = await db
      .select({ id: schema.lessons.id })
      .from(schema.lessons)
      .where(eq(schema.lessons.moduleId, ids.moduleA))
      .orderBy(asc(schema.lessons.order));
    expect(rows.map((r) => r.id)).toEqual([ids.lessonB, ids.lessonA]);
  });

  it("devolve false para id inexistente", async () => {
    expect(await ordering.moveModule(randomUUID(), "up")).toBe(false);
    expect(await ordering.moveLesson(randomUUID(), "down")).toBe(false);
  });
});
