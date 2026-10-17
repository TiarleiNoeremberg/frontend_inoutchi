# SEO e os três domínios do Inoutchi

Estado em 2026-10-17. Este documento não tem segredos (o repositório é público).

## Papel de cada endereço

| Endereço | Papel | Observação |
|---|---|---|
| `www.inoutchi.com` | Site institucional (e o login usado pelo app Android antigo: `www.../login.html`) | É o endereço que o Google deve conhecer. `canonical`, sitemap e Open Graph apontam para ele. |
| `app.inoutchi.com` | O sistema aberto no celular/navegador (login e painéis) | Serve os **mesmos arquivos** do `www`. Não deve ser indexado nem mostrar a página de vendas. |
| `api.inoutchi.com` | Só o backend (API e WebSocket) | Todas as páginas chamam este endereço por `config.js` (`CONFIG.API_URL`). |
| `inoutchi.com` | — | Já redireciona (301) para `www.inoutchi.com`. |

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

## O que falta e depende do seu Cloudflare (`app.inoutchi.com`)

Como os três endereços já passam pelo Cloudflare, dá para resolver sem mexer em código. No painel do Cloudflare, domínio
`inoutchi.com`:

### Regra 1: a raiz do `app` abre direto no login (Rules > Redirect Rules > Create rule)

- **Nome:** `app raiz para login`
- **Quando:** campo **Hostname** igual a `app.inoutchi.com` **E** **URI Path** igual a `/`
- **Então:** Dynamic (ou Static) para `https://app.inoutchi.com/login.html`, código **302**
- Expressão equivalente: `(http.host eq "app.inoutchi.com" and http.request.uri.path eq "/")`

### Regra 2: páginas de venda e institucionais no `app` vão para o `www` (Redirect Rules)

- **Nome:** `app paginas institucionais para www`
- **Quando (editar expressão):**
  `(http.host eq "app.inoutchi.com" and http.request.uri.path in {"/index.html" "/saiba-mais.html" "/terms.html" "/politica-privacidade.html" "/simulador.html"})`
- **Então:** Dynamic: `concat("https://www.inoutchi.com", http.request.uri.path)`, código **301**

### Regra 3: o `app` fica fora do Google (Rules > Transform Rules > Modify Response Header)

- **Nome:** `app noindex`
- **Quando:** `(http.host eq "app.inoutchi.com")`
- **Então:** Set static: cabeçalho `X-Robots-Tag` = `noindex, nofollow`

### Como conferir (no terminal)

```bash
curl -sI https://app.inoutchi.com/                  # 302 para /login.html
curl -sI https://app.inoutchi.com/index.html        # 301 para https://www.inoutchi.com/index.html
curl -sI https://app.inoutchi.com/login.html | grep -i x-robots-tag   # noindex, nofollow
curl -sI https://www.inoutchi.com/login.html        # 200 (o app Android antigo depende deste)
```

**Não** crie regra que redirecione `www.inoutchi.com/login.html`: o app Android antigo (WebView) abre esse endereço.

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
