// auth.js - Gerenciamento de autenticação
const BACKEND_URL = 'https://inoutchi-backend.onrender.com';
const CLIENT_ID = 'myclientid';
const CLIENT_SECRET = 'myclientsecret';

// Função principal para obter o token válido
async function getValidToken() {
    let token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const tokenExpiry = localStorage.getItem('token_expiry');

    if (!token) {
        window.location.href = 'login.html';
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
    try {
        const response = await fetch(`${BACKEND_URL}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_expiry', (new Date().getTime() + (data.expires_in * 1000)).toString());
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            console.log("✅ Token renovado com sucesso!");
            return data.access_token;
        } else {
            console.error("❌ Falha ao renovar token");
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
