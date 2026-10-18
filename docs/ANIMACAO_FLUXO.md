# Animação "Como funciona" (`/como-funciona.html`)

Estado em 2026-10-18. Animação em código (HTML, SVG, CSS e JS, sem bibliotecas): mapa visto de cima com a cerca virtual, celular do
responsável e telas da escola (TV da sala, portaria, saguão). Tudo ilustrativo, com nomes fictícios.

## Arquivos

- `como-funciona.html`: gerada junto com as outras páginas de conteúdo (rodapé, banner de cookies, FAQ e JSON-LD iguais).
- `js/animacao-fluxo.js`: o motor e as quatro cenas. Cada cena é uma função pura do tempo (`quadro(t)`), então pausar, voltar e pular
  cena funcionam sem estado escondido. `raiz.irPara(cena, ms)` é um gancho interno usado nos testes.
- `css/animacao-fluxo.css`: estilos com prefixo `anim-`, `tel-` e `tv-`; layout por container query (uma coluna abaixo de 600 px).

## Como editar uma cena

No começo de cada cena (`C1` a `C4`) ficam os marcos de tempo em milissegundos (`T_...`) e a lista `leg` com a legenda de cada
passo. A posição do carro vem de `Caminho.em(fração)`; a entrada na cerca é calculada pela geometria (`fracaoNoAnel`), então mudar o
raio ou a estrada ajusta o instante em que "dentro da cerca" aparece.

## Regras do produto que a animação respeita (conferidas no código em 2026-10-18)

- Mapa e carro são ilustração: o app mede a distância no aparelho e envia só "dentro"/"fora"; nada é gravado. O selo da animação diz isso.
- Token (Decisão 077 e 086): o portador só solicita; a **portaria lê o QR code** (ou o código de 6 dígitos) e confirma; não há conferência
  de documento. Push `SAIDA_CONFIRMADA` vai a **todos** os responsáveis do aluno (`PresencaService`, `notificarTutoresDoAluno`).
- Leitor facial: o leitor externo de responsáveis só **solicita** a saída; a catraca com leitor interno **confirma**
  (`HikvisionRecognitionProcessor.notificarSaida`: push a todos os responsáveis, sala e saguão).
- **Atualização 2026-10-18 (Decisão 087):** agora todo evento do aluno chega a todos os responsáveis, inclusive a confirmação manual
  no app e a saída automática de 3 minutos (quem pediu recebe `SAIDA_AUTOMATICA`, o outro `SAIDA_CONFIRMADA`). A cena 4 pode
  passar a mostrar também esses casos, se o usuário quiser.
