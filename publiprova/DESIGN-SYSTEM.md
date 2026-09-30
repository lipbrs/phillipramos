# Sistema de design — PubliProva

Tudo aqui vale para o site (`web/app/page.tsx`, `/produto`, `/seguranca`, `/sobre`) e para
as telas do produto. Cada regra tem o motivo junto: regra sem motivo vira cargo cult, e a
primeira pessoa que discordar vai simplesmente desfazer.

## A leitura que define tudo

**Landing B2B para agências brasileiras de marketing de influência.** O público está
decidindo se confia software desconhecido com o dado de creator, que é pessoa física.

**Revisão de 30/09:** a primeira versão disto dizia "movimento baixo, nada de efeito". O
Phillip pediu um site cinematográfico e estava certo — a regra estava confundindo duas
coisas. Linear, Stripe e Vercel são B2B, são cinematográficos e passam credibilidade.

A regra correta é sobre **o que entra em cena**:

> Se o espetáculo for efeito, vira enfeite e queima confiança.
> Se o espetáculo for **o produto**, impressiona e prova ao mesmo tempo.

Por isso o herói é um bloco escuro imersivo com o **vídeo do produto real** como clímax, e
não um degradê animado com partículas. Toda a dramaticidade serve para olhar o produto.

## Cor

| Papel | Claro | Escuro |
|---|---|---|
| Marca | `#4f46e5` | `#7c78ff` |
| Fundo | `#ffffff` | `#0b0b0f` |
| Fundo suave | `#f7f7f9` | `#131318` |
| Texto | `#18181b` | `#f4f4f5` |
| Texto secundário | `#71717a` | `#a1a1aa` |
| Borda | `#e4e4e7` | `#27272e` |

Estado: `--ok` verde, `--warn` âmbar, `--late` vermelho, cada um com sua variante `-soft`.
São os mesmos do painel, então "comprovado" é verde no produto e no site.

**O tema é automático** (`prefers-color-scheme`), não escuro. Isso já me confundiu: o site
parecia escuro porque o Chrome do Phillip está em modo escuro.

**Um acento só, e é o roxo.** Num redesenho, cor de marca existente se preserva, não se
substitui. Quando a skill `ui-ux-pro-max` sugeriu trocar para azul com CTA laranja, foi
recusado por isso.

## Tipografia

**Geist**, pelo `next/font/google`, auto-hospedada. Nunca `<link>` para o Google em
produção.

- `h1` — `clamp(2.1rem, 4.6vw, 3.25rem)`, peso 800, `letter-spacing: -.035em`
- `h2` — `clamp(1.45rem, 2.6vw, 1.95rem)`, peso 700, **`max-width: 22ch`**
- corpo — 16px, `line-height` 1.55

O `max-width` no `h2` é o que impede título de virar faixa de texto na tela larga.
Hierarquia por peso e cor, não por tamanho bruto.

## Espaço e forma

- Seção: `88px` vertical, `56px` abaixo de 720px
- Container: `max-width: 1040px`, `.narrow` = 640px
- Raio: **12px** em tudo (`--radius`). Botão 10px, botão pequeno 8px.

Uma escala de raio só. Cartão quadrado com botão redondo é design quebrado.

## Movimento

Pesagem pela skill `design-motion-principles`: landing de marketing → **Jakub principal**
(polimento de produção), **Jhey secundário**, Emil só em navegação e formulário.

**Receita de entrada (Jakub):** opacidade + `translateY` + **blur**. O blur é o que faz o
elemento *materializar* em vez de só aparecer. Curvas próprias
(`cubic-bezier(.16,1,.3,1)`), nunca `ease` nativo, que não tem força.

**Durações:** 520 a 760ms. É a faixa de polimento do Jakub, não os 180ms do Emil — aqui o
movimento é raro (acontece uma vez, na chegada), e pela régua de frequência movimento raro
pode ser expressivo.

**Animar só `transform`, `opacity` e `filter`.** Nunca `width`, `height`, `top`, `left`.

### Por que NÃO é `animation-timeline: view()`

Duas razões, as duas aprendidas doendo:

1. **Animação presa à timeline do scroll fica refém da velocidade de rolagem.** Quem rola
   devagar vê tudo em câmera lenta e parece defeito. Gatilho por posição + duração fixa
   resolve.
2. 🔴 **Elemento fora da faixa fica preso no primeiro quadro.** Com `opacity: 0` isso deixa
   a seção **invisível de verdade**. Aconteceu: duas seções do `/produto` sumiram.

### A garantia de que nada some

Agora é estrutural, não é disciplina. O estado inicial escondido **só existe** quando o
`<html>` ganha `data-anima="pronto"`, e isso só acontece depois que o
`app/_site/revelar.tsx` montou e confirmou que tem `IntersectionObserver`. Sem JS, com JS
quebrado, em navegador velho ou para robô de busca: **tudo visível, sempre.**

Tem ainda uma rede de segurança: se depois de 3 segundos algum alvo visível continuar
escondido, o atributo é removido da página inteira.

Isso é testado, não suposto — a verificação roda com JS, sem JS e com movimento reduzido.

Dois componentes cliente no site, os dois por necessidade: `revelar.tsx` (o
`IntersectionObserver`) e `demo.tsx` (respeitar `prefers-reduced-motion` em
`<video autoplay>` exige JS).

## Imagem e vídeo

**Só tela real do produto.** As capturas em `web/public/` são geradas pelo app rodando com
os dados de demonstração, via Playwright. Nada de mockup, nada de banco de imagem, nada de
"screenshot falso" feito com `<div>`.

O vídeo do herói (`demo-fluxo.mp4`, 15s, ~300 KB, mudo, em laço) é gravação do fluxo real:
painel 2/4 → a creator entrega → painel 3/4 em verde → relatório atualizado.

**Grave em viewport pequeno.** A primeira gravação foi em 1280px e o layout exibe em
460px: o texto ficava ilegível. 1020×700 resolve.

**Os dados de demonstração são em memória.** Se a gravação fizer uma creator entregar, ela
continua entregue até o servidor reiniciar. Reinicie antes de regravar.

## Escrita

- pt-BR, direto, sem hype. Verbo concreto, não "potencialize" nem "revolucione".
- **Zero em-dash (`—`).** É o tell de IA mais visível que existe. Use ponto, vírgula ou
  parêntese. Vale para o site e para as legendas do Instagram.
- **Um rótulo por intenção de CTA.** "Começar grátis" em todo lugar, "Ver relatório de
  exemplo" em todo lugar. Três nomes para o mesmo botão é amadorismo.
- **Nada de selo de prova social inventado.** O "mais escolhido" no plano Agência saiu: com
  zero cliente pagante, não se sustenta.
- **Afirmação só se estiver no código.** O FAQ prometia "retenção configurável" e "contrato
  de tratamento": nenhum dos dois existe. Antes de escrever capacidade, abrir `web/lib`.

## Layout

- Máximo **duas** seções seguidas com o mesmo formato. Três `grid-3` em sequência é
  template.
- **Três cartões iguais lado a lado** é o clichê de IA mais reconhecível. A seção "Por que
  funciona" usa duas colunas com regra superior na cor da marca.
- Rodapé com quatro colunas (produto, confiança, contato), não uma linha.
- Navegação numa linha só, altura ≤ 80px, item atual com `aria-current="page"`.
- **Na home, a navegação entra no bloco escuro** (`.topbar-cine`). Barra clara em cima de
  herói escuro é uma costura que quebra o efeito inteiro.
- Profundidade por **sombra em camadas**, não por borda chapada. Sombra se adapta a
  qualquer fundo porque usa transparência; borda é cor sólida e briga.

## Rejeitado, com motivo

| Sugerido por | O quê | Por que não |
|---|---|---|
| `ui-ux-pro-max` | Glassmorphism | A `design-taste-frontend` proíbe vidro fosco em B2B sério. Quem avalia risco de LGPD não quer efeito. |
| `ui-ux-pro-max` | Azul `#2563EB` + CTA laranja | A marca já é roxa. Redesenho preserva cor de marca. |
| `ui-ux-pro-max` | Plus Jakarta Sans | Geist acabou de entrar. Trocar de novo é rodízio sem ganho. |
| geral | Banco de imagem com "equipe sorrindo" | Denuncia site feito às pressas. Se quiser presença humana, foto real do Phillip na `/sobre`. |
| geral | GSAP / Motion | Nenhuma animação aqui justifica dependência. CSS nativo mais um `IntersectionObserver` dão conta. |
| Phillip autorizou | Higgsfield (vídeo por IA) no site | O argumento da página é que **tudo ali é real**. Footage gerada por IA contradiz isso. Continua autorizado e faz sentido para os Reels. |

## Onde mora o quê

```
web/app/page.tsx          home
web/app/produto/          fluxo completo, com as telas de cada etapa
web/app/seguranca/        dados e LGPD, inclui "o que ainda não temos"
web/app/sobre/            quem faz, e a oferta de fundador
web/app/_site/            cabeçalho, rodapé e o vídeo do herói
web/app/globals.css       tokens e todas as classes
web/public/               capturas e vídeo, todos do produto real
```

As rotas de **produto** (`/app`, `/r`, `/e`, `/login`) não usam o cabeçalho do site de
propósito: quem já está dentro não precisa de navegação de marketing.

⚠️ `publiprova/landing/index.html` é **código morto**. Já me fez editar o arquivo errado.
Quem serve o site é o Next.
