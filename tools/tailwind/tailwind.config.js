/** Onde o Tailwind procura nomes de classe (caminhos relativos a esta pasta). Classes escritas em texto dentro dos scripts
 *  também são encontradas; só classes montadas por concatenação ("bg-" + cor) escapariam, e não há nenhuma. */
module.exports = {
  content: [
    '../../index.html',
    '../../terms.html',
    '../../js/simulador.js',
  ],
  theme: { extend: {} },
  plugins: [],
};
