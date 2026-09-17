/* Truth Frame Studio — interacciones del sitio. Sin dependencias. */
(function () {
  "use strict";

  var WHATSAPP = "18496523537";
  // Analítica sin cookies (Umami Cloud). Pegar aquí el "Website ID"; vacío = sin analítica.
  var ANALITICA = "";
  var raiz = document.documentElement;
  var en = raiz.lang === "en";
  var t = en ? {
    pausar: "Pause background video", reanudar: "Play background video",
    saludo: "Hi Truth Frame Studio! I'm ",
    de: " from ", interes: "I'm interested in: ", canal: "Channel: "
  } : {
    pausar: "Pausar video de fondo", reanudar: "Reproducir video de fondo",
    saludo: "¡Hola, Truth Frame Studio! Soy ",
    de: ", de ", interes: "Me interesa: ", canal: "Canal: "
  };
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ANALITICA) {
    var sc = document.createElement("script");
    sc.defer = true;
    sc.src = "https://cloud.umami.is/script.js";
    sc.setAttribute("data-website-id", ANALITICA);
    document.head.appendChild(sc);
  }
  // Eventos: pestana, servicio, guia, video, formulario, whatsapp
  function medir(evento, datos) {
    try { if (window.umami) window.umami.track(evento, datos); } catch (e) {}
  }
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ================= Pestañas =================
     Cada panel es una "página" con su propia URL (#servicios). Los enlaces internos
     cambian de panel sin recargar; atrás/adelante del navegador funcionan y
     recuerdan dónde ibas. Sin JS, el sitio se ve como una sola página larga. */
  var header = $(".header");
  var paneles = $$(".panel");
  var ids = paneles.map(function (p) { return p.id; });
  var enlacesNav = $$('.nav a, .pestanas a');
  var indicador = $(".nav .indicador");
  var scrolls = {};
  var actual = raiz.getAttribute("data-panel") || "inicio";
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function panelDe(hash) {
    var id = (hash || "").replace(/^#/, "");
    if (!id) return { panel: "inicio" };
    if (ids.indexOf(id) > -1) return { panel: id };
    var el = document.getElementById(id);
    var p = el && el.closest(".panel");
    return p ? { panel: p.id, destino: el } : null;
  }

  function moverIndicador() {
    if (!indicador) return;
    var a = $('.nav a[aria-current="page"]');
    if (!a || !a.offsetWidth) { indicador.style.opacity = "0"; return; }
    indicador.style.width = a.offsetWidth + "px";
    indicador.style.transform = "translateX(" + a.offsetLeft + "px)";
    indicador.style.opacity = "1";
  }

  function marcarNav(id) {
    enlacesNav.forEach(function (a) {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    moverIndicador();
  }

  function aplicar(id, destino, modo) {
    raiz.setAttribute("data-panel", id);
    var p = document.getElementById(id);
    document.title = p.getAttribute("data-titulo") || document.title;
    marcarNav(id);
    if (destino) {
      destino.scrollIntoView({ block: "start" });
    } else if (modo === "restaurar") {
      window.scrollTo(0, scrolls[id] || 0);
    } else {
      window.scrollTo(0, 0);
    }
    actualizarFlotante();
  }

  // Transición animada entre estados; si el navegador la aborta, el cambio igual se aplica
  function transicion(hacer) {
    if (!document.startViewTransition || reducir) return hacer();
    var vt = document.startViewTransition(hacer);
    vt.finished.catch(function () {});
    vt.ready.catch(function () {});
  }

  function ir(id, destino, modo, enfocar, despues) {
    var cambia = id !== actual;
    if (cambia) { scrolls[actual] = window.scrollY; medir("pestana", { panel: id }); }
    actual = id;
    var hacer = function () {
      aplicar(id, destino, modo);
      // Lector de pantalla: el foco pasa al contenido nuevo
      if (cambia && enfocar) {
        var h = destino || $("#" + id + " h1, #" + id + " h2");
        if (h) {
          if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
          h.focus({ preventScroll: true });
        }
      }
      if (despues) despues();
    };
    if (cambia) transicion(hacer);
    else hacer();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    var hash = a.getAttribute("href");
    if (hash === "#contenido") return;
    var r = panelDe(hash);
    if (!r) return;
    e.preventDefault();
    var url = r.panel === "inicio" && !r.destino ? location.pathname : hash;
    if (location.hash !== hash) history.pushState({ panel: r.panel }, "", url);
    // Acciones que viajan con el enlace
    ir(r.panel, r.destino, "arriba", true, function () {
      if (a.dataset.abrir) abrirServicio(a.dataset.abrir);
      if (a.dataset.servicio) elegirServicio(a.dataset.servicio);
    });
  });

  function alCambiarUrl() {
    var r = panelDe(location.hash) || { panel: "inicio" };
    if (r.panel !== actual || r.destino) ir(r.panel, r.destino, "restaurar", false);
  }
  window.addEventListener("popstate", alCambiarUrl);
  window.addEventListener("hashchange", alCambiarUrl);  // # escrito a mano

  window.addEventListener("resize", moverIndicador);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);

  /* Header: borde al hacer scroll */
  function alScroll() { header.classList.toggle("con-borde", window.scrollY > 8); }
  window.addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  /* ================= Hero: video, pausa y timecode ================= */
  var hero = $(".hero");
  var video = hero && $("video", hero);
  var pausa = hero && $(".hud-pausa", hero);
  var tc = hero && $(".timecode", hero);
  function pausar(estado) {
    hero.classList.toggle("pausado", estado);
    pausa.setAttribute("aria-label", estado ? t.reanudar : t.pausar);
    pausa.setAttribute("aria-pressed", String(estado));
    if (estado) video.pause(); else video.play().catch(function () {});
  }
  if (video) {
    if (reducir) {
      video.removeAttribute("autoplay");
      video.pause();
      pausar(true);
    }
    pausa.addEventListener("click", function () { pausar(!hero.classList.contains("pausado")); });
    var inicio = performance.now();
    var dos = function (n) { return (n < 10 ? "0" : "") + n; };
    var parseTc = function (txt) {
      var p = txt.split(":").map(Number);
      return ((p[0] * 3600 + p[1] * 60 + p[2]) * 1000) + (p[3] / 30 * 1000);
    };
    var tick = function () {
      if (!hero.classList.contains("pausado")) {
        var ms = performance.now() - inicio;
        var s = Math.floor(ms / 1000);
        tc.textContent = dos(Math.floor(s / 3600)) + ":" + dos(Math.floor(s / 60) % 60) + ":" + dos(s % 60) + ":" + dos(Math.floor((ms % 1000) / 1000 * 30));
      } else {
        inicio = performance.now() - parseTc(tc.textContent);
      }
      requestAnimationFrame(tick);
    };
    if (!reducir) requestAnimationFrame(tick);
  }

  /* ================= Servicios ================= */
  var chips = $$(".chip[data-abrir]");
  function abrirServicio(id) {
    var d = document.getElementById(id);
    if (!d) return;
    // Acordeón exclusivo también en navegadores sin <details name>
    $$(".servicio").forEach(function (x) { if (x !== d) x.open = false; });
    d.open = true;
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.abrir === id)); });
    requestAnimationFrame(function () {
      d.scrollIntoView({ block: "start", behavior: reducir ? "auto" : "smooth" });
    });
  }
  chips.forEach(function (c) {
    c.setAttribute("aria-pressed", "false");
    c.addEventListener("click", function () {
      medir("guia", { servicio: c.dataset.abrir });
      abrirServicio(c.dataset.abrir);
      $("summary", document.getElementById(c.dataset.abrir)).focus({ preventScroll: true });
    });
  });
  // Abrir un servicio a mano desmarca la guía
  $$(".servicio summary").forEach(function (sm) {
    sm.addEventListener("click", function () {
      if (!sm.parentNode.open) medir("servicio", { servicio: sm.parentNode.id });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
    });
  });

  /* ================= Portafolio: filtros ================= */
  var filtros = $$(".filtro");
  var obrasPortafolio = $$("#portafolio .obra");
  filtros.forEach(function (f) {
    f.addEventListener("click", function () {
      var cat = f.dataset.cat;
      var hacer = function () {
        filtros.forEach(function (x) { x.setAttribute("aria-pressed", String(x === f)); });
        obrasPortafolio.forEach(function (o) { o.hidden = cat !== "todo" && o.dataset.cat !== cat; });
      };
      transicion(hacer);
    });
  });

  /* ================= Reproductor =================
     El iframe de YouTube se crea solo al abrir el reproductor.
     Anterior/siguiente recorren las piezas visibles de la misma lista. */
  var rep = $(".reproductor");
  var repPantalla = rep && $(".rep-pantalla", rep);
  var lista = [];
  var pos = 0;
  var origen = null;

  function datosDe(boton) {
    var li = boton.closest(".obra");
    return {
      video: boton.dataset.video, lista: boton.dataset.lista,
      titulo: $("h3", li).textContent, desc: $("p", li).textContent
    };
  }
  function cargar() {
    var d = datosDe(lista[pos]);
    $(".rep-titulo", rep).textContent = d.titulo;
    $(".rep-desc", rep).textContent = d.desc;
    $(".rep-cuenta", rep).textContent = (pos + 1) + " / " + lista.length;
    $(".rep-ant", rep).disabled = pos === 0;
    $(".rep-sig", rep).disabled = pos === lista.length - 1;
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" +
      (d.lista ? "videoseries?list=" + d.lista + "&" : d.video + "?") +
      "autoplay=1&rel=0&hl=" + (en ? "en" : "es");
    f.title = d.titulo;
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.allowFullscreen = true;
    repPantalla.replaceChildren(f);
  }
  function mover(delta) {
    var n = pos + delta;
    if (n < 0 || n >= lista.length) return;
    pos = n;
    cargar();
  }
  if (rep && rep.showModal) {
    document.addEventListener("click", function (e) {
      var b = e.target.closest(".pantalla[data-video], .pantalla[data-lista]");
      if (!b) return;
      var ul = b.closest(".obras");
      lista = $$(".obra:not([hidden]) .pantalla", ul);
      pos = lista.indexOf(b);
      origen = b;
      cargar();
      medir("video", { titulo: datosDe(b).titulo });
      rep.showModal();
      $(".rep-cerrar", rep).focus();
    });
    $(".rep-cerrar", rep).addEventListener("click", function () { rep.close(); });
    $(".rep-ant", rep).addEventListener("click", function () { mover(-1); });
    $(".rep-sig", rep).addEventListener("click", function () { mover(1); });
    rep.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    });
    // Clic en el fondo oscuro cierra
    rep.addEventListener("click", function (e) { if (e.target === rep) rep.close(); });
    // Gesto: deslizar para cambiar de video en celular
    var x0 = null;
    rep.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    rep.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) mover(dx < 0 ? 1 : -1);
      x0 = null;
    });
    rep.addEventListener("close", function () {
      repPantalla.replaceChildren();
      if (origen) origen.focus({ preventScroll: true });
    });
  } else {
    // Navegadores sin <dialog>: el video se reproduce en la misma tarjeta
    $$(".pantalla").forEach(function (b) {
      b.addEventListener("click", function () {
        var d = datosDe(b);
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + (d.lista ? "videoseries?list=" + d.lista + "&" : d.video + "?") + "autoplay=1&rel=0";
        f.title = d.titulo;
        f.allowFullscreen = true;
        var cont = document.createElement("div");
        cont.className = "pantalla";
        cont.appendChild(f);
        b.replaceWith(cont);
      }, { once: true });
    });
  }

  /* ================= Contacto ================= */
  var form = $("#form-contacto");
  var selServicio = form && form.elements.servicio;
  function elegirServicio(n) {
    if (!selServicio) return;
    selServicio.selectedIndex = Number(n);
    var campo = selServicio.closest(".campo");
    campo.classList.remove("invalido");
    selServicio.setAttribute("aria-invalid", "false");
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$("[required]", form).forEach(function (el) {
        var campo = el.closest(".campo");
        var vacio = !el.value.trim();
        campo.classList.toggle("invalido", vacio);
        el.setAttribute("aria-invalid", String(vacio));
        if (vacio && ok) { el.focus(); ok = false; }
      });
      if (!ok) return;
      var d = new FormData(form);
      var txt = t.saludo + d.get("nombre").trim();
      if (d.get("organizacion").trim()) txt += t.de + d.get("organizacion").trim();
      txt += ".\n\n" + t.interes + d.get("servicio") + ".";
      if (d.get("canal").trim()) txt += "\n" + t.canal + d.get("canal").trim();
      if (d.get("mensaje").trim()) txt += "\n\n" + d.get("mensaje").trim();
      medir("whatsapp", { origen: "formulario", servicio: d.get("servicio") });
      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(txt), "_blank", "noopener");
    });
    form.addEventListener("input", function (e) {
      var campo = e.target.closest(".campo");
      if (campo && campo.classList.contains("invalido") && e.target.value.trim()) {
        campo.classList.remove("invalido");
        e.target.setAttribute("aria-invalid", "false");
      }
    });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="https://wa.me/"]');
    if (a) medir("whatsapp", { origen: a.dataset.origen || "otro" });
  });

  /* WhatsApp flotante: oculto sobre el hero y en la pestaña Contacto */
  var flotante = $(".flotante");
  var heroVisible = true;
  function actualizarFlotante() {
    if (flotante) flotante.classList.toggle("oculto", actual === "contacto" || (actual === "inicio" && heroVisible));
  }
  if (flotante && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      heroVisible = es[0].isIntersecting;
      actualizarFlotante();
    }, { threshold: 0.15 }).observe(hero);
  } else if (flotante) {
    heroVisible = false;
  }
  actualizarFlotante();

  // Estado inicial (enlace directo a #algo)
  (function () {
    var r = panelDe(location.hash) || { panel: "inicio" };
    actual = r.panel;
    aplicar(r.panel, r.destino, "arriba");
    // Las fuentes cambian las alturas: se repite el salto cuando todo cargó
    if (r.destino) window.addEventListener("load", function () { r.destino.scrollIntoView({ block: "start" }); });
    if (/^#s\d$/.test(location.hash)) abrirServicio(location.hash.slice(1));
  })();

  var anio = $("#anio");
  if (anio) anio.textContent = new Date().getFullYear();
})();
