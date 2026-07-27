(function () {
  "use strict";

  /* Expanding nav */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navScrim = document.getElementById("navScrim");

  function closeNav() {
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navScrim.classList.remove("is-visible");
  }

  function toggleNav() {
    var isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navScrim.classList.toggle("is-visible", isOpen);
  }

  navToggle.addEventListener("click", toggleNav);
  navScrim.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });
  document.querySelectorAll(".nav__links a").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* Logo mark: rendered inline (not fetched) so it always paints,
     including when the page is opened as a local file://. Click
     cycles stroke-weight variants; color inherits from .nav__mark
     via currentColor, so it inverts with the nav open/closed state
     automatically. */
  var markToggle = document.getElementById("markToggle");
  var markCrest = document.getElementById("markCrest");
  var markWeights = [
    { clip: 22.9, stroke: 2.6 },
    { clip: 23.4, stroke: 3.6 },
    { clip: 23.8, stroke: 4.4 }
  ];
  var markVariants = [];
  markWeights.forEach(function (w) {
    markVariants.push({ type: "line", clip: w.clip, stroke: w.stroke });
    markVariants.push({ type: "solid", clip: w.clip, stroke: w.stroke });
  });
  var markIndex = 5;

  function markLineSVG(w) {
    return (
      '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<clipPath id="markRing"><circle cx="24" cy="24" r="' + w.clip + '"></circle></clipPath>' +
      '<g clip-path="url(#markRing)" stroke="currentColor" stroke-width="' + w.stroke + '" fill="none">' +
      '<circle cx="24" cy="24" r="21.6"></circle>' +
      '<path d="M29 -2 V17 L18 15.1 V32.9 L29 31 V50"></path>' +
      "</g></svg>"
    );
  }

  function markSolidSVG(w) {
    return (
      '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<mask id="markCut" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">' +
      '<circle cx="24" cy="24" r="' + w.clip + '" fill="#fff"></circle>' +
      '<path d="M29 -2 V17 L18 15.1 V32.9 L29 31 V50" stroke="#000" stroke-width="' + w.stroke + '" fill="none"></path>' +
      "</mask>" +
      '<circle cx="24" cy="24" r="' + w.clip + '" fill="currentColor" mask="url(#markCut)"></circle>' +
      "</svg>"
    );
  }

  function updateMark() {
    var v = markVariants[markIndex];
    markCrest.innerHTML = v.type === "solid" ? markSolidSVG(v) : markLineSVG(v);
  }

  markToggle.addEventListener("click", function () {
    markIndex = (markIndex + 1) % markVariants.length;
    updateMark();
  });

  updateMark();

  /* Hero carousel */
  var slides = document.querySelectorAll(".hero__slide");
  var thumbs = document.querySelectorAll(".hero__thumb");
  var current = 0;
  var interval = 5500;
  var timer;

  function goTo(index) {
    slides[current].classList.remove("is-active");
    thumbs[current].classList.remove("is-active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    void thumbs[current].offsetWidth; /* ensure the wipe animation restarts */
    thumbs[current].classList.add("is-active");
  }

  function next() {
    goTo(current + 1);
  }

  function startAutoplay() {
    clearInterval(timer);
    timer = setInterval(next, interval);
  }

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener("click", function () {
      goTo(i);
      startAutoplay();
    });
  });

  if (slides.length > 1) startAutoplay();

  /* Mouse-follower "View Project" badge over the hero image */
  var heroCarousel = document.getElementById("heroCarousel");
  var heroFollower = document.getElementById("heroFollower");

  if (heroCarousel && heroFollower) {
    heroCarousel.addEventListener("mousemove", function (e) {
      var rect = heroCarousel.getBoundingClientRect();
      heroFollower.style.left = e.clientX - rect.left + "px";
      heroFollower.style.top = e.clientY - rect.top + "px";
    });
    heroCarousel.addEventListener("mouseenter", function () {
      heroFollower.classList.add("is-visible");
    });
    heroCarousel.addEventListener("mouseleave", function () {
      heroFollower.classList.remove("is-visible");
    });
    heroCarousel.addEventListener("click", function () {
      var href = slides[current].dataset.href;
      if (href) window.location.hash = href.replace(/^#/, "");
    });
  }

  /* Nav adapts to whatever section is scrolled beneath it. Plain
     scroll-position check rather than IntersectionObserver: a
     zero-height sentinel doesn't reliably re-fire intersection
     callbacks once scrolled fully past in some browsers. */
  var nav = document.getElementById("nav");
  var sentinel = document.getElementById("servicesSentinel");

  if (nav && sentinel) {
    var navThreshold = nav.getBoundingClientRect().bottom + 8;

    function updateNavLightness() {
      var isPast = sentinel.getBoundingClientRect().top <= navThreshold;
      nav.classList.toggle("nav--on-light", isPast);
    }

    window.addEventListener("scroll", updateNavLightness, { passive: true });
    window.addEventListener("resize", updateNavLightness);
    updateNavLightness();
  }

  /* Pin + fade: each pinned block stays put while the next one scrolls
     up over it, fading out as it goes (desktop only). Used for the
     hero -> Services handoff, and again between each service row. */
  function initParallaxPins(pairs) {
    var active = pairs.filter(function (p) {
      return p.pin && p.target;
    });
    if (!active.length) return;

    function onScroll() {
      active.forEach(function (p) {
        var rect = p.pin.getBoundingClientRect();
        var scrollable = rect.height - window.innerHeight;
        var progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
        p.target.style.opacity = String(1 - progress);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

  var desktopQuery = window.matchMedia("(min-width: 720px)");
  if (desktopQuery.matches) {
    var rowPins = document.querySelectorAll(".services__row-pin");

    var pairs = [];
    rowPins.forEach(function (pin) {
      pairs.push({ pin: pin, target: pin.querySelector(".services__row") });
    });
    initParallaxPins(pairs);
  }
})();
