// Các hàm dựng hình khối cơ bản dùng chung cho mọi mẫu xe.
// Hệ toạ độ: X = hướng đầu xe, Y = hướng lên, Z = bên phải người lái. Đơn vị: mét.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export function mat(color, { metal = 0.15, rough = 0.55, emissive = 0x000000, ei = 1, opacity = 1, side } = {}) {
  const m = new THREE.MeshStandardMaterial({
    color, metalness: metal, roughness: rough, emissive, emissiveIntensity: ei,
  });
  if (opacity < 1) { m.transparent = true; m.opacity = opacity; }
  if (side) m.side = side;
  return m;
}

// Bảng vật liệu hay dùng
export const MAT = {
  steel: () => mat(0x3b3f45, { metal: 0.6, rough: 0.4 }),
  chrome: () => mat(0xd6dbe0, { metal: 0.95, rough: 0.15 }),
  alu: () => mat(0xaab2bb, { metal: 0.8, rough: 0.3 }),
  rubber: () => mat(0x1b1b1d, { metal: 0, rough: 0.9 }),
  black: () => mat(0x202226, { metal: 0.2, rough: 0.5 }),
  plastic: (c) => mat(c, { metal: 0.05, rough: 0.6 }),
  paint: (c) => mat(c, { metal: 0.35, rough: 0.28 }),
  pcb: () => mat(0x1f7a3a, { metal: 0.1, rough: 0.6 }),
  copper: () => mat(0xc77b3a, { metal: 0.9, rough: 0.3 }),
  glass: (c = 0xf5f7ff) => mat(c, { metal: 0.1, rough: 0.05, opacity: 0.85 }),
  lamp: (c) => mat(c, { metal: 0, rough: 0.2, emissive: 0x000000 }),
};

const _up = new THREE.Vector3(0, 1, 0);

export function mesh(geo, material, pos = [0, 0, 0], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function box(w, h, d, material, pos, rot, r = 0.008) {
  const geo = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
  return mesh(geo, material, pos, rot);
}

// Trụ có trục theo hướng axis ('x' | 'y' | 'z')
export function cyl(r, len, material, pos, axis = 'y', seg = 28, rTop) {
  const geo = new THREE.CylinderGeometry(rTop ?? r, r, len, seg);
  if (axis === 'x') geo.rotateZ(Math.PI / 2);
  if (axis === 'z') geo.rotateX(Math.PI / 2);
  return mesh(geo, material, pos);
}

// Ống thẳng nối hai điểm a -> b
export function rod(a, b, r, material, seg = 14) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const geo = new THREE.CylinderGeometry(r, r, len, seg);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, vb.clone().sub(va).normalize());
  m.castShadow = true;
  return m;
}

// Ống cong đi qua các điểm
export function pipe(points, r, material, { closed = false, seg = 64, radial = 10 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed, 'catmullrom', 0.2);
  const geo = new THREE.TubeGeometry(curve, seg, r, radial, closed);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

// Đùn một biên dạng 2D (mặt bên XY) theo chiều Z, căn giữa tại zc
export function profile(points, width, material, { zc = 0, bevel = 0.02, curveSegs = 8 } = {}) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const depth = Math.max(0.001, width - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: curveSegs,
  });
  geo.translate(0, 0, zc - depth / 2);
  return mesh(geo, material);
}

// Biên dạng có cạnh cong: các điểm là [x,y] hoặc ['q', cx, cy, x, y] (bezier bậc 2)
export function smoothProfile(cmds, width, material, opts = {}) {
  const shape = new THREE.Shape();
  cmds.forEach((c, i) => {
    if (c[0] === 'q') shape.quadraticCurveTo(c[1], c[2], c[3], c[4]);
    else if (i === 0) shape.moveTo(c[0], c[1]);
    else shape.lineTo(c[0], c[1]);
  });
  shape.closePath();
  const bevel = opts.bevel ?? 0.02;
  const depth = Math.max(0.001, width - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 16,
  });
  geo.translate(0, 0, (opts.zc ?? 0) - depth / 2);
  return mesh(geo, material);
}

// Lò xo xoắn từ a đến b
export function spring(a, b, r, wire, turns, material) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va); const len = dir.length(); dir.normalize();
  const pts = [];
  const n = turns * 16;
  for (let i = 0; i <= n; i++) {
    const t = i / n, ang = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(ang) * r, t * len, Math.sin(ang) * r));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, wire, 6, false);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(va);
  m.quaternion.setFromUnitVectors(_up, dir);
  m.castShadow = true;
  return m;
}

// Bánh xe (lốp + vành + nan đúc). Trả về group đặt tại tâm trục, có thể quay quanh trục Z.
export function wheel({ r = 0.27, rimR = 0.17, width = 0.11, spokes = 5, rimColor = 0x2a2d33, hubR = 0.04, hubW } = {}) {
  const g = new THREE.Group();
  const tireTube = (r - rimR) / 2;
  const tireGeo = new THREE.TorusGeometry(rimR + tireTube, tireTube, 18, 64);
  const tire = mesh(tireGeo, MAT.rubber());
  tire.scale.set(1, 1, (width / 2) / tireTube);
  g.add(tire);
  // gai lốp
  const treadMat = mat(0x111113, { rough: 1 });
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    const t = box(0.007, 0.012, width * 0.55, treadMat, [Math.cos(a) * (r - 0.005), Math.sin(a) * (r - 0.005), 0], [0, 0, a], 0);
    g.add(t);
  }
  const rimMat = mat(rimColor, { metal: 0.7, rough: 0.3 });
  const rim = mesh(new THREE.TorusGeometry(rimR, 0.012, 10, 64), rimMat);
  rim.scale.z = (width * 0.42) / 0.012;
  g.add(rim);
  g.add(cyl(hubR, hubW ?? width * 0.9, rimMat, [0, 0, 0], 'z'));
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    const len = rimR - hubR;
    const s = box(len, 0.03, 0.025, rimMat, [Math.cos(a) * (hubR + len / 2), Math.sin(a) * (hubR + len / 2), 0], [0, 0, a], 0.006);
    g.add(s);
  }
  return g;
}

// Đĩa phanh trong mặt phẳng XY, đặt tại (0,0,z)
export function rotor(r, z, holes = 18) {
  const g = new THREE.Group();
  const ringGeo = new THREE.RingGeometry(r * 0.62, r, 48);
  const disc = mesh(ringGeo, mat(0xc0c4c8, { metal: 0.9, rough: 0.25, side: THREE.DoubleSide }));
  disc.position.z = z;
  g.add(disc);
  const holeMat = mat(0x222222);
  for (let i = 0; i < holes; i++) {
    const a = (i / holes) * Math.PI * 2;
    const h = cyl(0.006, 0.006, holeMat, [Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, z], 'z', 8);
    g.add(h);
  }
  g.add(cyl(r * 0.62, 0.005, mat(0x2a2a2a, { metal: 0.5 }), [0, 0, z], 'z', 6));
  return g;
}

// Nhông xích (bánh răng) trong mặt phẳng XY
export function sprocket(r, z, teeth, material) {
  const g = new THREE.Group();
  g.add(cyl(r * 0.92, 0.008, material, [0, 0, z], 'z', 40));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    g.add(box(0.012, 0.014, 0.008, material, [Math.cos(a) * r, Math.sin(a) * r, z], [0, 0, a], 0));
  }
  return g;
}

// Vòng xích khép kín quanh hai nhông (cùng mặt phẳng z)
export function chainLoop(c1, r1, c2, r2, z, material, tube = 0.006) {
  // c1: nhông trước (phải), c2: nhông sau (trái) - c1.x > c2.x
  const pts = [];
  const n = 18;
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; pts.push([c1[0] + Math.cos(a) * r1, c1[1] + Math.sin(a) * r1, z]); }
  for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (i / n) * Math.PI; pts.push([c2[0] + Math.cos(a) * r2, c2[1] + Math.sin(a) * r2, z]); }
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), true, 'centripetal');
  const geo = new THREE.TubeGeometry(curve, 160, tube, 6, true);
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  return m;
}

// Tạo đèn: thân + mặt kính phát sáng (mesh mặt kính được đánh dấu là "lamp")
export function markLamp(m, kind, color) {
  m.userData.lamp = kind;
  m.userData.lampColor = color;
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  children.flat().forEach((c) => c && g.add(c));
  return g;
}
