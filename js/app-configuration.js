const API_PUBLIC =
    CONFIG.API_URL + CONFIG.ENDPOINTS.APP_CONFIGURATION_PUBLIC;

const API_ADMIN =
    CONFIG.API_URL + CONFIG.ENDPOINTS.APP_CONFIGURATION_ADMIN;

window.onload = function () {
    loadConfiguration();

    document
        .getElementById("btnReload")
        .addEventListener("click", loadConfiguration);

    document
        .getElementById("btnSave")
        .addEventListener("click", saveConfiguration);
};

async function loadConfiguration() {
    try {
        const response = await fetch(API_PUBLIC);

        if (!response.ok) {
            throw new Error("Erro ao carregar configuração.");
        }

        const config = await response.json();
        console.log('✅ Configuração carregada:', config);

        fillForm(config);
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

async function saveConfiguration() {
    const body = {
        latestVersionCode:
            Number(document.getElementById("latestVersionCode").value) || 0,
        latestVersionName:
            document.getElementById("latestVersionName").value || '',
        minimumSupportedVersionCode:
            Number(document.getElementById("minimumSupportedVersionCode").value) || 0,
        mandatoryUpdate:
            document.getElementById("mandatoryUpdate").checked,
        playStoreUrl:
            document.getElementById("playStoreUrl").value || '',
        bannerEnabled:
            document.getElementById("bannerEnabled").checked,
        bannerId: (() => {
            const val = document.getElementById("bannerId").value;
            return val ? Number(val) : null;
        })(),
        bannerTitle:
            document.getElementById("bannerTitle").value || '',
        bannerMessage:
            document.getElementById("bannerMessage").value || '',
        bannerImageUrl:
            document.getElementById("bannerImageUrl").value || '',
        bannerButtonText:
            document.getElementById("bannerButtonText").value || '',
        bannerButtonUrl:
            document.getElementById("bannerButtonUrl").value || '',
        releaseNotes:
            document.getElementById("releaseNotes").value || '',
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
            document.getElementById("forceUpdateMessage").value || '',
        maintenanceMode:
            document.getElementById("maintenanceMode").checked,
        maintenanceMessage:
            document.getElementById("maintenanceMessage").value || ''
    };

    console.log('📤 Enviando configuração:', body);

    try {
        const token = localStorage.getItem("access_token");
        if (!token) {
            showStatus("❌ Usuário não autenticado.");
            return;
        }

        const response = await fetch(API_ADMIN, {
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