# Lote 07 — 10 Reels para o @publiprova.app (31/10/2026)

**Status: 10 prontos e renderizados. NENHUM agendado.** O motivo está no fim.

Pedido do Phillip: "faça novas publicações e agende, deixo 10 dias prontos, quero os
melhores marketings possíveis", com o canal escolhido por ele depois de eu ter
apresentado duas vezes o número do Instagram (13 posts, ~72 de alcance somado, 0 follows).
Decisão dele, registrada, e eu parei de reabrir.

## A aposta deste lote

Com 7 seguidores não existe alcance orgânico para herdar. O único mecanismo que coloca
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

## Por que nada foi agendado

O `@publiprova.app` **não existe no Business Suite desta sessão**. O Chrome está logado
no Facebook de "Pet Context" (`USER_ID 61592690146266`), portfólio **LashPost**, com dois
ativos: `@thepetcontext` (1,2 mil seguidores) e "Daily PLan Store". Busquei "publiprova"
no seletor de ativos: **No results**.

Em 30/09 o lote 05 foi agendado normalmente, então a conta já esteve acessível. O que
mudou foi o login.

**Para destravar, uma das duas:**
1. Entrar no Chrome com o Facebook que administra o `@publiprova.app`, ou
2. Adicionar o `@publiprova.app` como ativo do portfólio LashPost.

Feito isso, os dez `.mp4` estão em `validacao/artes/video/r19-ig.mp4` até `r28-ig.mp4` e
as legendas em `artes/reels4/legendas.json`. Agendar é uma sessão de trabalho.
