# Manual do operador — Prospector do PubliProva

Sistema que transforma comentário com palavra-chave nos posts do
`@publiprova.app` em conversa qualificada na própria DM, entregando o que cada
post prometeu.

> **Estado hoje (10/09/2026):** o caminho inteiro do comentário até a resposta
> **funciona em simulação**, com painel e backup — webhook, lead, fila, worker,
> texto, registro, a tela para acompanhar e a restauração testada. **Falta** o
> classificador que responde quem escreve de volta. Este manual cobre o que já
> dá para fazer e diz claramente onde termina.

---

## 1. O que este sistema faz e o que ele não faz

**Faz:** ouve os comentários dos nossos posts, reconhece a palavra-chave, cria o
lead sem duplicar, responde pela DM usando a **API oficial da Meta**, entrega o
que o post prometeu e registra tudo.

Cada palavra tem um destino, e ele é o que o post prometeu — não o que seria
conveniente vender:

| Palavra | O post promete | Destino |
|---|---|---|
| RELATÓRIO | "te mostro por dentro" | link do modo demonstração do site |
| PRINT | "te mando as três em texto" | as 3 mensagens, na própria DM |
| EU | "eu te chamo" | convite para a pesquisa das 6 perguntas |

**Nada disso passa por WhatsApp**, porque ainda não existe número e nenhum post
prometeu isso. O funil de afiliados está **desligado** pelo mesmo motivo: não há
programa nem grupo. Ligar é editar `funisAtivos` no `config/business.json` — e o
sistema se recusa a subir se você ligar um funil sem o link correspondente.

**Não faz, por decisão:** não manda DM para quem nunca falou com a gente. A API
da Meta bloqueia isso de propósito e contornar pelo navegador põe a conta em
risco. O raciocínio completo está em [`DECISIONS.md`](DECISIONS.md), ADR-001.

Isso significa que **o volume depende do conteúdo**: quanto mais gente comenta a
palavra-chave, mais leads entram. O calendário do Instagram é o motor; este
sistema é a colheita.

---

## 2. O app na Meta

Feito em 11/09/2026. O que existe hoje:

| Coisa | Valor |
|---|---|
| App | `publiprova`, id `1129328033092483` |
| Caso de uso | Gerenciar mensagens e conteúdo no Instagram |
| Caminho | **API com login do Instagram** (`graph.instagram.com`) |
| App do Instagram | `publiprova-IG`, id `2228099657733612` |
| Conta conectada | `@publiprova.app`, id `17841432884720391` |
| Status | **Não publicado** — ver seção 9 |

Se precisar refazer, a ordem que funciona e onde cada coisa se esconde:

1. **Criar app** → *Casos de uso* → filtro **Business Messaging** → o do
   Instagram. Não use "Outro": está sendo descontinuado e cria o app na
   experiência antiga, sem produto nem permissões.
2. *Personalizar o caso de uso* → **Configuração da API com login do
   Instagram** → botão **Add all required permissions**. As três são
   `instagram_business_basic`, `instagram_business_manage_comments` e
   `instagram_business_manage_messages`.
3. **Funções do app → Funções** — fica no **rodapé** da barra lateral, não como
   aba no topo. Lá, no menu **Mais** → **Testadores do Instagram** →
   *Adicionar pessoas* → o nome de usuário da conta.
4. Aceitar o convite no Instagram, em *Configurações → Apps e sites → Convites
   do testador*. Se a conta estiver no mesmo portfólio empresarial, **já vem
   aceita** e não aparece convite nenhum.
5. Voltar ao bloco 2 *Gerar tokens de acesso*. A conta aparece com o **id ao
   lado do nome** — é esse o `INSTAGRAM_BUSINESS_ACCOUNT_ID`, e não o id do app
   do Instagram que está no topo da página. Confundir os dois dá 400 sem
   explicação.

Também precisa de uma **chave da OpenAI**, criada em
<https://platform.openai.com/api-keys>:

- num **projeto separado** só para este sistema;
- permissão **Restricted**;
- com **hard limit mensal** em *Settings → Limits*. O sistema tem o próprio
  corte por orçamento, mas o limite na plataforma é a rede de segurança que não
  depende do nosso código estar certo.

## 3. Instalação

Requer **Node.js 24** ou mais novo.

```bash
cd publiprova/prospector
npm i -g pnpm@10          # se ainda não tiver
pnpm install
cp .env.example .env
cp config/business.example.json config/business.json   # já existe preenchido
pnpm db:migrate
```

Confira que está tudo de pé:

```bash
pnpm typecheck && pnpm test
```

Tem de terminar com **135 testes passando**.

---

## 4. Preencher o `.env`

Abra o `.env` e preencha. Os campos e o que cada um faz:

| Campo | O que é |
|---|---|
| `OPENAI_API_KEY` | a chave do projeto separado |
| `OPENAI_MODEL` | modelo que escreve as mensagens |
| `OPENAI_MODEL_FAST` | modelo que classifica intenção (mais barato) |
| `OPENAI_MONTHLY_BUDGET_USD` | teto do mês. Ao bater, **o sistema para sozinho** |
| `INSTAGRAM_APP_SECRET` | segredo do app, usado para validar a assinatura do webhook |
| `INSTAGRAM_PAGE_ACCESS_TOKEN` | token de acesso da Página |
| `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` | string que você inventa e repete no painel da Meta |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | id da conta profissional (bloco 2 do painel) |
| `INSTAGRAM_TOKEN_VENCE_EM` | escrito pelo `pnpm doutor`; o worker avisa antes |
| `MAX_DMS_PER_DAY` | teto diário de respostas. Saúde da conta, não disfarce |
| `OPERATING_HOURS` | fora dessa janela nada é enviado |
| `DRY_RUN` | **deixe `true`**. Veja a seção 7 |

### Conferir sem enviar nada

```bash
pnpm doutor
```

Bate nos quatro valores contra a API real: se o token vale, de qual conta ele é,
se o id do `.env` é o mesmo do token, e quanto tempo de vida resta. **Nada é
enviado** e nenhum segredo é impresso — a saída é conclusão, não valor.

Ele também cuida do token. O botão *Gerar token* do painel já entrega um de
**60 dias**, e o `doutor` renova a cada execução (voltando a 60). Se por outro
caminho vier o token curto de 1 hora, ele faz a troca. **Rode uma vez por mês.**

O `.env` guarda a data de vencimento, e o worker avisa no boot quando faltarem
10 dias ou menos. Sem esse aviso o sintoma no dia 61 é todo envio voltando 400
— erro que parece bug de código e não é.

> **Se a chave vazar:** revogue em <https://platform.openai.com/api-keys> na
> hora, crie outra, troque no `.env` e reinicie. Como a chave é de um projeto
> separado com hard limit, o estrago fica contido nesse teto.

---

## 5. Preencher o `config/business.json`

Já está preenchido com os dados reais do PubliProva. Dois campos estão vazios de
propósito, e **nada depende deles hoje**:

- `links.whatsapp` — quando você tiver número, preencha e aí uma palavra-chave
  pode passar a ter `destino: { "tipo": "whatsapp" }`
- `links.affiliateGroup` — quando existir grupo, preencha e acrescente
  `"affiliate"` em `funisAtivos`

Enquanto estiverem vazios, o sistema simplesmente não oferece esses caminhos.

**`funisAtivos`** diz quais funis podem receber lead. Hoje é só `["customer"]`.
Se uma palavra-chave apontar para um funil desligado, o sistema **não sobe** — a
incoerência falha no boot, não na hora de responder alguém.

A parte mais importante desse arquivo são as duas listas:

- **`verifiedClaims`** — o que a IA *pode* dizer. Está tudo comprovado no
  produto ou no site.
- **`unverifiedClaims`** — o que fica **bloqueado**. Hoje inclui o preço de
  R$ 247 (planejado, não publicado), o "8 a 15 horas por mês" (estimativa do
  estudo, não medição nossa) e qualquer contagem de clientes (hoje é zero).

Se você comprovar alguma dessas coisas — publicar o preço no site, por exemplo —
mova a linha de `unverifiedClaims` para `verifiedClaims`. Enquanto não mover, o
filtro bloqueia, inclusive em texto que você mesmo escrever.

---

## 6. Rodar

O worker sozinho, que é o que já funciona:

```bash
pnpm dev:worker
```

Ele imprime no boot em que modo está, quais funis estão ligados, para onde cada
palavra manda e o que falta configurar. Se a configuração estiver incoerente,
**ele não sobe** — e diz por quê.

Em simulação a saída é assim:

```
[worker] modo: SIMULACAO (nada sai)
[worker] palavras: RELATORIO→demo, PRINT→conteudo_na_dm, EU→pesquisa
[worker] job 1: SIMULADO para lead 1 (simulado:459129bb61ea...)
```

Cada mensagem "simulada" fica gravada inteira no banco, com o texto exato que
sairia. É isso que você lê antes de tirar o `DRY_RUN`.

Os dois juntos, que é como você vai usar no dia a dia:

```bash
pnpm dev
```

O painel fica em <http://localhost:3100> e tem três telas:

- **Painel** — se está rodando ou parado, leads por etapa, envios do dia contra
  o teto, fila, gasto de IA no mês e o que falta configurar. O botão **Parar
  tudo** para na hora.
- **Precisa de você** — tudo que o sistema preferiu não decidir sozinho.
- **Lead** — a conversa inteira, com as mensagens simuladas marcadas como tal.

---

## 7. A ordem segura de ligar

Não pule etapas. Cada uma existe porque a anterior pode esconder um erro.

1. **Simulação** (`DRY_RUN=true`) — o sistema faz tudo, menos enviar. Toda
   mensagem que ele mandaria fica registrada no CRM com a marca "simulado".
   Deixe rodar até ver conversa inteira decidida do jeito que você faria.
2. **Ensaio com envio bloqueado** — mesma coisa, mas contra a API real da Meta,
   com o envio final desligado. Confirma token, permissão e janela.
3. **Piloto** — `DRY_RUN=false` com `MAX_DMS_PER_DAY=5`. Leia **todas** as
   conversas do primeiro dia, uma por uma.
4. **Autonomia** — só depois de um piloto sem surpresa, suba o teto aos poucos.

---

## 8. Como pausar

Três formas, da mais rápida para a mais definitiva:

- **Botão de pausa geral no painel** — para tudo na hora, mantém o estado.
- **`DRY_RUN=true` no `.env` e reiniciar** — o sistema continua pensando, mas
  não envia.
- **Parar o processo** — jobs em andamento voltam para a fila sozinhas no
  próximo boot. Nada se perde.

**O sistema também pausa sozinho** quando: o orçamento do mês estoura, acontecem
5 erros seguidos, o Instagram sinaliza restrição, aparece envio duplicado ou o
estado do lead diverge entre canal e pipeline. O motivo fica registrado e
aparece na fila de exceções.

---

## 8.5. O webhook — como ligar e o que ainda dói

O webhook é a **entrada única** do sistema: sem ele nenhum comentário chega e o
resto não tem o que fazer.

### App publicado e webhook registrado — 11/09/2026

O app **publiprova** está **publicado** e o webhook está **registrado e
validado pela Meta**. Estado final:

| Item | Estado |
|---|---|
| App na Meta | Publicado |
| Categoria | Negócio e Páginas |
| Política de privacidade | <https://publiprova-plan-b1a5.vercel.app/privacidade> |
| URL de exclusão de dados | a mesma página (seção 8) |
| Permissões | as três, "Pronto para teste" |
| Assinatura do webhook na conta | Ativada |
| Campos assinados | `comments` e `messages` |

A Meta validou o handshake (200 no nosso log) e entregou um evento de teste do
campo `comments` pelo botão *Teste* do painel: chegou assinado, passou na
verificação e o sistema registrou `comentario_sem_palavra_chave`, porque o
texto de exemplo é "This is an example." e não tem palavra-chave. Comportamento
certo.

**Falta a Análise do App** (bloco 5 do painel): *"Para que seu app acesse dados
ao vivo, o Instagram exige que o processo de análise do app seja realizado"*.
Sem ela o acesso é padrão, o que na prática limita a conta e os testadores do
app. Publicar não substitui a análise.

### Verificado em 11/09/2026

Os três caminhos da rota `/api/webhook/instagram` foram testados com assinatura
HMAC de verdade, feita com o app secret real:

| Teste | Resultado |
|---|---|
| Handshake com token de verificação correto | 200, devolve o `challenge` |
| Handshake com token errado | 403 |
| POST sem assinatura | 401 |
| POST assinado, comentário com RELATÓRIO | 200, lead criado, job na fila |
| Reenvio do mesmo evento | 200, `lead_existente` — sem duplicar |
| Corpo adulterado, assinatura antiga | 401 |
| Rota alcançada pela internet, via túnel | 403 no caso negativo, como esperado |

Depois disso o worker entregou a resposta simulada ao lead criado. **O ciclo
inteiro funciona, do webhook à mensagem.**

### Como expor a rota

A Meta precisa alcançar `https://SEU-ENDERECO/api/webhook/instagram`. Para
testar da sua máquina:

```bash
npx cloudflared tunnel --url http://localhost:3100
```

Ele imprime uma URL `https://algo.trycloudflare.com`. Registre-a no painel do
app, em *Configurar webhooks*, com o token de verificação do `.env`, e assine os
campos **`comments`** e **`messages`**.

### Sem domínio próprio: o que sobra

Confirmado em 11/09: **não existe domínio próprio**. O site é o endereço da
Vercel, e o link da bio do Instagram aponta para ele. Isso elimina o túnel
nomeado da Cloudflare, que exige uma zona DNS sua.

O que resta, em ordem de esforço:

1. **Domínio estático de túnel gratuito** (o ngrok dá um no plano grátis).
   Endereço fixo, cinco minutos de configuração. Exige conta e um authtoken,
   e **a máquina tem de estar ligada** quando alguém comenta.
2. **Receptor na Vercel + fila durável.** Uma rota na Vercel confere a
   assinatura e grava o evento cru num banco que ela alcança; o worker aqui
   busca de lá quando sobe. Mais peças, mas **sobrevive à máquina desligada** —
   que é a diferença que importa quando o conteúdo começa a render comentário
   de madrugada.
3. **Comprar um domínio** e usar o túnel nomeado da Cloudflare.

Nota sobre perda de evento: a Meta reentrega webhook que não recebeu 200,
durante um tempo. Máquina desligada por minutos é recuperável; por uma noite,
não conte com isso.

### O problema que isso não resolve

**A URL do túnel muda a cada reinício.** Toda vez que você reiniciar, tem de
voltar ao painel da Meta e trocar a URL — e enquanto não trocar, os comentários
somem sem aviso. Isso serve para testar, não para operar.

As duas saídas de verdade:

1. **Túnel nomeado do Cloudflare**, com endereço fixo. Exige um domínio seu
   apontado para a Cloudflare (`publiprova.com.br`, por exemplo). É a opção
   barata e funciona com o sistema rodando na sua máquina.
2. **Hospedar o prospector** numa máquina com disco persistente. Não serve
   função serverless: o banco é um arquivo SQLite e o worker precisa dele.

Enquanto nenhuma das duas existir, o sistema colhe comentário só enquanto o
túnel estiver de pé.

---

## 9. O que ainda não está pronto

Sendo direto, para você não procurar o que não existe:

- o classificador que lê a resposta do lead. **Hoje quem responde de volta cai
  na fila de exceções e espera você** — é de propósito: melhor a conversa
  esperar do que o sistema inventar resposta;
- edição da configuração pelo painel: hoje o `business.json` se edita à mão, e o
  painel só mostra o que está valendo;
- **endereço fixo para o webhook** — ver seção 8.5. É o que falta para o sistema
  colher comentário sem babá;
- **Análise do App na Meta.** O app está publicado e o webhook registrado, mas
  o acesso ainda é padrão. Para responder gente fora da lista de testadores,
  precisa passar pela análise — inclui um vídeo do fluxo.

O cliente da API da Meta **está escrito e testado contra um servidor de
mentira**: formato da requisição, leitura do id da mensagem e classificação do
erro (o que vale retentar e o que não vale). O que só a conta real prova é se o
token tem as permissões certas — por isso o ensaio da seção 7 existe.

O que **está** pronto e testado: o caminho inteiro do comentário à resposta
privada (rodando em simulação, com o texto gravado), banco e migrações, máquina
de estados com
pipeline e canal separados, deduplicação, opt-out permanente entre campanhas,
filtro de afirmações, verificação de assinatura do webhook, normalização dos
eventos da Meta, entrada de leads por comentário e por DM, fila durável com
idempotência e recuperação após reinício, corte por orçamento com custo por
lead, pausa geral, circuit breaker e experimentos com veredito conservador.

---

## 10. Backup e restauração

O banco é um arquivo só: `data/prospector.db`. Para fazer backup:

```bash
pnpm backup
```

Sai um arquivo datado em `backups/`, e os 14 mais recentes ficam. Ele usa
`VACUUM INTO`, que pode rodar **com o sistema de pé** e sai consistente — copiar
o `.db` com o worker escrevendo produz um arquivo que *parece* certo e falha
quando você mais precisa, porque o WAL fica para trás.

Agende uma vez por dia no Agendador de Tarefas do Windows, apontando para a
pasta do projeto. E **guarde uma cópia fora deste disco**: backup ao lado do
banco não é backup.

### Restaurar

Nesta ordem, sem pular a primeira:

1. **Pare o sistema** (Ctrl+C no `pnpm dev`) e confirme que nenhum `node` ficou
   rodando. O arquivo continua preso enquanto o processo existir — no Windows
   isso aparece como "acesso negado" ao tentar trocá-lo.
2. Apague `data/prospector.db`, `data/prospector.db-wal` e
   `data/prospector.db-shm`. Os dois últimos são do banco antigo e, se ficarem,
   corrompem o restaurado.
3. Copie o backup escolhido para `data/prospector.db`.
4. Suba de novo com `pnpm dev`.

O que você perde é o que entrou depois daquele backup — o arquivo é um retrato
do instante em que foi feito. O teste `src/db/backup.test.ts` abre um backup e
confere que os dados anteriores estão lá, que o posterior não está e que o banco
veio inteiro.

> **Teste isso uma vez agora**, com dados de mentira, e não no dia em que
> precisar.
