# 04 — Integrações Microsoft 365

A Invent opera inteiramente no ecossistema Microsoft. A plataforma não compete com esse
ambiente: ela vive dentro dele. Cada integração abaixo tem uma justificativa de adoção,
não de tecnologia.

## 1. Entra ID (Azure AD) — SSO obrigatório

**Por que primeiro:** "mais um login" é motivo real de abandono. Entrar com a conta da
Invent, sem senha nova, é requisito de adoção — por isso está no primeiro sprint, não no último.

- Autenticação OIDC com o tenant da Invent
- Provisionamento do perfil no primeiro acesso (nome, e-mail, foto, cargo) via Microsoft Graph
- Grupos do Entra ID mapeados para perfis da plataforma, quando existirem
- Sem cadastro local de senha em nenhuma hipótese

**Permissões Graph:** `User.Read`, `User.ReadBasic.All`

## 2. Microsoft Teams — onde o time já está

O time não vai abrir uma aba nova para descobrir que algo venceu. A notificação tem de
chegar onde ele já está.

| Recurso | O que faz | Fase |
|---|---|---|
| **App com aba** | Quadro do time e Minha Semana dentro de um canal do Teams | MVP |
| **Notificação pessoal** | Tarefa atribuída, prazo em 24h, tarefa atrasada, menção, bloqueio no seu nome | MVP |
| **Digest diário** | 8h30: o que vence hoje e o que atrasou, por pessoa | MVP |
| **Digest do canal** | Segunda 7h no canal do Marketing: prazos da semana e faróis vermelhos | MVP |
| **Aprovar pela notificação** | Aprovar entrega ou confirmar prazo sem sair do Teams | Fase 2 |
| **Criar tarefa a partir de mensagem** | Ação de mensagem "Virar tarefa no InventFlow" | Fase 2 |

**Nota de projeto:** publicar app no catálogo do Teams exige aprovação do TI da Invent.
É dependência externa com prazo próprio — precisa ser aberta na semana 1, não na semana 10.
Está no registro de riscos (doc 05, R3).

## 3. Outlook e Calendário

- **Marcos e prazos no calendário:** cada pessoa assina um calendário da plataforma (ICS) com seus prazos e marcos; some do calendário quando concluído
- **Convites dos rituais** criados a partir da plataforma com a pauta já no corpo
- **Complemento do Outlook** para transformar e-mail em solicitação, levando remetente, assunto e anexos direto para o formulário de intake — **fase 2**, porque a demanda do Marketing entra mais por Teams do que por e-mail
- **E-mail transacional** por Microsoft Graph com a conta corporativa, e não por serviço externo: melhor entregabilidade interna e nada de "e-mail de robô desconhecido"

**Permissões Graph:** `Calendars.ReadWrite` (delegado), `Mail.Send` (aplicativo, remetente dedicado)

## 4. SharePoint e OneDrive — arquivo mora onde já mora

Duplicar arquivo é criar duas verdades. A plataforma guarda **referência**, não cópia.

- Cada projeto aponta para uma pasta no SharePoint do Marketing, criada automaticamente a partir de um template de estrutura
- Anexo de tarefa é link para o item no SharePoint/OneDrive, com nome, tipo e miniatura
- Permissão de arquivo continua sendo do SharePoint — a plataforma não reimplementa controle de acesso a documento
- Upload direto pela interface deposita no SharePoint via Graph e guarda a referência

**Permissões Graph:** `Files.ReadWrite.All` (delegado), `Sites.ReadWrite.All` no site do Marketing

## 5. Excel e Power BI

- **Exportação XLSX** de qualquer relatório, no MVP
- **Endpoint somente leitura** para Power BI consumir os dados, na fase 2, para quem quiser cruzar com dados de outras áreas
- Os relatórios nativos vêm primeiro: se a diretoria precisar abrir o Power BI para entender o Marketing, a página de relatórios falhou

## 6. Fora de escopo, com motivo

| Item | Por que não |
|---|---|
| **Sincronização bidirecional com Planner** | Duas fontes de verdade competindo. Se o Planner continuar valendo, a plataforma nova já nasceu perdendo. Migra-se o conteúdo uma vez e desliga-se o Planner. |
| **Microsoft Project** | Peso incompatível com uma área de 10 pessoas |
| **Viva Goals / OKR** | Fora do escopo do MVP; OKR é decisão de gestão anterior à ferramenta |
| **Copilot Studio** | Interessante para depois; não sustenta adoção agora |

## 7. Sequência de implementação

| Ordem | Integração | Sprint | Bloqueia? |
|---|---|---|---|
| 1 | Entra ID SSO | 1 | Sim — tudo depende |
| 2 | Perfil e foto via Graph | 1 | Não |
| 3 | E-mail transacional via Graph | 2 | Não |
| 4 | Referência de arquivo no SharePoint | 3 | Não |
| 5 | Notificações e digest no Teams | 4 | Não |
| 6 | App com aba no Teams | 4 | Depende da aprovação do TI |
| 7 | Calendário ICS | 5 | Não |
| 8 | Export XLSX/PDF | 5 | Não |

## 8. Pendências para o TI da Invent (abrir na semana 1)

1. Registro de aplicativo no Entra ID com as permissões acima e consentimento do administrador
2. Política de publicação de app no catálogo do Teams e prazo de aprovação
3. Site do SharePoint do Marketing e permissão de escrita para a aplicação
4. Caixa de e-mail dedicada ao remetente transacional
5. Política de dados: a hospedagem pode ficar fora do tenant Microsoft? (define Vercel vs. Azure)
6. Retenção e auditoria exigidas pela política interna de segurança
