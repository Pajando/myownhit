// The 3D record in the hero. Listens for two events from site.js:
//   record:label  {text}     -> repaints the center label
//   record:play   {playing}  -> spins up to 33 rpm / back down
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const stage = document.querySelector(".stage");
const lang = document.documentElement.lang.startsWith("es") ? "es" : "en";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  renderer = null; // CSS fallback record stays visible
}

if (renderer && stage) {
  stage.classList.add("gl");
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 2.45, 3.1);
  camera.lookAt(0, -0.05, 0);

  // ---- record face texture (grooves + label), repainted when the name changes
  const SIZE = 1024;
  const face = document.createElement("canvas");
  face.width = face.height = SIZE;
  const fctx = face.getContext("2d");
  const faceTex = new THREE.CanvasTexture(face);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  let labelText = "";

  function fitFont(ctx, text, family, max, min, width) {
    let s = max;
    do { ctx.font = `${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > width && s > min);
  }

  function paintFace() {
    const c = SIZE / 2, ctx = fctx;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = "#0c0c10";
    ctx.beginPath(); ctx.arc(c, c, c, 0, Math.PI * 2); ctx.fill();
    // grooves: fine rings with slight random tone, plus two blank "track gaps"
    for (let r = c * 0.985; r > c * 0.37; r -= 2.2) {
      const gap = Math.abs(r - c * 0.74) < 4 || Math.abs(r - c * 0.56) < 4;
      const v = gap ? 6 : 18 + Math.random() * 16;
      ctx.strokeStyle = `rgb(${v},${v},${v + 4})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
    }
    // label
    const lr = c * 0.34;
    ctx.fillStyle = "#e4007c";
    ctx.beginPath(); ctx.arc(c, c, lr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#f6a821"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(c, c, lr - 14, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff4e6";
    ctx.font = "600 30px 'Instrument Sans', sans-serif";
    ctx.fillText(lang === "es" ? "Mi Propio Hit" : "My Own Hit", c, c - lr * 0.62);
    const name = labelText.trim();
    if (name) {
      const top = lang === "es" ? "La canción de" : "A song for";
      ctx.font = "500 30px 'Instrument Sans', sans-serif";
      ctx.fillText(top, c, c - lr * 0.3);
      fitFont(ctx, name, "Shrikhand, Georgia, serif", 92, 34, lr * 1.55);
      ctx.fillStyle = "#f6a821";
      ctx.fillText(name, c, c + lr * 0.08);
    } else {
      fitFont(ctx, lang === "es" ? "Su canción" : "Their song", "Shrikhand, Georgia, serif", 84, 34, lr * 1.55);
      ctx.fillStyle = "#f6a821";
      ctx.fillText(lang === "es" ? "Su canción" : "Their song", c, c - lr * 0.06);
    }
    ctx.fillStyle = "#fff4e6";
    ctx.font = "600 26px 'Instrument Sans', sans-serif";
    ctx.fillText(lang === "es" ? "Lado A" : "Side A", c, c + lr * 0.6);
    // spindle hole
    ctx.fillStyle = "#16133d";
    ctx.beginPath(); ctx.arc(c, c, 11, 0, Math.PI * 2); ctx.fill();
    faceTex.needsUpdate = true;
  }

  // ---- the record
  const tilt = new THREE.Group();
  tilt.position.x = -0.16;
  scene.add(tilt);
  const spin = new THREE.Group();
  tilt.add(spin);

  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.5 });
  const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.32, metalness: 0.25 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.022, 160), [edgeMat, faceMat, faceMat]);
  spin.add(disc);

  // sheen: two light wedges that stay still while the record turns under them
  const sheenCv = document.createElement("canvas");
  sheenCv.width = sheenCv.height = 512;
  const sctx = sheenCv.getContext("2d");
  const g = sctx.createConicGradient(0, 256, 256);
  [[0, 0], [0.06, 0.22], [0.12, 0], [0.5, 0], [0.56, 0.16], [0.62, 0], [1, 0]]
    .forEach(([s, a]) => g.addColorStop(s, `rgba(255,236,250,${a})`));
  sctx.fillStyle = g;
  sctx.beginPath(); sctx.arc(256, 256, 252, 0, Math.PI * 2); sctx.arc(256, 256, 92, 0, Math.PI * 2, true); sctx.fill("evenodd");
  const sheenTex = new THREE.CanvasTexture(sheenCv);
  const sheen = new THREE.Mesh(
    new THREE.CircleGeometry(1, 96),
    new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sheen.rotation.x = -Math.PI / 2;
  sheen.rotation.z = 0.5;
  sheen.position.y = 0.0125;
  tilt.add(sheen);

  // tonearm
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9d4ea, metalness: 0.85, roughness: 0.25 });
  const arm = new THREE.Group();
  arm.position.set(1.18, 0.02, -0.55);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.08, 40), metal);
  arm.add(base);
  const pivot = new THREE.Group();
  pivot.position.y = 0.07;
  arm.add(pivot);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.12, 16), metal);
  rod.rotation.x = Math.PI / 2;
  rod.position.z = 0.56;
  pivot.add(rod);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.14), new THREE.MeshStandardMaterial({ color: 0xf6a821, roughness: 0.4 }));
  head.position.set(0, -0.02, 1.14);
  pivot.add(head);
  tilt.add(arm);
  const ARM_REST = 0.05, ARM_PLAY = -0.6;
  pivot.rotation.y = ARM_REST;

  // light
  scene.add(new THREE.AmbientLight(0x9a90ff, 0.55));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.1);
  key.position.set(-2, 4, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0xe4007c, 9, 8);
  rim.position.set(1.8, 0.6, -1.4);
  scene.add(rim);

  // ---- sizing
  let baseScale = 1;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    baseScale = w / h > 1.2 ? 1.32 : 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  // ---- state
  let playing = false, speed = 0, intro = reduced ? 1 : 0;
  const pointer = { x: 0, y: 0 };
  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) / r.width - 0.5;
    pointer.y = (e.clientY - r.top) / r.height - 0.5;
  });
  stage.addEventListener("pointerleave", () => { pointer.x = pointer.y = 0; });

  addEventListener("record:label", (e) => { labelText = e.detail.text || ""; paintFace(); });
  addEventListener("record:play", (e) => { playing = !!e.detail.playing; });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (visible) {
      // one entrance: the record drops onto the platter and settles
      if (intro < 1) intro = Math.min(1, intro + dt / 1.4);
      const ease = 1 - Math.pow(1 - intro, 3);
      tilt.position.y = (1 - ease) * 0.45;
      tilt.scale.setScalar((0.88 + 0.12 * ease) * baseScale);
      spin.rotation.y -= (1 - ease) * dt * 6;

      const target = playing ? 3.49 : reduced ? 0 : 0.35; // 3.49 rad/s = 33 1/3 rpm
      speed += (target - speed) * Math.min(1, dt * (playing ? 1.6 : 0.9));
      spin.rotation.y -= speed * dt;

      pivot.rotation.y += ((playing ? ARM_PLAY : ARM_REST) - pivot.rotation.y) * Math.min(1, dt * 3);
      tilt.rotation.x += (pointer.y * 0.25 - tilt.rotation.x) * Math.min(1, dt * 4);
      tilt.rotation.y += (pointer.x * 0.35 - tilt.rotation.y) * Math.min(1, dt * 4);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  paintFace();
  document.fonts.load("80px Shrikhand").then(paintFace).catch(() => {});
  document.fonts.ready.then(paintFace);
  frame();
  dispatchEvent(new CustomEvent("record:ready"));
}
