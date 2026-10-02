// Demos player, name-on-the-record, email capture -> questions page, the song questionnaire, prices.
// Forms post to the Google Apps Script handler (setup/Code.gs), or FormSubmit until that's deployed.
(function () {
  // Paste the Google Apps Script web-app URL here once it's deployed (see setup/SETUP.md).
  // While it's empty, forms fall back to FormSubmit (no welcome email to the customer).
  const APPS_SCRIPT_URL = "";
  const FORMSUBMIT = "https://formsubmit.co/ajax/alejandro@ojedaworks.com";
  // Apps Script needs text/plain (no CORS preflight); FormSubmit takes JSON.
  async function send(body, keepalive) {
    const url = APPS_SCRIPT_URL || FORMSUBMIT;
    const headers = APPS_SCRIPT_URL ? { "Content-Type": "text/plain;charset=utf-8" } : { "Content-Type": "application/json", Accept: "application/json" };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), keepalive: !!keepalive });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || String(json.success) !== "true") throw new Error(json.message || res.status);
  }
  const lang = document.documentElement.lang.startsWith("es") ? "es" : "en";
  const T = {
    en: {
      soon: "Coming soon", nowPlaying: "Now playing", pick: "Pick a track",
      noDemo: "This demo isn't up yet.",
      required: "Fill in the highlighted fields to keep going.",
      emailBad: "That email address doesn't look complete.",
      sending: "Sending…", send: "Send my song request",
      sendFail: "Your request didn't go through. Your answers are still here. Try again, or copy them and email alejandro@ojedaworks.com.",
      copied: "Copied. Paste it into an email to alejandro@ojedaworks.com.",
      signupOk: "You're on the list. New demos will come to your inbox.",
      signupFail: "That didn't go through. Try again in a minute.",
      subjectSong: "New song request (My Own Hit)", subjectLead: "New lead started (My Own Hit)",
      priceSoon: "Price coming soon", songOf: "Song {n} of {t}", nextSong: "Start song {n} of {t}",
      none: "None"
    },
    es: {
      soon: "Muy pronto", nowPlaying: "Sonando", pick: "Elige una canción",
      noDemo: "Este demo todavía no está disponible.",
      required: "Llena los campos marcados para seguir.",
      emailBad: "Ese correo no parece completo.",
      sending: "Enviando…", send: "Enviar mi pedido",
      sendFail: "Tu pedido no se envió. Tus respuestas siguen aquí. Inténtalo otra vez, o cópialas y mándalas a alejandro@ojedaworks.com.",
      copied: "Copiado. Pégalo en un correo a alejandro@ojedaworks.com.",
      signupOk: "Ya estás en la lista. Los nuevos demos te llegan al correo.",
      signupFail: "No se envió. Inténtalo en un minuto.",
      subjectSong: "Nuevo pedido de canción (Mi Propio Hit)", subjectLead: "Nuevo cliente empezó (Mi Propio Hit)",
      priceSoon: "Precio muy pronto", songOf: "Canción {n} de {t}", nextSong: "Empezar la canción {n} de {t}",
      none: "Nada"
    }
  }[lang];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const label = (text) => {
    dispatchEvent(new CustomEvent("record:label", { detail: { text } }));
    const fb = $(".stage .fallback span");
    if (fb) fb.textContent = text || (lang === "es" ? "Su canción" : "Their song");
  };
  const playState = (playing) => dispatchEvent(new CustomEvent("record:play", { detail: { playing } }));

  // ---------- name on the record
  const heroName = $("#hero-name");
  const recipient = $("#f-recipient");
  let typedName = "";
  if (heroName) {
    heroName.addEventListener("input", () => {
      typedName = heroName.value;
      label(typedName);
      if (recipient && !recipient.dataset.touched) recipient.value = typedName;
    });
  }
  addEventListener("record:ready", () => label(typedName));

  // ---------- demos
  const list = $("#tracks");
  const audio = $("#audio");
  const demos = (window.DEMOS || []);
  let current = -1;
  const fmt = (s) => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00";

  if (list && audio) {
    demos.forEach((d, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "track" + (d.file ? "" : " soon");
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<span class="n">${i + 1}</span><span class="t"></span><span class="d"></span>`;
      b.querySelector(".t").textContent = d.title[lang];
      const m = document.createElement("span"); m.className = "m"; m.textContent = d.note[lang];
      b.querySelector(".t").appendChild(m);
      b.querySelector(".d").textContent = d.file ? "" : T.soon;
      if (d.file) {
        const probe = new Audio(); probe.preload = "metadata"; probe.src = d.file;
        probe.addEventListener("loadedmetadata", () => { b.querySelector(".d").textContent = fmt(probe.duration); });
      }
      b.addEventListener("click", () => select(i, true));
      li.appendChild(b); list.appendChild(li);
    });

    const playBtn = $("#play"), bar = $("#bar"), fill = $("#bar i"), time = $("#time"), title = $("#now-title"), note = $("#player-note");

    function select(i, autoplay) {
      const d = demos[i];
      if (!d.file) { note.textContent = T.noDemo; return; }
      note.textContent = "";
      if (i !== current) {
        current = i;
        audio.src = d.file;
        title.textContent = d.title[lang];
        $$(".track", list).forEach((el, j) => el.setAttribute("aria-pressed", String(j === i)));
        label(d.label || d.title[lang]);
      }
      if (autoplay) audio.play().catch(() => {});
    }
    playBtn.addEventListener("click", () => {
      if (current < 0) {
        const first = demos.findIndex((d) => d.file);
        if (first < 0) { note.textContent = T.noDemo; return; }
        return select(first, true);
      }
      audio.paused ? audio.play().catch(() => {}) : audio.pause();
    });
    const sync = () => {
      const on = !audio.paused;
      playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
      playBtn.innerHTML = on
        ? '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="3" width="4" height="14" rx="1" fill="currentColor"/><rect x="12" y="3" width="4" height="14" rx="1" fill="currentColor"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5v13l11-6.5z" fill="currentColor"/></svg>';
      playState(on);
    };
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("ended", () => { sync(); label(typedName); });
    audio.addEventListener("timeupdate", () => {
      fill.style.width = (audio.duration ? (audio.currentTime / audio.duration) * 100 : 0) + "%";
      time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
    });
    bar.addEventListener("click", (e) => {
      if (!audio.duration) return;
      const r = bar.getBoundingClientRect();
      audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
    });
    bar.addEventListener("keydown", (e) => {
      if (!audio.duration) return;
      if (e.key === "ArrowRight") audio.currentTime += 5;
      if (e.key === "ArrowLeft") audio.currentTime -= 5;
    });
    sync();
  }

  // ---------- song questionnaire
  const form = $("#song-form");
  if (form) {
    const steps = $$(".wstep", form);
    const dots = $$(".progress li", form.parentElement);
    const err = $("#w-err");
    const KEY = "myownhit-draft-" + lang;
    let at = 0;

    recipient?.addEventListener("input", () => { recipient.dataset.touched = "1"; });

    // restore a saved draft
    const draft = store.get(KEY);
    if (draft) {
      Object.entries(draft).forEach(([name, val]) => {
        $$(`[name="${CSS.escape(name)}"]`, form).forEach((el) => {
          if (el.type === "checkbox" || el.type === "radio") el.checked = [].concat(val).includes(el.value);
          else el.value = val;
        });
      });
    }

    // coming from the email box or the pricing page: fill what we already know
    const lead = store.get("myownhit-lead") || {};
    const params = new URLSearchParams(location.search);
    const fill = (sel, v) => { const el = $(sel, form); if (el && v && !el.value) el.value = v; };
    fill("#f-email", lead.email);
    fill("#f-recipient", params.get("name") || lead.name);
    const songsSel = $("#f-songs");
    if (songsSel && ["1", "2", "3"].includes(params.get("songs"))) songsSel.value = params.get("songs");

    let songNum = 1;
    const counter = document.createElement("p");
    counter.className = "song-count";
    counter.hidden = true;
    form.parentElement.prepend(counter);
    const total = () => Number(songsSel ? songsSel.value : 1) || 1;
    const updateCounter = () => {
      counter.hidden = total() < 2;
      counter.textContent = T.songOf.replace("{n}", songNum).replace("{t}", total());
    };
    songsSel?.addEventListener("change", updateCounter);
    updateCounter();

    function collect() {
      const data = {};
      new FormData(form).forEach((v, k) => {
        if (k.startsWith("_")) return;
        if (data[k] !== undefined) data[k] = [].concat(data[k], v);
        else data[k] = v;
      });
      return data;
    }
    form.addEventListener("input", () => store.set(KEY, collect()));

    function show(i, initial) {
      at = i;
      steps.forEach((s, j) => { s.hidden = j !== i; });
      dots.forEach((d, j) => d.classList.toggle("on", j <= i));
      err.textContent = "";
      const last = i === steps.length - 1;
      $$("[data-hide-first]", form).forEach((b) => { b.hidden = i === 0; });
      $$("[data-hide-last]", form).forEach((b) => { b.hidden = last; });
      $$("[data-show-last]", form).forEach((b) => { b.hidden = !last; });
      if (last) buildReview();
      if (initial) return;
      const h = $("h3", steps[i]);
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      form.parentElement.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }

    function valid(step) {
      let ok = true;
      $$("[aria-invalid]", step).forEach((el) => el.removeAttribute("aria-invalid"));
      $$("input,select,textarea", step).forEach((el) => {
        if (!el.checkValidity()) { ok = false; el.setAttribute("aria-invalid", "true"); }
      });
      $$("fieldset[data-required]", step).forEach((fs) => {
        if (!$$("input:checked", fs).length) { ok = false; fs.setAttribute("aria-invalid", "true"); }
      });
      if (!ok) {
        const email = $("input[type=email][aria-invalid]", step);
        err.textContent = email && email.value ? T.emailBad : T.required;
        $("[aria-invalid]", step)?.focus?.();
      }
      return ok;
    }

    function buildReview() {
      const dl = $("#review");
      dl.innerHTML = "";
      const seen = new Set();
      $$("[name]", form).forEach((el) => {
        const name = el.name;
        if (name.startsWith("_") || seen.has(name)) return;
        seen.add(name);
        const val = collect()[name];
        const row = document.createElement("div");
        const dt = document.createElement("dt");
        const dd = document.createElement("dd");
        dt.textContent = el.dataset.q || el.closest("fieldset")?.dataset.q || name;
        dd.textContent = val === undefined || val === "" ? T.none : [].concat(val).join(", ");
        row.append(dt, dd); dl.appendChild(row);
      });
    }

    function asText() {
      return $$("#review div").map((r) => `${r.firstChild.textContent}: ${r.lastChild.textContent}`).join("\n");
    }

    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-go]");
      if (!b) return;
      const dir = b.dataset.go;
      if (dir === "next") { if (valid(steps[at])) show(at + 1); }
      else if (dir === "back") show(at - 1);
      else if (dir === "copy") {
        navigator.clipboard?.writeText(asText()).then(() => { err.textContent = T.copied; });
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Enter in a text box submits the form: treat it as "Next" until the last step
      if (at < steps.length - 1) { if (valid(steps[at])) show(at + 1); return; }
      const bad = steps.findIndex((s) => !valid(s));
      if (bad > -1) { show(bad); valid(steps[bad]); return; }
      const sendBtn = $("#w-send");
      sendBtn.disabled = true; sendBtn.textContent = T.sending;
      $("#w-copy").hidden = true;
      const data = collect();
      const payload = Object.assign({}, data, {
        _subject: T.subjectSong + (data.recipient_name ? `: ${data.recipient_name}` : ""),
        _template: "table",
        form: "song",
        song_number: `${songNum} of ${total()}`,
        _honey: $("[name=_honey]", form).value,
        site_language: lang
      });
      Object.keys(payload).forEach((k) => { if (Array.isArray(payload[k])) payload[k] = payload[k].join(", "); });
      try {
        await send(payload);
        store.del(KEY);
        form.hidden = true;
        $("#w-done").hidden = false;
        if (APPS_SCRIPT_URL) $("#w-done .welcome-note").hidden = false;
        $("#w-done h3").focus();
        dots.forEach((d) => d.classList.add("on"));
        const nextBtn = $("#w-next");
        if (nextBtn && songNum < total()) {
          nextBtn.hidden = false;
          nextBtn.textContent = T.nextSong.replace("{n}", songNum + 1).replace("{t}", total());
        }
      } catch (ex) {
        err.textContent = T.sendFail;
        $("#w-copy").hidden = false;
        sendBtn.disabled = false; sendBtn.textContent = T.send;
      }
    });

    // next song in a multi-song order: keep "About you" and the song count, clear the rest
    $("#w-next")?.addEventListener("click", () => {
      const keep = {};
      ["your_name", "email", "phone", "heard_from", "songs"].forEach((n) => { const el = form.elements[n]; if (el) keep[n] = el.value; });
      form.reset();
      Object.entries(keep).forEach(([n, v]) => { form.elements[n].value = v; });
      songNum += 1;
      updateCounter();
      $("#w-next").hidden = true;
      $("#w-done").hidden = true;
      $("#w-done .welcome-note").hidden = true;
      form.hidden = false;
      const sendBtn = $("#w-send"); sendBtn.disabled = false; sendBtn.textContent = T.send;
      show(0);
    });

    show(0, true);
  }

  // ---------- email capture: save the lead, then open the questions page
  const START = lang === "es" ? "empezar.html" : "start.html";
  $$(".lead-form").forEach((f) => {
    const msg = f.parentElement.querySelector(".lead-msg") || $(".lead-msg", f);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("input[type=email]", f);
      if (!email.checkValidity()) { email.setAttribute("aria-invalid", "true"); msg.textContent = T.emailBad; email.focus(); return; }
      email.removeAttribute("aria-invalid");
      msg.textContent = "";
      const name = (f.elements.recipient_name?.value || typedName || "").trim();
      store.set("myownhit-lead", { email: email.value.trim(), name });
      const btn = $("button", f); btn.disabled = true;
      // don't make them wait on the network: give it up to 2.5s, then go either way
      await Promise.race([
        send({ form: "lead", email: email.value.trim(), recipient_name: name, site_language: lang, _subject: T.subjectLead, _honey: $("[name=_honey]", f).value }, true).catch(() => {}),
        new Promise((r) => setTimeout(r, 2500))
      ]);
      location.href = START + (name ? "?name=" + encodeURIComponent(name) : "");
    });
  });

  // ---------- prices (set them in assets/prices.js)
  const P = window.PRICES || {};
  $$("[data-price]").forEach((el) => {
    const v = P[el.dataset.price];
    el.textContent = typeof v === "number" ? new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", { style: "currency", currency: P.currency || "USD", maximumFractionDigits: v % 1 ? 2 : 0 }).format(v) : T.priceSoon;
    el.classList.toggle("soon", typeof v !== "number");
  });
})();
