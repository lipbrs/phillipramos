# A máquina de receita 24/7

> Execução do **Prompt 5 ("Construa uma máquina de receita 24/7")**: o negócio operando com o mínimo
> de intervenção humana — fluxo de automação, aquisição, e os passos exatos para lançar o MVP.

---

## 1. O que roda sozinho e o que exige uma pessoa

Ser honesto sobre isto é o que separa negócio automatizado de promessa de internet. **O produto roda
sozinho. A venda, no começo, não.**

| Etapa | Automatizada? | Quem faz |
|---|---|---|
| Visitante descobre o produto | ⚠️ parcial | Conteúdo é humano; SEO e indicação compostos são automáticos |
| Cria conta e primeira campanha | ✅ | Sozinho, sem contato |
| Convites para os creators | ✅ | Disparo automático |
| **Cobrança dos atrasados** | ✅ | Cron diário, e-mail, para sozinho |
| Creator envia link + print | ✅ | Link mágico, sem suporte |
| Leitura dos números do print | ✅ | IA, com conferência do creator |
| Relatório do cliente | ✅ | Um clique, ou link ao vivo |
| Cobrança da mensalidade | ✅ | Stripe/Asaas com webhook |
| Suporte | ❌ | 1–3 h/mês por e-mail |
| **Vendas dos primeiros 20 clientes** | ❌ | Você. Não terceirize isto |

Só depois de ~20 clientes pagantes com o mesmo perfil é que a aquisição começa a virar sistema
(conteúdo indexado + indicação + relatórios circulando). Antes disso, automatizar venda é fugir do
aprendizado que define o produto.

---

## 2. Fluxo de automação

```
                     ┌──────────────────────────────────────────┐
  agência cria       │  campanha + lista de creators colada     │
  a campanha  ──────▶│  gera 1 token único por creator          │
                     └───────────────┬──────────────────────────┘
                                     │ e-mail de convite (Resend)
                                     ▼
                     ┌──────────────────────────────────────────┐
                     │  /e/[token] — link pessoal do creator    │
                     │  sem cadastro · abre no celular          │
                     └───────────────┬──────────────────────────┘
                        entregou?    │
              ┌──────── não ─────────┴──────── sim ────────┐
              ▼                                            ▼
  ┌───────────────────────────┐              ┌────────────────────────────┐
  │  CRON diário 09:00 BRT    │              │  print → IA → métricas     │
  │  D-2 · D0 · D+1 · D+3     │              │  creator confere e envia   │
  │  D+7 — 1 e-mail por etapa │              │  régua encerrada           │
  │  idempotente (unique SQL) │              └──────────────┬─────────────┘
  └───────────┬───────────────┘                             │
              │ ainda pendente após D+7                     ▼
              ▼                              ┌────────────────────────────┐
  ┌───────────────────────────┐              │  /r/[slug] relatório vivo  │
  │  painel destaca atrasado  │              │  cliente vê · PDF · CSV    │
  │  botão wa.me (1 clique)   │              │  rodapé "feito com         │
  │  ← único ponto humano     │              │  PubliProva" = aquisição   │
  └───────────────────────────┘              └────────────────────────────┘
```

**Três propriedades que tornam isso operável por uma pessoa só:**

- **Idempotência por SQL.** `unique (creator_id, kind)` na tabela `nudges`. O cron pode rodar duas
  vezes, falhar no meio, ser reexecutado à mão — nunca manda e-mail duplicado.
- **Falha sem consequência.** Se o cron não rodar hoje, roda amanhã. Nenhuma etapa é crítica no
  minuto. Isso elimina plantão.
- **O elo mais numeroso não tem conta.** Centenas de creators e zero senha para recuperar. O suporte
  não escala junto com o uso.

---

## 3. Mercado-alvo

Recapitulando o estudo: **agência pequena de influência e social media freelancer no Brasil**, 1 a 8
pessoas, 2 a 10 clientes, 10 a 80 creators por campanha. Detalhamento em
[`01-micro-saas.md`](01-micro-saas.md#2-público-alvo).

Tamanho suficiente para o objetivo: não é preciso um mercado de bilhões. Sessenta agências pagando
R$ 210 é R$ 12.600/mês. Elas existem às centenas em São Paulo, e o diretório da YOUPIX lista boa
parte delas com nome e site.

---

## 4. Preços

Grátis · Solo R$ 97 · **Agência R$ 247** · Studio R$ 597, por creators comprovados no mês.
Tabela e racional em [`02-produto-e-landing.md`](02-produto-e-landing.md#4-preços).

Duas escolhas que sustentam a máquina:

- **Cobrança anual com 2 meses grátis.** Recebe 10 meses à vista, elimina a inadimplência mensal e
  reduz churn — em um negócio de um operador só, caixa vale mais que MRR bonito.
- **Excedente nunca bloqueia campanha em andamento.** Cobra depois. Bloquear no meio de um
  fechamento cria um chamado de suporte urgente, que é justamente o que a máquina não pode ter.

---

## 5. Estratégia de aquisição

Em ordem de prioridade real, não de vaidade.

**1. Lista fria qualificada (semanas 1–8) — o motor inicial.**
Diretório da YOUPIX + LinkedIn ("marketing de influência", "creator marketing", Brasil) +
Instagram de agências regionais. Meta: 100 nomes, 10 abordagens/dia. Cada mensagem cita um cliente
real da agência e leva um vídeo de 90 segundos gravado para ela. Conversão esperada de 2–5% para
conversa; 20–30% das conversas viram teste.

**2. Conteúdo "Cadê o print?" (contínuo) — o motor composto.**
Dois posts por semana no LinkedIn e Instagram, cada um contando um episódio real de campanha
travada: o creator que sumiu, o relatório entregue às 23h, os 34 prints copiados à mão. É o único
tipo de conteúdo que faz o ICP se reconhecer. Vira SEO no médio prazo com as buscas certas:
"relatório de campanha de influenciadores", "modelo de relatório de publi", "como cobrar creator".

**3. O próprio produto (automático).**
Todo relatório do plano grátis leva "feito com PubliProva" e é visto pelo cliente final da agência —
uma marca que também roda campanhas. E cada campanha expõe o link a dezenas de creators, que
trabalham com outras agências. É o canal mais barato e o único que compõe sozinho.

**4. Isca de valor.**
"Modelo grátis de relatório de campanha" (Google Sheets + PDF). Quem baixa é ICP puro, entra numa
régua de 4 e-mails que termina no convite para fechar uma campanha na ferramenta.

**5. Indicação.**
Quem indica uma agência que assina ganha 1 mês grátis. O meio de influência no Brasil é pequeno e
falante — historicamente este canal vira o principal por volta do 6º mês.

**O que não fazer no início:** anúncios pagos (queima caixa antes de saber a mensagem que converte),
marketplace de apps, e programa de afiliados (atrai tráfego errado para um produto de nicho estreito).

---

## 6. Passos exatos para lançar o MVP

**Semana 1 — Provar a dor.**
1. Montar a lista de 100 agências.
2. Agendar e fazer 15 conversas de 20 minutos. Não falar do produto: perguntar como foi o fim da
   última campanha, quem cobrou os prints e quanto tempo levou.
3. Critério de corte: **10 das 15** descreverem a cobrança manual espontaneamente. Se não chegar, o
   problema é outro — voltar ao estudo em vez de forçar.

**Semana 2 — Vender antes de existir.**
4. Oferecer às 5 mais incomodadas: **fundador, R$ 97/mês vitalício no plano Agência**, pagando por
   PIX hoje, uso em 3 semanas, devolução integral se não servir.
5. **Meta: 3 pagantes.** Sem eles, não construir.

**Semana 3 — Subir o produto.**
6. Supabase (`schema.sql`) + Cloudflare Pages + variáveis de ambiente + secrets do GitHub Actions.
   Passo a passo em [`03-ideia-para-software.md`](03-ideia-para-software.md#4-colocar-no-ar-de-graça).
7. Domínio, e-mail verificado no Resend, e um teste de ponta a ponta com uma campanha de mentira:
   criar, receber o convite, enviar como creator, gerar o relatório.

**Semana 4 — Fechar a primeira campanha real.**
8. Modo concierge com o cliente fundador nº 1: você na chamada, importando os creators na tela dele.
   Cada hesitação dele é um bug de produto — anotar todas.
9. Corrigir só o que impediu o fechamento. O resto vai para a V2.
10. Pedir o depoimento e **autorização para publicar o relatório** como peça de marketing.

**Semanas 5–8 — Repetir e medir.**
11. Repetir com os fundadores 2 e 3. Iniciar as 10 abordagens/dia e os 2 posts/semana.
12. Instrumentar quatro métricas e olhar toda segunda-feira:

| Métrica | Meta | O que significa |
|---|---|---|
| **Taxa de submissão do creator** | > 85% | Se o creator não usa o link, o produto não existe |
| Tempo até relatório fechado | < 48 h após o prazo | A promessa central |
| Ativação (1ª campanha em 14 dias) | > 60% | Onboarding funciona |
| Churn mensal | < 5% | O produto virou hábito |

13. Só quando a taxa de submissão passar de 85% de forma estável, construir a V2 (monitor de post no
    ar, WhatsApp oficial) e subir o preço para novos clientes, preservando os fundadores.

**Meta de 12 meses:** 60 clientes, ticket médio R$ 210, **~R$ 12.600 MRR**, infra abaixo de
R$ 400/mês, e 1–3 horas de suporte por mês. Um micro-SaaS de um operador — que é exatamente o
objetivo, não um consolo.
