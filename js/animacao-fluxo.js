/* Animação "Como funciona" – Inoutchi. Dados fictícios. */
(function () {
  var root = document.getElementById('anim');
  if (!root) return;

  // A animação só é montada quando chega perto da tela: a medição da rota e a criação do DOM não competem com a primeira
  // pintura da página (no celular lento isso atrasava o título). Sem IntersectionObserver, monta direto.
  function iniciar() {
  var IMG = '/assets/images/anim/';
  var CERCA = { x: 1080, y: 330, r: 330 };
  var PORTAO = { x: 1030, y: 520 };
  var ROTA = 'M -60 1030 C 60 900, 160 800, 330 740 S 540 690, 610 640 S 690 535, 790 515 S 900 520, 1000 555 S 1250 625, 1680 668';
  var PESSOAS = {
    mae: { img: 'mae.webp', nome: 'Ana · mãe' },
    amigo: { img: 'amigo.webp', nome: 'Carlos · amigo' },
    pai: { img: 'pai.webp', nome: 'Marcos · pai' }
  };

  function qr(seed) {
    var s = seed, n = 25, out = '';
    function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    function finder(x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#0f172a"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#0f172a"/>';
    }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var f = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!f && r() > 0.52) out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0f172a"/>';
    }
    return '<svg viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges">' + out + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</svg>';
  }
  var QR = qr(48291);

  root.innerHTML =
    '<div class="ia" role="region" aria-label="Animação do fluxo de saída escolar">' +
    '<div class="ia-topo"><div class="ia-abas" role="tablist">' +
    ['Aproximação', 'Token', 'Leitor facial', 'Outro responsável'].map(function (t, i) {
      return '<button class="ia-aba" role="tab" data-i="' + i + '"><b>' + (i + 1) + '</b>' + t + '</button>';
    }).join('') +
    '</div><div class="ia-ctrl"><button class="ia-btn" data-a="pausa" aria-label="Pausar">❚❚</button><button class="ia-btn" data-a="reinicia" aria-label="Reiniciar cena">↺</button></div></div>' +
    '<div class="ia-palco"><div class="ia-mapa">' +
    '<img class="ia-fundo" src="' + IMG + 'mapa.webp" alt="Mapa ilustrativo do bairro com a escola" width="1600" height="1008" decoding="async">' +
    '<svg viewBox="0 0 1600 1008" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<circle class="ia-cerca" cx="' + CERCA.x + '" cy="' + CERCA.y + '" r="' + CERCA.r + '"/>' +
    '<circle class="ia-onda" cx="' + CERCA.x + '" cy="' + CERCA.y + '" r="60"/>' +
    '<path class="ia-rota" d="' + ROTA + '"/><path class="ia-rastro" d="' + ROTA + '"/>' +
    '<g class="ia-carro"><ellipse class="ia-sombra" cx="6" cy="8" rx="70" ry="30"/><image href="' + IMG + 'carro.webp" x="-68" y="-32" width="136" height="64"/></g>' +
    '</svg>' +
    '<div class="ia-pino" style="left:64.5%;top:41%"><span>🏫 Escola Aurora</span><i></i></div>' +
    '<div class="ia-hud"><div><small>Distância</small><strong data-r="dist">1,8 km</strong></div><div><small>Cerca virtual</small><strong data-r="cerca">fora</strong></div><div><small>Hora</small><strong data-r="hora">11:58</strong></div></div>' +
    '<div class="ia-flut ia-tv"><small>TV · Sala 3º B</small><div class="ia-tv-linha"><img decoding="async" src="' + IMG + 'aluna.webp" alt=""><div><b>LAURA SOUZA</b><em data-r="tvtxt">Responsável chegando</em></div></div></div>' +
    '<div class="ia-flut ia-pessoa" style="translate:-50% -100%"><img decoding="async" src="' + IMG + 'aluna.webp" alt="Laura, aluna"><span>Laura · 3º B</span></div>' +
    '<div class="ia-flut ia-portaria"><img decoding="async" src="' + IMG + 'portaria.webp" alt="Equipe da portaria"><div class="ia-scan"><small>Portaria · leitura do token</small><div class="ia-scan-box">' + QR + '<div class="ia-laser"></div></div><div class="ia-ok">✔ Token válido · Carlos M.</div></div></div>' +
    '<div class="ia-flut ia-facial"><div class="ia-cam"><img decoding="async" data-r="face" src="' + IMG + 'mae.webp" alt=""><div class="ia-mira"></div><div class="ia-laser"></div></div><p data-r="facetxt">Reconhecendo…</p></div>' +
    '</div>' +
    '<div class="ia-lado"><img class="ia-personagem" decoding="async" src="' + IMG + 'mae.webp" alt="">' +
    '<div class="ia-cel"><div class="ia-tela"><div class="ia-push"><i class="ia-ico">i</i><div><b data-r="pusht"></b><span data-r="pushx"></span></div></div>' +
    '<div class="ia-app-top"><small data-r="appsub">Laura · 3º B</small><b data-r="apptit">Olá, Ana</b></div><div class="ia-app-corpo" data-r="corpo"></div></div></div></div>' +
    '</div>' +
    '<div class="ia-legenda"><div class="ia-num" data-r="num">1</div><div style="flex:1"><h4 data-r="tit"></h4><p data-r="leg" aria-live="polite"></p><div class="ia-trilho" role="slider" tabindex="0" aria-label="Posição na cena (arraste para voltar ou avançar)" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0:00" data-r="trilho"><div class="ia-barra"><i data-r="barra"></i></div><b class="ia-seta" data-r="seta" aria-hidden="true"></b></div><small class="ia-tempo" data-r="tempo">0:00 / 0:00</small></div></div>' +
    '</div>';

  function $(s) { return root.querySelector(s); }
  function R(n) { return root.querySelector('[data-r="' + n + '"]'); }
  var mapa = $('.ia-mapa'), path = $('.ia-rastro'), carro = $('.ia-carro'), cerca = $('.ia-cerca'), onda = $('.ia-onda');
  var tv = $('.ia-tv'), laura = $('.ia-pessoa'), portaria = $('.ia-portaria'), facial = $('.ia-facial');
  var personagem = $('.ia-personagem'), push = $('.ia-push');
  var L = path.getTotalLength();
  path.style.strokeDasharray = L;

  function pt(p) { return path.getPointAtLength(Math.max(0, Math.min(1, p)) * L); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function achar(fn) { for (var p = 0; p <= 1; p += 0.002) if (fn(pt(p))) return p; return 1; }
  var P_CERCA = achar(function (q) { return dist(q, CERCA) < CERCA.r; });
  var P_PARA = achar(function (q) { return q.x >= 935; });

  // Parada: pelo botão (pausado), por estar fora da tela (foraDaTela) ou por preferir menos movimento (começa pausada).
  var REDUZIR = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var arrastando = false;
  var token = 0, pausado = REDUZIR, foraDaTela = 'IntersectionObserver' in window, cenaAtual = 0, decorrido = 0;
  function parado() { return pausado || foraDaTela; }
  function atualizaParado() { root.querySelector('.ia').classList.toggle('ia-parado', parado()); }
  // Atrasos de legenda e troca de personagem: cancelados ao trocar de cena (evita legenda antiga sobre a nova).
  var atrasos = [];
  function atraso(fn, ms) { atrasos.push(setTimeout(fn, ms)); }
  function limpaAtrasos() { atrasos.forEach(clearTimeout); atrasos = []; }

  // Salto (arrastar a barra): a cena é refeita do começo e os trechos anteriores ao ponto escolhido são concluídos na hora.
  var saltar = 0;
  function tween(ms, fn) {
    var meu = token;
    return new Promise(function (ok, erro) {
      var el = 0, ult = performance.now();
      if (saltar > 0) {
        el = Math.min(saltar, ms); saltar -= el;
        if (el >= ms) { if (fn) fn(1); ok(); return; }
        if (fn) fn(el / ms);
      }
      function f(agora) {
        if (meu !== token) return erro('cancelado');
        var dt = agora - ult; ult = agora;
        if (!parado()) el += dt;
        var t = Math.min(1, el / ms);
        if (fn) fn(t);
        if (t >= 1) ok(); else requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    });
  }
  function espera(ms) { return tween(ms); }
  function suave(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var dentro = false, aoEntrar = null, aoSair = null;
  function posCarro(p) {
    var a = pt(p), b = pt(p + 0.004);
    var ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    carro.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    path.style.strokeDashoffset = L - p * L;
    var m = Math.max(0, dist(a, PORTAO) * 1.7 - 40);
    R('dist').textContent = p > P_PARA + 0.01 ? 'saindo' : (m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(m / 10) * 10 + ' m');
    var d = dist(a, CERCA) < CERCA.r;
    if (d !== dentro) {
      dentro = d;
      R('cerca').textContent = d ? 'dentro' : 'fora';
      cerca.classList.toggle('dentro', d);
      if (d) { onda.classList.remove('on'); void onda.getBBox(); onda.classList.add('on'); if (aoEntrar) aoEntrar(); }
      else if (aoSair) aoSair();
    }
    return m;
  }
  var pAtual = 0;
  function dirige(p1, ms, cada) {
    var p0 = pAtual;
    return tween(ms, function (t) { pAtual = p0 + (p1 - p0) * suave(t); var m = posCarro(pAtual); if (cada) cada(m); });
  }
  function hora(h) { R('hora').textContent = h; }

  // Ao arrastar a barra (ou logo depois de um salto), legenda e personagem trocam na hora: cada movimento reinicia a cena e
  // cancelaria os atrasos de 200/350 ms, e o personagem só apareceria quando o cursor fosse solto.
  var tSalto = 0, fimSalto = null;
  function emSalto() { return arrastando || (performance.now() - tSalto < 700); }
  function legenda(t) {
    var p = R('leg');
    if (emSalto()) { p.textContent = t; p.style.opacity = 1; return; }
    p.style.opacity = 0; atraso(function () { p.textContent = t; p.style.opacity = 1; }, 200);
  }
  function pessoa(k) {
    var info = PESSOAS[k];
    if (emSalto()) { personagem.src = IMG + info.img; personagem.alt = info.nome; personagem.classList.remove('troca'); return; }
    personagem.classList.add('troca');
    atraso(function () { personagem.src = IMG + info.img; personagem.alt = info.nome; personagem.classList.remove('troca'); }, 350);
  }
  function app(tit, sub) { R('apptit').textContent = tit; R('appsub').textContent = sub; }
  function corpo(h) { R('corpo').innerHTML = h; }
  function chave(on) { return '<div class="ia-card ia-chave"><span>Chamada por aproximação</span><i class="ia-sw' + (on ? ' on' : '') + '"></i></div>'; }
  function status(cor, txt) { return '<div class="ia-status ' + cor + '">' + txt + '</div>'; }
  function aluno(txt) { return '<div class="ia-card"><small>Aluna</small><strong>Laura Souza · 3º B</strong>' + (txt ? '<small style="margin-top:.2rem">' + txt + '</small>' : '') + '</div>'; }
  function toca(sel) { var b = $(sel); if (!b) return espera(1); b.classList.add('toque'); return espera(260).then(function () { b.classList.remove('toque'); }); }
  function avisa(t, x) { R('pusht').textContent = t; R('pushx').textContent = x; push.classList.add('on'); }
  function mostra(el, on) { el.classList.toggle('on', on); }
  function lauraEm(x, y, anda) {
    laura.style.transition = 'opacity .5s, transform .5s, left 2.4s ease-in-out, top 2.4s ease-in-out';
    laura.style.left = x + '%'; laura.style.top = y + '%';
    laura.querySelector('img').style.animation = anda ? 'ia-anda .4s ease-in-out infinite alternate' : 'none';
  }

  function reset() {
    [tv, laura, portaria, facial].forEach(function (e) { e.classList.remove('on', 'valido'); });
    push.classList.remove('on');
    laura.style.transition = 'none'; laura.style.left = "66%"; laura.style.top = "47%";
    R('face').src = IMG + 'mae.webp'; R('facetxt').textContent = 'Reconhecendo…';
    R('tvtxt').textContent = 'Responsável chegando';
    dentro = false; cerca.classList.remove('dentro'); R('cerca').textContent = 'fora';
    aoEntrar = aoSair = null; pAtual = 0; posCarro(0); carro.style.opacity = 1;
  }

  var cenas = [
    {
      tit: 'Chamada por aproximação', dur: 30900, run: async function () {
        pessoa('mae'); app('Olá, Ana', 'Laura · 3º B'); hora('11:58');
        corpo(chave(false) + status('azul', '📍 Fora da cerca') + aluno('Em aula'));
        legenda('Ana sai do trabalho para buscar a filha. No app, ela liga a chave “Chamada por aproximação”.\nNota: A chave de aproximação pode ficar permanentemente acionada.');
        await espera(3400); corpo(chave(true) + status('azul', '📍 Fora da cerca') + aluno('Em aula')); await espera(2600);
        legenda('O app mede a distância até a escola no próprio celular. O mapa é só uma ilustração: nenhuma posição é gravada.');
        aoEntrar = function () {
          corpo(chave(true) + status('verde', '✅ Dentro da cerca · Laura chamada') + aluno('Indo para o portão'));
          mostra(tv, true); hora('12:01');
        };
        await dirige(P_CERCA, 6500, function (m) { if (!dentro) corpo(chave(true) + status('azul', '📍 ' + R('dist').textContent + ' da escola') + aluno('Em aula')); });
        legenda('Ao entrar na cerca virtual, Laura é chamada sozinha na TV da sala do 3º B.');
        await espera(2800);
        legenda('Laura sai da sala e segue até o portão enquanto Ana se aproxima.');
        mostra(laura, true); lauraEm(60, 61, true);
        await dirige(P_PARA, 3800);
        lauraEm(60, 61, false); mostra(tv, false); hora('12:03');
        corpo(chave(true) + status('verde', '🤝 Laura está com você') + aluno('Entregue no portão'));
        legenda('Ana recebe Laura no portão.'); await espera(2200);
        mostra(laura, false);
        legenda('Caso o responsável esqueça de confirmar a saída no app, depois de 3 minutos fora da cerca, a saída é confirmada automaticamente.');
        await dirige(1, 4200);
        await tween(2600, function (t) {
          var s = Math.round(180 * (1 - t));
          corpo(chave(true) + status('ambar', '⏱ Fora da cerca · ' + Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2)) + aluno('A caminho de casa'));
        });
        hora('12:07'); corpo(chave(true) + status('verde', '✅ Saída confirmada') + aluno('Saiu com Ana às 12:04'));
        avisa('Saída confirmada', 'Laura saiu com Ana às 12:04.');
        await espera(3000);
      }
    },
    {
      tit: 'Retirada por token', dur: 29120, run: async function () {
        pessoa('mae'); app('Olá, Ana', 'Laura · 3º B'); hora('10:30');
        corpo('<div class="ia-card"><small>Novo token de retirada</small><strong>Para: Carlos M.</strong><small>Válido hoje até 18h</small></div>' + aluno() + '<div class="ia-acao" data-b>Gerar token</div>');
        legenda('Hoje Ana não pode ir. No app, ela gera um token de retirada para o amigo Carlos.');
        await espera(2200); await toca('[data-b]');
        corpo('<div class="ia-qr">' + QR + '<strong>482 913</strong><small>Enviado para Carlos</small></div>' + aluno());
        await espera(2000);
        pessoa('amigo'); app('Token de retirada', 'Laura Souza · 3º B'); hora('11:58');
        corpo('<div class="ia-qr">' + QR + '<strong>482 913</strong></div>' + status('azul', '📍 Fora da cerca'));
        legenda('Carlos recebe o token no celular dele e segue para a escola.');
        await dirige(P_CERCA, 6000);
        corpo('<div class="ia-qr">' + QR + '<strong>482 913</strong></div>' + status('verde', '✅ Dentro da cerca') + '<div class="ia-acao" data-b>Solicitar saída</div>');
        legenda('Dentro da cerca, Carlos toca em “Solicitar saída”.');
        await espera(1600); await toca('[data-b]');
        // A solicitação já chama o aluno (Decisão 077): a TV acende aqui, antes da leitura do QR na portaria.
        R('tvtxt').textContent = 'Retirada por token · Carlos M.'; mostra(tv, true); hora('12:01');
        corpo('<div class="ia-qr">' + QR + '<strong>482 913</strong></div>' + status('ambar', '⏳ Laura chamada · mostre o QR na portaria'));
        legenda('A solicitação já chama Laura na TV da sala, e ela segue para o portão. Falta Carlos mostrar o QR na portaria.');
        mostra(laura, true); lauraEm(60, 61, true);
        await dirige(P_PARA, 3200);
        lauraEm(60, 61, false);
        mostra(portaria, true);
        legenda('Na portaria, Carlos mostra o QR code e a equipe o lê (ou digita o código de 6 dígitos).');
        await espera(2800); portaria.classList.add('valido');
        corpo(status('verde', '✅ Token válido') + aluno('Retirada confirmada'));
        legenda('A portaria confirma a saída: só o portador do token leva Laura. O token deixa de valer.');
        await espera(2600); mostra(tv, false); hora('12:04'); mostra(portaria, false); mostra(laura, false);
        // O aviso vai para os responsáveis (não para o portador do token): volta para o celular da Ana.
        pessoa('mae'); app('Olá, Ana', 'Laura · 3º B');
        corpo(aluno('Saiu com Carlos M. às 12:04') + status('verde', '✅ Saída confirmada'));
        avisa('Saída confirmada', 'Laura saiu com Carlos M. às 12:04, retirada por token confirmada pela portaria.');
        legenda('Ana, a mãe, recebe o aviso na hora. Todos os responsáveis da Laura recebem.');
        await espera(3000);
        await dirige(1, 4000); await espera(1200);
      }
    },
    {
      tit: 'Escola com leitor facial', dur: 20400, run: async function () {
        pessoa('mae'); app('Olá, Ana', 'Laura · 3º B'); hora('11:57');
        corpo(chave(false) + status('azul', 'Chamada por aproximação desligada') + aluno('Em aula'));
        legenda('Nesta escola há leitor facial. Ana deixou a chave de aproximação desligada.');
        await espera(2200);
        legenda('Sem a chave, entrar na cerca não chama ninguém. Ana estaciona e vai até o portão.');
        cerca.style.opacity = .35;
        await dirige(P_PARA, 7000);
        mostra(facial, true);
        legenda('No portão, Ana faz o checkin facial no leitor.');
        await espera(2600); facial.classList.add('valido'); R('facetxt').textContent = '✔ Ana Souza · responsável';
        R('tvtxt').textContent = 'Checkin facial · Ana'; mostra(tv, true); hora('12:02');
        corpo(chave(false) + status('verde', '✅ Checkin facial · Laura chamada') + aluno('Indo para o portão'));
        legenda('O leitor reconhece Ana e Laura é chamada na TV da sala.');
        await espera(2800);
        mostra(laura, true); lauraEm(60, 61, true);
        facial.classList.remove('valido'); R('face').src = IMG + 'aluna.webp'; R('facetxt').textContent = 'Catraca · saída…';
        legenda('Laura passa pela catraca e o leitor facial confirma a saída.');
        await espera(2600); lauraEm(60, 61, false); mostra(tv, false);
        facial.classList.add('valido'); R('facetxt').textContent = '✔ Saída de Laura confirmada'; hora('12:03');
        corpo(chave(false) + status('verde', '✅ Saída confirmada na catraca') + aluno('Saiu com Ana às 12:03'));
        avisa('Saída confirmada', 'O leitor facial confirmou a saída de Laura às 12:03.');
        await espera(3200);
      }
    },
    {
      tit: 'O outro responsável', dur: 11000, run: async function () {
        pessoa('pai'); app('Olá, Marcos', 'Pai da Laura'); hora('12:03');
        pAtual = P_PARA; posCarro(P_PARA); mostra(portaria, true); portaria.classList.add('valido');
        corpo(aluno('Em aula') + status('azul', '🏫 Na escola'));
        legenda('Marcos, o pai, está no trabalho. Enquanto isso, a portaria confirma a retirada por token.');
        await espera(2600); hora('12:04');
        avisa('Laura saiu da escola', 'Retirada por token com Carlos M., confirmada pela portaria às 12:04.');
        corpo(aluno('Saiu às 12:04') + status('verde', '✅ Saída confirmada') + '<div class="ia-card"><small>Quem retirou</small><strong>Carlos M. (token)</strong></div>');
        legenda('Quando a portaria (token) ou o leitor facial confirma a saída, todos os responsáveis recebem o aviso na hora.');
        await espera(4200);
        legenda('Vale também para a saída automática por aproximação: todos os responsáveis são avisados. A contagem dos 3 minutos aparece só no celular de quem fez o pedido.');
        await espera(4200);
      }
    }
  ];

  var abas = root.querySelectorAll('.ia-aba');
  function tocar(i, desdeMs) {
    token++; var meu = token; cenaAtual = i; limpaAtrasos();
    saltar = Math.max(0, Math.min(desdeMs || 0, cenas[i].dur - 400)); decorrido = saltar;
    if (desdeMs > 0) {
      // Durante o salto as transições ficam curtas (a cena é refeita a cada movimento e os cartões não devem aparecer "fantasmas").
      tSalto = performance.now();
      root.querySelector('.ia').classList.add('ia-salto');
      clearTimeout(fimSalto); fimSalto = setTimeout(function () { root.querySelector('.ia').classList.remove('ia-salto'); }, 700);
    }
    abas.forEach(function (a, j) { a.classList.toggle('ativa', j === i); a.setAttribute('aria-selected', j === i); });
    R('num').textContent = i + 1; R('tit').textContent = cenas[i].tit;
    cerca.style.opacity = 1; reset();
    cenas[i].run().then(function () { saltar = 0; if (meu === token) tocar((i + 1) % cenas.length); }, function () { });
  }
  function fmt(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function mostraPosicao(pct) {
    R('barra').style.width = pct + '%';
    R('seta').style.left = pct + '%';
    var ms = pct / 100 * cenas[cenaAtual].dur, tr = R('trilho');
    R('tempo').textContent = fmt(ms) + ' / ' + fmt(cenas[cenaAtual].dur);
    tr.setAttribute('aria-valuenow', Math.round(pct)); tr.setAttribute('aria-valuetext', fmt(ms) + ' de ' + fmt(cenas[cenaAtual].dur));
  }
  var ult = performance.now();
  (function barra(agora) {
    var dt = agora - ult; ult = agora;
    if (!parado()) decorrido += dt;
    var pct = Math.min(100, decorrido / cenas[cenaAtual].dur * 100);
    if (!arrastando) mostraPosicao(pct);
    requestAnimationFrame(barra);
  })(ult);

  // Quem clica na animação está olhando para ela: não a trata como fora da tela.
  function usuarioAgiu() { foraDaTela = false; atualizaParado(); }
  abas.forEach(function (a) { a.addEventListener('click', function () { usuarioAgiu(); tocar(+a.dataset.i); }); });
  var btnPausa = root.querySelector('[data-a="pausa"]');
  function rotuloPausa() {
    btnPausa.textContent = pausado ? '▶' : '❚❚';
    btnPausa.setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
    atualizaParado();
  }
  btnPausa.addEventListener('click', function () { usuarioAgiu(); pausado = !pausado; rotuloPausa(); });
  rotuloPausa();
  // Só anda enquanto está na tela: fora dela fica parada (poupa bateria) e continua de onde parou.
  if (foraDaTela) {
    new IntersectionObserver(function (es) {
      foraDaTela = !es[es.length - 1].isIntersecting; atualizaParado();
    }, { threshold: 0.25 }).observe(root);
  }
  root.querySelector('[data-a="reinicia"]').addEventListener('click', function () { usuarioAgiu(); tocar(cenaAtual); });

  // Arrastar a seta (ou tocar na barra) volta ou avança a cena. Durante o arraste a cena acompanha o dedo.
  var trilho = R('trilho'), eraPausado = false, pendente = null;
  function msDoPonteiro(e) {
    var r = trilho.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * cenas[cenaAtual].dur;
  }
  function irPara(ms) {
    usuarioAgiu();
    decorrido = ms; mostraPosicao(ms / cenas[cenaAtual].dur * 100);
    if (pendente === null) pendente = requestAnimationFrame(function () { pendente = null; tocar(cenaAtual, decorrido); });
  }
  trilho.addEventListener('pointerdown', function (e) {
    arrastando = true; eraPausado = pausado; pausado = true; atualizaParado();
    try { trilho.setPointerCapture(e.pointerId); } catch (x) { }
    trilho.classList.add('arrastando'); irPara(msDoPonteiro(e));
  });
  trilho.addEventListener('pointermove', function (e) { if (arrastando) irPara(msDoPonteiro(e)); });
  function soltou() {
    if (!arrastando) return;
    arrastando = false; trilho.classList.remove('arrastando');
    pausado = eraPausado; rotuloPausa();
  }
  trilho.addEventListener('pointerup', soltou);
  trilho.addEventListener('pointercancel', soltou);
  trilho.addEventListener('keydown', function (e) {
    var passo = { ArrowLeft: -3000, ArrowDown: -3000, ArrowRight: 3000, ArrowUp: 3000 }[e.key];
    if (e.key === 'Home') irPara(0);
    else if (e.key === 'End') irPara(cenas[cenaAtual].dur - 500);
    else if (passo) irPara(Math.max(0, Math.min(cenas[cenaAtual].dur - 500, decorrido + passo)));
    else return;
    e.preventDefault();
  });

  tocar(0);
  }
  // Monta só depois da primeira pintura e do carregamento da página, em um momento ocioso.
  function quandoOcioso(fn) {
    function go() { (window.requestIdleCallback || function (c) { setTimeout(c, 200); })(fn, { timeout: 2500 }); }
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  }
  var montou = false;
  function montar() { if (!montou) { montou = true; iniciar(); } }
  if ('IntersectionObserver' in window) {
    var antes = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { antes.disconnect(); quandoOcioso(montar); }
    }, { rootMargin: '400px' });
    antes.observe(root);
    // Rede de segurança: se o navegador não avisar a visibilidade, monta de qualquer jeito 3 s depois de carregar.
    // Só vale se a animação estiver perto da tela (na página inicial ela fica bem abaixo e não deve baixar imagens à toa).
    window.addEventListener('load', function () {
      setTimeout(function () {
        if (root.getBoundingClientRect().top < window.innerHeight * 1.1) quandoOcioso(montar);
      }, 3000);
    });
  } else { quandoOcioso(montar); }
})();
