# CLAUDE.md — Frontend da Inoutchi

Guia para quem (pessoa ou IA) for alterar este repositório. Leia inteiro antes de editar: há armadilhas que não são visíveis no código.

Este repositório é **público** (servido pelo GitHub Pages). Não escreva aqui segredos, senhas, chaves nem dados de pessoas.

---

## 1. O que é este repositório

O frontend web da Inoutchi (sistema de segurança escolar): páginas HTML/JS/CSS **estáticas**, uma por perfil de usuário, **sem framework e sem etapa de build**. As páginas também rodam dentro do aplicativo Android (WebView).

Regra que nunca muda: **o backend é a autoridade**. O frontend mostra estado e coleta a intenção do usuário; quem decide (está dentro da cerca? a operação é permitida agora? o aluno pode sair?) é sempre o backend. WebSocket só sincroniza a tela; o estado verdadeiro está no banco do backend.

Documentação do domínio e das decisões fica no **repositório do backend**, pasta `.claude/`:

| Assunto | Onde |
|---|---|
| Por que o sistema é assim | `.claude/context/DECISIONS.md` (localização/LGPD: Decisões 036 a 041) |
| Regras de negócio | `.claude/context/DOMAIN_RULES.md` (ex.: "Exceção do Diretor") |
| Fluxos reais | `.claude/context/KNOWN_FLOWS.md` (seção "Localização do Usuário nas Operações") |
| Erros que não devem se repetir | `.claude/context/KNOWN_MISTAKES.md` |

---

## 2. Repositórios e deploy

| Peça | Repositório | Hospedagem (como está configurado hoje) |
|---|---|---|
| Backend (Java/Spring Boot, PostgreSQL) | `TiarleiNoeremberg/school` | Render |
| **Frontend (este)** | `TiarleiNoeremberg/frontend_inoutchi` | GitHub Pages |
| App Android (Kotlin, WebView) | `TiarleiNoeremberg/Inoutchi_Kotlin` | (distribuição não documentada aqui) |

- O app Android abre `https://www.inoutchi.com/login.html` num WebView e expõe pontes nativas (biometria e FCM). **Não tem lógica própria de geofence**: a localização vem de `navigator.geolocation` dentro do WebView.
- **Cada push na branch de trabalho vai para produção.** No momento, backend e frontend usam a mesma branch (`claude/cloud-credit-verification-ge70tc`) como produção. Trate qualquer push como deploy.
- **Ordem de deploy:** se uma mudança do frontend depende de uma mudança do backend, publique o **backend primeiro** e espere o Render terminar. Melhor ainda: desenhe a mudança para **não depender da ordem** (veja "Compatibilidade", seção 6).
- O backend é acessado por **duas URLs** no código: `https://api.inoutchi.com` (`config.js`, `auth.js`, `login.html`) e `https://inoutchi-backend.onrender.com` (tutor, diretor, transporte, token). **Verificado em 2026-09-30: são o mesmo backend** (as duas respondem com o mesmo corpo de erro do nosso backend, e o login feito num host é aceito no outro em produção). Padronizar numa só é opcional e deve ser uma decisão à parte (a URL do Render muda se o serviço for recriado; o domínio próprio não), conferindo antes se o domínio próprio não tem proxy ou limites diferentes.
- **Documentação da API (Swagger/OpenAPI) do backend:** `/api-docs` (JSON) e `/swagger-ui.html`. Atenção: `/v3/api-docs` **não existe** neste backend e responde `500 ERRO_INTERNO` (o tratador genérico de erros do backend converte "rota inexistente" em 500; não indica defeito). Não use essa resposta como teste de saúde.

---

## 3. Mapa das páginas

O login (`login.html`) redireciona por perfil (`ROLE_*`):

| Arquivo | Perfil / uso | Fim de linha | Observações |
|---|---|---|---|
| `dashboard-tutor.html` | `ROLE_TUTOR` (pais/responsáveis) | **LF** | Maior arquivo (~400 KB). Geofence, entrada, solicitação de saída, geração de tokens, push. |
| `dashboard-diretor.html` | `ROLE_DIRETOR` | **CRLF** | Diretor é **livre da geofence**: não coleta nem envia localização. Tem código morto (seção 8). |
| `dashboard-escola.html` | `ROLE_ESCOLA` | **CRLF** | Administração da escola (config de voz, transportadores etc.). Inclui a aba **"Gestão de Geolocalização (Geofence)"**: mapa, formulário e lista das cercas (`/api/geofences`, que o backend só permite ao `ROLE_ESCOLA`). É esta a tela de cercas em produção. |
| `dashboard-sala.html` | `ROLE_SALA` (TV da sala) | **CRLF** | Recebe eventos por WebSocket e toca o som/voz. |
| `dashboard-saguao.html` | `ROLE_SAGUAO` (painel do saguão) | **LF** | Lista de chamadas pendentes da escola. |
| `dashboard-transporte.html` | `ROLE_TRANSPORTE` | **CRLF** | Entrada/saída em lote; sujeito à geofence. |
| `dashboard-professor.html` | `ROLE_PROFESSOR` | **CRLF** | — |
| `dashboard-token.html` | **Público** (portador de token, sem login) | **LF** | Lê `?token=` da URL; sujeito à geofence. |
| `login.html`, `reset-password.html`, `delete-account.html`, `index.html`, `saiba-mais.html`, `terms.html`, `politica-privacidade.html` | Públicas | mistos | — |
| `admin/app-configuration.html` + `js/`, `css/` | Configuração do app (admin) | LF | — |
| `auth.js`, `config.js`, `biometric.js`, `notification-api.js`, `sw.js` | Scripts compartilhados | `auth.js`/`config.js`: CRLF; os demais: LF | `auth.js`: só o tutor. `config.js`: tutor e professor. `biometric.js`: só o login. `notification-api.js` (registra o `sw.js`): só o tutor. As demais páginas não os usam. |
| `send_email.php` | Formulário de contato | CRLF | PHP não executa no GitHub Pages; provavelmente resto de outra hospedagem. |

Confira o fim de linha de qualquer arquivo antes de editar (seção 5) — a tabela pode ficar desatualizada.

---

## 4. Autenticação e armazenamento

- Login via backend; o token de acesso (JWT) vai no header `Authorization: Bearer ...`.
- **Dois padrões de login coexistem** (`login.html`, função `saveAuthData`): "moderno" — **apenas `ROLE_TUTOR`** (`localStorage` se marcar "lembrar", senão `sessionStorage`, com `auth.js` renovando o token) — e "legado" — **todos os demais perfis** (`localStorage`, com `token_expiry` de 24 h que os dashboards legados exigem). Chaves usadas: `access_token`, `refresh_token`, `token_expiry`, `user_role`, `user_data`, `escolaId`.
- Cada página tem **seu próprio** `fetchWithAuth`, e eles **se comportam de forma diferente**:
  - tutor: devolve a `Response` (o chamador confere `response.ok`; pode devolver `null` se deslogou);
  - transporte: **lança erro** quando a resposta não é ok;
  - diretor e professor: implementação própria;
  - token: página pública, usa `fetch` direto (sem login).
  Nunca copie um trecho de uma página para outra sem conferir isso.
- O `escolaId` do usuário vem de `user_data`/`escolaId` no armazenamento local. **Não use valor padrão inventado** (ex.: "escola 1"): sem escola, não decida nada.

---

## 5. Como editar com segurança

Os arquivos são grandes (até ~400 KB) e o repositório **não tem build nem testes automatizados**. Isso pede disciplina:

1. **Edição pontual, âncora única.** Substitua trechos pequenos e únicos. Nunca reescreva o arquivo inteiro.
2. **Preserve o fim de linha do arquivo.** Vários arquivos são CRLF e outros LF. Uma ferramenta que converte tudo para LF faz o `git diff` mostrar o arquivo inteiro alterado (aconteceu: 16 mil linhas). Depois de editar, rode `git diff --stat`: o número de linhas alteradas tem de ser proporcional ao que você mudou. Ao editar em script, leia em bytes, edite e regrave com o mesmo fim de linha.
3. **Valide a sintaxe do script embutido.** Como não há build, um erro de sintaxe derruba a página inteira para todos. Extraia o `<script>` inline e rode `node --check`:

   ```python
   import re
   s = open('dashboard-tutor.html', encoding='utf-8', newline='').read()
   scripts = re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', s, re.S)
   open('/tmp/pagina.js', 'w', newline='').write(max(scripts, key=len))
   # depois:  node --check /tmp/pagina.js
   ```

4. **Teste a lógica em Node** quando mexer numa função pura (ex.: os helpers de localização): extraia a função e execute com `fetch`/`fetchWithAuth` simulados. Foi assim que os helpers de cerca+distância foram validados (cerca mais interna, arredondamento, fallback em cada falha).
5. **Console:** não escreva coordenadas, tokens nem dados pessoais em `console.log`.
6. **Antes do push:** o push é deploy (seção 2). Rode o passo 3 e olhe o diff.

---

## 6. Compatibilidade e cache

Usuários com página antiga em cache (navegador, PWA, WebView) e backend novo, ou o inverso, **vão existir**. Por isso:

- **Contrato aditivo:** campos novos são opcionais; o backend continua aceitando o formato antigo. Foi o desenho de todas as mudanças de localização (Decisões 038 a 041).
- **Fallback nunca bloqueia:** quando um recurso novo falha (ex.: não conseguiu buscar as cercas), a página volta ao comportamento anterior em vez de impedir a retirada de uma criança.
- **Service Worker (`sw.js`) — corrigido em 2026-09-30.** Antes ele era **cache-first** com nome de cache fixo (`inoutchi-cache-v1`) e pré-armazenava `/`, `/login.html`, `/dashboard-tutor.html`, `/auth.js` e `/config.js`. Reproduzido no Chromium com o arquivo real: em quem tinha esse SW instalado, essas páginas **nunca mais eram atualizadas** após um deploy, enquanto páginas fora da lista (ex.: `dashboard-diretor.html`) atualizavam normalmente. Agora a estratégia é **rede primeiro** (o cache só serve de reserva offline, mantida com a última versão publicada), com `skipWaiting`/`clients.claim`; os handlers de push e de clique na notificação não foram alterados. Quem tinha o SW antigo recebe o novo sozinho: a primeira visita após o deploy ainda mostra a página antiga uma vez, e a seguinte já vem atualizada. Ao publicar algo que precise invalidar caches antigos, aumente o número em `CACHE_NAME`.
  - **Situação real:** nenhuma página chama `NotificationAPI.setup()`, que é o que registra o SW (`notification-api.js`), e nenhum commit do histórico chamou. Pelo código atual o SW provavelmente **não é registrado** em ninguém; só existiria em navegadores que o registraram antes. Nunca foi verificado em produção. A correção protege esses casos e o dia em que alguém ligar o `setup()`.
  - `dashboard-tutor.html` inclui `sw.js` também como `<script src="sw.js">` comum (sem efeito prático). Por isso `sw.js` não pode declarar novos identificadores globais além de `CACHE_NAME` e `urlsToCache`, nem lançar erro fora dos handlers.
---

## 7. Localização (LGPD) — protocolo atual

Regra: a **posição exata não deve sair do aparelho** quando isso não for necessário, e nunca é gravada. O backend decide; o app só informa a **distância até uma cerca que o próprio backend indicou**.

| Página | Como informa a localização | Helper |
|---|---|---|
| Tutor (entrada, solicitar saída) | `GET /api/geofences/aluno/{alunoId}/cercas?tipo=ENTRADA\|SAIDA` → mede → envia `geofenceId` + `distanciaMetros` | `montarLocalizacaoParaBackend(alunoId, tipo, lat, lng)` |
| Tutor (monitoramento em segundo plano) | `POST /api/geofences/monitoramento/posicao` só com dentro/fora + distância | `GeofenceMonitorPro.notifyBackendPosition(isInside, distance)` |
| Transportador (lote) | `GET /api/transporte/cercas?tipo=...` → `geofenceId` + `distanciaMetros` | `montarLocalizacaoParaBackend(tipo, lat, lng)` |
| Portador de token | `POST /api/tokens/cercas` com o **token no corpo** → `geofenceId` + `distanciaMetros` em `executar-operacao` | `montarLocalizacaoParaBackend(token, lat, lng)` |
| **Diretor** | **Não envia nada.** Diretor é livre da geofence (regra de domínio). | — |
| Confirmação de saída (qualquer perfil) | Não envia localização. | — |

Regras dos helpers (mantenha ao criar um novo):

1. Escolhe a cerca em que o usuário está "mais dentro" (menor `distância − raio`).
2. **Arredonda a distância para cima** (`Math.ceil`): nunca transformar "fora" em "dentro".
3. Se as cercas não puderem ser obtidas (rede, 401/403/404, lista vazia, dados inválidos), devolve `{ latitude, longitude }` — o servidor então valida como sempre. Nunca lançar erro por isso.
4. Sem `escolaId` ou sem as coordenadas reais da escola, **não decidir nada** (a pílula de geofence do tutor tenta de novo a cada 30 s). Nada de coordenada "padrão".
5. O token **nunca vai na URL** em chamadas novas (só no corpo). O link de acesso do portador (`?token=`) é o único lugar em que ele aparece na URL, porque é assim que o backend o gera.

As telas ainda **mostram ao próprio usuário** a posição capturada (modal do tutor, do transportador e da página do token). Isso é local e não é enviado.

Detalhes e histórico: backend, Decisões 036 a 041. Política de dados: [`docs/PRIVACIDADE_LGPD.md`](docs/PRIVACIDADE_LGPD.md).

---

## 8. Armadilhas e pendências conhecidas

Não foram corrigidas; estão aqui para ninguém tropeçar nelas de novo.

**`dashboard-diretor.html`**
- Há **duas definições** de `openDirectorActionModal`: a de `window.openDirectorActionModal = ...` (mais adiante no arquivo) prevalece e a função declarada depois fica sombreada. Edite a que está em uso.
- Código sem nenhum chamador: `executeDirectorEntry`, `executeDirectorExit`, `obterLocalizacaoParaModal`, `confirmStudentAction`, `getDirectorLocation` (só usada pela definição sombreada). Ainda mencionam localização, mas não executam. Não remova sem confirmar (regra do projeto: não apagar por parecer redundante).
- `forcarSaidaAluno` chama `POST /api/presencas/saida/diretor-forcar`, **endpoint que não existe no backend** (a ação falha).
- `openGeofenceModal` é chamada em atualizações via WebSocket, mas **não está definida** na página.

**Outras páginas**
- **`dashboard-geofence.html` foi removida em 2026-09-30.** Era um protótipo legado e órfão (nenhum link a usava, só admitia `ROLE_ADMIN`, apontava para `http://localhost:3000`, e o backend só permite gerir cercas ao `ROLE_ESCOLA`). **A gestão de cercas em produção é a aba "Gestão de Geolocalização (Geofence)" do `dashboard-escola.html`.** Se precisar consultar a página antiga: `git show <commit-anterior>:dashboard-geofence.html` (último commit que a alterou: `bfc8961`).
- Duas URLs de backend (seção 2).
- `send_email.php` não executa no GitHub Pages.

---

## 9. Não fazer

- Não decidir regra de negócio no frontend (dentro/fora, horário permitido, quem pode sair). O backend decide.
- Não enviar nem guardar a posição exata do Diretor, nem coletar GPS dele.
- Não inventar valores padrão (escola, coordenadas) quando um dado falta.
- Não colocar token em URL, `console.log` ou armazenamento além do necessário.
- Não reescrever arquivos inteiros nem alterar o fim de linha.
- Não fazer push sem checar sintaxe e diff: push é deploy.
