# Da ideia ao software funcional

> Execução do **Prompt 3 ("Transforme uma ideia em software")**, partindo do princípio de quem não
> programa: o que exatamente precisa ser construído, o código pronto, e como colocar no ar com
> ferramentas gratuitas.
>
> **A ideia usada é a do estudo próprio em [`00-estudo-da-dor.md`](00-estudo-da-dor.md)**, não um
> exemplo genérico: coleta e comprovação de entregas de campanhas com creators.

---

## 1. O que precisa ser construído (e o que não precisa)

O sistema tem **quatro telas e um robô**. Nada além disso no MVP.

| Peça | Rota | Quem usa | O que faz |
|---|---|---|---|
| Landing | `/` | visitante | Vende o produto e leva para o cadastro |
| Painel | `/app` | agência | Lista campanhas e cria campanha nova colando a lista de creators |
| Campanha | `/app/c/[id]` | agência | Semáforo por creator, link mágico, botão de cobrança, totais |
| Link do creator | `/e/[token]` | **creator** | Envia link do post + print, sem cadastro |
| Relatório | `/r/[slug]` | cliente da agência | Página pública com marca, cards por creator, CPM, PDF e CSV |
| Robô da cobrança | `/api/cron/nudges` | ninguém | Roda 1×/dia e cobra quem falta |
| Leitor de print | `/api/extract` | creator (por trás) | Manda a imagem para a IA e devolve os números |

**Fora do MVP de propósito:** cadastro público com senha, cobrança no cartão, app de celular,
integração com Instagram, chat interno. Cada um desses adiciona semanas e nenhum deles é o motivo
pelo qual a agência vai pagar.

### O modelo de dados inteiro

Cinco tabelas. O SQL completo está em [`../supabase/schema.sql`](../supabase/schema.sql).

```
agencies ─┬─ campaigns ─┬─ creators ─┬─ submissions   (1 por creator: link + print + métricas)
          │             │            └─ nudges        (registro de cada cobrança enviada)
```

A tabela `nudges` tem `unique (creator_id, kind)`. É uma linha de SQL que garante que rodar a
cobrança duas vezes no mesmo dia **não manda e-mail duplicado** — o tipo de decisão que evita
suporte no futuro.

### As três regras que são o produto

1. **Status é calculado, não guardado.** `comprovado` se existe submissão; `atrasado` se passou do
   prazo sem submissão; senão `pendente`. Estado derivado nunca fica dessincronizado.
2. **A régua para sozinha.** A cobrança consulta a submissão antes de enviar. Quem entregou nunca
   mais é incomodado — é isso que faz o creator confiar no link.
3. **A IA sugere, o creator confirma.** Todo número extraído do print entra num campo editável. O
   modelo pode errar sem virar dado errado no relatório do cliente.

---

## 2. O código

Está inteiro em [`../web`](../web), pronto para rodar. Escrito em Next.js (React) com TypeScript.

```
web/
├── app/
│   ├── page.tsx                    landing com a copy do doc 02
│   ├── actions.ts                  criar campanha · registrar comprovação
│   ├── app/page.tsx                painel + formulário de nova campanha
│   ├── app/c/[id]/page.tsx         campanha: semáforo, links, cobrança
│   ├── e/[token]/page.tsx          página do creator (sem login)
│   ├── e/[token]/SubmitForm.tsx    upload do print → IA → campos editáveis
│   ├── r/[slug]/page.tsx           relatório público do cliente
│   ├── r/[slug]/csv/route.ts       exportação CSV
│   ├── api/extract/route.ts        leitura do print
│   └── api/cron/nudges/route.ts    robô da cobrança
├── lib/
│   ├── store.ts                    dados (memória em dev · Supabase em produção)
│   ├── nudges.ts                   régua D-2 · D0 · D+1 · D+3 · D+7
│   ├── extract.ts                  print → métricas via IA
│   ├── email.ts                    Resend (vira log sem chave)
│   ├── metrics.ts                  CPM, custo por engajamento, totais
│   └── parse.ts                    colagem da planilha, wa.me, slug, token
├── middleware.ts                   trava do painel
└── supabase/schema.sql             tabelas, RLS e retenção LGPD
```

**Uma decisão de arquitetura que vale explicar:** `lib/store.ts` tem dois drivers. Sem variáveis do
Supabase, ele guarda tudo em memória e já sobe com uma campanha de exemplo — dá para abrir e testar
em 30 segundos. Com as variáveis, escreve no Postgres. Nenhuma tela muda. Isso permite validar o
fluxo com clientes reais antes de configurar qualquer infraestrutura.

**Todas as integrações pagas são opcionais e degradam sem quebrar:** sem chave de IA, o creator
digita os números; sem chave de e-mail, a cobrança vira log e você usa o botão de WhatsApp. O
produto funciona de graça desde o primeiro minuto.

### Verificação feita

O fluxo completo foi testado em navegador real (Chromium), não só compilado:

```
PASS  painel mostra 2/4 comprovados
PASS  botão WhatsApp gera wa.me com o link do creator
PASS  página do creator abre sem login
PASS  envio registrado
PASS  link vira comprovante depois do envio
PASS  painel atualiza para 3/4
PASS  relatório mostra 3 creators comprovados
PASS  CPM calculado no relatório — R$ 13,46
PASS  régua não cobra quem já entregou
```

Mais a régua rodando duas vezes seguidas e enviando e-mail só na primeira (idempotência).

---

## 3. Rodar na sua máquina (3 minutos)

```bash
cd publiprova/web
npm install
npm run dev
```

Abra `http://localhost:3000`. Já existe uma campanha de exemplo com 4 creators — 2 que entregaram e
2 que não. Entre em `/app`, abra a campanha, copie o link de um creator pendente e envie uma
comprovação como se fosse ele. É o produto inteiro em 2 minutos.

---

## 4. Colocar no ar de graça

### Passo 1 — Banco (Supabase, grátis)

1. Criar projeto em supabase.com.
2. SQL Editor → colar `supabase/schema.sql` → Run.
3. Settings → API → copiar **Project URL** e **service_role key**.

> ⚠️ Projeto gratuito do Supabase **pausa após ~1 semana sem acesso**. Com clientes reais nunca
> acontece; na fase de testes, basta reativar no painel.

### Passo 2 — Hospedagem

**Recomendado: Cloudflare Pages** — o plano gratuito permite uso comercial.

```bash
npm install -D @cloudflare/next-on-pages
npx @cloudflare/next-on-pages
# conectar o repositório em dash.cloudflare.com → Workers & Pages
```

**Alternativa: Vercel** — conectar o repositório e apontar o diretório raiz para `publiprova/web`.

> ⚠️ O plano **Hobby da Vercel proíbe uso comercial**. Para validar sem cobrar, tudo bem. No dia em
> que o primeiro cliente pagar, migre para o Pro (US$ 20/mês) — não é opinião, é o termo de uso.

### Passo 3 — Variáveis de ambiente

Copie de `web/.env.example`. As obrigatórias em produção são `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`, `CRON_SECRET` e `AGENCY_ACCESS_CODE`.

### Passo 4 — Ligar o robô da cobrança

O workflow já está pronto em `.github/workflows/publiprova-nudges.yml`. Basta criar dois secrets no
repositório (`APP_URL` e `CRON_SECRET`). Ele roda todo dia às 9h de Brasília e chama
`/api/cron/nudges`.

Por que GitHub Actions e não o cron da Vercel: o plano Hobby limita cron a 1×/dia e o Actions é
gratuito e sem essa restrição.

### Passo 5 — E-mail

Criar conta no Resend, verificar o domínio (registro DNS), gerar a chave e preencher `RESEND_API_KEY`
e `MAIL_FROM`. Sem domínio verificado o e-mail cai em spam — este é o único passo que não dá para
pular.

### Custo total

| Item | Custo |
|---|---|
| Domínio `.com.br` | ~R$ 40/ano |
| Cloudflare Pages | R$ 0 |
| Supabase | R$ 0 |
| Resend (até 3.000 e-mails/mês) | R$ 0 |
| GitHub Actions | R$ 0 |
| IA para ler prints | ~R$ 0,02 por print (opcional) |

**Total para começar: R$ 40/ano.**

---

## 5. O que falta antes de abrir cadastro público

Sendo honesto sobre o estado do código — ele fecha campanha de verdade, mas não é multi-tenant:

1. **Autenticação.** O painel hoje é protegido por um código de acesso (`AGENCY_ACCESS_CODE`), o que
   basta para atender os primeiros clientes fundadores no modo concierge. Trocar por Supabase Auth
   (magic link) e passar a filtrar campanhas por `agency_id` — a coluna já existe no schema, com as
   policies de RLS escritas.
2. **Upload do print no Storage.** Hoje a imagem é lida pela IA e descartada; o campo
   `screenshot_url` e o bucket privado `prints` já estão prontos para receber o arquivo. Necessário
   antes de prometer "prova auditável".
3. **Cobrança em cartão/PIX.** Stripe ou Asaas com webhook atualizando `agencies.plan`. Só depois de
   ter os 3 clientes pré-vendidos — antes disso, cobrar por PIX manual é mais rápido.
4. **Limite de plano.** Contar creators por mês e bloquear criação acima do limite (nunca no meio de
   uma campanha em andamento).

Ordem recomendada: 1 → 2 → 4 → 3.

---

## 6. Limites que o produto assume (e como responder quando perguntarem)

**"E se o creator editar o print?"** O sistema guarda a imagem original, o horário do envio e o link
do post. Divergência entre o print e o post fica sinalizada. Não é perícia forense — é registro e
rastreabilidade, que hoje simplesmente não existem numa conversa de WhatsApp. Isso já é um salto.

**"E se a IA ler errado?"** Ela preenche, o creator confere e corrige. O caminho manual continua
disponível e o produto funciona 100% sem IA.

**"E o Instagram muda alguma coisa?"** Não afeta. O produto não fala com o Instagram — é exatamente
por isso que ele sobrevive sem manutenção.

**"E a LGPD?"** A agência é controladora dos dados dos creators e o PubliProva é operador. O schema
já traz a função de retenção (180 dias após o fim da campanha) e o bucket de prints é privado.
Faltam: contrato de tratamento e política de privacidade — texto jurídico, não código.
