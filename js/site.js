/* Truth Frame Studio — interacciones del sitio. Sin dependencias. */
(function () {
  "use strict";

  var WHATSAPP = "18496523537";
  // Registro de consultas (Google Apps Script, ver tools/formulario/). Vacío = el formulario
  // abre WhatsApp con las respuestas, como antes. window.TFS_FORMULARIO solo se usa en pruebas.
  var FORMULARIO = window.TFS_FORMULARIO || "";
  // Analítica sin cookies (Umami Cloud). Pegar aquí el "Website ID"; vacío = sin analítica.
  var ANALITICA = "";
  var raiz = document.documentElement;
  var en = raiz.lang === "en";
  var t = en ? {
    pausar: "Pause background video", reanudar: "Play background video",
    saludo: "Hi Truth Frame Studio! I'm ",
    enviando: "Sending…", enviar: "Send my information", seguirWa: "Continue on WhatsApp",
    pieWa: "WhatsApp will open with your answers ready to send.",
    pieCorreo: "Diana will reply within 24 hours at the latest.",
    medio: { whatsapp: "WhatsApp", correo: "email" },
    servicio: "Service I'm interested in:",
    servicios: {
      sesion: "YouTube strategy session", lanzamiento: "YouTube channel launch",
      direccion: "Channel management and growth", contenidos: "Content production",
      especiales: "Special productions", "direccion-medios": "Media direction",
      "gestion-medios": "Full digital media management",
      "evento-transmision": "Event production and streaming", "evento-integral": "Full event production"
    }
  } : {
    pausar: "Pausar video de fondo", reanudar: "Reproducir video de fondo",
    saludo: "¡Hola, Truth Frame Studio! Soy ",
    enviando: "Enviando…", enviar: "Enviar mi información", seguirWa: "Continuar en WhatsApp",
    pieWa: "Se abrirá WhatsApp con tus respuestas listas para enviar.",
    pieCorreo: "Diana te responderá en un plazo máximo de 24 horas.",
    medio: { whatsapp: "WhatsApp", correo: "correo electrónico" },
    servicio: "Servicio que me interesa:",
    servicios: {
      sesion: "Sesión estratégica para YouTube", lanzamiento: "Lanzamiento de canal desde cero",
      direccion: "Dirección y crecimiento de canal", contenidos: "Producción de contenidos",
      especiales: "Producciones especiales", "direccion-medios": "Dirección de medios",
      "gestion-medios": "Gestión integral de medios",
      "evento-transmision": "Producción audiovisual y transmisión", "evento-integral": "Producción integral del evento"
    }
  };
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (ANALITICA) {
    var sc = document.createElement("script");
    sc.defer = true;
    sc.src = "https://cloud.umami.is/script.js";
    sc.setAttribute("data-website-id", ANALITICA);
    document.head.appendChild(sc);
  }
  // Eventos: pestana, division, video, formulario, whatsapp
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
    if (!paneles.length) return null;  // páginas sin pestañas (p. ej. la de la auditoría)
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
      if (a.dataset.servicio) elegirServicio(a.dataset.servicio);
    });
  });

  function alCambiarUrl() {
    if (!paneles.length) return;
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

  /* ================= Divisiones =================
     Desde la reestructuración del 19-sep cada división tiene su página. Aquí solo medimos
     por cuál entró el visitante. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('.division, .caminos a');
    if (a) medir("division", { ruta: a.getAttribute("href") });
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
    var li = boton.closest("li");
    return {
      video: boton.dataset.video, lista: boton.dataset.lista,
      titulo: $("h3", li).textContent, desc: ($(".caso-meta", li) || $("h3 + p", li) || $("p", li)).textContent
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
      var ul = b.closest("ul");
      lista = $$("li:not([hidden]) > .pantalla", ul);
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

  /* ================= Contacto =================
     Preguntas de selección con campos condicionales. Lo que queda oculto se deshabilita:
     no se valida ni se envía. Con FORMULARIO configurado, la consulta se guarda y solo
     se confirma cuando el registro responde {ok: true}. */
  var form = $("#form-contacto");
  var exito = $(".form-exito");
  var abierto = Date.now();
  // Servicio elegido con un botón (data-servicio o ?servicio=): preselecciona las respuestas
  // del área correspondiente. Cada clave es un radio del formulario.
  var RESPUESTAS_DE = {
    sesion: { area: "youtube" },
    lanzamiento: { area: "youtube", tiene_canal: "no" },
    direccion: { area: "youtube", tiene_canal: "si" },
    contenidos: { area: "produccion", produccion_tipo: "contenidos" },
    especiales: { area: "produccion", produccion_tipo: "especial" },
    "direccion-medios": { area: "agencia", agencia_tipo: "direccion" },
    "gestion-medios": { area: "agencia", agencia_tipo: "delegar" },
    "evento-transmision": { area: "eventos", evento_tipo: "organizado" },
    "evento-integral": { area: "eventos", evento_tipo: "integral" },
    orientacion: { area: "no_seguro" }
  };

  function valor(nombre) {
    var marcados = $$('[name="' + nombre + '"]:checked:not(:disabled)', form);
    return marcados.map(function (x) { return x.value; });
  }
  function texto(input) { return $("span", input.closest(".opcion")).textContent; }

  function condiciones() {
    $$(".condicional", form).forEach(function (bloque) {
      var par = bloque.dataset.si.split("=");
      var ver = valor(par[0]).indexOf(par[1]) > -1;
      bloque.hidden = !ver;
      $$("input, select", bloque).forEach(function (el) { el.disabled = !ver; });
      if (!ver) bloque.classList.remove("invalido");
    });
    // Con país "Otro", el número va completo con su código
    var pais = $("#f-pais");
    if (pais) $("#f-telefono").placeholder = pais.value === "otro" ? "+44 20 7946 0000" : "809 555 0123";
  }

  function marcar(el, malo) {
    el.classList.toggle("invalido", malo);
    $$("input, select", el).forEach(function (x) {
      if (x.type !== "radio" && x.type !== "checkbox") x.setAttribute("aria-invalid", String(malo));
    });
  }

  function validar() {
    var primero = null;
    $$(".grupo", form).forEach(function (g) {
      if (g.hidden) return;
      var malo = valor(g.dataset.grupo).length === 0;
      marcar(g, malo);
      if (malo && !primero) primero = $("input", g);
    });
    $$(".campo", form).forEach(function (c) {
      if (c.hidden) return;
      var el = $("[data-requerido]", c);
      if (!el) return;
      var v = el.value.trim();
      var malo = !v;
      if (el.type === "email") malo = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (el.name === "telefono") {
        var digitos = v.replace(/\D/g, "");
        malo = digitos.length < 7 || digitos.length > 15 || ($("#f-pais").value === "otro" && v.charAt(0) !== "+");
      }
      marcar(c, malo);
      if (malo && !primero) primero = el;
    });
    if (primero) primero.focus();
    return !primero;
  }

  function datos() {
    var d = { idioma: en ? "en" : "es", nombre: form.elements.nombre.value.trim() };
    ["tipo", "area", "tiene_canal", "produccion_tipo", "agencia_tipo", "evento_tipo", "medio"].forEach(function (k) {
      d[k] = valor(k)[0] || "";
    });
    $$("input:not([type=radio]):not([type=checkbox]):not(:disabled), select:not(:disabled), textarea:not(:disabled)", form).forEach(function (el) {
      if (el.name && !(el.name in d)) d[el.name] = el.value.trim();
    });
    d.segundos = Math.round((Date.now() - abierto) / 1000);
    return d;
  }

  function mensajeWhatsApp() {
    // En el orden del formulario: servicio elegido, preguntas con sus respuestas y los campos visibles
    var lineas = [t.saludo + form.elements.nombre.value.trim() + "."];
    var sv = form.elements.servicio.value;
    if (sv && t.servicios[sv]) lineas.push("• " + t.servicio + " " + t.servicios[sv]);
    $$(".grupo, .campo", form).forEach(function (el) {
      if (el.closest("[hidden]")) return;
      if (el.classList.contains("grupo")) {
        var r = $$("input:checked", el).map(texto).join(", ");
        if (r) lineas.push("• " + $("legend", el).firstChild.textContent.trim() + " " + r);
        return;
      }
      var campo = $("input, select, textarea", el);
      if (!campo || campo.name === "nombre" || campo.name === "pais" || campo.type === "tel" || !campo.value.trim()) return;
      var etiqueta = $("label", el).firstChild.textContent.trim();
      var v = campo.tagName === "SELECT" ? campo.options[campo.selectedIndex].text : campo.value.trim();
      lineas.push("• " + etiqueta + ": " + v);
    });
    return lineas.join("\n");
  }

  // Servicio elegido: se muestra arriba del formulario y viaja con la consulta
  var cajaServicio = form && $(".form-servicio", form);
  function elegirServicio(clave) {
    if (!form) return;
    var nombre = t.servicios[clave];
    form.elements.servicio.value = nombre ? clave : "";
    if (cajaServicio) {
      cajaServicio.hidden = !nombre;
      $(".form-servicio-nombre", cajaServicio).textContent = nombre || "";
    }
    var respuestas = RESPUESTAS_DE[clave];
    if (!respuestas) return;
    var ultimo = null;
    Object.keys(respuestas).forEach(function (campo) {
      var r = $('[name="' + campo + '"][value="' + respuestas[campo] + '"]', form);
      // El área se marca primero: las preguntas que dependen de ella están ocultas hasta entonces
      if (r) { r.checked = true; ultimo = r; condiciones(); }
    });
    if (ultimo) ultimo.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (cajaServicio) {
    $(".form-servicio-quitar", cajaServicio).addEventListener("click", function () {
      elegirServicio("");
      $('[name="tipo"]', form).focus();
    });
  }

  /* El botón depende del medio elegido (reestructuración del 19-sep, §8):
     WhatsApp → «Continuar en WhatsApp»; correo → «Enviar mi información».
     Sin FORMULARIO no hay a dónde enviar el correo, así que todo sale por WhatsApp. */
  function porWhatsApp() { return !FORMULARIO || valor("medio")[0] !== "correo"; }
  function actualizarBoton() {
    var wa = porWhatsApp();
    $(".enviar-texto", form).textContent = wa ? t.seguirWa : t.enviar;
    $(".pie", form).textContent = wa ? t.pieWa : t.pieCorreo;
  }

  if (form) {
    condiciones();
    actualizarBoton();
    form.addEventListener("change", function (e) {
      condiciones();
      if (e.target.name === "medio") actualizarBoton();
      var g = e.target.closest(".grupo, .campo");
      if (g && g.classList.contains("invalido")) marcar(g, false);
    });
    form.addEventListener("input", function (e) {
      var c = e.target.closest(".campo");
      if (c && c.classList.contains("invalido") && e.target.value.trim()) marcar(c, false);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      $(".form-error", form).hidden = true;
      if (!validar()) return;
      var d = datos();
      var wa = porWhatsApp();
      var texto = wa ? mensajeWhatsApp() : "";
      if (!FORMULARIO) {
        medir("whatsapp", { origen: "formulario", area: d.area });
        window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
        return;
      }
      if (form.elements.sitio_web.value) return;  // trampa para robots
      var boton = $(".enviar", form);
      var etiqueta = $(".enviar-texto", boton);
      boton.disabled = true;
      etiqueta.textContent = t.enviando;
      // Petición "simple" (sin preflight): Apps Script no responde a OPTIONS
      fetch(FORMULARIO, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(d)
      }).then(function (r) { return r.json(); }).then(function (r) {
        if (!r || r.ok !== true) throw new Error("sin confirmación");
        medir("formulario", { area: d.area, medio: d.medio, servicio: d.servicio || "" });
        // Quien eligió WhatsApp sigue la conversación allá; quien eligió correo ve la confirmación
        if (wa) {
          medir("whatsapp", { origen: "formulario", area: d.area });
          window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
        }
        $(".exito-medio", exito).textContent = t.medio[d.medio];
        form.hidden = true;
        exito.hidden = false;
        exito.focus();
      }).catch(function () {
        $(".form-error", form).hidden = false;
        boton.disabled = false;
        actualizarBoton();
      });
    });
  }

  /* Testimonios: la sección solo aparece si tiene testimonios cargados */
  var testimonios = $("#testimonios");
  if (testimonios && $(".testimonios li", testimonios)) testimonios.hidden = false;

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
    // Enlace desde otra página con el servicio elegido: /?servicio=auditoria#contacto
    var pedido = /[?&]servicio=([\w-]+)/.exec(location.search);
    if (pedido) {
      elegirServicio(pedido[1]);
      history.replaceState(null, "", location.pathname + location.hash);
    }
    if (!paneles.length) return;
    var r = panelDe(location.hash) || { panel: "inicio" };
    actual = r.panel;
    aplicar(r.panel, r.destino, "arriba");
    // Las fuentes cambian las alturas: se repite el salto cuando todo cargó
    if (r.destino) window.addEventListener("load", function () { r.destino.scrollIntoView({ block: "start" }); });
  })();

  var anio = $("#anio");
  if (anio) anio.textContent = new Date().getFullYear();
})();
