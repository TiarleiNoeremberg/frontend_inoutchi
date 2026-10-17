# Padronizar a URL do backend

Estado em 2026-10-17: **concluído**. O domínio oficial é `https://api.inoutchi.com` e todas as páginas o usam por
`config.js` (`CONFIG.API_URL`) ou por constante própria já apontada para ele. Nenhuma página usa mais
`inoutchi-backend.onrender.com`.

| Página | Como usa |
|---|---|
| `config.js`, `auth.js`, `notification-api.js`, `login.html`, `dashboard-saguao.html`, `dashboard-tutor.html`, `dashboard-token.html`, `dashboard-transporte.html`, `index.html`, `reset-password.html` | `api.inoutchi.com` (desde 2026-09-30) |
| `dashboard-diretor.html`, `dashboard-escola.html`, `dashboard-sala.html` | `CONFIG.API_URL` (migradas em 2026-10-17; a sala também usa `CONFIG.API_URL + '/ws-sala'` no WebSocket) |

## Por que essas três ficaram para depois

O tráfego de WebSocket depende do proxy na frente do domínio, e a prova de que `/ws-sala` funcionava por
`api.inoutchi.com` vinha só do painel do saguão. A tela da sala mostra a retirada do aluno, então a troca só foi feita
depois de uma prova direta.

## Prova (2026-10-17)

- `GET /ws-sala/info`, `/ws-mensagens/info` e `/api/public/app/bootstrap`: `200` nos dois endereços, corpo de `/info`
  igual (exceto o campo aleatório `entropy`).
- Pré-voo de CORS com a origem `https://www.inoutchi.com`: cabeçalhos idênticos nos dois.
- **WebSocket de verdade** (upgrade em `wss://api.inoutchi.com/ws-sala/websocket` e um `CONNECT` STOMP): a conexão abre e
  o servidor responde `CONNECTED` (versão 1.2), igual ao endereço do Render.

## Teste para repetir (qualquer computador com Node 22 ou superior)

```js
const ws = new WebSocket('wss://api.inoutchi.com/ws-sala/websocket');
ws.onopen = () => ws.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\u0000');
ws.onmessage = e => { console.log(e.data); ws.close(); };   // esperado: CONNECTED
```

**Reversão** (se a sala deixar de conectar): em `dashboard-sala.html`, trocar `CONFIG.API_URL` pelo endereço do Render nas três
linhas de `BACKEND_URL` e `WS_URL`; o mesmo em `dashboard-diretor.html` e `dashboard-escola.html` (uma linha cada).
