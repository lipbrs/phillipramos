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
- O funil B (afiliados) funciona igual, mais abordagem assistida em que o sistema
  redige e o operador envia.

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
