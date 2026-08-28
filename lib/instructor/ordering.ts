/**
 * Reordenação de módulos e aulas.
 *
 * Fora de `actions.ts` (que é `"use server"`) para poder rodar contra um
 * Postgres real nos testes. A troca é feita em transação com um `order`
 * temporário negativo: `modules_course_order_unique` e
 * `lessons_module_order_unique` são checadas por linha, então um UPDATE que
 * troca dois valores diretamente viola a constraint no meio do caminho.
 */
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { lessons, modules } from "@/db/schema";

export type MoveDirection = "up" | "down";

const TEMP_ORDER = -1;

/** Retorna `false` quando o item já está na ponta (nada a fazer). */
export async function moveModule(
  moduleId: string,
  direction: MoveDirection,
): Promise<boolean> {
  const [current] = await db
    .select({ id: modules.id, courseId: modules.courseId, order: modules.order })
    .from(modules)
    .where(eq(modules.id, moduleId));
  if (!current) return false;

  const [neighbor] = await db
    .select({ id: modules.id, order: modules.order })
    .from(modules)
    .where(
      and(
        eq(modules.courseId, current.courseId),
        direction === "up"
          ? lt(modules.order, current.order)
          : gt(modules.order, current.order),
      ),
    )
    .orderBy(direction === "up" ? desc(modules.order) : asc(modules.order))
    .limit(1);
  if (!neighbor) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(modules)
      .set({ order: TEMP_ORDER, updatedAt: new Date() })
      .where(eq(modules.id, current.id));
    await tx
      .update(modules)
      .set({ order: current.order, updatedAt: new Date() })
      .where(eq(modules.id, neighbor.id));
    await tx
      .update(modules)
      .set({ order: neighbor.order, updatedAt: new Date() })
      .where(eq(modules.id, current.id));
  });

  return true;
}

export async function moveLesson(
  lessonId: string,
  direction: MoveDirection,
): Promise<boolean> {
  const [current] = await db
    .select({ id: lessons.id, moduleId: lessons.moduleId, order: lessons.order })
    .from(lessons)
    .where(eq(lessons.id, lessonId));
  if (!current) return false;

  const [neighbor] = await db
    .select({ id: lessons.id, order: lessons.order })
    .from(lessons)
    .where(
      and(
        eq(lessons.moduleId, current.moduleId),
        direction === "up"
          ? lt(lessons.order, current.order)
          : gt(lessons.order, current.order),
      ),
    )
    .orderBy(direction === "up" ? desc(lessons.order) : asc(lessons.order))
    .limit(1);
  if (!neighbor) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(lessons)
      .set({ order: TEMP_ORDER, updatedAt: new Date() })
      .where(eq(lessons.id, current.id));
    await tx
      .update(lessons)
      .set({ order: current.order, updatedAt: new Date() })
      .where(eq(lessons.id, neighbor.id));
    await tx
      .update(lessons)
      .set({ order: neighbor.order, updatedAt: new Date() })
      .where(eq(lessons.id, current.id));
  });

  return true;
}
