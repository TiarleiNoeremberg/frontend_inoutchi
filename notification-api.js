// API para Push Notifications (PWA)
const NotificationAPI = {
    isSupported: false,
    subscription: null,
    vapidPublicKey: null,

    /**
     * Verifica se o navegador suporta Push Notifications
     */
    checkSupport() {
        if (!('Notification' in window)) {
            console.log('[Push] Notificações não suportadas');
            return false;
        }

        if (!('serviceWorker' in navigator)) {
            console.log('[Push] Service Worker não suportado');
            return false;
        }

        if (!('PushManager' in window)) {
            console.log('[Push] PushManager não suportado');
            return false;
        }

        this.isSupported = true;
        console.log('[Push] Navegador suporta Push Notifications');
        return true;
    },

    /**
     * Registra o Service Worker
     */
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            console.log('[Push] Service Worker registrado:', registration);
            return registration;
        } catch (error) {
            console.error('[Push] Erro ao registrar Service Worker:', error);
            return null;
        }
    },

    /**
     * Solicita permissão para notificações
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.log('[Push] Push não suportado');
            return false;
        }

        if (Notification.permission === 'granted') {
            console.log('[Push] Permissão já concedida');
            return true;
        }

        if (Notification.permission === 'denied') {
            console.log('[Push] Permissão negada pelo usuário');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('[Push] Permissão concedida');
                return true;
            } else {
                console.log('[Push] Permissão negada');
                return false;
            }
        } catch (error) {
            console.error('[Push] Erro ao pedir permissão:', error);
            return false;
        }
    },

    /**
     * Verifica se já existe uma inscrição ativa
     */
    async getExistingSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                console.log('[Push] Inscrição existente encontrada');
                this.subscription = subscription;
                return subscription;
            }
            console.log('[Push] Nenhuma inscrição ativa');
            return null;
        } catch (error) {
            console.error('[Push] Erro ao buscar inscrição:', error);
            return null;
        }
    },

    /**
     * Cria uma nova inscrição para receber push
     */
    async subscribe(vapidPublicKey) {
        if (!this.isSupported) {
            console.log('[Push] Push não suportado');
            return null;
        }

        if (!vapidPublicKey) {
            console.error('[Push] VAPID public key é obrigatória');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Verificar se já existe inscrição
            const existing = await registration.pushManager.getSubscription();
            if (existing) {
                console.log('[Push] Já existe inscrição, reutilizando');
                this.subscription = existing;
                return existing;
            }

            // Criar nova inscrição
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });

            console.log('[Push] Inscrição criada com sucesso');
            this.subscription = subscription;
            return subscription;
        } catch (error) {
            console.error('[Push] Erro ao criar inscrição:', error);
            return null;
        }
    },

    /**
     * Converte VAPID public key de Base64 URL-safe para Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    },

    /**
     * Envia o token de inscrição para o backend
     */
    async sendSubscriptionToBackend(subscription) {
        if (!subscription) {
            console.error('[Push] Nenhuma inscrição para enviar');
            return false;
        }

        try {
            const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            if (!token) {
                console.error('[Push] Usuário não autenticado');
                return false;
            }

            const response = await fetch(`${window.BACKEND_URL || 'https://api.inoutchi.com'}/api/notifications/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        auth: subscription.toJSON().keys?.auth || '',
                        p256dh: subscription.toJSON().keys?.p256dh || ''
                    },
                    platform: 'web'
                })
            });

            if (response.ok) {
                console.log('[Push] Token enviado com sucesso para o backend');
                return true;
            } else {
                console.error('[Push] Erro ao enviar token:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('[Push] Erro ao enviar token:', error);
            return false;
        }
    },

    /**
     * Função principal: configura tudo para receber push
     */
    async setup(vapidPublicKey) {
        console.log('[Push] Iniciando configuração...');

        // 1. Verificar suporte
        if (!this.checkSupport()) {
            console.log('[Push] Dispositivo não suporta push');
            return false;
        }

        // 2. Registrar Service Worker
        const registration = await this.registerServiceWorker();
        if (!registration) {
            console.log('[Push] Falha ao registrar Service Worker');
            return false;
        }

        // 3. Verificar permissão
        const hasPermission = await this.requestPermission();
        if (!hasPermission) {
            console.log('[Push] Usuário não concedeu permissão');
            return false;
        }

        // 4. Criar inscrição
        const subscription = await this.subscribe(vapidPublicKey);
        if (!subscription) {
            console.log('[Push] Falha ao criar inscrição');
            return false;
        }

        // 5. Enviar token para o backend
        await this.sendSubscriptionToBackend(subscription);

        console.log('[Push] Configuração concluída!');
        return true;
    },

    /**
     * Desinscreve o usuário de notificações push
     */
    async unsubscribe() {
        try {
            const subscription = await this.getExistingSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                console.log('[Push] Desinscrição realizada com sucesso');
                return true;
            }
            console.log('[Push] Nenhuma inscrição ativa para remover');
            return false;
        } catch (error) {
            console.error('[Push] Erro ao desinscrever:', error);
            return false;
        }
    }
};

window.NotificationAPI = NotificationAPI;
console.log('[Push] NotificationAPI carregado');