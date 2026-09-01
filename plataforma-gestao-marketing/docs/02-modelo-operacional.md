# 02 — Modelo Operacional

Software não cria cultura. Ritual cria. Este documento define como o Marketing vai
trabalhar com a plataforma — e é tão entregável quanto o código.

## 1. Papéis e permissões

| Perfil | Quem | Pode |
|---|---|---|
| **Diretoria** | Diretora de Marketing | Ver tudo; aprovar/cancelar projetos; comentar; não edita tarefa alheia |
| **Gestão** | Coordenadora | Tudo de Diretoria + criar/editar qualquer item, triar intake, definir capacidade e SLA, administrar |
| **Owner** | Especialista de Growth, Analistas | Criar e conduzir projetos e iniciativas próprios; editar tarefas dos seus itens; abrir demanda |
| **Executor** | Designers, SDRs | Ver o que lhes diz respeito e o portfólio; mover as próprias tarefas; fazer check-in; abrir demanda |

Ninguém edita status de projeto que não é seu. Ninguém apaga histórico. Toda alteração
de prazo planejado fica registrada com autor e motivo.

## 2. Rituais

O calendário abaixo é o produto de verdade. As telas existem para servi-lo.

| Ritual | Quando | Duração | Quem | Tela que sustenta |
|---|---|---|---|---|
| **Abertura do dia** | Diário, individual | 5 min | Todos | Minha Semana |
| **Daily do time** | Ter/Qui, 9h30 | 15 min | Todos | Minha Semana em tela compartilhada |
| **Weekly de coordenação** | Segunda, 9h | 45 min | Coordenadora + owners | Portfólio + Capacidade |
| **Triagem de demandas** | Segunda e quarta | 20 min | Coordenadora + designers | Fila de Demandas |
| **Check-in de iniciativas** | Sexta | 15 min, assíncrono | Owners de iniciativa | Iniciativas |
| **Revisão de portfólio** | 1ª segunda do mês, 60 min | 60 min | Diretoria + coordenadora + owners | Relatórios › Executivo |
| **Retrospectiva** | Última sexta do mês | 45 min | Todos | Relatórios › Gestão |
| **Planejamento de ciclo** | A cada 15 dias | 60 min | Coordenadora + owners | Capacidade + Backlog |

### Regras dos rituais

- **A reunião mensal com a diretoria tem pauta gerada pela plataforma.** Ninguém monta slide. Se a informação não está lá, ela não entra na pauta. Essa é a regra que faz o dado ser atualizado.
- **Weekly não é status individual.** Ninguém narra o que fez; a tela já mostra. A reunião trata de exceções: vermelhos, bloqueios e realocação.
- **Check-in de iniciativa é assíncrono e curto.** Três campos. Se levar mais de 5 minutos, o formulário está errado.
- **Retrospectiva olha os números da própria área**, não impressões: cycle time, retrabalho, SLA de design, entregas no prazo.

## 3. Regras de uso — o contrato do time

Estas nove regras vão para a parede (e para a tela de boas-vindas):

1. **Se não está na plataforma, não existe.** Pedido por Teams, e-mail ou corredor não é pedido — é conversa. Resposta padrão, sem constrangimento: "abre no InventFlow que eu priorizo".
2. **Toda tarefa tem responsável, prazo e estimativa.** Sem os três, não sai de "A fazer".
3. **Prazo é compromisso, não desejo.** Prazo que vai furar se renegocia *antes* de vencer, com nova data e motivo. Furar em silêncio é o único erro grave.
4. **Status de projeto é atualizado toda segunda** pelo owner. Duas linhas bastam.
5. **Bloqueio é declarado no mesmo dia**, com quem destrava e até quando.
6. **Briefing incompleto volta.** Designer não adivinha. E a devolução não é falta de colaboração — é o que protege o prazo de todo mundo.
7. **A fila de design é priorizada pela coordenadora**, não por quem grita mais alto.
8. **Iniciativa sem indicador é revista ou encerrada** na revisão trimestral.
9. **Projeto cancelado é resultado, não fracasso.** Registra-se o motivo e segue.

## 4. Política de dados — o que faz o relatório ser confiável

| Campo | Obrigatório quando | Consequência se vazio |
|---|---|---|
| Responsável (tarefa) | Ao sair de "A fazer" | Bloqueia a transição |
| Prazo (tarefa) | Ao sair de "A fazer" | Bloqueia a transição |
| Estimativa em horas | Ao entrar no ciclo | Não conta na capacidade; a pessoa aparece falsamente livre |
| Owner (projeto) | Sempre | Não permite salvar |
| Data-alvo (projeto) | Ao aprovar | Não permite aprovar |
| Motivo do bloqueio | Ao marcar "Bloqueada" | Bloqueia a transição |
| Indicador (iniciativa) | Ao ativar | Não permite ativar |
| Justificativa de override de farol | Ao sobrescrever | Não permite sobrescrever |
| Motivo do cancelamento/pausa | Ao mudar status | Bloqueia a transição |

Regra geral: obrigar no **momento da transição**, não no cadastro. Formulário longo na
criação mata a adoção; campo pedido na hora certa é aceito.

## 5. SLA de design — resolvendo o gargalo estrutural

Dois designers atendem oito solicitantes. Sem fila e sem prazo acordado, isso vira
ansiedade de um lado e sobrecarga do outro.

| Tipo de demanda | Prazo (dias úteis, do briefing completo) | Precisa de |
|---|---|---|
| Peça avulsa para social | 2 | Texto final, formato, data de publicação |
| Kit de campanha (3–5 peças) | 5 | Briefing de campanha, público, canais |
| Landing page (layout) | 7 | Estrutura, textos, referências |
| Material de evento | 10 | Especificação gráfica, prazo da gráfica |
| Apresentação institucional | 5 | Roteiro e conteúdo aprovados |
| Urgência (exceção) | 1 | Aprovação explícita da coordenadora; **máximo 2 por semana** |

Duas travas honestas: o relógio só começa com briefing completo, e a cota de urgência é
limitada. Urgência ilimitada é o mesmo que não ter SLA.

## 6. Capacidade

- Capacidade padrão: **30 horas úteis por semana** por pessoa (as 10 restantes são reunião, imprevisto e respiro). Ajustável por pessoa.
- Alocação acima de 100% aparece em vermelho no mapa de capacidade e é pauta obrigatória do weekly.
- Férias e ausências entram no calendário e derrubam a capacidade do período automaticamente.
- Alocar alguém acima da capacidade é decisão consciente da coordenadora, com registro — não um acidente descoberto depois.

## 7. Taxonomia inicial

**Portfólios (pilares):** Demanda & Growth · Marca & Conteúdo · Produto & Lançamentos ·
Eventos & Relacionamento · Pré-vendas (SDR) · Design & Criação

**Etiquetas de produto:** TaxPlus · BankPlus · ContractPlus · RHello · Comex · ERP/Institucional · SAP B1 · SAP Cloud ERP

**Etiquetas de público:** Cliente · Parceiro · Lead

**Prioridade:** P0 (para hoje, com custo) · P1 (este ciclo) · P2 (próximo ciclo) · P3 (quando couber)

A taxonomia nasce enxuta de propósito. Toda ferramenta anterior morreu afogada em campos
customizados que ninguém preenchia — nova etiqueta só entra com dono e motivo.
