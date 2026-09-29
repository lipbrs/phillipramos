# Domínio próprio — publiprova.com.br (29/09/2026)

**Registrado e pago.** registro.br, usuário `PHRBA31`, **R$ 184,00 por 5 anos**
(29/09/2026 → 2031). Confirmação de cadastro às 20:49 e de pagamento às 20:53.
*"Seu domínio entrará em operação na próxima publicação DNS"* — o registro existe, a
publicação no DNS leva algumas horas.

Escolhido `.com.br` em vez de `.com` por decisão do Phillip: R$ 40/ano contra ~R$ 61, e
**pesa mais com agência brasileira**, que é o ICP. O CPF, que era a minha objeção, não era
problema.

## O que ele resolve (as três pendências que voltavam toda semana)

1. **Assinatura de e-mail** — hoje sai `publiprova.app`, que o Gmail vira link para um
   domínio inexistente. Ver `emails-lote-04.md`.
2. **E-mail da marca** — `phillip@publiprova.com.br` sem depender de conector do Gmail.
   Zoho Mail no plano gratuito cobre uma caixa.
3. **Endereço fixo do webhook da Meta** — hoje é um túnel `trycloudflare` que muda a cada
   reinício, o que impede a revisão do app.

## Próximo passo, e por que ele não é meu

Os registros de DNS da Vercel **são por projeto**: a doc diz que o A do apex pode não ser
o `76.76.21.21` genérico ("or your domain card's value") e que o CNAME do `www` é único
por projeto (`d1d4fc829fe7bc7c.vercel-dns-017.com` é o exemplo deles). Então não existe
valor certo para eu escrever aqui — só o painel do projeto mostra o par correto.

Tentei pela API: `add_project_domain` do conector da Vercel recusa o corpo da requisição
(erro de formato da ferramenta, não de permissão), e o navegador desta máquina não está
logado na Vercel.

**Duas rotas, e a segunda é melhor a médio prazo:**

- **A — DNS no registro.br.** No painel da Vercel, Settings → Domains → Add Domain →
  `publiprova.com.br`. A Vercel mostra o registro **A** do apex e o **CNAME** do `www`.
  Cola os dois no registro.br. Cada mudança futura de DNS é manual.
- **B — nameservers da Vercel.** Aponta o registro.br para os nameservers que a Vercel
  informar. Aí **toda** a zona passa a ser gerenciada na Vercel — e eu consigo mexer via
  API, inclusive os MX e o SPF/DKIM do e-mail, sem você abrir painel de novo.

⚠️ **Aviso da própria doc:** ao trocar nameservers, os registros de e-mail (MX) têm de ser
recriados do lado novo antes, ou o e-mail para de chegar. Como ainda não existe caixa em
`publiprova.com.br`, **agora é o momento sem risco de fazer a rota B** — não há e-mail
para quebrar.
