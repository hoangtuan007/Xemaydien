import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import evo from './models/vinfast-evo.js';
import weaver from './models/datbike-weaver.js';
import { CATS } from './models/common.js';
import { createSimState, simulate, stepSim } from './sim.js';
import { Schematic } from './schematic.js';

const MODELS = { evo, weaver };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
};

// ================= Cảnh 3D =================
const canvas = $('#scene');
const stage = $('#stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environmentIntensity = 0.7;

const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.6;
controls.maxDistance = 7;

scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.8);
sun.position.set(2.5, 5, 3.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 15 });
sun.shadow.bias = -0.0004;
scene.add(sun);

const groundMat = new THREE.MeshStandardMaterial({ color: 0x20252c, roughness: 0.95, metalness: 0 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 72), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
const grid = new THREE.GridHelper(12, 48, 0x3a4350, 0x2a313a);
grid.position.y = 0.001;
scene.add(grid);

const root = new THREE.Group();
scene.add(root);
const wireRoot = new THREE.Group();
scene.add(wireRoot);

function applyTheme() {
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue('--scene-bg').trim() || '#14181d';
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 6, 14);
  groundMat.color.set(cs.getPropertyValue('--scene-ground').trim() || '#20252c');
  const gc = new THREE.Color(cs.getPropertyValue('--scene-grid').trim() || '#333a44');
  grid.material.color = gc;
}
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

// ================= Trạng thái =================
let M = null;
const parts = new Map();
let dependents = {};
let wires = [];
let selected = null;
let hovered = null;
let hoveredWire = null;
const flashes = new Map();
let history = [];
let mode = 'disassemble';
const opts = { xray: false, wires: false, hideRemoved: false };
let sim = createSimState();
let simResult = null;
let challenge = null;
const schematic = new Schematic($('#schematic'), (id) => select(id, true));

const WIRE_COL = { hv: 0xff7a1a, lv: 0xe53935, signal: 0x29b6f6, charge: 0xb05cff };
const PHASE_COL = [0xf5c400, 0x2e9d4f, 0x1e6fd9];
const TYPE_NAME = { hv: 'Cao áp DC', lv: '12 V', signal: 'Tín hiệu', charge: 'Sạc', phase: '3 pha' };
const ELECTRIC_CATS = ['dien', 'dongco'];

const has = (id) => { const p = parts.get(id); return !!p && p.installed; };
const nameOf = (id) => parts.get(id)?.def.name ?? id;

function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
}

function loadModel(id) {
  M = MODELS[id];
  store.set('ev.model', id);
  [...root.children].forEach((c) => { root.remove(c); disposeTree(c); });
  [...wireRoot.children].forEach((c) => { wireRoot.remove(c); disposeTree(c); });
  parts.clear();
  dependents = {};
  M.parts.forEach((def, idx) => {
    const group = def.build();
    group.userData.partId = def.id;
    const meshes = [];
    const spinners = [];
    group.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.userData.partId = def.id;
        o.userData.baseEmissive = o.material.emissive.clone();
        o.userData.baseEI = o.material.emissiveIntensity;
        o.userData.baseOpacity = o.material.opacity;
        o.userData.baseTransparent = o.material.transparent;
        meshes.push(o);
      }
      if (o.userData.spin) spinners.push(o);
    });
    root.add(group);
    parts.set(def.id, { def, idx, group, meshes, spinners, installed: true, anim: null, ghost: null, explode: new THREE.Vector3(...def.explode) });
    dependents[def.id] = [];
  });
  M.parts.forEach((def) => def.after.forEach((a) => dependents[a]?.push(def.id)));
  buildWires();
  selected = null; hovered = null; history = []; challenge = null;
  sim = createSimState();
  schematic.setModel(M);
  applyXray();
  flyCamera(M.camera.pos, M.camera.target, true);
  document.documentElement.style.setProperty('--model-accent', M.accent);
  renderAll();
  if (mode === 'assemble' || mode === 'challenge') setMode(mode, true);
}

function buildWires() {
  wires = [];
  M.wires.forEach((w) => {
    const strands = w.type === 'phase' ? [-1, 0, 1] : [0];
    strands.forEach((k, i) => {
      const pts = w.pts.map((p) => new THREE.Vector3(p[0], p[1] + k * 0.004, p[2] + k * 0.011));
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      const color = w.type === 'phase' ? PHASE_COL[i] : WIRE_COL[w.type];
      const r = w.type === 'hv' || w.type === 'phase' ? 0.0062 : 0.004;
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 60, r, 8, false),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.45 }),
      );
      mesh.userData.wire = w;
      const N = Math.max(4, Math.round(curve.getLength() / 0.07));
      const glow = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.55);
      const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(r * 1.9, 10, 8), new THREE.MeshBasicMaterial({ color: glow }), N);
      inst.userData.particles = true;
      inst.frustumCulled = false;
      wireRoot.add(mesh, inst);
      wires.push({ def: w, mesh, inst, curve, N, t: i / 3 });
    });
  });
}

// ================= Quy tắc tháo / lắp =================
const removeBlockers = (id) => dependents[id].filter(has);
const installMissing = (id) => parts.get(id).def.after.filter((a) => !has(a));
const canRemove = (id) => has(id) && removeBlockers(id).length === 0;
const canInstall = (id) => !has(id) && installMissing(id).length === 0;

function electricGuard(p) {
  if (sim.key && ELECTRIC_CATS.includes(p.def.cat) && p.def.id !== 'xich') {
    toast('⚠ Tắt khoá điện trước khi tháo/lắp bộ phận điện! (an toàn điện cao áp)', 'err');
    flash(['khoa'], 'warn');
    return false;
  }
  if (sim.charging && ['pin', 'cong-sac', 'bo-day'].includes(p.def.id)) {
    toast('⚠ Rút sạc trước khi tháo pin, cổng sạc hoặc bó dây.', 'err');
    return false;
  }
  return true;
}

function tryRemove(id, { quiet = false, delay = 0 } = {}) {
  const p = parts.get(id);
  if (!p || !p.installed) return false;
  if (!electricGuard(p)) return false;
  const blockers = removeBlockers(id);
  if (blockers.length) {
    if (!quiet) {
      flash(blockers, 'err');
      toast(`Chưa tháo được "${p.def.name}". Cần tháo trước: ${blockers.map(nameOf).join(', ')}`, 'warn');
    }
    return false;
  }
  p.installed = false;
  animate(p, false, delay);
  history.push({ id, action: 'remove' });
  if (!quiet) toast(`Đã tháo: ${p.def.name}`, 'ok');
  changed();
  return true;
}

function tryInstall(id, { quiet = false, delay = 0 } = {}) {
  const p = parts.get(id);
  if (!p || p.installed) return false;
  if (!electricGuard(p)) return false;
  const missing = installMissing(id);
  if (missing.length) {
    if (challenge && !challenge.done) { challenge.mistakes++; renderChallengeHud(); }
    if (!quiet) {
      flash(missing, 'err');
      const msg = challenge ? `Chưa đúng thứ tự! "${p.def.name}" cần lắp sau ${missing.length} bộ phận khác.` : `Chưa lắp được "${p.def.name}". Cần lắp trước: ${missing.map(nameOf).join(', ')}`;
      toast(msg, 'warn');
    }
    return false;
  }
  p.installed = true;
  animate(p, true, delay);
  history.push({ id, action: 'install' });
  if (!quiet) toast(`Đã lắp: ${p.def.name}`, 'ok');
  changed();
  return true;
}

function toggle(id) {
  if (has(id)) return tryRemove(id);
  return tryInstall(id);
}

function undo() {
  const h = history.pop();
  if (!h) { toast('Không còn thao tác để hoàn tác.', 'info'); return; }
  const p = parts.get(h.id);
  p.installed = h.action === 'remove';
  animate(p, p.installed);
  toast(`Hoàn tác: ${p.def.name}`, 'info');
  changed();
}

// thứ tự tháo hợp lệ (bộ phận ngoài cùng trước)
function removalOrder() {
  const inst = new Set([...parts.values()].filter((p) => p.installed).map((p) => p.def.id));
  const order = [];
  while (inst.size) {
    const cands = [...inst].filter((id) => !dependents[id].some((d) => inst.has(d)));
    if (!cands.length) break;
    cands.sort((a, b) => parts.get(b).idx - parts.get(a).idx);
    order.push(cands[0]);
    inst.delete(cands[0]);
  }
  return order;
}
function installOrder() {
  const inst = new Set([...parts.values()].filter((p) => p.installed).map((p) => p.def.id));
  const order = [];
  let guard = 0;
  while (guard++ < 200) {
    const cands = [...parts.values()].filter((p) => !inst.has(p.def.id) && p.def.after.every((a) => inst.has(a)));
    if (!cands.length) break;
    cands.sort((a, b) => a.idx - b.idx);
    order.push(cands[0].def.id);
    inst.add(cands[0].def.id);
  }
  return order;
}

function explodeAll() {
  if (sim.key) { sim.key = false; renderSim(); }
  sim.charging = false;
  const order = removalOrder();
  order.forEach((id, i) => {
    const p = parts.get(id);
    p.installed = false;
    animate(p, false, i * 0.06);
  });
  if (order.length) { history = []; toast(`Đã tháo rời ${order.length} bộ phận theo đúng thứ tự.`, 'ok'); flyCamera(...WIDE); }
  changed();
}
function assembleAll() {
  if (sim.key) { sim.key = false; renderSim(); }
  const order = installOrder();
  order.forEach((id, i) => {
    const p = parts.get(id);
    p.installed = true;
    animate(p, true, i * 0.06);
  });
  if (order.length) { history = []; toast(`Đã lắp hoàn chỉnh ${order.length} bộ phận.`, 'ok'); flyCamera(M.camera.pos, M.camera.target); }
  changed();
}

function hintNext() {
  let id, verb;
  const preferInstall = mode === 'assemble' || mode === 'challenge' || [...parts.values()].every((p) => !p.installed);
  if (preferInstall) { id = installOrder()[0]; verb = 'lắp'; }
  if (!id) { id = removalOrder()[0]; verb = 'tháo'; }
  if (!id) return;
  if (challenge && !challenge.done) { challenge.hints++; renderChallengeHud(); }
  select(id, true);
  flash([id], 'hint');
  toast(`Bước tiếp theo: ${verb} "${nameOf(id)}"`, 'info');
}

// ================= Hiệu ứng =================
function animate(p, installed, delay = 0) {
  p.anim = { from: p.group.position.clone(), to: installed ? new THREE.Vector3() : p.explode.clone(), t: -delay / 0.7, installing: installed };
  p.group.visible = true;
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function flash(ids, kind) {
  const until = performance.now() + 1400;
  ids.forEach((id) => flashes.set(id, { kind, until }));
}

const HL = {
  hover: { c: new THREE.Color(0x3a6ea5), i: 0.35 },
  selected: { c: new THREE.Color(0x2f9bff), i: 0.6 },
  err: { c: new THREE.Color(0xff1744), i: 0.9 },
  warn: { c: new THREE.Color(0xffa000), i: 0.9 },
  hint: { c: new THREE.Color(0x00e676), i: 0.8 },
};

function applyXray() {
  for (const p of parts.values()) {
    const on = opts.xray && p.def.shell;
    for (const m of p.meshes) {
      m.material.transparent = on || m.userData.baseTransparent;
      m.material.opacity = on ? 0.13 : m.userData.baseOpacity;
      m.material.depthWrite = !on;
      m.castShadow = !on;
      m.material.needsUpdate = true;
    }
  }
}

function ghostFor(p) {
  if (!p.ghost) {
    const g = p.group.clone(true);
    const gm = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.22, depthWrite: false });
    g.traverse((o) => { if (o.isMesh) { o.material = gm; o.castShadow = false; } o.userData = { ghost: true }; });
    g.position.set(0, 0, 0);
    root.add(g);
    p.ghost = g;
  }
  return p.ghost;
}

function updateVisuals(now) {
  const pulse = 0.65 + 0.35 * Math.sin(now / 160);
  const L = simResult?.lamps || {};
  for (const p of parts.values()) {
    const id = p.def.id;
    let hl = null;
    const f = flashes.get(id);
    if (f && f.until > now) hl = { c: HL[f.kind].c, i: HL[f.kind].i * pulse };
    else if (f) flashes.delete(id);
    if (!hl && selected === id) hl = { c: HL.selected.c, i: HL.selected.i * (0.75 + 0.25 * Math.sin(now / 300)) };
    else if (!hl && hovered === id) hl = HL.hover;
    for (const m of p.meshes) {
      const lamp = m.userData.lamp;
      const mat = m.material;
      if (lamp && p.installed) {
        let inten = 0;
        if (lamp === 'head' && L.head) inten = 1.8;
        if (lamp === 'tail' && L.tail) inten = L.brake ? 3.2 : 0.7;
        if (lamp === 'dash' && L.dash) inten = 1.1;
        if (lamp === 'key' && L.key) inten = 1.6;
        if (inten > 0) { mat.emissive.setHex(m.userData.lampColor); mat.emissiveIntensity = inten; continue; }
      }
      if (hl) { mat.emissive.copy(hl.c); mat.emissiveIntensity = hl.i; }
      else { mat.emissive.copy(m.userData.baseEmissive); mat.emissiveIntensity = m.userData.baseEI; }
    }
    // hiển thị / ẩn
    p.group.visible = p.installed || !!p.anim || !opts.hideRemoved || selected === id;
    if (p.ghost) p.ghost.visible = selected === id && !p.installed;
    else if (selected === id && !p.installed) ghostFor(p).visible = true;
  }
}

const _m4 = new THREE.Matrix4();
const _v = new THREE.Vector3();
function updateWires(dt) {
  for (const w of wires) {
    const d = w.def;
    const visible = opts.wires && has(d.from) && has(d.to) && has('bo-day') && !parts.get(d.from).anim && !parts.get(d.to).anim;
    w.mesh.visible = visible;
    const rate = simResult?.ch[d.ch] || 0;
    w.inst.visible = visible && rate > 0;
    const hot = hoveredWire === d;
    w.mesh.material.emissiveIntensity = hot ? 1.2 : rate > 0 ? 0.55 : 0.18;
    if (!w.inst.visible) continue;
    const len = w.curve.getLength();
    w.t = (w.t + (rate * dt) / len * 0.35) % 1;
    for (let i = 0; i < w.N; i++) {
      const u = (w.t + i / w.N) % 1;
      w.curve.getPointAt(u, _v);
      _m4.makeTranslation(_v.x, _v.y, _v.z);
      w.inst.setMatrixAt(i, _m4);
    }
    w.inst.instanceMatrix.needsUpdate = true;
  }
}

let wheelAngle = 0, motorAngle = 0;
function updateSpin(dt) {
  const r = M.id === 'evo' ? 0.25 : 0.31;
  const wheelW = (sim.speed / 3.6 / r) * 0.3; // làm chậm để mắt theo kịp
  let motorW = M.id === 'weaver' ? wheelW * 2.8 : wheelW;
  if (M.id === 'weaver' && simResult?.motorOn && !simResult.wheelDriven) motorW = sim.throttle * 18;
  wheelAngle -= wheelW * dt;
  motorAngle -= motorW * dt;
  for (const p of parts.values()) {
    for (const s of p.spinners) {
      if (s.userData.spin === 'rear') s.rotation.z = wheelAngle;
      if (s.userData.spin === 'motor') s.rotation.z = motorAngle;
      if (s.userData.spin === 'front') s.rotation.z = 0;
    }
  }
}

// ================= Camera =================
let camFly = null;
function flyCamera(pos, target, instant = false) {
  if (instant) {
    camera.position.set(...pos);
    controls.target.set(...target);
    controls.update();
    return;
  }
  camFly = { fromP: camera.position.clone(), toP: new THREE.Vector3(...pos), fromT: controls.target.clone(), toT: new THREE.Vector3(...target), t: 0 };
}
const WIDE = [[2.4, 2.5, 4.2], [-0.05, 0.45, 0.1]];
const VIEWS = {
  iso: () => M.camera,
  right: () => ({ pos: [0, 0.75, 3.3], target: [0, 0.55, 0] }),
  left: () => ({ pos: [0, 0.75, -3.3], target: [0, 0.55, 0] }),
  top: () => ({ pos: [0.01, 3.6, 0.3], target: [0, 0.4, 0] }),
  front: () => ({ pos: [3.2, 1.0, 0.0], target: [0, 0.6, 0] }),
  rear: () => ({ pos: [-3.2, 1.0, 0.2], target: [0, 0.6, 0] }),
};

// ================= Chọn / trỏ chuột =================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function visibleChain(o) {
  while (o) { if (!o.visible) return false; o = o.parent; }
  return true;
}
function pick(ev) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([root, wireRoot], true);
  for (const h of hits) {
    const o = h.object;
    if (o.userData.ghost || o.userData.particles || !visibleChain(o)) continue;
    if (o.userData.wire) return { wire: o.userData.wire };
    const id = o.userData.partId;
    if (!id) continue;
    const p = parts.get(id);
    if (opts.xray && p.def.shell && p.installed) continue;
    return { part: id };
  }
  return null;
}

let downAt = null;
canvas.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  downAt = null;
  if (moved > 6) return;
  const hit = pick(e);
  if (hit?.part) {
    if (selected === hit.part && e.pointerType !== 'mouse') { toggle(hit.part); return; }
    select(hit.part);
  } else if (!hit) select(null);
});
canvas.addEventListener('dblclick', (e) => {
  const hit = pick(e);
  if (hit?.part) toggle(hit.part);
});
const tooltip = $('#tooltip');
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  const hit = pick(e);
  hovered = hit?.part || null;
  hoveredWire = hit?.wire || null;
  canvas.style.cursor = hit ? 'pointer' : 'grab';
  if (hit) {
    const r = stage.getBoundingClientRect();
    let html;
    if (hit.part) {
      const p = parts.get(hit.part);
      const state = p.installed ? (canRemove(hit.part) ? 'Nhấp đúp để tháo' : '🔒 Cần tháo bộ phận khác trước') : (challenge ? 'Nhấp đúp để lắp' : canInstall(hit.part) ? 'Nhấp đúp để lắp lại' : '🔒 Cần lắp bộ phận khác trước');
      html = `<b>${esc(p.def.name)}</b><span>${state}</span>`;
    } else {
      html = `<b>${esc(hit.wire.label)}</b><span>Loại dây: ${TYPE_NAME[hit.wire.type]}</span>`;
    }
    tooltip.innerHTML = html;
    tooltip.style.transform = `translate(${Math.min(e.clientX - r.left + 14, r.width - 240)}px, ${e.clientY - r.top + 14}px)`;
    tooltip.hidden = false;
  } else tooltip.hidden = true;
});
canvas.addEventListener('pointerleave', () => { hovered = null; hoveredWire = null; tooltip.hidden = true; });

function select(id, focus = false) {
  selected = id;
  renderInfo();
  renderPartsList();
  if (focus && id) {
    const p = parts.get(id);
    const box = new THREE.Box3().setFromObject(p.group);
    if (!box.isEmpty()) {
      const c = box.getCenter(new THREE.Vector3());
      const dir = camera.position.clone().sub(controls.target).normalize();
      const dist = Math.max(1.4, Math.min(3, camera.position.distanceTo(controls.target)));
      flyCamera(c.clone().add(dir.multiplyScalar(dist)).toArray(), c.toArray());
    }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, select')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  if (e.key === 'Escape') select(null);
  if ((e.key === 'Enter' || e.key === 'Delete') && selected && !e.target.closest('button')) toggle(selected);
  if (e.key.toLowerCase() === 'h' && !e.ctrlKey) hintNext();
});

// ================= Giao diện =================
let toastTimer;
function toast(msg, kind = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

function changed() {
  renderPartsList();
  renderInfo();
  renderProgress();
  checkChallenge();
}

function renderModelTabs() {
  $('#modelTabs').innerHTML = Object.values(MODELS).map((m) => `
    <button class="model-tab ${m === M ? 'active' : ''}" data-model="${m.id}" style="--c:${m.accent}">
      <span class="brand-name">${esc(m.brand)}</span><span class="model-name">${esc(m.name.replace(' (mô phỏng)', ''))}</span>
    </button>`).join('');
}

function renderProgress() {
  const total = parts.size;
  const inst = [...parts.values()].filter((p) => p.installed).length;
  $('#progressText').textContent = `${inst}/${total} bộ phận đã lắp`;
  $('#progressBar').style.width = `${(inst / total) * 100}%`;
  $('#modelTitle').textContent = `${M.brand} ${M.name}`;
  $('#modelKind').textContent = M.kind;
}

function partStateLabel(p) {
  if (p.installed) return canRemove(p.def.id) ? { cls: 'free', txt: 'Tháo được' } : { cls: 'lock', txt: 'Đang bị chặn' };
  return canInstall(p.def.id) ? { cls: 'ready', txt: 'Lắp được' } : { cls: 'lock', txt: 'Chờ lắp' };
}

function renderPartsList() {
  const el = $('#partsList');
  const groups = {};
  const list = [...parts.values()];
  if (challenge && challenge.order) list.sort((a, b) => challenge.order.indexOf(a.def.id) - challenge.order.indexOf(b.def.id));
  list.forEach((p) => {
    const key = challenge ? 'all' : p.def.cat;
    (groups[key] ||= []).push(p);
  });
  const hideHints = !!challenge && !challenge.done;
  el.innerHTML = Object.entries(groups).map(([cat, ps]) => `
    <div class="cat">
      ${cat === 'all' ? '<h4>Bộ phận (xáo trộn)</h4>' : `<h4><i style="background:${CATS[cat].color}"></i>${CATS[cat].name}</h4>`}
      <ul>${ps.map((p) => {
        const st = partStateLabel(p);
        const lock = !hideHints && st.cls === 'lock';
        return `<li class="part ${p.installed ? 'in' : 'out'} ${selected === p.def.id ? 'sel' : ''}" data-id="${p.def.id}">
          <button class="pname" data-act="select">${lock ? '<span class="lockico" aria-label="bị chặn">🔒</span>' : `<span class="dot ${p.installed ? 'in' : 'out'}"></span>`}${esc(p.def.name)}</button>
          <button class="pact ${p.installed ? 'rm' : 'add'}" data-act="toggle" title="${p.installed ? 'Tháo bộ phận' : 'Lắp bộ phận'}">${p.installed ? 'Tháo' : 'Lắp'}</button>
        </li>`;
      }).join('')}</ul>
    </div>`).join('');
}

$('#partsList').addEventListener('click', (e) => {
  const li = e.target.closest('li.part');
  if (!li) return;
  const act = e.target.closest('button')?.dataset.act;
  if (act === 'toggle') { select(li.dataset.id); toggle(li.dataset.id); } else select(li.dataset.id, true);
});

function wiresOf(id) {
  return M.wires.filter((w) => w.from === id || w.to === id);
}

const MODE_HELP = {
  disassemble: {
    title: 'Chế độ Tháo rời',
    body: 'Xe được lắp như ngoài thực tế: <b>bộ phận bên ngoài phải tháo trước</b>. Nhấp vào bộ phận để xem nó làm gì, nhấp đúp (hoặc bấm <b>Tháo</b>) để tháo ra. Bộ phận có 🔒 đang bị bộ phận khác che hoặc đè lên.',
  },
  assemble: {
    title: 'Chế độ Lắp ráp',
    body: 'Các bộ phận đã được tháo rời quanh xe. Lắp theo đúng thứ tự: <b>khung → bó dây → linh kiện điện → động cơ, bánh → vỏ ốp</b>. Chọn một bộ phận để thấy bóng xanh chỉ vị trí lắp.',
  },
  electric: {
    title: 'Sơ đồ điện',
    body: 'Vỏ xe được làm trong suốt để thấy đường dây. Bật khoá, gạt chân chống, vặn ga và xem dòng điện chạy từ pin → rơ-le → bộ điều khiển → động cơ. Thử tháo một bộ phận để xem xe phản ứng thế nào.',
  },
  challenge: {
    title: 'Thử thách lắp ráp',
    body: 'Toàn bộ xe bị tháo rời, danh sách bị xáo trộn và không có gợi ý khoá. Lắp lại hoàn chỉnh nhanh nhất với ít lỗi nhất. Mỗi lần lắp sai thứ tự tính 1 lỗi.',
  },
};

function renderInfo() {
  const el = $('#infoCard');
  if (!selected) {
    const h = MODE_HELP[mode];
    let extra = '';
    if (mode === 'challenge' && (!challenge || challenge.done)) extra = '<button class="btn primary" id="startChallenge">Bắt đầu thử thách</button>';
    const best = store.get(`ev.best.${M.id}`, null);
    if (mode === 'challenge' && best) extra += `<p class="muted small">Kỷ lục của bạn với mẫu này: <b>${fmtTime(best.time)}</b>, ${best.mistakes} lỗi.</p>`;
    el.innerHTML = `<div class="mode-help"><h3>${h.title}</h3><p>${h.body}</p>${extra}</div>`;
    $('#startChallenge')?.addEventListener('click', startChallenge);
    return;
  }
  const p = parts.get(selected);
  const d = p.def;
  const hideHints = !!challenge && !challenge.done;
  let order = '';
  if (!hideHints) {
    if (p.installed) {
      const b = removeBlockers(d.id);
      order = b.length ? `<div class="order lock"><b>Cần tháo trước:</b> ${b.map((x) => `<a data-sel="${x}">${esc(nameOf(x))}</a>`).join(', ')}</div>` : '<div class="order ok">✓ Có thể tháo ngay</div>';
    } else {
      const m = installMissing(d.id);
      order = m.length ? `<div class="order lock"><b>Cần lắp trước:</b> ${m.map((x) => `<a data-sel="${x}">${esc(nameOf(x))}</a>`).join(', ')}</div>` : '<div class="order ok">✓ Có thể lắp ngay – bóng xanh là vị trí lắp</div>';
    }
  }
  const ws = wiresOf(d.id);
  const wiresHtml = ws.length ? `<h5>Kết nối điện</h5><ul class="conn">${ws.map((w) => {
    const other = w.from === d.id ? w.to : w.from;
    const arrow = w.from === d.id ? '→' : '←';
    return `<li><span class="wdot ${w.type}"></span>${arrow} <a data-sel="${other}">${esc(nameOf(other))}</a> <em>${TYPE_NAME[w.type]}</em></li>`;
  }).join('')}</ul>` : '';
  el.innerHTML = `
    <div class="part-card">
      <div class="pc-head">
        <span class="chip" style="--c:${CATS[d.cat].color}">${CATS[d.cat].name}</span>
        <span class="status ${p.installed ? 'in' : 'out'}">${p.installed ? 'Đang lắp trên xe' : 'Đã tháo'}</span>
        <button class="icon-btn" id="closeInfo" aria-label="Bỏ chọn">✕</button>
      </div>
      <h3>${esc(d.name)}</h3>
      <p>${esc(d.desc)}</p>
      ${d.specs?.length ? `<dl class="specs">${d.specs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
      ${order}
      ${wiresHtml}
      ${d.tips?.length ? `<h5>Lưu ý khi tháo/lắp</h5><ul class="tips">${d.tips.map((t) => `<li class="${t.startsWith('⚠') ? 'danger' : ''}">${esc(t)}</li>`).join('')}</ul>` : ''}
      <div class="pc-actions">
        <button class="btn primary" id="partAction">${p.installed ? 'Tháo bộ phận này' : 'Lắp vào xe'}</button>
        <button class="btn" id="focusPart">Phóng to</button>
      </div>
    </div>`;
  $('#partAction').addEventListener('click', () => toggle(d.id));
  $('#focusPart').addEventListener('click', () => select(d.id, true));
  $('#closeInfo').addEventListener('click', () => select(null));
  el.querySelectorAll('[data-sel]').forEach((a) => a.addEventListener('click', () => select(a.dataset.sel, true)));
}

function renderAbout() {
  $('#aboutModel').innerHTML = `
    <h4>Về mẫu xe này</h4>
    <p class="muted small">${esc(M.brand)} ${esc(M.name)} — ${esc(M.kind)}</p>
    <dl class="specs">${M.summary.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="note">${esc(M.layoutNote)}</p>
    <p class="muted tiny">Thông số tham khảo từ công bố của hãng; mô hình 3D và đường dây là mô phỏng đơn giản hoá để học tập, không phải tài liệu sửa chữa chính hãng.</p>`;
}

// ---- Bảng mô phỏng điện ----
function renderSim() {
  $('#simKey').checked = sim.key;
  $('#simStand').checked = !sim.standDown;
  $('#simBrake').checked = sim.brake;
  $('#simCharge').checked = sim.charging;
  $('#simThrottle').value = Math.round(sim.throttle * 100);
  document.querySelectorAll('[data-drive]').forEach((b) => b.classList.toggle('active', b.dataset.drive === sim.mode));
}
function renderSimLive() {
  const r = simResult;
  if (!r) return;
  const st = $('#simStatus');
  st.className = `sim-status ${r.status.level}`;
  st.textContent = r.status.text;
  const items = [...r.blockers.map((b) => `<li class="blk">${esc(b)}</li>`), ...r.warnings.map((w) => `<li class="wrn">${esc(w)}</li>`)];
  const html = items.length ? items.join('') : '<li class="okk">Mọi điều kiện an toàn đã thoả.</li>';
  if ($('#simReasons').dataset.h !== html) { $('#simReasons').innerHTML = html; $('#simReasons').dataset.h = html; }
  $('#rSpeed').textContent = Math.round(sim.speed);
  $('#rPower').textContent = (r.powerW / 1000).toFixed(1);
  $('#rCurrent').textContent = Math.round(r.currentA);
  $('#rSoc').textContent = Math.round(sim.soc);
  $('#socBar').style.width = `${sim.soc}%`;
  $('#speedo').hidden = mode !== 'electric';
  $('#sSpeed').textContent = Math.round(sim.speed);
  $('#sSoc').textContent = `${Math.round(sim.soc)}%`;
  $('#sPower').textContent = `${(r.powerW / 1000).toFixed(1)} kW`;
  $('#throttleVal').textContent = `${Math.round(sim.throttle * 100)}%`;
}

$('#simKey').addEventListener('change', (e) => { sim.key = e.target.checked; if (sim.key && has('khoa')) toast('Bật khoá: BMS đóng rơ-le, cấp điện cao áp.', 'info'); });
$('#simStand').addEventListener('change', (e) => { sim.standDown = !e.target.checked; });
$('#simBrake').addEventListener('change', (e) => { sim.brake = e.target.checked; });
$('#simCharge').addEventListener('change', (e) => { sim.charging = e.target.checked; if (sim.charging) { sim.throttle = 0; renderSim(); } });
$('#simThrottle').addEventListener('input', (e) => { sim.throttle = e.target.value / 100; });
const hold = (el, on, off) => {
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); on(); el.classList.add('held'); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => { off(); el.classList.remove('held'); }));
};
hold($('#simHorn'), () => { sim.horn = true; }, () => { sim.horn = false; });
document.querySelectorAll('[data-drive]').forEach((b) => b.addEventListener('click', () => { sim.mode = b.dataset.drive; renderSim(); }));
$('#simQuick').addEventListener('click', () => {
  sim.key = true; sim.standDown = false; sim.brake = false; sim.charging = false; sim.throttle = 0.5;
  renderSim();
  toast('Bật khoá, gạt chân chống, vặn ga 50%.', 'info');
});

// ---- Chế độ ----
function setMode(m, fromLoad = false) {
  const prev = mode;
  mode = m;
  document.querySelectorAll('#modeTabs button').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
  document.body.dataset.mode = m;
  $('#simPanel').hidden = m !== 'electric';
  if (m === 'electric') { setOpt('xray', true); setOpt('wires', true); }
  else if (prev === 'electric' && !fromLoad) { setOpt('xray', false); setOpt('wires', false); }
  if (m !== 'challenge' && challenge) { challenge = null; renderChallengeHud(); }
  if (m === 'assemble' && [...parts.values()].every((p) => p.installed)) explodeAll();
  if (m === 'challenge') { challenge = null; renderChallengeHud(); }
  selected = null;
  renderInfo();
  renderPartsList();
}

function setOpt(k, v) {
  opts[k] = v;
  const box = document.querySelector(`[data-opt="${k}"]`);
  if (box) box.checked = v;
  if (k === 'xray') applyXray();
  $('#legend').hidden = !opts.wires;
}

// ---- Thử thách ----
function fmtTime(s) { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
function startChallenge() {
  sim = createSimState();
  renderSim();
  for (const p of parts.values()) { p.installed = false; p.anim = null; p.group.position.copy(p.explode); }
  const ids = [...parts.keys()];
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  challenge = { start: performance.now(), mistakes: 0, hints: 0, order: ids, done: false };
  history = [];
  setOpt('hideRemoved', false);
  selected = null;
  flyCamera(...WIDE);
  toast('Bắt đầu! Gợi ý: bộ phận nào cần có đầu tiên để những thứ khác bắt vào?', 'info');
  changed();
  renderChallengeHud();
}
function renderChallengeHud() {
  const hud = $('#challengeHud');
  hud.hidden = !challenge;
  document.body.classList.toggle('challenge-on', !!challenge && !challenge.done);
  if (!challenge) return;
  const el = ((challenge.done ? challenge.end : performance.now()) - challenge.start) / 1000;
  $('#cTime').textContent = fmtTime(el);
  $('#cMist').textContent = challenge.mistakes;
  $('#cHints').textContent = challenge.hints;
}
function checkChallenge() {
  if (!challenge || challenge.done) return;
  if (![...parts.values()].every((p) => p.installed)) return;
  challenge.done = true;
  challenge.end = performance.now();
  const time = (challenge.end - challenge.start) / 1000;
  const score = Math.max(1, 3 - Math.floor((challenge.mistakes + challenge.hints) / 3));
  const best = store.get(`ev.best.${M.id}`, null);
  const isBest = !best || time < best.time;
  if (isBest) store.set(`ev.best.${M.id}`, { time, mistakes: challenge.mistakes });
  $('#doneBody').innerHTML = `
    <div class="stars">${'★'.repeat(score)}${'☆'.repeat(3 - score)}</div>
    <p>Bạn đã lắp hoàn chỉnh <b>${esc(M.brand)} ${esc(M.name)}</b>!</p>
    <dl class="specs"><dt>Thời gian</dt><dd>${fmtTime(time)}${isBest ? ' 🏆 kỷ lục mới' : ''}</dd><dt>Lỗi thứ tự</dt><dd>${challenge.mistakes}</dd><dt>Gợi ý đã dùng</dt><dd>${challenge.hints}</dd></dl>
    <p class="muted small">Thử chuyển sang <b>Sơ đồ điện</b> để kiểm tra xe bạn vừa lắp có chạy được không.</p>`;
  renderChallengeHud();
  setTimeout(() => $('#doneDialog').showModal(), 800);
  renderInfo();
}
$('#doneAgain').addEventListener('click', () => { $('#doneDialog').close(); startChallenge(); });
$('#doneElectric').addEventListener('click', () => { $('#doneDialog').close(); setMode('electric'); });

// ---- Sự kiện thanh công cụ ----
$('#modelTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-model]');
  if (b && MODELS[b.dataset.model] !== M) { loadModel(b.dataset.model); renderModelTabs(); renderAbout(); renderSim(); }
});
$('#modeTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { const v = VIEWS[b.dataset.view](); flyCamera(v.pos, v.target); }));
document.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('change', () => setOpt(b.dataset.opt, b.checked)));
$('#btnHint').addEventListener('click', hintNext);
$('#btnUndo').addEventListener('click', undo);
$('#btnExplode').addEventListener('click', explodeAll);
$('#btnAssemble').addEventListener('click', assembleAll);

function renderAll() {
  renderModelTabs();
  renderProgress();
  renderPartsList();
  renderInfo();
  renderAbout();
  renderSim();
}

// ================= Vòng lặp =================
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas);

const clock = new THREE.Clock();
let uiTick = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = performance.now();
  for (const p of parts.values()) {
    if (!p.anim) continue;
    p.anim.t += dt / 0.7;
    if (p.anim.t < 0) continue;
    const t = Math.min(1, p.anim.t);
    const e = ease(t);
    p.group.position.lerpVectors(p.anim.from, p.anim.to, e);
    p.group.position.y += Math.sin(Math.PI * e) * 0.12;
    if (t >= 1) p.anim = null;
  }
  if (camFly) {
    camFly.t = Math.min(1, camFly.t + dt / 0.8);
    const e = ease(camFly.t);
    camera.position.lerpVectors(camFly.fromP, camFly.toP, e);
    controls.target.lerpVectors(camFly.fromT, camFly.toT, e);
    if (camFly.t >= 1) camFly = null;
  }
  simResult = simulate(M, has, sim);
  stepSim(M, sim, simResult, dt);
  updateVisuals(now);
  updateWires(dt);
  updateSpin(dt);
  uiTick += dt;
  if (uiTick > 0.1) {
    uiTick = 0;
    renderSimLive();
    schematic.update(has, simResult, selected, sim);
    if (challenge && !challenge.done) renderChallengeHud();
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

loadModel(MODELS[store.get('ev.model', 'evo')] ? store.get('ev.model', 'evo') : 'evo');
setMode('disassemble');
resize();
requestAnimationFrame(frame);
window.__ev = { parts, explodeAll, assembleAll, setMode, select, sim: () => sim, toggle };
