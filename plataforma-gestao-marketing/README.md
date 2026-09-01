# InventFlow — Plataforma de Gestão de Projetos e Iniciativas

> **Projeto novo e independente.** Não faz parte da Universidade Invent nem de qualquer
> outro produto do portfólio (TaxPlus, BankPlus, ContractPlus, RHello, Comex).
> Esta pasta existe neste repositório apenas como local de trabalho do planejamento;
> a implementação nasce em repositório próprio.

**Cliente interno:** Departamento de Marketing da Invent Software (10 pessoas)
**Papel deste documento:** escopo de produto e plano de projeto
**Nome de trabalho:** InventFlow (a definir pelo time)
**Horizonte do MVP:** 8 a 12 semanas até o go-live com o time inteiro

## Índice

| Documento | O que responde |
|---|---|
| [01 — Escopo do produto](docs/01-escopo-produto.md) | Problema, objetivos, modelo conceitual, funcionalidades, entidades, telas |
| [02 — Modelo operacional](docs/02-modelo-operacional.md) | Papéis, rituais, regras de uso, políticas de dado, SLA de design |
| [03 — Relatórios e indicadores](docs/03-relatorios-indicadores.md) | Especificação da página de relatórios: gráficos, fórmulas, leituras |
| [04 — Integrações Microsoft 365](docs/04-integracoes-microsoft.md) | Entra ID, Teams, Outlook, SharePoint, Graph API |
| [05 — Roadmap e execução](docs/05-roadmap-execucao.md) | Sprints, marcos, squad, riscos, critérios de aceite |
| [06 — Plano de adoção](docs/06-plano-adocao.md) | Por que as ferramentas anteriores falharam e como não repetir |

## Implementação

A primeira versão da aplicação está em [`inventflow/`](inventflow/) — Next.js +
Postgres, cobrindo o núcleo de execução (Sprints 1–2 do roadmap) e uma primeira
versão da página de relatórios. Veja o [README da aplicação](inventflow/README.md)
para subir localmente e para a lista do que ainda não existe.

## Resumo em cinco linhas

1. O Marketing não tem uma fonte única de verdade: demanda entra por Teams, WhatsApp e corredor, e o status vive na cabeça das pessoas.
2. A plataforma organiza o trabalho em **Projetos** (início, meio e fim) e **Iniciativas** (rotinas contínuas), com toda tarefa obrigatoriamente ligada a um dos dois.
3. Prazo, responsável, status e esforço são campos obrigatórios — é isso que torna o relatório confiável.
4. A página de relatórios tem três camadas: diretoria, gestão da área e individual. Ela é a pauta das reuniões, não um anexo delas.
5. Adoção é entregável de projeto, não consequência: rituais definidos, login sem senha nova via Entra ID e notificação dentro do Teams.
