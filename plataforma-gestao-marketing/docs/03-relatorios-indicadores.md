# 03 — Relatórios e Indicadores

Esta é a página que justifica o projeto. Ela precisa responder perguntas de gestão sem
que ninguém prepare nada. Três abas, três públicos, três perguntas diferentes.

Princípio de desenho: **cada gráfico responde a uma pergunta escrita ao lado dele.**
Gráfico sem pergunta é enfeite e será removido na revisão de design.

---

## Aba 1 — Executivo (Diretoria)

Pergunta central: *o Marketing está entregando o que se comprometeu, e onde está indo o esforço do time?*

### Faixa de indicadores (topo)

| Indicador | Fórmula | Leitura |
|---|---|---|
| Projetos ativos | contagem de projetos em execução | Volume do portfólio |
| Entregas no prazo (mês) | projetos e marcos concluídos até a data planejada ÷ total concluído | O número que a diretoria cobra |
| Projetos em risco | projetos com farol 🟡 ou 🔴 | Onde olhar primeiro |
| Marcos nos próximos 30 dias | marcos com data-alvo na janela | O que está por vir |
| Iniciativas ativas | iniciativas com status ativo | Peso da operação contínua |
| Aderência dos check-ins | check-ins feitos ÷ esperados no período | Confiabilidade do dado abaixo |

### Gráficos

| # | Gráfico | Pergunta que responde | Forma |
|---|---|---|---|
| E1 | **Saúde do portfólio** | Quantos projetos estão verdes, amarelos e vermelhos? | Rosca com contagem no centro; clique filtra a lista |
| E2 | **Entregas no prazo — 12 meses** | Estamos melhorando ou piorando em cumprir prazo? | Linha com meta de 80% marcada |
| E3 | **Onde foi o esforço** | O esforço do time bate com a prioridade estratégica? | Barras horizontais de horas por portfólio, planejado vs. realizado |
| E4 | **Linha do tempo de marcos** | O que vence nas próximas semanas e o que já venceu? | Timeline por projeto, hoje marcado, vencidos em vermelho |
| E5 | **Projeto × Iniciativa** | Quanto do time está em projeto e quanto em rotina? | Área empilhada por mês, em % de horas |
| E6 | **Entregas concluídas por mês** | O time está produzindo mais ou menos? | Barras: projetos concluídos + marcos + tarefas de iniciativa |
| E7 | **Painel de iniciativas** | Cada rotina está rodando e rendendo? | Tabela com farol, cadência, último check-in, indicador e minigráfico de tendência |

**E3 e E5 são os gráficos mais importantes desta aba.** Eles respondem à pergunta que a
diretoria realmente faz e que nenhuma das ferramentas anteriores respondia: *para onde
foi o tempo do meu time?*

### Bloco textual automático

Resumo gerado dos dados, sem redação manual: projetos que mudaram de farol no período,
marcos vencidos com dias de atraso, projetos sem status atualizado, e faróis com
override — onde a percepção do owner diverge do cálculo.

---

## Aba 2 — Gestão da Área (Coordenadora)

Pergunta central: *onde está o gargalo e quem precisa de ajuda esta semana?*

### Faixa de indicadores

| Indicador | Fórmula |
|---|---|
| Tarefas em execução (WIP) | tarefas em "Em execução" ou "Em revisão" |
| Tarefas atrasadas | prazo < hoje e não concluída |
| Bloqueios ativos | tarefas em "Bloqueada" |
| Dias médios em bloqueio | média de dias no estado, últimos 30 dias |
| Cycle time médio | dias entre início real e conclusão, últimos 30 dias |
| SLA de design cumprido | demandas entregues no prazo ÷ entregues |

### Gráficos

| # | Gráfico | Pergunta que responde | Forma |
|---|---|---|---|
| G1 | **Carga por pessoa × semana** | Quem está sobrecarregado nas próximas 4 semanas? | Mapa de calor pessoa × semana, com linha da capacidade; acima de 100% em vermelho |
| G2 | **Fluxo acumulado (CFD)** | O trabalho está fluindo ou empoçando? | Área empilhada por status, 90 dias — faixa "Em revisão" engordando denuncia gargalo de aprovação |
| G3 | **Envelhecimento do WIP** | O que está parado há tempo demais? | Dispersão: dias em aberto × status, com linha de alerta em 10 dias |
| G4 | **Cycle time por tipo** | Quanto tempo leva cada tipo de trabalho? | Barras com média e P85 — o P85 é o número que serve para prometer prazo |
| G5 | **Fila e SLA de design** | A fila está saudável? | Barras de demandas abertas por tipo + linha de % dentro do SLA por semana |
| G6 | **Origem das demandas** | Quem mais consome o time e com que antecedência? | Barras por solicitante, com antecedência média do pedido |
| G7 | **Motivos de bloqueio** | O que trava o time repetidamente? | Barras horizontais por categoria (aguardando aprovação, dependência externa, falta de informação, concorrência de prioridade) |
| G8 | **Retrabalho** | Quanto voltamos atrás? | Linha do % de tarefas que voltaram de "Em revisão" para "Em execução" |
| G9 | **Burnup do ciclo** | O ciclo atual vai fechar? | Linha de concluído vs. escopo total, com projeção |

**G1 e G5 sustentam sozinhos o weekly.** G7 é o gráfico que muda processo: se
"aguardando aprovação" domina, o problema não é o time — é a alçada de aprovação.

---

## Aba 3 — Individual

Pergunta central: *o que é meu, o que está atrasado e como eu venho indo?*

| # | Bloco | Conteúdo |
|---|---|---|
| I1 | Minhas tarefas | Agrupadas por vence hoje / esta semana / atrasadas / bloqueadas |
| I2 | Minha carga | Horas alocadas vs. capacidade, próximas 4 semanas |
| I3 | Meu desempenho | Concluídas no prazo, cycle time e retrabalho — série de 6 meses |
| I4 | Meus projetos e iniciativas | Farol de cada item que eu conduzo |

Visível para a própria pessoa, para a coordenadora e para a diretoria.

**Um cuidado explícito de gestão:** I3 existe para conversa de desenvolvimento — one-on-one
e retrospectiva —, não para ranking. Não haverá tela de comparação entre pessoas. Ferramenta
de gestão que vira placar público de produtividade destrói a confiança que a adoção
depende, e o time para de registrar o trabalho real. Isso fica escrito na política de uso.

---

## Filtros globais

Período (mês corrente, últimos 30/90 dias, trimestre, intervalo livre) · Portfólio ·
Pessoa · Produto (TaxPlus, BankPlus, ContractPlus, RHello, Comex) · Público (cliente,
parceiro, lead) · Tipo (projeto/iniciativa). Filtros preservados na URL, para colar no
Teams e a outra pessoa ver exatamente a mesma leitura.

## Exportação e envio

- Exportar aba atual em PDF (com filtros aplicados) e dados em XLSX
- **Digest semanal por e-mail e Teams**, toda segunda 7h: coordenadora recebe o corte de gestão; diretoria recebe o executivo
- Link permanente para a reunião mensal: sempre a mesma URL, sempre atualizada

## Definições que precisam ser únicas

Metade das discussões improdutivas sobre relatório vem de gente medindo a mesma palavra
de formas diferentes. Fica assim, para todos:

- **Atrasado:** prazo planejado < hoje e status ≠ concluída. Não existe "atrasado justificado" — existe prazo renegociado *antes* do vencimento, que substitui a data e preserva o histórico.
- **No prazo:** data real de conclusão ≤ data planejada **original registrada na aprovação**. Renegociação aparece no relatório como "replanejado", em cor própria. Sem isso, basta empurrar a data para o indicador ficar sempre verde.
- **Cycle time:** dias corridos entre a primeira entrada em "Em execução" e a conclusão.
- **Lead time:** dias entre a criação e a conclusão — é o que o solicitante sente.
- **WIP:** itens em "Em execução" + "Em revisão".
- **Capacidade:** horas úteis configuradas, menos ausências do período.
