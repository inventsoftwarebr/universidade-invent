/**
 * Seed mínimo da Universidade Invent.
 *
 * Cria via Supabase Admin API (service_role):
 *   - 1 admin   (admin@invent.local)
 *   - 1 instrutor (instrutor@invent.local)
 *   - 1 aluno  (aluno@invent.local)
 * E em seguida via Drizzle (bypass de RLS porque service_role):
 *   - Categorias: SAP, Gestão Fiscal, Financeiro & Bancário, Contratos
 *   - 1 curso publicado "Apuração Fiscal com TaxPlus" com 1 módulo + 1 aula texto
 *   - Matrícula do aluno no curso
 *
 * Idempotente: roda múltiplas vezes sem duplicar.
 *
 * Uso:
 *   pnpm db:seed
 *
 * Requer:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DIRECT_URL (ou DATABASE_URL)
 */
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { eq, sql as drSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = required("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE = required("SUPABASE_SERVICE_ROLE_KEY");
const DB_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!DB_URL) throw new Error("DIRECT_URL ou DATABASE_URL precisa estar setado.");

type SeedRole = "admin" | "instrutor" | "aluno";
type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: SeedRole;
};

const USERS: SeedUser[] = [
  {
    email: "admin@invent.local",
    password: "AdminInvent!2026",
    fullName: "Admin Invent",
    role: "admin",
  },
  {
    email: "instrutor@invent.local",
    password: "InstrutorInvent!2026",
    fullName: "Renata Souza",
    role: "instrutor",
  },
  {
    email: "aluno@invent.local",
    password: "AlunoInvent!2026",
    fullName: "Carlos Mendes",
    role: "aluno",
  },
];

async function main() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const sql = postgres(DB_URL!, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    console.warn("→ Criando usuários (auth.users + profiles)...");
    const { data: existingList, error: listErr } =
      await admin.auth.admin.listUsers({ perPage: 200 });
    if (listErr) throw new Error(`listUsers: ${listErr.message}`);

    const userIds: Record<SeedRole, string> = {} as Record<SeedRole, string>;
    for (const u of USERS) {
      const existing = existingList.users.find((x) => x.email === u.email);
      let id = existing?.id;
      if (!id) {
        const created = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.fullName },
        });
        if (created.error || !created.data.user) {
          throw new Error(`createUser ${u.email}: ${created.error?.message}`);
        }
        id = created.data.user.id;
        console.warn(`  + ${u.email}`);
      } else {
        console.warn(`  = ${u.email} (já existia)`);
      }
      userIds[u.role] = id!;

      // Garante o papel correto em profiles (trigger cria sempre como 'aluno').
      await db
        .update(schema.profiles)
        .set({
          role: u.role,
          fullName: u.fullName,
          alunoSubtype: u.role === "aluno" ? "cliente" : null,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.id, id!));
    }

    console.warn("→ Categorias...");
    const CATEGORIES = [
      { slug: "sap", name: "SAP" },
      { slug: "fiscal", name: "Gestão Fiscal" },
      { slug: "financeiro", name: "Financeiro & Bancário" },
      { slug: "contratos", name: "Contratos" },
    ];
    for (let i = 0; i < CATEGORIES.length; i++) {
      const c = CATEGORIES[i]!;
      await db
        .insert(schema.categories)
        .values({
          slug: c.slug,
          nameI18n: { "pt-BR": c.name },
          order: i,
        })
        .onConflictDoNothing({ target: schema.categories.slug });
    }
    const [fiscalCat] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, "fiscal"));

    console.warn("→ Curso piloto...");
    const courseSlug = "apuracao-fiscal-com-taxplus";
    const existingCourse = await db
      .select({ id: schema.courses.id })
      .from(schema.courses)
      .where(eq(schema.courses.slug, courseSlug));
    let courseId: string;
    if (existingCourse[0]) {
      courseId = existingCourse[0].id;
      console.warn(`  = ${courseSlug} (já existia)`);
    } else {
      const [inserted] = await db
        .insert(schema.courses)
        .values({
          slug: courseSlug,
          titleI18n: { "pt-BR": "Apuração Fiscal com TaxPlus" },
          summaryI18n: {
            "pt-BR":
              "Fundamentos de apuração ICMS/IPI/PIS/COFINS no addon TaxPlus para SAP Business One.",
          },
          descriptionI18n: {
            "pt-BR":
              "Neste curso piloto você verá como o TaxPlus automatiza apuração, SPED e obrigações acessórias dentro do SAP B1.",
          },
          categoryId: fiscalCat?.id,
          level: "intermediate",
          status: "published",
          visibility: "public",
          targetPersonas: ["influenciador"],
          sapModule: ["B1_FI"],
          instructorOwnerId: userIds.instrutor,
          estimatedMinutes: 220,
          publishedAt: new Date(),
        })
        .returning({ id: schema.courses.id });
      courseId = inserted!.id;
      console.warn(`  + ${courseSlug}`);
    }

    // Lead instructor link (M2M)
    await db
      .insert(schema.courseInstructors)
      .values({
        courseId,
        profileId: userIds.instrutor,
        role: "lead",
      })
      .onConflictDoNothing();

    console.warn("→ Módulo + aula piloto...");
    const existingModule = await db
      .select()
      .from(schema.modules)
      .where(eq(schema.modules.courseId, courseId));
    let moduleId: string;
    if (existingModule[0]) {
      moduleId = existingModule[0].id;
    } else {
      const [m] = await db
        .insert(schema.modules)
        .values({
          courseId,
          titleI18n: { "pt-BR": "Visão geral do TaxPlus" },
          summaryI18n: {
            "pt-BR": "Introdução ao addon e ao fluxo de apuração no SAP B1.",
          },
          order: 1,
        })
        .returning({ id: schema.modules.id });
      moduleId = m!.id;
    }

    const existingLesson = await db
      .select()
      .from(schema.lessons)
      .where(eq(schema.lessons.moduleId, moduleId));
    if (!existingLesson[0]) {
      await db.insert(schema.lessons).values({
        moduleId,
        titleI18n: { "pt-BR": "Bem-vindo à Universidade Invent" },
        type: "text",
        order: 1,
        isPreview: true,
        durationSeconds: 240,
        contentRef: {
          kind: "text",
          mdx: "# Bem-vindo!\n\nEsta é a aula piloto da Universidade Invent.\n\nNas próximas semanas você verá apuração ICMS, SPED Fiscal e mais.",
        },
      });
    }

    console.warn("→ Matrícula do aluno no curso...");
    await db
      .insert(schema.enrollments)
      .values({
        courseId,
        profileId: userIds.aluno,
        source: "admin",
        status: "active",
      })
      .onConflictDoNothing();

    // Snapshot rápido pra confirmar o seed.
    const counts = await db.execute(drSql`
      select
        (select count(*) from public.profiles) as profiles,
        (select count(*) from public.categories) as categories,
        (select count(*) from public.courses where status='published') as published_courses,
        (select count(*) from public.enrollments) as enrollments;
    `);
    console.warn("✓ Seed completo:", counts[0]);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ${name} não definida.`);
  return v;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
