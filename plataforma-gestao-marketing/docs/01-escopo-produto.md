# 01 — Escopo do Produto

## 1. Contexto e diagnóstico

O Marketing da Invent Software já passou por ClickUp, Asana, Trello e Microsoft Planner.
Nenhuma pegou. Antes de escrever requisito, vale nomear por que isso acontece — porque a
plataforma nova falha do mesmo jeito se o diagnóstico estiver errado.

| Sintoma observado | Causa provável | Como este escopo responde |
|---|---|---|
| A ferramenta vira cemitério de cards em 6 semanas | Nenhum ritual obriga o uso; atualizar é trabalho extra sem retorno visível | Rituais definidos no doc 02 e telas desenhadas *para* esses rituais |
| Ninguém sabe o status real de um projeto | Status é texto livre, sem regra de atualização nem data de validade | Status com dono, com prazo de validade e com farol que amarela sozinho quando envelhece |
| O relatório para a diretoria é feito na mão em PowerPoint | A ferramenta genérica não conhece o vocabulário da área | Página de relatórios nativa, com os cortes que a diretoria pede (doc 03) |
| Demanda chega por Teams, WhatsApp e corredor | Não existe porta de entrada única | Intake obrigatório com formulário e fila |
| "É mais uma senha, mais uma aba" | Ferramenta fora do ambiente de trabalho real | Login Entra ID, app dentro do Teams, prazos no Outlook (doc 04) |
| Rotina do dia a dia não cabe em "projeto" | O modelo só tem uma forma de trabalho | Modelo com duas formas: Projeto e Iniciativa |

**Nota de gestor, dita uma vez:** construir software interno custa mais do que assinar
um SaaS. A decisão só se paga por três razões — o modelo Projeto × Iniciativa que
nenhuma ferramenta de prateleira entrega pronto, a página de relatórios sob medida para
a diretoria, e a integração nativa com o ambiente Microsoft já usado na casa. Se em
algum momento o projeto começar a virar "um ClickUp nosso", ele perdeu o motivo de existir.
Registrado; o plano segue como pedido.

## 2. Objetivo do produto

> Dar ao Marketing da Invent uma fonte única de verdade sobre o que está sendo feito,
> por quem, até quando e em que situação — e transformar isso, sem trabalho manual,
> em leitura de gestão para a coordenação e para a diretoria.

### Objetivos mensuráveis (12 semanas após o go-live)

| # | Objetivo | Indicador | Meta |
|---|---|---|---|
| O1 | Tudo que o time faz está na plataforma | % de entregas do mês que existiam como tarefa antes de serem feitas | ≥ 90% |
| O2 | O dado é confiável | % de tarefas ativas com responsável, prazo e estimativa preenchidos | ≥ 95% |
| O3 | Prazo vira compromisso | Entregas no prazo (on-time delivery) | ≥ 80% |
| O4 | O relatório substitui a planilha | Horas/mês da coordenadora montando relatório manual | de ~8h para 0 |
| O5 | A ferramenta vira hábito | Pessoas do time com acesso em ≥ 4 dias por semana | 9 de 10 |
| O6 | Design deixa de ser gargalo invisível | % de demandas de design atendidas dentro do SLA | ≥ 85% |

### Não-objetivos do MVP

Aumentar leads, substituir o HubSpot, medir performance de campanha, controlar
orçamento de mídia, servir outras áreas da Invent. Esta plataforma mede **execução de
trabalho**, não resultado de marketing.

## 3. Usuários

Dez pessoas, quatro perfis de uso. O desenho de tela muda conforme o perfil.

| Pessoa | Perfil no sistema | O que precisa em 10 segundos | Frequência de uso |
|---|---|---|---|
| Diretora de Marketing | **Diretoria** | Saúde do portfólio, o que atrasou, para onde foi o esforço do time | 2–3× por semana, e na reunião mensal |
| Coordenadora | **Gestão** | Prazos da semana, quem está sobrecarregado, o que está bloqueado | Várias vezes ao dia |
| Especialista de Growth e IA | **Owner** | Seus projetos, seus experimentos, resultado das iniciativas | Diária |
| 3 Analistas de Marketing | **Owner / Executor** | Minha semana, minhas tarefas, o que preciso pedir para o design | Diária |
| 2 Designers | **Executor com fila** | Fila priorizada, briefing completo, prazo acordado | Diária |
| 2 SDRs | **Executor de iniciativa** | Cadência do dia, metas de atividade, o que a campanha exige deles | Diária |

**Consequência de projeto:** os designers e os SDRs quase não criam trabalho, eles
consomem. Se a tela inicial deles for um formulário de cadastro, perdemos os dois perfis.
Para eles a plataforma começa em uma fila e em um check-in, nada mais.

## 4. Modelo conceitual — o coração do produto

Duas formas de trabalho, propositalmente diferentes:

### Projeto — tem início, meio e fim

Um esforço com data de término e um resultado definido. *Lançamento do TaxPlus para
S/4HANA Cloud. Rebranding do site. Participação no SAP Summit. Campanha de fim de ano.*

Um projeto responde: **entregou o que prometeu, no prazo que prometeu?**

Estrutura: Portfólio → Projeto → Marcos → Tarefas → Subtarefas.

### Iniciativa — é contínua, sem data de fim

Uma rotina que roda em cadência e sustenta o negócio. *Gestão de redes sociais. Cadência
de prospecção dos SDRs. Nutrição de base por e-mail. Produção de blog. Atendimento de
demandas de design. Monitoramento de concorrência.*

Uma iniciativa responde: **está rodando na cadência combinada e com que resultado?**

Estrutura: Portfólio → Iniciativa → Cadência (diária/semanal/mensal) → Tarefas recorrentes
→ Check-in periódico com indicador.

### A distinção em uma tabela

| | **Projeto** | **Iniciativa** |
|---|---|---|
| Tem data de fim | Sim, obrigatória | Não |
| Pergunta que responde | Entregou no prazo? | Está rodando e rendendo? |
| Unidade de acompanhamento | Marco e % de conclusão | Check-in do período e indicador |
| Como é aprovado | Entra no portfólio por decisão da diretoria | Existe enquanto fizer sentido; revisada por trimestre |
| Como aparece no relatório | Timeline, farol, entrega no prazo | Aderência da cadência, série do indicador |
| Como morre | Concluído ou cancelado | Encerrada por decisão explícita |

### Regras invioláveis do modelo

1. **Toda tarefa tem pai.** Nenhuma tarefa existe solta — pertence a um projeto ou a uma
   iniciativa. Isso é o que garante que o relatório feche.
2. **Todo projeto tem um único owner.** Responsabilidade compartilhada é responsabilidade
   de ninguém. Colaboradores são vários; dono é um.
3. **Toda iniciativa tem um indicador.** Se não dá para dizer se foi bem, é rotina
   invisível e não deveria consumir tempo do time.
4. **Todo item tem prazo.** Iniciativa tem prazo de check-in, não de conclusão.
5. **Status tem validade.** Projeto sem atualização há mais de 7 dias amarela sozinho
   no farol; há mais de 14, fica vermelho. Silêncio é sinal, não neutralidade.

## 5. Ciclo de vida e status

### Projeto

```
Ideia → Em avaliação → Aprovado → Em execução → Em revisão → Concluído
                            ↘ Pausado ↗            ↘ Cancelado
```

- **Ideia:** qualquer pessoa registra. Não consome capacidade.
- **Em avaliação:** coordenadora dimensiona (esforço, impacto, prazo). Vai à diretoria se passar de um limite de esforço a definir.
- **Aprovado:** tem owner, data-alvo e capacidade reservada. Ainda não começou.
- **Em execução:** tarefas rodando. Exige atualização de status semanal.
- **Em revisão:** entregue, aguardando aprovação de quem pediu.
- **Concluído:** aprovado. Dispara pedido de retrospectiva curta (3 campos).
- **Pausado / Cancelado:** exigem justificativa em texto. Entram no relatório — projeto cancelado é informação de gestão, não vergonha.

### Tarefa

```
A fazer → Em execução → Em revisão → Concluída
              ↕
          Bloqueada  (exige motivo e quem destrava)
```

**Bloqueada** é um estado de primeira classe, com dono do desbloqueio e data. A soma dos
dias em "Bloqueada" é uma das leituras mais úteis do relatório de gestão.

### Iniciativa

```
Ativa ⇄ Pausada → Encerrada
```

Com check-in obrigatório na cadência definida (semanal ou mensal): o que rodou, o
indicador do período, o que trava.

### Farol de saúde (health)

Calculado pelo sistema, com possibilidade de override do owner **mediante justificativa
escrita** — e o relatório mostra quando houve override, para a diretoria enxergar
divergência entre o dado e a percepção.

| Farol | Regra automática |
|---|---|
| 🟢 Verde | Sem marco vencido, status atualizado há ≤ 7 dias, ≤ 10% das tarefas atrasadas |
| 🟡 Amarelo | Um marco em risco (vence em ≤ 5 dias com <70% concluído), ou status parado há 8–14 dias, ou 10–25% das tarefas atrasadas |
| 🔴 Vermelho | Marco vencido, ou status parado há >14 dias, ou >25% das tarefas atrasadas, ou bloqueio ativo há >5 dias |

## 6. Escopo funcional

### 6.1 Dentro do MVP

**Estrutura e cadastro**
- Portfólios (pilares do Marketing: Demanda & Growth, Marca & Conteúdo, Produto & Lançamentos, Eventos, Pré-vendas, Design)
- Projetos com owner, portfólio, datas, objetivo, marcos, orçamento de esforço
- Iniciativas com owner, cadência, indicador e meta
- Tarefas e subtarefas com responsável, prazo, estimativa em horas, prioridade, etiquetas
- Dependências simples entre tarefas ("bloqueia / depende de")
- Templates de projeto e de iniciativa (lançamento de produto, evento, campanha — o time cria os seus)

**Execução**
- Quadro Kanban por projeto, por pessoa e por portfólio
- Visão em lista com filtros salvos e ordenação
- **Minha Semana** — a tela de abertura da maior parte do time: o que vence, o que atrasou, o que está bloqueado
- Comentários com menção (@pessoa) e histórico imutável de alterações
- Anexos apontando para SharePoint/OneDrive (referência, sem duplicar arquivo)
- Checklists dentro da tarefa

**Planejamento**
- Timeline (Gantt leve) com marcos por projeto e visão de portfólio
- Estimativa por tarefa e **capacidade semanal por pessoa** (horas úteis configuráveis)
- Mapa de alocação: quem está acima da capacidade, por semana
- Ciclos quinzenais de planejamento (o time escolhe o que entra)

**Intake — porta de entrada única**
- Formulário de solicitação com campos obrigatórios por tipo (peça de design, conteúdo, campanha, apoio a evento)
- Fila com triagem da coordenadora: vira tarefa, vira projeto, ou é recusada com motivo
- **SLA por tipo de demanda**, com relógio contando a partir do briefing completo
- Recusa por briefing incompleto devolve ao solicitante — protege os designers

**Iniciativas em operação**
- Geração automática de tarefas recorrentes conforme cadência
- Check-in do período com formulário curto (3 campos + indicador)
- Série histórica do indicador de cada iniciativa

**Relatórios** — especificados no doc 03.

**Notificações** — via Teams e e-mail, especificadas no doc 04.

**Administração**
- Perfis: Diretoria, Gestão, Owner, Executor
- Configuração de portfólios, tipos de demanda, SLAs, capacidades e feriados
- Log de auditoria

### 6.2 Fora do MVP (fase 2 em diante, deliberadamente)

Controle de horas apontadas (timesheet), gestão de orçamento financeiro, portal para
fornecedores e agências, automações condicionais complexas ("se X então Y"), OKRs
formais, chat interno próprio, aplicativo móvel nativo, sincronização bidirecional com
Planner, IA generativa para redigir briefing, multi-departamento.

**Por que fora:** cada item acima é uma ferramenta inteira. Entrar com eles no v1 é o
caminho mais rápido para não entregar em 12 semanas — que é exatamente o erro que
transformou as tentativas anteriores em cemitério.

## 7. Modelo de dados (visão lógica)

| Entidade | Campos essenciais |
|---|---|
| `person` | nome, e-mail corporativo, cargo, perfil, capacidade semanal (h), Entra ID object id |
| `portfolio` | nome, pilar, responsável, cor |
| `project` | título, portfólio, owner, objetivo, data início, data-alvo, data real de conclusão, status, farol, farol_override + justificativa, esforço estimado, prioridade |
| `milestone` | projeto, título, data-alvo, data real, status |
| `initiative` | título, portfólio, owner, cadência, descrição, indicador, unidade, meta do período, status |
| `initiative_checkin` | iniciativa, período, valor do indicador, o que rodou, o que travou, autor, data |
| `task` | título, pai (projeto **ou** iniciativa), responsável, status, prioridade, prazo, estimativa (h), início real, conclusão real, motivo do bloqueio, dependências |
| `intake_request` | solicitante, tipo, briefing (campos por tipo), data do pedido, data do briefing completo, SLA-alvo, decisão de triagem, item gerado |
| `comment`, `attachment_ref`, `audit_log` | histórico e rastreabilidade |
| `status_update` | projeto, autor, data, resumo, farol declarado |

Duas decisões de modelagem que valem registro:

- `task.parent` é polimórfico (projeto ou iniciativa) e **não aceita nulo**. É a tradução técnica da regra "toda tarefa tem pai".
- Datas *planejadas* e datas *reais* são colunas distintas em projeto, marco e tarefa. Sem isso, não existe indicador de prazo — a ferramenta que sobrescreve a data planejada quando o prazo escorrega apaga a própria memória, e essa é uma das razões pelas quais as anteriores nunca produziram relatório útil.

## 8. Telas do MVP

| # | Tela | Público principal | Conteúdo |
|---|---|---|---|
| 1 | **Minha Semana** (home) | Todos | Vence hoje / esta semana / atrasado / bloqueado, check-ins pendentes |
| 2 | **Portfólio** | Diretoria, Gestão | Cards de projeto com farol, owner, próximo marco, % concluído; filtro por pilar |
| 3 | **Projeto** | Owner, Gestão | Cabeçalho com farol e datas, abas: Tarefas (kanban/lista), Marcos, Timeline, Status, Arquivos |
| 4 | **Iniciativas** | Todos | Lista com cadência, último check-in, indicador e tendência |
| 5 | **Timeline** | Gestão, Diretoria | Gantt de marcos por portfólio, com hoje marcado e itens em risco destacados |
| 6 | **Fila de Demandas** | Designers, Gestão | Fila priorizada com SLA, briefing e botão de "briefing incompleto" |
| 7 | **Capacidade** | Gestão | Grade pessoa × semana com horas alocadas vs. capacidade |
| 8 | **Relatórios** | Diretoria, Gestão, Individual | Três abas — detalhado no doc 03 |
| 9 | **Solicitar** | Todos | Formulário de intake |
| 10 | **Admin** | Gestão | Pessoas, portfólios, tipos de demanda, SLAs, capacidades |

## 9. Requisitos não funcionais

- **Acesso:** exclusivamente via Entra ID (SSO). Sem senha própria — requisito de adoção, não só de segurança.
- **Desempenho:** telas de trabalho abaixo de 1,5 s; página de relatórios abaixo de 3 s com 12 meses de histórico.
- **Disponibilidade:** horário comercial brasileiro é o que importa; janela de manutenção fora dele.
- **Dispositivo:** desktop em primeiro lugar; responsivo o suficiente para consultar "Minha Semana" e aprovar no celular.
- **Idioma:** pt-BR na interface inteira.
- **Datas:** armazenar em UTC, exibir em America/São_Paulo, formato DD/MM/AAAA.
- **LGPD:** a plataforma trata dado de colaborador (nome, e-mail corporativo, carga de trabalho). Acesso restrito por perfil, log de auditoria, e política interna informando que dados de execução são usados para gestão da área.
- **Exportação:** todo relatório exporta para XLSX e PDF. Sem isso, a diretoria volta ao PowerPoint.

## 10. Stack recomendada

Mesma base tecnológica já dominada na casa, para não abrir uma segunda frente de aprendizado:

- **Front/Back:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **Banco:** Postgres gerenciado (Supabase) com RLS por perfil
- **Auth:** Entra ID via OIDC — provedor único
- **Gráficos:** biblioteca de charts React, com paleta única definida no design system
- **Jobs:** rotina agendada para recorrências, recálculo de farol e digest diário
- **Hospedagem:** Vercel, ambiente separado de produção e homologação
- **Observabilidade:** Sentry + log de auditoria em banco

Decisão em aberto para a semana 1: se a política de dados da Invent exigir residência ou
hospedagem em tenant Microsoft, o alvo passa a ser Azure (App Service + Postgres
Flexible Server). Isso muda infraestrutura, não muda arquitetura nem escopo.
