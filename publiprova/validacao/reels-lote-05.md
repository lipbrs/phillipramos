# Lote 05 de Reels — cinco telas que a pessoa reconhece (29/09/2026)

> ✅ **AGENDADOS em 29/09**, os cinco, um por dia às 10h:
>
> | Reel | Data | Legenda conferida na fila |
> |---|---|---|
> | R14 grupo da campanha | qua 30/09 | ✅ |
> | R15 pasta com 47 prints | qui 01/10 | ✅ |
> | R16 as seis versões do FINAL | sex 02/10 | ✅ |
> | R17 a reunião é 9h | sáb 03/10 | ✅ |
> | R18 treze dias de 🙏 | dom 04/10 | ✅ |
>
> O bloqueio do login do Facebook foi resolvido pelo Phillip.

## O que os números do lote 04 disseram

Os 5 Reels de 19 a 24/09 (plays em 29/09, vidIQ):

| Reel | Tema | Plays |
|---|---|---|
| R11 — planilha às 23h47 | dor, tela de planilha | **24** |
| R9 — lista do WhatsApp | dor, tela de WhatsApp | 2 |
| R7 — 5 erros do relatório | lista de conselhos | 2 |
| R10 — notificações no creator | dor, tela de bloqueio | 2 |
| R13 — como perder o creator | lista de conselhos | 1 |
| R12 — o relatório se montou sozinho | **produto** | **0** |

**O R11 fez 12× o segundo colocado, e o vídeo de produto fez zero.** É um sinal fraco
(n=1, e o algoritmo entrega pouco em qualquer caso), mas é o único sinal que temos e
aponta na mesma direção dos fora-da-curva do nicho já medidos em `reels-lote-04.md`:
**tela reconhecível + dor, sem produto na tela.**

O lote 05 aposta tudo nisso. Nenhum dos cinco mostra o PubliProva. A marca aparece só na
legenda, no fim.

## Os cinco

Fonte em `artes/reels4/`, vídeos em `artes/video/rN-ig.mp4`, capa em `capa-rN.jpg` e folha
de prova em `prova-rN.jpg`. Todos sem rosto, sem narração, gancho inteiro no quadro 0.
Esquetes — nomes, agência e campanha inventados; nada é conversa real de cliente.

| # | Tela | Gancho (quadro 0) | Dur. | Palavra |
|---|---|---|---|---|
| R14 | grupo do WhatsApp da agência | POV: o cliente pediu o relatório e o grupo da campanha acorda 💀 | 8 s | PRINT |
| R15 | pasta do Drive com 47 prints | o print chegou 🎉 agora descobre de quem é | 7,5 s | PRINT |
| R16 | as seis versões do "FINAL" | qual desses é o relatório que foi pro cliente? 🙃 | 7 s | — (salvar) |
| R17 | caixa de entrada às 8h59 | a reunião é 9h. faltam 5 prints. são 8h59. 🫠 | 7,5 s | RELATÓRIO |
| R18 | 13 dias de 🙏 | 13 dias cobrando o mesmo print 🙏 | 8 s | — (marcar) |

O R14 e o R16 são a mesma piada por ângulos diferentes: o problema não é o creator, é que
**a cobrança depende de alguém lembrar**. O R18 fala com o creator, que é o público maior
e o que marca a agência nos comentários.

Legendas em `artes/reels4/legendas.json`. Legendas **e** texto de tela passaram pelo filtro
de afirmações do prospector — 20 verificações, nada barrado.

## 🔴 Bloqueio: o Chrome está logado na conta errada

O Chrome desta máquina está logado em **`plan3dstudio`**, não em `publiprova.app`
(`ds_user_id=17559776378`). Por isso o Business Suite responde *"Sorry, this content isn't
available right now"* — a identidade logada não tem acesso ao portfólio
`business_id=3224631967925509`.

**Não consegui agendar nada.** Os cinco vídeos estão prontos em `artes/video/`; assim que o
login voltar para a conta certa, o lote sobe em minutos.

## Um número que vale mais que o lote

A conta foi de **7 para 11 seguidores** na semana — os posts deram 0 follows na coluna do
Business Suite, mas a conta cresceu 4. E o acumulado é: **21 posts, melhor alcance de 40
pessoas, 0 comentários, 0 respostas de 18 agências**.

Mais Reel no mesmo lugar não muda isso, porque o Instagram não está entregando a nenhum
desconhecido. O que muda alcance para uma conta de 11 seguidores não é publicar mais: é
**aparecer onde o público já está**. Três caminhos, em ordem de custo:

1. **Comentar em posts grandes do nicho.** Um comentário útil num post de conta com 50 mil
   seguidores é visto por mais gente do que qualquer Reel nosso já foi. Custo: zero.
   Exige o login certo e 15 min/dia.
2. **Grupos de social media no Facebook.** É onde a agência pequena — o ICP real — pergunta
   e responde. Postar a planilha das 23h47 lá alcança mais que o Reel dela.
3. **Colaboração (post em conjunto) com um creator do nicho.** O post nasce nos dois
   perfis. É o único mecanismo do Instagram que empresta audiência de verdade.

Nada disso substitui o lote 05 — mas o lote 05 sozinho repete a semana passada.


## O que aprendi agendando (para a próxima vez ser rápida)

O compositor de Reels funciona, mas tem quatro armadilhas. Nenhuma é óbvia.

1. **As coordenadas do mouse não são as do CSS.** O viewport é 1706 px e o quadro de
   coordenadas da ferramenta é 1279: fator **0,75**. Clicar com o valor lido do
   `getBoundingClientRect()` erra 33% para a direita. Multiplicar por
   `1279 / window.innerWidth` resolve.
2. **O menu de hashtag engole cliques.** Depois de colar uma legenda que termina em
   `#tag`, o autocompletar abre e come o clique no "Next". Clicar em área vazia antes.
3. **A aba "Schedule" não responde a clique por coordenada.** Só funciona disparando
   `.click()` no elemento pai que tem `role="button"` — a folha de texto tem 32 px e o
   alvo real é outro. Depois do clique, os campos de data **aparecem**, então as
   coordenadas têm de ser lidas de novo, nunca reaproveitadas.
4. **A fila demora a indexar.** Depois de agendar, a lista mostra "No scheduled posts"
   por 10 a 20 segundos. Não é falha: é recarregar e esperar.

Nenhum dos cinco leva música. As faixas oferecidas no compositor são de aniversário e
motivação, e nenhuma combina com Reel de dor operacional de agência. Silêncio é melhor
que trilha errada, e o R11 do lote 04, que foi o melhor até agora, também era mudo.
