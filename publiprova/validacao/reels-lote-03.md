# Lote 03 de Reels — 3 iscas de pausa de 6 s (09/09/2026)

> Série pedida pelo Phillip ("precisamos de mais audiência"). Segue o formato R4 do
> lote 02 (isca de pausa de 6 s, sem voz, loop), que é o mais barato de alcance: 3 blocos
> de texto parados + conteúdo em cortes rápidos, legíveis só pausando. Custo: **0 crédito**
> — só material que já existe (gravações do painel e os PNGs dos carrosséis C04 e C06).
>
> Repurpose deliberado: o R7 e o R8 são os slides dos carrosséis C04 (09/09) e C06 (11/09)
> virando isca de pausa. O carrossel dá a leitura completa; o Reel é a versão de
> scroll-rápido para alcance — o mesmo movimento da referência Db8ZdlQRdNV.

## Nota de rumo (09/09)
O `phillipramos/CLAUDE.md` ainda diz que a Fase 0 mira "credibilidade e conversas de
pesquisa, não crescimento de audiência". O Phillip corrigiu isso em sessão nos últimos
dias ("temos que começar a aparecer para ganhar seguidores" / "precisamos de mais
audiência"): a instrução direta e repetida dele prevalece sobre o doc antigo. O piso de
honestidade continua — número publicado é número real, apresentadora é rotulada como IA.

## Os três (montagem em `artes/reels/edit6.jsx`, `edit7.jsx`, `edit8.jsx`)

### R6 — "O relatório que se monta sozinho" (`r6-ig.mp4`, 6 s)
Gravação de tela: painel → verde → relatório pronto → verde. Blocos:
1. O relatório que o cliente recebe se monta sozinho.
2. Cada entrega vira uma linha verde.
3. Olha ele nascendo:
**Legenda (palavra-chave RELATÓRIO):** O relatório do cliente não deveria custar sua
madrugada. 📄 Cada entrega do creator vira uma linha verde no painel — e no fim o
documento já sai pronto, com a marca da agência. Pausa pra ver ele nascendo, ou comenta
RELATÓRIO que eu te mostro por dentro. Construindo em público. #marketingdeinfluencia
#agencias #creators #relatoriodecampanha #socialmediabrasil

### R7 — "5 erros no relatório" (`r7-ig.mp4`, 6 s) — slides do C04
Blocos: "O relatório é a última coisa que o cliente vê antes de renovar." / "5 erros
custam a renovação." / "São esses:"
**Legenda (RELATÓRIO):** 5 erros no relatório que custam a renovação do cliente. 👀 Print
solto sem leitura, creator que sumiu escondido, métrica de vaidade no lugar do resultado,
entrega na véspera, PDF sem a marca da agência. Pausa pra ler os 5 — ou comenta RELATÓRIO
que eu te mando o checklist de fechamento. Construindo em público. #marketingdeinfluencia
#agencias #relatorio #creators #socialmediabrasil

### R8 — "O creator não é o vilão" (`r8-ig.mp4`, 6 s) — slides do C06
Blocos: "O print não chega. E o creator não é o vilão." / "3 motivos reais. Nenhum é
preguiça." / "Olha:"
**Legenda (palavra-chave EU):** O print não chega — e o creator não é o vilão. 👀 O pedido
chega dias depois do post, o insight dos stories expira em 24h, a sua mensagem afunda entre
30 marcas no mesmo WhatsApp. Cobrança não conserta estrutura: prazo no contrato, um link só
pra entregar, lembrete automático. Marca um creator que vive isso 😅 — e se você é agência,
comenta EU pra entrar na pesquisa das 15. #creators #marketingdeinfluencia #agencias
#influencermarketing #publis

## Agendados no Business Suite (10:00 fuso da máquina = 11h Brasília)
- **R6 → ter 15/09**
- **R7 → qui 17/09**
- **R8 → sáb 19/09**
Dias alternados, para não cansar o formato de 6 s três dias seguidos.

## Armadilha nova (09/09) — higgsedit mudou a resolução de caminho
No sandbox de hoje o `p.add()` passou a resolver **relativo à pasta do projeto** (o `dir`
do `project()`), não ao cwd. `p.add("r6/painel.mp4")` virou `r6/r6/painel.mp4` e quebrou.
Correção: usar **nome simples** (`p.add("painel.mp4")`) com os arquivos dentro de `<dir>/`.
Também: o campo de data do compositor de Reels **não aceita teclado** — só o date picker
(clicar no campo abre o calendário; clicar de novo FECHA; clicar no dia). Hora/minuto/AM
continuam por `input[aria-label=...]` + type.

## Estoque de conteúdo (o que resta)
Acabaram os carrosséis pré-prontos (C02–C06 publicados/agendados) e os Reels 1–3 + R4/R5.
Depois de 19/09 a fila está vazia. Próximo lote precisa de material novo: ou mais iscas de
pausa (checklist de fechamento, a conta dos 14 dias, um "antes/depois" do WhatsApp), ou
um segundo mapa/método (formato R5) por mês. Decidir depois de ver os números de 13/09+.
