# Padronizar a URL do backend (o que falta)

Estado em 2026-09-30. O domínio oficial é `https://api.inoutchi.com`.

| Página | URL | Observação |
|---|---|---|
| `config.js`, `auth.js`, `notification-api.js`, `login.html`, `dashboard-saguao.html`, `dashboard-tutor.html` | `api.inoutchi.com` | Já em produção, inclusive WebSocket (`/ws-mensagens`, `/ws-sala` no saguão) e FCM |
| `dashboard-token.html`, `dashboard-transporte.html`, `index.html`, `reset-password.html` | `api.inoutchi.com` | Migradas em 2026-09-30 (só HTTP). Testadas em navegador com o backend real (troca de host, mesmo comportamento) |
| **`dashboard-diretor.html`, `dashboard-escola.html`, `dashboard-sala.html`** | `inoutchi-backend.onrender.com` | **Pendentes.** Usam o WebSocket `/ws-sala`. `dashboard-sala.html` tem 3 ocorrências (inclusive `WS_URL`) |

## Por que as três ficaram de fora

O tráfego de WebSocket depende do proxy que está na frente do domínio. A prova de que `/ws-sala` funciona por `api.inoutchi.com` vem só da página do saguão. A tela da sala é a que mostra a retirada do aluno: não vale arriscar sem uma prova direta. Este ambiente não alcança os hosts de produção, então o teste abaixo precisa ser feito por uma pessoa.

## Teste (qualquer computador, 1 minuto)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api.inoutchi.com/ws-sala/info
curl -s -o /dev/null -w "%{http_code}\n" https://inoutchi-backend.onrender.com/ws-sala/info
curl -s https://api.inoutchi.com/ws-sala/info | head -c 300; echo
```

**Esperado:** os dois respondem `200` (ou o mesmo código, se o endpoint exigir algo) e o corpo de `/info` (JSON com `websocket: true`) é idêntico. Compare também a preflight de CORS com a origem do site:

```bash
curl -s -i -X OPTIONS https://api.inoutchi.com/ws-sala/info -H "Origin: https://www.inoutchi.com" -H "Access-Control-Request-Method: GET" | head -12
```

Se os dois forem iguais, troque **só a constante de URL** em cada uma das três páginas (em `dashboard-sala.html` são 3 ocorrências) e abra a tela da sala em produção: o painel deve conectar e mostrar o aluno quando um tutor solicitar a saída. Se algo divergir (proxy com limite de conexões, cabeçalho de upgrade bloqueado), deixe como está e me avise.

**Reversão:** voltar a constante para o endereço do Render.
