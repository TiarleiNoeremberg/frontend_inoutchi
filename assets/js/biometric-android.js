const BiometricAndroid = {
    isAvailable: false,
    
    async checkAvailability() {
        if (typeof AndroidBiometric === 'undefined') {
            console.log('Android: Bridge não disponível');
            return false;
        }
        
        try {
            this.isAvailable = AndroidBiometric.isBiometricAvailable();
            return this.isAvailable;
        } catch (e) {
            console.log('Android: erro ao verificar biometria', e);
            return false;
        }
    },
    
    async authenticate() {
        return new Promise((resolve) => {
            if (!this.isAvailable) {
                resolve({ success: false, error: 'Biometria não disponível' });
                return;
            }
            
            const callbackId = 'auth_' + Date.now();
            
            // Definir callback global
            window.biometricCallback = (id, success, error) => {
                if (id === callbackId) {
                    if (success) {
                        // Recuperar credencial salva
                        const creds = JSON.parse(AndroidBiometric.getSavedCredential());
                        resolve({
                            success: true,
                            email: creds.email,
                            password: creds.password
                        });
                    } else {
                        resolve({ success: false, error: error || 'Falha na autenticação' });
                    }
                    delete window.biometricCallback;
                }
            };
            
            AndroidBiometric.authenticate(callbackId);
        });
    },
    
    async saveCredential(email, password, nome) {
        if (!this.isAvailable) return false;
        
        try {
            AndroidBiometric.saveCredential(email, password, nome);
            return true;
        } catch (e) {
            console.error('Android: erro ao salvar credencial', e);
            return false;
        }
    }
};