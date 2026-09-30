# Domínio próprio — publiprova.com.br (29/09/2026)

> ✅ **NO AR em 29/09**, ~40 min depois da compra.
> `https://publiprova.com.br` e `https://www.publiprova.com.br` respondendo HTTP 200 com
> certificado válido.

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


## Como ficou, para quando precisar repetir

**Na Vercel:** o apex foi mudado de *Redirect to Another Domain* para *Connect to an
environment → Production*. Isso foi o que simplificou tudo — com o apex servindo, o CNAME
do `www` deixou de ser obrigatório, e a gente parou de depender do valor
`f6d62b89fd0e2960.vercel-dns-0XX.com` que a tela do celular cortava.

**No registro.br**, zona editada no modo avançado (DNS → zona DNS):

| Tipo | Nome | Dados |
|---|---|---|
| `A` | `publiprova.com.br` | `216.198.79.1` |
| `CNAME` | `www.publiprova.com.br` | `cname.vercel-dns.com` |

O `cname.vercel-dns.com` é o registro legado, e a própria tela da Vercel avisa que ele
continua funcionando. Usar ele evitou depender do host único por projeto.

### Cinco armadilhas que custaram tempo

1. **O sufixo do CNAME não se descobre por DNS.** Tentei resolver
   `f6d62b89fd0e2960.vercel-dns-0NN.com` para NN de 0 a 39: **doze variantes resolvem**,
   porque as zonas da Vercel são curinga. O método não distingue nada. Só o painel mostra
   o valor certo — ou se usa o legado.
2. **O `@` não é aceito** no registro.br: "Não são aceitos os caracteres @ e *". Nome
   vazio é o apex.
3. **A sessão do registro.br cai rápido.** Caiu enquanto eu estava do lado da Vercel;
   voltou para `login/?session=required` no meio do trabalho.
4. **Entrar no modo avançado tranca o modo básico por ~27 min.** Só entre se for terminar
   ali.
5. **DNS propagado não quer dizer site no ar.** Os dois nomes resolveram antes de o
   certificado existir, e o HTTPS deu `UNEXPECTED_EOF_WHILE_READING` por alguns minutos.
   Não é erro de configuração: é a Vercel emitindo o certificado depois que o DNS aponta.

## Agora dá para

- Trocar a assinatura dos e-mails para `publiprova.com.br` (a atual manda para um link
  quebrado — ver `emails-lote-04.md`).
- Montar `phillip@publiprova.com.br` (Zoho Mail no plano gratuito).
- Dar um endereço fixo ao webhook da Meta, que é o que trava a revisão do app.
