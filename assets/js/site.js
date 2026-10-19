(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Header ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-solid", window.scrollY > (header.classList.contains("is-over") ? window.innerHeight - 80 : 8));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const toggle = $(".menu-toggle");
    toggle?.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
      // Plain-text toggles swap their label; richer ones style off aria-expanded.
      if (!toggle.children.length) toggle.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- Full-screen menu ---------- */
  const panel = $(".menu-panel");
  if (panel) {
    const header = $(".site-header");
    const toggle = $(".menu-toggle");
    const pic = $(".menu-media img", panel);
    // Block page scroll while open, without hiding the scrollbar (hiding it
    // would shift the layout). Escape closes it.
    const isOpen = () => header.classList.contains("menu-open");
    new MutationObserver(() => {
      document.documentElement.classList.toggle("menu-locked", isOpen());
    }).observe(header, { attributes: true, attributeFilter: ["class"] });
    const block = (e) => { if (isOpen()) e.preventDefault(); };
    addEventListener("wheel", block, { passive: false });
    addEventListener("touchmove", block, { passive: false });
    addEventListener("keydown", (e) => {
      if (isOpen() && [" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && header.classList.contains("menu-open")) toggle.click(); });
    // Swap the photo to match the hovered link.
    panel.querySelectorAll("[data-img]").forEach((a) => {
      new Image().src = a.dataset.img;
      a.addEventListener("pointerenter", () => {
        if (pic.getAttribute("src") === a.dataset.img) return;
        pic.classList.add("is-swapping");
        setTimeout(() => { pic.src = a.dataset.img; pic.classList.remove("is-swapping"); }, 180);
      });
    });
  }
  /* ---------- Home: hero carousel ---------- */
  const hero = $("[data-hero]");
  if (hero) {
    const slides = $$(".hero-slide", hero);
    const thumbs = $$(".hero-thumb", hero);
    const WIPE_MS = 1400;
    let current = 0;
    let leaveTimer = 0;
    hero.classList.add("is-static");

    const setHidden = (el, hidden) => {
      el.setAttribute("aria-hidden", hidden);
      el.tabIndex = hidden ? -1 : 0;
    };

    const go = (n) => {
      n = (n + slides.length) % slides.length;
      if (n === current) return;
      const prev = current;
      current = n;
      hero.classList.remove("is-static");
      clearTimeout(leaveTimer);
      slides.forEach((el) => el.classList.remove("is-leaving"));

      slides[prev].classList.remove("is-active");
      slides[prev].classList.add("is-leaving");
      void slides[n].offsetWidth; // restart the fade from transparent
      slides[n].classList.add("is-active");
      leaveTimer = setTimeout(() => slides[prev].classList.remove("is-leaving"), WIPE_MS);

      thumbs[prev].classList.remove("is-active");
      thumbs[prev].removeAttribute("aria-current");
      thumbs[n].classList.add("is-active");
      thumbs[n].setAttribute("aria-current", "true");

      slides.forEach((el, i) => setHidden(el, i !== n));
    };

    // The wipe across the active thumbnail is the timer: when it finishes,
    // advance. Clicking the open pill goes to that project.
    thumbs.forEach((t, i) => {
      t.addEventListener("click", () => {
        if (i === current) location.href = t.dataset.href;
        else go(i);
      });
      $(".hero-thumb-img i", t).addEventListener("animationend", () => { if (i === current) go(current + 1); });
    });
    // Pause only while the pill itself is hovered, not the whole image.
    const pill = $(".hero-thumbs", hero);
    pill.addEventListener("mouseenter", () => hero.classList.add("is-paused"));
    pill.addEventListener("mouseleave", () => hero.classList.remove("is-paused"));
    hero.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    });
    // Mouse drag: the image follows the pointer a little, and a long enough
    // drag changes slide. A drag never counts as a click on the slide link.
    const stage = $(".hero-slides", hero);
    let dragX = null, dragDx = 0;
    stage.addEventListener("dragstart", (e) => e.preventDefault());
    stage.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragX = e.clientX; dragDx = 0;
    });
    stage.addEventListener("pointermove", (e) => {
      if (dragX === null) return;
      dragDx = e.clientX - dragX;
      // Capture only once it's really a drag; capturing on pointerdown would
      // retarget the click to the stage and stop the slide link working.
      if (Math.abs(dragDx) > 6 && !stage.classList.contains("is-dragging")) {
        stage.classList.add("is-dragging");
        stage.setPointerCapture(e.pointerId);
      }
      // Picture is scaled up a touch while dragging so the shifted edge never shows.
      const shift = Math.max(-48, Math.min(48, dragDx * 0.25));
      $("picture", slides[current]).style.transform = `translateX(${shift}px) scale(1.1)`;
    });
    const endDrag = () => {
      if (dragX === null) return;
      $("picture", slides[current]).style.transform = "";
      if (Math.abs(dragDx) > 60) go(current + (dragDx < 0 ? 1 : -1));
      dragX = null;
      requestAnimationFrame(() => stage.classList.remove("is-dragging"));
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("click", (e) => { if (Math.abs(dragDx) > 6) e.preventDefault(); }, true);

    let startX = null;
    hero.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ---------- Testimonials marquee (auto-drift + drag / swipe / wheel) ---------- */
  $$("[data-marquee] .marquee-row").forEach((row) => {
    const track = $(".marquee-track", row);
    const set = $(".marquee-set", track);
    // A second copy lets the track wrap seamlessly.
    const clone = set.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    $$("a", clone).forEach((a) => (a.tabIndex = -1));
    track.append(clone);

    const SPEED = 40; // px per second of idle drift
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, v = 0, width = set.offsetWidth;
    let dragging = false, hovering = false, startX = 0, lastX = 0, lastT = 0, moved = 0;
    let prev = performance.now();

    const wrap = () => { x = ((x % width) - width) % width; }; // keep x in (-width, 0]
    const render = () => { track.style.transform = `translate3d(${x}px, 0, 0)`; };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (!dragging) {
        if (Math.abs(v) > 5) { x += v * dt; v *= Math.pow(0.002, dt); } // short momentum after a flick
        else { v = 0; if (!hovering && !still) x -= SPEED * dt; }
      }
      wrap(); render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    row.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hovering = true; });
    row.addEventListener("pointerleave", () => { hovering = false; });

    row.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true; moved = 0; v = 0;
      startX = lastX = e.clientX; lastT = performance.now();
      row.setPointerCapture(e.pointerId);
    });
    row.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const t = performance.now();
      x += dx;
      v = Math.max(-2400, Math.min(2400, dx / Math.max(1, t - lastT) * 1000));
      lastX = e.clientX; lastT = t;
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      if (moved > 6) row.classList.add("is-dragging");
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (performance.now() - lastT > 80) v = 0; // held still before release: no fling
      requestAnimationFrame(() => row.classList.remove("is-dragging"));
    };
    row.addEventListener("pointerup", end);
    row.addEventListener("pointercancel", end);
    // A drag shouldn't also count as a click on "Read on Houzz".
    row.addEventListener("click", (e) => { if (moved > 6) e.preventDefault(); }, true);

    // Cards: one shared slot height, and a full-length measure for the
    // reviews that get cut off, so they can open on hover.
    const reviews = $$(".review", track);
    const measure = () => {
      row.style.setProperty("--review-h", "0px");
      reviews.forEach((r) => {
        const q = $(".review-quote", r);
        q.style.setProperty("--full", `${q.scrollHeight}px`);
        r.classList.toggle("is-long", q.scrollHeight > q.clientHeight + 2);
      });
      const h = Math.max(...reviews.map((r) => $(".review-card", r).offsetHeight));
      row.style.setProperty("--review-h", `${h}px`);
      width = set.offsetWidth;
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);

    // Hovered card tilts toward the pointer.
    let tilted = null;
    const untilt = () => {
      if (!tilted) return;
      tilted.style.removeProperty("--rx"); tilted.style.removeProperty("--ry");
      tilted = null;
    };
    row.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || dragging) return untilt();
      const r = e.target.closest(".review");
      const card = r && $(".review-card", r);
      if (card !== tilted) untilt();
      if (!card) return;
      const box = r.getBoundingClientRect();
      const px = (e.clientX - box.left) / box.width - 0.5;
      const py = (e.clientY - box.top) / card.offsetHeight - 0.5;
      card.style.setProperty("--ry", `${(px * 10).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
      tilted = card;
    });
    row.addEventListener("pointerleave", untilt);

    // Horizontal trackpad swipes / shift+wheel; vertical wheel still scrolls the page.
    row.addEventListener("wheel", (e) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      x -= dx; v = 0;
    }, { passive: false });
  });

  /* ---------- Work index ---------- */
  // The grid, the index list and the filter options are plain HTML in
  // work.html; this only filters and switches views.
  const grid = $("[data-work-grid]");
  if (grid) {
    const list = $("[data-work-list]");
    const filters = $("[data-filters]");
    const toggle = $(".filter-toggle", filters);
    const panel = $(".filter-panel", filters);
    const summary = $(".filter-summary", filters);
    const nameOf = (input) => input.nextElementSibling.textContent;
    const boxes = $$("input", panel);

    const apply = () => {
      const on = boxes.filter((b) => b.checked).map((b) => b.value);
      $$("[data-cats]", grid).concat($$("[data-cats]", list)).forEach((el) => {
        el.hidden = on.length > 0 && !el.dataset.cats.split(" ").some((c) => on.includes(c));
      });
      summary.textContent = !on.length ? "All" : on.length === 1 ? nameOf(boxes.find((b) => b.checked)) : `${on.length} selected`;
      toggle.classList.toggle("is-filtered", on.length > 0);
      const url = new URL(location.href);
      on.length ? url.searchParams.set("c", on.join(",")) : url.searchParams.delete("c");
      history.replaceState(null, "", url);
    };
    const open = (yes) => { panel.hidden = !yes; toggle.setAttribute("aria-expanded", yes); };
    toggle.addEventListener("click", () => open(panel.hidden));
    panel.addEventListener("change", apply);
    $("[data-clear]", panel).addEventListener("click", () => { boxes.forEach((b) => (b.checked = false)); apply(); });
    document.addEventListener("click", (e) => { if (!filters.contains(e.target)) open(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { open(false); toggle.focus(); } });

    const initial = (new URLSearchParams(location.search).get("c") || "").split(",");
    boxes.forEach((b) => (b.checked = initial.includes(b.value)));
    apply();

    $("[data-view]")?.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const isList = b.dataset.mode === "list";
      grid.hidden = isList;
      list.hidden = !isList;
      $$("[data-view] button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    });
  }

  /* ---------- Project page ---------- */
  // Coming from the Work page? Go back to it as it was (filters and all).
  const back = $("[data-back]");
  if (back && document.referrer.includes("/work.html")) back.href = document.referrer;

  /* ---------- Footer: keep the copyright year current ---------- */
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Work: flag the filter bar while it's pinned ---------- */
  const workBar = $(".work-bar");
  if (workBar) {
    const check = () => workBar.classList.toggle("is-stuck", workBar.getBoundingClientRect().top <= header.offsetHeight + 0.5);
    window.addEventListener("scroll", check, { passive: true });
    check();
  }

  /* ---------- Services: a row fades and recedes as the next one covers it ---------- */
  const services = $$(".service");
  if (services.length > 1) {
    const wide = matchMedia("(min-width: 901px)");
    let ticking = false;
    const update = () => {
      ticking = false;
      services.forEach((el, i) => {
        const next = services[i + 1];
        const r = el.getBoundingClientRect();
        // Pinned under the header: drop the top rule so it doesn't double up.
        el.classList.toggle("is-stuck", wide.matches && r.top <= header.offsetHeight + 0.5);
        if (!next || !wide.matches) return el.style.removeProperty("--recede");
        // 0 while the next row sits below, 1 once it fully covers this one.
        const covered = (r.bottom - next.getBoundingClientRect().top) / r.height;
        const recede = Math.min(1, Math.max(0, (covered - 0.1) / 0.75));
        el.style.setProperty("--recede", recede.toFixed(3));
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Process: scroll stepper ---------- */
  const stepsEl = $("[data-steps]");
  if (stepsEl) {
    const imgs = $$(".steps-img", stepsEl);
    const items = $$(".step", stepsEl);
    const fill = $("[data-steps-fill]", stepsEl);
    const pin = $(".steps-pin", stepsEl);
    const wide = matchMedia("(min-width: 901px)");
    const n = items.length;
    let current = 0;
    let ticking = false;

    const set = (i) => {
      if (i === current) return;
      [imgs, items].forEach((list) => {
        list[current].classList.remove("is-active");
        list[i].classList.add("is-active");
      });
      current = i;
    };
    // Scroll distance the pinned frame travels, and where the section starts.
    const range = () => ({
      start: stepsEl.getBoundingClientRect().top + window.scrollY - header.offsetHeight,
      total: stepsEl.offsetHeight - pin.offsetHeight,
    });
    const update = () => {
      ticking = false;
      if (!wide.matches) return;
      const { start, total } = range();
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / total));
      fill.style.transform = `scaleY(${p})`;
      set(Math.min(n - 1, Math.floor(p * n)));
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Contact form ---------- */
  const form = $("[data-inquiry]");
  if (form) {
    const sync = (box) => {
      const svc = box.closest(".svc");
      svc.classList.toggle("is-on", box.checked);
      const sel = $("select", svc);
      sel.disabled = !box.checked;
      sel.tabIndex = box.checked ? 0 : -1;
    };
    $$(".svc-head input", form).forEach((box) => {
      sync(box);
      box.addEventListener("change", () => sync(box));
    });
    const pre = new URLSearchParams(location.search).get("service");
    const preBox = pre && $(`.svc-head input[value="${CSS.escape(pre)}"]`, form);
    if (preBox) { preBox.checked = true; sync(preBox); }
    // FormSubmit.co emails each inquiry as a table, one row per key below.
    // Testing address for now; switch to jayme@craftworkhome.com at launch.
    const INBOX = "kevinjhc@gmail.com";
    const status = $(".form-status", form);
    const button = $("button[type=submit]", form);
    const done = $(".form-done", form);
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    $(".form-again", form).addEventListener("click", () => {
      form.classList.remove("is-sent");
      done.hidden = true;
      $("#f-name", form).focus();
    });
    const text = (sel) => {
      const el = $(sel, form);
      return (el.tagName === "SELECT" ? el.selectedOptions[0]?.textContent : el.value).trim();
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if ($("[name=_honey]", form).value) return;

      const services = $$(".svc", form)
        .filter((svc) => $(".svc-head input", svc).checked)
        .map((svc) => {
          const sel = $("select", svc);
          const budget = sel.value ? ` (${sel.selectedOptions[0].textContent})` : "";
          return $(".svc-name", svc).textContent + budget;
        });
      const pick = (sel) => ($(sel, form).value ? text(sel) : "");
      const name = text("#f-name");
      const email = text("#f-email");
      const rows = {
        "Name": name,
        "Email": email,
        "Phone": text("#f-phone"),
        "Project location": text("#f-loc"),
        "Services and budget": services.join("\n"),
        "Ideal start": pick("#f-timeline"),
        "Stage": pick("#f-stage"),
        "Project": text("#f-msg"),
        "Heard about us": text("#f-ref"),
      };
      for (const k in rows) if (!rows[k]) rows[k] = "—";

      button.disabled = true;
      status.textContent = "Sending…";
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${INBOX}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            ...rows,
            _subject: `New inquiry from ${name}`,
            _replyto: email,
            _template: "table",
            _captcha: "false",
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== "true") throw new Error(data.message || res.status);
        form.reset();
        $$(".svc-head input", form).forEach(sync);
        status.textContent = "";
        form.classList.add("is-sent");
        done.hidden = false;
        done.focus({ preventScroll: true });
        done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      } catch (err) {
        status.textContent = "Something went wrong sending that. Please try again in a moment.";
        console.error("Inquiry failed:", err);
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ---------- Cursor-follow label ---------- */
  if ($("[data-cursor]") && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const label = document.createElement("div");
    label.className = "cursor";
    label.setAttribute("aria-hidden", "true");
    document.body.append(label);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const place = () => { label.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`; };
    const tick = () => {
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      place();
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      if (still || !label.classList.contains("is-on")) { cx = x; cy = y; place(); }
      else if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) { label.textContent = t.dataset.cursor; label.classList.add("is-on"); }
    });
    document.addEventListener("pointerout", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t && !t.contains(e.relatedTarget)) label.classList.remove("is-on");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }
})();
