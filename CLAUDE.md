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
