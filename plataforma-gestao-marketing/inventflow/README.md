# InventFlow

Plataforma de gestão de **projetos** (têm início, meio e fim) e **iniciativas**
(rotinas contínuas) do departamento de Marketing da Invent Software.

Escopo e plano de projeto em [`../docs`](../docs). Esta é a **primeira versão**:
cobre o núcleo de execução (Sprints 1–2 do roadmap) e uma primeira versão da
página de relatórios. O que ainda não existe está listado no fim deste arquivo.

## Subir localmente

Requisitos: Node 20+, pnpm e um Postgres 14+.

```bash
cp .env.example .env.local          # ajuste DATABASE_URL e gere a SESSION_SECRET
pnpm install
pnpm db:migrate                     # cria o schema
pnpm db:seed                        # carga inicial de exemplo
pnpm dev                            # http://localhost:3000
```

Gerar uma `SESSION_SECRET`: `openssl rand -base64 48`.

Para zerar e recarregar tudo: `pnpm db:reset`.

## Entrar

| Modo | Quando | Como |
|---|---|---|
| **piloto** | `ENTRA_*` ausentes no ambiente | A tela de entrada lista o time e não pede senha |
| **entra** | `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID` e `ENTRA_CLIENT_SECRET` presentes | Login com a conta Microsoft da Invent (OIDC + PKCE) |

O modo piloto serve ao alpha e ao beta internos. **Não use em produção com dado
real.**

> O caminho do Entra ID está implementado (`lib/auth/entra.ts`,
> `app/api/auth/*`) mas **ainda não foi exercido contra o tenant da Invent** —
> depende do registro de aplicativo pelo TI. Validar antes do go-live. A
> aplicação não cria conta sozinha: quem entra no time é decisão da coordenação,
> então a pessoa precisa existir em `people` com o mesmo e-mail.

Registro de aplicativo necessário: URI de redirecionamento
`{APP_URL}/api/auth/callback`, escopos `openid profile email User.Read`.

## O que existe hoje

| Tela | O que faz |
|---|---|
| **Minha Semana** (`/`) | Atrasadas, bloqueadas, vencem hoje, esta semana, depois; check-ins pendentes; projetos que a pessoa conduz |
| **Portfólio** (`/portfolio`) | Projetos com farol, progresso, próximo marco e motivo do farol; filtro por pilar |
| **Projeto** (`/projetos/[slug]`) | Marcos, quadro kanban, atualizações de status, mudança de status com as regras de transição |
| **Iniciativas** (`/iniciativas`) | Cadência, aderência de check-in, indicador com série histórica |
| **Iniciativa** (`/iniciativas/[slug]`) | Série do indicador, check-in do período, tarefas recorrentes |
| **Relatórios** (`/relatorios`) | Três abas: executivo (diretoria), gestão da área, individual |

## Regras que o código garante

Estão em `lib/domain/` e cobertas por teste em `tests/`:

1. **Toda tarefa tem exatamente um pai** — projeto **ou** iniciativa. Garantido
   por `CHECK` no banco (`num_nonnulls(project_id, initiative_id) = 1`), não só
   pela aplicação.
2. **Responsável e prazo são exigidos na transição**, não no cadastro. A tarefa
   não sai de “A fazer” sem os dois.
3. **Bloqueio exige motivo** — também com `CHECK` no banco.
4. **Aprovar projeto exige owner e data-alvo.** Essa data vira a `baseline_due_date`
   e **nunca é reescrita**: é contra ela que “entrega no prazo” é medida. Sem
   isso, bastaria empurrar o prazo para o indicador ficar sempre verde.
5. **Pausar ou cancelar exige justificativa escrita.**
6. **Iniciativa sem indicador não é ativada.**
7. **Sobrescrever o farol exige justificativa** — e a divergência aparece no
   relatório executivo.
8. **Silêncio é sinal:** projeto sem atualização de status amarela em 8 dias e
   fica vermelho em 15.

## Decisões técnicas que merecem registro

- **Datas de prazo são `date` (`YYYY-MM-DD`), não `timestamp`.** Prazo é um dia
  do calendário; tratá-lo como instante produz o clássico “venceu ontem” para
  quem está em UTC. Instantes de evento continuam `timestamptz`.
- **`task_events` guarda toda transição.** Cycle time, fluxo acumulado,
  envelhecimento e retrabalho não são reconstituíveis a partir do estado atual
  da tarefa.
- **Sem framework de CSS.** Um `app/globals.css` com tokens explícitos custa
  menos manutenção, para este tamanho de time, do que mais uma etapa de build.
- **Sem biblioteca de gráficos.** Os SVGs estão em `components/charts.tsx`. A
  paleta foi validada para daltonismo e contraste, em tema claro e escuro.
- **Runtime Node em tudo.** O driver `postgres` não funciona no Edge.
- **`max: 1, prepare: false` no cliente Postgres** — obrigatório quando o destino
  é um pooler em transaction mode (porta 6543).
- **Sem apontamento de horas.** “Realizado” nos relatórios é a soma das
  estimativas das tarefas concluídas, e a tela diz isso. Timesheet ficou fora do
  MVP por decisão de escopo.

## Verificar antes de commitar

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Dados de exemplo

`db/seed.ts` cria as dez pessoas nos papéis reais do Marketing, mas **nomes,
e-mails e todo o conteúdo de projetos e tarefas são exemplos**. O domínio
`exemplo.local` está lá de propósito, para quebrar caso alguém esqueça de
substituir pelo time real antes do alpha.

O histórico é gerado com semente fixa: rodar o seed duas vezes produz o mesmo
banco, para que o relatório possa ser conferido.

## O que ainda não existe

Em ordem de prioridade, seguindo o roadmap do escopo:

1. **Intake de demandas com SLA** (Sprint 3) — formulário por tipo, fila,
   triagem e relógio de SLA. É o que destrava os relatórios **G5 (fila e SLA de
   design)** e **G6 (origem das demandas)**, hoje marcados como sem dado.
2. **Estimativa e capacidade na criação** — o mapa de capacidade já funciona,
   mas depende de a estimativa ser preenchida.
3. **Timeline / Gantt de marcos por portfólio** (Sprint 3).
4. **Notificações e app do Teams, calendário no Outlook, anexos no SharePoint**
   (Sprints 4–5).
5. **Exportação PDF/XLSX e digest semanal** (Sprint 5).
6. **Templates de projeto e recorrência automática de tarefas de iniciativa.**

Os espaços dos gráficos que ainda não têm dado ficam **vazios e explicados** na
tela. Preencher com número inventado seria a forma mais rápida de perder a
confiança no relatório.
