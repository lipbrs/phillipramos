# Decisões de arquitetura — Prospector do PubliProva

Tudo em português: código, comentário, documentação, commit e interface. O
projeto é para creators e agências brasileiras e quem mantém isto lê em
português. Os únicos termos que ficam em inglês são os **valores internos de
estado** (`discovered`, `api_active`, `do_not_contact`) e os nomes de tabela e
coluna — a interface traduz, e trocá-los depois de o banco existir seria
retrabalho sem ganho.

## ADR-001 — O primeiro contato é resposta a comentário, não DM fria

**Status:** decidido em 10/09/2026.

**Contexto.** A especificação original mandava o primeiro contato pelo Chrome
real do operador via CDP, com intervalo de 90–240 s, teto de 30/dia e aquecimento
de 5/dia. O motivo declarado: *"a API oficial da Meta não abre conversa com quem
nunca respondeu"*.

**Decisão.** Não construímos essa etapa. Dois motivos, e o primeiro já basta:

1. A Meta bloqueia abrir conversa de propósito. Dirigir o navegador logado para
   fazer o que a API recusa é contornar a restrição da plataforma — que a própria
   especificação lista em *Proibido*. O ritmo e o aquecimento são calibrados para
   a conta não ser sinalizada; isso é evasão por desenho, seja qual for a
   intenção declarada.
2. DM automática não solicitada é o que os Termos de Uso do Instagram proíbem. A
   conta em risco seria a `@publiprova.app`, que hoje é o único canal de
   distribuição da empresa.

**O que construímos no lugar.** A API oficial de mensagens do Instagram suporta
**resposta privada a comentário**: quando alguém comenta num post nosso, abre uma
janela de mensagem e podemos mandar uma DM por ali, pela API oficial. É
documentado, é suportado, e é o mecanismo que o ManyChat e o OpenReply usam.

Encaixa no que já existe: todo post agendado até 19/09 termina numa palavra-chave
— *comenta RELATÓRIO*, *comenta PRINT*, *comenta EU*. O calendário de conteúdo já
está enchendo o funil de entrada; o sistema passa a colhê-lo.

**Consequências.**

- A máquina de canal começa em `inbound_pending`. Nada é enviável antes de a
  pessoa comentar.
- Os leads chegam mais quentes: se identificaram digitando a palavra-chave.
- O volume passa a ser limitado pelo volume de comentários, não por um teto de
  disparo. O `MAX_DMS_PER_DAY` continua como teto de saúde da conta.
- Descoberta e score de ICP usam os endpoints de Instagram do vidIQ (API de
  terceiro legítima, já conectada a este workspace), não raspagem.
- O funil B (afiliados) funcionaria igual, mas está desligado hoje — ver
  ADR-005.

## ADR-002 — libsql no lugar de better-sqlite3

O `better-sqlite3` não tem binário pronto para Node 24 no Windows e exige Visual
Studio para compilar, que esta máquina não tem. O `@libsql/client` é SQLite, tem
binário pré-compilado e driver first-class no Drizzle. O `DATABASE_URL` continua
sendo um caminho `file:` em disco local; WAL, foreign keys e busy timeout ficam
em `src/db/client.ts`. O SQLite segue como fonte única da verdade.

## ADR-003 — Sem `server-only` no cliente de banco compartilhado

O worker é um processo Node comum e importa o mesmo cliente; `server-only`
quebraria ele. A trava fica na camada de consulta do Next, não no cliente.

## ADR-004 — Idioma

Resolvido pelo Phillip em 10/09: **tudo em português**. Isso alinha com o
`phillipramos/CLAUDE.md`, que já mandava pt-BR em todo o repositório. A
especificação deste subprojeto pedia código em inglês; ficou valendo o
português, com a exceção dos valores internos de estado explicada no topo.

## ADR-005 — O destino é o que o post prometeu, não WhatsApp presumido

**Status:** decidido em 10/09/2026, depois de o Phillip avisar que ainda não
existe número de WhatsApp nem programa de afiliados.

**Contexto.** O desenho anterior terminava toda conversa boa no WhatsApp e tinha
um funil B de afiliados. Nenhuma das duas coisas existe: não há número, não há
grupo, e nenhum dos posts agendados promete WhatsApp. Mandar a IA oferecer um
canal inexistente é inventar — o mesmo defeito que o filtro de afirmações
existe para impedir, só que na camada de roteamento.

**Decisão.** Cada palavra-chave carrega um `destino` explícito, e ele é o que o
post prometeu:

| Palavra | Promessa no post | `destino.tipo` |
|---|---|---|
| RELATÓRIO | "te mostro por dentro" | `demo` (link do modo demonstração) |
| PRINT | "te mando as três em texto" | `conteudo_na_dm` (o texto, na DM) |
| EU | "eu te chamo" | `pesquisa` (convite às 6 perguntas) |

`whatsapp` continua no tipo, desligado por falta de link. Um `funisAtivos`
declara quais funis podem receber lead; hoje é só `["customer"]`.

**Por que falhar no boot e não na hora.** `incoerencias()` roda no
carregamento: palavra apontando para funil desligado, ou para WhatsApp sem
link, derruba o processo. Essa incoerência não pode virar uma mensagem
estranha para uma pessoa real às duas da manhã — ela tem de impedir o sistema
de subir.

**Consequências.**

- `interested` vira `entregar_promessa`, uma vez só por lead.
- `wants_whatsapp` sem WhatsApp configurado vai para humano, com o motivo
  registrado. A IA não improvisa um canal.
- Comentário com palavra de funil desligado é registrado e ignorado, sem lead.
- Ligar afiliados depois é: preencher `links.affiliateGroup`, acrescentar
  `"affiliate"` em `funisAtivos` e dar destino a uma palavra. O código já
  aceita; o que falta é o programa existir.
