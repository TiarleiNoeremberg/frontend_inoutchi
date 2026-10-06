// admin-escolas.js - Cadastro, edição e inativação de escolas na área de administração
// (app-configuration.html). Cria a escola e o usuário de acesso (ROLE_ESCOLA) numa única chamada
// ao backend (POST /api/admin/escolas). A senha é gerada pelo servidor e exibida uma única vez.
// Escolas não são excluídas: são inativadas (PATCH /{id}/ativa) e podem ser reativadas.
(function () {
    const API_ESCOLAS = CONFIG.API_URL + CONFIG.ENDPOINTS.ESCOLAS_ADMIN;

    const els = {
        tabApp: document.getElementById('tabApp'),
        tabEscolas: document.getElementById('tabEscolas'),
        btnTabApp: document.getElementById('btnTabApp'),
        btnTabEscolas: document.getElementById('btnTabEscolas'),
        form: document.getElementById('formEscola'),
        titulo: document.getElementById('tituloFormEscola'),
        dica: document.getElementById('dicaFormEscola'),
        nome: document.getElementById('escolaNome'),
        cnpj: document.getElementById('escolaCnpj'),
        endereco: document.getElementById('escolaEndereco'),
        email: document.getElementById('escolaEmail'),
        btnCriar: document.getElementById('btnCriarEscola'),
        btnCancelarEdicao: document.getElementById('btnCancelarEdicao'),
        credenciais: document.getElementById('credenciaisEscola'),
        credNome: document.getElementById('credNome'),
        credEmail: document.getElementById('credEmail'),
        credSenha: document.getElementById('credSenha'),
        btnCopiar: document.getElementById('btnCopiarCredenciais'),
        btnOcultar: document.getElementById('btnOcultarCredenciais'),
        lista: document.getElementById('listaEscolas'),
        total: document.getElementById('totalEscolas'),
        status: document.getElementById('statusEscolas')
    };

    const TEXTO_BOTAO_CRIAR = 'Criar escola';
    const TEXTO_BOTAO_SALVAR = 'Salvar alterações';

    let escolasCarregadas = false;
    let escolasPorId = {};
    let editandoId = null; // null = criando; número = editando a escola com esse id

    // ---------------------------------------------------------------- abas
    function mostrarAba(aba) {
        const escolas = aba === 'escolas';
        els.tabApp.hidden = escolas;
        els.tabEscolas.hidden = !escolas;
        els.btnTabApp.classList.toggle('active', !escolas);
        els.btnTabEscolas.classList.toggle('active', escolas);
        els.btnTabApp.setAttribute('aria-selected', String(!escolas));
        els.btnTabEscolas.setAttribute('aria-selected', String(escolas));

        if (escolas && !escolasCarregadas) {
            carregarEscolas();
        }
    }

    // -------------------------------------------------------------- helpers
    function escapeHtml(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function mostrarStatus(mensagem, erro) {
        els.status.textContent = mensagem;
        els.status.classList.toggle('erro', !!erro);
        clearTimeout(els.status._timeout);
        els.status._timeout = setTimeout(function () {
            els.status.textContent = '';
        }, erro ? 12000 : 6000);
    }

    function cabecalhos() {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        return {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        };
    }

    // Traduz a resposta de erro do backend (ErrorResponse) em uma mensagem para o administrador.
    async function mensagemDeErro(response) {
        if (response.status === 401 || response.status === 403) {
            return 'Sessão expirada ou sem permissão de administrador. Faça login novamente.';
        }
        if (response.status === 404) {
            return 'Escola não encontrada. Atualize a lista e tente de novo.';
        }
        const corpo = await response.json().catch(function () { return null; });
        return (corpo && (corpo.mensagem || corpo.message)) || ('Erro do servidor (' + response.status + ').');
    }

    function formatarCnpj(valor) {
        const d = valor.replace(/\D/g, '').slice(0, 14);
        let r = d.slice(0, 2);
        if (d.length > 2) r += '.' + d.slice(2, 5);
        if (d.length > 5) r += '.' + d.slice(5, 8);
        if (d.length > 8) r += '/' + d.slice(8, 12);
        if (d.length > 12) r += '-' + d.slice(12, 14);
        return r;
    }

    function formatarData(iso) {
        if (!iso) return '--';
        const data = new Date(iso);
        return isNaN(data.getTime()) ? '--' : data.toLocaleDateString('pt-BR');
    }

    // ---------------------------------------------------------------- lista
    async function carregarEscolas() {
        const headers = cabecalhos();
        if (!headers) {
            els.lista.textContent = 'Usuário não autenticado.';
            return;
        }

        els.lista.textContent = 'Carregando...';
        try {
            const response = await fetch(API_ESCOLAS, { headers: headers });
            if (!response.ok) {
                els.lista.textContent = await mensagemDeErro(response);
                return;
            }
            const escolas = await response.json();
            escolasCarregadas = true;
            renderizarLista(escolas);
        } catch (e) {
            console.error(e);
            els.lista.textContent = 'Erro de conexão ao carregar as escolas.';
        }
    }

    function renderizarLista(escolas) {
        els.total.textContent = escolas.length ? '(' + escolas.length + ')' : '';
        escolasPorId = {};
        escolas.forEach(function (e) { escolasPorId[e.id] = e; });

        if (!escolas.length) {
            els.lista.textContent = 'Nenhuma escola cadastrada.';
            return;
        }

        els.lista.innerHTML = escolas.map(function (e) {
            const id = escapeHtml(e.id);
            return '<div class="escola-item' + (e.ativa ? '' : ' inativa') + '">' +
                '<div class="escola-topo">' +
                '<strong>' + escapeHtml(e.nome) + '</strong>' +
                '<span class="selo ' + (e.ativa ? 'selo-ativa' : 'selo-inativa') + '">' +
                (e.ativa ? 'Ativa' : 'Inativa') + '</span>' +
                '</div>' +
                '<span>CNPJ ' + escapeHtml(e.cnpj) + '</span>' +
                '<span>' + (e.emailUsuario ? escapeHtml(e.emailUsuario) : '<em>sem usuário vinculado</em>') + '</span>' +
                '<span class="escola-data">Criada em ' + escapeHtml(formatarData(e.criadoEm)) + '</span>' +
                '<div class="escola-acoes">' +
                '<button type="button" class="btn-mini" data-acao="editar" data-id="' + id + '">Editar</button>' +
                '<button type="button" class="btn-mini ' + (e.ativa ? 'btn-perigo' : '') + '" data-acao="status" data-id="' + id + '">' +
                (e.ativa ? 'Inativar' : 'Reativar') + '</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    // ------------------------------------------------------------ edição
    function entrarEmEdicao(escola) {
        editandoId = escola.id;
        els.titulo.textContent = 'Editar escola';
        els.dica.textContent = 'Altere os dados e salve. Mudar o e-mail de acesso encerra a sessão aberta da escola: ' +
            'ela precisará entrar de novo com o novo e-mail. A senha não é alterada.';
        els.nome.value = escola.nome || '';
        els.cnpj.value = escola.cnpj || '';
        els.endereco.value = escola.endereco || '';
        els.email.value = escola.emailUsuario || '';
        els.email.disabled = !escola.emailUsuario;
        els.email.placeholder = escola.emailUsuario ? 'escola@dominio.com.br' : '(escola sem usuário vinculado)';
        els.btnCriar.textContent = TEXTO_BOTAO_SALVAR;
        els.btnCancelarEdicao.hidden = false;
        ocultarCredenciais();
        els.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        els.nome.focus();
    }

    function sairDaEdicao() {
        editandoId = null;
        els.titulo.textContent = 'Nova escola';
        els.dica.innerHTML = 'Cria a escola e o usuário de acesso (perfil Escola) de uma só vez. A senha é gerada ' +
            'pelo sistema e aparece <strong>uma única vez</strong>, logo após a criação.';
        els.form.reset();
        els.email.disabled = false;
        els.email.placeholder = 'escola@dominio.com.br';
        els.btnCriar.textContent = TEXTO_BOTAO_CRIAR;
        els.btnCancelarEdicao.hidden = true;
    }

    // ------------------------------------------------------- ativar/inativar
    async function alternarStatus(escola) {
        const inativar = escola.ativa;
        const pergunta = inativar
            ? 'Inativar a escola "' + escola.nome + '"?\n\nOs usuários dela (escola, diretores, professores, salas, painéis e ' +
              'transportadores) não conseguirão mais entrar e as sessões abertas serão encerradas. Nada é apagado: ' +
              'você pode reativar a escola depois.'
            : 'Reativar a escola "' + escola.nome + '"?\n\nOs usuários dela voltam a poder entrar.';
        if (!window.confirm(pergunta)) return;

        const headers = cabecalhos();
        if (!headers) {
            mostrarStatus('❌ Usuário não autenticado.', true);
            return;
        }

        try {
            const response = await fetch(API_ESCOLAS + '/' + encodeURIComponent(escola.id) + '/ativa', {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ ativa: !inativar })
            });

            if (!response.ok) {
                mostrarStatus('❌ ' + await mensagemDeErro(response), true);
                return;
            }

            mostrarStatus('✅ Escola ' + (inativar ? 'inativada' : 'reativada') + ' com sucesso.');
            carregarEscolas();
        } catch (e) {
            console.error(e);
            mostrarStatus('❌ Erro de conexão ao alterar o status da escola.', true);
        }
    }

    // ------------------------------------------------------ criar / salvar
    function validar() {
        if (!els.nome.value.trim()) return 'Informe o nome da escola.';
        if (els.cnpj.value.replace(/\D/g, '').length !== 14) return 'O CNPJ deve ter 14 dígitos.';
        const email = els.email.value.trim();
        const emailObrigatorio = editandoId === null || !els.email.disabled;
        if (emailObrigatorio && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
            return 'Informe um e-mail de acesso válido.';
        }
        return null;
    }

    async function enviarFormulario(evento) {
        evento.preventDefault();

        const erroValidacao = validar();
        if (erroValidacao) {
            mostrarStatus('❌ ' + erroValidacao, true);
            return;
        }

        const headers = cabecalhos();
        if (!headers) {
            mostrarStatus('❌ Usuário não autenticado.', true);
            return;
        }

        const editando = editandoId !== null;
        const corpo = {
            nome: els.nome.value.trim(),
            cnpj: els.cnpj.value.trim(),
            endereco: els.endereco.value.trim(),
            email: els.email.disabled ? '' : els.email.value.trim()
        };

        els.btnCriar.disabled = true;
        els.btnCriar.textContent = editando ? 'Salvando...' : 'Criando...';
        try {
            const response = await fetch(editando ? API_ESCOLAS + '/' + encodeURIComponent(editandoId) : API_ESCOLAS, {
                method: editando ? 'PUT' : 'POST',
                headers: headers,
                body: JSON.stringify(corpo)
            });

            if (!response.ok) {
                mostrarStatus('❌ ' + await mensagemDeErro(response), true);
                return;
            }

            if (editando) {
                sairDaEdicao();
                mostrarStatus('✅ Escola atualizada com sucesso.');
            } else {
                const criada = await response.json();
                els.form.reset();
                mostrarCredenciais(criada);
                mostrarStatus('✅ Escola criada com sucesso.');
            }
            escolasCarregadas = false;
            carregarEscolas();
        } catch (e) {
            console.error(e);
            mostrarStatus('❌ Erro de conexão ao ' + (editando ? 'salvar' : 'criar') + ' a escola.', true);
        } finally {
            els.btnCriar.disabled = false;
            els.btnCriar.textContent = editandoId !== null ? TEXTO_BOTAO_SALVAR : TEXTO_BOTAO_CRIAR;
        }
    }

    // A senha só existe nesta resposta (no banco fica apenas o hash): ela é mostrada na tela,
    // nunca gravada em localStorage/console, e removida da página ao ocultar.
    function mostrarCredenciais(criada) {
        els.credNome.textContent = criada.nome;
        els.credEmail.textContent = criada.email;
        els.credSenha.textContent = criada.senha;
        els.credenciais.hidden = false;
        els.credenciais.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function ocultarCredenciais() {
        els.credSenha.textContent = '';
        els.credEmail.textContent = '';
        els.credNome.textContent = '';
        els.credenciais.hidden = true;
    }

    async function copiarCredenciais() {
        const texto = 'Escola: ' + els.credNome.textContent +
            '\nLogin (e-mail): ' + els.credEmail.textContent +
            '\nSenha: ' + els.credSenha.textContent;
        try {
            await navigator.clipboard.writeText(texto);
            mostrarStatus('✅ Credenciais copiadas.');
        } catch (e) {
            mostrarStatus('❌ Não foi possível copiar. Selecione e copie manualmente.', true);
        }
    }

    // ------------------------------------------------------------ eventos
    els.btnTabApp.addEventListener('click', function () { mostrarAba('app'); });
    els.btnTabEscolas.addEventListener('click', function () { mostrarAba('escolas'); });
    els.form.addEventListener('submit', enviarFormulario);
    els.cnpj.addEventListener('input', function () { els.cnpj.value = formatarCnpj(els.cnpj.value); });
    els.btnCopiar.addEventListener('click', copiarCredenciais);
    els.btnOcultar.addEventListener('click', ocultarCredenciais);
    els.btnCancelarEdicao.addEventListener('click', sairDaEdicao);

    els.lista.addEventListener('click', function (evento) {
        const botao = evento.target.closest('button[data-acao]');
        if (!botao) return;
        const escola = escolasPorId[botao.getAttribute('data-id')];
        if (!escola) return;
        if (botao.getAttribute('data-acao') === 'editar') {
            entrarEmEdicao(escola);
        } else {
            alternarStatus(escola);
        }
    });
})();
