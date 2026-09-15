# Lote 04 de Reels — virada para formato nativo (15/09/2026)

> Pedido do Phillip: "atacar mais, criar mais reels, com ganchos virais que tragam
> seguidores". Antes de escrever gancho, medi o que já saiu e o que performa no nicho.

## Diagnóstico com dados

**Nossos 6 Reels (dados públicos, vidIQ, 15/09):** 40 · 10 · 3 · 12 · 3 · 2 reproduções,
1 curtida no total. O Instagram não está testando os vídeos com não-seguidores.
(Métricas de dono — retenção, salvamento — exigem conectar o Instagram no vidIQ, em
app.vidiq.com; isso é do Phillip.)

Três defeitos nossos, não do algoritmo:

1. **Capa vazia.** R4, Reel 1, R7 e R8 começam com o quadro roxo sem texto — os blocos
   entram em 0,15 s. O quadro 0 é o que o feed e a grade mostram.
2. **Cara de anúncio.** Todos usam o mesmo fundo roxo com "@publiprova.app · construindo
   em público" no topo. Nenhum fora-da-curva sem rosto do nicho tem marca na tela.
3. **R8 repete uma afirmação que não verificamos** (ver "Pendências").

**Fora-da-curva do nicho BR (vidIQ, jun–set/2026), o que se repete em ≥ 2 casos:**

| Padrão | Exemplos |
|---|---|
| POV com texto parado + música, sem rosto, loop | @anaereira 510 mil (2,6 mil seg.), @lucasdireitoo 45,6 mil com **57 seguidores**, @xbianascimento 87 mil |
| Portão de palavra-chave num ativo copiável | @isaresantos 123 mil com **"Comente RELATÓRIO"** (mesmo tema), @juliaanasantos 150 mil |
| Gancho negativo "como perder X 💀" | @anandasaori 368 mil, @julliaschwertner 396 mil |
| Diálogo de mensagens na tela | @zapnatela 406 mil, @xbianascimento 87 mil, @nutrivivian.lira 58,7 mil |

Conclusão: o mecanismo de palavra-chave está certo; faltam gancho no quadro 0 e aparência
nativa. O tamanho da conta não impede (57 seguidores → 45,6 mil).

## Os cinco (fonte em `artes/reels4/`, vídeos em `artes/video/rN-ig.mp4`)

Todos: sem rosto, sem narração (não dependem do Phillip), 0 crédito, gancho inteiro no
quadro 0, música em alta escolhida no compositor do Business Suite. Esquetes com nomes
inventados — nenhum é conversa real de cliente.

| # | Gancho (quadro 0) | Formato | Dur. | Palavra |
|---|---|---|---|---|
| R9 | POV: é dia 30 e o cliente pediu o relatório 🙂 | lista do WhatsApp; as 6 cobranças viram resposta | 8 s | PRINT |
| R10 | eu (creator) vendo a 4ª mensagem da agência pedindo o print: | tela de bloqueio empilhando notificações | 6,8 s | PRINT |
| R11 | POV: 23h47 e você ainda tá copiando o alcance de cada story na planilha 🫠 | planilha sendo digitada, relógio andando | 7 s | RELATÓRIO |
| R12 | esse relatório de campanha se montou sozinho 👀 | página real do relatório de demonstração rolando | 9 s | RELATÓRIO |
| R13 | como perder o creator na segunda campanha 💀 | isca de pausa: 4 itens de 0,8 s | 6 s | — (salvar/compartilhar) |

O R10 fala com o **creator**, não com a agência: é o público maior e o que compartilha
com a agência. O R13 também — o CTA é "manda pra agência que precisa ver".

Legendas em `artes/reels4/legendas.json`. Legendas **e** texto de tela passam pelo filtro
de afirmações do prospector (`node --experimental-strip-types checar-legendas.mjs`): o
filtro barrou "a primeira" na legenda do R13 (regra de superlativo) e o texto foi
reescrito.

## Pipeline novo — sem sandbox do Higgsfield

`artes/reels4/render.mjs`: cada Reel é um HTML com `setT(t)`; o Chrome daqui fotografa
quadro a quadro (1080×1920, 30 fps) e o ffmpeg completo do `imageio-ffmpeg`
(`pip install imageio-ffmpeg`) encoda com libx264 + faixa AAC muda. Os 5 renderizam em
~1,5 min, sem upload, sem CDN, sem limite de 120 s. Gera também `prova-rN.jpg` (folha
de 0,5 em 0,5 s) e `capa-rN.jpg` (quadro 0).

A folha de prova pegou dois defeitos: a busca do WhatsApp escapando pelas bordas da
pílula (R9) e um degradê escuro que virava névoa cinza sobre o relatório branco (R12).

## Pendências (dependem do Phillip)

1. ~~R7 e R8 agendados (17 e 19/09) têm a capa vazia.~~ **Apagados do Business Suite em
   15/09** (a fila de programados ficou vazia). Apagar funciona: hover em "Manage post",
   "Delete reel" pela ref — mover o mouse em diagonal fecha o submenu, que era o que
   falhava em 07/09. `video/r7-ig-capa.mp4` está pronto para voltar à fila; o R8 não volta.
2. **R8 e o C06 dizem "Stories somem em 24h… o dado morreu e não volta".** Não verifiquei
   isso, e desconfio que o painel profissional mantém métricas de story depois das 24 h.
   O C06 já publicou; recomendo **não republicar no R8** e trocar o slot de 19/09 por um
   Reel deste lote. Além disso, a capa do C06 diz "4 motivos" e o carrossel mostra 3.
3. Conectar o Instagram no vidIQ para medir retenção e salvamento, não só reprodução.

## Como medir (7 dias após cada um)

Reproduções de não-seguidores e seguidores ganhos por Reel. Hipótese a derrubar: formato
nativo com gancho no quadro 0 tira a conta da faixa de 2–40 reproduções. Se o R9 ou o R10
passarem de 500, o lote 05 é série de POV (um por dia); se nenhum passar de 100, o
problema não é formato — é conta nova sem sinal, e o próximo passo é colaboração com
creators, não mais vídeo.
