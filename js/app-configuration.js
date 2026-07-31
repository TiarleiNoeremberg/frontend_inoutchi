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

        fillForm(config);

        showStatus("Configuração carregada com sucesso.");

    }
    catch (e) {

        console.error(e);

        showStatus("Erro ao carregar configuração.");

    }

}

function fillForm(config) {

    document.getElementById("latestVersionCode").value =
        config.latestVersionCode;

    document.getElementById("latestVersionName").value =
        config.latestVersionName;

    document.getElementById("minimumSupportedVersionCode").value =
        config.minimumSupportedVersionCode;

    document.getElementById("mandatoryUpdate").checked =
        config.mandatoryUpdate;

    document.getElementById("playStoreUrl").value =
        config.playStoreUrl;

    document.getElementById("bannerEnabled").checked =
        config.banner.enabled;

    document.getElementById("bannerId").value =
        config.banner.id ?? "";

    document.getElementById("bannerTitle").value =
        config.banner.title ?? "";

    document.getElementById("bannerMessage").value =
        config.banner.message ?? "";

    document.getElementById("bannerImageUrl").value =
        config.banner.imageUrl ?? "";

    document.getElementById("bannerButtonText").value =
        config.banner.buttonText ?? "";

    document.getElementById("bannerButtonUrl").value =
        config.banner.buttonUrl ?? "";

    document.getElementById("updatedAt").textContent =
        formatDate(config.updatedAt);

    document.getElementById("updatedBy").textContent =
        config.updatedBy ?? "--";

    document.getElementById("minimumVersion").textContent =
        config.minimumSupportedVersionCode;

    document.getElementById("mandatoryInfo").textContent =
        config.mandatoryUpdate ? "SIM" : "NÃO";

    document.getElementById("publishedVersion").textContent =
        config.latestVersionName + " (" + config.latestVersionCode + ")";

    document.getElementById("minimumVersion").textContent =
        config.minimumSupportedVersionCode;

    document.getElementById("mandatoryInfo").textContent =
        config.mandatoryUpdate ? "SIM" : "NÃO";

    document.getElementById("releaseNotes").value =
        config.releaseNotes ?? "";

    const releaseDate = document.getElementById("releaseDate");

    if (config.releaseDate) {
        releaseDate.value = config.releaseDate.substring(0, 16);
    } else {
        releaseDate.value = "";
    }

    document.getElementById("forceUpdateMessage").value =
        config.forceUpdateMessage ?? "";

    document.getElementById("maintenanceMode").checked =
        config.maintenanceMode;

    document.getElementById("maintenanceMessage").value =
        config.maintenanceMessage ?? "";

}

async function saveConfiguration() {

    const body = {

        latestVersionCode:
            Number(document.getElementById("latestVersionCode").value),

        latestVersionName:
            document.getElementById("latestVersionName").value,

        minimumSupportedVersionCode:
            Number(document.getElementById("minimumSupportedVersionCode").value),

        mandatoryUpdate:
            document.getElementById("mandatoryUpdate").checked,

        playStoreUrl:
            document.getElementById("playStoreUrl").value,

        bannerEnabled:
            document.getElementById("bannerEnabled").checked,

        bannerId:
            document.getElementById("bannerId").value
                ? Number(document.getElementById("bannerId").value)
                : null,

        bannerTitle:
            document.getElementById("bannerTitle").value,

        bannerMessage:
            document.getElementById("bannerMessage").value,

        bannerImageUrl:
            document.getElementById("bannerImageUrl").value,

        bannerButtonText:
            document.getElementById("bannerButtonText").value,

        bannerButtonUrl:
            document.getElementById("bannerButtonUrl").value,

        releaseNotes:
            document.getElementById("releaseNotes").value,

        releaseDate: (() => {

            const value =
                document.getElementById("releaseDate").value;

            if (!value)
                return null;

            return value + ":00";

        })(),

        forceUpdateMessage:
            document.getElementById("forceUpdateMessage").value,

        maintenanceMode:
            document.getElementById("maintenanceMode").checked,

        maintenanceMessage:
            document.getElementById("maintenanceMessage").value

    };

    try {

        const token = localStorage.getItem("access_token");

        const response = await fetch(API_ADMIN, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error("Erro ao salvar.");
        }

        showStatus("Configuração salva com sucesso.");

        await loadConfiguration();

    }
    catch (e) {

        console.error(e);

        showStatus("Erro ao salvar configuração.");

    }

}

function showStatus(message) {

    document
        .getElementById("status")
        .textContent = message;

}

function formatDate(date) {

    if (!date) {
        return "--";
    }

    return new Date(date).toLocaleString(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );

}