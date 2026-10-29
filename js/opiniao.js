// Aba "Opinião" do site institucional (Decisão 095). Uma linha em cada página pública:
//   <script src="/js/opiniao.js" defer></script>
// O script carrega o próprio CSS (/css/opiniao.css); se o CSS não chegar, a aba simplesmente não aparece.
// Sem script de terceiros e sem cookies: o que o visitante digita só vai para o backend da Inoutchi.
(function () {
  'use strict';
  if (window.__inoutchiOpiniao) return;
  window.__inoutchiOpiniao = true;

  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = (LOCAL ? 'http://localhost:8080' : 'https://api.inoutchi.com') + '/api/public/opiniao-site';
  var CHAVE_ENVIADA = 'inoutchi_opiniao_enviada';
  var ROTULOS = ['Nada', 'Pouco', 'Mais ou menos', 'Bastante', 'Totalmente'];
  var TITULOS = {
    1: 'O site respondeu às suas dúvidas sobre o Inoutchi?',
    2: 'O que faltou saber?',
    3: 'Quer que a gente responda?',
    4: 'Obrigado pela sua opinião!'
  };

  // As cinco carinhas, do desanimado ao satisfeito (traços em currentColor: cinza, azul ao passar o mouse, branco se escolhida).
  var BOCAS = [
    '<path d="M10.5 23.5Q16 17.5 21.5 23.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    '<path d="M11.5 22.5Q16 19.5 20.5 22.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    '<path d="M11 21.5H21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    '<path d="M10.5 19.5Q16 25 21.5 19.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    '<path d="M9.5 19Q16 28 22.5 19Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
  ];

  function rosto(i) {
    return '<button type="button" class="opiniao-rosto" role="radio" aria-checked="false" data-nota="' + (i + 1) +
      '" aria-label="Nota ' + (i + 1) + ' de 5: ' + ROTULOS[i] + '" title="' + ROTULOS[i] + '">' +
      '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="11.5" cy="13" r="1.8" fill="currentColor"/><circle cx="20.5" cy="13" r="1.8" fill="currentColor"/>' +
      BOCAS[i] + '</svg></button>';
  }

  var HTML =
    '<button type="button" class="opiniao-aba" aria-expanded="false" aria-controls="opiniao-painel">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>' +
      '<span>Opinião</span>' +
    '</button>' +
    '<div class="opiniao-painel" id="opiniao-painel" role="dialog" aria-labelledby="opiniao-titulo">' +
      '<div class="opiniao-corpo">' +
        '<div class="opiniao-topo"><span class="opiniao-marca">Equipe Inoutchi</span>' +
          '<button type="button" class="opiniao-fechar" aria-label="Fechar">&times;</button></div>' +
        '<div class="opiniao-passos" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<h2 class="opiniao-titulo" id="opiniao-titulo" tabindex="-1"></h2>' +

        '<div data-passo="1">' +
          '<div class="opiniao-rostos" role="radiogroup" aria-labelledby="opiniao-titulo">' + [0, 1, 2, 3, 4].map(rosto).join('') + '</div>' +
          '<div class="opiniao-extremos" aria-hidden="true"><span>Nada</span><span>Totalmente</span></div>' +
        '</div>' +

        '<div data-passo="2" hidden>' +
          '<textarea class="opiniao-campo" id="opiniao-mensagem" maxlength="1000" aria-label="O que faltou saber?" ' +
            'placeholder="Ex.: preço, leitor facial, como funciona na minha escola…"></textarea>' +
          '<div class="opiniao-acoes"><button type="button" class="opiniao-link" data-acao="voltar" style="margin-right:auto">Voltar</button>' +
            '<button type="button" class="opiniao-botao" data-acao="seguinte">Seguinte</button></div>' +
        '</div>' +

        '<div data-passo="3" hidden>' +
          '<p class="opiniao-apoio">Deixe seu e-mail ou WhatsApp (com DDD). Usamos só para responder a esta mensagem. ' +
            '<a href="/politica-privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a></p>' +
          '<input type="text" class="opiniao-campo" id="opiniao-contato" maxlength="200" aria-label="E-mail ou WhatsApp" placeholder="E-mail ou WhatsApp">' +
          '<input type="text" class="opiniao-isca" id="opiniao-isca" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<p class="opiniao-erro" id="opiniao-erro" role="alert" hidden></p>' +
          '<div class="opiniao-acoes"><button type="button" class="opiniao-link" data-acao="voltar" style="margin-right:auto">Voltar</button>' +
            '<button type="button" class="opiniao-link" data-acao="pular">Pular</button>' +
            '<button type="button" class="opiniao-botao" data-acao="enviar">Enviar</button></div>' +
        '</div>' +

        '<div data-passo="4" class="opiniao-obrigado" hidden>' +
          '<span class="opiniao-selo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
          '<p class="opiniao-apoio" id="opiniao-agradecimento"></p>' +
          '<button type="button" class="opiniao-botao opiniao-botao-cheio" data-acao="fechar">Fechar</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  function guardar(chave, valor) { try { sessionStorage.setItem(chave, valor); } catch (e) { } }
  function ler(chave) { try { return sessionStorage.getItem(chave); } catch (e) { return null; } }

  function construir() {
    var raiz = document.createElement('div');
    raiz.className = 'opiniao';
    raiz.id = 'opiniao';
    raiz.innerHTML = HTML;
    document.body.appendChild(raiz);

    var aba = raiz.querySelector('.opiniao-aba');
    var painel = raiz.querySelector('.opiniao-painel');
    var titulo = raiz.querySelector('#opiniao-titulo');
    var passosBarra = raiz.querySelectorAll('.opiniao-passos i');
    var rostos = raiz.querySelectorAll('.opiniao-rosto');
    var campoMensagem = raiz.querySelector('#opiniao-mensagem');
    var campoContato = raiz.querySelector('#opiniao-contato');
    var isca = raiz.querySelector('#opiniao-isca');
    var erro = raiz.querySelector('#opiniao-erro');
    var agradecimento = raiz.querySelector('#opiniao-agradecimento');
    var botaoEnviar = raiz.querySelector('[data-acao="enviar"]');
    var botaoPular = raiz.querySelector('[data-acao="pular"]');

    var passo = 1;
    var nota = 0;
    var enviando = false;
    var contatoEnviado = false;

    function mostrarErro(texto) {
      erro.textContent = texto;
      erro.hidden = !texto;
    }

    function irPara(n, focar) {
      passo = n;
      raiz.querySelectorAll('[data-passo]').forEach(function (bloco) {
        bloco.hidden = Number(bloco.getAttribute('data-passo')) !== n;
      });
      titulo.textContent = TITULOS[n];
      for (var i = 0; i < passosBarra.length; i++) {
        passosBarra[i].className = i < n ? 'feito' : '';
      }
      mostrarErro('');
      if (n === 4) {
        agradecimento.textContent = contatoEnviado
          ? 'Vamos responder pelo contato que você deixou.'
          : 'Sua opinião ajuda a melhorar o site para os próximos diretores e responsáveis.';
      }
      if (focar !== false) {
        titulo.focus();
      }
    }

    function reiniciar() {
      nota = 0;
      contatoEnviado = false;
      campoMensagem.value = '';
      campoContato.value = '';
      for (var i = 0; i < rostos.length; i++) { rostos[i].setAttribute('aria-checked', 'false'); }
      irPara(1, false);
    }

    function aberto() { return painel.classList.contains('aberto'); }

    function abrir() {
      painel.classList.add('aberto');
      aba.setAttribute('aria-expanded', 'true');
      if (ler(CHAVE_ENVIADA) === '1') {
        irPara(4);
        agradecimento.textContent = 'Você já nos enviou sua opinião nesta visita. Obrigado!';
      } else {
        irPara(passo);
      }
    }

    function fechar() {
      if (!aberto()) return;
      // Quem deu a nota e fechou sem terminar: guarda só a nota (anônima), nunca o texto nem o contato.
      if (nota && !enviando && passo < 4) {
        try {
          fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nota: nota, pagina: location.pathname }),
            keepalive: true
          }).catch(function () { });
        } catch (e) { }
        reiniciar();
      } else if (passo === 4) {
        reiniciar();
      }
      painel.classList.remove('aberto');
      aba.setAttribute('aria-expanded', 'false');
      aba.focus();
    }

    function contatoValido(texto) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) return true;
      var digitos = texto.replace(/\D/g, '');
      return /^[+()\d\s.-]+$/.test(texto) && digitos.length >= 10 && digitos.length <= 13;
    }

    function ocupado(valor) {
      enviando = valor;
      botaoEnviar.disabled = valor;
      botaoPular.disabled = valor;
      botaoEnviar.textContent = valor ? 'Enviando…' : 'Enviar';
    }

    function enviar(comContato) {
      if (enviando) return;
      var contato = comContato ? campoContato.value.trim() : '';
      if (comContato && !contatoValido(contato)) {
        mostrarErro('Digite um e-mail ou um WhatsApp com DDD, ou toque em Pular.');
        campoContato.focus();
        return;
      }
      mostrarErro('');
      ocupado(true);
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nota: nota,
          mensagem: campoMensagem.value.trim() || null,
          contato: contato || null,
          pagina: location.pathname,
          website: isca.value
        })
      }).then(function (resposta) {
        return resposta.json().catch(function () { return {}; }).then(function (corpo) {
          ocupado(false);
          if (resposta.ok && corpo.sucesso) {
            contatoEnviado = !!contato;
            guardar(CHAVE_ENVIADA, '1');
            if (window.inoutchiEvento) window.inoutchiEvento('opiniao_enviada', { nota: nota, com_contato: contatoEnviado });
            irPara(4);
          } else if (resposta.status === 429) {
            mostrarErro('Recebemos muitas mensagens agora. Tente de novo mais tarde.');
          } else {
            mostrarErro('Não foi possível enviar agora. Tente de novo em instantes.');
          }
        });
      }).catch(function () {
        ocupado(false);
        mostrarErro('Não foi possível enviar agora. Confira a conexão e tente de novo.');
      });
    }

    aba.addEventListener('click', function () { if (aberto()) fechar(); else abrir(); });
    raiz.querySelector('.opiniao-fechar').addEventListener('click', fechar);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && aberto()) fechar();
    });

    // Passo 1: escolher a nota avança sozinho (um clique só); as setas movem a seleção como em qualquer grupo de opções.
    raiz.querySelector('.opiniao-rostos').addEventListener('click', function (e) {
      var botao = e.target.closest('.opiniao-rosto');
      if (!botao) return;
      nota = Number(botao.getAttribute('data-nota'));
      for (var i = 0; i < rostos.length; i++) {
        rostos[i].setAttribute('aria-checked', rostos[i] === botao ? 'true' : 'false');
      }
      setTimeout(function () { if (passo === 1 && nota) irPara(2); }, 260);
    });
    raiz.querySelector('.opiniao-rostos').addEventListener('keydown', function (e) {
      var delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!delta) return;
      e.preventDefault();
      var atual = Array.prototype.indexOf.call(rostos, document.activeElement);
      var proximo = rostos[(atual + delta + rostos.length) % rostos.length];
      proximo.focus();
    });

    raiz.addEventListener('click', function (e) {
      var acao = e.target.getAttribute && e.target.getAttribute('data-acao');
      if (acao === 'voltar') irPara(passo - 1);
      else if (acao === 'seguinte') irPara(3);
      else if (acao === 'pular') enviar(false);
      else if (acao === 'enviar') enviar(true);
      else if (acao === 'fechar') fechar();
    });
    campoContato.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); enviar(true); }
    });

    // A aba só entra depois que o visitante lê um pouco da página (rolou ou ficou 15 s), para não competir com o primeiro olhar.
    var jaApareceu = false;
    function aparecer() {
      if (jaApareceu) return;
      jaApareceu = true;
      window.removeEventListener('scroll', aoRolar);
      aba.classList.add('visivel');
    }
    function aoRolar() { if ((window.pageYOffset || document.documentElement.scrollTop) > 400) aparecer(); }
    window.addEventListener('scroll', aoRolar, { passive: true });
    setTimeout(aparecer, 15000);

    irPara(1, false);
  }

  function iniciar() {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/css/opiniao.css?v=1';
    css.onload = construir; // sem o CSS não há aba: nunca aparece sem estilo
    document.head.appendChild(css);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
