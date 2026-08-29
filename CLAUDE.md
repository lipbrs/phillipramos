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

---

# Memória Geral

Referências salvas pelo Phillip para usar quando necessário.

## Remotion Superpowers (plugin do Claude Code para produção de vídeo)

- **Repositório:** https://github.com/dojocodinglabs/remotion-superpowers
- **O que é:** plugin open source (MIT) do Claude Code que transforma o Remotion (framework React de motion graphics) em um estúdio de produção de vídeo com IA. Otimizado para conteúdo curto (TikTok, Reels, YouTube Shorts).
- **Recursos principais:**
  - Geração de música e efeitos sonoros (Suno, ElevenLabs)
  - Voiceovers com IA e transcrição (TTS)
  - Análise e entendimento de vídeo (TwelveLabs)
  - Footage de banco de imagens (Pexels)
  - Geração de imagem e vídeo por IA (vários provedores)
  - Legendas animadas estilo TikTok, transições e efeitos visuais
  - Revisão de vídeo com IA e loops de feedback
  - Suporte a 3D e visualização de dados
- **Estrutura:** 13 slash commands (`/create-video`, `/create-short`, `/generate-image`, ...), 3 agentes (video director, media scout, post-producer), 5 servidores MCP e 18 skills de produção.
- **Instalação (no Claude Code):**
  ```
  /plugin marketplace add DojoCodingLabs/remotion-superpowers
  /plugin install remotion-superpowers@remotion-superpowers
  ```
  Depois rodar `/setup` para configurar e `/create-video` para começar.
- **Requisitos:** Node.js, Python e uv.
- **Quando usar:** sempre que o Phillip pedir para criar vídeos, shorts, motion graphics ou conteúdo de vídeo com Remotion, considerar instalar/usar este plugin.

## Stack open source para o app de creators e agências

Repositórios avaliados e aprovados para uso nos projetos do Phillip, em especial o app para creators e agências. Estrelas e licenças verificadas em ago/2026.

### Postiz — agendamento e publicação em redes sociais

- **Repositório:** https://github.com/gitroomhq/postiz-app (~35k ⭐)
- **O que é:** painel self-hosted que agenda e publica em várias redes de um lugar só, com IA para adaptar o post por plataforma. Roda grátis via Docker (2–4 GB de RAM), sem chave de API paga obrigatória.
- **Licença:** AGPL-3.0 — usar como serviço separado (via API/painel) é tranquilo; modificar o código e embutir no app exige liberar o fonte. Avaliar antes de integrar profundamente.
- **Quando usar:** distribuição/agendamento de conteúdo dos creators; complementa o pipeline de vídeo do Remotion Superpowers (produz → agenda → publica).

### Firecrawl — transformar sites em dados limpos para IA

- **Repositório:** https://github.com/firecrawl/firecrawl (~174k ⭐)
- **O que é:** crawler que converte qualquer site em texto/dados estruturados prontos para IA. Cadastro dá créditos grátis; uso sério é pago (ou self-host).
- **Licença:** AGPL-3.0 no core; SDKs e componentes de UI em MIT (usar via SDK/API no app é seguro).
- **Quando usar:** pesquisa de tendências e referências para roteiros, prospecção de clientes para agências, ingestão de conteúdo da web no app.

### Browser-use — automação de navegador com IA

- **Repositório:** https://github.com/browser-use/browser-use (~112k ⭐, MIT)
- **O que é:** biblioteca Python que dá um navegador à IA para clicar, preencher e navegar sozinha. Requer 1 chave de modelo de linguagem (custo por uso).
- **Quando usar:** automatizar tarefas repetitivas de agências em plataformas sem API (painéis, formulários, coleta de métricas).

### CrewAI — orquestração de times de agentes

- **Repositório:** https://github.com/crewAIInc/crewAI (~58k ⭐, MIT)
- **O que é:** framework Python para montar agentes com papéis que dividem tarefas e entregam o trabalho completo. Requer chaves de LLM e de busca (custo por uso).
- **Quando usar:** automações de processo completo no backend do app (ex.: pesquisar nicho → gerar pauta → produzir → revisar). Considerar também o Agent SDK da Anthropic como alternativa.

### AnythingLLM — base de conhecimento com chat privado

- **Repositório:** https://github.com/Mintplex-Labs/anything-llm (~65k ⭐, MIT)
- **O que é:** app self-hosted para subir documentos e conversar com eles em chat privado, rodando local.
- **Quando usar:** base de conhecimento interna (docs de clientes das agências, brand guidelines dos creators). Uso opcional — para fluxos com Claude, o próprio Claude Code já cobre boa parte.

### Avaliados e descartados

- **Cline** (agente de código): redundante — o Claude Code já cumpre esse papel.
- **Pipecat** (agente de voz em tempo real): fora do escopo de creators/agências; exige 3 chaves de API pagas.
- **Nota geral:** custos de API entram no preço de qualquer serviço vendido sobre essas ferramentas; calcular antes de precificar.
