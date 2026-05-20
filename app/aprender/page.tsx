import Link from "next/link";
import { requireUser } from "@/lib/auth/require-role";
import { InventVMark } from "@/components/brand/InventLogo";

export const metadata = { title: "Aprender" };

/*
 * Mock data — substituir por queries reais quando o catálogo/enrollments
 * existir (semanas 3-4). A estrutura imita o que vai vir do banco.
 */
const CONTINUE: Array<{
  id: string;
  title: string;
  product: "taxplus" | "bankplus" | "contractplus" | "payroll";
  progress: number;
  durationMin: number;
}> = [];

const FRESH = [
  {
    id: "tp101",
    title: "Fundamentos do TaxPlus",
    product: "taxplus" as const,
    level: "Iniciante",
    lessons: 12,
    durationMin: 142,
  },
  {
    id: "bp201",
    title: "BankPlus: Conciliação avançada",
    product: "bankplus" as const,
    level: "Avançado",
    lessons: 14,
    durationMin: 188,
  },
  {
    id: "cp101",
    title: "Gestão de contratos com ContractPlus",
    product: "contractplus" as const,
    level: "Iniciante",
    lessons: 10,
    durationMin: 110,
  },
  {
    id: "sap-b1",
    title: "SAP Business One para administradores",
    product: "payroll" as const,
    level: "Iniciante",
    lessons: 24,
    durationMin: 320,
  },
];

export default async function AprenderHomePage() {
  const user = await requireUser();
  const firstName = user.fullName?.split(" ")[0] ?? "estudante";

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Bem-vindo, {firstName}
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            Continue de onde parou.
          </h1>
        </div>
        <ProgressRingStat pct={0} label="Início da Trilha SAP B1" sub="0 de 8 cursos" />
      </header>

      {CONTINUE.length > 0 ? (
        <CourseRail title="Continue assistindo" courses={CONTINUE} variant="continue" />
      ) : (
        <EmptyContinueCard />
      )}

      <section className="mt-12">
        <header className="mb-5 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Novos no catálogo
          </h2>
          <Link
            href="/cursos"
            className="text-sm font-semibold text-accent hover:text-invent-red-700"
          >
            Ver catálogo →
          </Link>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {FRESH.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressRingStat({
  pct,
  label,
  sub,
}: {
  pct: number;
  label: string;
  sub: string;
}) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy="0.35em"
          className="fill-foreground font-display text-[12px] font-bold"
        >
          {pct}%
        </text>
      </svg>
      <div className="text-sm">
        <strong className="block font-semibold">{label}</strong>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

function EmptyContinueCard() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <InventVMark className="mx-auto h-10" />
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">
        Você ainda não começou nenhum curso.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Quando você iniciar uma aula, ela aparece aqui para retomar com 1
        clique.
      </p>
      <Link
        href="/cursos"
        className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Explorar cursos
      </Link>
    </div>
  );
}

type ProductSlug = "taxplus" | "bankplus" | "contractplus" | "payroll";
const PRODUCT_COVER: Record<ProductSlug, string> = {
  taxplus: "from-product-tax to-invent-black",
  bankplus: "from-product-bank to-invent-black",
  contractplus: "from-product-contract to-invent-black",
  payroll: "from-product-payroll to-invent-black",
};
const PRODUCT_LABEL: Record<ProductSlug, string> = {
  taxplus: "TaxPlus",
  bankplus: "BankPlus",
  contractplus: "ContractPlus",
  payroll: "Payroll",
};

function fmtDur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}min` : `${m}min`;
}

function CourseRail({
  title,
  courses,
  variant: _v,
}: {
  title: string;
  courses: typeof CONTINUE;
  variant: "continue";
}) {
  return (
    <section className="mt-10">
      <header className="mb-5 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={{
              id: c.id,
              title: c.title,
              product: c.product,
              level: `${c.progress}% completo`,
              lessons: 0,
              durationMin: c.durationMin,
            }}
            progress={c.progress}
          />
        ))}
      </div>
    </section>
  );
}

function CourseCard({
  course,
  progress,
}: {
  course: {
    id: string;
    title: string;
    product: ProductSlug;
    level: string;
    lessons: number;
    durationMin: number;
  };
  progress?: number;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`relative flex aspect-video flex-col justify-end bg-gradient-to-br p-4 text-white ${PRODUCT_COVER[course.product]}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          {PRODUCT_LABEL[course.product]}
        </span>
        <span className="mt-1 font-display text-lg font-bold tracking-tight">
          {course.title}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {course.level}
        </span>
        {typeof progress === "number" ? (
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
        <div className="flex items-center gap-3 pt-1 text-xs font-medium text-muted-foreground">
          {course.lessons > 0 ? <span>{course.lessons} aulas</span> : null}
          <span>{fmtDur(course.durationMin)}</span>
        </div>
      </div>
    </article>
  );
}
