/** Onde o Tailwind procura nomes de classe (caminhos relativos a esta pasta). Classes escritas em texto dentro dos scripts
 *  também são encontradas; só classes montadas por concatenação ("bg-" + cor) escapariam, e não há nenhuma. */
module.exports = {
  content: [
    '../../index.html',
    '../../terms.html',
    '../../modelo-autorizacao-buscar-crianca-escola.html',
    '../../controle-de-entrada-e-saida-de-alunos.html',
    '../../planilha-controle-entrada-saida-alunos.html',
    '../../quem-pode-buscar-a-crianca-na-escola.html',
    '../../controle-de-acesso-escolar.html',
    '../../reconhecimento-facial-em-escolas-lgpd.html',
    '../../saida-antecipada-escola.html',
    '../../painel-de-chamada-escolar.html',
    '../../fila-na-saida-da-escola.html',
    '../../app-para-buscar-o-filho-na-escola.html',
    '../../dados-de-menores-na-escola-lgpd.html',
    '../../js/simulador.js',
  ],
  theme: { extend: {} },
  plugins: [],
};
