# PubliProva — o micro-SaaS completo

> Execução do **Prompt 1 ("Construa um micro-SaaS")**.
> A ideia vem do estudo em [`00-estudo-da-dor.md`](00-estudo-da-dor.md).

---

## 1. Conceito do produto

**PubliProva** fecha campanhas de marketing de influência.

Hoje o fim da campanha é assim: alguém da agência abre o WhatsApp e pede, um por um, para 30 creators
o link do post e o print dos insights. Recebe 14. Cobra de novo. Recebe mais 9. Cobra os 7 que
faltam. Copia número por número numa planilha, monta um PDF no Canva e manda pro cliente. Três dias
de trabalho humano, todo mês, em toda campanha.

Com PubliProva:

1. A agência cria a campanha e cola a lista de creators (nome, contato, @, entregáveis, cachê).
2. Cada creator recebe **um link pessoal** — sem cadastro, sem senha, sem app. Abre no celular,
   cola o link do post, sobe o print dos insights.
3. A IA lê o print e preenche alcance, impressões, curtidas, salvos, compartilhamentos e cliques.
   O creator confere, corrige se precisar, e envia.
4. Quem não entregou é cobrado **sozinho**: D-2, dia da entrega, D+1, D+3, D+7. Por e-mail e por
   link de WhatsApp pronto.
5. A agência acompanha um painel com semáforo: pendente / postado / comprovado / atrasado.
6. Um clique gera o **relatório do cliente**: link público com a marca da agência (ou do cliente),
   cards por creator com print e números, totais consolidados, CPM e custo por engajamento
   calculados a partir do cachê. Exporta PDF e CSV.

**O que o PubliProva não é:** não é plataforma de descoberta de influenciador, não é marketplace,
não é ferramenta de agendamento de post. Essas partes já estão saturadas. Ele faz uma coisa só, a
parte que ninguém quer fazer.

**Frase de posicionamento:** *Você para de cobrar print no WhatsApp. O relatório do cliente sai
sozinho.*

---

## 2. Público-alvo

**ICP primário — agência pequena de influência (1 a 8 pessoas).**
2 a 10 clientes ativos, 10 a 80 creators por campanha, fatura R$ 15k–R$ 150k/mês. Tem uma pessoa
(analista ou estagiário) cuja rotina inclui cobrar creator. Já perdeu prazo de relatório.
Onde encontrar: diretório de agências da YOUPIX, LinkedIn (cargo "influencer marketing" / "creator
marketing" + Brasil), grupos de social media, eventos do setor.

**ICP secundário — social media freelancer / squad de 2–3 pessoas.**
Roda influência como serviço extra para 2–5 clientes locais. Usa planilha e WhatsApp. Compra plano
de entrada, é volume.

**ICP terciário (expansão, não foco inicial) — time de marketing de marca** que roda campanha com
creators direto, sem agência. Ticket maior, ciclo de venda mais longo, exige nota fiscal e
compliance. Só depois de 50 clientes pagantes.

**Anti-ICP (não vender para):** creator individual (paga pouco, cancela rápido) e grande agência com
plataforma enterprise já contratada.

---

## 3. Funcionalidades

### MVP (o que sai no lançamento)

| # | Funcionalidade | Por que é MVP |
|---|---|---|
| 1 | Campanha com cliente, período, briefing e prazo | Unidade básica de trabalho |
| 2 | Importação de creators por colagem/CSV | Entrada de dados em 30 segundos |
| 3 | Link mágico por creator, sem cadastro | **O coração.** Qualquer atrito aqui mata a coleta |
| 4 | Submissão: URL do post + upload do print | O dado que a agência precisa |
| 5 | Extração de métricas do print por IA, editável | Diferencial e economia de tempo |
| 6 | Cobrança automática por e-mail em régua | É o que roda 24/7 sem humano |
| 7 | Botão "cobrar no WhatsApp" com texto pronto | Custo zero, funciona no canal real do Brasil |
| 8 | Painel com status por creator | Visibilidade — a agência para de perguntar "e o fulano?" |
| 9 | Relatório público com marca + PDF + CSV | O entregável que justifica a assinatura |
| 10 | Cálculo automático de CPM e custo por engajamento | Transforma print em argumento comercial |

### V2 (30–90 dias após primeiros clientes)

- **Monitor de post no ar** — checagem periódica da URL; alerta se o creator apagou antes do prazo
  contratado (problema #6 do estudo, sem concorrência).
- WhatsApp automático via API oficial (plano Agência+).
- Aprovação de conteúdo antes da postagem (roteiro/prévia com comentários).
- Controle de pagamento e coleta de NF/recibo do creator.
- Links UTM e cupom por creator para atribuição de vendas.
- Portal do cliente final (o cliente da agência entra e vê a campanha ao vivo).

### Nunca fazer

Descoberta de creators por base de dados, análise de seguidores falsos, agendamento de post. São
mercados de guerra com players capitalizados; entrar neles destrói o foco que torna o produto
vendável.

---

## 4. Ferramentas gratuitas para construir

| Camada | Ferramenta | Plano grátis | Ressalva honesta |
|---|---|---|---|
| Front + API | **Next.js** | open source | — |
| Hospedagem | **Cloudflare Pages/Workers** | 100k req/dia | Recomendado: o grátis **permite uso comercial** |
| Hospedagem (alt.) | **Vercel Hobby** | generoso | ⚠️ Hobby **proíbe uso comercial** — ao cobrar o 1º cliente, migrar para Pro (US$ 20/mês) |
| Banco + Auth + Storage | **Supabase** | 500 MB DB, 1 GB storage, Auth ilimitado | ⚠️ Projeto grátis **pausa após ~1 semana sem uso** — irrelevante com clientes reais, atenção na fase de testes |
| E-mail transacional | **Resend** | 3.000 e-mails/mês, 100/dia | Suficiente para ~10 campanhas/mês |
| Cron / automação | **GitHub Actions** (agendado) ou **Supabase pg_cron** | grátis | Vercel Hobby limita cron a 1×/dia; Actions não |
| Leitura de print | **Claude Haiku** (API) | pago por uso | ~R$ 0,02 por print. Não é grátis, mas é irrisório e opcional — sem chave, o app cai para digitação manual |
| PDF do relatório | Página HTML + `print` do navegador | grátis | Zero dependência, zero manutenção |
| Pagamento | **Stripe** ou **Asaas** (PIX + boleto) | sem mensalidade, % por transação | Asaas é melhor para Brasil (PIX recorrente) |
| Landing page | O próprio Next.js | grátis | Já está no código |
| Domínio | `.com.br` | ~R$ 40/ano | Único custo obrigatório do dia 1 |

**Custo real para começar: R$ 40/ano de domínio.** Tudo o mais entra em plano gratuito até existir
receita. Ao passar de ~R$ 500 MRR, o custo de infra fica em torno de US$ 20–45/mês.

### Caminho sem programação (se a preferência for no-code)

Funciona e vale para validar, com um teto claro:

- **Baserow** ou **Airtable** — base de campanhas, creators e submissões
- **Fillout** ou **Tally** — formulário de submissão pré-preenchido por link único
- **n8n** (self-host grátis) ou **Make** — régua de cobrança e disparo de e-mail
- **Softr** ou **Glide** — painel da agência
- **Documint** ou **PDFMonkey** — relatório em PDF

Teto do no-code: a partir de ~40 clientes as operações do Make/Airtable custam mais caro por mês do
que a stack em código inteira, e a leitura de print por IA fica limitada. Estratégia recomendada:
**no-code para os 5 primeiros clientes pagantes, migrar para o código deste repositório depois.**

---

## 5. Modelo de monetização

Assinatura mensal por volume de creators comprovados — a métrica que cresce junto com o valor
entregue.

| Plano | Preço | Limites | Para quem |
|---|---|---|---|
| **Grátis** | R$ 0 | 1 campanha ativa, 5 creators, marca PubliProva no relatório | Isca e prova de valor |
| **Solo** | R$ 97/mês | 3 campanhas ativas, 30 creators/mês, relatório sem marca | Freelancer de social media |
| **Agência** | R$ 247/mês | Campanhas ilimitadas, 150 creators/mês, logo do cliente, 3 usuários, WhatsApp automático | **Plano âncora — o alvo real** |
| **Studio** | R$ 597/mês | 500 creators/mês, múltiplas marcas, portal do cliente, CSV/API, onboarding assistido | Agência com time |

- Anual com 2 meses grátis (melhora caixa e trava churn).
- Creator excedente: R$ 2/creator, sem bloquear a campanha no meio.
- Sem cobrar por usuário até o Studio — cobrar por assento em agência pequena gera atrito e leva a
  compartilhamento de senha.

**Racional do preço.** O mercado está polarizado: R$ 8–30/mês para ferramentas de social media, e
R$ 3.000–20.000/mês de assinatura nas plataformas de influência. A faixa R$ 97–597 está vazia. E o
ROI é fácil de defender: se o produto devolve 10 horas/mês de uma pessoa que custa R$ 50/hora, são
R$ 500 economizados contra R$ 247 pagos — sem contar a renovação de contrato que um relatório
pontual protege.

**Economia unitária.** Custo marginal por creator comprovado ≈ R$ 0,03 (leitura do print + e-mails +
storage). No plano Agência com 150 creators: ~R$ 4,50 de custo variável para R$ 247 de receita.
Margem bruta acima de 97%. O gargalo do negócio é aquisição, não infraestrutura — por isso o
plano de lançamento abaixo é quase todo sobre distribuição.

**Receita adicional (depois, não agora):** taxa sobre repasse de cachê aos creators, relatório
white-label revendido pela agência, e plano para marca/anunciante com portal próprio.

---

## 6. Plano de lançamento passo a passo

### Fase 0 — Validação antes de construir (dias 1–10)

1. Montar lista de 100 alvos: diretório YOUPIX + busca no LinkedIn por "marketing de influência" +
   Instagram de agências regionais. Planilha com nome, agência, canal de contato.
2. Fazer **15 conversas de 20 minutos**. Roteiro sem falar do produto:
   *"Me conta o fim da última campanha de vocês. Como vocês pegaram os prints? Quanto tempo levou?
   Quem faz isso? O que já deu errado?"*
3. Critério objetivo de continuar: **10 das 15** descreverem espontaneamente cobrança manual de
   print/link. Se não chegar, o problema não é este — voltar ao estudo, não forçar.
4. Pré-venda: para as 5 mais incomodadas, oferecer **fundador: R$ 97/mês vitalício no plano
   Agência**, pagando hoje, com uso em 3 semanas e devolução integral se não servir. **Meta: 3 pagos
   antes da primeira linha de produção.**

### Fase 1 — MVP (dias 11–25)

5. Subir o código deste repositório (`web/`) no Cloudflare Pages + Supabase. Meia hora.
6. Rodar a campanha real do primeiro cliente fundador **junto com ele**, na tela, modo concierge:
   você importa os creators, você aperta o botão. Todo atrito aparece aqui.
7. Regra de corte: só entra no MVP o que impede um cliente fundador de fechar a campanha. Todo o
   resto vai para a lista da V2.

### Fase 2 — Primeiros 10 clientes (dias 26–60)

8. Publicar o **relatório de um cliente real como peça pública** (com autorização), no LinkedIn:
   "assim ficou o fechamento de uma campanha com 34 creators". O entregável é o próprio anúncio.
9. Série de conteúdo **"Cadê o print?"** — 2 posts/semana no LinkedIn e Instagram, cada um contando
   um episódio real de campanha travada. É o canal onde o ICP vive.
10. Cold outreach de 10 mensagens/dia para a lista da Fase 0, com um vídeo de 90 segundos gravado
    para a agência específica, usando o nome de um cliente dela.
11. Lead magnet: **modelo grátis de relatório de campanha** (Google Sheets + PDF). Quem baixa é ICP
    puro e entra na régua de e-mail.
12. Programa de indicação: quem indica agência que assina ganha 1 mês grátis. Agência de influência
    é um meio pequeno e falante — este canal costuma virar o principal.

### Fase 3 — Repetibilidade (dias 61–90)

13. Instrumentar as 4 métricas que importam: **taxa de submissão do creator** (% que entrega pelo
    link), **tempo até relatório fechado**, ativação (agência que fecha a 1ª campanha em 14 dias) e
    churn mensal.
14. Perseguir a taxa de submissão acima de 85% — é o número que prova o produto. Se creator não
    entrega pelo link, o produto não existe.
15. Só depois disso, abrir a V2 (monitor de post no ar + WhatsApp oficial) e subir o preço para
    novos clientes, preservando os fundadores.

**Meta realista de 12 meses:** 60 clientes pagantes, ticket médio R$ 210 → **~R$ 12.600 MRR** com
custo de infra abaixo de R$ 400/mês. Não é foguete; é um micro-SaaS de um operador só, que é
exatamente o objetivo.
