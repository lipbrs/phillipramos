# PubliProva

**Comprovação de entregas de campanhas com creators.** A agência para de cobrar print no WhatsApp e
o relatório do cliente sai pronto.

Este diretório é a execução completa dos 5 prompts de micro-SaaS: o estudo da dor real, a ideia que
saiu dele, o produto desenhado, o plano de lançamento e **o software funcionando**.

---

## Comece por aqui

| Documento | O que responde |
|---|---|
| [00 — Estudo da dor](docs/00-estudo-da-dor.md) | Como o nicho foi escolhido, 10 problemas ranqueados, o problema vencedor e a ideia. *(Prompt 4)* |
| [01 — O micro-SaaS](docs/01-micro-saas.md) | Conceito, público, funcionalidades, ferramentas gratuitas, monetização, lançamento. *(Prompt 1)* |
| [02 — Produto e landing](docs/02-produto-e-landing.md) | Fluxo do usuário, preços, copy da landing, estratégia de monetização. *(Prompt 2)* |
| [03 — Da ideia ao software](docs/03-ideia-para-software.md) | O que construir, o código, deploy grátis, limites assumidos. *(Prompt 3)* |
| [05 — Máquina 24/7](docs/05-maquina-24-7.md) | Fluxo de automação, aquisição, passos exatos do MVP. *(Prompt 5)* |

## Rodar em 3 minutos

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

Sem nenhuma configuração o app sobe em **modo demonstração** (dados em memória) com uma campanha de
exemplo: 4 creators, 2 que entregaram e 2 pendentes.

- `/` — landing
- `/app` — painel da agência
- `/app/c/demo` — campanha com semáforo, links mágicos e cobrança
- `/r/verao-hidrata-demo` — o relatório que o cliente recebe
- `/api/cron/nudges` — a régua de cobrança rodando

Para produção: `supabase/schema.sql` + variáveis de `web/.env.example`. Passo a passo em
[03 — Da ideia ao software](docs/03-ideia-para-software.md#4-colocar-no-ar-de-graça).

## Estado do código

Fluxo completo verificado em navegador real: coleta pelo link mágico, atualização do painel,
consolidação no relatório, cálculo de CPM e régua de cobrança idempotente que para de cobrar quem
já entregou.

**Falta antes de abrir cadastro público:** autenticação multi-tenant (hoje o painel é protegido por
código de acesso), upload do print no Storage, limites de plano e cobrança recorrente. Lista
priorizada em [03 §5](docs/03-ideia-para-software.md#5-o-que-falta-antes-de-abrir-cadastro-público).

## Teste de ponta a ponta

```bash
cd web
npm run build && npm start          # num terminal
npm i -D playwright-core && node e2e/fluxo-completo.mjs
```

Verifica o caminho que é o produto: link mágico → envio do creator → painel atualizado → relatório
consolidado → régua que para de cobrar quem entregou.
