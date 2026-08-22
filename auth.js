// auth.js - Gerenciamento de autenticação
const BACKEND_URL = 'https://api.inoutchi.com';

// ============================================================
// FUNÇÃO: Obter o storage ativo (local ou session)
// ============================================================
function getActiveStorage() {
    // Prioriza localStorage (lembrar sessão)
    if (localStorage.getItem('access_token')) {
        return localStorage;
    }
    // Se não tiver em localStorage, tenta sessionStorage
    if (sessionStorage.getItem('access_token')) {
        return sessionStorage;
    }
    return null;
}

// ============================================================
// FUNÇÃO: Obter token válido (com renovação automática)
// ============================================================
async function getValidToken() {
    const storage = getActiveStorage();
    if (!storage) {
        console.log("❌ Nenhum storage ativo encontrado");
        return null;
    }

    let token = storage.getItem('access_token');
    const refreshToken = storage.getItem('refresh_token');
    const tokenExpiry = storage.getItem('token_expiry');

    // Se não tem token, tenta renovar com refresh token
    if (!token) {
        if (refreshToken) {
            console.log("🔄 Token não encontrado, tentando renovar com refresh token...");
            token = await renovarToken(refreshToken);
            if (token) return token;
        }
        return null;
    }

    // Se tem token mas expirou ou está perto de expirar
    if (tokenExpiry && refreshToken) {
        const expiryTime = parseInt(tokenExpiry);
        const now = Date.now();
        const timeLeft = expiryTime - now;
        const cincoMinutos = 5 * 60 * 1000;
        const umaHora = 60 * 60 * 1000;

        // ✅ Renova se:
        // 1. Token já expirou (timeLeft <= 0)
        // 2. Token está perto de expirar (timeLeft < 1 hora)
        if (timeLeft < umaHora) {
            console.log(`🔄 Token ${timeLeft > 0 ? 'próximo de expirar' : 'já expirou'} (${(timeLeft / 60000).toFixed(0)} min), renovando...`);
            token = await renovarToken(refreshToken);
            if (token) return token;
            
            // Se falhou com o refresh atual, tenta o outro storage
            const altStorage = storage === localStorage ? sessionStorage : localStorage;
            const altRefresh = altStorage.getItem('refresh_token');
            if (altRefresh && altRefresh !== refreshToken) {
                console.log("🔄 Tentando com refresh token alternativo...");
                token = await renovarToken(altRefresh);
                if (token) return token;
            }
        }
    }

    return token;
}

// ============================================================
// FUNÇÃO: Renovar token via BFF
// ============================================================
async function renovarToken(refreshToken) {
    if (!refreshToken) {
        console.log("❌ Refresh token não disponível");
        return null;
    }

    console.log("🔄 Tentando renovar token via BFF...");

    try {
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
            const expiresIn = data.expiresIn || 86400; // 24h padrão

            // ✅ Determina qual storage está sendo usado
            const storage = getActiveStorage() || localStorage;
            
            // ✅ Atualiza o access_token
            storage.setItem('access_token', accessToken);

            // ✅ Se veio um novo refresh_token, atualiza também
            if (newRefreshToken) {
                storage.setItem('refresh_token', newRefreshToken);
            }

            // ✅ Atualiza a expiração
            storage.setItem('token_expiry', (Date.now() + (expiresIn * 1000)).toString());

            console.log("✅ Token renovado com sucesso via BFF!");
            console.log("📅 Nova expiração:", new Date(Date.now() + (expiresIn * 1000)).toLocaleString());
            
            // ✅ Se o usuário está logado, mantém o refresh em ambos os storages
            // (para garantir que funcione mesmo se mudar de storage)
            if (storage === localStorage) {
                // Copia para sessionStorage também (backup)
                sessionStorage.setItem('access_token', accessToken);
                if (newRefreshToken) sessionStorage.setItem('refresh_token', newRefreshToken);
                sessionStorage.setItem('token_expiry', (Date.now() + (expiresIn * 1000)).toString());
            }

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

// ============================================================
// FUNÇÃO: Logout
// ============================================================
function logout() {
    console.log("🚪 Realizando logout...");
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// ============================================================
// FUNÇÃO: Requisições autenticadas
// ============================================================
async function fetchWithAuth(url, options = {}) {
    const token = await getValidToken();
    if (!token) {
        console.log("❌ Sem token válido, redirecionando para login");
        logout();
        return null;
    }

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
        let response = await fetch(fullUrl, mergedOptions);

        // ✅ Se receber 401, tenta renovar uma vez
        if (response.status === 401) {
            console.log('🔑 Token 401, tentando renovar...');
            const storage = getActiveStorage();
            const refreshToken = storage?.getItem('refresh_token');
            
            if (refreshToken) {
                const newToken = await renovarToken(refreshToken);
                if (newToken) {
                    mergedOptions.headers['Authorization'] = `Bearer ${newToken}`;
                    response = await fetch(fullUrl, mergedOptions);
                    
                    // Se ainda der 401, faz logout
                    if (response.status === 401) {
                        console.log("❌ Token ainda inválido após renovação");
                        logout();
                    }
                } else {
                    logout();
                }
            } else {
                logout();
            }
        }

        return response;
    } catch (error) {
        console.error('❌ Erro no fetchWithAuth:', error);
        throw error;
    }
}

// ============================================================
// FUNÇÃO: Renovação automática em background
// ============================================================
function iniciarRenovacaoAutomatica() {
    console.log("⏰ Iniciando renovação automática (a cada 5 minutos)");
    
    // A cada 5 minutos, verifica se precisa renovar
    setInterval(async () => {
        const storage = getActiveStorage();
        if (!storage) return;

        const refreshToken = storage.getItem('refresh_token');
        const tokenExpiry = storage.getItem('token_expiry');

        if (refreshToken && tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry);
            const now = Date.now();
            const timeLeft = expiryTime - now;
            const umaHora = 60 * 60 * 1000;

            // ✅ Renova se estiver perto de expirar (menos de 1 hora) ou já expirou
            if (timeLeft < umaHora) {
                console.log(`🔄 Renovação automática em background (token expira em ${(timeLeft / 60000).toFixed(0)} min)`);
                await renovarToken(refreshToken);
            } else {
                console.log(`⏳ Token ainda válido por ${(timeLeft / 3600000).toFixed(1)} horas`);
            }
        }
    }, 300000); // 5 minutos
}

// ============================================================
// FUNÇÃO: Verificar status do token (para debug)
// ============================================================
function checkTokenStatus() {
    const storage = getActiveStorage();
    if (!storage) {
        console.log("❌ Nenhum storage ativo");
        return null;
    }

    const token = storage.getItem('access_token');
    const refreshToken = storage.getItem('refresh_token');
    const tokenExpiry = storage.getItem('token_expiry');

    if (!token) {
        console.log("❌ Token não encontrado");
        return null;
    }

    const now = Date.now();
    const expiryTime = parseInt(tokenExpiry) || 0;
    const timeLeft = expiryTime - now;

    console.log("📊 Status do Token:");
    console.log(`  Token: ${token.substring(0, 20)}...`);
    console.log(`  Refresh: ${refreshToken ? refreshToken.substring(0, 20) + '...' : '❌ Não encontrado'}`);
    console.log(`  Expira em: ${timeLeft > 0 ? (timeLeft / 3600000).toFixed(1) + ' horas' : '⚠️ Já expirou!'}`);
    console.log(`  Storage: ${storage === localStorage ? 'localStorage' : 'sessionStorage'}`);

    return { token, refreshToken, tokenExpiry, timeLeft, storage };
}

// ============================================================
// FUNÇÃO: Manter sessão ativa (keep-alive)
// ============================================================
function manterSessaoAtiva() {
    console.log("🔄 Mantendo sessão ativa...");
    // A cada 30 minutos, faz uma requisição leve para manter a sessão
    setInterval(async () => {
        const token = await getValidToken();
        if (token) {
            console.log("✅ Sessão mantida ativa");
        }
    }, 1800000); // 30 minutos
}

// ============================================================
// EXPOR CONFIGURAÇÕES GLOBALMENTE
// ============================================================
window.BACKEND_URL = BACKEND_URL;
window.getValidToken = getValidToken;
window.fetchWithAuth = fetchWithAuth;
window.logout = logout;
window.checkTokenStatus = checkTokenStatus;
window.manterSessaoAtiva = manterSessaoAtiva;

// ============================================================
// INICIAR SERVIÇOS
// ============================================================
console.log("🚀 Iniciando auth.js...");

// Inicia a renovação automática
iniciarRenovacaoAutomatica();

// Inicia o keep-alive da sessão
manterSessaoAtiva();

// Verifica status do token ao carregar
setTimeout(() => {
    checkTokenStatus();
}, 2000);

console.log("✅ auth.js carregado com sucesso!");