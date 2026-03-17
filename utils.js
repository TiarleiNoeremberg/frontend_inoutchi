// ============================================================
// CONSTANTES DE HORÁRIOS PARA SOLICITAÇÕES DE SAÍDA
// ============================================================
const HORARIOS_SAIDA = {
    '2° ANO': { hora: 15, minuto: 10 },
    '5° ANO': { hora: 15, minuto: 30 }
    // Adicione outras salas e horários aqui conforme necessário
    // Exemplo:
    // '1° ANO': { hora: 14, minuto: 30 },
    // '3° ANO': { hora: 16, minuto: 00 },
};

// ============================================================
// FUNÇÕES DE VALIDAÇÃO DE HORÁRIO
// ============================================================

/**
 * Valida se o horário atual permite solicitação de saída para uma determinada sala
 * @param {string} nomeSala - Nome da sala (ex: "2° ANO", "5° ANO")
 * @returns {Object} - { permitido: boolean, mensagem: string, horarioPermitido: string }
 */
function validarHorarioSaida(nomeSala) {
    // Se não for uma sala com restrição, permite
    if (!HORARIOS_SAIDA[nomeSala]) {
        return {
            permitido: true,
            mensagem: '',
            horarioPermitido: ''
        };
    }

    const agora = new Date();
    // Ajusta para horário de Florianópolis (UTC-3)
    const horarioFloripa = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    const horaAtual = horarioFloripa.getHours();
    const minutoAtual = horarioFloripa.getMinutes();
    
    const horarioPermitido = HORARIOS_SAIDA[nomeSala];
    
    // Compara horários
    if (horaAtual < horarioPermitido.hora || 
        (horaAtual === horarioPermitido.hora && minutoAtual < horarioPermitido.minuto)) {
        
        const horaFormatada = horarioPermitido.hora.toString().padStart(2, '0');
        const minutoFormatado = horarioPermitido.minuto.toString().padStart(2, '0');
        
        return {
            permitido: false,
            mensagem: `⏰ Solicitações de saída para ${nomeSala} só são permitidas a partir das ${horaFormatada}:${minutoFormatado} (horário de Florianópolis)`,
            horarioPermitido: `${horaFormatada}:${minutoFormatado}`
        };
    }
    
    return {
        permitido: true,
        mensagem: '',
        horarioPermitido: ''
    };
}

/**
 * Obtém o horário formatado de Florianópolis
 * @returns {string} - Horário no formato HH:MM
 */
function getHorarioFlorianopolisFormatado() {
    const agora = new Date();
    const horarioFloripa = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    return horarioFloripa.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Verifica se está dentro do horário permitido para uma sala específica
 * @param {string} nomeSala - Nome da sala
 * @returns {boolean} - true se pode solicitar saída, false caso contrário
 */
function podeSolicitarSaida(nomeSala) {
    const validacao = validarHorarioSaida(nomeSala);
    return validacao.permitido;
}

// ============================================================
// FUNÇÕES AUXILIARES PARA NOTIFICAÇÕES (opcional)
// ============================================================

/**
 * Mostra uma notificação temporária na tela
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} tipo - 'success', 'error', 'warning', 'info'
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notification = document.createElement('div');
    
    // Define cores baseadas no tipo
    const cores = {
        success: { bg: '#ecfdf5', text: '#10b981', border: '#10b981' },
        error: { bg: '#fef2f2', text: '#ef4444', border: '#ef4444' },
        warning: { bg: '#fffbeb', text: '#f59e0b', border: '#f59e0b' },
        info: { bg: '#e6f7f6', text: '#0ea5a0', border: '#0ea5a0' }
    };
    
    const cor = cores[tipo] || cores.info;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        background: ${cor.bg};
        color: ${cor.text};
        border: 1px solid ${cor.border};
        border-radius: 8px;
        padding: 12px 20px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        animation: slideDown 0.3s ease;
        max-width: 90%;
        text-align: center;
        font-family: 'Inter', sans-serif;
    `;
    
    notification.textContent = mensagem;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

// ============================================================
// EXPORTA AS FUNÇÕES PARA USO GLOBAL
// ============================================================
// Isso torna as funções disponíveis em todos os scripts que incluírem este arquivo
window.utils = {
    validarHorarioSaida,
    getHorarioFlorianopolisFormatado,
    podeSolicitarSaida,
    mostrarNotificacao,
    HORARIOS_SAIDA
};