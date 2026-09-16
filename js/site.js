/* Truth Frame Studio — interacciones del sitio. Sin dependencias. */
(function () {
  "use strict";

  var WHATSAPP = "18496523537";
  var en = document.documentElement.lang === "en";
  var t = en ? {
    menuAbrir: "Open menu", menuCerrar: "Close menu",
    pausar: "Pause background video", reanudar: "Play background video",
    obligatorio: "This field is required.",
    saludo: "Hi Truth Frame Studio! I'm ",
    de: " from ", interes: "I'm interested in: ", fin: ""
  } : {
    menuAbrir: "Abrir menú", menuCerrar: "Cerrar menú",
    pausar: "Pausar video de fondo", reanudar: "Reproducir video de fondo",
    obligatorio: "Este campo es obligatorio.",
    saludo: "¡Hola, Truth Frame Studio! Soy ",
    de: ", de ", interes: "Me interesa: ", fin: ""
  };
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header: borde al hacer scroll y menú móvil */
  var header = document.querySelector(".header");
  var nav = document.getElementById("nav");
  var menuBtn = document.querySelector(".menu-btn");
  function alScroll() { header.classList.toggle("con-borde", window.scrollY > 8); }
  window.addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  function cerrarMenu() {
    nav.classList.remove("abierto");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", t.menuAbrir);
  }
  menuBtn.addEventListener("click", function () {
    var abierto = nav.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", String(abierto));
    menuBtn.setAttribute("aria-label", abierto ? t.menuCerrar : t.menuAbrir);
  });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) cerrarMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarMenu(); });

  /* Navegación: subrayado coral en la sección visible */
  var enlaces = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en_) {
        if (!en_.isIntersecting) return;
        enlaces.forEach(function (a) {
          a.setAttribute("aria-current", a.getAttribute("href") === "#" + en_.target.id ? "true" : "false");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    enlaces.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s) io.observe(s);
    });
  }

  /* Hero: video, pausa y timecode */
  var hero = document.querySelector(".hero");
  var video = hero && hero.querySelector("video");
  var pausa = hero && hero.querySelector(".hud-pausa");
  var tc = hero && hero.querySelector(".timecode");
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
    var parseTc = function (txt) {
      var p = txt.split(":").map(Number);
      return ((p[0] * 3600 + p[1] * 60 + p[2]) * 1000) + (p[3] / 30 * 1000);
    };
    if (!reducir) requestAnimationFrame(tick);
  }

  /* Portafolio: filtros */
  var filtros = document.querySelectorAll(".filtro");
  var obras = document.querySelectorAll(".obra");
  filtros.forEach(function (f) {
    f.addEventListener("click", function () {
      var cat = f.dataset.cat;
      filtros.forEach(function (x) { x.setAttribute("aria-pressed", String(x === f)); });
      obras.forEach(function (o) { o.hidden = cat !== "todo" && o.dataset.cat !== cat; });
    });
  });

  /* Portafolio: el iframe de YouTube se carga solo al hacer clic */
  document.querySelectorAll(".pantalla").forEach(function (b) {
    b.addEventListener("click", function () {
      var src = "https://www.youtube-nocookie.com/embed/" +
        (b.dataset.lista ? "videoseries?list=" + b.dataset.lista + "&" : b.dataset.video + "?") +
        "autoplay=1&rel=0&hl=" + (en ? "en" : "es");
      var f = document.createElement("iframe");
      f.src = src;
      f.title = b.getAttribute("aria-label");
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.allowFullscreen = true;
      var cont = document.createElement("div");
      cont.className = "pantalla";
      cont.appendChild(f);
      b.replaceWith(cont);
      f.focus();
    }, { once: true });
  });

  /* Contacto: el formulario arma el mensaje y abre WhatsApp */
  var form = document.getElementById("form-contacto");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (el) {
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
      if (d.get("canal").trim()) txt += "\n" + (en ? "Channel: " : "Canal: ") + d.get("canal").trim();
      if (d.get("mensaje").trim()) txt += "\n\n" + d.get("mensaje").trim();
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

  /* WhatsApp flotante: se esconde en el hero y en contacto */
  var flotante = document.querySelector(".flotante");
  var contacto = document.getElementById("contacto");
  if (flotante && "IntersectionObserver" in window) {
    var visibles = new Set();
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) visibles.add(x.target); else visibles.delete(x.target); });
      flotante.classList.toggle("oculto", visibles.size > 0);
    }, { threshold: 0.15 });
    if (hero) io2.observe(hero);
    if (contacto) io2.observe(contacto);
  }

  var anio = document.getElementById("anio");
  if (anio) anio.textContent = new Date().getFullYear();
})();
