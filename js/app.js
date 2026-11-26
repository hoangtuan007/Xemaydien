import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { LINEUP, BRANDS } from './models/lineup.js';
import { CATS } from './models/common.js';
import { createSimState, simulate, stepSim } from './sim.js';
import { Schematic } from './schematic.js';
import { howto } from './howto.js';

const MODELS = Object.fromEntries(LINEUP.map((m) => [m.id, m]));
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* bỏ qua */ } },
};
// Ảnh thật có giấy phép mở (Wikimedia Commons), khai báo trong assets/photos/photos.json
let PHOTOS = { models: {}, parts: {} };
const photoUrl = (ph) => `assets/photos/${ph.file}`;
function credit(ph) {
  const who = ph.author ? esc(ph.author) : 'Không rõ tác giả';
  const lic = ph.licenseUrl ? `<a href="${esc(ph.licenseUrl)}" target="_blank" rel="noopener">${esc(ph.license)}</a>` : esc(ph.license);
  return `Ảnh: ${who} · ${lic} · <a href="${esc(ph.source)}" target="_blank" rel="noopener">Wikimedia Commons</a>`;
}
const modelPhotos = (m) => PHOTOS.models[m.id] || [];
function partPhoto(partId) {
  const drive = M.drive === 'hub' ? 'hub' : M.drive === 'side-belt' ? 'side' : 'mid';
  const keys = [`${M.id}:${partId}`, partId === 'pin-2' ? `${M.id}:pin` : null, partId === 'dong-co' ? `dong-co:${drive}` : null, partId === 'pin-2' ? 'pin' : null, partId].filter(Boolean);
  for (const k of keys) if (PHOTOS.parts[k]?.length) return PHOTOS.parts[k][0];
  return null;
}

const DRIVE_LABEL = { hub: 'Động cơ in-hub', 'side-belt': 'Động cơ bên + dây đai', 'mid-chain': 'Động cơ giữa + xích' };
const BATTERY_LABEL = { floor: 'Pin dưới sàn', 'floor-big': 'Pin lớn dưới sàn', 'seat-dual': '2 pin rời dưới yên', frame: 'Pin trong khung' };

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
const fxRoot = new THREE.Group();
scene.add(fxRoot);

// đường nét đứt nối bộ phận đang kéo với vị trí lắp
const guideLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: 0x00c853, dashSize: 0.03, gapSize: 0.02, depthTest: false, transparent: true }));
guideLine.renderOrder = 10;
guideLine.visible = false;
scene.add(guideLine);

function applyTheme() {
  const cs = getComputedStyle(document.documentElement);
  const bg = cs.getPropertyValue('--scene-bg').trim() || '#14181d';
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 6, 14);
  groundMat.color.set(cs.getPropertyValue('--scene-ground').trim() || '#20252c');
  grid.material.color = new THREE.Color(cs.getPropertyValue('--scene-grid').trim() || '#333a44');
}
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

// ================= Âm thanh nhỏ (tự tạo, không cần file) =================
let actx = null;
function ensureAudio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { actx = null; } }
  if (actx?.state === 'suspended') actx.resume().catch(() => {});
}
function tone(freq, dur = 0.06, type = 'square', vol = 0.04, when = 0) {
  if (!opts.sound || !actx) return;
  try {
    const t = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch { /* bỏ qua */ }
}
const sfx = {
  snap() { tone(660, 0.05, 'square', 0.04); tone(990, 0.07, 'square', 0.035, 0.05); },
  bolt() { tone(1800 + Math.random() * 400, 0.025, 'triangle', 0.03); },
  plug() { tone(420, 0.04, 'sine', 0.06); tone(840, 0.03, 'sine', 0.04, 0.03); },
  err() { tone(150, 0.2, 'sawtooth', 0.04); },
  pull() { tone(330, 0.06, 'sine', 0.05); },
};

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
const opts = { xray: false, wires: false, hideRemoved: false, sound: store.get('ev.sound', true), photo: store.get('ev.photo', true) };
let sim = createSimState();
let simResult = null;
let challenge = null;
let drag = null;
const schematic = new Schematic($('#schematic'), (id) => select(id, true));

const WIRE_COL = { hv: 0xff7a1a, lv: 0xe53935, signal: 0x29b6f6, charge: 0xb05cff };
const PHASE_COL = [0xf5c400, 0x2e9d4f, 0x1e6fd9];
const TYPE_NAME = { hv: 'Cao áp DC', lv: '12 V', signal: 'Tín hiệu', charge: 'Sạc', phase: '3 pha' };
const ELECTRIC_CATS = ['dien', 'dongco'];
const MECH_ONLY = ['xich', 'day-dai'];
const NO_BOLTS = ['khung', 'bo-day', 'xich', 'day-dai'];

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
  try { if (location.hash.slice(1) !== id) window.history.replaceState(null, '', `#${id}`); } catch { /* bỏ qua */ }
  endDrag(true);
  [...root.children].forEach((c) => { root.remove(c); disposeTree(c); });
  [...wireRoot.children].forEach((c) => { wireRoot.remove(c); disposeTree(c); });
  [...fxRoot.children].forEach((c) => fxRoot.remove(c));
  fx.length = 0;
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
    group.updateMatrixWorld(true);
    const homeBox = new THREE.Box3().setFromObject(group);
    const homeCenter = homeBox.getCenter(new THREE.Vector3());
    const axleObj = spinners.find((s) => s.userData.spin === 'front' || s.userData.spin === 'rear');
    const axle = axleObj ? axleObj.getWorldPosition(new THREE.Vector3()) : null;
    const explode = new THREE.Vector3(...def.explode);
    parts.set(def.id, { def, idx, group, meshes, spinners, installed: true, anim: null, ghost: null, ghostMat: null, explode, rest: explode.clone(), homeBox, homeCenter, axle });
    dependents[def.id] = [];
  });
  M.parts.forEach((def) => def.after.forEach((a) => dependents[a]?.push(def.id)));
  buildWires();
  selected = null; hovered = null; history = []; challenge = null; photoIdx = 0;
  sim = createSimState();
  schematic.setModel(M);
  applyXray();
  guide.hide();
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
      wires.push({ def: w, mesh, inst, curve, N, t: i / 3, pulse: 0 });
    });
  });
}

// ================= Quy tắc tháo / lắp =================
const removeBlockers = (id) => dependents[id].filter(has);
const installMissing = (id) => parts.get(id).def.after.filter((a) => !has(a));
const canRemove = (id) => has(id) && removeBlockers(id).length === 0;
const canInstall = (id) => !has(id) && installMissing(id).length === 0;

function electricGuard(p, quiet = false) {
  if (sim.key && ELECTRIC_CATS.includes(p.def.cat) && !MECH_ONLY.includes(p.def.id)) {
    if (!quiet) { toast('⚠ Tắt khoá điện trước khi tháo/lắp bộ phận điện! (an toàn điện cao áp)', 'err'); flash(['khoa'], 'warn'); sfx.err(); }
    return false;
  }
  if (sim.charging && ['pin', 'pin-2', 'cong-sac', 'bo-day'].includes(p.def.id)) {
    if (!quiet) { toast('⚠ Rút sạc trước khi tháo pin, cổng sạc hoặc bó dây.', 'err'); sfx.err(); }
    return false;
  }
  return true;
}

function blockedRemove(p) {
  const blockers = removeBlockers(p.def.id);
  flash(blockers, 'err');
  sfx.err();
  toast(`Chưa tháo được "${p.def.name}". Cần tháo trước: ${blockers.map(nameOf).join(', ')}`, 'warn');
}
function blockedInstall(p) {
  const missing = installMissing(p.def.id);
  if (challenge && !challenge.done) { challenge.mistakes++; renderChallengeHud(); }
  flash(missing, 'err');
  sfx.err();
  const msg = challenge ? `Chưa đúng thứ tự! "${p.def.name}" cần lắp sau ${missing.length} bộ phận khác.` : `Chưa lắp được "${p.def.name}". Cần lắp trước: ${missing.map(nameOf).join(', ')}`;
  toast(msg, 'warn');
}

function doRemove(p, { at = null, quiet = false } = {}) {
  p.installed = false;
  if (at) { p.rest.copy(at); p.anim = null; p.group.position.copy(at); } else animate(p, false);
  history.push({ id: p.def.id, action: 'remove' });
  if (!quiet) { toast(`Đã tháo: ${p.def.name}`, 'ok'); sfx.pull(); }
  changed();
}
function doInstall(p, { fromDrag = false } = {}) {
  p.installed = true;
  animate(p, true, 0, fromDrag ? 0.22 : 0.7);
  history.push({ id: p.def.id, action: 'install' });
  toast(`Đã lắp: ${p.def.name}`, 'ok');
  if (fromDrag) sfx.snap();
  playAssemblyFx(p, fromDrag ? 220 : 700);
  guide.steps(p);
  changed();
}

function tryRemove(id) {
  const p = parts.get(id);
  if (!p || !p.installed || !electricGuard(p)) return false;
  if (removeBlockers(id).length) { blockedRemove(p); return false; }
  doRemove(p);
  return true;
}
function tryInstall(id) {
  const p = parts.get(id);
  if (!p || p.installed || !electricGuard(p)) return false;
  if (installMissing(id).length) { blockedInstall(p); return false; }
  doInstall(p);
  return true;
}
function toggle(id) { return has(id) ? tryRemove(id) : tryInstall(id); }

function undo() {
  const h = history.pop();
  if (!h) { toast('Không còn thao tác để hoàn tác.', 'info'); return; }
  const p = parts.get(h.id);
  p.installed = h.action === 'remove';
  animate(p, p.installed);
  toast(`Hoàn tác: ${p.def.name}`, 'info');
  changed();
}

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
  for (let guard = 0; guard < 200; guard++) {
    const cands = [...parts.values()].filter((p) => !inst.has(p.def.id) && p.def.after.every((a) => inst.has(a)));
    if (!cands.length) break;
    cands.sort((a, b) => a.idx - b.idx);
    order.push(cands[0].def.id);
    inst.add(cands[0].def.id);
  }
  return order;
}

function explodeAll() {
  sim.key = false; sim.charging = false; renderSim();
  guide.hide();
  const order = removalOrder();
  order.forEach((id, i) => {
    const p = parts.get(id);
    p.installed = false;
    p.rest.copy(p.explode);
    animate(p, false, i * 0.06);
  });
  for (const p of parts.values()) if (!p.installed && !order.includes(p.def.id)) { p.rest.copy(p.explode); animate(p, false); }
  if (order.length) { history = []; toast(`Đã tháo rời ${order.length} bộ phận theo đúng thứ tự.`, 'ok'); flyCamera(...WIDE); }
  changed();
}
function assembleAll() {
  sim.key = false; renderSim();
  guide.hide();
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
  if (verb === 'lắp') guide.preview(parts.get(id));
  toast(verb === 'lắp' ? `Bước tiếp theo: kéo "${nameOf(id)}" vào bóng xanh để lắp` : `Bước tiếp theo: tháo "${nameOf(id)}"`, 'info');
}

// ================= Hiệu ứng chuyển động =================
function animate(p, installed, delay = 0, dur = 0.7) {
  p.anim = { from: p.group.position.clone(), to: installed ? new THREE.Vector3() : p.rest.clone(), t: -delay / dur, dur, arc: dur > 0.4 };
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
  mate: { c: new THREE.Color(0x00bcd4), i: 0.35 },
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
    p.ghostMat = new THREE.MeshBasicMaterial({ color: 0x00e676, transparent: true, opacity: 0.22, depthWrite: false });
    g.traverse((o) => { if (o.isMesh) { o.material = p.ghostMat; o.castShadow = false; } o.userData = { ghost: true }; });
    g.position.set(0, 0, 0);
    g.renderOrder = 2;
    root.add(g);
    p.ghost = g;
  }
  return p.ghost;
}

function updateVisuals(now) {
  const pulse = 0.65 + 0.35 * Math.sin(now / 160);
  const L = simResult?.lamps || {};
  const mates = drag?.moved ? drag.p.def.after : [];
  for (const p of parts.values()) {
    const id = p.def.id;
    let hl = null;
    const f = flashes.get(id);
    if (f && f.until > now) hl = { c: HL[f.kind].c, i: HL[f.kind].i * pulse };
    else if (f) flashes.delete(id);
    if (!hl && drag?.p === p) hl = HL.selected;
    if (!hl && mates.includes(id) && p.installed) hl = { c: HL.mate.c, i: HL.mate.i * pulse };
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
    p.group.visible = p.installed || !!p.anim || !opts.hideRemoved || selected === id || drag?.p === p;
    const wantGhost = drag?.p === p ? drag.moved : selected === id && !p.installed;
    if (wantGhost) {
      const g = ghostFor(p);
      g.visible = true;
      if (drag?.p === p) {
        const ok = p.installed || canInstall(id);
        p.ghostMat.color.setHex(p.installed ? 0x2f9bff : ok ? 0x00e676 : 0xff1744);
        p.ghostMat.opacity = drag.near ? 0.5 + 0.15 * Math.sin(now / 90) : 0.24;
      } else { p.ghostMat.color.setHex(0x00e676); p.ghostMat.opacity = 0.22; }
    } else if (p.ghost) p.ghost.visible = false;
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
    w.pulse = Math.max(0, w.pulse - dt);
    const hot = hoveredWire === d || w.pulse > 0;
    w.mesh.material.emissiveIntensity = hot ? 1.3 : rate > 0 ? 0.55 : 0.18;
    if (!w.inst.visible) continue;
    const len = w.curve.getLength();
    w.t = (w.t + (rate * dt) / len * 0.35) % 1;
    for (let i = 0; i < w.N; i++) {
      w.curve.getPointAt((w.t + i / w.N) % 1, _v);
      _m4.makeTranslation(_v.x, _v.y, _v.z);
      w.inst.setMatrixAt(i, _m4);
    }
    w.inst.instanceMatrix.needsUpdate = true;
  }
}

let wheelAngle = 0, motorAngle = 0;
function updateSpin(dt) {
  const wheelW = (sim.speed / 3.6 / (M.rearR || 0.27)) * 0.3;
  let motorW = wheelW * (M.ratio || 1);
  if (M.drive !== 'hub' && simResult?.motorOn && !simResult.wheelDriven) motorW = sim.throttle * 18;
  wheelAngle -= wheelW * dt;
  motorAngle -= motorW * dt;
  for (const p of parts.values()) {
    for (const s of p.spinners) {
      if (s.userData.spin === 'rear') s.rotation.z = wheelAngle;
      if (s.userData.spin === 'motor') s.rotation.z = motorAngle;
    }
  }
}

// ================= Hiệu ứng bắt vít & cắm giắc =================
const fx = [];
const boltGeo = (() => {
  const head = new THREE.CylinderGeometry(0.013, 0.013, 0.009, 6); head.translate(0, 0.0045, 0);
  const shank = new THREE.CylinderGeometry(0.0055, 0.0055, 0.035, 10); shank.translate(0, -0.0175, 0);
  return { head, shank };
})();
const boltMat = new THREE.MeshStandardMaterial({ color: 0xd9dde2, metalness: 0.95, roughness: 0.25, emissive: 0x00e676, emissiveIntensity: 0.25 });
const _yAxis = new THREE.Vector3(0, 1, 0);

function boltPoints(p) {
  if (NO_BOLTS.includes(p.def.id)) return [];
  if (p.axle) {
    const hw = (p.homeBox.max.z - p.homeBox.min.z) / 2;
    return [1, -1].map((k) => ({ pos: new THREE.Vector3(p.axle.x, p.axle.y, k * Math.min(hw, 0.16)), n: new THREE.Vector3(0, 0, k) }));
  }
  const b = p.homeBox, c = p.homeCenter, size = b.getSize(new THREE.Vector3());
  const xs = size.x > 0.18 ? [b.min.x + size.x * 0.22, b.max.x - size.x * 0.22] : [c.x];
  const pts = [];
  [b.max.z, b.min.z].forEach((z, k) => xs.forEach((x) => pts.push({ pos: new THREE.Vector3(x, c.y, z), n: new THREE.Vector3(0, 0, k ? -1 : 1) })));
  return pts.slice(0, 4);
}

function playAssemblyFx(p, delayMs = 0) {
  const now = performance.now();
  const pts = boltPoints(p);
  pts.forEach((b, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(boltGeo.head, boltMat), new THREE.Mesh(boltGeo.shank, boltMat));
    const q = new THREE.Quaternion().setFromUnitVectors(_yAxis, b.n);
    g.quaternion.copy(q);
    g.visible = false;
    fxRoot.add(g);
    fx.push({ obj: g, q, axis: b.n.clone(), from: b.pos.clone().addScaledVector(b.n, 0.08), to: b.pos.clone().addScaledVector(b.n, 0.002), start: now + delayMs + i * 260, dur: 380, hold: 900, spin: true, sound: 'bolt' });
  });
  // giắc điện
  const t0 = now + delayMs + pts.length * 260;
  let k = 0;
  M.wires.forEach((w) => {
    if (w.from !== p.def.id && w.to !== p.def.id) return;
    const other = w.from === p.def.id ? w.to : w.from;
    if (!has(other) || !has('bo-day')) return;
    const atStart = w.from === p.def.id;
    const end = new THREE.Vector3(...(atStart ? w.pts[0] : w.pts[w.pts.length - 1]));
    const nb = new THREE.Vector3(...(atStart ? w.pts[1] : w.pts[w.pts.length - 2]));
    const dir = nb.sub(end).normalize();
    const color = w.type === 'phase' ? 0xf5c400 : WIRE_COL[w.type];
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.018), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 }));
    plug.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    plug.visible = false;
    plug.renderOrder = 5;
    fxRoot.add(plug);
    const wireObjs = wires.filter((x) => x.def === w);
    fx.push({ obj: plug, from: end.clone().addScaledVector(dir, 0.09), to: end.clone().addScaledVector(dir, 0.012), start: t0 + k * 220, dur: 260, hold: 1100, sound: 'plug', onDone: () => wireObjs.forEach((x) => { x.pulse = 1.2; }), disposeGeo: true });
    k++;
  });
  p.fxEnd = Math.max(now + delayMs + pts.length * 260 + 400, t0 + k * 220 + 300);
}

function updateFx(now) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i];
    const t = (now - f.start) / f.dur;
    if (t < 0) continue;
    if (!f.obj.visible) { f.obj.visible = true; }
    const e = ease(Math.min(1, t));
    f.obj.position.lerpVectors(f.from, f.to, e);
    if (f.spin) f.obj.quaternion.copy(f.q).multiply(new THREE.Quaternion().setFromAxisAngle(_yAxis, (1 - e) * Math.PI * 8));
    if (t >= 1 && !f.done) { f.done = true; sfx[f.sound]?.(); f.onDone?.(); }
    if (now > f.start + f.dur + f.hold) {
      fxRoot.remove(f.obj);
      if (f.disposeGeo) { f.obj.geometry.dispose(); f.obj.material.dispose(); }
      fx.splice(i, 1);
    }
  }
}

// ================= Khung hướng dẫn lắp trên màn hình =================
const guide = (() => {
  const el = $('#guide');
  let ticker = null;
  let current = null;
  function header(p, badge, cls) {
    const h = howto(M, p.def.id);
    $('#gBadge').textContent = badge;
    $('#gBadge').className = `g-badge ${cls}`;
    $('#gTitle').textContent = p.def.name;
    const mates = p.def.after.length ? p.def.after.map(nameOf).join(', ') : 'giá đỡ (bộ phận gốc)';
    $('#gAttach').innerHTML = `<b>Gắn vào:</b> ${esc(mates)}<br><span>${esc(h.attach)}</span>`;
    $('#gMeta').innerHTML = `<span>🔩 ${esc(h.fasteners)}</span><span>🧰 ${esc(h.tools.join(', '))}</span>`;
    return h;
  }
  function list(h, done = -1) {
    $('#gSteps').innerHTML = h.steps.map((s, i) => `<li class="${i < done ? 'done' : i === done ? 'now' : ''} ${s.startsWith('⚠') ? 'danger' : ''}">${esc(s)}</li>`).join('');
  }
  function stop() { clearInterval(ticker); ticker = null; }
  return {
    hide() { stop(); el.hidden = true; current = null; },
    preview(p) {
      stop(); current = p;
      const h = header(p, 'Cách lắp', 'info');
      $('#gStatus').innerHTML = '<span class="st info">Kéo bộ phận tới bóng xanh – tới đủ gần nó sẽ tự khớp.</span>';
      list(h);
      el.hidden = false;
    },
    drag(p, near) {
      if (current !== p || ticker) { stop(); current = p; list(header(p, p.installed ? 'Đang tháo' : 'Đang lắp', p.installed ? 'warn' : 'info')); }
      el.hidden = false;
      let st;
      if (p.installed) st = near ? '<span class="st info">Thả ở đây để trả về chỗ cũ.</span>' : '<span class="st warn">Thả ra để tháo bộ phận khỏi xe.</span>';
      else {
        const miss = installMissing(p.def.id);
        if (miss.length) st = `<span class="st err">✕ Chưa lắp được – cần lắp trước: ${esc(miss.map(nameOf).join(', '))}</span>`;
        else st = near ? '<span class="st ok">✓ Đã khớp vị trí – thả tay để bắt vít!</span>' : '<span class="st info">Kéo tới bóng xanh. Các bộ phận nó gắn vào đang sáng xanh lơ.</span>';
      }
      $('#gStatus').innerHTML = st;
    },
    steps(p) {
      stop(); current = p;
      const h = header(p, 'Đang bắt vít', 'ok');
      $('#gStatus').innerHTML = '<span class="st ok">✓ Đã khớp! Làm theo từng bước:</span>';
      el.hidden = false;
      let i = 0;
      list(h, 0);
      ticker = setInterval(() => {
        i++;
        list(h, i);
        if (i >= h.steps.length) {
          stop();
          $('#gStatus').innerHTML = `<span class="st ok">✓ Hoàn tất lắp ${esc(p.def.name)}.</span>`;
          $('#gBadge').textContent = 'Xong';
        }
      }, 650);
    },
  };
})();
$('#gClose').addEventListener('click', () => guide.hide());

// ================= Camera =================
let camFly = null;
function flyCamera(pos, target, instant = false) {
  if (instant) { camera.position.set(...pos); controls.target.set(...target); controls.update(); return; }
  camFly = { fromP: camera.position.clone(), toP: new THREE.Vector3(...pos), fromT: controls.target.clone(), toT: new THREE.Vector3(...target), t: 0 };
}
const WIDE = [[2.8, 2.9, 4.9], [-0.05, 0.5, 0.1]];
const VIEWS = {
  iso: () => M.camera,
  right: () => ({ pos: [0, 0.75, 3.3], target: [0, 0.55, 0] }),
  left: () => ({ pos: [0, 0.75, -3.3], target: [0, 0.55, 0] }),
  top: () => ({ pos: [0.01, 3.6, 0.3], target: [0, 0.4, 0] }),
  front: () => ({ pos: [3.2, 1.0, 0.0], target: [0, 0.6, 0] }),
  wide: () => ({ pos: WIDE[0], target: WIDE[1] }),
};

// ================= Chuột / chạm: chọn, kéo thả, tự khớp =================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const SNAP_PX = 70;

function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
function setRay(ev) {
  const r = canvas.getBoundingClientRect();
  pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}
function pick(ev) {
  setRay(ev);
  const hits = raycaster.intersectObjects([root, wireRoot], true);
  for (const h of hits) {
    const o = h.object;
    if (o.userData.ghost || o.userData.particles || !visibleChain(o)) continue;
    if (o.userData.wire) return { wire: o.userData.wire };
    const id = o.userData.partId;
    if (!id) continue;
    const p = parts.get(id);
    if (drag?.p === p) continue;
    if (opts.xray && p.def.shell && p.installed) continue;
    return { part: id, point: h.point };
  }
  return null;
}
function toScreen(v) {
  const r = canvas.getBoundingClientRect();
  const q = v.clone().project(camera);
  return new THREE.Vector2((q.x + 1) / 2 * r.width, (1 - q.y) / 2 * r.height);
}

let down = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  ensureAudio();
  down = { x: e.clientX, y: e.clientY };
  const hit = pick(e);
  if (!hit?.part) return;
  const p = parts.get(hit.part);
  const draggable = !p.installed || mode === 'disassemble' || mode === 'electric';
  if (!draggable) return;
  // chặn OrbitControls: kéo bộ phận chứ không xoay cảnh
  e.stopImmediatePropagation();
  canvas.setPointerCapture(e.pointerId);
  p.anim = null; // nắm được cả khi bộ phận đang bay
  const center = p.homeCenter.clone().add(p.group.position);
  dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), center);
  const hitPt = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, hitPt);
  drag = { p, pointerId: e.pointerId, grab: center.clone().sub(hitPt), moved: false, near: false, x: e.clientX, y: e.clientY, start: p.group.position.clone() };
}, { capture: true });

canvas.addEventListener('pointermove', (e) => {
  if (drag && e.pointerId === drag.pointerId) { onDragMove(e); return; }
  if (e.pointerType !== 'mouse' || e.buttons) return;
  hoverAt(e);
});

function onDragMove(e) {
  const { p } = drag;
  if (!drag.moved) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    // bắt đầu kéo thật sự: kiểm tra quy tắc
    if (!electricGuard(p)) { endDrag(true); return; }
    if (p.installed && removeBlockers(p.def.id).length) { blockedRemove(p); endDrag(true); return; }
    drag.moved = true;
    tooltip.hidden = true;
    selected = p.def.id;
    renderInfo(); renderPartsList();
    canvas.style.cursor = 'grabbing';
  }
  setRay(e);
  const hitPt = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(dragPlane, hitPt)) return;
  const center = hitPt.add(drag.grab);
  const offset = center.clone().sub(p.homeCenter);
  const bottom = p.homeBox.min.y + offset.y;
  if (bottom < 0) offset.y -= bottom; // không cho chui xuống đất
  const sd = toScreen(p.homeCenter.clone().add(offset)).distanceTo(toScreen(p.homeCenter));
  drag.near = sd < SNAP_PX || offset.length() < 0.1;
  const ok = p.installed || canInstall(p.def.id);
  // hút nam châm khi đủ gần và đúng thứ tự
  p.group.position.copy(drag.near && ok ? offset.multiplyScalar(0.18) : offset);
  const a = p.homeCenter.clone().add(p.group.position);
  guideLine.geometry.setFromPoints([a, p.homeCenter]);
  guideLine.computeLineDistances();
  guideLine.material.color.setHex(ok ? 0x00c853 : 0xff1744);
  guideLine.visible = !drag.near;
  guide.drag(p, drag.near);
}

canvas.addEventListener('pointerup', (e) => {
  if (drag && e.pointerId === drag.pointerId) {
    if (drag.moved) { finishDrag(); return; }
    endDrag(true);
  }
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
  down = null;
  if (moved > 6) return;
  const hit = pick(e);
  if (hit?.part) {
    if (selected === hit.part && e.pointerType !== 'mouse') { toggle(hit.part); return; }
    select(hit.part);
    const p = parts.get(hit.part);
    if (!p.installed) guide.preview(p);
  } else if (!hit) select(null);
});
canvas.addEventListener('pointercancel', () => { if (drag) { if (drag.moved) animate(drag.p, drag.p.installed); endDrag(true); } });

function endDrag(cancel = false) {
  if (!drag) return;
  try { canvas.releasePointerCapture(drag.pointerId); } catch { /* bỏ qua */ }
  if (cancel && drag.moved) animate(drag.p, drag.p.installed);
  drag = null;
  guideLine.visible = false;
  canvas.style.cursor = 'grab';
}

function finishDrag() {
  const { p, near } = drag;
  const pos = p.group.position.clone();
  endDrag();
  if (!p.installed) {
    if (near) {
      if (canInstall(p.def.id)) doInstall(p, { fromDrag: true });
      else { blockedInstall(p); animate(p, false); guide.drag(p, true); }
    } else { p.rest.copy(pos); guide.preview(p); }
  } else if (near) {
    animate(p, true, 0, 0.25);
    guide.hide();
  } else {
    doRemove(p, { at: pos });
    guide.hide();
  }
}

canvas.addEventListener('dblclick', (e) => {
  const hit = pick(e);
  if (hit?.part) toggle(hit.part);
});

const tooltip = $('#tooltip');
function hoverAt(e) {
  const hit = pick(e);
  hovered = hit?.part || null;
  hoveredWire = hit?.wire || null;
  canvas.style.cursor = hit?.part ? 'grab' : hit ? 'pointer' : 'default';
  if (!hit) { tooltip.hidden = true; return; }
  const r = stage.getBoundingClientRect();
  let html;
  if (hit.part) {
    const p = parts.get(hit.part);
    const state = p.installed
      ? (canRemove(hit.part) ? (mode === 'assemble' || mode === 'challenge' ? 'Nhấp đúp để tháo' : 'Kéo ra để tháo') : '🔒 Cần tháo bộ phận khác trước')
      : (challenge || canInstall(hit.part) ? 'Kéo vào bóng xanh để lắp' : '🔒 Cần lắp bộ phận khác trước');
    html = `<b>${esc(p.def.name)}</b><span>${state}</span>`;
  } else html = `<b>${esc(hit.wire.label)}</b><span>Loại dây: ${TYPE_NAME[hit.wire.type]}</span>`;
  tooltip.innerHTML = html;
  tooltip.style.transform = `translate(${Math.min(e.clientX - r.left + 14, r.width - 240)}px, ${e.clientY - r.top + 14}px)`;
  tooltip.hidden = false;
}
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
  if (e.target.closest('input, textarea, select, dialog')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
  if (e.key === 'Escape') { select(null); guide.hide(); }
  if ((e.key === 'Enter' || e.key === 'Delete') && selected && !e.target.closest('button')) toggle(selected);
  if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) hintNext();
});

// ================= Giao diện =================
let toastTimer;
function toast(msg, kind = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 3400);
}

function changed() {
  renderPartsList();
  renderInfo();
  renderProgress();
  checkChallenge();
}

const SIL = {
  scooter: '<circle cx="26" cy="46" r="11"/><circle cx="96" cy="46" r="11"/><path d="M8 40 Q8 26 24 25 L48 25 L50 38 L68 38 L72 24 L80 10 L88 10 L84 24 Q100 28 104 40 Z"/>',
  naked: '<circle cx="24" cy="44" r="13"/><circle cx="98" cy="44" r="13"/><path d="M14 30 L46 28 L52 20 L78 18 L86 22 L96 14 L102 16 L92 30 L80 40 L44 40 Z"/>',
};
function silhouette(m) {
  return `<svg viewBox="0 0 120 60" aria-hidden="true" style="--c:${m.accent}">${m.style === 'naked' ? SIL.naked : SIL.scooter}</svg>`;
}
function renderModelButton() {
  $('#modelBtn').innerHTML = `${silhouette(M)}<span><small>${esc(M.brand)}</small><b>${esc(M.name)}</b></span><i aria-hidden="true">▾</i>`;
  $('#modelBtn').style.setProperty('--c', M.accent);
}
function renderModelGrid() {
  $('#modelGrid').innerHTML = BRANDS.map((brand) => `
    <section><h3>${esc(brand)}</h3><div class="md-cards">
    ${LINEUP.filter((m) => m.brand === brand).map((m) => `
      <button class="md-card ${m === M ? 'active' : ''}" data-model="${m.id}" style="--c:${m.accent}">
        ${modelPhotos(m)[0] ? `<img class="md-photo" src="${photoUrl(modelPhotos(m)[0])}" alt="Ảnh thật ${esc(m.brand)} ${esc(m.name)}" loading="lazy">` : silhouette(m)}
        <b>${esc(m.name)}</b>
        <span class="md-kind">${esc(m.kind)}</span>
        <span class="md-chips"><em>${DRIVE_LABEL[m.drive]}</em><em>${BATTERY_LABEL[m.battery]}</em><em>${m.parts.length} bộ phận</em></span>
      </button>`).join('')}
    </div></section>`).join('');
}
$('#modelBtn').addEventListener('click', () => { renderModelGrid(); $('#modelDialog').showModal(); });
$('#mdClose').addEventListener('click', () => $('#modelDialog').close());
$('#modelDialog').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) { $('#modelDialog').close(); return; }
  const b = e.target.closest('[data-model]');
  if (!b) return;
  $('#modelDialog').close();
  if (MODELS[b.dataset.model] !== M) { loadModel(b.dataset.model); toast(`Đã chọn ${M.brand} ${M.name}`, 'info'); }
});

function renderProgress() {
  const total = parts.size;
  const inst = [...parts.values()].filter((p) => p.installed).length;
  $('#progressText').textContent = `${inst}/${total} bộ phận đã lắp`;
  $('#progressBar').style.width = `${(inst / total) * 100}%`;
  $('#modelTitle').textContent = `${M.brand} ${M.name}`;
  $('#modelKind').textContent = `${M.kind} · mô phỏng`;
}

function partStateLabel(p) {
  if (p.installed) return canRemove(p.def.id) ? 'free' : 'lock';
  return canInstall(p.def.id) ? 'ready' : 'lock';
}

function renderPartsList() {
  const el = $('#partsList');
  const groups = {};
  const list = [...parts.values()];
  if (challenge?.order) list.sort((a, b) => challenge.order.indexOf(a.def.id) - challenge.order.indexOf(b.def.id));
  list.forEach((p) => { (groups[challenge ? 'all' : p.def.cat] ||= []).push(p); });
  const hideHints = !!challenge && !challenge.done;
  el.innerHTML = Object.entries(groups).map(([cat, ps]) => `
    <div class="cat">
      ${cat === 'all' ? '<h4>Bộ phận (xáo trộn)</h4>' : `<h4><i style="background:${CATS[cat].color}"></i>${CATS[cat].name}</h4>`}
      <ul>${ps.map((p) => {
        const lock = !hideHints && partStateLabel(p) === 'lock';
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
  ensureAudio();
  const act = e.target.closest('button')?.dataset.act;
  if (act === 'toggle') { select(li.dataset.id); toggle(li.dataset.id); return; }
  select(li.dataset.id, true);
  const p = parts.get(li.dataset.id);
  if (!p.installed) guide.preview(p);
});

const wiresOf = (id) => M.wires.filter((w) => w.from === id || w.to === id);

const MODE_HELP = {
  disassemble: {
    title: 'Chế độ Tháo rời',
    body: 'Xe được lắp như ngoài thực tế: <b>bộ phận bên ngoài phải tháo trước</b>. Nhấp để xem bộ phận làm gì; <b>kéo nó ra xa</b> (hoặc nhấp đúp) để tháo. Bộ phận có 🔒 đang bị bộ phận khác che hoặc đè lên. Kéo nền để xoay xe.',
  },
  assemble: {
    title: 'Chế độ Lắp ráp',
    body: '<b>Kéo</b> một bộ phận lại gần vị trí của nó – <b>bóng xanh</b> hiện ra, các bộ phận nó gắn vào sáng xanh lơ. Khi đủ gần, bộ phận <b>tự hút vào và bắt vít</b>, khung hướng dẫn hiện từng bước. Bóng đỏ nghĩa là chưa đúng thứ tự.',
  },
  electric: {
    title: 'Sơ đồ điện',
    body: 'Vỏ xe trong suốt để thấy đường dây. Bật khoá, gạt chân chống, vặn ga và xem dòng điện chạy từ pin → rơ-le → bộ điều khiển → động cơ. Thử tháo một bộ phận để xem xe phản ứng thế nào.',
  },
  challenge: {
    title: 'Thử thách lắp ráp',
    body: 'Toàn bộ xe bị tháo rời, danh sách bị xáo trộn và không có gợi ý khoá. Kéo thả để lắp lại hoàn chỉnh nhanh nhất với ít lỗi nhất. Mỗi lần thả sai thứ tự tính 1 lỗi.',
  },
};

function howtoHtml(p) {
  const h = howto(M, p.def.id);
  const steps = p.installed ? [...h.steps].reverse() : h.steps;
  return `<h5>${p.installed ? 'Cách tháo (ngược quy trình lắp)' : 'Cách lắp'}</h5>
    <div class="howto">
      <p><b>Gắn vào:</b> ${esc(h.attach)}</p>
      <p><b>Chi tiết bắt:</b> ${esc(h.fasteners)}</p>
      <p><b>Dụng cụ:</b> ${esc(h.tools.join(', '))}</p>
      <ol>${steps.map((s) => `<li class="${s.startsWith('⚠') ? 'danger' : ''}">${esc(s)}</li>`).join('')}</ol>
    </div>`;
}

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
      order = b.length ? `<div class="order lock"><b>Cần tháo trước:</b> ${b.map((x) => `<a data-sel="${x}">${esc(nameOf(x))}</a>`).join(', ')}</div>` : '<div class="order ok">✓ Có thể tháo ngay – kéo ra hoặc bấm nút</div>';
    } else {
      const m = installMissing(d.id);
      order = m.length ? `<div class="order lock"><b>Cần lắp trước:</b> ${m.map((x) => `<a data-sel="${x}">${esc(nameOf(x))}</a>`).join(', ')}</div>` : '<div class="order ok">✓ Có thể lắp ngay – kéo vào bóng xanh</div>';
    }
  }
  const ws = wiresOf(d.id);
  const wiresHtml = ws.length ? `<h5>Kết nối điện</h5><ul class="conn">${ws.map((w) => {
    const other = w.from === d.id ? w.to : w.from;
    return `<li><span class="wdot ${w.type}"></span>${w.from === d.id ? '→' : '←'} <a data-sel="${other}">${esc(nameOf(other))}</a> <em>${TYPE_NAME[w.type]}</em></li>`;
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
      ${(() => { const ph = partPhoto(d.id); return ph ? `<figure class="part-photo"><img src="${photoUrl(ph)}" alt="${esc(ph.title || d.name)}" loading="lazy"><figcaption>${esc(ph.caption || 'Ảnh minh hoạ loại bộ phận này trên xe thật')} · ${credit(ph)}</figcaption></figure>` : ''; })()}
      ${d.specs?.length ? `<dl class="specs">${d.specs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
      ${order}
      ${howtoHtml(p)}
      ${wiresHtml}
      ${d.tips?.length ? `<h5>Lưu ý</h5><ul class="tips">${d.tips.map((t) => `<li class="${t.startsWith('⚠') ? 'danger' : ''}">${esc(t)}</li>`).join('')}</ul>` : ''}
      <div class="pc-actions">
        <button class="btn primary" id="partAction">${p.installed ? 'Tháo bộ phận này' : 'Lắp vào xe'}</button>
        <button class="btn" id="focusPart">Phóng to</button>
      </div>
    </div>`;
  $('#partAction').addEventListener('click', () => { ensureAudio(); toggle(d.id); });
  $('#focusPart').addEventListener('click', () => select(d.id, true));
  $('#closeInfo').addEventListener('click', () => select(null));
  el.querySelectorAll('[data-sel]').forEach((a) => a.addEventListener('click', () => select(a.dataset.sel, true)));
}

function renderAbout() {
  $('#aboutModel').innerHTML = `
    <h4>Về mẫu xe này</h4>
    <p class="muted small">${esc(M.brand)} ${esc(M.name)} — ${esc(M.kind)}</p>
    <div class="md-chips"><em>${DRIVE_LABEL[M.drive]}</em><em>${BATTERY_LABEL[M.battery]}</em></div>
    <dl class="specs">${M.summary.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    <p class="note">${esc(M.layoutNote)}</p>
    ${modelPhotos(M).length ? `<div class="photo-strip">${modelPhotos(M).map((ph, i) => `<button class="ps-thumb" data-photo="${i}" aria-label="Xem ảnh ${i + 1}"><img src="${photoUrl(ph)}" alt="" loading="lazy"></button>`).join('')}</div><p class="tiny muted">Ảnh xe thật: ${modelPhotos(M).map((ph) => credit(ph)).join(' — ')}</p>` : ''}
    ${M.officialUrl ? `<p><a class="btn" href="${esc(M.officialUrl)}" target="_blank" rel="noopener">Xem ảnh & thông số trên trang ${esc(M.brand)} ↗</a></p>` : ''}
    ${M.sources?.length ? `<p class="tiny muted">Nguồn: ${M.sources.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`).join(' · ')}</p>` : ''}
    <p class="muted tiny">Thông số tham khảo từ công bố của hãng và báo chí; mô hình 3D, vị trí linh kiện và đường dây là mô phỏng đơn giản hoá để học tập, không phải tài liệu sửa chữa chính hãng.</p>`;
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
  if (challenge) { challenge = null; renderChallengeHud(); }
  if (m === 'assemble' && [...parts.values()].every((p) => p.installed)) explodeAll();
  selected = null;
  guide.hide();
  updateHintBar();
  renderInfo();
  renderPartsList();
}
function updateHintBar() {
  $('#hintMouse').textContent = mode === 'assemble' || mode === 'challenge'
    ? 'Kéo bộ phận vào bóng xanh để lắp · Kéo nền để xoay · Cuộn để phóng to'
    : 'Kéo bộ phận ra để tháo · Kéo nền để xoay · Cuộn để phóng to · Chuột phải để dịch';
}

function setOpt(k, v) {
  opts[k] = v;
  const box = document.querySelector(`[data-opt="${k}"]`);
  if (box) box.checked = v;
  if (k === 'xray') applyXray();
  if (k === 'sound') store.set('ev.sound', v);
  if (k === 'photo') { store.set('ev.photo', v); renderRealPhoto(); }
  $('#legend').hidden = !opts.wires;
}

// ---- Thử thách ----
function fmtTime(s) { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
function startChallenge() {
  sim = createSimState();
  renderSim();
  for (const p of parts.values()) { p.installed = false; p.anim = null; p.rest.copy(p.explode); p.group.position.copy(p.explode); }
  const ids = [...parts.keys()];
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  challenge = { start: performance.now(), mistakes: 0, hints: 0, order: ids, done: false };
  history = [];
  setOpt('hideRemoved', false);
  selected = null;
  guide.hide();
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
  setTimeout(() => $('#doneDialog').showModal(), 1200);
  renderInfo();
}
$('#doneAgain').addEventListener('click', () => { $('#doneDialog').close(); startChallenge(); });
$('#doneElectric').addEventListener('click', () => { $('#doneDialog').close(); setMode('electric'); });

// ---- Thanh công cụ ----
$('#modeTabs').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) { ensureAudio(); setMode(b.dataset.mode); } });
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { const v = VIEWS[b.dataset.view](); flyCamera(v.pos, v.target); }));
document.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('change', () => setOpt(b.dataset.opt, b.checked)));
$('#btnHint').addEventListener('click', () => { ensureAudio(); hintNext(); });
$('#btnUndo').addEventListener('click', undo);
$('#btnExplode').addEventListener('click', explodeAll);
$('#btnAssemble').addEventListener('click', assembleAll);
window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (MODELS[id] && MODELS[id] !== M) loadModel(id); });

let photoIdx = 0;
function renderRealPhoto() {
  const fig = $('#realPhoto');
  const list = modelPhotos(M);
  $('[data-opt="photo"]').closest('label').hidden = !list.length;
  fig.hidden = !opts.photo || !list.length;
  if (fig.hidden) return;
  photoIdx = ((photoIdx % list.length) + list.length) % list.length;
  const ph = list[photoIdx];
  $('#rpImg').src = photoUrl(ph);
  $('#rpImg').alt = `Ảnh thật ${M.brand} ${M.name}`;
  $('#rpCap').innerHTML = `<b>${esc(M.brand)} ${esc(M.name)} – xe thật</b>${ph.caption ? ` · ${esc(ph.caption)}` : ''}<br>${credit(ph)}`;
  $('#rpNav').hidden = list.length < 2;
  $('#rpCount').textContent = `${photoIdx + 1}/${list.length}`;
}
$('#rpPrev').addEventListener('click', () => { photoIdx--; renderRealPhoto(); });
$('#rpNext').addEventListener('click', () => { photoIdx++; renderRealPhoto(); });
$('#rpClose').addEventListener('click', () => setOpt('photo', false));
$('#aboutModel').addEventListener('click', (e) => {
  const b = e.target.closest('[data-photo]');
  if (!b) return;
  photoIdx = +b.dataset.photo;
  setOpt('photo', true);
});

function renderAll() {
  renderRealPhoto();
  renderModelButton();
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
    if (!p.anim || drag?.p === p) continue;
    p.anim.t += dt / p.anim.dur;
    if (p.anim.t < 0) continue;
    const t = Math.min(1, p.anim.t);
    const e = ease(t);
    p.group.position.lerpVectors(p.anim.from, p.anim.to, e);
    if (p.anim.arc) p.group.position.y += Math.sin(Math.PI * e) * 0.12;
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
  updateFx(now);
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

$('[data-opt="sound"]').checked = opts.sound;
$('[data-opt="photo"]').checked = opts.photo;
fetch('assets/photos/photos.json')
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => { if (j) { PHOTOS = { models: j.models || {}, parts: j.parts || {} }; photoIdx = 0; renderRealPhoto(); renderInfo(); renderAbout(); } })
  .catch(() => { /* chưa có ảnh: trang vẫn chạy với hình bóng */ });
const startId = [location.hash.slice(1), store.get('ev.model', 'evo200')].find((x) => MODELS[x]) || LINEUP[0].id;
loadModel(startId);
setMode('disassemble');
resize();
requestAnimationFrame(frame);
window.__ev = {
  screenPos(id) {
    const p = parts.get(id); const r = canvas.getBoundingClientRect();
    // tìm một điểm trên bộ phận mà tia chuột thật sự trúng (không bị bộ phận khác che)
    let a = null, b = null;
    for (const m of p.meshes) {
      m.geometry.computeBoundingSphere();
      const w = m.localToWorld(m.geometry.boundingSphere.center.clone());
      const s = toScreen(w);
      if (pick({ clientX: s.x + r.left, clientY: s.y + r.top })?.part === id) { a = s; b = toScreen(w.clone().sub(p.group.position)); break; }
    }
    if (!a) return null;
    return { from: { x: a.x + r.left, y: a.y + r.top }, to: { x: b.x + r.left, y: b.y + r.top } };
  },
  parts, idle: () => [...parts.values()].every((q) => !q.anim), explodeAll, assembleAll, setMode, select, sim: () => sim, toggle, loadModel, camera, canvas, models: () => Object.keys(MODELS), state: () => ({ drag, mode }) };
