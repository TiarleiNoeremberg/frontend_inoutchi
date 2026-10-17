# CSS do Tailwind (index.html e terms.html)

O site usava o Tailwind pelo CDN de desenvolvimento (`cdn.tailwindcss.com`), que monta o CSS dentro do navegador de cada
visitante (mais lento e fora das boas práticas para produção). Agora o CSS é gerado antes e fica em `css/tailwind.css`.

## Quando regenerar

Sempre que você **adicionar ou trocar classes do Tailwind** em `index.html`, `terms.html` ou `js/simulador.js`
(por exemplo `bg-blue-500`, `md:grid-cols-3`). Mudar só texto ou CSS próprio não exige.

```bash
cd tools/tailwind
npm install        # só na primeira vez (instala o Tailwind 3.4.17 em node_modules, que não é versionado)
npm run build      # grava ../../css/tailwind.css (minificado)
```

Depois, publique `css/tailwind.css` junto com a página. Se uma classe nova "não pega" no site, é porque falta rodar o build.
