# SEO e os três domínios do Inoutchi

Estado em 2026-10-17. Este documento não tem segredos (o repositório é público).

## Papel de cada endereço

| Endereço | Papel | Observação |
|---|---|---|
| `www.inoutchi.com` | Site institucional (e o login usado pelo app Android antigo: `www.../login.html`) | É o endereço que o Google deve conhecer. `canonical`, sitemap e Open Graph apontam para ele. |
| `app.inoutchi.com` | O sistema aberto no celular/navegador (login e painéis) | Serve os **mesmos arquivos** do `www`; um script nas páginas de venda o leva ao login ou ao `www` (seção abaixo). |
| `api.inoutchi.com` | Só o backend (API e WebSocket) | Todas as páginas chamam este endereço por `config.js` (`CONFIG.API_URL`). |
| `inoutchi.com` | — | Já redireciona (301) para `www.inoutchi.com`. DNS na Hostinger. |

## O que já está no código (feito em 2026-10-17)

- `robots.txt` (libera o site, barra `/docs/`, `CLAUDE.md` e `send_email.php`) e `sitemap.xml` (4 páginas).
- `noindex, nofollow` em `login.html`, `reset-password.html`, `admin/app-configuration.html` e todos os `dashboard-*.html`.
  Essas páginas **não** são barradas no `robots.txt` de propósito: o Google precisa rastreá-las para enxergar o `noindex`.
- Título, descrição, `canonical` e Open Graph próprios em `saiba-mais.html` e `terms.html`; `canonical` em política e exclusão de conta.
- Imagens do `index.html` em WebP (7,5 MB para 0,9 MB), com `width`/`height` e `loading="lazy"`.
- FAQ em dados estruturados (JSON-LD) direto no `<head>` (`tools/gerar_faq_jsonld.py` regenera).
- Tailwind pré-gerado (`css/tailwind.css`, 35 KB) no lugar do CDN de desenvolvimento (`tools/tailwind`).
- Painéis (diretor, sala, escola) chamam o backend por `api.inoutchi.com`; o WebSocket `/ws-sala` foi provado por este endereço
  (`docs/PADRONIZAR_URL_BACKEND.md`).

## Como o `app.inoutchi.com` foi tratado (sem Cloudflare)

**Correção (2026-10-17):** a versão anterior deste documento mandava criar regras no Cloudflare. Isso não é possível: o
`Server: cloudflare` que aparece nos cabeçalhos é o Cloudflare **do Render** (ele serve os domínios por trás), não uma conta do
dono. O DNS do `inoutchi.com` está na **Hostinger** (`ns1/ns2.dns-parking.com`; `www` e `app` apontam para o domínio raiz e
`api` aponta direto para `inoutchi-backend.onrender.com`). A conta do Cloudflare do dono não tem domínio nenhum.

Como o `app` e o `www` servem os mesmos arquivos e o Render não separa regras por endereço, a solução ficou **dentro das
páginas**: um pequeno script no `<head>` de `index.html`, `saiba-mais.html`, `terms.html` e `politica-privacidade.html` que só age
quando o endereço é `app.inoutchi.com`:

- `app.inoutchi.com/` e `/index.html` vão para `/login.html` (mantém a query string);
- as páginas institucionais vão para `https://www.inoutchi.com/<mesma página>` (mantém query e âncora);
- no `www`, no `localhost` e em qualquer outro endereço **não faz nada**.

Login e painéis já têm `noindex` em qualquer endereço, então o `app` fica fora do Google. O `canonical` das páginas públicas aponta
para o `www`.

Limite honesto: é um redirecionamento por JavaScript, não um HTTP 301 de verdade (o Google segue, mas consolida um pouco menos
que um 301). Com o `canonical` no `www` e o `noindex` nas páginas de acesso, isso é suficiente.

**Alternativa mais limpa, se um dia valer o trabalho:** criar no Render um **segundo Static Site** (mesmo repositório) só para o
`app.inoutchi.com`, com as regras de redirecionamento e o cabeçalho `X-Robots-Tag: noindex` do próprio Render (Redirects/Rewrites e
Headers), e apontar o CNAME `app` na Hostinger para o novo serviço. Exige tirar o domínio `app` do serviço atual antes.

### Como conferir

```bash
# no navegador (o redirecionamento é por JavaScript, o curl não enxerga):
#   abrir https://app.inoutchi.com/                  -> termina em /login.html
#   abrir https://app.inoutchi.com/saiba-mais.html   -> termina em https://www.inoutchi.com/saiba-mais.html
curl -sI https://www.inoutchi.com/login.html         # 200 (o app Android antigo depende deste)
```

**Não** altere o `www.inoutchi.com/login.html`: o app Android antigo (WebView) abre esse endereço.

## O que fazer fora do código

1. **Google Search Console:** adicionar a propriedade de **domínio** `inoutchi.com` (verificação por registro TXT no DNS do
   Cloudflare), enviar `https://www.inoutchi.com/sitemap.xml` e usar "Inspeção de URL" na página inicial para pedir a
   indexação. É a única forma de saber se o Google conhece o site.
2. **Perfil da Empresa no Google** (Florianópolis, SC): endereço de atendimento, categoria "Empresa de software" e o site.
3. **Google Analytics:** hoje só mede quem aceita os cookies; acompanhe também o Search Console (não depende de cookies).
4. **PageSpeed Insights** (pagespeed.web.dev) no celular, depois do deploy, para ter as notas oficiais.

## Quando mexer de novo

- Mudou o texto do FAQ: `python tools/gerar_faq_jsonld.py`.
- Adicionou classes do Tailwind em `index.html`, `terms.html` ou `js/simulador.js`: `cd tools/tailwind && npm run build`.
- Criou uma página pública nova: inclua no `sitemap.xml` e dê `<title>`, descrição e `canonical` próprios.
- Criou uma página privada nova (painel): coloque `<meta name="robots" content="noindex, nofollow">`.
