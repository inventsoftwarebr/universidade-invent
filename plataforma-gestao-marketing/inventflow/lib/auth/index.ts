import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { people, type Person, type Profile } from "@/db/schema";
import { readSession } from "./session";
import { entraConfigured } from "./entra";

export { setSession, clearSession, readSession } from "./session";
export { entraConfigured } from "./entra";

/**
 * Modo de autenticação.
 * - `entra`: login com a conta Microsoft da Invent. É o modo de go-live.
 * - `piloto`: escolhe-se quem é na tela de entrada, sem senha. Serve ao alpha
 *   e ao beta internos enquanto o registro de aplicativo no Entra ID não sai.
 *   NUNCA deve ser o modo em produção com dado real.
 */
export function authMode(): "entra" | "piloto" {
  return entraConfigured() ? "entra" : "piloto";
}

export async function currentUser(): Promise<Person | null> {
  const personId = await readSession();
  if (!personId) return null;
  const [person] = await db.select().from(people).where(eq(people.id, personId)).limit(1);
  return person && person.active ? person : null;
}

export async function requireUser(): Promise<Person> {
  const person = await currentUser();
  if (!person) redirect("/entrar");
  return person;
}

const RANK: Record<Profile, number> = { executor: 0, owner: 1, gestao: 2, diretoria: 2 };

/** Gestão e diretoria enxergam tudo; owner e executor enxergam o portfólio e o que é seu. */
export function canManage(person: Person): boolean {
  return person.profile === "gestao";
}

export function canSeeEverything(person: Person): boolean {
  return RANK[person.profile] >= 2;
}

/** Quem pode mover uma tarefa: o responsável, o owner do item pai, ou a gestão. */
export function canEditTask(
  person: Person,
  task: { assigneeId: string | null; createdById: string },
  parentOwnerId: string | null,
): boolean {
  return (
    canManage(person) ||
    task.assigneeId === person.id ||
    task.createdById === person.id ||
    parentOwnerId === person.id
  );
}

export function canEditProject(person: Person, project: { ownerId: string }): boolean {
  return canManage(person) || project.ownerId === person.id;
}
