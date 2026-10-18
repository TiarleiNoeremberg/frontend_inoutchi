# Animação "Como funciona" (`/como-funciona.html`)

Estado em 2026-10-18. Animação em código (HTML, SVG, CSS e JS, sem bibliotecas). O visual (mapa aéreo, bonecos 3D, TV, portaria e
leitor facial) foi refeito no Lovable pelo usuário e integrado ao site com correções; a primeira versão, em desenho esquemático,
foi substituída. Tudo é ilustrativo, com nomes fictícios (Ana, Carlos M., Marcos, Laura Souza, "Escola Aurora").

## Arquivos

- `como-funciona.html`: gerada junto com as outras páginas de conteúdo (rodapé, banner de cookies, FAQ e JSON-LD iguais).
- `js/animacao-fluxo.js`: monta a tela e roda as 4 cenas (funções `async` sequenciais: `dirige`, `espera`, `legenda`, `avisa`...).
- `css/animacao-fluxo.css`: estilos com prefixo `ia-`.
- `assets/images/anim/*.webp`: mapa (1280 px), bonecos (560 px de altura) e carro. Total ~350 KB (os originais PNG/JPG tinham 1,6 MB).

## Como editar uma cena

No JS, o array `cenas` tem uma função `run` por cena. A rota do carro é o caminho `ROTA`; a cerca é `CERCA` (centro e raio no sistema de
coordenadas 1600x1008 do mapa); `P_CERCA` e `P_PARA` são calculados pela geometria. O **rastro azul** do carro (`.ia-rastro`) é
intencional (decisão do usuário) e a frase de privacidade da página explica que nada é gravado.

## Correções feitas na integração (2026-10-18)

- Cena do token: a **TV acende quando o portador toca em "Solicitar saída"** (o aluno é chamado na solicitação, Decisão 077), antes da
  leitura do QR na portaria. O aviso final vai para o celular da **mãe (responsável)**, não do portador do token.
- Cena 4: legenda atualizada para a Decisão 087 (todos os responsáveis são avisados também na saída automática).
- Só anda quando está na tela (`IntersectionObserver`); com `prefers-reduced-motion` começa pausada e sem animações contínuas.
- Atrasos de legenda cancelados ao trocar de cena; legenda com `aria-live`; imagens em WebP com carregamento preguiçoso.

## Regras do produto que a animação respeita (conferidas no código)

- Mapa e carro são ilustração: o app mede a distância no aparelho e envia só "dentro"/"fora"; nada é gravado.
- Token (Decisões 077 e 086): o portador solicita (o aluno é chamado); a **portaria lê o QR code** (ou o código) e confirma; sem
  conferência de documento. Push a **todos** os responsáveis, nunca ao portador.
- Leitor facial: o leitor externo de responsáveis só **solicita**; a catraca com leitor interno **confirma** (push a todos).
- Saída automática (Decisão 058): 3 minutos fora da cerca; quem pediu recebe `SAIDA_AUTOMATICA` e os outros `SAIDA_CONFIRMADA`
  (Decisão 087). A contagem dos 3 minutos fica só no celular de quem pediu.

## Observação sobre testes

O painel do navegador do Claude pausa `requestAnimationFrame` e não dispara `IntersectionObserver`; para testar, trocar o
`requestAnimationFrame` por `setTimeout` e clicar em uma aba (o clique tira a animação do estado "fora da tela").
