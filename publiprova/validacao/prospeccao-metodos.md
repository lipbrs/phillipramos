# Métodos de prospecção: o que funciona e o que já foi descartado

Registro do que foi testado para chegar às ~150 agências. Existe para ninguém
repetir um caminho que já provou não dar.

## Situação em 30/09/2026

**67 linhas na lista · 26 com e-mail vivo · 25 abordadas · 1 resposta** (e a resposta foi
um repasse, não uma conversa).

## ✅ Funcionou

### Diretório da YOUPIX (`youpix.com.br/hub-influencia/`)
A melhor fonte encontrada. Lista 19 agências e **cada perfil publica o e-mail comercial**,
sem precisar abrir o site de cada uma. Rendeu 6 contatos num acesso.

⚠️ Quatro perfis trazem `email@email.com.br` e `exemplo.com.br`, que é placeholder do
template: Webedia, BrandLovers, Play9 e Creators Platform. Não confundir com e-mail real.

### Busca por cidade, fora do eixo São Paulo
Rendeu ADR (Londrina), Sou IN e Agência Diretiva (Porto Alegre), Priory (Curitiba).
**Esgotou rápido:** Goiânia, Salvador, Fortaleza, Campinas, Vitória, Belém e Manaus só
devolvem agência de marketing digital genérica, que não fecha campanha com creator.

### Conferir a página de contato de quem parecia "só formulário"
Três classificações estavam erradas. NetCos publica o e-mail em `/contact/` (a `/contato/`
dá 404), Gombo em `/contato/`, Mynd no perfil da YOUPIX. **Vale sempre abrir a segunda
página antes de desistir de uma agência.**

## ❌ Esgotado

### Listas de "as maiores agências"
Interney (78 empresas), 140 Online, Favikon, InfluencerMarketingHub. São **as mesmas ~30
empresas recicladas**. Cruzei as 47 da Interney contra a lista inteira: das 28 agências,
26 já estavam lá. Sobraram duas.

## ❌ Testado e descartado: o grafo do Instagram

**A hipótese era:** agência segue agência, então a lista de "seguindo" de uma agência
conhecida é uma lista de pares, e cada nova agência vira semente da rodada seguinte.
Infinito em profundidade.

**A hipótese é falsa.** Abri o "seguindo" da @sigamosaico (1.220 contas) e o que tem lá é:
Shopee, Spotify Brasil, Natura, Fanta, Aldeias Infantis e creators individuais. **Agência
segue cliente e talento, não concorrente.** Faz sentido: seguir concorrente não traz
negócio, seguir marca e creator traz.

Vale para um propósito diferente do nosso: aquela lista é o **carteira de clientes** da
agência, útil para quem vende para marca. Nós vendemos para a agência.

Dois obstáculos técnicos que também apareceram, para quem tentar de novo:
- O Instagram **não abre** a lista de "seguindo" de quem você não segue de forma
  confiável, e a lista é virtualizada: carrega 10 por vez e não responde a `scrollTop`.
- A janela do Chrome tinha viewport de 973 CSS px com DPR 2,6, e os cliques por
  coordenada caíam fora da janela. **Clicar por referência de elemento**, nunca por
  coordenada calculada.

## Não testado, em ordem de aposta

1. **LinkedIn, busca por empresa.** Empresas se autodeclaram por setor, então "marketing
   de influência" + Brasil devolve centenas de páginas — inclusive a agência de 5 pessoas
   que nunca vai entrar em lista de "maiores", que é o ICP real. É a melhor aposta.
   ⚠️ O LinkedIn pessoal do Phillip está fora da operação por decisão de 29/08. Isso aqui
   é busca de empresa, não exposição de perfil, mas vale confirmar com ele.
2. **Raspagem do Google Maps.** Funciona para negócio com endereço físico. Agência digital
   às vezes não tem. Rendimento incerto.
3. **Comentários em posts de agência.** Quem comenta em post da Mosaico ou da MID sobre
   marketing de influência costuma ser gente de agência. Lento, mas o ICP é preciso.

## A pergunta desconfortável

25 abordagens e 1 resposta. Antes de investir em chegar a 150, vale considerar que o
problema pode não ser volume: **e-mail frio para `contato@` pode simplesmente não ser o
canal**. Texto longo e texto curto deram o mesmo zero. Se o LinkedIn render 30 contatos e
o resultado continuar zero, a conclusão é do canal, não da lista.

## LinkedIn (testado em 30/09) — FUNCIONA para achar gente, não para achar e-mail

Busca de empresas: `linkedin.com/search/results/companies/?companyHqGeo=%5B%22106057199%22%5D&keywords=marketing%20de%20influ%C3%AAncia` → 864 resultados.
Por empresa, a aba **Sobre** dá site/telefone/porte/sede e a aba **Pessoas** dá nome e cargo.

- 32 agências novas de 2 a 10 pessoas em 8 páginas.
- Só 6 com e-mail público. Metade não tem site; contato é WhatsApp ou Instagram.
- 22 com fundador ou responsável por influência identificado por nome.

Uso certo: **descobrir a pessoa** e endereçar o `contato@` a ela. Extratores (JS no
console): Sobre = `innerText` + regex `/\bSite\s*\n\s*(\S+)/`; Pessoas = linhas no
padrão `[nome, "· 3º", cargo]` (os cartões não são `<li>`).

Armadilhas: slug com acento precisa de percent-encoding; empresa com "0 a 1 funcionário"
costuma ser freelancer; o "site" muitas vezes é linktree ou Instagram.
