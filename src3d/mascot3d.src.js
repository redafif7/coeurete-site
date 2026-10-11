/* Cœurete — live 3D mascot in the hero.
   Progressive enhancement: the rendered poster image is shown first and stays if
   WebGL, the CDN or the model are unavailable, or if the visitor prefers reduced motion. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const stage = document.querySelector("[data-stage]");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

function webglOK() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

async function boot() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  stage.append(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fe9ff, 1.6); rim.position.set(-3, 1.5, -3); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xff8a8a, 0.9); warm.position.set(3, -1, -2); scene.add(warm);
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  const pivot = new THREE.Group(); scene.add(pivot);

  const gltf = await new GLTFLoader().loadAsync("models/mascot.glb");
  const root = gltf.scene;
  root.traverse(o => { if (o.isMesh) { o.geometry.computeVertexNormals(); o.material.side = THREE.DoubleSide; } });
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.position.sub(box.getCenter(new THREE.Vector3()));
  pivot.add(root);

  function resize() {
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    canvas.style.width = "100%"; canvas.style.height = "100%";
    camera.aspect = r.width / r.height;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const k = 1.18;
    const dist = Math.max((size.y * k) / (2 * t), (size.x * k) / (2 * t * camera.aspect));
    camera.position.set(0, 0, dist + size.z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  /* interaction: look at the pointer, drag to spin, tap for a heartbeat */
  let tx = 0, ty = 0, yaw = 0, pitch = 0, spin = 0, vel = 0, beat = 0;
  let dragging = false, lastX = 0, moved = 0;
  addEventListener("pointermove", e => {
    tx = (e.clientX / innerWidth - 0.5) * 0.9;
    ty = (e.clientY / innerHeight - 0.5) * 0.35;
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); vel = dx * 0.012; spin += vel; }
  }, { passive: true });
  canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; moved = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointerup", e => {
    dragging = false;
    if (moved < 6) { beat = 1; burst(e); }
  });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  function burst(e) {
    const r = stage.getBoundingClientRect();
    for (let i = 0; i < 9; i++) {
      const h = document.createElement("span");
      h.className = "burst"; h.textContent = "♥"; h.setAttribute("aria-hidden", "true");
      const a = (i / 9) * Math.PI * 2 + Math.random() * .4;
      h.style.left = (e.clientX - r.left) + "px"; h.style.top = (e.clientY - r.top) + "px";
      h.style.setProperty("--dx", Math.cos(a) * (60 + Math.random() * 70) + "px");
      h.style.setProperty("--dy", Math.sin(a) * (60 + Math.random() * 70) - 30 + "px");
      h.style.setProperty("--r", (Math.random() * 80 - 40) + "deg");
      if (i % 3 === 1) h.style.color = "#3AD2E6";
      stage.append(h); setTimeout(() => h.remove(), 1200);
    }
  }

  /* render only when visible */
  let visible = true, raf = 0;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) loop(); }).observe(stage);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visible && !raf) loop(); });

  const clock = new THREE.Clock();
  function loop() {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    if (!dragging) { vel *= 0.94; spin += vel; spin *= 0.985; }   // inertia, then settle back to facing us
    yaw += (tx - yaw) * 0.06; pitch += (ty - pitch) * 0.06;
    beat *= 0.9;
    pivot.rotation.set(pitch * 0.6, yaw + spin + Math.sin(t * 0.6) * 0.08, Math.sin(t * 0.9) * 0.025);
    pivot.position.y = Math.sin(t * 1.3) * 0.045;
    const s = 1 + Math.sin(beat * Math.PI) * 0.09;
    pivot.scale.setScalar(s);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  renderer.render(scene, camera);
  stage.classList.add("is-live");
  loop();
}

if (stage && !reduce && webglOK()) {
  const start = () => boot().catch(err => { console.warn("Mascotte 3D indisponible, image conservée.", err); stage.classList.remove("is-live"); stage.querySelector("canvas")?.remove(); });
  if (document.readyState === "complete") ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300));
  else addEventListener("load", () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 300)));
}
