// ===== biometric.js - Versão completa unificada =====

const BiometricManager = {
    isAvailable: false,
    platform: 'unknown', // 'ios', 'android', 'web'

    async checkAvailability() {
        // Detectar plataforma
        const ua = navigator.userAgent.toLowerCase();

        if (ua.includes('android') && typeof AndroidBiometric !== 'undefined') {
            // Android com WebView nativo
            this.platform = 'android';
            const available = await this.checkAndroidAvailability();
            this.isAvailable = available;
            return available;

        } else if (ua.includes('iphone') || ua.includes('ipad')) {
            // iOS com Safari
            this.platform = 'ios';
            const available = await this.checkIOSAvailability();
            this.isAvailable = available;
            return available;

        } else {
            // Desktop ou outro navegador
            this.platform = 'web';
            const available = await this.checkWebAvailability();
            this.isAvailable = available;
            return available;
        }
    },

    async checkAndroidAvailability() {
        try {
            return AndroidBiometric.isBiometricAvailable();
        } catch (e) {
            return false;
        }
    },

    async checkIOSAvailability() {
        if (!window.isSecureContext) return false;
        if (!window.PublicKeyCredential) return false;

        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (e) {
            return false;
        }
    },

    async checkWebAvailability() {
        if (!window.isSecureContext) return false;
        if (!window.PasswordCredential || !navigator.credentials) return false;

        try {
            const credential = await navigator.credentials.get({ password: true, mediation: 'silent' });
            return !!credential;
        } catch (e) {
            return false;
        }
    },

    async authenticate() {
        if (!this.isAvailable) {
            return { success: false, error: 'Biometria não disponível' };
        }

        switch (this.platform) {
            case 'android':
                return this.authenticateAndroid();
            case 'ios':
                return this.authenticateIOS();
            default:
                return this.authenticateWeb();
        }
    },

    async authenticateAndroid() {
        return new Promise((resolve) => {
            // ✅ ESPERAR A BRIDGE FICAR PRONTA
            let tentativas = 0;
            while (typeof AndroidBiometric === 'undefined' && tentativas < 10) {
                await new Promise(r => setTimeout(r, 100));
                tentativas++;
            }

            if (typeof AndroidBiometric === 'undefined') {
                resolve({ success: false, error: 'Bridge Android não disponível' });
                return;
            }
            const callbackId = 'auth_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

            // ✅ REMOVER CALLBACK ANTERIOR SE EXISTIR
            if (window.biometricCallback) {
                delete window.biometricCallback;
            }

            window.biometricCallback = (id, result) => {
                if (id === callbackId) {
                    if (result && result.success) {
                        resolve({
                            success: true,
                            email: result.email,
                            password: result.password
                        });
                    } else {
                        resolve({
                            success: false,
                            error: result?.error || 'Falha na autenticação'
                        });
                    }
                    delete window.biometricCallback;
                }
            };

            // ✅ TIMEOUT DE SEGURANÇA
            const timeoutId = setTimeout(() => {
                if (window.biometricCallback === callbackFn) {
                    resolve({ success: false, error: 'Tempo limite excedido' });
                    delete window.biometricCallback;
                }
            }, 30000);

            const callbackFn = window.biometricCallback;

            try {
                AndroidBiometric.authenticate(callbackId);
            } catch (e) {
                clearTimeout(timeoutId);
                resolve({ success: false, error: e.message });
                delete window.biometricCallback;
            }
        });
    },

    async authenticateIOS() {
        try {
            const credential = await navigator.credentials.get({
                password: true,
                mediation: 'required'
            });

            if (credential && credential.password) {
                return { success: true, email: credential.id, password: credential.password };
            }
            return { success: false, error: 'Credencial não encontrada' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async authenticateWeb() {
        try {
            const credential = await navigator.credentials.get({
                password: true,
                mediation: 'required'
            });

            if (credential && credential.password) {
                return { success: true, email: credential.id, password: credential.password };
            }
            return { success: false, error: 'Credencial não encontrada' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    async saveCredential(email, password, nome) {
        if (!this.isAvailable) return false;

        switch (this.platform) {
            case 'android':
                try {
                    AndroidBiometric.saveCredential(email, password, nome);
                    return true;
                } catch (e) {
                    return false;
                }
            case 'ios':
            default:
                try {
                    const credential = new PasswordCredential({
                        id: email,
                        password: password,
                        name: nome,
                        iconURL: window.location.origin + '/favicon.ico'
                    });
                    await navigator.credentials.store(credential);
                    return true;
                } catch (e) {
                    return false;
                }
        }
    },

    async clearCredential() {
        if (!this.isAvailable) return;

        switch (this.platform) {
            case 'android':
                try {
                    AndroidBiometric.clearCredential();
                } catch (e) {
                    console.error('Biometria: erro ao limpar', e);
                }
                break;
            case 'ios':
            default:
                // Web Credential API não tem método de remoção direta
                console.log('Biometria: credencial será sobrescrita no próximo login');
                break;
        }
    }
};

window.BiometricManager = BiometricManager;