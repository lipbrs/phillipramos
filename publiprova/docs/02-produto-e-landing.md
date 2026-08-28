# Produto detalhado, fluxo do usuário e copy da landing

> Execução do **Prompt 2 ("Construa uma ferramenta de renda passiva")**: recursos principais, fluxo
> do usuário, preços, texto da landing page e estratégia de monetização — com prioridade explícita
> em **construir de graça e manter com o mínimo de manutenção**.

---

## 1. Por que este produto aguenta ser "renda passiva"

Renda passiva em software não é sorte, é escolha de arquitetura. Quatro decisões deste produto
eliminam manutenção antes dela existir:

1. **Não depende de API de rede social.** Nada de token do Instagram, revisão de app da Meta ou
   scraping. Quando o Instagram muda o layout, um scraper quebra e o suporte explode; aqui, o dado
   entra pelo print que o creator já manda hoje.
2. **Creator não tem conta.** Sem login, sem senha, sem "esqueci minha senha", sem recuperação de
   e-mail. O elo mais numeroso do sistema (centenas de creators) é o que gera zero suporte.
3. **O trabalho recorrente é um cron.** A cobrança roda sozinha uma vez por dia. Se o cron falhar um
   dia, roda no dia seguinte — falha sem consequência é falha barata.
4. **A IA é assistente, não autoridade.** Todo número extraído do print é editável e confirmado pelo
   creator. Se o modelo errar, o usuário corrige em 5 segundos — não vira chamado de suporte nem bug
   de produção.

Manutenção esperada em regime: **1 a 3 horas por mês** (suporte por e-mail + atualização de
dependências). O tempo real vai para vendas, e isso é intencional.

---

## 2. Recursos principais

### Para a agência

- **Campanhas** — cliente, marca, período, briefing, prazo de postagem e prazo de comprovação.
- **Importação de creators** — colar da planilha ou CSV: nome, @, e-mail, WhatsApp, entregáveis, cachê.
- **Painel semáforo** — pendente · postado · comprovado · atrasado, com contador de dias de atraso.
- **Cobrança automática** — régua D-2, D0, D+1, D+3, D+7. Para sozinha quando o creator entrega.
- **Cobrar no WhatsApp** — botão que abre o WhatsApp com a mensagem pronta e o link pessoal do creator.
- **Relatório do cliente** — link público com logo da agência ou do cliente, cards por creator com
  print e métricas, totais, CPM e custo por engajamento. PDF e CSV.
- **Histórico por creator** — quem entrega no prazo e quem sempre atrasa, entre campanhas. Vira
  critério de curadoria na campanha seguinte (e é o dado que nenhuma plataforma grande tem da
  agência dela).

### Para o creator

- **Link pessoal, sem cadastro** — abre no celular e já mostra o nome dele e o que foi combinado.
- **Checklist de entregáveis** — "1 Reel + 2 Stories", cada um com seu campo.
- **Print → números automáticos** — sobe o print dos insights, os campos vêm preenchidos, ele confere.
- **Confirmação visível** — tela de "entregue ✅" com a data. Encerra a cobrança e a ansiedade.

---

## 3. Fluxo do usuário

### 3.1 Agência (primeira campanha, ~6 minutos)

```
Landing → "Começar grátis" → login por link mágico no e-mail (sem senha)
   ↓
Onboarding em 3 campos: nome da agência, logo, cor
   ↓
Nova campanha: cliente · marca · período · prazo de postagem · prazo de comprovação
   ↓
Colar creators da planilha  →  preview da tabela  →  confirmar
   ↓
"Enviar convites" → cada creator recebe e-mail com o link pessoal
   ↓
Painel: 0/30 comprovados
   ↓
[o sistema trabalha sozinho por 5–10 dias]
   ↓
Painel: 28/30 comprovados · 2 atrasados → botão "Cobrar no WhatsApp" nos 2
   ↓
"Gerar relatório" → link público + PDF → manda pro cliente
```

### 3.2 Creator (~90 segundos, no celular)

```
E-mail/WhatsApp: "Oi Ana, sua entrega da campanha Verão Y é até 12/09"
   ↓
Abre o link (sem login) → vê marca, briefing e seus entregáveis
   ↓
Cola o link do post publicado
   ↓
Sobe o print dos insights → campos preenchidos automaticamente
   ↓
Confere / corrige os números → "Enviar"
   ↓
"Entrega registrada ✅ — a agência já foi avisada"
```

**Regra de ouro do fluxo:** o creator nunca precisa de conta, nunca instala nada, e nunca digita
mais do que o necessário. Cada campo a mais nessa tela derruba a taxa de submissão — que é a métrica
que define se o produto existe.

### 3.3 Cliente final da agência

Recebe um link público (`/r/slug`) que abre no celular, mostra a campanha ao vivo, e imprime em PDF.
Não precisa de conta. É, na prática, o melhor canal de aquisição do produto: o cliente da agência é
uma marca que também roda campanhas.

---

## 4. Preços

| | **Grátis** | **Solo** | **Agência** ⭐ | **Studio** |
|---|---|---|---|---|
| Preço | R$ 0 | R$ 97/mês | R$ 247/mês | R$ 597/mês |
| Campanhas ativas | 1 | 3 | ilimitadas | ilimitadas |
| Creators/mês | 5 | 30 | 150 | 500 |
| Relatório sem marca PubliProva | — | ✅ | ✅ | ✅ |
| Logo do cliente no relatório | — | — | ✅ | ✅ |
| Usuários | 1 | 1 | 3 | ilimitados |
| WhatsApp automático | — | — | ✅ | ✅ |
| Portal do cliente / CSV / API | — | — | — | ✅ |

Anual com 2 meses grátis. Creator excedente R$ 2/un, sem travar campanha em andamento.
Racional completo do preço em [`01-micro-saas.md`](01-micro-saas.md#5-modelo-de-monetização).

---

## 5. Copy da landing page

> Pronta para colar. É a copy usada no código em `web/app/page.tsx`.

### Hero

**Chapéu:** Para agências e social medias que rodam campanhas com creators

**H1:** Cadê o print?

**Subtítulo:** Você não precisa mais cobrar link e print de 30 creators no WhatsApp. O PubliProva
cobra sozinho e entrega o relatório do cliente pronto.

**CTA primário:** Começar grátis — 5 creators
**CTA secundário:** Ver um relatório de verdade →
**Microcopy:** Sem cartão de crédito. Sua primeira campanha fecha hoje.

### Bloco: o problema (agitação)

**Título:** Toda campanha termina do mesmo jeito

- Você manda mensagem para 30 creators pedindo o link do post.
- Metade responde. A outra metade você cobra de novo. E de novo.
- Você copia número por número dos prints pra uma planilha.
- Monta o PDF no Canva às 23h porque o cliente pede o relatório amanhã.

**Fecho:** São 8 a 15 horas por mês fazendo o trabalho mais caro que existe: cobrar gente.

### Bloco: como funciona

**Título:** Três passos. O resto acontece sem você.

**1. Cole sua lista de creators**
Nome, contato, entregáveis e cachê. Direto da sua planilha. 30 segundos.

**2. Cada creator recebe um link pessoal**
Sem cadastro, sem app. Ele cola o link do post, sobe o print e a IA transforma em números.
Quem não entregou é cobrado automaticamente até entregar.

**3. O relatório do cliente sai pronto**
Com a sua marca (ou a do cliente), print por creator, totais, CPM e custo por engajamento.
Link para compartilhar e PDF para anexar.

### Bloco: por que funciona

- **O creator não cria conta.** Zero atrito é o que faz ele responder. Link no celular, 90 segundos, pronto.
- **A cobrança é do sistema, não sua.** Deixa de ser uma relação pessoal desconfortável e vira processo.
- **A IA lê o print por você.** Alcance, impressões, salvos, compartilhamentos — preenchidos e editáveis.
- **Nada depende de API do Instagram.** Não trava, não pede permissão, não some quando a Meta muda algo.

### Bloco: prova

> "Fechamos uma campanha com 34 creators em dois dias em vez de uma semana. E o cliente pediu o
> relatório de novo — dessa vez elogiando." — *depoimento a coletar com o primeiro cliente fundador*

**Números para exibir quando existirem:** taxa média de submissão dos creators, horas economizadas
por campanha, campanhas fechadas na plataforma. Enquanto não existirem, não inventar: usar o
relatório público de uma campanha real como prova.

### Bloco: preço

Título: **Menos que uma diária de estagiário.**
Subtítulo: Comece grátis. Suba de plano quando a primeira campanha fechar sozinha.
(tabela da seção 4)

### FAQ

**O creator precisa criar conta?** Não. Ele abre um link, envia e acabou. É justamente por isso que
ele responde.

**E se o creator mandar um print errado ou editado?** O sistema guarda a imagem original, a data e
hora do envio, e valida o link do post. Divergências entre o print e o combinado ficam sinalizadas
no painel. Não é perícia — é registro e rastreabilidade, que é o que falta hoje.

**Funciona com Instagram, TikTok e YouTube?** Sim. Como a comprovação é print + link, funciona em
qualquer plataforma, inclusive nas que não abrem API para terceiros.

**Preciso da senha ou do acesso do creator?** Nunca. Você não pede acesso a nada.

**Posso colocar a marca do meu cliente no relatório?** Sim, a partir do plano Agência.

**E a LGPD?** Você é o controlador dos dados dos seus creators; o PubliProva é operador. Há contrato
de tratamento, exclusão sob demanda e retenção configurável por campanha.

### Fechamento

**H2:** Sua próxima campanha pode fechar sozinha.
**CTA:** Criar minha primeira campanha — grátis

---

## 6. Estratégia de monetização

**Motor principal:** assinatura mensal, com o **plano Agência (R$ 247)** como âncora. O plano Solo
existe para reduzir a barreira de entrada e o Studio para dar contraste de preço — a maioria escolhe
o do meio, e é ele que sustenta o negócio.

**Gatilho natural de upgrade:** o limite de creators/mês. É a métrica que cresce sozinha conforme a
agência ganha clientes. O upgrade acontece por sucesso do cliente, não por bloqueio artificial — por
isso o excedente a R$ 2 nunca interrompe uma campanha em andamento: cobra-se depois, sem sabotar a
entrega.

**Motor de aquisição embutido no produto:** todo relatório gerado no plano grátis leva "feito com
PubliProva". Cada campanha fechada expõe a marca ao cliente final e a todos os creators envolvidos —
que são, eles próprios, o público de outras agências. É distribuição gratuita e composta.

**Expansão de receita, em ordem:**
1. Creators excedentes (imediato, automático).
2. Upgrade Solo → Agência (limite + logo do cliente).
3. V2: monitor de post no ar e WhatsApp oficial como razão para o plano Agência+.
4. Plano para marca/anunciante com portal próprio — ticket 3–5×, vendido pela porta que o próprio
   relatório abriu.

**Retenção:** o histórico de entrega por creator acumula dentro da conta e vira ativo da agência
("esses 12 creators nunca atrasam"). Quanto mais campanhas a agência fecha, mais caro fica sair —
sem nenhuma trava artificial.

**O que não fazer:** cobrar por assento em agência de 3 pessoas (gera senha compartilhada), cobrar
percentual do cachê no início (transforma um SaaS barato numa conversa de comissão), e dar desconto
maior que o do fundador — desconto vira teto de preço permanente.
