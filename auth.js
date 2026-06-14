// auth.js - Gerenciamento de autenticação
const BACKEND_URL = 'https://api.inoutchi.com';

// Função principal para obter o token válido
async function getValidToken() {
    let token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const tokenExpiry = localStorage.getItem('token_expiry');

    if (!token) {
        //window.location.href = 'login.html';
        return null;
    }

    if (tokenExpiry && refreshToken) {
        const timeLeft = new Date(parseInt(tokenExpiry)) - new Date();
        const cincoMinutos = 5 * 60 * 1000;

        if (timeLeft < cincoMinutos && timeLeft > 0) {
            console.log("🔄 Token próximo de expirar, renovando...");
            token = await renovarToken(refreshToken);
        }
    }

    return token;
}

// Função para renovar o token
async function renovarToken(refreshToken) {
    console.log("🔄 Tentando renovar token via BFF...");

    try {
        // ✅ AGORA USA O BFF, NÃO PRECISA DE CLIENT_ID/CLIENT_SECRET
        const response = await fetch(`${BACKEND_URL}/api/bff/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });

        if (response.ok) {
            const data = await response.json();
            const accessToken = data.accessToken || data.access_token;
            const newRefreshToken = data.refreshToken || data.refresh_token;
            const expiresIn = data.expiresIn;

            // Determina qual storage está sendo usado
            const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;

            // Atualiza o access_token
            storage.setItem('access_token', accessToken);

            // Se veio um novo refresh_token, atualiza também
            if (newRefreshToken) {
                storage.setItem('refresh_token', newRefreshToken);
            }

            // Atualiza a expiração
            if (expiresIn) {
                storage.setItem('token_expiry', (Date.now() + (expiresIn * 1000)).toString());
            }

            console.log("✅ Token renovado com sucesso via BFF!");
            return accessToken;
        } else {
            const error = await response.json().catch(() => ({}));
            console.error("❌ Falha ao renovar token:", error);

            // Se o refresh falhou, faz logout
            logout();
            return null;
        }
    } catch (error) {
        console.error("❌ Erro ao renovar token:", error);
        return null;
    }
}

// Função de logout
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Função para fazer requisições autenticadas
async function fetchWithAuth(url, options = {}) {
    const token = await getValidToken();
    if (!token) return null;

    // 🔴 IMPORTANTE: Verifica se a URL já tem o domínio completo
    const fullUrl = url.startsWith('http') ? url : BACKEND_URL + url;

    console.log('🔍 fetchWithAuth:', {
        urlRecebida: url,
        fullUrl: fullUrl,
        token: token.substring(0, 20) + '...'
    });

    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(fullUrl, mergedOptions);

        if (response.status === 401) {
            console.log('🔑 Token 401, tentando renovar...');
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                const newToken = await renovarToken(refreshToken);
                if (newToken) {
                    mergedOptions.headers['Authorization'] = `Bearer ${newToken}`;
                    return fetch(fullUrl, mergedOptions);
                }
            }
            logout();
        }

        return response;
    } catch (error) {
        console.error('❌ Erro no fetchWithAuth:', error);
        throw error;
    }
}

// ========== EXPOR CONFIGURAÇÕES GLOBALMENTE ==========
window.BACKEND_URL = BACKEND_URL;
window.CLIENT_ID = CLIENT_ID;

// Função de renovação automática (separada)
function iniciarRenovacaoAutomatica() {
    setInterval(async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        const tokenExpiry = localStorage.getItem('token_expiry');

        if (refreshToken && tokenExpiry) {
            const timeLeft = new Date(parseInt(tokenExpiry)) - new Date();
            const cincoMinutos = 5 * 60 * 1000;

            if (timeLeft < cincoMinutos && timeLeft > 0) {
                console.log("🔄 Renovação automática em background");
                await renovarToken(refreshToken);
            }
        }
    }, 60000);
}
