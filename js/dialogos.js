// dialogos.js - Modais dos painéis (administração, diretor e professor).
// Substitui alert/confirm do navegador, faixas de status e toasts por modais no padrão visual do painel.
//
//   Dialogos.aviso({ tipo, titulo, mensagem, itens, textoOk, autoFechar })  -> Promise<true>
//   Dialogos.confirmar({ titulo, mensagem, itens, textoOk, textoCancelar, perigo }) -> Promise<boolean>
//   Dialogos.notificar(mensagem, tipo)  -> atalho para mensagens soltas: tipo "error"|"danger"|"warning"|"success"|"info"
//
// tipo: 'sucesso' | 'erro' | 'aviso' | 'info'. Sucesso pode fechar sozinho (autoFechar em ms); erro e aviso exigem OK.
// Vários modais pedidos em sequência entram numa fila e aparecem um de cada vez.
(function () {
    'use strict';

    const CSS = [
        '.dlgx-camada{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;',
        'padding:20px;background:rgba(15,37,68,.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);',
        'animation:dlgx-fade .18s ease}',
        '.dlgx-camada[hidden]{display:none}',
        '.dlgx-cartao{width:100%;max-width:420px;padding:30px 26px 22px;border-radius:26px;background:#fff;',
        'box-shadow:0 40px 80px -30px rgba(15,37,68,.55);text-align:center;font-family:inherit;color:var(--ink,#0f2544);',
        'animation:dlgx-sobe .22s cubic-bezier(.2,.9,.3,1.2)}',
        '.dlgx-icone{width:68px;height:68px;margin:0 auto 18px;border-radius:50%;display:flex;align-items:center;',
        'justify-content:center;box-shadow:0 14px 26px -12px var(--dlgx-sombra,rgba(29,99,230,.6));',
        'background:var(--dlgx-cor,linear-gradient(135deg,#1d63e6,#17b8d6))}',
        '.dlgx-icone svg{width:32px;height:32px}',
        '.dlgx-titulo{margin:0 0 10px;font-size:20px;font-weight:800;letter-spacing:-.01em}',
        '.dlgx-mensagem{margin:0;font-size:15px;line-height:1.6;color:var(--ink-soft,#4a6183);white-space:pre-line;',
        'overflow-wrap:anywhere}',
        '.dlgx-itens{margin:12px 0 0;padding:0 0 0 20px;text-align:left;font-size:14.5px;line-height:1.6;',
        'color:var(--ink-soft,#4a6183)}',
        '.dlgx-itens li+li{margin-top:8px}',
        '.dlgx-acoes{display:flex;gap:10px;margin-top:24px}',
        '.dlgx-acoes button{flex:1;font:inherit;font-weight:700;font-size:15px;padding:13px 18px;border-radius:14px;',
        'cursor:pointer;border:1.5px solid var(--line,#e3ebf6);background:#fff;color:var(--ink,#0f2544)}',
        '.dlgx-acoes button:hover{border-color:#c9d9ef}',
        '.dlgx-acoes .dlgx-ok{border:none;color:#fff;background:var(--dlgx-cor,linear-gradient(135deg,#1d63e6,#17b8d6))}',
        '.dlgx-acoes button:focus-visible{outline:3px solid rgba(47,124,246,.35);outline-offset:2px}',
        '.dlgx-acoes [hidden]{display:none}',
        '@keyframes dlgx-fade{from{opacity:0}to{opacity:1}}',
        '@keyframes dlgx-sobe{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}',
        '@media (prefers-reduced-motion:reduce){.dlgx-camada,.dlgx-cartao{animation:none}}'
    ].join('');

    const SVG = function (conteudo) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" ' +
            'stroke-linejoin="round" aria-hidden="true">' + conteudo + '</svg>';
    };

    const TIPOS = {
        sucesso: {
            cor: 'linear-gradient(135deg,#12b886,#0ca678)', sombra: 'rgba(12,166,120,.6)',
            icone: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>')
        },
        erro: {
            cor: 'linear-gradient(135deg,#f0455a,#d6293e)', sombra: 'rgba(214,41,62,.6)',
            icone: SVG('<path d="M7 7l10 10M17 7L7 17"/>')
        },
        aviso: {
            cor: 'linear-gradient(135deg,#f59f00,#e67700)', sombra: 'rgba(230,119,0,.6)',
            icone: SVG('<path d="M12 4.5l9 15.5H3z"/><path d="M12 10.5v4"/><path d="M12 17.4v.1"/>')
        },
        info: {
            cor: 'linear-gradient(135deg,#1d63e6,#17b8d6)', sombra: 'rgba(29,99,230,.6)',
            icone: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.8v.1"/>')
        }
    };

    let camada = null;
    let fila = Promise.resolve();

    function garantirCamada() {
        if (camada) return camada;

        const estilo = document.createElement('style');
        estilo.id = 'dlgx-css';
        estilo.textContent = CSS;
        document.head.appendChild(estilo);

        camada = document.createElement('div');
        camada.className = 'dlgx-camada';
        camada.hidden = true;
        camada.innerHTML =
            '<div class="dlgx-cartao" role="dialog" aria-modal="true" aria-labelledby="dlgxTitulo">' +
            '<div class="dlgx-icone" id="dlgxIcone"></div>' +
            '<h3 class="dlgx-titulo" id="dlgxTitulo"></h3>' +
            '<p class="dlgx-mensagem" id="dlgxMensagem"></p>' +
            '<ul class="dlgx-itens" id="dlgxItens"></ul>' +
            '<div class="dlgx-acoes">' +
            '<button type="button" id="dlgxCancelar"></button>' +
            '<button type="button" id="dlgxOk" class="dlgx-ok"></button>' +
            '</div></div>';
        document.body.appendChild(camada);
        return camada;
    }

    function exibir(opcoes) {
        return new Promise(function (resolve) {
            const el = garantirCamada();
            const tipo = TIPOS[opcoes.tipo] || TIPOS.info;
            const cartao = el.firstChild;
            const ok = el.querySelector('#dlgxOk');
            const cancelar = el.querySelector('#dlgxCancelar');
            const mensagem = el.querySelector('#dlgxMensagem');
            const lista = el.querySelector('#dlgxItens');
            const anterior = document.activeElement;

            let cor = tipo.cor;
            let sombra = tipo.sombra;
            if (opcoes.perigo) {
                cor = TIPOS.erro.cor;
                sombra = TIPOS.erro.sombra;
            }
            cartao.style.setProperty('--dlgx-cor', cor);
            cartao.style.setProperty('--dlgx-sombra', sombra);

            el.querySelector('#dlgxIcone').innerHTML = opcoes.perigo ? TIPOS.aviso.icone : tipo.icone;
            el.querySelector('#dlgxTitulo').textContent = opcoes.titulo || '';

            mensagem.textContent = opcoes.mensagem || '';
            mensagem.hidden = !opcoes.mensagem;

            lista.innerHTML = '';
            (opcoes.itens || []).forEach(function (item) {
                const li = document.createElement('li');
                li.textContent = item;
                lista.appendChild(li);
            });
            lista.hidden = !(opcoes.itens && opcoes.itens.length);

            ok.textContent = opcoes.textoOk || 'OK';
            cancelar.textContent = opcoes.textoCancelar || 'Cancelar';
            cancelar.hidden = !opcoes.cancelavel;

            el.hidden = false;
            ok.focus();

            let temporizador = null;
            function fechar(resultado) {
                clearTimeout(temporizador);
                el.hidden = true;
                ok.removeEventListener('click', aoOk);
                cancelar.removeEventListener('click', aoCancelar);
                el.removeEventListener('mousedown', aoFora);
                document.removeEventListener('keydown', aoTecla, true);
                if (anterior && typeof anterior.focus === 'function') anterior.focus();
                resolve(resultado);
            }
            function aoOk() { fechar(true); }
            function aoCancelar() { fechar(false); }
            function aoFora(e) { if (e.target === el) fechar(!opcoes.cancelavel); }
            function aoTecla(e) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    fechar(!opcoes.cancelavel);
                } else if (e.key === 'Tab') {
                    // mantém o foco dentro do modal
                    const botoes = [cancelar, ok].filter(function (b) { return !b.hidden; });
                    const i = botoes.indexOf(document.activeElement);
                    e.preventDefault();
                    botoes[(i + (e.shiftKey ? -1 : 1) + botoes.length) % botoes.length].focus();
                }
            }

            ok.addEventListener('click', aoOk);
            cancelar.addEventListener('click', aoCancelar);
            el.addEventListener('mousedown', aoFora);
            document.addEventListener('keydown', aoTecla, true);

            if (!opcoes.cancelavel && opcoes.autoFechar > 0) {
                temporizador = setTimeout(function () { fechar(true); }, opcoes.autoFechar);
            }
        });
    }

    function enfileirar(opcoes) {
        const resultado = fila.then(function () { return exibir(opcoes); });
        fila = resultado.catch(function () { /* a fila segue mesmo se um modal falhar */ });
        return resultado;
    }

    const TITULOS = {
        erro: 'Não foi possível concluir',
        aviso: 'Atenção',
        sucesso: 'Tudo certo',
        info: 'Aviso'
    };

    // Mensagens antigas vêm com emoji na frente (❌, ✅, ⚠️): o ícone do modal já diz isso.
    function limparEmoji(texto) {
        return String(texto == null ? '' : texto).replace(/^\s*(?:[\u2705\u274C\u26A0\u2139\u26D4\uFE0F]\s*)+/u, '');
    }

    window.Dialogos = {
        notificar: function (mensagem, tipo) {
            const t = String(tipo || '').toLowerCase();
            const nivel = (t === 'error' || t === 'danger' || t === 'erro') ? 'erro'
                : (t === 'warning' || t === 'aviso') ? 'aviso'
                : (t === 'success' || t === 'sucesso') ? 'sucesso'
                : 'info';
            return this.aviso({
                tipo: nivel,
                titulo: TITULOS[nivel],
                mensagem: limparEmoji(mensagem),
                autoFechar: nivel === 'sucesso' ? 2200 : (nivel === 'info' ? 2600 : 0)
            });
        },
        aviso: function (opcoes) {
            return enfileirar(Object.assign({ tipo: 'info', cancelavel: false }, opcoes));
        },
        confirmar: function (opcoes) {
            return enfileirar(Object.assign({ tipo: 'info', textoOk: 'Confirmar' }, opcoes, { cancelavel: true }));
        }
    };
})();
