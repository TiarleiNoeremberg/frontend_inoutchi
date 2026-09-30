# Privacidade e LGPD no frontend — guia de engenharia

Documento **técnico** para quem altera o frontend. Ele descreve o que as páginas fazem com dados pessoais e as regras que o código deve respeitar.

Ele **não substitui** a Política de Privacidade pública (`politica-privacidade.html`) nem parecer jurídico. Este repositório é público: não coloque aqui dados de pessoas, segredos nem detalhes de infraestrutura além do que já é visível no código das páginas.

Para o contexto completo e o histórico das decisões, veja o repositório do backend (`TiarleiNoeremberg/school`), pasta `.claude/context/`: `DECISIONS.md` (Decisões 036 a 041), `KNOWN_FLOWS.md` (seção "Localização do Usuário nas Operações") e `DOMAIN_RULES.md`.

---

## 1. Princípio

**Minimização (LGPD, art. 6º, III):** coletar e transmitir só o necessário para a finalidade. Aqui, isso significa:

- a posição exata do usuário não deve sair do aparelho quando basta saber "a que distância da escola";
- nunca é gravada no banco nem escrita em log (backend);
- para o Diretor, que não depende de geofence, **nenhuma** localização é coletada.

Distância até um ponto conhecido (a escola) **não é anonimização**: continua sendo dado pessoal. É redução de dado, não eliminação.

---

## 2. Dados pessoais que o frontend toca

| Dado | Onde aparece | Situação |
|---|---|---|
| **Localização (GPS)** | Tutor, transportador e portador de token | Medida no aparelho; segue para o backend como cerca + distância (ver seção 3). Fallback envia latitude/longitude. Diretor: não coleta. |
| **Nome do destinatário de um token** | Formulário de geração de token no dashboard do tutor | Enviado ao backend ao gerar o token. A tela **não** envia telefone nem e-mail (o backend aceita esses campos, mas nenhum formulário os preenche). |
| **Token de acesso do portador** | Link `dashboard-token.html?token=...` | O token aparece na URL do link (é como o backend o gera). Nas chamadas de API novas, vai só no corpo. |
| **Sessão do usuário** (`access_token`, `refresh_token`, `token_expiry`, `user_role`, `user_data`, `escolaId`) | `localStorage` ou `sessionStorage` | Ver `CLAUDE.md`, seção 4. |
| **Token FCM (push)** | `localStorage` (`fcm_token`), tutor | Identifica o aparelho para notificações. |
| **Biometria do aparelho** | `biometric.js` (login) | Feita pelo aparelho/WebView. O frontend não a armazena (o script não usa `localStorage`/`sessionStorage`); o que a ponte nativa guarda está no app Android e não foi auditado aqui. |

---

## 3. Localização — como cada perfil informa

| Perfil | O que é enviado ao backend |
|---|---|
| Tutor (entrada, solicitação de saída) | `geofenceId` + `distanciaMetros` (após buscar as cercas em `GET /api/geofences/aluno/{alunoId}/cercas`) |
| Tutor (monitoramento em segundo plano) | Só dentro/fora + distância (`POST /api/geofences/monitoramento/posicao`) |
| Transportador (lote) | `geofenceId` + `distanciaMetros` (cercas em `GET /api/transporte/cercas`) |
| Portador de token | `geofenceId` + `distanciaMetros` (cercas em `POST /api/tokens/cercas`, token no corpo) |
| Diretor | Nada. É livre da geofence. |
| Confirmação de saída (todos) | Nada. |

**Fallback:** se as cercas não puderem ser obtidas, a página envia latitude/longitude (formato anterior) para nunca bloquear uma retirada. Nesse caso a minimização não se aplica àquela operação.

**Quem decide:** o backend. Ele só aceita uma cerca realmente aplicável à escola/operação e só se a distância couber no raio dela. O app arredonda a distância para cima. Não é proteção contra fraude: um cliente adulterado pode declarar qualquer distância, como já podia declarar qualquer coordenada.

---

## 4. Regras para o código

1. **Nunca** escreva latitude, longitude, token, e-mail, telefone ou CPF em `console.log`/`console.error`.
2. **Nunca** guarde posição em `localStorage`/`sessionStorage`/cookies.
3. **Não** envie coordenadas quando o fluxo já usa cerca + distância; só no fallback.
4. **Não** coloque token em URL em chamadas novas: use o corpo da requisição.
5. **Não** colete GPS do Diretor.
6. **Não** invente localização ou escola "padrão" quando faltar dado; sem dado confiável, não decida.
7. Exibir a posição ao **próprio usuário** na tela é permitido (não é transmitido). Se um dia quiser reduzir isso, o texto pode virar "Localização obtida" sem números.
8. Ao adicionar um campo novo com dado pessoal, registre-o na tabela da seção 2.

---

## 5. Lacunas conhecidas (a decidir por quem responde pelo produto)

1. **A Política de Privacidade pública não menciona localização.** A seção "Dados Pessoais Tratados" lista identificação, dados escolares, registros de entrada e saída, dados de responsáveis (nome, CPF, telefone, e-mail), logs de acesso e comunicação escolar. **Não cita geolocalização**, embora o sistema a use para validar a presença na área da escola, nem biometria, nem token de notificação do aparelho. A finalidade, o que é transmitido (distância) e o que não é guardado (posição) poderiam constar. Vale revisão jurídica do texto.
2. **Histórico de coordenadas no banco.** Operações anteriores às correções gravaram posições no banco do backend. Decisão atual: o banco será zerado no ano seguinte e a limpeza não será executada antes. Para o "zerar" cumprir a finalidade, precisa incluir também **backups**, **logs do servidor** e **logs de proxy/acesso** do período anterior (contêm coordenadas). Detalhes no backend, Decisão 037.
3. **Aparelhos com página antiga.** Páginas antigas (cache do navegador ou do WebView) podem continuar enviando latitude/longitude, formato ainda aceito pelo backend. O Service Worker deixou de segurar páginas antigas (`CLAUDE.md`, seção 6); o cache HTTP normal do GitHub Pages ainda pode manter uma página por alguns minutos.
4. **Duas URLs de backend** no código (`api.inoutchi.com` e `inoutchi-backend.onrender.com`): confirmar que são o mesmo destino e que ambas passam pelas mesmas proteções.
