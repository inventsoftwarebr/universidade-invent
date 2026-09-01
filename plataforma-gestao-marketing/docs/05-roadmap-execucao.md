# 05 — Roadmap e Execução

**Horizonte:** 12 semanas até go-live com as 10 pessoas.
**Cadência:** 6 sprints de 2 semanas.
**Regra que rege o plano:** o time do Marketing usa o produto a partir da semana 4, não
da semana 12. Software interno que só é visto pronto é software rejeitado pronto.

## 1. Sprints

### Sprint 1 (semanas 1–2) — Fundação e acesso
- Registro no Entra ID e login SSO funcionando
- Modelo de dados completo, migrações e RLS por perfil
- Cadastro de pessoas, perfis, portfólios e capacidades
- CRUD de Projeto, Iniciativa e Tarefa
- Design system e shell da aplicação
- **Em paralelo:** oficina de 2h com coordenadora + diretora para fechar taxonomia, SLAs e capacidades reais

**Sai do sprint:** dá para cadastrar um projeto de verdade e entrar com a conta da Invent.

### Sprint 2 (semanas 3–4) — Execução do dia a dia
- Kanban e lista com filtros salvos
- Tela **Minha Semana**
- Comentários, menções e histórico de alterações
- Regras de transição de status com campos obrigatórios
- Cálculo de farol e atualização semanal de status
- E-mail transacional via Graph

> **🔹 MARCO 1 — fim da semana 4: Alpha com a coordenadora.**
> A coordenadora cadastra o portfólio real e passa a usar a plataforma em paralelo à
> ferramenta atual. Objetivo é achar o que incomoda, não validar bonito.

### Sprint 3 (semanas 5–6) — Planejamento e demanda
- Marcos e timeline (Gantt leve)
- Estimativas, capacidade e mapa de alocação
- Dependências entre tarefas
- **Intake:** formulário por tipo, fila, triagem, relógio de SLA, devolução por briefing incompleto
- Referência de arquivo no SharePoint
- Templates de projeto

**Sai do sprint:** o fluxo de demanda de design existe fim a fim.

### Sprint 4 (semanas 7–8) — Iniciativas e Teams
- Iniciativas com cadência e geração de tarefas recorrentes
- Check-in periódico com indicador e série histórica
- App do Teams: aba, notificações pessoais, digest diário e de canal
- Ciclos quinzenais de planejamento

> **🔹 MARCO 2 — fim da semana 8: Beta com 5 pessoas.**
> Coordenadora, especialista de growth, 1 analista, 1 designer, 1 SDR. Duas semanas de uso
> real, com um canal aberto para atrito. Um perfil de cada tipo — se um designer e um SDR
> não conseguirem viver na ferramenta, o problema aparece agora e não no go-live.

### Sprint 5 (semanas 9–10) — Relatórios
- Aba Executivo (E1–E7)
- Aba Gestão (G1–G9)
- Aba Individual (I1–I4)
- Filtros globais com estado na URL
- Exportação PDF e XLSX
- Digest semanal de relatório
- Calendário ICS

**Sai do sprint:** a revisão mensal de portfólio já pode rodar pela plataforma.

### Sprint 6 (semanas 11–12) — Migração, treinamento e go-live
- Migração do que está vivo nas ferramentas atuais (só o ativo; histórico fica arquivado)
- Treinamento por perfil: 90 min para gestão/owners, 45 min para executores
- Ajustes do beta
- Testes de carga, revisão de segurança e acessibilidade
- Ambiente de produção, monitoramento, plano de suporte

> **🔹 MARCO 3 — fim da semana 12: Go-live com as 10 pessoas.**
> Ferramentas anteriores viram somente-leitura no mesmo dia. Duas fontes de verdade
> convivendo é a forma mais confiável de matar a nova.

## 2. Marcos e critérios de saída

| Marco | Semana | Só passa se |
|---|---|---|
| M1 — Alpha | 4 | Portfólio real cadastrado; coordenadora consegue responder "o que vence esta semana" sem planilha |
| M2 — Beta | 8 | 5 pessoas usando por 10 dias úteis; designer e SDR conseguem operar só pela fila e pelo check-in |
| M3 — Go-live | 12 | 10 pessoas com acesso; relatório executivo aprovado pela diretoria; ferramentas antigas em somente-leitura |
| M4 — Consolidação | 16 | 4 semanas pós-go-live com O1–O6 do doc 01 medidos e a primeira revisão mensal rodada pela plataforma |

## 3. Squad recomendado

| Papel | Dedicação | Quem |
|---|---|---|
| Product Owner | 25% | Coordenadora de Marketing — decide escopo e prioridade |
| Patrocinadora | Pontual | Diretora de Marketing — aprova marcos e desempata |
| Tech Lead / Full-stack sênior | 100% | Arquitetura, dados, integrações Microsoft |
| Full-stack pleno | 100% | Telas, relatórios, testes |
| Designer de produto | 30% | Do próprio time de Marketing — o designer que vai usar desenha melhor |
| Apoio do TI | Pontual | Entra ID, Teams, SharePoint |
| QA | 20% a partir do sprint 3 | Pode ser o tech lead com apoio de testes automatizados |

**Custo aproximado de time:** cerca de 2,5 pessoas dedicadas por 12 semanas, mais ~1 pessoa
distribuída em papéis de apoio.

Com um único desenvolvedor, o prazo realista passa de 12 para 18–20 semanas. É uma
possibilidade legítima — desde que a expectativa de data seja recalibrada junto, não depois.

## 4. Riscos

| # | Risco | P | I | Mitigação |
|---|---|---|---|---|
| R1 | **O time não adota — sexta ferramenta a morrer** | Alta | Crítico | Rituais desenhados antes do código (doc 02); alpha na semana 4; regra "a pauta da diretoria sai da plataforma"; doc 06 inteiro |
| R2 | Escopo cresce durante o projeto | Alta | Alto | Lista de fora-de-escopo assinada; toda inclusão troca por uma exclusão de mesmo tamanho |
| R3 | Aprovação do app do Teams pelo TI demora | Média | Médio | Abrir na semana 1; notificação por e-mail funciona sem o app |
| R4 | Dado de qualidade ruim tornando o relatório inútil | Média | Crítico | Campos obrigatórios na transição; farol que amarela por silêncio; indicador de completude visível para o time |
| R5 | Migração das ferramentas atuais consome mais que o previsto | Média | Médio | Migrar só o que está vivo; histórico vira export arquivado |
| R6 | Designers viram gargalo mesmo com a ferramenta | Alta | Alto | SLA, cota de urgência limitada, fila priorizada pela coordenadora, devolução por briefing incompleto |
| R7 | Relatório usado como placar de pessoas | Média | Crítico | Sem tela de ranking; I3 restrito a one-on-one; política escrita |
| R8 | Indisponibilidade do dev por demanda de cliente externo | Média | Alto | Dedicação acordada por escrito com a liderança de tecnologia antes da semana 1 |
| R9 | Política de dados obriga hospedagem em Azure | Baixa | Médio | Decidir na semana 1; arquitetura é portável |

## 5. Definição de pronto do MVP

O go-live acontece quando **todas** as afirmações abaixo forem verdadeiras:

- [ ] As 10 pessoas entram com a conta Microsoft, sem senha nova
- [ ] Todo projeto ativo do Marketing está cadastrado com owner, data-alvo e marcos
- [ ] Toda iniciativa ativa está cadastrada com cadência, owner e indicador
- [ ] Nenhuma tarefa existe sem pai, responsável e prazo
- [ ] Minha Semana responde "o que é meu hoje" em um clique, para os quatro perfis
- [ ] A fila de design tem SLA rodando e briefing obrigatório
- [ ] O mapa de capacidade mostra sobrecarga das próximas 4 semanas
- [ ] As três abas de relatório carregam em menos de 3 s e exportam PDF/XLSX
- [ ] A diretora aprovou a aba executiva como pauta da reunião mensal
- [ ] Notificação e digest chegam no Teams
- [ ] Documentação de uso publicada e treinamento realizado por perfil
- [ ] Ferramentas anteriores em somente-leitura
- [ ] Plano de suporte definido: quem corrige bug, em quanto tempo

## 6. Depois do go-live

**Semanas 13–16 — estabilização.** Suporte próximo, ajustes semanais, medição de O1–O6.

**Fase 2 (a partir da semana 17), na ordem provável de valor:**
1. Aprovação e criação de tarefa dentro do Teams
2. Complemento do Outlook para intake por e-mail
3. Endpoint de leitura para Power BI
4. Automações simples (concluiu marco → notifica quem pediu)
5. Painel público de acompanhamento para outras áreas consultarem o Marketing
6. Abertura para um segundo departamento — decisão a ser tomada **com dados de uso reais**, não por antecipação

Sobre o item 6, uma observação de método: o pedido foi construir só para o Marketing, e o
plano respeita isso. A opção tem um custo conhecido — abrir para uma segunda área depois
exigirá rever permissões e hierarquia. É um custo aceitável e consciente: otimizar hoje
para um usuário que não existe é a forma mais comum de não entregar para o que existe.
