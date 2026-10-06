// escola-inativa-guard.js
// Quando a escola do usuário é inativada pela administração, o backend passa a responder
// 403 com erro "ESCOLA_INATIVA" a toda chamada autenticada (o token dura 1 ano, então quem
// já estava logado precisa ser derrubado por aqui). Este guarda observa o fetch global:
// ao ver essa resposta, encerra a sessão e leva ao login com o aviso.
//
// Carregar no <head> ANTES dos demais scripts da página, para valer para todas as chamadas.
(function () {
    if (window.__escolaInativaGuard) return;
    window.__escolaInativaGuard = true;

    var originalFetch = window.fetch;
    var encerrando = false;

    function encerrarSessao() {
        if (encerrando) return;
        encerrando = true;
        try { localStorage.clear(); } catch (e) { /* storage indisponível */ }
        try { sessionStorage.clear(); } catch (e) { /* storage indisponível */ }
        window.location.href = 'login.html?inativa=1';
    }

    window.fetch = function () {
        return originalFetch.apply(this, arguments).then(function (response) {
            if (response.status === 403) {
                // clone(): o corpo continua legível para quem fez a chamada.
                response.clone().json().then(function (corpo) {
                    if (corpo && corpo.erro === 'ESCOLA_INATIVA') {
                        encerrarSessao();
                    }
                }).catch(function () { /* corpo não é JSON: não é o nosso caso */ });
            }
            return response;
        });
    };
})();
