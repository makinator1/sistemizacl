/* Sistemiza · sistemiza.cl */
(function () {
  'use strict';

  var raiz = document.documentElement;

  /* ---------- Tema claro / oscuro ---------- */
  var btnTema = document.getElementById('btn-tema');

  function actualizarBotonTema() {
    var oscuro = raiz.getAttribute('data-tema') === 'oscuro';
    btnTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    btnTema.setAttribute('aria-pressed', String(oscuro));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', oscuro ? '#0E0D2B' : '#FFFFFF');
  }

  btnTema.addEventListener('click', function () {
    var nuevo = raiz.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
    raiz.setAttribute('data-tema', nuevo);
    try { localStorage.setItem('sistemiza-tema', nuevo); } catch (e) {}
    actualizarBotonTema();
  });
  actualizarBotonTema();

  // Si la persona no ha elegido un tema, se sigue el del sistema.
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var alCambiar = function (e) {
      var guardado = null;
      try { guardado = localStorage.getItem('sistemiza-tema'); } catch (err) {}
      if (!guardado) {
        raiz.setAttribute('data-tema', e.matches ? 'oscuro' : 'claro');
        actualizarBotonTema();
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar);
  }

  /* ---------- Cabecera y menú móvil ---------- */
  var cabecera = document.getElementById('cabecera');
  var nav = document.getElementById('nav');
  var btnMenu = document.getElementById('btn-menu');

  function alDesplazar() { cabecera.classList.toggle('con-sombra', window.scrollY > 8); }
  window.addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();

  function cerrarMenu() {
    nav.classList.remove('abierto');
    btnMenu.setAttribute('aria-expanded', 'false');
    btnMenu.setAttribute('aria-label', 'Abrir menú');
  }
  btnMenu.addEventListener('click', function () {
    var abierto = nav.classList.toggle('abierto');
    btnMenu.setAttribute('aria-expanded', String(abierto));
    btnMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) cerrarMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ---------- Animaciones al aparecer ---------- */
  var elementos = document.querySelectorAll('.aparecer');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elementos.forEach(function (el) { obs.observe(el); });
  } else {
    elementos.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ---------- Enlace activo del menú ---------- */
  var enlaces = {};
  nav.querySelectorAll('a[href^="#"]:not(.boton)').forEach(function (a) { enlaces[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var obsNav = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = enlaces[en.target.id];
        if (a) a.classList.toggle('activo', en.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(enlaces).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) obsNav.observe(s);
    });
  }

  /* ---------- Medidores de capacidad de cómputo ---------- */
  document.querySelectorAll('.medidor').forEach(function (m) {
    var n = parseInt(m.getAttribute('data-nivel'), 10) || 0;
    m.setAttribute('role', 'img');
    m.setAttribute('aria-label', 'Capacidad de cómputo: ' + n + ' de 5');
    for (var i = 0; i < 5; i++) {
      var barra = document.createElement('i');
      barra.style.setProperty('--i', i);
      if (i < n) barra.className = 'on';
      m.appendChild(barra);
    }
  });

  /* ---------- Pestañas de niveles ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.niveles__tabs [role="tab"]'));

  function activar(tab, enfocar) {
    tabs.forEach(function (t) {
      var sel = t === tab;
      t.setAttribute('aria-selected', String(sel));
      t.tabIndex = sel ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !sel;
    });
    if (enfocar) tab.focus();
    if (tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { activar(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var destino = null;
      if (e.key === 'ArrowRight') destino = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') destino = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') destino = tabs[0];
      else if (e.key === 'End') destino = tabs[tabs.length - 1];
      if (destino) { e.preventDefault(); activar(destino, true); }
    });
  });

  /* ---------- Formulario de contacto (Formspree) ---------- */
  var form = document.getElementById('form-contacto');
  var estado = document.getElementById('form-estado');
  var btnEnviar = document.getElementById('btn-enviar');

  function mostrarEstado(texto, tipo) {
    estado.textContent = texto;
    estado.className = 'formulario__estado' + (tipo ? ' ' + tipo : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (form.action.indexOf('TU_ID_FORMSPREE') !== -1) {
      mostrarEstado('El formulario aún no está conectado a Formspree. Escríbenos a dfernandez@sistemiza.cl.', 'error');
      return;
    }

    btnEnviar.disabled = true;
    mostrarEstado('Enviando…', '');

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        mostrarEstado('¡Gracias! Recibimos tu mensaje y te responderemos pronto.', 'ok');
        return;
      }
      return res.json().then(function (datos) {
        var detalle = datos && datos.errors ? datos.errors.map(function (x) { return x.message; }).join(', ') : '';
        throw new Error(detalle);
      });
    }).catch(function () {
      mostrarEstado('No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos a dfernandez@sistemiza.cl.', 'error');
    }).then(function () {
      btnEnviar.disabled = false;
    });
  });

  /* ---------- Año del pie ---------- */
  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();
})();
