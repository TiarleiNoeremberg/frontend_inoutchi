const BiometricIOS = {
    isAvailable: false,
    
    async checkAvailability() {
        // WebAuthn disponível apenas em HTTPS e iOS 13+
        if (!window.isSecureContext) return false;
        
        // Verificar se o dispositivo suporta biometria
        if (!window.PublicKeyCredential) {
            console.log('WebAuthn não suportado');
            return false;
        }
        
        try {
            // Verificar se o dispositivo tem biometria configurada
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            this.isAvailable = available;
            return available;
        } catch (e) {
            console.log('Erro ao verificar biometria iOS:', e);
            return false;
        }
    },
    
    async authenticate(email, password) {
        if (!this.isAvailable) {
            return { success: false, error: 'Biometria não disponível' };
        }
        
        try {
            // Para iOS, usamos Credential Management API
            const credential = await navigator.credentials.get({
                password: true,
                mediation: 'required'
            });
            
            if (credential && credential.password) {
                return {
                    success: true,
                    email: credential.id,
                    password: credential.password
                };
            }
            return { success: false, error: 'Credencial não encontrada' };
        } catch (e) {
            console.error('Erro na autenticação iOS:', e);
            return { success: false, error: e.message };
        }
    },
    
    async saveCredential(email, password, nome) {
        if (!this.isAvailable) return false;
        
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
            console.error('Erro ao salvar credencial:', e);
            return false;
        }
    }
};