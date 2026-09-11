# Manual do operador — Prospector do PubliProva

Sistema que transforma comentário com palavra-chave nos posts do
`@publiprova.app` em conversa qualificada na própria DM, entregando o que cada
post prometeu.

> **Estado hoje (10/09/2026):** o caminho inteiro do comentário até a resposta
> **funciona em simulação** — webhook, lead, fila, worker, texto e registro.
> **Ainda faltam** o painel, o classificador que responde quem escreve de volta
> e o backup automático. Este manual cobre o que já dá para fazer e diz
> claramente onde termina.

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

## 2. Antes de começar

Você vai precisar de três coisas, nesta ordem:

1. **Conta profissional no Instagram** vinculada a uma Página do Facebook (já
   temos: `@publiprova.app` no portfólio `planflservices`).
2. **App na Meta for Developers** com o produto *Instagram* adicionado e as
   permissões `instagram_business_basic`, `instagram_business_manage_messages` e
   `instagram_business_manage_comments`.
3. **Chave da OpenAI**, criada em <https://platform.openai.com/api-keys>:
   - crie num **projeto separado** só para este sistema;
   - permissão **Restricted**;
   - defina um **hard limit mensal** em *Settings → Limits*. O sistema também tem
     o próprio corte por orçamento, mas o limite na plataforma é a rede de
     segurança que não depende do nosso código estar certo.

---

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

Tem de terminar com **130 testes passando**.

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
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | id da conta profissional |
| `MAX_DMS_PER_DAY` | teto diário de respostas. Saúde da conta, não disfarce |
| `OPERATING_HOURS` | fora dessa janela nada é enviado |
| `DRY_RUN` | **deixe `true`**. Veja a seção 7 |

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

```bash
pnpm dev
```

Sobe painel e worker juntos — o painel ainda não existe, ver seção 9.

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

## 9. O que ainda não está pronto

Sendo direto, para você não procurar o que não existe:

- painel, kanban, timeline do lead e tela de configuração;
- o classificador que lê a resposta do lead. **Hoje quem responde de volta cai
  na fila de exceções e espera você** — é de propósito: melhor a conversa
  esperar do que o sistema inventar resposta;
- backup automático e o procedimento de restauração testado.

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

## 10. Backup

O banco é um arquivo só: `data/prospector.db`. Backup é copiar o arquivo com o
sistema parado (ou usar `VACUUM INTO` com ele rodando). Guarde fora da pasta do
projeto — `data/` está no `.gitignore` e não vai para o Git.

Para restaurar: pare o sistema, troque o arquivo, suba de novo. Teste isso uma
vez **antes** de precisar.
