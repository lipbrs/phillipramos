# Lote 07 — 10 Reels para o @publiprova.app (31/10/2026)

**Status: 10 renderizados e AGENDADOS** no `@publiprova.app`, 1 a 10 de novembro de
2026, um por dia às 10h. Conferência no fim do arquivo.

Pedido do Phillip: "faça novas publicações e agende, deixo 10 dias prontos, quero os
melhores marketings possíveis", com o canal escolhido por ele depois de eu ter
apresentado duas vezes o número do Instagram (13 posts, ~72 de alcance somado, 0 follows).
Decisão dele, registrada, e eu parei de reabrir.

## A aposta deste lote

Com menos de 20 seguidores não existe alcance orgânico para herdar. O único mecanismo que coloca
o post na frente de alguém novo é **outra pessoa marcar um colega**. Então as dez
legendas pedem **uma ação só, e é sempre a mesma**: marcar quem vive aquilo.

A segunda aposta é **especificidade**. Ninguém marca um colega por causa de "fechamento
de campanha dói". Marca por causa do print que veio cortado, do áudio de 4 minutos, do
grupo com 31 pessoas e nenhuma resposta. Detalhe que só quem vive reconhece.

## Os dez

| id | cena | gancho (quadro 0) | superfície |
|---|---|---|---|
| r19 | o print veio com o alcance cortado | mandou o print 🎉 cortou o alcance | WhatsApp |
| r20 | planilha de fechamento, dia 28 | a planilha de fechamento, dia 28 | Planilha |
| r21 | 23h47, 14 abas, PDF travado | o cliente pede 9h, são 23h47 | Navegador |
| r22 | pediu print, veio áudio de 4 min | pedi o print, veio um áudio de 4 min | WhatsApp |
| r23 | 3 semanas depois: "qual campanha?" | 3 semanas depois: "qual campanha mesmo?" | Direct do IG |
| r24 | o story expira e leva o número | o story expira em 24h, o número vai junto | Story |
| r25 | grupo de 31, só a sua cor na tela | 31 creators no grupo | WhatsApp |
| r26 | a lista do que vem DEPOIS do post | a campanha acabou 🎉 agora começa o trabalho | Checklist |
| r27 | o mesmo print, dois caminhos | o mesmo print, dois caminhos | Comparação |
| r28 | o relatório real, rolando | é isso que o cliente abre | Produto |

Oito de dor, um de comparação, um de produto. r28 usa a **captura do app rodando**
(`relatorio-demo.png`), não maquete, e a legenda diz isso.

## Sugestão de ordem, 10 dias

Começar pelo mais reconhecível e deixar o produto no fim, quando quem chegou pela dor
já viu três ou quatro.

`r22 · r19 · r25 · r20 · r23 · r24 · r21 · r26 · r27 · r28`

## O que o filtro barrou, e o que eu reescrevi

`checar-legendas.mjs` reprovou 4 de 40 verificações na primeira passada:

- **r19**: "é o único que não aparece" → superlativo. Virou "justamente ele não apareceu".
- **r24**: "o único entregável com prazo de validade" → superlativo. Virou "o entregável
  de campanha que tem prazo de validade".
- **r21, legenda E tela**: "94%" → métrica inventada. A tela agora diz "quase lá" e a
  legenda perdeu o número.

Segunda passada: **nada barrado**, nas 20 legendas e nas 20 telas.

## Três erros meus, pegos por renderizar antes de escrever os outros

1. **Marcação em posição fixa aponta para o vazio.** No r19 a caixa vermelha e o
   "cadê o alcance?" ficavam a 430px, longe da linha cortada, porque a conversa é
   ancorada embaixo e sobe quando chega mensagem. Agora a posição é **medida** do
   elemento com `getBoundingClientRect` dentro do `setT`.
2. **`entra()` do motor reescreve o `transform` inteiro.** Qualquer centragem por
   `translateX(-50%)` morre no primeiro quadro. No r21 a caixa de exportar saiu pela
   borda direita. Centragem agora é `left` em px. Vale para todo Reel futuro.
3. **UI que não enche os 960px deixa meia tela branca** e o Reel parece página quebrada.
   r20 e r21 foram refeitos com linha mais alta e mais itens.

Nenhum dos três apareceria sem abrir o PNG: o render não reclama de nada disso.

## O agendamento, conferido na fila

Agendados em 31/10 pelo Business Suite, **um por dia, 1 a 10 de novembro, 10h**:

| data | reel | primeira linha da legenda |
|---|---|---|
| 01/nov | r22 | pedi o print, veio um áudio de 4 minutos |
| 02/nov | r19 | ele mandou o print, cortou justo a linha do alcance |
| 03/nov | r25 | o grupo da campanha tem 31 creators |
| 04/nov | r20 | a planilha de fechamento no dia 28 |
| 05/nov | r23 | três semanas depois do post: "qual campanha mesmo?" |
| 06/nov | r24 | o story expira em 24 horas |
| 07/nov | r21 | o cliente pede o relatório às 9h, são 23h47 |
| 08/nov | r26 | a campanha acabou, agora começa o trabalho |
| 09/nov | r27 | o mesmo print, dois caminhos |
| 10/nov | r28 | é isso que o cliente abre |

Conferido **lendo a aba Agendados**, não as minhas próprias confirmações: dez linhas,
"Reel · publiprova.app", cada data uma vez só, nenhuma repetida, nenhuma faltando.
Nenhum aviso de erro na coluna Status — os ícones de lá são legenda automática,
impulsionamento ("Not currently boosted") e crosspost ("Not a crosspost").

A conta estava com **15 seguidores** no dia do agendamento, não 7. Dobrou, e ainda é
pequena demais para alcance orgânico: a aposta de marcar colega continua de pé.

## Como agendar no Business Suite, para a próxima vez

O caminho de clique não funciona direto. Três coisas que custaram tempo:

1. **O seletor de arquivo é um `input` solto, fora do DOM.** O botão "Add Video" abre
   diálogo nativo do sistema, que eu não consigo operar. Prender
   `HTMLInputElement.prototype.click` antes, guardar o `input` que tentou abrir,
   `document.body.appendChild` nele e só então subir o arquivo pelo `ref`.
2. **Coordenada de `getBoundingClientRect` NÃO bate com a da captura de tela.** Clique
   por coordenada nos campos de data e hora não fazia nada. O que funciona é `.focus()`
   por JavaScript e **digitação de verdade** depois. Para a data, `value` tem de ir pelo
   setter nativo do React (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,
   'value').set`) seguido de `input` com `bubbles`; a hora são três `spinbutton` ARIA,
   que só aceitam digitado.
3. **O autocompletar de hashtag engole o "Next".** Depois de colar a legenda, tirar o
   foco do campo antes de avançar, senão o clique cai no menu de sugestão.

Os dez `.mp4` ficam em `validacao/artes/video/r19-ig.mp4` até `r28-ig.mp4` e as legendas
em `artes/reels4/legendas.json`.
