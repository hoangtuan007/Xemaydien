// Các bộ phận điện / điều khiển dùng chung cho cả hai mẫu xe.
import * as THREE from 'three';
import { MAT, mat, box, cyl, rod, group, markLamp, mesh } from '../shapes.js';

export const CATS = {
  khung: { name: 'Khung & giảm xóc', color: '#8d99ae' },
  banh: { name: 'Bánh xe & phanh', color: '#adb5bd' },
  dongco: { name: 'Động cơ & truyền động', color: '#f4a261' },
  dien: { name: 'Hệ thống điện', color: '#ffb703' },
  dieukhien: { name: 'Điều khiển & hiển thị', color: '#4cc9f0' },
  vo: { name: 'Thân vỏ & tiện ích', color: '#e76f51' },
};

// Khối pin: hộp vỏ nhôm, các cell bên trong (nhìn qua khe), mạch BMS gắn cạnh
export function batteryPack({ pos, size, color = 0x23324a, label = 0xff7a1a, cellRows = 4, bmsSide = 1 }) {
  const [w, h, d] = size;
  const g = new THREE.Group();
  g.add(box(w, h, d, mat(color, { metal: 0.55, rough: 0.35 }), [0, 0, 0], [0, 0, 0], 0.015));
  // dải nhãn điện áp cao
  g.add(box(w * 0.98, h * 0.12, d * 1.01, mat(label, { metal: 0.2, rough: 0.5 }), [0, h * 0.3, 0], [0, 0, 0], 0.004));
  // gân tản nhiệt
  for (let i = 0; i < 6; i++) {
    g.add(box(0.008, h * 0.6, d * 1.02, mat(0x3a4a66, { metal: 0.6 }), [-w / 2 + (i + 0.5) * (w / 6), -h * 0.12, 0], [0, 0, 0], 0.002));
  }
  // mạch BMS
  const bz = bmsSide * (d / 2 + 0.006);
  g.add(box(w * 0.5, h * 0.42, 0.008, MAT.pcb(), [w * 0.15, -h * 0.1, bz], [0, 0, 0], 0.002));
  for (let i = 0; i < 6; i++) {
    g.add(box(0.018, 0.012, 0.006, MAT.black(), [w * 0.15 - w * 0.2 + i * w * 0.08, -h * 0.05, bz + bmsSide * 0.006], [0, 0, 0], 0.001));
  }
  // cọc +/- và giắc
  g.add(cyl(0.012, 0.025, mat(0xd32f2f), [-w / 2 + 0.04, h / 2 + 0.012, d * 0.25], 'y'));
  g.add(cyl(0.012, 0.025, mat(0x212121), [-w / 2 + 0.04, h / 2 + 0.012, -d * 0.25], 'y'));
  g.add(box(0.05, 0.03, 0.04, mat(0xff9800), [-w / 2 + 0.03, h / 2 + 0.015, 0], [0, 0, 0], 0.004));
  g.position.set(...pos);
  return wrap(g);
}

// Bộ điều khiển động cơ (controller): hộp nhôm có cánh tản nhiệt
export function controllerBox({ pos, size = [0.18, 0.07, 0.13], rot = [0, 0, 0] }) {
  const [w, h, d] = size;
  const g = new THREE.Group();
  const alu = MAT.alu();
  g.add(box(w, h * 0.55, d, alu, [0, -h * 0.2, 0], [0, 0, 0], 0.006));
  for (let i = 0; i < 9; i++) g.add(box(w * 0.95, h * 0.45, 0.004, alu, [0, h * 0.28, -d / 2 + (i + 0.5) * (d / 9)], [0, 0, 0], 0));
  // tai bắt vít
  [-1, 1].forEach((s) => g.add(box(0.03, 0.006, d * 0.6, alu, [s * (w / 2 + 0.012), -h * 0.45, 0], [0, 0, 0], 0.002)));
  // cổng dây pha + tín hiệu
  ['#f5c400', '#2e9d4f', '#1e6fd9'].forEach((c, i) => g.add(cyl(0.008, 0.03, mat(new THREE.Color(c).getHex()), [-w / 2 - 0.01, -h * 0.15, -0.03 + i * 0.03], 'x', 10)));
  g.add(box(0.025, 0.025, 0.05, MAT.black(), [w / 2 + 0.01, -h * 0.15, 0], [0, 0, 0], 0.004));
  g.position.set(...pos);
  g.rotation.set(...rot);
  return wrap(g);
}

// Bộ chuyển đổi DC-DC (60/72V -> 12V)
export function dcdcBox({ pos }) {
  const g = new THREE.Group();
  g.add(box(0.09, 0.04, 0.07, mat(0x4a4f57, { metal: 0.6, rough: 0.35 }), [0, 0, 0], [0, 0, 0], 0.006));
  for (let i = 0; i < 5; i++) g.add(box(0.085, 0.01, 0.004, MAT.alu(), [0, 0.024, -0.028 + i * 0.014], [0, 0, 0], 0));
  g.add(box(0.03, 0.002, 0.03, mat(0xffd166), [0.02, 0.031, 0.0], [0, 0, 0], 0));
  g.position.set(...pos);
  return wrap(g);
}

// Rơ-le nguồn chính (contactor) + hộp cầu chì
export function relayFuse({ pos }) {
  const g = new THREE.Group();
  g.add(cyl(0.025, 0.06, MAT.black(), [0, 0, 0], 'y'));
  g.add(cyl(0.006, 0.02, MAT.copper(), [0.012, 0.038, 0], 'y', 8));
  g.add(cyl(0.006, 0.02, MAT.copper(), [-0.012, 0.038, 0], 'y', 8));
  g.add(box(0.07, 0.03, 0.04, mat(0x2b2d42), [0.06, -0.015, 0], [0, 0, 0], 0.004));
  ['#e63946', '#ffb703', '#2a9d8f'].forEach((c, i) => g.add(box(0.012, 0.012, 0.018, mat(new THREE.Color(c).getHex()), [0.04 + i * 0.02, 0.006, 0], [0, 0, 0], 0.002)));
  g.position.set(...pos);
  return wrap(g);
}

// Bộ khoá thông minh / ổ khoá điện
export function keyModule({ pos, rot = [0, 0, 0] }) {
  const g = new THREE.Group();
  g.add(box(0.06, 0.035, 0.05, MAT.black(), [0, 0, 0], [0, 0, 0], 0.008));
  g.add(cyl(0.018, 0.012, MAT.chrome(), [0.032, 0, 0], 'x', 24));
  g.add(markLamp(cyl(0.006, 0.004, MAT.lamp(0x9be564), [0.04, 0.012, 0.012], 'x', 12), 'key', 0x7cff6b));
  g.position.set(...pos);
  g.rotation.set(...rot);
  return wrap(g);
}

export function horn({ pos }) {
  const g = new THREE.Group();
  g.add(cyl(0.035, 0.03, mat(0x222222, { metal: 0.4 }), [0, 0, 0], 'x', 24));
  g.add(cyl(0.02, 0.012, MAT.chrome(), [0.02, 0, 0], 'x', 24));
  g.add(box(0.01, 0.05, 0.015, MAT.steel(), [-0.02, 0.03, 0], [0, 0, 0], 0.002));
  g.position.set(...pos);
  return wrap(g);
}

export function chargePort({ pos, normal = 1 }) {
  const g = new THREE.Group();
  g.add(cyl(0.03, 0.02, MAT.black(), [0, 0, 0], 'z', 24));
  g.add(cyl(0.022, 0.008, mat(0xff7a1a), [0, 0, normal * 0.013], 'z', 24));
  for (let i = 0; i < 3; i++) g.add(cyl(0.004, 0.006, MAT.copper(), [Math.cos(i * 2.1) * 0.01, Math.sin(i * 2.1) * 0.01, normal * 0.018], 'z', 8));
  g.position.set(...pos);
  return wrap(g);
}

// Tay ga (cảm biến Hall) bên phải ghi đông
export function throttleGrip({ pos }) {
  const g = new THREE.Group();
  g.add(cyl(0.017, 0.12, MAT.rubber(), [0, 0, 0.06], 'z', 20));
  for (let i = 0; i < 6; i++) g.add(cyl(0.0185, 0.006, mat(0x333333), [0, 0, 0.015 + i * 0.018], 'z', 20));
  g.add(box(0.04, 0.04, 0.03, MAT.black(), [0, 0, -0.005], [0, 0, 0], 0.006));
  g.position.set(...pos);
  return wrap(g);
}

// Chân chống nghiêng có công tắc an toàn
export function sideStand({ pivot, foot }) {
  const g = new THREE.Group();
  g.add(rod(pivot, foot, 0.012, MAT.steel()));
  g.add(box(0.06, 0.008, 0.04, MAT.steel(), [foot[0], foot[1] + 0.004, foot[2]], [0, 0, 0], 0.002));
  g.add(box(0.025, 0.02, 0.02, mat(0x1d3557), [pivot[0] + 0.015, pivot[1] + 0.01, pivot[2]], [0, 0, 0], 0.003));
  return wrap(g);
}

export function mirrors({ base, z, h = 0.22, round = false }) {
  const g = new THREE.Group();
  [-1, 1].forEach((s) => {
    const b = [base[0], base[1], s * z];
    const t = [base[0] - 0.02, base[1] + h, s * (z + 0.06)];
    g.add(rod(b, t, 0.006, MAT.black()));
    if (round) {
      g.add(cyl(0.05, 0.02, MAT.black(), [t[0], t[1] + 0.02, t[2]], 'x', 24));
      g.add(cyl(0.045, 0.004, mat(0xcfe8ff, { metal: 1, rough: 0.05 }), [t[0] - 0.011, t[1] + 0.02, t[2]], 'x', 24));
    } else {
      const m = box(0.03, 0.06, 0.12, MAT.black(), [t[0], t[1] + 0.02, t[2]], [0, 0, 0], 0.02);
      g.add(m);
      g.add(box(0.004, 0.05, 0.105, mat(0xcfe8ff, { metal: 1, rough: 0.05 }), [t[0] - 0.016, t[1] + 0.02, t[2]], [0, 0, 0], 0.002));
    }
  });
  return wrap(g);
}

// Khung bọc ngoài: mỗi bộ phận là một group "gốc" có vị trí 0 để dễ di chuyển khi tháo
export function wrap(inner) {
  const g = new THREE.Group();
  g.add(inner);
  return g;
}

export { mesh, box, cyl, rod, group, MAT, mat };
