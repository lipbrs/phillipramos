# Rotina diária — como rodar

Duas checagens, todo dia. O resultado vira `rotina/AAAA-MM-DD.md`.

## 0. De qual e-mail sai a abordagem

**`phillip.prs@gmail.com`, o pessoal** — decisão do Phillip em 22/09/2026. **Não perguntar
de novo a cada lote.**

O e-mail da marca é o `publiprova@gmail.com` (decidido 29/08) e continua sendo o destino
certo, mas o conector do Gmail autentica **uma** conta Google e o `send_message` não tem
campo de remetente — alias "Enviar e-mail como" não resolve. Trocar o conector para a
marca custaria a caixa onde caem as respostas dos lotes já enviados. Diante disso, o
Phillip preferiu não mexer nos conectores e seguir pelo pessoal.

**Se um dia valer a pena trocar**, a ordem é esta, e não pode ser invertida:
1. Em `phillip.prs@gmail.com`, criar filtro que encaminhe os domínios já abordados para
   `publiprova@gmail.com` (o Gmail pede um código de confirmação que chega lá).
2. Só então trocar o conector para a conta da marca.

**O que nunca muda:** não reenviar o mesmo texto de outro remetente — e-mail idêntico
vindo de endereço diferente é spam, e queima a agência.

## 1. Respostas de agência

Enquanto as respostas do lote 01, do toque 02 e do lote 02 caem na caixa **pessoal**,
a busca tem de cobrir os 13 domínios. No Gmail:

```
{holofotte.com brunch.ag sigamosaico.com cocreators.com.br agenciamid.com.br incodemkt.com.br fhits.com.br mfield.com.br sharpit.co talismadigital.com.br adragencia.com.br agenciacontatto.com.br souin.com.br agenciadiretiva.com.br brasilinfluencers.com.br netcos.art.br gombo.com.br priory.com.br} -label:sent newer_than:2d
```

O `-label:sent` é o que importa: sem ele a busca devolve os próprios disparos e parece que
há resposta quando não há. `warpmedia.com.br` saiu da lista — o endereço não existe.

Conferir **também** `from:mailer-daemon newer_than:2d`. Endereço publicado no site não
quer dizer endereço que existe: o da Warp Media voltou com 550 dois segundos depois.

Qualquer resposta: registrar na `lista-alvos.csv` (coluna `status`) e avisar o Phillip
**no mesmo dia** — uma conversa marcada é o objetivo da Fase 0, não pode esperar.

## 2. Comentários novos no @publiprova.app

`instagram.com/notifications/`. Interessa **comentário**, especialmente com palavra-chave
(PRINT, RELATÓRIO, EU). Follow e curtida entram no log, mas não são ação.

Follow de volta é manual e limitado a 3–5/dia — conta nova toma bloqueio silencioso.

## 3. O que anotar no log do dia

- Número de respostas e de comentários (mesmo que zero — o zero é o dado).
- Etapas puladas, e por quê. Etapa pulada sem motivo escrito é etapa que não rodou.
- Recomendação, marcada como **não executada** se depende do Phillip.
