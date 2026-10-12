const API_PUBLIC =
    CONFIG.API_URL + CONFIG.ENDPOINTS.APP_CONFIGURATION_PUBLIC;

const API_ADMIN =
    CONFIG.API_URL + CONFIG.ENDPOINTS.APP_CONFIGURATION_ADMIN;

/**
 * Aplicativo cuja configuração está na tela ("tutor" = app nativo, que está na loja; "webview" = app legado).
 * O app nativo lê SOMENTE a linha "tutor"; salvar na linha errada não tem efeito para ele.
 */
function appAlvo() {
    const seletor = document.getElementById("appAlvo");
    return seletor ? seletor.value : "tutor";
}

window.onload = function () {
    atualizarContexto();
    loadConfiguration();

    document
        .getElementById("appAlvo")
        .addEventListener("change", function () {
            atualizarContexto();
            loadConfiguration();
        });

    // Dicas e prévia acompanham o que é digitado.
    ["input", "change"].forEach(function (evento) {
        document.addEventListener(evento, function () {
            atualizarAvisosDosCampos();
            atualizarPreviaNativa();
        });
    });

    document
        .getElementById("btnCorrigirLoja")
        .addEventListener("click", function () {
            document.getElementById("playStoreUrl").value = URL_LOJA_TUTOR;
            atualizarAvisosDosCampos();
        });

    document
        .getElementById("btnReload")
        .addEventListener("click", loadConfiguration);

    document
        .getElementById("btnSave")
        .addEventListener("click", saveConfiguration);
};

async function loadConfiguration() {
    try {
        const response = await fetch(API_PUBLIC + "?app=" + encodeURIComponent(appAlvo()));

        if (!response.ok) {
            throw new Error("Erro ao carregar configuração.");
        }

        const config = await response.json();
        console.log('✅ Configuração carregada:', config);

        ultimaConfig = config;
        fillForm(config);
        atualizarContexto();
        showStatus("Configuração carregada com sucesso.");
    } catch (e) {
        console.error(e);
        showStatus("Erro ao carregar configuração.");
    }
}

function fillForm(config) {
    // ========== VERSÃO ==========
    document.getElementById("latestVersionCode").value =
        config.latestVersionCode ?? '';
    document.getElementById("latestVersionName").value =
        config.latestVersionName ?? '';
    document.getElementById("minimumSupportedVersionCode").value =
        config.minimumSupportedVersionCode ?? '';
    document.getElementById("mandatoryUpdate").checked =
        config.mandatoryUpdate ?? false;
    document.getElementById("playStoreUrl").value =
        config.playStoreUrl ?? '';

    // ========== BANNER ==========
    const banner = config.banner || {};
    document.getElementById("bannerEnabled").checked =
        banner.enabled ?? false;
    document.getElementById("bannerId").value =
        banner.id ?? '';
    document.getElementById("bannerTitle").value =
        banner.title ?? '';
    document.getElementById("bannerMessage").value =
        banner.message ?? '';
    document.getElementById("bannerImageUrl").value =
        banner.imageUrl ?? '';
    document.getElementById("bannerButtonText").value =
        banner.buttonText ?? '';
    document.getElementById("bannerButtonUrl").value =
        banner.buttonUrl ?? '';

    // ========== INFORMAÇÕES ==========
    document.getElementById("updatedAt").textContent =
        formatDate(config.updatedAt);
    document.getElementById("updatedBy").textContent =
        config.updatedBy ?? "--";
    document.getElementById("publishedVersion").textContent =
        (config.latestVersionName ?? '--') + " (" + (config.latestVersionCode ?? '--') + ")";
    document.getElementById("minimumVersion").textContent =
        config.minimumSupportedVersionCode ?? '--';
    document.getElementById("mandatoryInfo").textContent =
        config.mandatoryUpdate ? "SIM" : "NÃO";

    // ========== NOTAS DA VERSÃO ==========
    document.getElementById("releaseNotes").value =
        config.releaseNotes ?? '';

    // ========== ✅ DATA DE PUBLICAÇÃO (CORRIGIDO) ==========
    const releaseDateInput = document.getElementById("releaseDate");
    if (config.releaseDate) {
        let formattedDate = '';
        const rawDate = config.releaseDate;

        console.log('📅 releaseDate recebido:', rawDate, 'tipo:', typeof rawDate);

        if (typeof rawDate === 'string') {
            // Se já estiver no formato ISO (YYYY-MM-DDTHH:mm)
            if (rawDate.includes('T')) {
                formattedDate = rawDate.substring(0, 16);
            } else {
                // Tenta converter
                try {
                    const date = new Date(rawDate);
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toISOString().substring(0, 16);
                    }
                } catch (e) {
                    console.warn('⚠️ Não foi possível converter releaseDate (string):', rawDate);
                }
            }
        } else if (typeof rawDate === 'number') {
            // Se for timestamp (número)
            try {
                const date = new Date(rawDate);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toISOString().substring(0, 16);
                }
            } catch (e) {
                console.warn('⚠️ Não foi possível converter releaseDate (number):', rawDate);
            }
        } else if (rawDate instanceof Date) {
            // Se já for um objeto Date
            formattedDate = rawDate.toISOString().substring(0, 16);
        }

        releaseDateInput.value = formattedDate;
        console.log('📅 releaseDate formatado:', formattedDate);
    } else {
        releaseDateInput.value = '';
        console.log('📅 releaseDate é null/undefined');
    }

    // ========== MENSAGENS ==========
    document.getElementById("forceUpdateMessage").value =
        config.forceUpdateMessage ?? '';
    document.getElementById("maintenanceMode").checked =
        config.maintenanceMode ?? false;
    document.getElementById("maintenanceMessage").value =
        config.maintenanceMessage ?? '';
}

function montarCorpo() {
    const body = {
        latestVersionCode:
            Number(document.getElementById("latestVersionCode").value) || 0,
        latestVersionName:
            (document.getElementById("latestVersionName").value || '').trim(),
        minimumSupportedVersionCode:
            Number(document.getElementById("minimumSupportedVersionCode").value) || 0,
        mandatoryUpdate:
            document.getElementById("mandatoryUpdate").checked,
        playStoreUrl:
            (document.getElementById("playStoreUrl").value || '').trim(),
        bannerEnabled:
            document.getElementById("bannerEnabled").checked,
        bannerId: (() => {
            const val = document.getElementById("bannerId").value;
            return val ? Number(val) : null;
        })(),
        bannerTitle:
            (document.getElementById("bannerTitle").value || '').trim(),
        bannerMessage:
            (document.getElementById("bannerMessage").value || '').trim(),
        bannerImageUrl:
            (document.getElementById("bannerImageUrl").value || '').trim(),
        bannerButtonText:
            (document.getElementById("bannerButtonText").value || '').trim(),
        bannerButtonUrl:
            (document.getElementById("bannerButtonUrl").value || '').trim(),
        releaseNotes:
            (document.getElementById("releaseNotes").value || '').trim(),
        releaseDate: (() => {
            const value = document.getElementById("releaseDate").value;
            if (!value) return null;
            // Se já tem hora, mantém; senão adiciona
            if (value.includes('T')) {
                return value + ':00';
            }
            return value + ':00';
        })(),
        forceUpdateMessage:
            (document.getElementById("forceUpdateMessage").value || '').trim(),
        maintenanceMode:
            document.getElementById("maintenanceMode").checked,
        maintenanceMessage:
            (document.getElementById("maintenanceMessage").value || '').trim()
    };

    return body;
}

async function saveConfiguration() {
    const body = montarCorpo();
    const analise = analisarAntesDeSalvar(body);

    if (analise.erros.length) {
        await mostrarDialogo({ titulo: "Corrija antes de salvar", itens: analise.erros, textoOk: "Entendi" });
        return;
    }
    if (analise.confirmacoes.length) {
        const ok = await mostrarDialogo({
            titulo: "Confirme a alteração",
            itens: analise.confirmacoes,
            textoOk: "Salvar mesmo assim",
            cancelavel: true
        });
        if (!ok) return;
    }
    await enviarConfiguracao(body);
}

async function enviarConfiguracao(body) {
    console.log('📤 Enviando configuração:', body);

    try {
        const token = localStorage.getItem("access_token");
        if (!token) {
            showStatus("❌ Usuário não autenticado.");
            return;
        }

        const response = await fetch(API_ADMIN + "?app=" + encodeURIComponent(appAlvo()), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro do servidor:', errorText);
            throw new Error("Erro ao salvar: " + response.status);
        }

        showStatus("✅ Configuração salva com sucesso.");
        await loadConfiguration();

    } catch (e) {
        console.error(e);
        showStatus("❌ Erro ao salvar configuração: " + e.message);
    }
}

function showStatus(message) {
    const statusEl = document.getElementById("status");
    statusEl.textContent = message;
    statusEl.style.display = 'block';

    // Esconde após 5 segundos
    clearTimeout(statusEl._timeout);
    statusEl._timeout = setTimeout(() => {
        statusEl.style.display = 'none';
    }, 5000);
}

function formatDate(date) {
    if (!date) return "--";

    try {
        let dateObj;
        if (typeof date === 'string') {
            dateObj = new Date(date);
        } else if (typeof date === 'number') {
            dateObj = new Date(date);
        } else if (date instanceof Date) {
            dateObj = date;
        } else {
            return "--";
        }

        if (isNaN(dateObj.getTime())) return "--";

        return dateObj.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });
    } catch (e) {
        return "--";
    }
}

/* ------------------------------------------------------------------ contexto do aplicativo escolhido */

/** Última configuração carregada do servidor: base para avisar o que a alteração muda para os usuários. */
let ultimaConfig = null;

const URL_LOJA_TUTOR = "https://play.google.com/store/apps/details?id=com.inoutchi";

const TEXTOS_POR_APP = {
    tutor: {
        aviso: "App nativo do tutor (com.inoutchi, versão 19 em diante). Ele lê somente esta linha. " +
            "Quem tem versão abaixo da versão mínima é bloqueado ao abrir o app, antes do login. " +
            "O banner aparece uma vez a cada abertura, por cima do login ou do app.",
        banner: "O app nativo não exibe imagem e ignora o ID: o banner aparece a cada abertura enquanto estiver habilitado.",
        obrigatoria: "No app nativo esta opção não muda o comportamento: o bloqueio depende só da versão mínima.",
        previa: "Simulação aproximada do modal do app nativo do tutor (sem imagem)."
    },
    webview: {
        aviso: "App legado (WebView, versão 18 e anteriores). O app nativo do tutor NÃO lê esta linha. " +
            "Aumentar a versão mínima aqui bloqueia quem ainda usa o app antigo até atualizar.",
        banner: "Aparece ao abrir o app WebView, com a imagem informada.",
        obrigatoria: "Quando desligada, a tela de atualização do app WebView permite continuar sem atualizar.",
        previa: "Simulação aproximada de como o banner será exibido no app WebView."
    }
};

/** Só endereço web: o app nativo não abre outros esquemas (intent:, file:, javascript:). */
function urlWebValida(url) {
    return /^https?:\/\/\S+$/i.test(url);
}

function valor(id) {
    const el = document.getElementById(id);
    return el ? (el.value || "").trim() : "";
}

function definirTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function atualizarContexto() {
    const app = appAlvo();
    const textos = TEXTOS_POR_APP[app] || TEXTOS_POR_APP.tutor;

    document.body.classList.toggle("app-tutor", app === "tutor");

    const aviso = document.getElementById("avisoApp");
    aviso.textContent = textos.aviso;
    aviso.className = "aviso-app " + (app === "tutor" ? "tutor" : "legado");

    definirTexto("dicaBanner", textos.banner);
    definirTexto("dicaObrigatoria", textos.obrigatoria);
    definirTexto("previewHint", textos.previa);

    // Campos que o app nativo não usa ficam escondidos (o valor carregado é preservado ao salvar).
    document.querySelectorAll("[data-so-webview]").forEach(function (el) {
        el.hidden = app === "tutor";
    });

    atualizarAvisosDosCampos();
    atualizarPreviaNativa();
}

function atualizarAvisosDosCampos() {
    const texto = valor("bannerButtonText");
    const url = valor("bannerButtonUrl");
    const dica = document.getElementById("dicaBotaoUrl");

    const invalida = url !== "" && !urlWebValida(url);
    dica.classList.toggle("erro", invalida);
    if (invalida) {
        dica.textContent = "Endereço inválido: precisa começar com https:// ou http://. O botão não vai aparecer.";
    } else if (texto !== "" && url === "") {
        dica.textContent = "Informe o endereço do botão: sem ele, o botão não aparece no app.";
    } else {
        dica.textContent = "Precisa começar com https:// ou http://. O botão só aparece com texto e endereço válidos.";
    }

    document.getElementById("avisoLoja").hidden = !/com\.inoutchi\.tutor/i.test(valor("playStoreUrl"));
}

/** Prévia do modal do app nativo: mesmas regras do aplicativo (título padrão, botão só com texto e endereço válido). */
function atualizarPreviaNativa() {
    const titulo = valor("bannerTitle");
    const mensagem = valor("bannerMessage");
    const textoBotao = valor("bannerButtonText");
    const comBotao = textoBotao !== "" && urlWebValida(valor("bannerButtonUrl"));

    definirTexto("npTitulo", titulo || (mensagem ? "Aviso do Inoutchi" : "Título do banner"));
    definirTexto("npMensagem", mensagem || (titulo ? "" : "A mensagem do banner aparece aqui conforme você digita."));

    const botao = document.getElementById("npBotao");
    botao.hidden = !comBotao;
    botao.textContent = textoBotao || "Saiba mais";
    document.getElementById("npFechar").classList.toggle("principal", !comBotao);
}

/* ------------------------------------------------------------------ conferência antes de salvar */

function analisarAntesDeSalvar(body) {
    const erros = [];
    const confirmacoes = [];
    const nomeApp = appAlvo() === "tutor" ? "app nativo do tutor" : "app WebView (legado)";
    const minima = body.minimumSupportedVersionCode;

    if (minima > body.latestVersionCode) {
        erros.push("A versão mínima (" + minima + ") não pode ser maior que o Version Code (" +
            body.latestVersionCode + ").");
    }
    if (body.bannerButtonUrl && !urlWebValida(body.bannerButtonUrl)) {
        erros.push("A URL do botão do banner precisa começar com https:// ou http://.");
    }
    if (erros.length) {
        return { erros, confirmacoes };
    }

    const anterior = ultimaConfig ? (ultimaConfig.minimumSupportedVersionCode || 0) : 0;
    if (minima > 1 && minima > anterior) {
        confirmacoes.push("Quem usa o " + nomeApp + " com versão abaixo de " + minima +
            " ficará bloqueado ao abrir o app, até atualizar.");
    }
    if (body.maintenanceMode && !(ultimaConfig && ultimaConfig.maintenanceMode)) {
        confirmacoes.push("O " + nomeApp + " ficará em manutenção para todos os usuários até você desligar essa opção.");
    }
    if (body.bannerEnabled && !body.bannerTitle && !body.bannerMessage) {
        confirmacoes.push("O banner está habilitado, mas sem título nem mensagem: o app não vai exibi-lo.");
    }
    if (minima > 1 && !body.playStoreUrl) {
        confirmacoes.push("Sem a URL da Play Store, a tela de atualização não terá o botão \"Atualizar agora\".");
    }
    if (/com\.inoutchi\.tutor/i.test(body.playStoreUrl)) {
        confirmacoes.push("A URL da Play Store aponta para o pacote antigo com.inoutchi.tutor: o botão " +
            "\"Atualizar agora\" levaria a uma página inexistente.");
    }
    return { erros, confirmacoes };
}

/**
 * Diálogo próprio da página (no lugar de alert/confirm do navegador).
 * Resolve true no botão principal e false ao cancelar, fechar com Esc ou clicar fora.
 */
function mostrarDialogo(opcoes) {
    return new Promise(function (resolve) {
        const camada = document.getElementById("dlgAdmin");
        const ok = document.getElementById("dlgOk");
        const cancelar = document.getElementById("dlgCancelar");
        const lista = document.getElementById("dlgItens");

        document.getElementById("dlgTitulo").textContent = opcoes.titulo;
        lista.innerHTML = "";
        (opcoes.itens || []).forEach(function (item) {
            const li = document.createElement("li");
            li.textContent = item;
            lista.appendChild(li);
        });
        ok.textContent = opcoes.textoOk || "OK";
        cancelar.hidden = !opcoes.cancelavel;
        camada.hidden = false;
        ok.focus();

        function fechar(resultado) {
            camada.hidden = true;
            ok.removeEventListener("click", aoOk);
            cancelar.removeEventListener("click", aoCancelar);
            camada.removeEventListener("click", aoFora);
            document.removeEventListener("keydown", aoTecla);
            resolve(resultado);
        }
        function aoOk() { fechar(true); }
        function aoCancelar() { fechar(false); }
        function aoFora(e) { if (e.target === camada) fechar(!opcoes.cancelavel); }
        function aoTecla(e) { if (e.key === "Escape") fechar(!opcoes.cancelavel); }

        ok.addEventListener("click", aoOk);
        cancelar.addEventListener("click", aoCancelar);
        camada.addEventListener("click", aoFora);
        document.addEventListener("keydown", aoTecla);
    });
}
