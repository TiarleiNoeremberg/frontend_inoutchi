// config.js - Configuração centralizada do sistema
const CONFIG = {
    // URL do backend (use a mesma em todos os lugares)
    API_URL: 'https://api.inoutchi.com', // ou http://localhost:8080 para desenvolvimento

    ENDPOINTS: {

        APP_CONFIGURATION_PUBLIC:
            '/api/public/app/bootstrap',

        APP_CONFIGURATION_ADMIN:
            '/api/admin/app/configuration',

        LOGIN: '/api/auth/login',

        LOGOUT: '/api/auth/logout',

        ALUNOS: '/api/alunos',

        RESPONSAVEIS: '/api/responsaveis',

        MENSAGENS: '/api/mensagens'    

    },
    
    // Configuração do Cloudinary (você precisa criar uma conta gratuita)
    CLOUDINARY: {
        UPLOAD_PRESET: 'inoutchi_uploads', // Você criará isso no Cloudinary
        CLOUD_NAME: 'drl5yyq1s',      // Substitua pelo seu
        FOLDER: 'mensagens_anexos'          // Pasta virtual
    }
};