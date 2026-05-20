# Plano de implementação — Universidade Invent

Espelho do plan file da sessão de planejamento. Atualizar este arquivo conforme escopo evoluir.

> **Resumo executivo:** plataforma de cursos greenfield para a Invent Software (ISV parceira SAP). Substitui a plataforma atual (com bugs, fora da identidade visual, UX ruim). MVP em 8 semanas, v1 completa em 14-16 semanas. Stack: Next.js 15 + Supabase + Bunny Stream + Vercel Pro. IA na v1 (recomendação híbrida + tutor RAG). HubSpot event-driven via outbox.

## Decisões travadas

| Tema | Decisão |
|---|---|
| Hospedagem | Vercel Pro |
| Backend | Supabase (Postgres + Auth + Storage + Realtime + pgvector) |
| Vídeo | Bunny Stream |
| Roles | Admin + Instrutor + Aluno; aluno tem `subtype` (cliente/parceiro/lead) |
| Migração | Greenfield (sem importação da plataforma antiga) |
| Idioma | pt-BR no MVP, código i18n-ready |
| IA | Recomendação + AI tutor — entra na v1, não MVP |

## Contestações estratégicas

1. Vercel Hobby não pode ser usado comercialmente — Pro obrigatório.
2. Vídeo no Supabase Storage está descartado (Bunny resolve).
3. HubSpot "bidirecional real-time" corrompe CRM — outbox event-driven.
4. AI tutor e auto-quiz dependem de transcrição → sequenciar para v1.
5. Role "Professor" separado é overkill — Admin/Instrutor/Aluno basta no MVP.

## Cronograma

### MVP (8 semanas)

| Semana | Entregáveis |
|---|---|
| 1 | Bootstrap: Next.js + TS + Tailwind + shadcn + Drizzle + Supabase + CI. Auth. Layout base, tokens. Conta Bunny |
| 2 | Schema completo: profiles, companies, courses, modules, lessons, video_assets, enrollments. RLS + helpers. Seed. Admin gate |
| 3 | UI de autoria (admin/instrutor): curso/módulos/aulas. Upload Bunny via TUS. Webhook → status=ready |
| 4 | Catálogo + página do curso + player Vidstack HLS Bunny + persistência de watch position (heartbeat 10s) |
| 5 | Quizzes (single/multiple) + tentativas + lógica de aprovação. Aprovação dos templates WhatsApp iniciada |
| 6 | Certificados v0: template fixo, regra padrão, PDF, verificação pública, QR |
| 7 | Emails transacionais (Resend) + WhatsApp opt-in + HubSpot sync v0 (contatos + completion) |
| 8 | Hardening: Sentry, dashboard admin básico, páginas LGPD, acessibilidade, mobile. UAT interno |

### v1 (semanas 9-16)

| Semana | Entregáveis |
|---|---|
| 9-10 | Pipeline IA: ingestão de transcrição, chunking, embeddings, pgvector HNSW. Capítulos + resumo auto |
| 11 | AI tutor (sidebar com citações por timestamp) |
| 12 | Engine de recomendação: pipeline híbrida + personalização da home + digest por email |
| 13 | HubSpot completo: outbox drainer, lifecycle automation, behavioral events |
| 14 | Assignments (file/text/url), revisão manual, gradebook |
| 15 | Certificados configuráveis (templates, regras), PAdES opcional, share LinkedIn |
| 16 | Polimento de autoria: bulk upload, drafts, scheduled publish, Q&A, aulas live |

### Backlog pós-launch

Cursos pagos (Stripe + Pix), learning paths/tracks, cohorts, fóruns, app Expo, SCORM/xAPI, white-label parceiros, EN/ES, DRM Widevine, gamificação.

## Riscos críticos (consolidados no CLAUDE.md)

Connection storms, cold start, edge runtime, pirataria de vídeo, LGPD, alucinação AI tutor, fraude de certificado, moderação de conteúdo, duplicatas HubSpot, aprovação WhatsApp (24-72h), deliverability email BR, índice pgvector HNSW, supabase storage cost, drift auth.users/profiles, timezones BR, design + polish.

## Próximos passos

1. **Cliente entrega no Claude Design**: tokens (cores/tipografia/espaçamento/radius), logo SVG, ícones, ilustrações, screenshots. Bloqueante para identidade visual.
2. Aprovar Vercel Pro + criar projeto Supabase em `sa-east-1`.
3. Criar conta Bunny Stream e gerar API key.
4. Validar tier HubSpot (Marketing Hub Pro impacta Behavioral Events).
5. Definir 5 cursos-piloto para o MVP.
6. DPO + política de privacidade revisada com jurídico antes do launch.
