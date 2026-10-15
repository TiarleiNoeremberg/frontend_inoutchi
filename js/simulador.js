/* =====================================================================================================================
   Simulador do Inoutchi (site): app do responsável + TV da sala, 100% no navegador e com dados fictícios.

   - Não usa a API real nem guarda nada: todo o estado vive nesta página e volta ao início em "Reiniciar".
   - Espelha o app nativo (InoutchiTutor): 5 abas, botão de deslizar, pílula da área, tela de sucesso, tokens, mural.
   - Espelha o painel da sala (dashboard-sala.html): grade de alunos, cor por quem pediu, anel pulsante, destaque.
   - Monta tudo dentro de <div id="simulador-inoutchi">, para poder ser movido para o hero sem mudar nada.
   ===================================================================================================================== */
(function () {
  'use strict';

  var raiz = document.getElementById('simulador-inoutchi');
  if (!raiz) return;

  var LOGO = raiz.getAttribute('data-logo') || 'assets/images/LogoInoutchi_linha.png';
  var REDUZIR = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------------------------------------ dados fictícios
  var COLEGAS = {
    '2º ano A': ['Alice Ramos', 'Bernardo Lima', 'Cecília Prado', 'Davi Moreira', 'Elisa Fontes', 'Felipe Duarte',
      'Gabriela Rocha', null, 'Heitor Campos', 'Isadora Nunes', 'João Vitor Paz', 'Laura Teixeira', 'Lorenzo Brito',
      'Manuela Costa', 'Miguel Farias', 'Olívia Martins', 'Rafael Gomes', 'Sofia Andrade'],
    '5º ano B': ['Arthur Silveira', 'Beatriz Cunha', 'Caio Nogueira', 'Clara Batista', 'Eduardo Pires', 'Helena Dias',
      'Enzo Barros', 'Giovanna Melo', 'Gustavo Reis', 'Júlia Freitas', null, 'Lucas Monteiro', 'Mariana Lopes',
      'Matheus Araújo', 'Nicole Vieira', 'Pietro Carvalho', 'Valentina Alves', 'Vinícius Torres']
  };

  function agoraHHMM() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function dataCurta(diasAtras) {
    var d = new Date();
    d.setDate(d.getDate() - diasAtras);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function fimDoMes() {
    var d = new Date();
    var f = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return String(f.getDate()).padStart(2, '0') + '/' + String(f.getMonth() + 1).padStart(2, '0') + '/' + f.getFullYear();
  }

  function estadoInicial() {
    return {
      tutor: {
        nome: 'Carla Mendes Souza', primeiro: 'Carla', cpf: '000.000.000-00', telefone: '(48) 90000-0000',
        email: 'carla.souza@exemplo.com.br'
      },
      alunos: [
        { id: 1, nome: 'Ana Beatriz Souza', curto: 'Ana Souza', sala: '2º ano A', status: 'PRESENTE', aprox: false, solicitante: null, token: null },
        { id: 2, nome: 'Pedro Henrique Souza', curto: 'Pedro Souza', sala: '5º ano B', status: 'AUSENTE', aprox: false, solicitante: null, token: null }
      ],
      dentro: true,
      aba: 'PORTARIA',
      histAluno: 1,
      filtroMural: 'TODAS',
      filtroTokens: 'ATIVOS',
      salaTV: '2º ano A',
      som: false,
      dicaVista: false,
      biometria: true,
      push: true,
      idioma: 'Português (Brasil)',
      historico: [
        { aluno: 1, dia: 0, tipo: 'entrada', titulo: 'Entrada', det: 'Registrada na portaria', hora: '07:12' },
        { aluno: 1, dia: 1, tipo: 'saida', titulo: 'Saída', det: 'Solicitada por Carla pelo app', hora: '12:04' },
        { aluno: 1, dia: 1, tipo: 'entrada', titulo: 'Entrada', det: 'Registrada na portaria', hora: '07:18' },
        { aluno: 1, dia: 2, tipo: 'saida', titulo: 'Saída', det: 'Retirada por Maria Aparecida (Avó) · token verificado na portaria', hora: '12:11' },
        { aluno: 1, dia: 2, tipo: 'entrada', titulo: 'Entrada', det: 'Registrada na portaria', hora: '07:09' },
        { aluno: 2, dia: 1, tipo: 'saida', titulo: 'Saída', det: 'Solicitada por Carla pelo app', hora: '17:32' },
        { aluno: 2, dia: 1, tipo: 'entrada', titulo: 'Entrada', det: 'Registrada por Carla pelo app', hora: '13:05' },
        { aluno: 2, dia: 2, tipo: 'saida', titulo: 'Saída', det: 'Chamada por Aproximação · confirmada ao sair da área', hora: '17:28' },
        { aluno: 2, dia: 2, tipo: 'entrada', titulo: 'Entrada', det: 'Registrada na portaria', hora: '13:02' }
      ],
      mural: [
        {
          id: 1, grupo: 'Diretoria', urgente: true, tags: ['INSTITUCIONAL'], titulo: 'Saída antecipada nesta sexta',
          corpo: 'Por causa da reunião pedagógica, a saída de todas as turmas será às 11h30. Use o app para chamar seu filho normalmente.',
          quando: 'Hoje, 08:40', lida: false
        },
        {
          id: 2, grupo: 'Turma', tags: ['2º ANO A', 'MATEMÁTICA'], titulo: 'Tabuada divertida',
          corpo: 'Nesta semana vamos praticar a tabuada do 2 com jogos. Se puderem, revisem em casa por 10 minutos.',
          quando: 'Hoje, 07:55', lida: false
        },
        {
          id: 3, grupo: 'Individual', tags: ['PEDRO HENRIQUE', 'EDUCAÇÃO FÍSICA'], titulo: 'Tênis e garrafinha',
          corpo: 'Amanhã teremos aula na quadra. Pedro precisa vir de tênis e trazer a garrafinha de água.',
          quando: 'Ontem, 16:10', lida: false
        },
        {
          id: 4, grupo: 'Diretoria', tags: ['INSTITUCIONAL'], titulo: 'Festa da Família',
          corpo: 'No sábado, das 9h às 12h, teremos a Festa da Família. O convite está em anexo.',
          quando: dataCurta(3) + ', 10:00', lida: true, anexo: 'convite-festa-da-familia.pdf'
        },
        {
          id: 5, grupo: 'Sistema', tags: ['SISTEMA'], titulo: 'Bem-vindo ao Inoutchi',
          corpo: 'Por aqui você chama seu filho na saída, autoriza outra pessoa a buscá-lo e acompanha os avisos da escola.',
          quando: dataCurta(10) + ', 09:00', lida: true
        }
      ],
      tokens: [
        { id: 1, aluno: 1, nome: 'Maria Aparecida', parentesco: 'Avó', codigo: '482 913', reutilizavel: true, validade: 'Válido até ' + fimDoMes(), situacao: 'ATIVOS' },
        { id: 2, aluno: 2, nome: 'João Pereira', parentesco: 'Tio', codigo: '305 118', reutilizavel: false, validade: 'Usado em ' + dataCurta(1) + ', 17:40', situacao: 'USADOS' },
        { id: 3, aluno: 1, nome: 'Roberta Lima', parentesco: 'Amiga da família', codigo: '771 640', reutilizavel: false, validade: 'Expirou em ' + dataCurta(6), situacao: 'EXPIRADOS' }
      ],
      proximoToken: 4
    };
  }

  var E = estadoInicial();
  var timers = [];

  function depois(ms, fn) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }

  function limparTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function aluno(id) {
    for (var i = 0; i < E.alunos.length; i++) if (E.alunos[i].id === id) return E.alunos[i];
    return null;
  }

  function naoLidas() {
    return E.mural.filter(function (m) { return !m.lida; }).length;
  }

  // ------------------------------------------------------------------------------------------------ estrutura
  raiz.classList.add('simi');
  raiz.innerHTML =
    '<div class="simi-col-celular">' +
    '  <span class="simi-selo-demo"><i class="fas fa-flask"></i>Simulação com dados fictícios</span>' +
    '  <div class="simi-celular" aria-label="Celular com o app do responsável (simulação)">' +
    '    <div class="simi-tela" id="simi-tela">' +
    '      <div class="simi-status"><span id="simi-relogio">' + agoraHHMM() + '</span><span><i class="fas fa-signal"></i><i class="fas fa-wifi"></i><i class="fas fa-battery-three-quarters"></i></span></div>' +
    '      <div class="simi-cabecalho">' +
    '        <img src="' + esc(LOGO) + '" alt="Inoutchi">' +
    '        <div class="simi-cab-botoes">' +
    '          <button type="button" class="simi-icone-btn" data-acao="sino" aria-label="Avisos"><i class="fas fa-bell"></i><span class="simi-ponto" id="simi-ponto-sino"></span></button>' +
    '          <button type="button" class="simi-icone-btn sair" data-acao="sair" aria-label="Sair"><i class="fas fa-right-from-bracket"></i></button>' +
    '        </div>' +
    '      </div>' +
    '      <div class="simi-conteudo" id="simi-conteudo"></div>' +
    '      <nav class="simi-barra" id="simi-barra" aria-label="Abas do app"></nav>' +
    '    </div>' +
    '  </div>' +
    '  <div class="simi-controles" aria-label="Controles da simulação">' +
    '    <div class="simi-controles-titulo"><i class="fas fa-sliders"></i>Controles da simulação</div>' +
    '    <div class="simi-ctrl-linha"><span>Onde você está</span><span class="simi-segmento" id="simi-seg-area">' +
    '      <button type="button" data-ctrl="dentro">Na escola</button><button type="button" data-ctrl="fora">Longe</button></span></div>' +
    '    <div class="simi-ctrl-linha"><span>Chegar à escola (Chamada por Aproximação)</span><button type="button" class="simi-ctrl-btn" data-ctrl="chegar">Chegar</button></div>' +
    '    <div class="simi-ctrl-linha"><span>Afastar-se por 3 minutos</span><button type="button" class="simi-ctrl-btn" data-ctrl="afastar">Afastar</button></div>' +
    '    <div class="simi-ctrl-linha"><span>Som da TV (nome em voz)</span><button type="button" class="simi-chave" data-ctrl="som" aria-label="Som da TV" aria-pressed="false"></button></div>' +
    '    <div class="simi-ctrl-linha"><span></span><button type="button" class="simi-ctrl-btn claro" data-ctrl="reiniciar"><i class="fas fa-rotate-left"></i> Reiniciar</button></div>' +
    '  </div>' +
    '</div>' +
    '<div class="simi-col-tv">' +
    '  <div class="simi-tv-salas" id="simi-tv-salas"></div>' +
    '  <div class="simi-tv" aria-label="TV da sala de aula (simulação)">' +
    '    <div class="simi-tv-tela" id="simi-tv-tela">' +
    '      <div class="simi-tv-cab"><span id="simi-tv-titulo"></span><span class="simi-tv-status"><span>🕒 <span id="simi-tv-hora"></span></span><span>🟢 Online</span></span></div>' +
    '      <div class="simi-tv-grade" id="simi-tv-grade"></div>' +
    '    </div>' +
    '  </div>' +
    '  <div class="simi-tv-pe"></div>' +
    '  <div class="simi-legenda-cores"><span style="--c:#e2e8f0">Na sala</span><span style="--c:#10b981">Chamado pelo responsável</span><span style="--c:#f59e0b">Retirada por terceiro (token)</span></div>' +
    '  <p class="simi-legenda">Deslize o botão no app e veja o aluno ser chamado na TV da sala, com nome na tela e, se quiser, em voz. Sem alto-falante geral e sem fila na portaria.</p>' +
    '</div>';

  // Modo compacto (hero do site): os controles da simulação saem de baixo do celular e ocupam uma faixa abaixo dos dois.
  if (raiz.getAttribute('data-compacto') === 'true') {
    raiz.classList.add('simi-compacto');
    raiz.appendChild(raiz.querySelector('.simi-controles'));
  }

  var tela = document.getElementById('simi-tela');
  var conteudo = document.getElementById('simi-conteudo');
  var barra = document.getElementById('simi-barra');

  // ------------------------------------------------------------------------------------------------ abas
  var ABAS = [
    { id: 'PORTARIA', rotulo: 'Portaria', icone: 'fa-door-open', cor: '#1a6fc4', grad: 'linear-gradient(135deg,#1a6fc4,#0ea5a0)' },
    { id: 'MURAL', rotulo: 'Mural', icone: 'fa-bullhorn', cor: '#7c3aed', grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    { id: 'TOKENS', rotulo: 'Tokens', icone: 'fa-key', cor: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
    { id: 'HISTORICO', rotulo: 'Histórico', icone: 'fa-clock-rotate-left', cor: '#0ea5a0', grad: 'linear-gradient(135deg,#0ea5a0,#2dd4bf)' },
    { id: 'CONFIG', rotulo: 'Config', icone: 'fa-gear', cor: '#f43f5e', grad: 'linear-gradient(135deg,#f43f5e,#fb7185)' }
  ];

  function hexAlpha(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function renderBarra() {
    var nl = naoLidas();
    barra.innerHTML = ABAS.map(function (a) {
      var ativa = E.aba === a.id;
      var estilo = ativa
        ? 'background:' + a.grad + ';box-shadow:0 8px 16px -6px ' + hexAlpha(a.cor, .7)
        : 'background:' + hexAlpha(a.cor, .12) + ';color:' + a.cor;
      var contador = (a.id === 'MURAL' && nl > 0) ? '<span class="simi-contador">' + nl + '</span>' : '';
      return '<button type="button" class="simi-aba' + (ativa ? ' ativa' : '') + '" data-aba="' + a.id + '"' +
        (ativa ? ' aria-current="page"' : '') + '>' +
        '<span class="simi-aba-icone" style="' + estilo + '"><i class="fas ' + a.icone + '"></i>' + contador + '</span>' +
        a.rotulo + '</button>';
    }).join('');
    document.getElementById('simi-ponto-sino').style.display = nl > 0 ? 'block' : 'none';
  }

  function irPara(aba) {
    E.aba = aba;
    render();
    conteudo.scrollTop = 0;
  }

  // ------------------------------------------------------------------------------------------------ telas
  function cabecalho(saudacao, titulo, sub) {
    return '<div class="simi-aba-cab"><div class="simi-saudacao">' + esc(saudacao) + '</div>' +
      '<div class="simi-titulo">' + esc(titulo) + '</div><div class="simi-subtitulo">' + esc(sub) + '</div></div>';
  }

  function seloStatus(st) {
    var icone = st === 'AGUARDANDO' ? '<i class="fas fa-spinner"></i>' : '<i class="fas fa-circle" style="font-size:7px"></i>';
    return '<span class="simi-selo ' + st + '">' + icone + st + '</span>';
  }

  function telaPortaria() {
    var h = cabecalho('Olá, ' + E.tutor.primeiro, 'Portaria', 'Gerencie a entrada e saída dos seus filhos.');
    h += E.dentro
      ? '<span class="simi-pilula dentro"><span class="simi-bolinha"></span><i class="fas fa-circle-check"></i>Dentro da área da escola</span>'
      : '<span class="simi-pilula fora"><span class="simi-bolinha"></span><i class="fas fa-triangle-exclamation"></i>Fora da área da escola</span>';
    E.alunos.forEach(function (a) {
      h += '<div class="simi-cartao">' +
        '<div class="simi-aluno-nome">' + esc(a.nome) + '</div>' +
        '<div class="simi-aluno-sala">' + esc(a.sala) + '</div>' +
        '<div class="simi-linha">' + seloStatus(a.status) +
        '<button type="button" class="simi-chip-btn" data-acao="historico" data-id="' + a.id + '"><i class="fas fa-clock-rotate-left"></i>Histórico</button></div>' +
        '<div class="simi-aprox" data-acao="aprox" data-id="' + a.id + '"><i class="fas fa-satellite-dish"></i>Chamada por Aproximação' +
        '<span class="simi-chave' + (a.aprox ? ' ligada' : '') + '" role="switch" aria-checked="' + a.aprox + '"></span></div>';
      if (a.token) {
        h += '<div class="simi-cartao" style="margin-top:12px;background:#fffbeb;border-color:rgba(245,158,11,.35);box-shadow:none">' +
          '<div style="font-size:13px;font-weight:700;color:#b45309"><i class="fas fa-key"></i> ' + esc(a.token.nome) + ' (' + esc(a.token.parentesco) + ') está na portaria</div>' +
          '<div style="font-size:12px;color:#92400e;margin-top:4px">A portaria confere o QR code ou o código de 6 dígitos e o documento.</div>' +
          '<div class="simi-acoes"><button type="button" class="simi-btn perigo pequeno" data-acao="recusar" data-id="' + a.id + '"><i class="fas fa-hand"></i>Recusar retirada</button></div></div>';
      } else {
        h += '<div class="simi-slide-envolve" data-slide="' + a.id + '"></div>';
      }
      h += '</div>';
    });
    return h;
  }

  function telaMural() {
    var h = cabecalho('Comunicações', 'Mural', 'Avisos da diretoria e mensagens por matéria.');
    var filtros = ['TODAS', 'Diretoria', 'Turma', 'Individual'];
    h += '<div class="simi-filtros">' + filtros.map(function (f) {
      return '<button type="button" class="simi-filtro' + (E.filtroMural === f ? ' ativo' : '') + '" data-acao="filtro-mural" data-f="' + f + '">' +
        (f === 'TODAS' ? 'Todas' : f) + '</button>';
    }).join('') + '</div>';
    var lista = E.mural.filter(function (m) { return E.filtroMural === 'TODAS' || m.grupo === E.filtroMural; });
    if (!lista.length) return h + '<div class="simi-vazio"><i class="fas fa-inbox"></i>Nenhuma mensagem</div>';
    lista.forEach(function (m) {
      var tags = (m.urgente ? '<span class="simi-tag urgente">URGENTE</span>' : '') +
        '<span class="simi-tag' + (m.grupo === 'Diretoria' ? ' dir' : '') + '">' + (m.grupo === 'Diretoria' ? '🏛️ ' : m.grupo === 'Turma' ? '👥 ' : m.grupo === 'Individual' ? '👤 ' : '') + esc(m.grupo) + '</span>' +
        m.tags.map(function (t) { return '<span class="simi-tag">' + esc(t) + '</span>'; }).join('');
      h += '<div class="simi-cartao simi-msg' + (m.lida ? '' : ' nao-lida') + (m.urgente ? ' urgente' : '') + '" data-acao="msg" data-id="' + m.id + '" role="button" tabindex="0">' +
        '<div class="simi-msg-tags">' + tags + '</div>' +
        '<div class="simi-msg-titulo">' + esc(m.titulo) + '</div><div class="simi-msg-data">' + esc(m.quando) + '</div>' +
        (m.aberta ? '<div class="simi-msg-corpo">' + esc(m.corpo) + '</div>' + (m.anexo ? '<div class="simi-msg-anexo"><i class="fas fa-paperclip"></i>' + esc(m.anexo) + '</div>' : '') : '') +
        '</div>';
    });
    return h;
  }

  function telaTokens() {
    var h = cabecalho('Delegação de saída', 'Tokens', 'Autorize terceiros a buscar seu filho.');
    h += '<button type="button" class="simi-btn ambar" data-acao="novo-token"><i class="fas fa-plus"></i>Gerar novo token</button>';
    var abas = [['ATIVOS', 'Ativos'], ['USADOS', 'Usados'], ['EXPIRADOS', 'Expirados'], ['REVOGADOS', 'Revogados']];
    h += '<div class="simi-filtros" style="margin-top:14px">' + abas.map(function (a) {
      var n = E.tokens.filter(function (t) { return t.situacao === a[0]; }).length;
      return '<button type="button" class="simi-filtro' + (E.filtroTokens === a[0] ? ' ativo' : '') + '" data-acao="filtro-token" data-f="' + a[0] + '">' + a[1] + ' (' + n + ')</button>';
    }).join('') + '</div>';
    var lista = E.tokens.filter(function (t) { return t.situacao === E.filtroTokens; });
    if (!lista.length) return h + '<div class="simi-vazio"><i class="fas fa-key"></i>Nenhum token nesta lista</div>';
    lista.forEach(function (t) {
      var al = aluno(t.aluno);
      h += '<div class="simi-cartao"><div class="simi-token-topo"><div>' +
        '<div class="simi-aluno-nome">' + esc(t.nome) + '</div>' +
        '<div class="simi-aluno-sala">' + esc(t.parentesco) + ' · busca ' + esc(al ? al.nome : '') + '</div></div>' +
        (t.reutilizavel ? '<span class="simi-tag">REUTILIZÁVEL</span>' : '<span class="simi-tag">USO ÚNICO</span>') + '</div>' +
        '<div class="simi-token-codigo">' + esc(t.codigo) + '</div>' +
        '<div class="simi-token-info">' + esc(t.validade) + '</div>';
      if (t.situacao === 'ATIVOS') {
        h += '<div class="simi-acoes">' +
          '<button type="button" class="simi-btn secundario pequeno" data-acao="ver-token" data-id="' + t.id + '"><i class="fas fa-qrcode"></i>QR code</button>' +
          '<button type="button" class="simi-btn perigo pequeno" data-acao="revogar" data-id="' + t.id + '"><i class="fas fa-ban"></i>Revogar</button>' +
          '<button type="button" class="simi-btn pequeno simi-acao-demo" data-acao="usar-token" data-id="' + t.id + '"><i class="fas fa-play"></i>Simular na portaria</button>' +
          '</div>';
      }
      h += '</div>';
    });
    return h;
  }

  var NOMES_DIA = ['Hoje', 'Ontem'];

  function telaHistorico() {
    var h = cabecalho('Movimentações', 'Histórico', 'Linha do tempo de entradas e saídas.');
    h += '<div class="simi-chips">' + E.alunos.map(function (a) {
      return '<button type="button" class="simi-chip' + (E.histAluno === a.id ? ' ativo' : '') + '" data-acao="hist-aluno" data-id="' + a.id + '">' +
        esc(a.nome.split(' ')[0] + ' ' + a.nome.split(' ').slice(-1)[0]) + '<small>' + esc(a.sala) + '</small></button>';
    }).join('') + '</div>';
    var lista = E.historico.filter(function (x) { return x.aluno === E.histAluno; });
    if (!lista.length) return h + '<div class="simi-vazio"><i class="fas fa-clock"></i>Este aluno ainda não possui movimentações</div>';
    var dias = {};
    lista.forEach(function (x) { (dias[x.dia] = dias[x.dia] || []).push(x); });
    Object.keys(dias).sort(function (a, b) { return a - b; }).forEach(function (d) {
      h += '<div class="simi-dia">' + (NOMES_DIA[d] || dataCurta(+d)) + '</div><div class="simi-lista" style="padding:0 14px">';
      dias[d].forEach(function (x) {
        h += '<div class="simi-mov' + (x.novo ? ' novo' : '') + '"><span class="simi-mov-icone ' + x.tipo + '"><i class="fas ' +
          (x.tipo === 'entrada' ? 'fa-arrow-right-to-bracket' : 'fa-arrow-right-from-bracket') + '"></i></span>' +
          '<div><div class="simi-mov-titulo">' + esc(x.titulo) + '</div><div class="simi-mov-det">' + esc(x.det) + '</div></div>' +
          '<span class="simi-mov-hora">' + esc(x.hora) + '</span></div>';
        x.novo = false;
      });
      h += '</div>';
    });
    return h;
  }

  function item(acao, icone, titulo, sub, direita) {
    return '<button type="button" class="simi-item" data-acao="' + acao + '"><span class="simi-item-icone"><i class="fas ' + icone + '"></i></span>' +
      '<span class="simi-item-texto"><span class="simi-item-titulo" style="display:block">' + esc(titulo) + '</span>' +
      (sub ? '<span class="simi-item-sub" style="display:block">' + esc(sub) + '</span>' : '') + '</span>' +
      (direita || '<i class="fas fa-chevron-right"></i>') + '</button>';
  }

  function chave(ligada) {
    return '<span class="simi-chave' + (ligada ? ' ligada' : '') + '" role="switch" aria-checked="' + ligada + '"></span>';
  }

  function telaConfig() {
    var t = E.tutor;
    var iniciais = t.nome.split(' ')[0][0] + t.nome.split(' ').slice(-1)[0][0];
    var h = cabecalho('Configuração', 'Config', 'Perfil, segurança e preferências.');
    h += '<div class="simi-cartao" style="margin-top:0"><div class="simi-perfil"><span class="simi-avatar">' + esc(iniciais) + '</span><div>' +
      '<div class="simi-aluno-nome">' + esc(t.nome) + '</div><div class="simi-aluno-sala">Tutor responsável · ' + esc(t.email) + '</div></div></div></div>';
    h += '<div class="simi-secao">Sua conta</div><div class="simi-lista">' +
      item('dados', 'fa-id-card', 'Meus Dados Pessoais', 'Nome, CPF, telefone, e-mail') +
      item('filhos', 'fa-children', 'Meus filhos', E.alunos.length + ' alunos vinculados') + '</div>';
    h += '<div class="simi-secao">Segurança</div><div class="simi-lista">' +
      item('senha', 'fa-lock', 'Trocar senha', 'Altere sua senha de acesso') +
      item('biometria', 'fa-fingerprint', 'Login por biometria', E.biometria ? 'Ativo neste aparelho' : 'Desativado', chave(E.biometria)) + '</div>';
    h += '<div class="simi-secao">Preferências</div><div class="simi-lista">' +
      item('idioma', 'fa-language', 'Idioma', E.idioma) +
      item('push', 'fa-bell', 'Mensagens Push', 'Receber avisos de entrada, saída e mensagens da escola neste aparelho.', chave(E.push)) + '</div>';
    h += '<div class="simi-secao">Suporte e legal</div><div class="simi-lista">' +
      item('ajuda', 'fa-headset', 'Central de Ajuda', 'Telefone e e-mail do suporte') +
      item('tutorial', 'fa-book-open', 'Tutorial do Aplicativo', 'FAQ e tutoriais') +
      item('privacidade', 'fa-shield-halved', 'Política de privacidade', 'LGPD e tratamento de dados') + '</div>';
    h += '<div class="simi-secao">Conta</div><div class="simi-lista">' +
      item('excluir', 'fa-user-xmark', 'Excluir minha conta', 'Remover seus dados e desativar o acesso') + '</div>';
    h += '<p class="simi-ajuda" style="text-align:center;margin-top:16px">Detalhes da versão · 3.0.1 (20)</p>';
    return h;
  }

  // ------------------------------------------------------------------------------------------------ render
  function render() {
    renderBarra();
    var html = '';
    if (E.aba === 'PORTARIA') html = telaPortaria();
    else if (E.aba === 'MURAL') html = telaMural();
    else if (E.aba === 'TOKENS') html = telaTokens();
    else if (E.aba === 'HISTORICO') html = telaHistorico();
    else html = telaConfig();
    conteudo.innerHTML = html;
    if (E.aba === 'PORTARIA') montarSlides();
    renderControles();
    renderTV();
  }

  function acaoDoAluno(a) {
    if (a.status === 'PRESENTE') return 'SOLICITAR_SAIDA';
    if (a.status === 'AGUARDANDO') return 'CONFIRMAR_SAIDA';
    return 'ENTRADA';
  }

  // ------------------------------------------------------------------------------------------------ botão de deslizar
  var SLIDE = {
    ENTRADA: { rotulo: 'Deslize para registrar entrada →', inv: false, icone: 'fa-arrow-right' },
    SOLICITAR_SAIDA: { rotulo: '← Deslize para solicitar saída', inv: true, icone: 'fa-arrow-left' },
    CONFIRMAR_SAIDA: { rotulo: 'Deslize para confirmar saída →', inv: false, icone: 'fa-arrow-right' }
  };

  function montarSlides() {
    var envolves = conteudo.querySelectorAll('[data-slide]');
    Array.prototype.forEach.call(envolves, function (env) {
      var a = aluno(+env.getAttribute('data-slide'));
      criarSlide(env, acaoDoAluno(a), function () { return executar(a, acaoDoAluno(a)); },
        !E.dicaVista && a.id === 1 && a.status === 'PRESENTE');
    });
  }

  function criarSlide(env, acao, aoConcluir, comDica) {
    var cfg = SLIDE[acao];
    var el = document.createElement('div');
    el.className = 'simi-slide ' + acao + (cfg.inv ? ' invertida' : '');
    el.innerHTML = '<div class="simi-slide-preench"></div><div class="simi-slide-rotulo">' + cfg.rotulo + '</div>' +
      '<button type="button" class="simi-polegar" aria-label="' + cfg.rotulo.replace(/[←→]/g, '').trim() + ' (ou pressione Enter)"><i class="fas ' + cfg.icone + '"></i></button>';
    if (comDica) {
      var dica = document.createElement('div');
      dica.className = 'simi-dica';
      dica.textContent = 'Arraste a bolinha para a esquerda';
      env.appendChild(dica);
      env.style.paddingBottom = '38px';
    }
    env.appendChild(el);

    var preench = el.querySelector('.simi-slide-preench');
    var rotulo = el.querySelector('.simi-slide-rotulo');
    var pol = el.querySelector('.simi-polegar');
    var POL = 46, MARG = 3;
    var pos = 0, inicioX = 0, pos0 = 0, arrastando = false, acionado = false;

    if (cfg.inv) {
      pol.style.left = 'auto';
      pol.style.right = MARG + 'px';
    }

    function maximo() { return Math.max(1, el.clientWidth - POL - 2 * MARG); }

    function desenhar(animado) {
      var t = animado ? 'transform .25s ease, width .25s ease' : 'none';
      pol.style.transition = t;
      preench.style.transition = t;
      pol.style.transform = 'translateX(' + (cfg.inv ? -pos : pos) + 'px)';
      preench.style.width = acionado ? '100%' : (pos + POL + MARG) + 'px';
      rotulo.style.opacity = acionado ? 1 : Math.max(0.15, 1 - pos / maximo());
    }

    function voltar() {
      acionado = false;
      el.classList.remove('acionado');
      pos = 0;
      desenhar(true);
    }

    function acionar() {
      acionado = true;
      el.classList.add('acionado');
      pos = maximo();
      desenhar(true);
      E.dicaVista = true;
      var d = env.querySelector('.simi-dica');
      if (d) { d.remove(); env.style.paddingBottom = ''; }
      depois(250, function () {
        var ok = aoConcluir();
        if (!ok) depois(300, voltar);
      });
    }

    pol.addEventListener('pointerdown', function (e) {
      if (acionado) return;
      arrastando = true;
      inicioX = e.clientX;
      pos0 = pos;
      try { pol.setPointerCapture(e.pointerId); } catch (erro) { /* evento sem captura: segue sem ela */ }
      e.preventDefault();
    });
    pol.addEventListener('pointermove', function (e) {
      if (!arrastando) return;
      var d = (e.clientX - inicioX) * (cfg.inv ? -1 : 1);
      pos = Math.min(maximo(), Math.max(0, pos0 + d));
      desenhar(false);
    });
    function soltar() {
      if (!arrastando) return;
      arrastando = false;
      if (pos / maximo() >= 0.85) acionar(); else voltar();
    }
    pol.addEventListener('pointerup', soltar);
    pol.addEventListener('pointercancel', soltar);
    pol.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !acionado) {
        e.preventDefault();
        acionar();
      }
    });
    desenhar(false);
  }

  // ------------------------------------------------------------------------------------------------ ações do app
  function registrar(a, tipo, det) {
    E.historico.unshift({ aluno: a.id, dia: 0, tipo: tipo, titulo: tipo === 'entrada' ? 'Entrada' : 'Saída', det: det, hora: agoraHHMM(), novo: true });
  }

  function executar(a, acao) {
    if (!E.dentro) {
      folha({
        centro: true, icone: 'fa-location-crosshairs', cor: '#f59e0b', fundo: '#fffbeb', titulo: 'Fora do Perímetro',
        texto: 'Você precisa estar dentro da área da escola para ' + (acao === 'ENTRADA' ? 'registrar a entrada' : acao === 'SOLICITAR_SAIDA' ? 'solicitar a saída' : 'confirmar a saída') +
          '. Quem confere é o servidor, não o aparelho.',
        botoes: [{ rotulo: 'Entendi', classe: 'principal' }]
      });
      return false;
    }
    if (acao === 'ENTRADA') {
      a.status = 'PRESENTE';
      registrar(a, 'entrada', 'Registrada por ' + E.tutor.primeiro + ' pelo app');
      sucesso('ENTRADA');
      mudarSalaTV(a.sala, a.id);
    } else if (acao === 'SOLICITAR_SAIDA') {
      a.status = 'AGUARDANDO';
      a.solicitante = 'tutor';
      sucesso('SOLICITACAO');
      chamarNaTV(a, 'tutor', 'Responsável a caminho');
    } else {
      a.status = 'AUSENTE';
      a.solicitante = null;
      registrar(a, 'saida', 'Retirada por ' + E.tutor.primeiro + ' · confirmada pelo app');
      sucesso('CONFIRMACAO');
      mudarSalaTV(a.sala);
    }
    depois(2900, render);
    renderTV();
    return true;
  }

  var SUCESSO = {
    ENTRADA: ['#10b981', 'Entrada registrada'],
    SOLICITACAO: ['#f87171', 'Saída solicitada'],
    CONFIRMACAO: ['#fbbf24', 'Saída confirmada']
  };

  function sucesso(tipo) {
    var s = SUCESSO[tipo];
    var el = document.createElement('div');
    el.className = 'simi-sucesso';
    el.style.background = s[0];
    el.innerHTML = '<div class="simi-visto"><svg viewBox="0 0 24 24" fill="none" stroke="' + s[0] +
      '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
      '<div>' + s[1] + '</div><div>com sucesso!</div>';
    tela.appendChild(el);
    depois(2500, function () { el.classList.add('some'); });
    depois(2850, function () { el.remove(); });
  }

  function push(titulo, texto, aba) {
    if (!E.push) return;
    var antigo = tela.querySelector('.simi-push');
    if (antigo) antigo.remove();
    var el = document.createElement('div');
    el.className = 'simi-push';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="simi-push-icone"><i class="fas fa-school"></i></span><div><div class="simi-push-app">Inoutchi · agora</div>' +
      '<div class="simi-push-titulo">' + esc(titulo) + '</div><div class="simi-push-texto">' + esc(texto) + '</div></div>';
    el.addEventListener('click', function () {
      el.remove();
      if (aba) irPara(aba);
    });
    tela.appendChild(el);
    depois(4600, function () { el.classList.add('sai'); });
    depois(5000, function () { el.remove(); });
  }

  function aviso(texto) {
    var el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:absolute;left:50%;bottom:92px;transform:translateX(-50%);z-index:29;background:#0b2742;color:#fff;' +
      'font-size:12.5px;font-weight:600;padding:9px 14px;border-radius:12px;max-width:88%;text-align:center;box-shadow:0 10px 24px -8px rgba(0,0,0,.4)';
    el.textContent = texto;
    tela.appendChild(el);
    depois(2600, function () { el.remove(); });
  }

  // folha (modal) dentro do celular
  function folha(op) {
    var camada = document.createElement('div');
    camada.className = 'simi-camada' + (op.centro ? ' centro' : '');
    var corpo = '<div class="simi-folha" role="dialog" aria-modal="true">';
    if (op.icone) corpo += '<div class="simi-folha-icone" style="background:' + (op.fundo || '#e8f2fc') + ';color:' + (op.cor || '#1a6fc4') + '"><i class="fas ' + op.icone + '"></i></div>';
    corpo += '<h4>' + esc(op.titulo) + '</h4>';
    if (op.texto) corpo += '<p>' + esc(op.texto) + '</p>';
    if (op.html) corpo += op.html;
    corpo += '<div class="simi-acoes">' + (op.botoes || []).map(function (b, i) {
      return '<button type="button" class="simi-btn ' + (b.classe || 'secundario') + '" data-botao="' + i + '">' + b.rotulo + '</button>';
    }).join('') + '</div></div>';
    camada.innerHTML = corpo;
    function fechar() { camada.remove(); }
    camada.addEventListener('click', function (e) {
      if (e.target === camada) { fechar(); return; }
      var b = e.target.closest('[data-botao]');
      if (!b) return;
      var cfg = op.botoes[+b.getAttribute('data-botao')];
      var manter = cfg.acao ? cfg.acao(camada) === false : false;
      if (!manter) fechar();
    });
    tela.appendChild(camada);
    var foco = camada.querySelector('input, select, [data-botao]');
    if (foco) foco.focus({ preventScroll: true });
    if (op.aoAbrir) op.aoAbrir(camada);
    return camada;
  }

  // ------------------------------------------------------------------------------------------------ tokens
  function novoToken() {
    var opcoes = E.alunos.map(function (a) { return '<option value="' + a.id + '">' + esc(a.nome) + '</option>'; }).join('');
    folha({
      titulo: 'Gerar Token de Acesso',
      texto: 'Quem irá buscar o aluno? A pessoa recebe um link com QR code e um código de 6 dígitos.',
      html: '<div style="text-align:left">' +
        '<div class="simi-campo"><label for="simi-tk-aluno">Para qual aluno?</label><select id="simi-tk-aluno">' + opcoes + '</select></div>' +
        '<div class="simi-campo"><label for="simi-tk-nome">Nome do destinatário</label><input id="simi-tk-nome" placeholder="Ex: Maria da Silva" maxlength="40"></div>' +
        '<div class="simi-campo"><label for="simi-tk-par">Parentesco</label><select id="simi-tk-par"><option>Avó</option><option>Avô</option><option>Tia</option><option>Tio</option><option>Irmã</option><option>Irmão</option><option>Amigo(a) da família</option><option>Transporte escolar</option></select></div>' +
        '<div class="simi-linha-chave"><span>Token reutilizável<span class="simi-ajuda" style="display:block">Permite usar o mesmo token várias vezes até a data escolhida (no máximo 1 ano).</span></span>' +
        '<button type="button" class="simi-chave" id="simi-tk-reuso" aria-pressed="false" aria-label="Token reutilizável"></button></div>' +
        '</div>',
      botoes: [
        { rotulo: 'Cancelar', classe: 'secundario' },
        {
          rotulo: 'Gerar Token', classe: 'ambar', acao: function (c) {
            var nome = c.querySelector('#simi-tk-nome').value.trim();
            if (nome.length < 2) {
              c.querySelector('#simi-tk-nome').focus();
              c.querySelector('#simi-tk-nome').style.borderColor = '#ef4444';
              return false;
            }
            var reuso = c.querySelector('#simi-tk-reuso').classList.contains('ligada');
            var codigo = String(Math.floor(100000 + Math.random() * 900000));
            var t = {
              id: E.proximoToken++, aluno: +c.querySelector('#simi-tk-aluno').value, nome: nome,
              parentesco: c.querySelector('#simi-tk-par').value, codigo: codigo.slice(0, 3) + ' ' + codigo.slice(3),
              reutilizavel: reuso, validade: reuso ? 'Válido até ' + fimDoMes() : 'Vale até o fim de hoje', situacao: 'ATIVOS'
            };
            E.tokens.unshift(t);
            E.filtroTokens = 'ATIVOS';
            render();
            depois(150, function () { verToken(t, true); });
          }
        }
      ],
      aoAbrir: function (c) {
        var k = c.querySelector('#simi-tk-reuso');
        k.addEventListener('click', function () {
          k.classList.toggle('ligada');
          k.setAttribute('aria-pressed', k.classList.contains('ligada'));
        });
      }
    });
  }

  function verToken(t, novo) {
    folha({
      centro: true,
      titulo: novo ? 'Token Gerado com Sucesso!' : 'Token de ' + t.nome,
      texto: 'Compartilhe o link abaixo com ' + t.nome + '. Na portaria, ela mostra o QR code ou informa o código de 6 dígitos e apresenta um documento.',
      html: '<div class="simi-qr" id="simi-qr"></div><div class="simi-token-codigo" style="text-align:center">' + esc(t.codigo) + '</div>' +
        '<div class="simi-link">inoutchi.com/t/simulacao-' + esc(t.codigo.replace(' ', '')) + ' (link de demonstração)</div>',
      botoes: [
        { rotulo: '<i class="fas fa-share-nodes"></i>Compartilhar', classe: 'principal', acao: function () { aviso('Link copiado! (simulação)'); return false; } },
        { rotulo: 'Fechar', classe: 'secundario' }
      ],
      aoAbrir: function (c) {
        var alvo = c.querySelector('#simi-qr');
        if (window.QRCode) {
          try {
            new window.QRCode(alvo, { text: 'INOUTCHI-SIMULACAO-' + t.codigo.replace(' ', ''), width: 150, height: 150, colorDark: '#0b2742', colorLight: '#ffffff' });
          } catch (e) { alvo.innerHTML = '<i class="fas fa-qrcode" style="font-size:110px;color:#0b2742"></i>'; }
        } else {
          alvo.innerHTML = '<i class="fas fa-qrcode" style="font-size:110px;color:#0b2742"></i>';
        }
      }
    });
  }

  function revogar(t) {
    folha({
      centro: true, icone: 'fa-ban', cor: '#ef4444', fundo: '#fef2f2', titulo: 'Revogar Token',
      texto: 'Tem certeza que deseja revogar este token? Essa ação não pode ser desfeita.',
      botoes: [
        { rotulo: 'Cancelar', classe: 'secundario' },
        {
          rotulo: 'Revogar', classe: 'perigo', acao: function () {
            t.situacao = 'REVOGADOS';
            t.validade = 'Revogado em ' + dataCurta(0) + ', ' + agoraHHMM();
            render();
            aviso('Token revogado');
          }
        }
      ]
    });
  }

  function usarToken(t) {
    var a = aluno(t.aluno);
    if (a.status !== 'PRESENTE') {
      aviso(a.nome.split(' ')[0] + ' precisa estar na escola para a retirada (registre a entrada na Portaria).');
      return;
    }
    a.status = 'AGUARDANDO';
    a.solicitante = 'token';
    a.token = t;
    E.aba = 'PORTARIA';
    render();
    chamarNaTV(a, 'token', t.nome + ' (' + t.parentesco + ') na portaria');
    push('Retirada por terceiro', t.nome + ' (' + t.parentesco + ') está na portaria para buscar ' + a.nome.split(' ')[0] + '.', 'PORTARIA');
    a.timerToken = depois(6500, function () {
      if (a.token !== t) return;
      a.status = 'AUSENTE';
      a.solicitante = null;
      a.token = null;
      if (!t.reutilizavel) {
        t.situacao = 'USADOS';
        t.validade = 'Usado em ' + dataCurta(0) + ', ' + agoraHHMM();
      }
      registrar(a, 'saida', 'Retirada por ' + t.nome + ' (' + t.parentesco + ') · token verificado na portaria');
      push('Saída confirmada', a.nome.split(' ')[0] + ' saiu com ' + t.nome + ' às ' + agoraHHMM() + '. A portaria conferiu o código e o documento.', 'HISTORICO');
      render();
    });
  }

  function recusar(a) {
    var t = a.token;
    if (!t) return;
    folha({
      centro: true, icone: 'fa-hand', cor: '#ef4444', fundo: '#fef2f2', titulo: 'Recusar a retirada?',
      texto: 'A portaria é avisada para não liberar ' + a.nome.split(' ')[0] + ' e o token de ' + t.nome + ' é revogado na hora.',
      botoes: [
        { rotulo: 'Cancelar', classe: 'secundario' },
        {
          rotulo: 'Recusar', classe: 'perigo', acao: function () {
            clearTimeout(a.timerToken);
            a.status = 'PRESENTE';
            a.solicitante = null;
            a.token = null;
            t.situacao = 'REVOGADOS';
            t.validade = 'Revogado na recusa, ' + agoraHHMM();
            render();
            push('Retirada recusada', 'A portaria foi avisada e o token de ' + t.nome + ' foi revogado.', 'TOKENS');
          }
        }
      ]
    });
  }

  // ------------------------------------------------------------------------------------------------ config
  function abrirConfig(acao) {
    var t = E.tutor;
    if (acao === 'dados') {
      folha({
        titulo: 'Meus Dados Pessoais',
        html: '<div style="text-align:left">' +
          '<div class="simi-campo"><label>Nome completo</label><input id="simi-c-nome" value="' + esc(t.nome) + '"></div>' +
          '<div class="simi-campo"><label>CPF</label><input value="' + esc(t.cpf) + '" disabled></div>' +
          '<div class="simi-campo"><label>Telefone</label><input id="simi-c-tel" value="' + esc(t.telefone) + '"></div>' +
          '<div class="simi-campo"><label>E-mail</label><input id="simi-c-email" value="' + esc(t.email) + '"></div></div>',
        botoes: [{ rotulo: 'Cancelar' }, {
          rotulo: 'Salvar alterações', classe: 'principal', acao: function (c) {
            var nome = c.querySelector('#simi-c-nome').value.trim();
            if (nome) { t.nome = nome; t.primeiro = nome.split(' ')[0]; }
            t.telefone = c.querySelector('#simi-c-tel').value.trim() || t.telefone;
            t.email = c.querySelector('#simi-c-email').value.trim() || t.email;
            render();
            aviso('Dados salvos (simulação)');
          }
        }]
      });
    } else if (acao === 'filhos') {
      folha({
        titulo: 'Meus filhos',
        html: '<div style="text-align:left;margin-top:8px">' + E.alunos.map(function (a) {
          return '<div class="simi-cartao" style="margin-top:10px"><div class="simi-aluno-nome">' + esc(a.nome) + '</div>' +
            '<div class="simi-linha"><span class="simi-aluno-sala">' + esc(a.sala) + '</span>' + seloStatus(a.status) + '</div></div>';
        }).join('') + '</div>',
        botoes: [{ rotulo: 'Fechar' }]
      });
    } else if (acao === 'senha') {
      folha({
        titulo: 'Trocar senha',
        html: '<div style="text-align:left">' +
          '<div class="simi-campo"><label>Senha atual</label><input type="password" id="simi-s1" autocomplete="off"></div>' +
          '<div class="simi-campo"><label>Nova senha</label><input type="password" id="simi-s2" placeholder="Mínimo de 6 caracteres" autocomplete="off"></div>' +
          '<div class="simi-campo"><label>Confirmar nova senha</label><input type="password" id="simi-s3" autocomplete="off"></div>' +
          '<p class="simi-ajuda" id="simi-s-erro" style="color:#ef4444"></p></div>',
        botoes: [{ rotulo: 'Cancelar' }, {
          rotulo: 'Salvar nova senha', classe: 'principal', acao: function (c) {
            var s2 = c.querySelector('#simi-s2').value, s3 = c.querySelector('#simi-s3').value;
            var erro = c.querySelector('#simi-s-erro');
            if (!c.querySelector('#simi-s1').value) { erro.textContent = 'Informe a senha atual.'; return false; }
            if (s2.length < 6) { erro.textContent = 'A nova senha precisa ter no mínimo 6 caracteres.'; return false; }
            if (s2 !== s3) { erro.textContent = 'As senhas não conferem.'; return false; }
            aviso('Senha alterada (simulação: nada foi enviado)');
          }
        }]
      });
    } else if (acao === 'biometria') {
      if (E.biometria) {
        folha({
          centro: true, icone: 'fa-fingerprint', titulo: 'Remover login por biometria?',
          texto: 'O botão de biometria deixa de funcionar neste aparelho até você entrar de novo com e-mail e senha.',
          botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Remover', classe: 'perigo', acao: function () { E.biometria = false; render(); } }]
        });
      } else {
        E.biometria = true;
        render();
        aviso('Biometria ativada (simulação)');
      }
    } else if (acao === 'idioma') {
      var idiomas = ['Português (Brasil)', 'English', 'Español'];
      folha({
        titulo: 'Idioma', texto: 'Escolha o idioma do aplicativo',
        html: '<div class="simi-campo" style="text-align:left"><select id="simi-idioma">' + idiomas.map(function (i) {
          return '<option' + (i === E.idioma ? ' selected' : '') + '>' + i + '</option>';
        }).join('') + '</select></div>',
        botoes: [{ rotulo: 'Cancelar' }, {
          rotulo: 'Salvar', classe: 'principal', acao: function (c) {
            E.idioma = c.querySelector('#simi-idioma').value;
            render();
            aviso('Idioma salvo. Nesta simulação as telas continuam em português.');
          }
        }]
      });
    } else if (acao === 'push') {
      E.push = !E.push;
      render();
      aviso(E.push ? 'Notificações ligadas' : 'Notificações desligadas: você não verá os avisos da simulação');
    } else if (acao === 'ajuda') {
      folha({
        titulo: 'Central de Ajuda',
        html: '<div class="simi-lista" style="margin-top:12px;text-align:left">' +
          '<a class="simi-item" href="tel:+5548999327641"><span class="simi-item-icone"><i class="fas fa-phone"></i></span><span class="simi-item-texto"><span class="simi-item-titulo" style="display:block">Telefone</span><span class="simi-item-sub" style="display:block">(48) 99932-7641</span></span></a>' +
          '<a class="simi-item" href="mailto:tiarlei@inoutchi.com"><span class="simi-item-icone"><i class="fas fa-envelope"></i></span><span class="simi-item-texto"><span class="simi-item-titulo" style="display:block">E-mail</span><span class="simi-item-sub" style="display:block">tiarlei@inoutchi.com</span></span></a></div>',
        botoes: [{ rotulo: 'Fechar' }]
      });
    } else if (acao === 'tutorial') {
      window.open('assets/docs/Tutorial_Tutor_V2.pdf', '_blank', 'noopener');
    } else if (acao === 'privacidade') {
      window.open('politica-privacidade.html', '_blank', 'noopener');
    } else if (acao === 'excluir') {
      folha({
        centro: true, icone: 'fa-triangle-exclamation', cor: '#ef4444', fundo: '#fef2f2', titulo: 'Tem certeza absoluta?',
        texto: 'Esta ação é irreversível: seus dados pessoais serão anonimizados, seu acesso será desativado e os vínculos com seus filhos serão removidos. O histórico de entradas e saídas da escola é mantido.',
        html: '<div class="simi-campo" style="text-align:left"><label for="simi-excluir">Digite EXCLUIR para confirmar:</label><input id="simi-excluir" placeholder="Digite EXCLUIR" autocomplete="off"></div>',
        botoes: [{ rotulo: 'Cancelar' }, {
          rotulo: 'Excluir conta', classe: 'perigo', acao: function (c) {
            if (c.querySelector('#simi-excluir').value.trim().toUpperCase() !== 'EXCLUIR') {
              c.querySelector('#simi-excluir').style.borderColor = '#ef4444';
              return false;
            }
            reiniciar();
            aviso('Na simulação nada é apagado: tudo voltou ao início.');
          }
        }]
      });
    }
  }

  // ------------------------------------------------------------------------------------------------ cliques no celular
  tela.addEventListener('click', function (e) {
    var aba = e.target.closest('[data-aba]');
    if (aba) { irPara(aba.getAttribute('data-aba')); return; }
    var el = e.target.closest('[data-acao]');
    if (!el || !tela.contains(el)) return;
    var acao = el.getAttribute('data-acao');
    var id = +el.getAttribute('data-id');
    switch (acao) {
      case 'sino': irPara('MURAL'); break;
      case 'sair':
        folha({
          centro: true, icone: 'fa-right-from-bracket', cor: '#ef4444', fundo: '#fef2f2', titulo: 'Sair da conta',
          texto: 'Tem certeza que deseja encerrar sua sessão? Na simulação, sair recomeça tudo do início.',
          botoes: [{ rotulo: 'Cancelar' }, { rotulo: 'Sair', classe: 'perigo', acao: function () { reiniciar(); } }]
        });
        break;
      case 'historico': E.histAluno = id; irPara('HISTORICO'); break;
      case 'aprox': alternarAprox(aluno(id)); break;
      case 'recusar': recusar(aluno(id)); break;
      case 'filtro-mural': E.filtroMural = el.getAttribute('data-f'); render(); break;
      case 'msg':
        E.mural.forEach(function (m) {
          if (m.id === id) { m.aberta = !m.aberta; m.lida = true; }
        });
        render();
        break;
      case 'novo-token': novoToken(); break;
      case 'filtro-token': E.filtroTokens = el.getAttribute('data-f'); render(); break;
      case 'ver-token': verToken(E.tokens.filter(function (t) { return t.id === id; })[0]); break;
      case 'revogar': revogar(E.tokens.filter(function (t) { return t.id === id; })[0]); break;
      case 'usar-token': usarToken(E.tokens.filter(function (t) { return t.id === id; })[0]); break;
      case 'hist-aluno': E.histAluno = id; render(); break;
      default: abrirConfig(acao);
    }
  });

  tela.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('data-acao') === 'msg') {
      e.preventDefault();
      e.target.click();
    }
  });

  function alternarAprox(a) {
    if (!a.aprox) {
      folha({
        centro: true, icone: 'fa-satellite-dish', titulo: 'Chamar quando você chegar',
        texto: 'Para chamar seu filho sozinho quando você chegar à escola, o Inoutchi usa a sua localização também com o app fechado. ' +
          'A posição serve só para saber se você está perto da escola e nunca é gravada.',
        botoes: [{ rotulo: 'Agora não' }, {
          rotulo: 'Continuar', classe: 'principal', acao: function () {
            a.aprox = true;
            render();
            aviso('Ligado! Use "Chegar" nos controles para simular a chegada.');
          }
        }]
      });
    } else {
      a.aprox = false;
      render();
    }
  }

  // ------------------------------------------------------------------------------------------------ controles da simulação
  function renderControles() {
    var seg = document.getElementById('simi-seg-area');
    seg.children[0].classList.toggle('ativo', E.dentro);
    seg.children[1].classList.toggle('ativo', !E.dentro);
    var som = raiz.querySelector('[data-ctrl="som"]');
    som.classList.toggle('ligada', E.som);
    som.setAttribute('aria-pressed', E.som);
    raiz.querySelector('[data-ctrl="afastar"]').disabled = !E.alunos.some(function (a) { return a.status === 'AGUARDANDO' && a.solicitante === 'tutor'; });
  }

  raiz.querySelector('.simi-controles').addEventListener('click', function (e) {
    var b = e.target.closest('[data-ctrl]');
    if (!b) return;
    var c = b.getAttribute('data-ctrl');
    if (c === 'dentro' || c === 'fora') {
      E.dentro = c === 'dentro';
      render();
    } else if (c === 'som') {
      E.som = !E.som;
      if (E.som) tocar(null);
      renderControles();
    } else if (c === 'reiniciar') {
      reiniciar();
    } else if (c === 'chegar') {
      E.dentro = true;
      var chamados = E.alunos.filter(function (a) { return a.aprox && a.status === 'PRESENTE'; });
      E.aba = 'PORTARIA';
      if (!chamados.length) {
        render();
        aviso('Ligue a "Chamada por Aproximação" de um aluno que esteja na escola.');
        return;
      }
      chamados.forEach(function (a) {
        a.status = 'AGUARDANDO';
        a.solicitante = 'tutor';
        chamarNaTV(a, 'tutor', 'Chamado por aproximação');
        push('Chamada por Aproximação', a.nome.split(' ')[0] + ' foi chamado(a) automaticamente: você chegou à escola.', 'PORTARIA');
      });
      render();
    } else if (c === 'afastar') {
      E.dentro = false;
      E.alunos.forEach(function (a) {
        if (a.status === 'AGUARDANDO' && a.solicitante === 'tutor') {
          a.status = 'AUSENTE';
          a.solicitante = null;
          registrar(a, 'saida', 'Confirmada automaticamente: ' + E.tutor.primeiro + ' saiu da área por 3 minutos');
          push('Saída confirmada', 'Você se afastou da escola por 3 minutos com ' + a.nome.split(' ')[0] + ': a saída foi confirmada.', 'HISTORICO');
        }
      });
      render();
    }
  });

  // ------------------------------------------------------------------------------------------------ TV da sala
  var salasTV = document.getElementById('simi-tv-salas');
  var grade = document.getElementById('simi-tv-grade');
  var telaTV = document.getElementById('simi-tv-tela');
  var chegando = {};

  function renderSalasTV() {
    salasTV.innerHTML = Object.keys(COLEGAS).map(function (s) {
      return '<button type="button" class="simi-tv-sala-btn' + (E.salaTV === s ? ' ativo' : '') + '" data-sala="' + s + '">TV da sala ' + s + '</button>';
    }).join('');
  }

  salasTV.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sala]');
    if (!b) return;
    E.salaTV = b.getAttribute('data-sala');
    renderTV();
  });

  function renderTV() {
    renderSalasTV();
    document.getElementById('simi-tv-titulo').textContent = 'Sala ' + E.salaTV + ' · ' + (new Date().getHours() < 12 ? 'Manhã' : 'Tarde');
    var nosso = E.alunos.filter(function (a) { return a.sala === E.salaTV; })[0];
    grade.innerHTML = COLEGAS[E.salaTV].map(function (nome) {
      if (nome) return '<div class="simi-tv-card"><div class="simi-tv-nome">' + esc(nome) + '</div><div class="simi-tv-hora">Presente</div></div>';
      if (!nosso || nosso.status === 'AUSENTE') return '<div class="simi-tv-card vazio"></div>';
      var pend = nosso.status === 'AGUARDANDO';
      var cls = 'simi-tv-card' + (pend ? ' pendente ' + nosso.solicitante : '') + (chegando[nosso.id] ? ' chega' : '');
      return '<div class="' + cls + '"><div class="simi-tv-nome">' + esc(nosso.curto) + '</div><div class="simi-tv-hora">' + (pend ? 'Aguardando' : 'Presente') + '</div></div>';
    }).join('');
    chegando = {};
  }

  function mudarSalaTV(sala, chegouId) {
    E.salaTV = sala;
    if (chegouId) chegando[chegouId] = true;
    renderTV();
  }

  function chamarNaTV(a, tipo, sub) {
    mudarSalaTV(a.sala);
    var antigo = telaTV.querySelector('.simi-tv-destaque');
    if (antigo) antigo.remove();
    var d = document.createElement('div');
    d.className = 'simi-tv-destaque';
    d.innerHTML = '<div class="simi-tv-destaque-card ' + tipo + '"><div class="simi-tv-destaque-nome">' + esc(a.curto) + '</div>' +
      '<div class="simi-tv-destaque-sub">' + esc(sub) + '</div></div>';
    telaTV.appendChild(d);
    tocar(a);
    convidarParaTV();
    depois(3600, function () { d.classList.add('some'); });
    depois(4000, function () { d.remove(); });
  }

  // Em telas estreitas a TV fica abaixo do celular: um botão flutuante leva até ela quando o aluno é chamado.
  function convidarParaTV() {
    var tv = raiz.querySelector('.simi-tv');
    var r = tv.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    var antigo = raiz.querySelector('.simi-ir-tv');
    if (antigo) antigo.remove();
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'simi-ir-tv';
    b.innerHTML = '<i class="fas fa-tv"></i> Ver o aluno na TV da sala';
    b.addEventListener('click', function () {
      b.remove();
      var rr = tv.getBoundingClientRect();
      var alvo = window.pageYOffset + rr.top - Math.max(0, (window.innerHeight - rr.height) / 2);
      window.scrollTo({ top: alvo, behavior: REDUZIR ? 'auto' : 'smooth' });
    });
    raiz.appendChild(b);
    depois(6000, function () { b.remove(); });
  }

  // som: dois toques suaves + o nome em voz (só se o visitante ligar o som)
  var audio = null;

  function tocar(a) {
    if (!E.som) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var t0 = audio.currentTime;
      [660, 880].forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.22);
        g.gain.exponentialRampToValueAtTime(0.25, t0 + i * 0.22 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.22 + 0.5);
        o.connect(g);
        g.connect(audio.destination);
        o.start(t0 + i * 0.22);
        o.stop(t0 + i * 0.22 + 0.55);
      });
    } catch (e) { /* sem áudio: segue só o visual */ }
    if (a && window.speechSynthesis) {
      depois(700, function () {
        try {
          var u = new SpeechSynthesisUtterance(a.curto + ', ' + a.sala);
          u.lang = 'pt-BR';
          u.rate = 0.95;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch (e) { }
      });
    }
  }

  // ------------------------------------------------------------------------------------------------ relógios e reinício
  setInterval(function () {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0'), ss = String(d.getSeconds()).padStart(2, '0');
    document.getElementById('simi-tv-hora').textContent = hh + ':' + mm + ':' + ss;
    document.getElementById('simi-relogio').textContent = hh + ':' + mm;
  }, 1000);
  document.getElementById('simi-tv-hora').textContent = agoraHHMM();

  function reiniciar() {
    limparTimers();
    if (window.speechSynthesis) try { window.speechSynthesis.cancel(); } catch (e) { }
    var som = E.som;
    E = estadoInicial();
    E.som = som;
    Array.prototype.forEach.call(tela.querySelectorAll('.simi-camada, .simi-sucesso, .simi-push'), function (n) { n.remove(); });
    var d = telaTV.querySelector('.simi-tv-destaque');
    if (d) d.remove();
    render();
    conteudo.scrollTop = 0;
  }

  render();
})();
