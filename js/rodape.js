// Rodapé: "Guias e modelos" fica recolhido no celular e sempre aberto a partir de 768 px (sem JavaScript fica aberto).
(function () {
  var d = document.getElementById('rod-guias');
  if (!d || !window.matchMedia) return;
  var mq = window.matchMedia('(min-width: 768px)');
  d.open = mq.matches;
  if (mq.addEventListener) mq.addEventListener('change', function (e) { d.open = e.matches; });
})();
