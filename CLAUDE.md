# Contexto do projeto — PubliProva

Este repositório contém a página pessoal do Phillip (HTML na raiz) e o projeto principal:
**PubliProva** (`publiprova/`), um micro-SaaS para agências de marketing de influência
pararem de cobrar link/print de creators no WhatsApp — cobrança automática + relatório
do cliente pronto.

## Leia primeiro, nesta ordem
1. `publiprova/README.md` — visão geral e como rodar
2. `publiprova/docs/00-estudo-da-dor.md` — a pesquisa que originou a ideia
3. `publiprova/docs/04-kit-de-validacao.md` — a fase ATUAL (validação com agências)
4. `publiprova/validacao/` — lista de alvos e conteúdo de lançamento do Instagram

## Estado atual (atualizar conforme avança)
- Código: MVP funcional multi-tenant em `publiprova/web` (Next.js 15 + TS). Build,
  typecheck e 21 asserções e2e passando (`web/e2e/fluxo-completo.mjs`).
- Fase de negócio: **Fase 0 — validação**. Meta: 15 conversas com agências e 3 clientes
  fundadores pagantes ANTES do deploy público. Operação 100% remota (fundador fora do
  Brasil): e-mail > LinkedIn > DM do @publiprova; Instagram pessoal fica fora.
- Pendências de produto (ordem): cobrança recorrente (só após 3 fundadores), textos
  LGPD, rate limiting no login.

## Papéis do Claude nesta base
- Editor/manager da conta @publiprova: captions e pauta seguem a voz e os pilares de
  `publiprova/validacao/conteudo-lancamento.md` (pt-BR, direto, sem hype; objetivo da
  fase é credibilidade e conversas de pesquisa, não crescimento de audiência).
- Engenharia: manter o padrão dos módulos em `web/lib` (store com driver duplo
  memória/Supabase; integrações pagas sempre degradam sem quebrar).

## Convenções
- Idioma de tudo (código comentado, docs, commits): pt-BR.
- Branch de trabalho: `claude/pain-analysis-ideation-o1mvb4`.
- Rodar o app: `cd publiprova/web && npm install && npm run dev` (modo demonstração
  sem configuração; login de 1 clique em /login).
- Testes e2e: build + start, depois `node e2e/fluxo-completo.mjs` (exige Chromium;
  reiniciar o servidor entre execuções).
