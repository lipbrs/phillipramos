# Narrações para gerar no ElevenLabs — voz oficial do @publiprova.app

> As vozes do Higgsfield que testamos são de Portugal (Andre) ou lentas demais (Marcus).
> Phillip gera direto no ElevenLabs para fixarmos **uma voz só**, usada em tudo daqui pra frente.

## Configuração sugerida
- **Modelo:** Eleven Multilingual v2 (ou v3, se disponível). Idioma: **Português (Brasil)**.
- **Voz:** qualquer uma que soe brasileira e tenha ritmo de conversa, não de locução.
  Preferência: masculina, 30–45 anos, tom direto e sem afetação — é a voz de quem
  está construindo o produto, não de um narrador de propaganda.
- **Speed / velocidade:** 1,05 a 1,10 (o Marcus a 1,0 ficou arrastado).
- **Stability:** ~45%. **Similarity:** ~75%. **Style:** baixo (0–15%).
- **Formato:** MP3, 128 kbps ou melhor.

## ✅ VOZ OFICIAL DA CONTA (definida em 07/09/2026)
- Nome da voz: **Yuri**
- Voice ID (ElevenLabs): `3Je7qW9yPOhc47iG41pH`
- **O Higgsfield NÃO aceita esse id** (`text2speech_v2` devolve "Voice not found" — o
  catálogo dele usa UUIDs próprios). Toda narração daqui pra frente é gerada pelo Phillip
  na conta do ElevenLabs e salva nesta pasta; o Claude só monta.
- Já geradas: `voz-r5-metodo48.mp3` (88,45 s) e `voz-r2-creator.mp3` (29,75 s).

## Onde salvar
Nesta mesma pasta: `phillipramos/publiprova/validacao/artes/video/`
- Arquivo 1 → `voz-r5-metodo48.mp3`
- Arquivo 2 → `voz-r2-creator.mp3`

---

## TEXTO 1 — Reel "Método 48 Horas" (~95 s) → `voz-r5-metodo48.mp3`

Se eu tivesse que fechar amanhã uma campanha com trinta creators, eu não pediria print no WhatsApp. Não abriria planilha. E não montaria o relatório do cliente de madrugada.

Eu faria o Método Quarenta e Oito Horas. São cinco peças.

Primeira: prazo no briefing. Se a data da comprovação não está escrita ao lado da data do post, ela não existe. Quarenta e oito horas depois de publicar. Sempre.

Segunda: um link só por creator. Sem cadastro, sem senha, sem entrar em sistema nenhum. Ele abre no celular, cola o link do post, sobe o print dos insights. Noventa segundos.

Terceira: a régua. Cobrança não é uma mensagem, são cinco, e elas têm hora marcada. Dois dias antes, no dia, um dia depois, três dias depois, sete dias depois. Lembrete, motivo, consequência. E nunca é você quem manda.

Quarta: o relatório se monta enquanto a campanha acontece. Cada entrega que chega vira uma linha verde no painel. No fim, o documento do cliente já está pronto, com a marca da agência.

Quinta: a métrica que importa não é view. É percentual entregue em quarenta e oito horas. Abaixo de setenta por cento, o problema é o combinado, não o creator.

É isso que estamos construindo no PubliProva, em público, ouvindo quinze agências antes de abrir. Comenta RELATÓRIO que eu te mando o mapa inteiro.

---

## TEXTO 2 — Reel 2 "O creator entrega em 90 segundos" (~33 s) → `voz-r2-creator.mp3`

> Este Reel **já está agendado para amanhã, 08/09, 11h**, com a voz portuguesa. Se este
> arquivo chegar antes disso, eu remonto e troco o vídeo agendado; se não, eu adio o Reel 2
> para não queimar o material com a voz errada.

Sabe por que o print não chega? Porque pedir pra alguém entrar num sistema, criar senha e achar o menu certo é pedir demais.

Aqui é assim: o creator recebe um link no WhatsApp. Abre no celular. Cola o link do post. Sobe o print dos insights. A IA lê os números — ele só confere e envia. Noventa segundos.

Do lado da agência, o painel muda de amarelo pra verde e a cobrança para na hora.

Se você é agência, comenta PRINT.

---

## Observações de pronúncia
- **creators** deve sair "crieitors" (à inglesa). Se a voz tropeçar, escrever `crieitors`
  só no campo do ElevenLabs — o texto do roteiro fica como está.
- **PubliProva** = "públi-prova". Se sair errado, escrever `Públi Prova` separado.
- Os números já estão escritos por extenso de propósito: TTS lê "48" como "quarenta e oito"
  em uns modelos e "quatro oito" em outros.
- **RELATÓRIO** e **PRINT** no fim são a palavra-chave do comentário: precisam sair
  destacadas, com uma pausa antes.
