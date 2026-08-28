# CLAUDE.md — convenções e regras da Universidade Invent

Este arquivo é lido por toda sessão Claude futura. As regras abaixo evitam classes inteiras de bugs já mapeadas no planejamento. Se for editar uma dessas áreas, leia a regra primeiro.

## O que é este projeto

Plataforma de cursos da **Invent Software** (ISV parceira SAP). Stack: Next.js 15 App Router + TypeScript strict + Tailwind + shadcn/ui + Drizzle ORM + Supabase (Postgres/Auth/Storage/Realtime/pgvector) + Bunny Stream (vídeo) + Resend (email) + WhatsApp Cloud API + HubSpot. Hospedagem Vercel Pro. Plano completo em `docs/plan.md` (espelho do plan file da sessão).

Domínio: cursos sobre addons SAP (fiscal, financeiro/bancário, contratos) para SAP B1 e S/4HANA Cloud. Públicos: cliente, parceiro, lead.

## Regras invioláveis

### 1. Conexão Postgres — usar Supavisor transaction mode (porta 6543)

Em qualquer código que rode em serverless (Route Handlers, Server Actions, Server Components), o `DATABASE_URL` aponta para o **pooler do Supabase em transaction mode na porta 6543**. NUNCA usar 5432 direto a partir da Vercel — vai esgotar conexões em produção.

```
DATABASE_URL=postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

`DIRECT_URL` (porta 5432) só é usado por `drizzle-kit` em scripts de migração, que rodam fora de serverless.

Drizzle client deve ser instanciado com `postgres-js` driver, `max: 1`, `prepare: false` (PgBouncer transaction mode não suporta prepared statements):

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
export const db = drizzle(sql, { schema });
```

### 2. Supabase Auth — usar `@supabase/ssr` no padrão canônico

Errar isso quebra auth silenciosamente em produção. Sempre criar três arquivos:

- `lib/supabase/server.ts` — cliente para Server Components / Server Actions / Route Handlers (usa `cookies()` do `next/headers`)
- `lib/supabase/client.ts` — cliente para Client Components (usa `createBrowserClient`)
- `lib/supabase/middleware.ts` — helper chamado pelo `middleware.ts` raiz para refresh do JWT a cada request

Nunca usar a lib `@supabase/auth-helpers-nextjs` (deprecada). Nunca acessar `cookies()` fora de Server Component / Action / Route Handler.

### 3. Runtime — Node por default, Edge só com justificativa

NÃO setar `export const runtime = "edge"` globalmente. Bibliotecas que quebram no Edge:

- `postgres` / `pg` / Drizzle com `postgres-js`
- `@react-pdf/renderer`
- `sharp`

Edge é aceitável para rotas leves de cache (e.g., recomendação cacheada) que não tocam Postgres direto. Documentar a escolha no topo do arquivo.

### 4. RLS — todas as tabelas têm RLS habilitado e forçado

Default deny. Cada tabela tem políticas explícitas em `db/rls.sql`. Helpers SQL:

- `is_admin()` — role do JWT é `admin`
- `is_instructor_of(course_id)` — usuário é instrutor do curso
- `owns_enrollment(enrollment_id)` — usuário é dono da matrícula

`SECURITY DEFINER` functions só para endpoints públicos (verificação de certificado). Service role key **nunca vai para o browser** — só Edge Functions e código server-only confiável.

Antes de criar ou alterar tabela: garanta a política em `db/rls.sql` no mesmo commit. PR sem RLS é PR quebrado.

**Atenção — Drizzle não passa por RLS.** O `DATABASE_URL` conecta com o papel do pooler, então toda query em `lib/*/queries.ts` roda como superusuário lógico: as policies não te protegem ali. Quem lê ou escreve via Drizzle **precisa** autorizar em código, sempre partindo do `id` da sessão (`requireUser()`), e a regra escrita deve espelhar a policy equivalente. Exemplos: `publishedAndPublic()` em `lib/catalog/queries.ts` espelha `courses_read_published`; `getPlayerData()` em `lib/learn/queries.ts` exige matrícula antes de resolver `content_ref`, como `lessons_read`. RLS continua valendo como última linha de defesa para o que passa pelo PostgREST/Supabase client.

### 5. `auth.users` ↔ `profiles` — trigger obrigatório

Toda criação em `auth.users` dispara `handle_new_user()` que insere em `public.profiles`. Sem isso, signups deixam órfãos. A trigger está em `db/rls.sql`.

### 6. Webhooks — sempre idempotentes

Bunny, HubSpot, WhatsApp, Resend podem reentregar. Toda rota em `app/api/webhooks/*` deve:

1. Verificar assinatura (HMAC quando o provider oferece).
2. Usar `INSERT ... ON CONFLICT DO NOTHING` ou checar se o evento já foi processado por `provider_event_id`.
3. Responder 200 rápido. Trabalho pesado vai para Edge Function ou fila.

### 7. Vídeo — sempre Bunny Stream, nunca Supabase Storage

Upload de aula vai direto para Bunny via TUS (`@bunny.net/stream-uploader`). Supabase Storage é para PDFs de certificado, avatars, capas de curso. Bloqueio explícito de upload >50MB no bucket público.

### 8. Datas e timezone

UTC no banco (`timestamptz`). Render em `America/Sao_Paulo`. Datas de UI em `DD/MM/YYYY`. Não usar `Date.now()` no schema — usar `defaultNow()` do Drizzle ou `now()` do Postgres.

### 9. LGPD — não pode ser opcional

Consentimento granular separado dos termos (marketing email, WhatsApp). Páginas `/me/dados` (exportar) e `/me/excluir-conta` (deletar) obrigatórias. Banner de cookies bloqueia analytics até consentimento. Disclosure de transferência internacional para OpenAI/Anthropic na política.

### 10. AI tutor — guard-rails sempre

- Escopo via RAG ao curso atual; recusar fora ("Não posso responder fora do contexto deste curso").
- Citações obrigatórias com timestamp linkando à aula (`?t=segundos`).
- Watermark visível: "Respostas geradas por IA, podem conter erros".
- Proibido gerar SQL/ABAP executável em produção. Modelo deve refusal.
- Rate limit por usuário/dia.

## Convenções de código

- Idioma do código: **inglês** (nomes de tabela, função, variável). Strings de UI em pt-BR via `next-intl`.
- Slugs de URL em pt-BR (`/cursos/...`, `/aprender/...`, `/verificar/...`).
- A aula é servida em `/aprender/[courseSlug]/[lessonId]`, não em `/aulas/[slug]`: `lessons` não tem coluna `slug`, e a rota dentro de `/aprender` já herda o gate de autenticação do layout. Se um dia a aula precisar de URL pública, aí sim cria-se o slug.
- Sem `console.log` em código de produção — usar Sentry.
- Sem `any`. Usar `unknown` + narrowing ou tipos próprios.
- Server Actions sempre validam input com Zod no servidor (não confiar no client).
- Components: PascalCase. Files: kebab-case para utils, PascalCase para componentes React.
- Comentários só onde o "porquê" não é óbvio.

## Estrutura de pastas

```
app/                  Next.js App Router
  (marketing)/        páginas públicas (home, sobre, página do curso)
  (auth)/             login, signup, recover
  (learn)/            área do aluno
  (instructor)/       autoria de curso
  (admin)/            console admin
  api/
    webhooks/         webhooks idempotentes
components/
  ui/                 shadcn primitives
  marketing/          hero, features, etc.
  learn/              player, sidebar de aula, tutor
db/
  schema.ts           Drizzle schema (single source of truth)
  rls.sql             políticas RLS + helpers SQL + triggers
  migrations/         drizzle-kit output
lib/
  supabase/           clients SSR + middleware + admin
  hubspot/            cliente + outbox drainer
  bunny/              cliente + TUS upload + signed URLs
  certificates/       render PDF + verificação
  ai/                 RAG, recomendação, tutor
  email/              templates Resend
  whatsapp/           Cloud API
docs/
  plan.md             plano completo (espelho do plan file)
  design-system.md    tokens, componentes (entrega do Claude Design)
```

## Como verificar antes de commitar

```bash
pnpm typecheck
pnpm lint
pnpm test
```

CI roda os três + drizzle migration check em todo PR. Não fazer merge com red.

## Dúvidas frequentes / armadilhas

- **"Por que minha query do Drizzle retorna vazio mesmo com dados na tabela?"** RLS. Você está sem JWT do usuário OU sem policy adequada. Em Server Component, garanta que o cliente Supabase está usando os cookies da request.
- **"Por que o Vercel está dando connection timeout?"** Você está em 5432 em vez de 6543, ou Drizzle sem `max:1, prepare:false`.
- **"O webhook do Bunny chegou duas vezes."** Esperado. Garanta idempotência por `event_id`.
- **"O AI tutor está respondendo sobre qualquer coisa."** O system prompt está aberto demais. Reaperte o escopo e ative a refusal heuristic.
