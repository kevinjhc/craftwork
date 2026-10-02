/* Home page (and alternates): the What we do colour change and the cycling
   sketches. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);

  /* ---------- What we do: dark to light as it scrolls in ---------- */
  const lightUp = $(".a-collection");
  if (lightUp) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const lit = lightUp.getBoundingClientRect().top < innerHeight * 0.5;
      lightUp.classList.toggle("is-lit", lit);
      $(".a-intro")?.classList.toggle("is-lit", lit);
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Closing sketches: cycle through the drawings ---------- */
  const sketch = $("[data-sketch]");
  if (sketch && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const groups = [...sketch.querySelectorAll("g")];
    let i = 0;
    groups[0].classList.add("is-in");
    setInterval(() => {
      const cur = groups[i];
      cur.classList.replace("is-in", "is-out");
      i = (i + 1) % groups.length;
      setTimeout(() => {
        cur.classList.remove("is-out");
        groups[i].classList.add("is-in");
      }, 1200);
    }, 3800);
  }
})();
