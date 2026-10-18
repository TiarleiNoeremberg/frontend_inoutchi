/* Animação "Como funciona" (página /como-funciona.html).
   Cada cena é uma função pura do tempo: quadro(t) desenha tudo para o instante t, então pausar, voltar e pular de cena é trivial.
   Tudo é ilustrativo: nomes e horários fictícios; o mapa NÃO mostra rastreamento (o app mede a distância no próprio aparelho). */
(function () {
  'use strict';
  var raiz = document.getElementById('anim');
  if (!raiz) return;

  raiz.classList.add('anim');
  var REDUZIR = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------------------------------------------------------- utilitários */
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function suave(u) { return u * u * (3 - 2 * u); }
  function dentro(t, a, b) { return t >= a && t < b; }

  function Caminho(pts) {
    this.p = pts; this.c = [0];
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
      this.c.push(this.c[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    this.L = this.c[this.c.length - 1];
  }
  Caminho.prototype.em = function (f) {
    f = clamp(f, 0, 1);
    var d = f * this.L, i = 1;
    while (i < this.c.length - 1 && this.c[i] < d) i++;
    var a = this.p[i - 1], b = this.p[i], u = (d - this.c[i - 1]) / ((this.c[i] - this.c[i - 1]) || 1);
    return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI };
  };
  Caminho.prototype.fracaoNoAnel = function (cx, cy, r) {
    for (var i = 0; i <= 1000; i++) {
      var q = this.em(i / 1000), dx = q.x - cx, dy = q.y - cy;
      if (dx * dx + dy * dy <= r * r) return i / 1000;
    }
    return 1;
  };

  /* ---------------------------------------------------------------- geometria do mapa */
  var ESC = { x: 453, y: 169 };            // centro da escola e da cerca
  var RAIO = 165;                          // raio da cerca (unidades do desenho)
  var M_POR_U = 200 / RAIO;                // 200 m de cerca no desenho
  var ESTRADA = new Caminho([[24, 330], [230, 330], [230, 215], [378, 215]]);
  var F_ENTRA = ESTRADA.fracaoNoAnel(ESC.x, ESC.y, RAIO);
  var QUIOSQUE = new Caminho([[24, 330], [230, 330], [230, 215], [342, 215]]);
  var F_ENTRA_Q = QUIOSQUE.fracaoNoAnel(ESC.x, ESC.y, RAIO);

  function distM(x, y) { var dx = x - ESC.x, dy = y - ESC.y; return Math.sqrt(dx * dx + dy * dy) * M_POR_U; }

  /* QR ilustrativo (não é um QR real) */
  function qrSvg(semente) {
    var n = 21, s = '', r = semente;
    function rnd() { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x7fffffff; }
    function achado(x, y) { return (x < 7 && y < 7) || (x > n - 8 && y < 7) || (x < 7 && y > n - 8); }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var on;
      if (achado(x, y)) {
        var ax = x < 7 ? x : x - (n - 7), ay = y < 7 ? y : y - (n - 7);
        on = (ax === 0 || ax === 6 || ay === 0 || ay === 6) || (ax >= 2 && ax <= 4 && ay >= 2 && ay <= 4);
      } else on = rnd() > 0.52;
      if (on) s += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>';
    }
    return '<svg viewBox="0 0 ' + n + ' ' + n + '" fill="#0f172a" shape-rendering="crispEdges">' + s + '</svg>';
  }

  /* ---------------------------------------------------------------- DOM */
  var CELULAR = function (id, rotulo) {
    return '<div class="tel" id="' + id + '"><div class="tel-tela">' +
      '<div class="tel-bar"><span>Inoutchi</span><small>' + rotulo + '</small></div>' +
      '<div class="tel-corpo">' +
        /* tela 1: chamada por aproximação */
        '<div class="tel-s" data-s="prox">' +
          '<div class="tel-cartao tel-aluno"><div class="tel-av" data-r="av">P</div><div><b data-r="aluno">Pedro Lima</b><span data-r="turma">2º A · na escola</span></div></div>' +
          '<div class="tel-cartao"><div class="tel-linha"><span>Chamada por aproximação</span><span class="tel-chave" data-r="chave"></span></div></div>' +
          '<div class="tel-pilula" data-r="pil"><i></i><span data-r="pilt">Fora da área da escola</span></div>' +
          '<div class="tel-num">Distância até a escola<br><b data-r="dist">560 m</b></div>' +
          '<div class="tel-selo azul" data-r="selo1">Pedro foi chamado na sala</div>' +
          '<div class="tel-num" data-r="rel" style="opacity:0">Fora da cerca há <b data-r="relt">0:00</b> <small>(tempo acelerado)</small></div>' +
        '</div>' +
        /* tela 2: gerar token */
        '<div class="tel-s" data-s="token">' +
          '<div class="tel-cartao"><b>Retirada por token</b><div class="tel-num">Para Davi Souza</div></div>' +
          '<div class="tel-campo"><small>Quem vai buscar</small>Carlos (amigo)</div>' +
          '<div class="tel-campo"><small>Validade</small>Uso único · hoje</div>' +
          '<div class="tel-btn" data-r="btnToken">Gerar token</div>' +
          '<div class="tel-selo verde" data-r="selo2">Token enviado ao Carlos</div>' +
        '</div>' +
        /* tela 3: portador do token */
        '<div class="tel-s" data-s="portador">' +
          '<div class="tel-cartao"><b>Retirar o Davi</b><div class="tel-num">Autorizado por Rafaela</div></div>' +
          '<div class="tel-pilula" data-r="pil2"><i></i><span data-r="pil2t">Fora da área da escola</span></div>' +
          '<div class="tel-btn" data-r="btnSolic">Solicitar saída</div>' +
          '<div class="tel-qr" data-r="qr" style="opacity:0">' + qrSvg(7) + '</div>' +
          '<div class="tel-cod" data-r="cod" style="opacity:0">482 917</div>' +
        '</div>' +
        /* tela 4: apenas o aviso */
        '<div class="tel-s" data-s="vazio"><div class="tel-num" style="text-align:center;margin-top:30%">Nenhuma novidade por enquanto</div></div>' +
      '</div>' +
      '<div class="tel-push" data-r="push"><b data-r="pusht">Saída confirmada</b><span data-r="pushx"></span></div>' +
      '<div class="tel-dedo" data-r="dedo"></div>' +
    '</div></div>';
  };

  var TV = function () {
    return '<div class="tv" id="tv">' +
      '<div class="tv-modo" data-m="sala"><div class="tv-cab"><span data-r="salaT">Sala 2º A</span><small>Painel da sala</small></div><div class="tv-meio">Aula em andamento</div></div>' +
      '<div class="tv-modo" data-m="portaria"><div class="tv-cab"><span>Portaria · Retiradas</span><small>perfil diretor</small></div>' +
        '<div class="por-item"><b data-r="porNome">Davi Souza</b><span data-r="porSub">retirada por Carlos · token de Rafaela</span></div>' +
        '<div class="por-leitor"><div class="por-cam"><div class="qr" data-r="porQr">' + qrSvg(7) + '</div><div class="cantos"></div><div class="laser" data-r="laser"></div></div>' +
        '<div class="por-lado"><div class="por-botao">Ler QR code</div><div class="por-estado" data-r="porEst">Aguardando leitura</div></div></div></div>' +
      '<div class="tv-modo" data-m="saguao"><div class="tv-cab"><span>Saguão · Saídas</span><small>painel</small></div>' +
        '<div class="sag-item" data-r="sag1"><span data-r="sag1t">Lucas Rocha</span><em data-r="sag1e">chamado</em></div></div>' +
      '<div class="tv-chamado" data-r="chamado"><span class="sino">🔔</span><b data-r="chNome">PEDRO LIMA</b><span data-r="chSub">Chamado para a saída</span><small data-r="chQuem">Quem busca: Marina</small><div class="tv-som"><i></i><i></i><i></i></div></div>' +
      '<div class="tv-ok" data-r="ok">Saída confirmada</div>' +
    '</div>';
  };

  var MAPA = (function () {
    var rua = 'M24,330 L230,330 L230,215 L378,215';
    return '<svg viewBox="0 0 640 380" role="img" aria-label="Mapa ilustrativo visto de cima: a escola cercada por uma cerca virtual e uma rua">' +
      '<rect width="640" height="380" fill="#e8f1fb"/>' +
      '<rect x="40" y="40" width="150" height="110" rx="10" fill="#dbeafe"/><rect x="40" y="170" width="150" height="110" rx="10" fill="#dbeafe"/>' +
      '<rect x="270" y="262" width="150" height="90" rx="10" fill="#dbeafe"/><rect x="560" y="250" width="70" height="110" rx="10" fill="#dbeafe"/>' +
      '<path d="' + rua + '" stroke="#cbd5e1" stroke-width="28" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + rua + '" stroke="#fff" stroke-width="2" stroke-dasharray="10 10" fill="none"/>' +
      '<circle id="anel" cx="' + ESC.x + '" cy="' + ESC.y + '" r="' + RAIO + '" fill="rgba(37,99,235,.09)" stroke="#2563eb" stroke-width="2.6" stroke-dasharray="9 7"/>' +
      '<text x="' + ESC.x + '" y="' + (ESC.y - RAIO + 16) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#1d4ed8">Cerca virtual</text>' +
      '<g id="escola"><rect x="405" y="138" width="96" height="60" rx="6" fill="#4a6fa5"/><rect x="405" y="138" width="96" height="14" rx="6" fill="#3b5b8c"/>' +
        '<rect x="443" y="176" width="20" height="22" fill="#1e3a8a"/><text x="453" y="168" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">ESCOLA</text></g>' +
      '<g id="extrasFacial" style="opacity:0">' +
        '<rect x="334" y="196" width="16" height="34" rx="4" fill="#0f172a"/><rect x="337" y="200" width="10" height="12" rx="2" fill="#38bdf8"/>' +
        '<text x="342" y="246" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">Checkin facial</text>' +
        '<rect x="428" y="204" width="8" height="22" rx="2" fill="#0f172a"/><rect x="470" y="204" width="8" height="22" rx="2" fill="#0f172a"/>' +
        '<text x="453" y="240" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">Catraca com leitor facial</text>' +
        '<g id="rosto1" style="opacity:0"><circle cx="342" cy="182" r="14" fill="#fff" stroke="#38bdf8" stroke-width="2"/><circle cx="338" cy="180" r="1.8" fill="#0f172a"/><circle cx="346" cy="180" r="1.8" fill="#0f172a"/><path d="M337,187 q5,5 10,0" stroke="#0f172a" fill="none" stroke-width="1.6"/><rect id="laser1" x="326" y="168" width="32" height="2.4" fill="#f43f5e"/></g>' +
        '<g id="rosto2" style="opacity:0"><circle cx="453" cy="192" r="14" fill="#fff" stroke="#38bdf8" stroke-width="2"/><circle cx="449" cy="190" r="1.8" fill="#0f172a"/><circle cx="457" cy="190" r="1.8" fill="#0f172a"/><path d="M448,197 q5,5 10,0" stroke="#0f172a" fill="none" stroke-width="1.6"/><rect id="laser2" x="437" y="178" width="32" height="2.4" fill="#f43f5e"/></g>' +
      '</g>' +
      '<g id="carroA" style="opacity:0"><rect x="-17" y="-9" width="34" height="18" rx="6" fill="#2563eb"/><rect x="-1" y="-7" width="11" height="14" rx="3" fill="#dbeafe"/><rect x="-14" y="-7" width="5" height="14" rx="2" fill="#1d4ed8"/><text id="carroAt" x="0" y="-14" text-anchor="middle" font-size="11" font-weight="800" fill="#1e3a8a" transform="rotate(0)">Marina</text></g>' +
      '<g id="carroB" style="opacity:0"><rect x="-17" y="-9" width="34" height="18" rx="6" fill="#16a34a"/><rect x="-1" y="-7" width="11" height="14" rx="3" fill="#dcfce7"/><rect x="-14" y="-7" width="5" height="14" rx="2" fill="#15803d"/><text id="carroBt" x="0" y="-14" text-anchor="middle" font-size="11" font-weight="800" fill="#166534">Carlos</text></g>' +
      '<g id="aluno" style="opacity:0"><circle r="7" fill="#f59e0b" stroke="#fff" stroke-width="2"/><text id="alunoT" y="-12" text-anchor="middle" font-size="10" font-weight="800" fill="#92400e">Pedro</text></g>' +
    '</svg>';
  })();

  var ESCRITORIO = '<svg viewBox="0 0 640 380" role="img" aria-label="Ilustração: uma pessoa trabalhando em um escritório">' +
    '<rect width="640" height="380" fill="#eef2ff"/><rect y="290" width="640" height="90" fill="#c7d2fe"/>' +
    '<rect x="120" y="90" width="150" height="100" rx="8" fill="#fff" stroke="#c7d2fe" stroke-width="3"/><path d="M130,175 l30,-40 l25,25 l30,-50 l40,55" stroke="#60a5fa" stroke-width="4" fill="none"/>' +
    '<rect x="240" y="230" width="260" height="14" rx="4" fill="#64748b"/><rect x="262" y="244" width="12" height="62" fill="#64748b"/><rect x="466" y="244" width="12" height="62" fill="#64748b"/>' +
    '<rect x="290" y="150" width="130" height="80" rx="6" fill="#1e293b"/><rect x="298" y="158" width="114" height="58" rx="3" fill="#38bdf8"/><rect x="345" y="230" width="20" height="8" fill="#475569"/>' +
    '<circle cx="470" cy="170" r="24" fill="#fbbf24"/><rect x="448" y="194" width="44" height="40" rx="14" fill="#2563eb"/>' +
    '<text x="470" y="270" text-anchor="middle" font-size="13" font-weight="700" fill="#1e3a8a">Marcos, no trabalho</text>' +
    '</svg>';

  raiz.innerHTML =
    '<div class="anim-in">' +
      '<div class="anim-topo"><div class="anim-cenas" role="group" aria-label="Escolher a cena" id="aCenas"></div>' +
        '<button type="button" class="anim-ctl" id="aAnt" aria-label="Cena anterior">⏮</button>' +
        '<button type="button" class="anim-ctl" id="aPlay" aria-label="Pausar">⏸</button>' +
        '<button type="button" class="anim-ctl" id="aProx" aria-label="Próxima cena">⏭</button></div>' +
      '<div class="anim-barra" id="aBarra" role="progressbar" aria-label="Progresso da cena" aria-valuemin="0" aria-valuemax="100"><i id="aProg"></i></div>' +
      '<div class="anim-palco"><div class="anim-col1">' +
        '<div class="anim-mapa" id="aMapa"><div id="aMapaSvg">' + MAPA + '</div><div id="aEscrit" style="display:none">' + ESCRITORIO + '</div>' +
          '<div class="anim-chip" id="aChip"><i></i><span id="aChipT">Você está fora da área da escola</span></div>' +
          '<div class="anim-selo">Ilustração · nomes fictícios · o app envia só “dentro” ou “fora” da cerca</div></div>' +
        '<div class="anim-legenda" aria-live="polite"><b id="aNum">1</b><p id="aLeg"></p></div></div>' +
        '<div class="anim-aps" id="aAps">' +
          '<div class="anim-ap" id="ap1">' + CELULAR('tel1', 'responsável') + '</div>' +
          '<div class="anim-ap" id="ap2">' + CELULAR('tel2', 'portador') + '</div>' +
          '<div class="anim-ap largo" id="ap3">' + TV() + '</div>' +
          '<div class="anim-voo" id="aVoo"><svg viewBox="0 0 32 24" width="2.2em" height="1.7em"><rect x="1" y="1" width="30" height="22" rx="3" fill="#fff" stroke="#2563eb" stroke-width="2"/><path d="M2,3 L16,14 L30,3" fill="none" stroke="#2563eb" stroke-width="2"/></svg></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function $(s) { return raiz.querySelector(s); }
  function R(tel, nome) { return tel.querySelector('[data-r="' + nome + '"]'); }

  var el = {
    mapa: $('#aMapa'), mapaSvg: $('#aMapaSvg'), escr: $('#aEscrit'), chip: $('#aChip'), chipT: $('#aChipT'),
    ap1: $('#ap1'), ap2: $('#ap2'), ap3: $('#ap3'), voo: $('#aVoo'),
    t1: $('#tel1'), t2: $('#tel2'), tv: $('#tv'),
    carroA: $('#carroA'), carroB: $('#carroB'), carroAt: $('#carroAt'), carroBt: $('#carroBt'), aluno: $('#aluno'), alunoT: $('#alunoT'),
    extras: $('#extrasFacial'), rosto1: $('#rosto1'), rosto2: $('#rosto2'), laser1: $('#laser1'), laser2: $('#laser2'), anel: $('#anel'),
    num: $('#aNum'), leg: $('#aLeg'), prog: $('#aProg'), barra: $('#aBarra'), play: $('#aPlay'), cenas: $('#aCenas')
  };

  /* escritas com cache para não mexer no DOM sem necessidade */
  function cls(e, nome, on) { var k = '_c_' + nome; if (e[k] === on) return; e[k] = on; e.classList.toggle(nome, !!on); }
  function txt(e, s) { if (e._t !== s) { e._t = s; e.textContent = s; } }
  function op(e, v) { v = Math.round(v * 100) / 100; if (e._o !== v) { e._o = v; e.style.opacity = v; } }
  function vis(e, on) { if (e._v !== on) { e._v = on; e.hidden = !on; } }
  function pos(g, p, extra) { g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')' + (extra || '')); }

  /* ---------------------------------------------------------------- partes reutilizáveis */
  function telTela(tel, nome) {
    var s = tel.querySelectorAll('[data-s]');
    for (var i = 0; i < s.length; i++) cls(s[i], 'on', s[i].getAttribute('data-s') === nome);
  }
  function telPush(tel, on, titulo, texto) {
    var p = R(tel, 'push');
    if (on) { txt(R(tel, 'pusht'), titulo); txt(R(tel, 'pushx'), texto); }
    cls(p, 'on', on);
  }
  function telDedo(tel, on, x, y) {
    var d = R(tel, 'dedo');
    if (on) { d.style.left = x + '%'; d.style.top = y + '%'; }
    cls(d, 'on', on);
  }
  function pilula(p, textoEl, estado, texto) {
    cls(p, 'dentro', estado === 'dentro'); cls(p, 'aviso', estado === 'aviso'); txt(textoEl, texto);
  }
  function chip(estado, texto) {
    vis(el.chip, !!estado);
    if (!estado) return;
    cls(el.chip, 'dentro', estado === 'dentro'); cls(el.chip, 'aviso', estado === 'aviso'); txt(el.chipT, texto);
  }
  function tvModo(nome) {
    var m = el.tv.querySelectorAll('[data-m]');
    for (var i = 0; i < m.length; i++) cls(m[i], 'on', m[i].getAttribute('data-m') === nome);
  }
  function tvChamado(on, nome, sub, quem) {
    var c = R(el.tv, 'chamado');
    if (on) { txt(R(el.tv, 'chNome'), nome); txt(R(el.tv, 'chSub'), sub); txt(R(el.tv, 'chQuem'), quem); }
    cls(c, 'on', on);
  }
  function tvOk(on, texto) { var o = R(el.tv, 'ok'); if (on) txt(o, texto); cls(o, 'on', on); }
  function anel(flash) {
    var v = flash ? 1 : 0;
    if (el.anel._f !== v) { el.anel._f = v; el.anel.setAttribute('stroke-width', flash ? '4.5' : '2.6'); el.anel.setAttribute('fill', flash ? 'rgba(22,163,74,.16)' : 'rgba(37,99,235,.09)'); el.anel.setAttribute('stroke', flash ? '#16a34a' : '#2563eb'); }
  }
  function hora(h, m, extraMin) { var t = h * 60 + m + (extraMin || 0); return (t / 60 | 0) + ':' + ('0' + (t % 60)).slice(-2); }

  var CENTRO_BTN = { x: 50, y: 69 };

  /* ---------------------------------------------------------------- CENA 1: chamada por aproximação + saída automática */
  var C1 = (function () {
    var T_TOGGLE = 1800, T_INI = 3600, T_FIM = 12600, T_ALUNO = 14600, T_ALUNO_FIM = 17400,
        T_SAI = 18400, T_SAI_FIM = 23400, T_REL = 23400, T_REL_FIM = 29800, DUR = 32500;
    var tCruza = lerp(T_INI, T_FIM, F_ENTRA);
    var porta = { x: 453, y: 198 }, lugar = ESTRADA.em(1);
    var F_SAI = Math.max(0, F_ENTRA - 0.07);
    return {
      id: 'aproximacao', nome: 'Chamada por aproximação', dur: DUR,
      leg: [
        [0, 'Marina vai buscar o Pedro. O app dela mede a distância até a escola, no próprio celular.'],
        [T_TOGGLE, 'Antes de sair, ela liga a chave “Chamada por aproximação”.'],
        [T_INI + 200, 'Enquanto ela está longe da escola, nada acontece.'],
        [tCruza, 'Ao entrar na cerca virtual, o app chama o Pedro sozinho.'],
        [tCruza + 1200, 'A sala vê o nome dele na TV, com aviso sonoro só naquela turma.'],
        [T_ALUNO, 'Quando Marina chega, o Pedro já está pronto: sem fila e sem alto-falante.'],
        [T_SAI, 'Eles saem juntos. Se Marina ficar mais de 3 minutos fora da cerca…'],
        [T_REL_FIM, '…a saída é confirmada automaticamente e o app avisa.']
      ],
      layout: { ap2: false, ap3: true },
      quadro: function (t) {
        var t1 = el.t1;
        telTela(t1, 'prox');
        txt(R(t1, 'aluno'), 'Pedro Lima'); txt(R(t1, 'av'), 'P'); txt(R(t1, 'turma'), t >= T_REL_FIM ? '2º A · saiu da escola' : '2º A · na escola');
        tvModo('sala'); txt(R(el.tv, 'salaT'), 'Sala 2º A');
        el.extras.style.opacity = 0;
        op(el.carroB, 0);
        txt(el.carroAt, 'Marina'); txt(el.alunoT, 'Pedro');

        var ligado = t >= T_TOGGLE + 500;
        cls(R(t1, 'chave'), 'on', ligado);
        telDedo(t1, dentro(t, T_TOGGLE - 100, T_TOGGLE + 700), 82, 38);

        /* posição do carro */
        var f, pos1;
        if (t < T_INI) f = 0; else if (t < T_FIM) f = (t - T_INI) / (T_FIM - T_INI); else f = 1;
        if (t >= T_SAI) f = lerp(1, F_SAI, suave(seg(t, T_SAI, T_SAI_FIM)));
        pos1 = ESTRADA.em(f);
        op(el.carroA, 1);
        pos(el.carroA, pos1, ' rotate(' + (t >= T_SAI ? pos1.ang + 180 : pos1.ang).toFixed(0) + ')');
        el.carroAt.setAttribute('transform', 'rotate(' + (-(t >= T_SAI ? pos1.ang + 180 : pos1.ang)).toFixed(0) + ')');

        var d = distM(pos1.x, pos1.y);
        var estaDentro = f >= F_ENTRA - 0.0001 && !(t >= T_SAI && f < F_ENTRA);
        var saiu = t >= T_SAI && f < F_ENTRA;
        txt(R(t1, 'dist'), Math.max(0, Math.round(d / 10) * 10) + ' m');
        if (estaDentro) { pilula(R(t1, 'pil'), R(t1, 'pilt'), 'dentro', 'Dentro da área da escola'); chip('dentro', 'Você está dentro da cerca virtual'); }
        else { pilula(R(t1, 'pil'), R(t1, 'pilt'), '', 'Fora da área da escola'); chip('fora', 'Você está fora da área da escola'); }
        anel(estaDentro && t < T_ALUNO);

        /* chamada na sala */
        var chamado = t >= tCruza + 400 && t < T_SAI_FIM + 4000;
        var confirmado = t >= T_REL_FIM;
        tvChamado(chamado && !confirmado, 'PEDRO LIMA', 'Chamado para a saída', 'Quem busca: Marina');
        cls(R(t1, 'selo1'), 'on', t >= tCruza + 400 && !confirmado);
        tvOk(confirmado, 'Saída de Pedro confirmada');

        /* aluno caminhando até o carro */
        var pA = { x: porta.x, y: porta.y };
        if (t >= T_ALUNO && t < T_ALUNO_FIM) {
          var u = suave(seg(t, T_ALUNO, T_ALUNO_FIM));
          pA = { x: lerp(porta.x, lugar.x + 4, u), y: lerp(porta.y + 4, lugar.y - 14, u) };
          op(el.aluno, 1); pos(el.aluno, pA);
        } else op(el.aluno, 0);

        /* relógio de 3 minutos fora da cerca */
        var rel = t >= T_REL && t < T_REL_FIM + 1;
        var seg3 = Math.round(180 * seg(t, T_REL, T_REL_FIM));
        op(R(t1, 'rel'), saiu && t >= T_SAI_FIM - 1500 ? 1 : 0);
        txt(R(t1, 'relt'), Math.floor(seg3 / 60) + ':' + ('0' + (seg3 % 60)).slice(-2));
        telPush(t1, confirmado, 'Saída confirmada', 'Pedro saiu com você às ' + hora(12, 40, 3) + '.');
      }
    };
  })();

  /* ---------------------------------------------------------------- CENA 2: retirada por token */
  var C2 = (function () {
    var T_GERA = 3000, T_VOO = 4800, T_RECEBE = 6200, T_INI = 7200, T_FIM = 15200, T_PORT = 17200, T_SCAN = 19400, T_OK = 22600,
        T_ALUNO = 23400, T_ALUNO_FIM = 26600, T_PUSH = 24200, DUR = 31000;
    var tCruza = lerp(T_INI, T_FIM, F_ENTRA);
    var porta = { x: 453, y: 198 }, lugar = ESTRADA.em(1);
    var tSolic = tCruza + 700;
    return {
      id: 'token', nome: 'Retirada por token', dur: DUR,
      leg: [
        [0, 'Rafaela não vai conseguir buscar o Davi hoje. Ela pede ao amigo Carlos.'],
        [T_GERA, 'Pelo app, ela gera um token só para o Carlos, de uso único.'],
        [T_RECEBE, 'Carlos recebe o token no celular e vai até a escola.'],
        [tCruza, 'Ao entrar na cerca virtual, o app dele avisa que ele chegou.'],
        [tSolic + 600, 'Carlos solicita a saída do Davi e a sala recebe a chamada na TV.'],
        [T_PORT, 'Na portaria, Carlos mostra o QR code do token.'],
        [T_SCAN, 'A portaria lê o QR code e confirma: só o portador do token libera a criança.'],
        [T_PUSH, 'Rafaela recebe o aviso na hora. Tudo fica registrado no histórico.']
      ],
      layout: { ap2: true, ap3: true },
      quadro: function (t) {
        var t1 = el.t1, t2 = el.t2;
        el.extras.style.opacity = 0;
        op(el.carroA, 0);
        txt(el.carroBt, 'Carlos'); txt(el.alunoT, 'Davi');
        txt(R(el.tv, 'salaT'), 'Sala 3º B');

        /* Rafaela gera o token */
        telTela(t1, 'token'); txt(R(t1, 'av'), 'R');
        var press = dentro(t, T_GERA - 150, T_GERA + 350);
        cls(R(t1, 'btnToken'), 'press', press);
        cls(R(t1, 'btnToken'), 'ok', t >= T_GERA + 350);
        txt(R(t1, 'btnToken'), t >= T_GERA + 350 ? 'Token gerado ✓' : 'Gerar token');
        telDedo(t1, dentro(t, T_GERA - 400, T_GERA + 500), 50, 60);
        cls(R(t1, 'selo2'), 'on', t >= T_GERA + 700);
        /* envelope entre os celulares */
        var v = seg(t, T_VOO, T_VOO + 1300);
        el.voo.style.opacity = (v > 0 && v < 1) ? 1 : 0;
        el.voo.style.left = lerp(18, 66, suave(v)) + '%';
        el.voo.style.top = (18 - Math.sin(v * Math.PI) * 8) + '%';

        /* celular do Carlos */
        telTela(t2, t >= T_RECEBE ? 'portador' : 'vazio');
        var p, f;
        if (t < T_INI) f = 0; else if (t < T_FIM) f = (t - T_INI) / (T_FIM - T_INI); else f = 1;
        p = ESTRADA.em(f);
        var visivel = t >= T_RECEBE - 400;
        op(el.carroB, visivel ? 1 : 0);
        pos(el.carroB, p, ' rotate(' + p.ang.toFixed(0) + ')');
        el.carroBt.setAttribute('transform', 'rotate(' + (-p.ang).toFixed(0) + ')');
        var estaDentro = f >= F_ENTRA - 0.0001 && visivel;
        pilula(R(t2, 'pil2'), R(t2, 'pil2t'), estaDentro ? 'dentro' : '', estaDentro ? 'Dentro da área da escola' : 'Fora da área da escola');
        if (visivel) chip(estaDentro ? 'dentro' : 'fora', estaDentro ? 'Carlos está dentro da cerca virtual' : 'Carlos está fora da área da escola');
        else chip('', '');
        anel(estaDentro && t < T_PORT);

        var press2 = dentro(t, tSolic - 100, tSolic + 350);
        cls(R(t2, 'btnSolic'), 'press', press2);
        var solicitou = t >= tSolic + 350;
        cls(R(t2, 'btnSolic'), 'ok', solicitou);
        txt(R(t2, 'btnSolic'), solicitou ? 'Saída solicitada ✓' : 'Solicitar saída');
        telDedo(t2, dentro(t, tSolic - 400, tSolic + 450), 50, 40);
        var qrOn = t >= T_PORT - 1500;
        op(R(t2, 'qr'), qrOn ? 1 : 0); op(R(t2, 'cod'), qrOn ? 1 : 0);

        /* tela da escola */
        var chamado = solicitou && t < T_OK;
        if (t >= T_PORT) {
          tvModo('portaria'); tvChamado(false, '', '', '');
          var ok = t >= T_OK;
          var laser = R(el.tv, 'laser');
          var sc = seg(t, T_SCAN, T_OK);
          laser.style.opacity = (sc > 0 && sc < 1) ? 1 : 0;
          laser.style.top = (10 + 78 * Math.abs(Math.sin(sc * Math.PI * 3))).toFixed(0) + '%';
          cls(R(el.tv, 'porEst'), 'ok', ok);
          txt(R(el.tv, 'porEst'), ok ? 'Saída confirmada ✓' : (sc > 0 ? 'Lendo QR code…' : 'Aguardando leitura'));
          tvOk(false, '');
        } else {
          tvModo('sala');
          tvChamado(chamado, 'DAVI SOUZA', 'Chamado para a saída', 'Quem busca: Carlos (token de Rafaela)');
          tvOk(false, '');
        }

        /* aluno até o carro */
        if (t >= T_ALUNO && t < T_ALUNO_FIM) {
          var u = suave(seg(t, T_ALUNO, T_ALUNO_FIM));
          var l = ESTRADA.em(1);
          pos(el.aluno, { x: lerp(porta.x, l.x + 4, u), y: lerp(porta.y + 4, l.y - 14, u) }); op(el.aluno, 1);
        } else op(el.aluno, 0);

        /* aviso para Rafaela */
        var push = t >= T_PUSH;
        if (push) telTela(t1, 'vazio');
        telPush(t1, push, 'Saída confirmada', 'Davi saiu com Carlos às ' + hora(12, 51) + '.');
      }
    };
  })();

  /* ---------------------------------------------------------------- CENA 3: escola com leitores faciais */
  var C3 = (function () {
    var T_INI = 2600, T_FIM = 10200, T_FACE = 11000, T_FACE_OK = 13400, T_TV = 13900, T_ALUNO = 15600, T_ALUNO_FIM = 18800,
        T_CAT = 18800, T_CAT_OK = 21200, T_PUSH = 21800, T_SAI = 25400, T_SAI_FIM = 30000, DUR = 31500;
    var tCruza = lerp(T_INI, T_FIM, F_ENTRA_Q);
    var porta = { x: 453, y: 198 }, cat = { x: 453, y: 212 };
    var fim = QUIOSQUE.em(1);
    return {
      id: 'facial', nome: 'Escola com leitor facial', dur: DUR,
      leg: [
        [0, 'Esta escola tem leitores faciais. O Bruno deixou a chamada por aproximação desligada.'],
        [T_INI, 'Ele se aproxima da escola de carro.'],
        [tCruza + 300, 'Mesmo dentro da cerca, nada é chamado: a chave está desligada.'],
        [T_FACE - 200, 'Bruno faz o checkin facial no ponto externo de chegada.'],
        [T_TV, 'O leitor o reconhece e o Lucas é chamado, na sala e no saguão.'],
        [T_CAT - 600, 'Na catraca, o leitor reconhece o rosto do Lucas e confirma a saída.'],
        [T_PUSH, 'O app do Bruno é avisado. Sem fila, sem papel e sem alto-falante.']
      ],
      layout: { ap2: false, ap3: true },
      quadro: function (t) {
        var t1 = el.t1;
        telTela(t1, 'prox');
        txt(R(t1, 'aluno'), 'Lucas Rocha'); txt(R(t1, 'av'), 'L');
        txt(R(t1, 'turma'), t >= T_CAT_OK ? '1º C · saiu da escola' : '1º C · na escola');
        cls(R(t1, 'chave'), 'on', false);
        op(R(t1, 'rel'), 0);
        el.extras.style.opacity = 1;
        op(el.carroB, 0);
        txt(el.carroAt, 'Bruno'); txt(el.alunoT, 'Lucas');
        txt(R(el.tv, 'salaT'), 'Sala 1º C');

        var f = t < T_INI ? 0 : (t < T_FIM ? (t - T_INI) / (T_FIM - T_INI) : 1);
        if (t >= T_SAI) f = lerp(1, F_ENTRA_Q - 0.05, suave(seg(t, T_SAI, T_SAI_FIM)));
        var p = QUIOSQUE.em(f), ang = t >= T_SAI ? p.ang + 180 : p.ang;
        op(el.carroA, 1); pos(el.carroA, p, ' rotate(' + ang.toFixed(0) + ')');
        el.carroAt.setAttribute('transform', 'rotate(' + (-ang).toFixed(0) + ')');
        var estaDentro = f >= F_ENTRA_Q - 0.0001;
        txt(R(t1, 'dist'), Math.max(0, Math.round(distM(p.x, p.y) / 10) * 10) + ' m');
        pilula(R(t1, 'pil'), R(t1, 'pilt'), estaDentro ? 'aviso' : '', estaDentro ? 'Dentro da área · aproximação desligada' : 'Fora da área da escola');
        chip(estaDentro ? 'aviso' : 'fora', estaDentro ? 'Você está dentro da cerca virtual' : 'Você está fora da área da escola');
        anel(false);

        /* face no quiosque externo */
        var s1 = seg(t, T_FACE, T_FACE_OK);
        el.rosto1.style.opacity = (s1 > 0 && t < T_FACE_OK + 900) ? 1 : 0;
        el.laser1.setAttribute('y', (168 + 28 * Math.abs(Math.sin(s1 * Math.PI * 2.5))).toFixed(1));
        el.laser1.style.opacity = (s1 > 0 && s1 < 1) ? 1 : 0;

        /* escola: sala -> saguão */
        var chamou = t >= T_TV;
        var confirmou = t >= T_CAT_OK;
        if (t < T_ALUNO) {
          tvModo('sala'); tvChamado(chamou, 'LUCAS ROCHA', 'Chamado para a saída', 'Checkin facial: Bruno');
          tvOk(false, '');
        } else {
          tvModo('saguao'); tvChamado(false, '', '', '');
          var it = R(el.tv, 'sag1'); cls(it, 'on', true); cls(it, 'ok', confirmou);
          txt(R(el.tv, 'sag1t'), 'Lucas Rocha · 1º C');
          txt(R(el.tv, 'sag1e'), confirmou ? 'saída confirmada' : 'a caminho da catraca');
        }

        /* aluno até a catraca e depois ao carro */
        var al = null;
        if (t >= T_ALUNO && t < T_ALUNO_FIM) { var u = suave(seg(t, T_ALUNO, T_ALUNO_FIM)); al = { x: lerp(porta.x, cat.x, u), y: lerp(porta.y, cat.y + 10, u) }; }
        else if (t >= T_ALUNO_FIM && t < T_SAI) al = { x: cat.x, y: cat.y + 10 };
        else if (t >= T_SAI && t < T_SAI_FIM) {
          al = null; /* já está no carro */
        }
        if (t >= T_PUSH && t < T_SAI) {
          var u2 = suave(seg(t, T_PUSH, T_SAI - 600)); al = { x: lerp(cat.x, fim.x + 4, u2), y: lerp(cat.y + 10, fim.y - 14, u2) };
        }
        if (t >= T_SAI - 600 && t < T_SAI) al = null;
        if (al) { op(el.aluno, 1); pos(el.aluno, al); } else op(el.aluno, 0);

        var s2 = seg(t, T_CAT, T_CAT_OK);
        el.rosto2.style.opacity = (s2 > 0 && t < T_CAT_OK + 900) ? 1 : 0;
        el.laser2.setAttribute('y', (178 + 28 * Math.abs(Math.sin(s2 * Math.PI * 2.5))).toFixed(1));
        el.laser2.style.opacity = (s2 > 0 && s2 < 1) ? 1 : 0;

        telPush(t1, t >= T_PUSH, 'Saída confirmada', 'Lucas saiu às ' + hora(12, 37) + ' (leitor facial da catraca).');
      }
    };
  })();

  /* ---------------------------------------------------------------- CENA 4: o outro responsável é avisado */
  var C4 = (function () {
    var T_PUSH = 2600, DUR = 12000;
    return {
      id: 'aviso', nome: 'O outro responsável', dur: DUR,
      leg: [
        [0, 'Marcos, pai do Davi, está no trabalho. Ele também é responsável pelo aluno.'],
        [T_PUSH, 'Quando a portaria confirma a retirada por token, todos os responsáveis do aluno recebem o aviso.'],
        [7200, 'O mesmo vale quando o leitor facial confirma a saída. Ninguém precisa ligar para a escola.']
      ],
      layout: { ap2: false, ap3: false, escritorio: true },
      quadro: function (t) {
        var t1 = el.t1;
        telTela(t1, 'vazio'); txt(R(t1, 'av'), 'M');
        chip('', '');
        telPush(t1, t >= T_PUSH && t < 7200, 'Saída confirmada', 'Davi saiu com Carlos às ' + hora(12, 51) + '.');
        if (t >= 7200) telPush(t1, true, 'Saída confirmada', 'Lucas saiu às ' + hora(12, 37) + ' (leitor facial).');
        op(el.carroA, 0); op(el.carroB, 0); op(el.aluno, 0);
      }
    };
  })();

  var CENAS = [C1, C2, C3, C4];

  /* ---------------------------------------------------------------- motor */
  var atual = 0, T = 0, tocando = false, ultimo = 0, visivelNaTela = false, fimGeral = false, pedidoPeloUsuario = false;

  function montarBotoes() {
    el.cenas.innerHTML = '';
    CENAS.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'anim-cena-btn'; b.textContent = (i + 1) + '. ' + c.nome;
      b.addEventListener('click', function () { pedidoPeloUsuario = true; irPara(i, 0); tocar(true); });
      el.cenas.appendChild(b);
    });
  }
  function marcarBotoes() {
    var b = el.cenas.children;
    for (var i = 0; i < b.length; i++) b[i].setAttribute('aria-current', i === atual ? 'true' : 'false');
  }
  function layout(c) {
    var l = c.layout;
    vis(el.ap2, !!l.ap2); vis(el.ap3, !!l.ap3);
    el.ap1.classList.toggle('largo', !l.ap2);
    el.mapaSvg.style.display = l.escritorio ? 'none' : '';
    el.escr.style.display = l.escritorio ? 'block' : 'none';
    /* só o selo de privacidade faz sentido com mapa */
  }
  function irPara(i, t) {
    atual = clamp(i, 0, CENAS.length - 1); T = t || 0; fimGeral = false;
    layout(CENAS[atual]); marcarBotoes(); desenhar();
  }
  function desenhar() {
    var c = CENAS[atual];
    c.quadro(T);
    var k = 0;
    for (var i = 0; i < c.leg.length; i++) if (T >= c.leg[i][0]) k = i;
    el.num.textContent = (k + 1);
    txt(el.leg, c.leg[k][1]);
    var pct = clamp(T / c.dur, 0, 1) * 100;
    el.prog.style.width = pct.toFixed(1) + '%';
    el.barra.setAttribute('aria-valuenow', Math.round(pct));
  }
  function tocar(on) {
    tocando = !!on; ultimo = 0;
    el.play.textContent = tocando ? '⏸' : '▶';
    el.play.setAttribute('aria-label', tocando ? 'Pausar' : 'Reproduzir');
    if (tocando && fimGeral) { irPara(0, 0); }
    if (tocando) requestAnimationFrame(passo);
  }
  function passo(agora) {
    if (!tocando) return;
    if (!ultimo) ultimo = agora;
    var dt = Math.min(agora - ultimo, 100); ultimo = agora;
    if (visivelNaTela || pedidoPeloUsuario) T += dt;   /* sem rolar a página: só pausa a reprodução automática, nunca a pedida pelo usuário */
    var c = CENAS[atual];
    if (T >= c.dur) {
      if (atual < CENAS.length - 1) { irPara(atual + 1, 0); }
      else { T = c.dur; fimGeral = true; desenhar(); tocar(false); return; }
    }
    desenhar();
    requestAnimationFrame(passo);
  }

  el.play.addEventListener('click', function () { pedidoPeloUsuario = true; tocar(!tocando); });
  $('#aAnt').addEventListener('click', function () { irPara(T > 2500 ? atual : atual - 1, 0); });
  $('#aProx').addEventListener('click', function () { irPara(atual + 1, 0); });
  el.barra.addEventListener('click', function (e) {
    var r = el.barra.getBoundingClientRect();
    irPara(atual, clamp((e.clientX - r.left) / r.width, 0, 0.999) * CENAS[atual].dur);
  });

  montarBotoes();
  irPara(0, 0);
  raiz.irPara = function (i, t) { tocar(false); irPara(i, t); }; /* gancho interno para testes */

  /* começa sozinha quando a animação aparece na tela (e fica parada para quem prefere menos movimento) */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var antes = visivelNaTela; visivelNaTela = e.isIntersecting && e.intersectionRatio > 0.35;
        if (visivelNaTela && !antes && !REDUZIR && !tocando && !fimGeral && T < 50) tocar(true);
      });
    }, { threshold: [0, 0.35, 0.6] }).observe(el.mapa);
  } else { visivelNaTela = true; if (!REDUZIR) tocar(true); }
  if (REDUZIR) { el.play.textContent = '▶'; irPara(0, 9000); }
})();
