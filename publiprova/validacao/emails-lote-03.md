# Lote 03 de e-mails — 6 agências (21/09/2026)

> ⏸️ **ESCRITOS, NÃO ENVIADOS.** Ficam parados até o `publiprova@gmail.com` virar conector.
> O conector do Gmail hoje só autentica `phillip.prs@gmail.com`, e o `send_message` não
> tem campo de remetente — nem alias "Enviar e-mail como" resolve. Mandar estes seis do
> endereço pessoal seria repetir o erro de 19/09. Regra em `rotina/COMO-RODAR.md`.

## De onde vieram

Busca por cidade, que era a recomendação do lote 02: procurar quem **não** aparece em lista
de "maiores", porque é lá que mora a agência pequena — o ICP real. Rodada em BH, Curitiba,
Porto Alegre, Recife/Fortaleza/Salvador.

Duas das seis não são novas: **NetCos** e **Gombo** estavam marcadas como "só formulário"
em 19/09 e **a classificação estava errada**. A NetCos publica o e-mail em `/contact/`
(a `/contato/` dá 404) e a Gombo em `/contato/`, uma página abaixo da home. Conferi as
sete "só formulário" uma a uma; valeu o retrabalho.

## Os seis

Mesmo texto-base do lote 02: uma pergunta binária, sem link, sem pitch, com saída explícita.
Só muda a frase do meio, que é a razão de eu estar escrevendo para **aquela** agência.

**Assunto (todos):** uma pergunta sobre o fechamento das campanhas

### 1. Sou IN — contato@souin.com.br · Porto Alegre
Frase do meio:
> Vocês fazem o agenciamento comercial entre marca e creator, que é exatamente o pedaço
> que eu estou pesquisando: o que acontece depois que o conteúdo vai ao ar.

### 2. Agência Diretiva — contato@agenciadiretiva.com.br · Porto Alegre
> Com mais de 100 influenciadores no Rio Grande do Sul, imagino que o fim da campanha aí
> seja uma operação por si só.

### 3. Brasil Influencers — contato@brasilinfluencers.com.br · SP/Rio
> Vocês dizem gerenciar contrato, campanha e resultado — é o "resultado" que eu quero
> entender, porque é a parte que costuma sobrar para a madrugada de alguém.

### 4. NetCos — netcos@netcos.art.br · São Paulo
> Vocês se descrevem como full stack de marketing de influência, então o fechamento da
> campanha está dentro de casa, não terceirizado. É por isso que quero a opinião de vocês.

### 5. Gombo — comercial@gombo.com.br
> Campanha de influência no LinkedIn tem uma comprovação de entrega diferente da do
> Instagram, e é justamente por ser diferente que eu queria ouvir vocês.

### 6. Priory — contato@priory.com.br · Curitiba
> Na Priory a influência é um serviço entre vários, e não a operação inteira — o que
> provavelmente muda bastante a forma como o fechamento é feito aí.

**Corpo, igual para todos:**

```
Oi, time da [AGÊNCIA]!

Sou o Phillip. [frase do meio]

Uma pergunta só, e eu sumo:

Juntar link e print de cada creator no fim da campanha dói aí — ou já está resolvido?

Se for "resolvido", eu risco a [AGÊNCIA] da lista e não escrevo de novo. Se doer, eu volto
com 5 perguntas curtas, no tempo de vocês.

Phillip Ramos
construindo o PubliProva
Instagram: publiprova.app
```

## Formulários: o caminho rendeu menos do que parecia

Das 7 agências "só formulário" do lote 02, o resultado da conferência:

| Agência | Situação real |
|---|---|
| NetCos | **tem e-mail** — `/contact/`, entrou no lote 03 |
| Gombo | **tem e-mail** — `/contato/`, entrou no lote 03 |
| NOÁ | **bloqueada**: campo WhatsApp obrigatório; e-mail escondido por Cloudflare |
| Spark | **bloqueada**: campo Celular obrigatório, mais 3 selects de qualificação de lead |
| Digital Influencers | sem e-mail; formulário não inspecionável sem navegar |
| Digital Favela | sem e-mail; só newsletter e WhatsApp |
| Tambor | sem e-mail |

**Não preenchi as bloqueadas.** Elas exigem telefone e eu não tenho um número do Phillip
para dar — inventar um seria dar um contato falso para quem talvez responda. Se ele quiser
liberar um número, as duas saem em minutos.

Além disso, o formulário é pior que e-mail para esta fase: não gera thread, então a rotina
diária não consegue detectar resposta — ela chegaria na caixa e sem remetente conhecido.

## Warp Media saiu da lista

O e-mail de 19/09 **voltou**: `550 5.1 — endereço inexistente`. `contato@warpmedia.com.br`
não existe. Foram 12 entregues, não 13. Marcado como `email MORTO` na lista.
