// Motion layer for every page: 3D tilt cards, sections that swing in on scroll,
// a spinning mini record on the questions + pricing pages, and equalizer bars in the player.
// Everything here switches off when the visitor's device asks for reduced motion.
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  // calm version: reduced-motion setting, or a browser too old for scroll-triggered effects
  if (reduced || !("IntersectionObserver" in window)) { document.documentElement.classList.add("calm"); return; }
  document.documentElement.classList.add("moving");

  // ---------- sections swing into place as they scroll into view (each one once)
  const revealSel = [
    "main section:not(.hero) h2", "main section:not(.hero) .sub", ".lyric", ".steps li", ".tier",
    ".more", ".incl li", ".tracks li", ".player", ".faq details", ".styles-ring"
  ].join(",");
  const items = $$(revealSel);
  items.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.matches(revealSel));
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 70 + "ms");
    el.classList.add("reveal");
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -40px 0px", threshold: 0 });
  items.forEach((el) => io.observe(el));

  // ---------- cards lean toward the mouse in 3D, with a soft light sheen (mouse/trackpad only)
  if (finePointer) {
    $$(".tier, .lyric, .player, .namebox, .wizard .wstep, .more").forEach((card) => {
      const strength = card.matches(".wizard .wstep, .namebox") ? 3 : 8;
      card.classList.add("tilt");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--rx", (-y * strength).toFixed(2) + "deg");
        card.style.setProperty("--ry", (x * strength).toFixed(2) + "deg");
        card.style.setProperty("--gx", (x + 0.5) * 100 + "%");
        card.style.setProperty("--gy", (y + 0.5) * 100 + "%");
        card.classList.add("tilting");
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg");
        card.classList.remove("tilting");
      });
    });
  }

  // ---------- small spinning record on the questions + pricing pages
  const host = document.querySelector(".startpage .wrap, .pricepage .wrap");
  if (host) {
    const mini = document.createElement("div");
    mini.className = "mini-rec";
    mini.setAttribute("aria-hidden", "true");
    mini.innerHTML = '<div class="mini-disc"><span class="mini-label"></span></div>';
    host.prepend(mini);
    const boost = () => {
      mini.classList.remove("boost"); void mini.offsetWidth; mini.classList.add("boost");
    };
    document.addEventListener("click", (e) => {
      if (e.target.closest('[data-go="next"], #w-send, #w-next, .tier .btn')) boost();
    });
  }

  // ---------- equalizer bars in the player while a song plays
  const now = document.querySelector(".player .now");
  if (now) {
    const eq = document.createElement("span");
    eq.className = "eq"; eq.setAttribute("aria-hidden", "true");
    eq.innerHTML = "<i></i><i></i><i></i><i></i>";
    now.append(" ", eq);
    addEventListener("record:play", (e) => eq.classList.toggle("on", !!e.detail.playing));
  }
})();
