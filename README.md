# Universidade Invent

Plataforma de cursos da [Invent Software](https://inventsoftware.com.br/) — ISV parceira SAP (3x certificada). Cursos sobre nossos addons fiscais, financeiros/bancários e de contratos para SAP Business One e SAP S/4HANA Cloud ERP.

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Tailwind CSS** + shadcn/ui
- **Supabase** — Postgres + Auth + Storage + Realtime + pgvector
- **Drizzle ORM** (driver postgres-js, Supavisor transaction mode)
- **Bunny Stream** — hospedagem de vídeo (HLS, capítulos, signed URLs)
- **Vidstack** — player
- **Resend** — email transacional
- **WhatsApp Cloud API** — notificações opt-in
- **HubSpot** — sync event-driven (outbox pattern)
- **AI**: Claude 3.5 Sonnet (tutor), GPT-4o-mini (auto-quiz, capítulos), text-embedding-3-small + pgvector (RAG e recomendação)
- **Hospedagem:** Vercel Pro

## Quick start

```bash
pnpm install
cp .env.example .env.local      # preencher com as chaves
pnpm db:migrate                  # aplicar migrations Drizzle
pnpm dev
```

App em http://localhost:3000.

## Scripts principais

| Comando | O que faz |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Build de produção |
| `pnpm typecheck` | TS strict check |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm e2e` | Playwright (caminho dourado: signup → aula → quiz → certificado) |
| `pnpm db:generate` | Gera migration a partir do schema |
| `pnpm db:migrate` | Aplica migrations |
| `pnpm db:studio` | UI do Drizzle Studio |

## Regras críticas

Antes de mexer no projeto, **leia `CLAUDE.md`**. Áreas com pegadinhas:

- Postgres precisa estar em Supavisor transaction mode (porta 6543), Drizzle com `max:1, prepare:false`.
- Supabase Auth usa `@supabase/ssr` no padrão canônico (server / client / middleware).
- Vídeo é Bunny, nunca Supabase Storage.
- Toda tabela tem RLS habilitado e forçado. Default deny.
- Webhooks são idempotentes (assinatura HMAC + verificação por `provider_event_id`).

## Documentação

- Plano de implementação: `docs/plan.md`
- Design system: `docs/design-system.md` (entrega do Claude Design)
- Convenções para Claude/IA: `CLAUDE.md`
