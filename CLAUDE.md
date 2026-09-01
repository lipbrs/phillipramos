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

## 3D — modelagem, renderização e impressão (Blender + skills)

Skills da comunidade vetadas em set/2026 (código lido: sem chamadas suspeitas, sem exfiltração; chamadas externas só a APIs declaradas). Contexto: loja Etsy de impressão 3D + vídeos de produto.

### Pré-requisito comum: Blender MCP

- **Repositório:** https://github.com/ahujasid/blender-mcp — ponte entre o Claude Code e o Blender.
- **Setup (uma vez, na máquina local):** instalar `uv`; instalar o `addon.py` do repo no Blender (Edit → Preferences → Add-ons); na sidebar do Blender (`N`) → BlenderMCP → Connect to Claude; no Claude Code: `claude mcp add blender -- uvx blender-mcp`.

### kevinbadi/blender-skills — produto e câmera (prioridade 1)

- **Repositório:** https://github.com/kevinbadi/blender-skills — 16 skills: turntable, dolly-rotate, slow-zoom, crane-shot, perfect-loop, product-polish, cenas/HDRI/materiais Poly Haven, image-to-3d e multi-image-to-3d (via API Meshy, chave própria), threejs-export.
- **Instalação:** copiar as pastas de skill para `.claude/skills/` do projeto.
- **Requisitos:** Blender MCP + ffmpeg; chave Meshy só para as skills de geração 3D.
- **Quando usar:** vídeos de produto dos itens 3D (turntable/zoom para Etsy, Reels, pins).

### mfranzon/render — CAD paramétrico para impressão (prioridade 1)

- **Repositório:** https://github.com/mfranzon/render — skill `/render`: gera modelo 3D paramétrico com build123d a partir de descrição ou foto de referência, viewer no navegador (localhost:3123), exporta STL/STEP.
- **Instalação:** copiar para `.claude/skills/`; o `setup.sh` (limpo, vetado) cria venv e instala build123d.
- **Quando usar:** modelar peças imprimíveis com medidas ajustáveis — o caminho certo para impressão 3D (não requer Blender).

### Aprofundamento Blender (instalar quando precisar)

- **arjun988/blender-skills** — https://github.com/arjun988/blender-skills — 94 skills, pipeline completo (modelagem, geometry nodes, lighting, archviz, estilos). `claude plugin marketplace add arjun988/blender-skills` → `claude plugin install blender-skills@blender-skills`. Pesado; instalar só para trabalho Blender a fundo.
- **ra100/blender-claude-plugin** — https://github.com/ra100/blender-claude-plugin — 8 skills de referência da API Python do Blender 5.x. `claude plugin marketplace add ra100/blender-claude-plugin` → `claude plugin install blender-skills@blender-claude-marketplace`. Atenção: o plugin também se chama "blender-skills"; conferir colisão de nomes se instalar junto com o do arjun988.
- **BlenderXAlpha-3DGenSkill** — https://github.com/ig-shadow-walker/BlenderXAlpha-3DGenSkill — texto → modelo 3D no Blender via provedores pagos (Alpha3D/Meshy/Tripo). Opcional.

### Nota sobre softwares CAD

FreeCAD, OpenSCAD, JSCAD e afins são aplicações, não skills. Para modelo imprimível paramétrico via Claude, usar build123d (skill render) — mesmo paradigma código→peça do OpenSCAD, em Python. O Higgsfield (`generate_3d`) gera malha GLB de uma foto: bom para visualização, não sai pronto para imprimir.
