import "./env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import type { Cadence, Priority, ProjectStatus, TaskStatus } from "./schema";
import { addDays, daysBetween, startOfWeek, today as todayIn } from "../lib/domain/dates";

/**
 * Carga inicial para o piloto.
 *
 * As dez pessoas correspondem aos papéis reais do Marketing, mas os NOMES,
 * E-MAILS e todo o conteúdo de projetos e tarefas são exemplos: troque por
 * gente e trabalho reais antes do alpha. O domínio `exemplo.local` está aqui
 * justamente para quebrar caso alguém esqueça de substituir.
 *
 * O histórico é gerado com um gerador pseudoaleatório de semente fixa, para
 * que rodar o seed duas vezes produza o mesmo banco — relatório que muda
 * sozinho entre execuções é impossível de conferir.
 */

/* --------------------------- utilidades -------------------------------- */

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const rng = makeRng(20260901);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

function chance(probability: number): boolean {
  return rng() < probability;
}

function intBetween(min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function instant(day: string, hour = 10): Date {
  // 12h em UTC ≈ 9h em São Paulo; o horário exato é irrelevante para os
  // indicadores, que trabalham em granularidade de dia.
  return new Date(`${day}T${String(hour).padStart(2, "0")}:00:00Z`);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const TODAY = todayIn();

/* ------------------------------ dados ---------------------------------- */

const PEOPLE = [
  { name: "Ana Ribeiro", jobTitle: "Diretora de Marketing", profile: "diretoria", capacity: 20 },
  { name: "Marina Costa", jobTitle: "Coordenadora de Marketing", profile: "gestao", capacity: 25 },
  { name: "Rafael Prado", jobTitle: "Especialista de Growth e IA", profile: "owner", capacity: 30 },
  { name: "Bruna Lima", jobTitle: "Analista de Marketing", profile: "owner", capacity: 30 },
  { name: "Diego Martins", jobTitle: "Analista de Marketing", profile: "owner", capacity: 30 },
  { name: "Larissa Nunes", jobTitle: "Analista de Marketing", profile: "owner", capacity: 30 },
  { name: "Camila Souza", jobTitle: "Designer", profile: "executor", capacity: 30 },
  { name: "Thiago Alves", jobTitle: "Designer", profile: "executor", capacity: 30 },
  { name: "Pedro Henrique", jobTitle: "SDR", profile: "executor", capacity: 30 },
  { name: "Juliana Reis", jobTitle: "SDR", profile: "executor", capacity: 30 },
] as const;

const PORTFOLIOS = [
  { name: "Demanda & Growth", colorIndex: 0, ownerName: "Rafael Prado" },
  { name: "Marca & Conteúdo", colorIndex: 1, ownerName: "Bruna Lima" },
  { name: "Produto & Lançamentos", colorIndex: 2, ownerName: "Diego Martins" },
  { name: "Eventos & Relacionamento", colorIndex: 3, ownerName: "Larissa Nunes" },
  { name: "Pré-vendas (SDR)", colorIndex: 4, ownerName: "Marina Costa" },
  { name: "Design & Criação", colorIndex: 5, ownerName: "Camila Souza" },
] as const;

interface ProjectSpec {
  title: string;
  portfolio: string;
  owner: string;
  objective: string;
  status: ProjectStatus;
  priority: Priority;
  /** Dias a partir de hoje: negativo = passado. */
  startOffset: number;
  dueOffset: number;
  /** Atraso em dias na entrega real. Só para projetos concluídos. */
  slipDays?: number;
  products: string[];
  milestones: { title: string; offset: number }[];
  stopReason?: string;
}

const PROJECTS: ProjectSpec[] = [
  {
    title: "Lançamento do TaxPlus para SAP Cloud ERP",
    portfolio: "Produto & Lançamentos",
    owner: "Diego Martins",
    objective:
      "Levar ao mercado a versão do TaxPlus para SAP Cloud ERP com material de vendas, site e campanha de geração de demanda.",
    status: "em_execucao",
    priority: "p1",
    startOffset: -45,
    dueOffset: 38,
    products: ["TaxPlus", "SAP Cloud ERP"],
    milestones: [
      { title: "Posicionamento e mensagem aprovados", offset: -18 },
      { title: "Landing page publicada", offset: 6 },
      { title: "Webinar de lançamento", offset: 24 },
      { title: "Campanha de mídia no ar", offset: 36 },
    ],
  },
  {
    title: "Rebranding do site institucional",
    portfolio: "Marca & Conteúdo",
    owner: "Bruna Lima",
    objective:
      "Reposicionar o site para refletir o portfólio de suítes e plataformas, com nova arquitetura de informação.",
    status: "em_execucao",
    priority: "p1",
    startOffset: -70,
    dueOffset: -3,
    products: ["ERP/Institucional"],
    milestones: [
      { title: "Arquitetura de informação aprovada", offset: -40 },
      { title: "Layout das páginas-chave", offset: -12 },
      { title: "Conteúdo migrado", offset: -3 },
      { title: "Go-live do site", offset: 18 },
    ],
  },
  {
    title: "Campanha de geração de demanda — BankPlus",
    portfolio: "Demanda & Growth",
    owner: "Rafael Prado",
    objective:
      "Gerar pipeline qualificado para o BankPlus junto a empresas de médio porte usuárias de SAP B1.",
    status: "em_execucao",
    priority: "p1",
    startOffset: -28,
    dueOffset: 20,
    products: ["BankPlus", "SAP B1"],
    milestones: [
      { title: "Lista e segmentação prontas", offset: -14 },
      { title: "Peças e cadência aprovadas", offset: 2 },
      { title: "Campanha encerrada e apurada", offset: 20 },
    ],
  },
  {
    title: "Presença no SAP Summit 2026",
    portfolio: "Eventos & Relacionamento",
    owner: "Larissa Nunes",
    objective:
      "Estruturar a participação da Invent no SAP Summit, do estande à agenda de reuniões com clientes e parceiros.",
    status: "em_execucao",
    priority: "p2",
    startOffset: -20,
    dueOffset: 52,
    products: ["ERP/Institucional"],
    milestones: [
      { title: "Estande contratado", offset: -6 },
      { title: "Material gráfico na gráfica", offset: 28 },
      { title: "Agenda de reuniões fechada", offset: 45 },
    ],
  },
  {
    title: "Reformulação da cadência de prospecção",
    portfolio: "Pré-vendas (SDR)",
    owner: "Marina Costa",
    objective:
      "Redesenhar a cadência dos SDRs com novos templates, critérios de qualificação e ritual de revisão semanal.",
    status: "em_execucao",
    priority: "p2",
    startOffset: -15,
    dueOffset: 14,
    products: ["TaxPlus", "BankPlus"],
    milestones: [
      { title: "Novos templates aprovados", offset: 4 },
      { title: "Time treinado na cadência", offset: 14 },
    ],
  },
  {
    title: "Material de vendas do ContractPlus",
    portfolio: "Produto & Lançamentos",
    owner: "Bruna Lima",
    objective:
      "Produzir apresentação institucional, one-pager e casos de uso do ContractPlus para o time comercial.",
    status: "aprovado",
    priority: "p2",
    startOffset: 4,
    dueOffset: 46,
    products: ["ContractPlus"],
    milestones: [
      { title: "Roteiro aprovado pelo comercial", offset: 18 },
      { title: "Peças finalizadas", offset: 42 },
    ],
  },
  {
    title: "Programa de conteúdo para parceiros",
    portfolio: "Marca & Conteúdo",
    owner: "Larissa Nunes",
    objective:
      "Criar trilha de conteúdo mensal para parceiros que revendem as soluções da Invent.",
    status: "pausado",
    priority: "p3",
    startOffset: -60,
    dueOffset: 30,
    products: ["ERP/Institucional"],
    stopReason:
      "Pausado a pedido da diretoria até a definição do novo programa de canais, prevista para o próximo trimestre.",
    milestones: [{ title: "Calendário editorial do trimestre", offset: -30 }],
  },
  {
    title: "Campanha de indicação de clientes",
    portfolio: "Demanda & Growth",
    owner: "Rafael Prado",
    objective: "Estruturar programa de indicação com incentivo para a base de clientes ativa.",
    status: "cancelado",
    priority: "p3",
    startOffset: -50,
    dueOffset: -10,
    products: ["ERP/Institucional"],
    stopReason:
      "Cancelado: o incentivo previsto conflita com a política comercial vigente. Retomar só se a política mudar.",
    milestones: [],
  },
  {
    title: "Webinar RHello — folha de pagamento sem retrabalho",
    portfolio: "Produto & Lançamentos",
    owner: "Diego Martins",
    objective: "Webinar de geração de demanda para o RHello com clientes e leads de DP.",
    status: "concluido",
    priority: "p2",
    startOffset: -95,
    dueOffset: -38,
    slipDays: 0,
    products: ["RHello"],
    milestones: [
      { title: "Convidados confirmados", offset: -60 },
      { title: "Webinar realizado", offset: -38 },
    ],
  },
  {
    title: "Reposicionamento da página do Comex",
    portfolio: "Marca & Conteúdo",
    owner: "Bruna Lima",
    objective: "Reescrever a página do Comex com foco em importadores de médio porte.",
    status: "concluido",
    priority: "p3",
    startOffset: -120,
    dueOffset: -72,
    slipDays: 9,
    products: ["Comex"],
    milestones: [{ title: "Texto e layout publicados", offset: -72 }],
  },
  {
    title: "Kit de campanha do BankPlus para parceiros",
    portfolio: "Design & Criação",
    owner: "Camila Souza",
    objective: "Kit replicável de peças para parceiros divulgarem o BankPlus.",
    status: "concluido",
    priority: "p2",
    startOffset: -150,
    dueOffset: -104,
    slipDays: 0,
    products: ["BankPlus"],
    milestones: [{ title: "Kit entregue aos parceiros", offset: -104 }],
  },
  {
    title: "Pesquisa de satisfação da base",
    portfolio: "Eventos & Relacionamento",
    owner: "Larissa Nunes",
    objective: "Medir satisfação da base de clientes e alimentar o plano de conteúdo.",
    status: "concluido",
    priority: "p3",
    startOffset: -175,
    dueOffset: -140,
    slipDays: 14,
    products: ["ERP/Institucional"],
    milestones: [{ title: "Relatório entregue à diretoria", offset: -140 }],
  },
];

interface InitiativeSpec {
  title: string;
  portfolio: string;
  owner: string;
  description: string;
  cadence: Cadence;
  indicatorName: string;
  indicatorUnit: string;
  target: number;
  /** Faixa de valores gerados nos check-ins históricos. */
  range: [number, number];
  status?: "ativa" | "pausada";
  /** Semanas desde o último check-in — para simular iniciativa atrasada. */
  staleWeeks?: number;
}

const INITIATIVES: InitiativeSpec[] = [
  {
    title: "Gestão de redes sociais",
    portfolio: "Marca & Conteúdo",
    owner: "Bruna Lima",
    description: "Calendário e publicação nos canais da Invent, com resposta a comentários.",
    cadence: "semanal",
    indicatorName: "Publicações no período",
    indicatorUnit: "posts",
    target: 8,
    range: [5, 11],
  },
  {
    title: "Cadência de prospecção outbound",
    portfolio: "Pré-vendas (SDR)",
    owner: "Pedro Henrique",
    description: "Execução diária da cadência de contatos com contas-alvo.",
    cadence: "semanal",
    indicatorName: "Reuniões agendadas",
    indicatorUnit: "reuniões",
    target: 12,
    range: [6, 16],
  },
  {
    title: "Nutrição de base por e-mail",
    portfolio: "Demanda & Growth",
    owner: "Rafael Prado",
    description: "Fluxos de nutrição por produto e estágio, com revisão de performance.",
    cadence: "quinzenal",
    indicatorName: "Taxa de abertura",
    indicatorUnit: "%",
    target: 28,
    range: [19, 34],
  },
  {
    title: "Produção de blog e SEO",
    portfolio: "Marca & Conteúdo",
    owner: "Larissa Nunes",
    description: "Pauta, produção e otimização de artigos sobre legislação fiscal e SAP.",
    cadence: "quinzenal",
    indicatorName: "Artigos publicados",
    indicatorUnit: "artigos",
    target: 4,
    range: [2, 5],
  },
  {
    title: "Atendimento de demandas de design",
    portfolio: "Design & Criação",
    owner: "Camila Souza",
    description:
      "Fila de peças avulsas do time. Vira módulo próprio quando o intake com SLA entrar.",
    cadence: "semanal",
    indicatorName: "Peças entregues",
    indicatorUnit: "peças",
    target: 14,
    range: [8, 19],
  },
  {
    title: "Monitoramento de concorrência",
    portfolio: "Demanda & Growth",
    owner: "Diego Martins",
    description: "Acompanhamento de posicionamento e ofertas de concorrentes no ecossistema SAP.",
    cadence: "mensal",
    indicatorName: "Movimentos mapeados",
    indicatorUnit: "movimentos",
    target: 6,
    range: [3, 9],
    staleWeeks: 9,
  },
  {
    title: "Qualificação de leads inbound",
    portfolio: "Pré-vendas (SDR)",
    owner: "Juliana Reis",
    description: "Triagem e qualificação dos leads que chegam pelo site em até 1 dia útil.",
    cadence: "semanal",
    indicatorName: "Leads qualificados",
    indicatorUnit: "leads",
    target: 20,
    range: [12, 27],
  },
];

const TASK_TITLES_PROJECT = [
  "Escrever briefing da campanha",
  "Definir público e segmentação",
  "Aprovar mensagem com produto",
  "Produzir peças para LinkedIn",
  "Revisar texto da landing page",
  "Configurar automação no HubSpot",
  "Levantar casos de uso com clientes",
  "Montar apresentação para o comercial",
  "Ajustar layout aprovado",
  "Publicar página e testar formulários",
  "Preparar roteiro do webinar",
  "Alinhar agenda com o time de vendas",
  "Fechar orçamento com fornecedor",
  "Revisar arte final para gráfica",
  "Montar relatório de resultados",
  "Traduzir material para espanhol",
  "Atualizar one-pager do produto",
  "Gravar depoimento de cliente",
];

const TASK_TITLES_INITIATIVE = [
  "Publicar posts da semana",
  "Responder comentários e mensagens",
  "Revisar performance dos fluxos",
  "Escrever artigo da quinzena",
  "Atualizar planilha de concorrência",
  "Fazer triagem dos leads do dia",
  "Entregar peças da fila",
  "Rodar cadência das contas-alvo",
  "Revisar pauta com o time",
];

const STATUS_SUMMARIES = [
  "Avançamos no previsto para a semana; sem novidade que mude a data-alvo.",
  "Semana com dependência externa; acompanhando de perto, prazo mantido.",
  "Entregas da semana concluídas; o próximo marco entra em foco agora.",
  "Ritmo abaixo do planejado por concorrência de prioridade, ainda dentro do prazo.",
  "Uma peça voltou da revisão; reprogramamos a semana sem mexer na data-alvo.",
  "Semana curta por feriado. Nada crítico deslocado.",
];

const BLOCK_REASONS = [
  "Aguardando aprovação da diretoria — Ana Ribeiro destrava.",
  "Falta o texto final do produto — Diego Martins destrava.",
  "Dependência do fornecedor de gráfica — Larissa Nunes destrava.",
  "Aguardando dado do HubSpot — Rafael Prado destrava.",
];

/* ------------------------------- seed ---------------------------------- */

async function main(): Promise<void> {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL/DATABASE_URL não configurada.");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  // Ordem inversa das dependências.
  await db.delete(schema.auditLog);
  await db.delete(schema.comments);
  await db.delete(schema.taskEvents);
  await db.delete(schema.taskDependencies);
  await db.delete(schema.tasks);
  await db.delete(schema.initiativeCheckins);
  await db.delete(schema.initiatives);
  await db.delete(schema.statusUpdates);
  await db.delete(schema.milestones);
  await db.delete(schema.projects);
  await db.delete(schema.portfolios);
  await db.delete(schema.absences);
  await db.delete(schema.people);

  const insertedPeople = await db
    .insert(schema.people)
    .values(
      PEOPLE.map((p) => ({
        name: p.name,
        email: `${slugify(p.name)}@exemplo.local`,
        jobTitle: p.jobTitle,
        profile: p.profile,
        weeklyCapacityHours: p.capacity,
      })),
    )
    .returning();

  const byName = new Map(insertedPeople.map((p) => [p.name, p]));
  const person = (name: string) => {
    const found = byName.get(name);
    if (!found) throw new Error(`Pessoa não encontrada no seed: ${name}`);
    return found;
  };

  await db.insert(schema.absences).values([
    {
      personId: person("Thiago Alves").id,
      startDate: addDays(TODAY, 12),
      endDate: addDays(TODAY, 23),
      reason: "Férias",
    },
  ]);

  const insertedPortfolios = await db
    .insert(schema.portfolios)
    .values(
      PORTFOLIOS.map((p, index) => ({
        name: p.name,
        slug: slugify(p.name),
        colorIndex: p.colorIndex,
        ownerId: person(p.ownerName).id,
        sortOrder: index,
      })),
    )
    .returning();

  const portfolioByName = new Map(insertedPortfolios.map((p) => [p.name, p]));
  const portfolio = (name: string) => {
    const found = portfolioByName.get(name);
    if (!found) throw new Error(`Portfólio não encontrado no seed: ${name}`);
    return found;
  };

  const executors = ["Camila Souza", "Thiago Alves", "Pedro Henrique", "Juliana Reis"];
  const owners = ["Rafael Prado", "Bruna Lima", "Diego Martins", "Larissa Nunes"];
  const doers = [...owners, ...executors, "Marina Costa"];

  /* ----------------------------- projetos ----------------------------- */

  for (const spec of PROJECTS) {
    const start = addDays(TODAY, spec.startOffset);
    const due = addDays(TODAY, spec.dueOffset);
    const concluded = spec.status === "concluido";
    const actualEnd = concluded ? addDays(due, spec.slipDays ?? 0) : null;

    const [project] = await db
      .insert(schema.projects)
      .values({
        title: spec.title,
        slug: slugify(spec.title),
        portfolioId: portfolio(spec.portfolio).id,
        ownerId: person(spec.owner).id,
        objective: spec.objective,
        status: spec.status,
        priority: spec.priority,
        startDate: start,
        // A baseline nasce na aprovação e nunca é reescrita — é contra ela que
        // "entrega no prazo" é medida.
        baselineDueDate: spec.status === "ideia" || spec.status === "em_avaliacao" ? null : due,
        dueDate: due,
        actualEndDate: actualEnd,
        stopReason: spec.stopReason ?? null,
        productTags: spec.products,
        createdAt: instant(addDays(start, -5)),
      })
      .returning();

    if (!project) throw new Error("Falha ao inserir projeto.");

    if (spec.milestones.length > 0) {
      await db.insert(schema.milestones).values(
        spec.milestones.map((m, index) => {
          const date = addDays(TODAY, m.offset);
          const done = concluded || m.offset < -2;
          return {
            projectId: project.id,
            title: m.title,
            baselineDate: date,
            dueDate: date,
            actualDate: done ? addDays(date, chance(0.25) ? intBetween(1, 6) : 0) : null,
            status: done ? ("concluido" as const) : ("pendente" as const),
            sortOrder: index,
          };
        }),
      );
    }

    // Atualizações de status: semanais, do início até hoje (ou até o fim).
    const lastDay = actualEnd ?? TODAY;
    const updates: (typeof schema.statusUpdates.$inferInsert)[] = [];
    // Um projeto propositalmente silencioso, para o farol amarelar por silêncio.
    const silentSince = spec.title.startsWith("Presença no SAP Summit") ? 11 : 0;
    for (let day = addDays(start, 7); daysBetween(day, lastDay) >= 0; day = addDays(day, 7)) {
      if (silentSince > 0 && daysBetween(day, TODAY) < silentSince) continue;
      updates.push({
        projectId: project.id,
        authorId: person(spec.owner).id,
        summary:
          STATUS_SUMMARIES[(updates.length + spec.title.length) % STATUS_SUMMARIES.length]!,
        declaredHealth: chance(0.75) ? "verde" : "amarelo",
        createdAt: instant(day, 13),
      });
    }
    if (updates.length > 0) await db.insert(schema.statusUpdates).values(updates);

    // Tarefas
    const taskCount = concluded ? intBetween(5, 9) : intBetween(8, 14);
    for (let i = 0; i < taskCount; i += 1) {
      const assignee = person(pick(doers));
      const createdOn = addDays(start, intBetween(0, Math.max(1, Math.abs(spec.startOffset) - 1)));
      let status: TaskStatus;
      let dueOn: string;

      if (concluded || spec.status === "cancelado") {
        status = "concluida";
        dueOn = addDays(createdOn, intBetween(3, 15));
      } else if (spec.status === "aprovado") {
        status = "a_fazer";
        dueOn = addDays(TODAY, intBetween(6, 40));
      } else if (spec.status === "pausado") {
        status = chance(0.5) ? "a_fazer" : "concluida";
        dueOn = addDays(createdOn, intBetween(5, 20));
      } else {
        const roll = rng();
        status =
          roll < 0.34
            ? "concluida"
            : roll < 0.58
              ? "em_execucao"
              : roll < 0.7
                ? "em_revisao"
                : roll < 0.78
                  ? "bloqueada"
                  : "a_fazer";
        dueOn =
          status === "concluida"
            ? addDays(createdOn, intBetween(3, 14))
            : addDays(TODAY, intBetween(-6, 26));
      }

      await insertTask(db, {
        title: pick(TASK_TITLES_PROJECT),
        projectId: project.id,
        initiativeId: null,
        assigneeId: assignee.id,
        createdById: person(spec.owner).id,
        status,
        dueOn,
        createdOn,
      });
    }
  }

  /* ---------------------------- iniciativas --------------------------- */

  for (const spec of INITIATIVES) {
    const [initiative] = await db
      .insert(schema.initiatives)
      .values({
        title: spec.title,
        slug: slugify(spec.title),
        portfolioId: portfolio(spec.portfolio).id,
        ownerId: person(spec.owner).id,
        description: spec.description,
        cadence: spec.cadence,
        indicatorName: spec.indicatorName,
        indicatorUnit: spec.indicatorUnit,
        targetValue: String(spec.target),
        status: spec.status ?? "ativa",
        createdAt: instant(addDays(TODAY, -180)),
      })
      .returning();

    if (!initiative) throw new Error("Falha ao inserir iniciativa.");

    const periodDays = spec.cadence === "mensal" ? 28 : spec.cadence === "quinzenal" ? 14 : 7;
    const skipRecent = (spec.staleWeeks ?? 0) * 7;
    const checkins: (typeof schema.initiativeCheckins.$inferInsert)[] = [];

    for (let back = periodDays; back <= 168; back += periodDays) {
      if (back < skipRecent) continue;
      const periodEnd = addDays(startOfWeek(TODAY), -1 - (back - periodDays));
      const periodStart = addDays(periodEnd, -(periodDays - 1));
      const [low, high] = spec.range;
      checkins.push({
        initiativeId: initiative.id,
        periodStart,
        periodEnd,
        indicatorValue: String(intBetween(low, high)),
        whatRan: pick([
          "Cadência rodou completa, sem exceção.",
          "Rodou com um dia de atraso por conta de feriado.",
          "Volume abaixo do combinado por concorrência com o lançamento.",
          "Semana cheia; entregamos acima da meta.",
        ]),
        whatBlocked: chance(0.3)
          ? pick([
              "Falta de aprovação de peça travou duas publicações.",
              "Dado do HubSpot chegou incompleto.",
              "Concorrência de prioridade com o projeto do site.",
            ])
          : "",
        authorId: person(spec.owner).id,
        createdAt: instant(addDays(periodEnd, 1), 14),
      });
    }
    if (checkins.length > 0) await db.insert(schema.initiativeCheckins).values(checkins);

    // Tarefas recorrentes da iniciativa: algumas concluídas no passado, algumas abertas.
    for (let i = 0; i < intBetween(5, 9); i += 1) {
      const past = chance(0.6);
      const createdOn = addDays(TODAY, past ? intBetween(-60, -10) : intBetween(-9, -1));
      await insertTask(db, {
        title: pick(TASK_TITLES_INITIATIVE),
        projectId: null,
        initiativeId: initiative.id,
        assigneeId: person(pick(doers)).id,
        createdById: person(spec.owner).id,
        status: past ? "concluida" : chance(0.5) ? "em_execucao" : "a_fazer",
        dueOn: past ? addDays(createdOn, intBetween(2, 7)) : addDays(TODAY, intBetween(-3, 12)),
        createdOn,
      });
    }
  }

  const countRows = await client<{ count: number }[]>`select count(*)::int as count from tasks`;
  const taskTotal = countRows[0]?.count ?? 0;
  console.log(
    `Seed concluído: ${insertedPeople.length} pessoas, ${insertedPortfolios.length} portfólios, ` +
      `${PROJECTS.length} projetos, ${INITIATIVES.length} iniciativas, ${taskTotal} tarefas.`,
  );

  await client.end();
}

/* --------------------------- inserção de tarefa ------------------------ */

interface TaskInput {
  title: string;
  projectId: string | null;
  initiativeId: string | null;
  assigneeId: string;
  createdById: string;
  status: TaskStatus;
  dueOn: string;
  createdOn: string;
}

/**
 * Insere a tarefa junto com o histórico de transições que a levou ao estado
 * atual. Sem esse histórico não existem cycle time, fluxo acumulado nem
 * retrabalho — nenhum deles é reconstituível a partir do estado final.
 */
async function insertTask(
  db: ReturnType<typeof drizzle>,
  input: TaskInput,
): Promise<void> {
  const estimate = pick([1, 2, 2, 3, 4, 4, 6, 8, 12]);
  const createdAt = instant(input.createdOn, 9);

  const path: { day: string; status: TaskStatus }[] = [];
  let cursor = input.createdOn;

  const walk = (days: number, status: TaskStatus) => {
    cursor = addDays(cursor, days);
    path.push({ day: cursor, status });
  };

  if (input.status !== "a_fazer") {
    walk(intBetween(0, 3), "em_execucao");
  }
  if (input.status === "bloqueada") {
    walk(intBetween(1, 4), "bloqueada");
  }
  if (input.status === "em_revisao" || input.status === "concluida") {
    walk(intBetween(1, 6), "em_revisao");
    // Retrabalho: parte das tarefas volta da revisão para a execução.
    if (chance(0.18)) {
      walk(intBetween(1, 3), "em_execucao");
      walk(intBetween(1, 4), "em_revisao");
    }
  }
  if (input.status === "concluida") {
    walk(intBetween(0, 3), "concluida");
  }

  const startedAt = path.find((p) => p.status === "em_execucao");
  const completed = path.find((p) => p.status === "concluida");
  const blocked = [...path].reverse().find((p) => p.status === "bloqueada");

  const [task] = await db
    .insert(schema.tasks)
    .values({
      title: input.title,
      projectId: input.projectId,
      initiativeId: input.initiativeId,
      assigneeId: input.assigneeId,
      createdById: input.createdById,
      status: input.status,
      priority: pick(["p1", "p2", "p2", "p3"]) as Priority,
      dueDate: input.dueOn,
      estimateHours: String(estimate),
      startedAt: startedAt ? instant(startedAt.day, 10) : null,
      completedAt: completed ? instant(completed.day, 17) : null,
      blockedReason: input.status === "bloqueada" ? pick(BLOCK_REASONS) : null,
      blockedUntil: input.status === "bloqueada" && blocked ? addDays(blocked.day, 7) : null,
      createdAt,
      updatedAt: instant(path.at(-1)?.day ?? input.createdOn, 17),
    })
    .returning();

  if (!task) throw new Error("Falha ao inserir tarefa.");

  if (path.length > 0) {
    let from: TaskStatus = "a_fazer";
    await db.insert(schema.taskEvents).values(
      path.map((step) => {
        const row = {
          taskId: task.id,
          fromStatus: from,
          toStatus: step.status,
          actorId: input.assigneeId,
          at: instant(step.day, 15),
        };
        from = step.status;
        return row;
      }),
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
