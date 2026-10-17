"""Regenera os dados estruturados (schema.org FAQPage) do index.html a partir do FAQ que está na própria página.

Por que existe: o Google lê melhor o JSON-LD quando ele já está no HTML (e não montado por script). O bloco fica entre
os marcadores abaixo, dentro do <head>. Sempre que o texto do FAQ (#faq-lista) mudar, rode:

    python tools/gerar_faq_jsonld.py

O script só troca o que está entre os marcadores; o resto da página não é tocado.
"""
import html
import io
import json
import re
import sys

ARQUIVO = 'index.html'
INICIO = '<!-- FAQ-JSONLD:inicio (gerado por tools/gerar_faq_jsonld.py; não edite à mão) -->'
FIM = '<!-- FAQ-JSONLD:fim -->'


def limpar(texto: str) -> str:
    texto = re.sub(r'<[^>]+>', '', texto)
    return re.sub(r'\s+', ' ', html.unescape(texto)).strip()


def main() -> int:
    bruto = io.open(ARQUIVO, encoding='utf-8', newline='').read()
    nl = '\r\n' if '\r\n' in bruto else '\n'
    t = bruto.replace('\r\n', '\n')

    lista = re.search(r'<div[^>]*id="faq-lista"[^>]*>(.*?)\n      </div>\n    </div>\n  </section>', t, re.S)
    if not lista:
        print('FAQ (#faq-lista) não encontrado', file=sys.stderr)
        return 1
    entidades = []
    for d in re.findall(r'<details\b.*?</details>', lista.group(1), re.S):
        q = re.search(r'<summary\b.*?<span>(.*?)</span>', d, re.S)
        a = re.search(r'<p\b[^>]*>(.*?)</p>', d, re.S)
        if q and a:
            entidades.append({
                '@type': 'Question', 'name': limpar(q.group(1)),
                'acceptedAnswer': {'@type': 'Answer', 'text': limpar(a.group(1))},
            })
    if not entidades:
        print('Nenhuma pergunta encontrada', file=sys.stderr)
        return 1

    dados = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': entidades}
    corpo = json.dumps(dados, ensure_ascii=False, indent=2)
    bloco = f'{INICIO}\n  <script type="application/ld+json">\n{corpo}\n  </script>\n  {FIM}'

    if INICIO in t:
        t = re.sub(re.escape(INICIO) + r'.*?' + re.escape(FIM), lambda _: bloco, t, flags=re.S)
    else:
        # primeira vez: logo depois do bloco JSON-LD que já existe no <head>
        m = re.search(r'</script>\n(?=  <link rel="icon")', t)
        if not m:
            print('Ponto de inserção no <head> não encontrado', file=sys.stderr)
            return 1
        t = t[:m.end()] + '  ' + bloco + '\n' + t[m.end():]

    io.open(ARQUIVO, 'w', encoding='utf-8', newline='').write(t.replace('\n', nl))
    print(f'{len(entidades)} perguntas gravadas em {ARQUIVO}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
