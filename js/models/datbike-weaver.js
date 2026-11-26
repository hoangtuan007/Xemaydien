// Mẫu 2: Xe số điện dáng côn tay, động cơ đặt giữa + truyền động xích — lấy cảm hứng từ Dat Bike Weaver++.
// Hình học là mô phỏng đơn giản hoá cho mục đích học tập, không phải bản vẽ kỹ thuật của hãng.
import * as THREE from 'three';
import {
  MAT, mat, box, cyl, rod, pipe, profile, smoothProfile, spring, wheel, rotor, sprocket, chainLoop, markLamp,
} from '../shapes.js';
import {
  wrap, batteryPack, controllerBox, dcdcBox, relayFuse, keyModule, horn, chargePort, throttleGrip, sideStand, mirrors,
} from './common.js';

const TANK = 0x5f7355; // xanh rêu
const CREAM = 0xe9e1cf;
const FW = [0.68, 0.31, 0];
const RW = [-0.68, 0.31, 0];
const MOTOR = [-0.06, 0.4, 0];
const PIVOT = [-0.25, 0.42];
const steer = (t) => [0.68 - 0.34 * t, 0.31 + 0.94 * t];
const BAR = [0.37, 1.14];

function frame() {
  const g = new THREE.Group();
  const s = mat(0x2b2b2e, { metal: 0.55, rough: 0.4 });
  const h0 = steer(0.6), h1 = steer(0.79);
  g.add(rod([h0[0], h0[1], 0], [h1[0], h1[1], 0], 0.034, s));
  [-1, 1].forEach((k) => {
    const z = 0.1 * k;
    g.add(pipe([[h1[0] - 0.01, h1[1] - 0.06, z * 0.3], [0.2, 0.96, z], [-0.27, 0.9, z], [-0.6, 0.93, z * 0.9], [-0.88, 0.95, z * 0.8]], 0.016, s, { seg: 80 }));
    g.add(pipe([[h0[0], h0[1], z * 0.3], [0.33, 0.62, z], [0.23, 0.32, z], [-0.15, 0.25, z], [-0.28, 0.36, z], [-0.29, 0.6, z], [-0.27, 0.9, z]], 0.018, s, { seg: 90 }));
    g.add(rod([-0.29, 0.58, z], [-0.75, 0.93, z * 0.85], 0.012, s));
  });
  [[0.23, 0.32], [-0.15, 0.25], [-0.29, 0.6], [-0.27, 0.9], [-0.7, 0.93]].forEach(([x, y]) => g.add(rod([x, y, -0.1], [x, y, 0.1], 0.011, s)));
  // giá bắt động cơ
  g.add(box(0.12, 0.03, 0.22, s, [MOTOR[0], 0.29, 0], [0, 0, 0], 0.006));
  return wrap(g);
}

function frontFork() {
  const g = new THREE.Group();
  const gold = mat(0xc9a227, { metal: 0.8, rough: 0.3 });
  [-1, 1].forEach((k) => {
    const z = 0.1 * k;
    const mid = steer(0.42), crown = steer(0.72), top = steer(0.8);
    g.add(rod([FW[0], FW[1] - 0.02, z], [...mid, z], 0.026, mat(0x1d1d1f, { metal: 0.4 })));
    g.add(rod([...mid, z], [...top, z], 0.021, gold));
    void crown;
  });
  const c = steer(0.72), t = steer(0.8);
  g.add(box(0.07, 0.03, 0.26, MAT.alu(), [c[0], c[1], 0], [0, 0, 0.35], 0.01));
  g.add(box(0.07, 0.03, 0.26, MAT.alu(), [t[0], t[1], 0], [0, 0, 0.35], 0.01));
  g.add(cyl(0.012, 0.24, MAT.steel(), [FW[0], FW[1], 0], 'z', 12));
  return wrap(g);
}

function frontWheel() {
  const g = new THREE.Group();
  const w = wheel({ r: 0.31, rimR: 0.22, width: 0.11, spokes: 6, rimColor: 0x1d1d1f });
  w.add(rotor(0.14, 0.072));
  w.position.set(...FW);
  w.userData.spin = 'front';
  g.add(w);
  return g;
}

function frontCaliper() {
  const g = new THREE.Group();
  const a = (125 * Math.PI) / 180;
  const p = [FW[0] + Math.cos(a) * 0.13, FW[1] + Math.sin(a) * 0.13, 0.074];
  g.add(box(0.09, 0.045, 0.04, mat(0xc1121f, { metal: 0.4, rough: 0.4 }), p, [0, 0, a + Math.PI / 2], 0.008));
  g.add(pipe([[p[0], p[1] + 0.02, 0.1], [...steer(0.5), 0.13], [...steer(0.85), 0.16], [BAR[0] + 0.03, BAR[1], 0.22]], 0.005, MAT.black()));
  return wrap(g);
}

function frontFender() {
  const g = new THREE.Group();
  const geo = new THREE.TorusGeometry(0.35, 0.025, 8, 40, Math.PI * 0.5);
  const m = new THREE.Mesh(geo, MAT.paint(0x1d1d1f));
  m.scale.z = 2.4;
  m.rotation.z = Math.PI * 0.28;
  m.position.set(...FW);
  m.castShadow = true;
  g.add(m);
  return wrap(g);
}

function handlebar() {
  const g = new THREE.Group();
  const s = MAT.black();
  const t = steer(0.8);
  g.add(rod([t[0], t[1], 0], [BAR[0], BAR[1] - 0.02, 0], 0.016, MAT.alu()));
  g.add(pipe([[BAR[0] - 0.03, BAR[1] + 0.02, -0.32], [BAR[0], BAR[1], -0.18], [BAR[0] + 0.01, BAR[1] - 0.01, 0], [BAR[0], BAR[1], 0.18], [BAR[0] - 0.03, BAR[1] + 0.02, 0.28]], 0.012, s));
  g.add(cyl(0.018, 0.12, MAT.rubber(), [BAR[0] - 0.035, BAR[1] + 0.022, -0.36], 'z', 18));
  [-1, 1].forEach((k) => {
    g.add(rod([BAR[0] + 0.02, BAR[1] + 0.01, k * 0.2], [BAR[0] + 0.06, BAR[1], k * 0.38], 0.007, MAT.alu()));
    g.add(box(0.035, 0.035, 0.03, MAT.black(), [BAR[0] + 0.005, BAR[1] + 0.01, k * 0.2], [0, 0, 0], 0.006));
  });
  g.add(box(0.05, 0.05, 0.04, MAT.black(), [BAR[0] - 0.01, BAR[1] + 0.01, -0.25], [0, 0, 0], 0.01));
  return wrap(g);
}

function dashboard() {
  const g = new THREE.Group();
  const p = [0.41, 1.2, 0];
  const body = cyl(0.065, 0.04, MAT.black(), p, 'y', 32);
  body.rotation.z = 0.7;
  g.add(body);
  const face = markLamp(cyl(0.056, 0.005, MAT.lamp(0x0d1b2a), [p[0] - 0.015, p[1] + 0.017, 0], 'y', 32), 'dash', 0x80ffdb);
  face.rotation.z = 0.7;
  g.add(face);
  return wrap(g);
}

function headlight() {
  const g = new THREE.Group();
  const c = [0.56, 1.03, 0];
  g.add(cyl(0.095, 0.1, MAT.black(), c, 'x', 36));
  g.add(cyl(0.1, 0.015, MAT.chrome(), [c[0] + 0.05, c[1], 0], 'x', 36));
  g.add(markLamp(cyl(0.085, 0.01, MAT.lamp(0xe8f1ff), [c[0] + 0.058, c[1], 0], 'x', 36), 'head', 0xffffff));
  // vòng LED định vị
  const ring = markLamp(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 8, 40), MAT.lamp(0xdfefff)), 'head', 0xbfe3ff);
  ring.rotation.y = Math.PI / 2; ring.position.set(c[0] + 0.065, c[1], 0);
  g.add(ring);
  [-1, 1].forEach((k) => g.add(rod([c[0] - 0.03, c[1], k * 0.07], [...steer(0.77), k * 0.1], 0.007, MAT.steel())));
  return wrap(g);
}

function tankCover() {
  const g = new THREE.Group();
  const pts = [[0.4, 0.86], [0.39, 0.97], ['q', 0.32, 1.07, 0.12, 1.07], [-0.12, 1.03], ['q', -0.26, 1.0, -0.3, 0.92], [-0.29, 0.7], [-0.2, 0.5], [0.16, 0.45], ['q', 0.3, 0.5, 0.36, 0.64]];
  g.add(smoothProfile(pts, 0.32, MAT.paint(TANK), { bevel: 0.035 }));
  // tấm ốp hông màu kem + logo dạng vạch
  [-1, 1].forEach((k) => {
    g.add(smoothProfile([[0.2, 0.66], ['q', 0.24, 0.73, 0.2, 0.8], [-0.1, 0.8], ['q', -0.14, 0.73, -0.1, 0.66]], 0.008, MAT.plastic(CREAM), { zc: k * 0.172, bevel: 0.003 }));
    g.add(box(0.2, 0.01, 0.004, mat(0x1d1d1f), [0.05, 0.73, k * 0.178], [0, 0, 0], 0.002));
  });
  return wrap(g);
}

function sideCovers() {
  const g = new THREE.Group();
  [-1, 1].forEach((k) => g.add(profile([[-0.3, 0.95], [-0.74, 0.96], [-0.68, 0.8], [-0.45, 0.6], [-0.31, 0.62]], 0.018, MAT.plastic(0x1d1d1f), { zc: k * 0.125, bevel: 0.006 })));
  return wrap(g);
}

function seat() {
  const g = new THREE.Group();
  const pts = [[-0.22, 0.99], ['q', -0.24, 1.07, -0.34, 1.07], [-0.8, 1.05], ['q', -0.9, 1.04, -0.89, 0.99], [-0.24, 0.97]];
  g.add(smoothProfile(pts, 0.28, mat(0x5a3b28, { rough: 0.85 }), { bevel: 0.03 }));
  for (let i = 0; i < 6; i++) g.add(box(0.006, 0.004, 0.25, mat(0x3e2819), [-0.35 - i * 0.08, 1.072, 0], [0, 0, 0], 0.001));
  return wrap(g);
}

function tail() {
  const g = new THREE.Group();
  g.add(smoothProfile([[-0.74, 0.97], [-0.92, 0.99], ['q', -1.0, 0.99, -1.0, 0.94], [-0.9, 0.9], [-0.75, 0.92]], 0.2, MAT.paint(0x1d1d1f), { bevel: 0.015 }));
  // chắn bùn sau + giá biển số
  g.add(pipe([[-0.95, 0.9, 0], [-1.02, 0.8, 0], [-1.05, 0.68, 0]], 0.03, MAT.black(), { seg: 20 }));
  g.add(box(0.012, 0.12, 0.2, MAT.alu(), [-1.05, 0.66, 0], [0, 0, 0.2], 0.004));
  return wrap(g);
}

function taillight() {
  const g = new THREE.Group();
  g.add(box(0.03, 0.04, 0.14, MAT.black(), [-1.0, 0.94, 0], [0, 0, 0], 0.012));
  g.add(markLamp(box(0.008, 0.025, 0.12, MAT.lamp(0x5a0000), [-1.017, 0.94, 0], [0, 0, 0], 0.004), 'tail', 0xff2a2a));
  return wrap(g);
}

function swingarm() {
  const g = new THREE.Group();
  const s = MAT.alu();
  const ang = Math.atan2(PIVOT[1] - RW[1], PIVOT[0] - RW[0]);
  const len = Math.hypot(PIVOT[0] - RW[0], PIVOT[1] - RW[1]);
  [-1, 1].forEach((k) => g.add(box(len, 0.06, 0.028, s, [(PIVOT[0] + RW[0]) / 2, (PIVOT[1] + RW[1]) / 2, k * 0.135], [0, 0, ang], 0.01)));
  g.add(cyl(0.028, 0.3, s, [PIVOT[0], PIVOT[1], 0], 'z', 16));
  g.add(cyl(0.013, 0.3, MAT.steel(), [RW[0], RW[1], 0], 'z', 12));
  return wrap(g);
}

function rearWheel() {
  const g = new THREE.Group();
  const w = wheel({ r: 0.31, rimR: 0.22, width: 0.13, spokes: 6, rimColor: 0x1d1d1f });
  w.add(sprocket(0.11, 0.1, 42, mat(0x8d99ae, { metal: 0.85, rough: 0.3 })));
  w.add(rotor(0.11, -0.08));
  w.position.set(...RW);
  w.userData.spin = 'rear';
  g.add(w);
  return g;
}

function rearCaliper() {
  const g = new THREE.Group();
  const a = (300 * Math.PI) / 180;
  g.add(box(0.07, 0.04, 0.035, mat(0x343a40, { metal: 0.5 }), [RW[0] + Math.cos(a) * 0.1, RW[1] + Math.sin(a) * 0.1, -0.085], [0, 0, a + Math.PI / 2], 0.008));
  return wrap(g);
}

function motor() {
  const g = new THREE.Group();
  const rotorG = new THREE.Group();
  rotorG.position.set(...MOTOR);
  const shell = mat(0x1d1d1f, { metal: 0.6, rough: 0.35 });
  g.add(cyl(0.1, 0.16, shell, MOTOR, 'z', 40));
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    g.add(box(0.012, 0.014, 0.15, mat(0x34373d, { metal: 0.6 }), [MOTOR[0] + Math.cos(a) * 0.1, MOTOR[1] + Math.sin(a) * 0.1, 0], [0, 0, a], 0));
  }
  g.add(cyl(0.07, 0.164, mat(0xc9a227, { metal: 0.7, rough: 0.3 }), MOTOR, 'z', 32));
  // nhông trước gắn trên trục động cơ (quay cùng rotor)
  rotorG.add(sprocket(0.045, 0.1, 15, mat(0x8d99ae, { metal: 0.85 })));
  rotorG.add(cyl(0.012, 0.04, MAT.steel(), [0, 0, 0.09], 'z', 12));
  rotorG.userData.spin = 'motor';
  g.add(rotorG);
  // giá treo
  g.add(box(0.1, 0.06, 0.18, shell, [MOTOR[0], MOTOR[1] - 0.09, 0], [0, 0, 0], 0.01));
  return wrap(g);
}

function chain() {
  const g = new THREE.Group();
  g.add(chainLoop([MOTOR[0], MOTOR[1]], 0.047, [RW[0], RW[1]], 0.112, 0.1, mat(0x9a9a9a, { metal: 0.9, rough: 0.35 })));
  return wrap(g);
}

function rearShocks() {
  const g = new THREE.Group();
  [-1, 1].forEach((k) => {
    const z = 0.155 * k;
    const a = [-0.6, 0.35, z], b = [-0.42, 0.9, z];
    g.add(rod(a, b, 0.013, MAT.chrome()));
    g.add(spring([-0.588, 0.4, z], [-0.442, 0.83, z], 0.026, 0.005, 11, mat(0xc9a227, { metal: 0.7 })));
    g.add(cyl(0.022, 0.03, MAT.black(), a, 'z', 12));
    g.add(cyl(0.022, 0.03, MAT.black(), b, 'z', 12));
  });
  return wrap(g);
}

function harness() {
  const g = new THREE.Group();
  g.add(pipe([[0.4, 1.02, 0.05], [0.25, 0.97, 0.11], [-0.2, 0.93, 0.105], [-0.4, 0.85, 0.06], [-0.6, 0.86, 0.03]], 0.011, mat(0x111111, { rough: 0.9 }), { seg: 80 }));
  return wrap(g);
}

const bar = (dz = 0) => [BAR[0] - 0.01, BAR[1] + 0.01, dz];

export default {
  id: 'weaver',
  brand: 'Dat Bike',
  name: 'Weaver++',
  kind: 'Xe số điện dáng cổ điển · động cơ đặt giữa + xích',
  accent: '#5f7355',
  style: 'naked',
  officialUrl: 'https://dat.bike/en/pages/weaver-plus-plus',
  drive: 'mid-chain',
  battery: 'frame',
  driveTrain: ['xich', 'banh-sau'],
  rearR: 0.31,
  ratio: 2.8,
  sources: [['Dat Bike – Weaver++', 'https://dat.bike/en/pages/weaver-plus-plus'], ['Báo Lâm Đồng – Đánh giá Weaver++', 'https://baolamdong.vn/danh-gia-dat-bike-weaver-xe-dien-viet-voi-hieu-nang-an-tuong-401816.html']],
  vmax: 90,
  pmax: 7000,
  voltage: 72,
  socDrain: 0.25,
  summary: [
    ['Động cơ', 'Đặt giữa (mid-drive), 3.000 W định danh / 7.000 W tối đa'],
    ['Truyền động', 'Xích – nhông trước trên trục động cơ, nhông sau trên bánh'],
    ['Pin', 'Lithium 72 V – 68 Ah, nằm trong "bình xăng" giả'],
    ['Tốc độ tối đa', '~90 km/h'],
    ['Quãng đường', 'Tới ~200 km/lần sạc (theo hãng)'],
    ['Sạc', 'Sạc nhanh: ~20 phút cho ~100 km tại trạm của hãng'],
  ],
  layoutNote: 'Động cơ đặt giữa khung, sát chốt càng sau: khối lượng dồn về trọng tâm, bánh sau nhẹ hơn nên giảm xóc làm việc tốt. Lực truyền qua nhông – xích giống xe côn tay, có thể đổi tỉ số truyền bằng cách thay nhông.',
  camera: { pos: [2.1, 1.4, 2.6], target: [0, 0.6, 0] },
  parts: [
    {
      id: 'khung', name: 'Khung xe', cat: 'khung', build: frame, explode: [0, 0, -1.2], after: [],
      desc: 'Khung thép dạng nôi kép bao quanh khối pin và động cơ – vừa chịu lực vừa bảo vệ pin.',
      specs: [['Vật liệu', 'Thép ống'], ['Kiểu', 'Nôi kép (double cradle)']],
      tips: ['Lắp đầu tiên, tháo sau cùng.'],
    },
    {
      id: 'bo-day', name: 'Bó dây điện (harness)', cat: 'dien', build: harness, explode: [0, 1.5, -0.6], after: ['khung'],
      desc: 'Ống gen chứa dây nối giữa pin, bộ điều khiển, đèn, đồng hồ và các công tắc.', specs: [['Giắc', 'Chống nước']],
      tips: ['Đi dây dọc thanh khung trên, tránh vùng xích và chốt càng.'],
    },
    {
      id: 'cang-truoc', name: 'Phuộc trước & chạc ba', cat: 'khung', build: frontFork, explode: [0.8, 0.3, 0], after: ['khung'],
      desc: 'Phuộc ống lồng thuỷ lực ty vàng, chạc ba nhôm kẹp hai ống phuộc vào cổ lái.', specs: [['Kiểu', 'Ống lồng thuỷ lực']],
      tips: ['Hai ống phuộc phải cao bằng nhau trong chạc ba, nếu lệch xe sẽ lái nặng.'],
    },
    {
      id: 'banh-truoc', name: 'Bánh trước 17" + đĩa phanh', cat: 'banh', build: frontWheel, explode: [1.3, 0, 0.5], after: ['cang-truoc'],
      desc: 'Vành đúc 17 inch, lốp không săm, đĩa phanh lớn bên phải.', specs: [['Vành', '17 inch đúc']], tips: ['Lắp ống cách (bạc đệm) hai bên moay-ơ đúng thứ tự.'],
    },
    {
      id: 'phanh-truoc', name: 'Ngàm phanh trước', cat: 'banh', build: frontCaliper, explode: [1.0, 0.15, 0.95], after: ['banh-truoc'],
      desc: 'Ngàm phanh thuỷ lực và ống dầu dẫn lên tay phanh phải.', specs: [['Kiểu', 'Đĩa thuỷ lực']], tips: ['Xả gió dầu phanh nếu tay phanh bị "mềm" sau khi lắp.'],
    },
    {
      id: 'chan-bun-truoc', name: 'Chắn bùn trước', cat: 'vo', shell: true, build: frontFender, explode: [0.95, 0.65, 0.3], after: ['cang-truoc'],
      desc: 'Chắn bùn ngắn bắt trên phuộc.', specs: [['Vật liệu', 'Nhựa']], tips: [],
    },
    {
      id: 'tay-lai', name: 'Ghi đông, tay phanh & công tắc', cat: 'dieukhien', build: handlebar, explode: [0.15, 0.8, -0.25], after: ['cang-truoc', 'bo-day'],
      desc: 'Ghi đông thể thao, hai tay phanh có công tắc báo phanh, cụm công tắc trái (còi, đèn, xi nhan, chế độ lái).',
      specs: [['Công tắc phanh', 'Đóng khi bóp → ngắt động cơ']], tips: ['Xe điện không có tay côn: tay trái là phanh sau.'],
    },
    {
      id: 'tay-ga', name: 'Tay ga điện (cảm biến Hall)', cat: 'dieukhien', build: () => throttleGrip({ pos: bar(0.24) }), explode: [0.2, 0.9, 0.6], after: ['tay-lai'],
      desc: 'Xoay tay ga làm thay đổi từ trường qua cảm biến Hall → điện áp tín hiệu gửi về bộ điều khiển.', specs: [['Tín hiệu', 'Analog 0,8 – 4,2 V']],
      tips: ['Nếu xe "tự chạy" khi bật khoá: kiểm tra tay ga bị kẹt hoặc chập dây tín hiệu.'],
    },
    {
      id: 'guong', name: 'Gương tròn', cat: 'vo', build: () => mirrors({ base: [BAR[0], BAR[1] + 0.01, 0], z: 0.25, h: 0.2, round: true }), explode: [0, 1.1, 0], after: ['tay-lai'],
      desc: 'Cặp gương tròn phong cách cổ điển.', specs: [], tips: [],
    },
    {
      id: 'dong-ho', name: 'Đồng hồ tròn', cat: 'dieukhien', build: dashboard, explode: [0.55, 1.05, 0.35], after: ['tay-lai', 'bo-day'],
      desc: 'Hiển thị tốc độ, mức pin, chế độ lái, nhận dữ liệu từ bộ điều khiển.', specs: [['Kết nối', 'CAN / UART'], ['Nguồn', '12 V']], tips: [],
    },
    {
      id: 'den-pha', name: 'Đèn pha tròn LED', cat: 'dien', build: headlight, explode: [1.15, 0.6, 0.2], after: ['cang-truoc', 'bo-day'],
      desc: 'Đèn pha tròn có vòng LED định vị, bắt vào phuộc trước, nguồn 12 V.', specs: [['Nguồn', '12 V']], tips: [],
    },
    {
      id: 'coi', name: 'Còi điện', cat: 'dien', build: () => horn({ pos: [0.42, 0.72, 0] }), explode: [0.9, 0.15, 0.85], after: ['khung', 'bo-day'],
      desc: 'Còi 12 V gắn dưới cổ lái.', specs: [['Nguồn', '12 V']], tips: [],
    },
    {
      id: 'khoa', name: 'Khoá điện', cat: 'dien', build: () => keyModule({ pos: [0.36, 0.98, 0.1], rot: [0, Math.PI, 0] }), explode: [0.45, 0.55, 1.0], after: ['khung', 'bo-day'],
      desc: 'Bật khoá → BMS đóng rơ-le, cấp điện cao áp cho bộ điều khiển và DC-DC.', specs: [], tips: ['Tắt khoá trước mọi thao tác với hệ thống điện.'],
    },
    {
      id: 'pin', name: 'Khối pin 72 V + BMS', cat: 'dien', build: () => batteryPack({ pos: [0.05, 0.66, 0], size: [0.5, 0.36, 0.22], color: 0x2a2f38 }), explode: [0.1, 0.25, 1.25], after: ['khung', 'bo-day'],
      desc: 'Khối pin lithium lớn nằm giữa khung, ở vị trí bình xăng của xe côn tay. BMS (bảng mạch xanh) giám sát từng nhóm cell.',
      specs: [['Điện áp', '72 V'], ['Dung lượng', '68 Ah (~4,9 kWh)'], ['Vị trí', 'Giữa khung, dưới ốp bình']],
      tips: ['⚠ Pin nặng – cần hai người hoặc kích nâng khi tháo/lắp.', 'Tháo cực âm (–) trước, lắp cực âm sau cùng.'],
    },
    {
      id: 'op-binh', name: 'Ốp bình (vỏ pin)', cat: 'vo', shell: true, build: tankCover, explode: [0.1, 0.85, -0.65], after: ['pin'],
      desc: 'Vỏ tạo dáng "bình xăng" bao trùm khối pin, kèm ốp hông màu kem.', specs: [['Vật liệu', 'Nhựa/kim loại sơn']], tips: ['Tháo yên trước, sau đó mới nhấc được ốp bình.'],
    },
    {
      id: 'cong-sac', name: 'Cổng sạc', cat: 'dien', build: () => chargePort({ pos: [0.12, 0.9, -0.17], normal: -1 }), explode: [0.3, 0.3, -1.05], after: ['op-binh', 'bo-day'],
      desc: 'Cổng sạc bên hông ốp bình – hỗ trợ sạc tại nhà và sạc nhanh tại trạm.', specs: [['Sạc nhanh', '~20 phút → ~100 km (theo hãng)']], tips: ['Khi đang sạc, xe bị khoá truyền động.'],
    },
    {
      id: 'dong-co', name: 'Động cơ đặt giữa + nhông trước', cat: 'dongco', build: motor, explode: [0.25, -0.0, 1.0], after: ['khung', 'bo-day'],
      desc: 'Động cơ BLDC/PMSM treo giữa khung, ngay trước chốt càng sau. Trục ra gắn nhông trước kéo xích.',
      specs: [['Công suất', '3.000 W định danh / 7.000 W tối đa'], ['Dây', '3 pha + cảm biến vị trí']],
      tips: ['Khoảng cách trục động cơ – chốt càng nhỏ giúp độ chùng xích ít thay đổi khi giảm xóc làm việc.'],
    },
    {
      id: 'gap-sau', name: 'Càng sau (gắp)', cat: 'khung', build: swingarm, explode: [-0.6, -0.0, -0.8], after: ['khung'],
      desc: 'Càng nhôm hai tay đòn, có bộ tăng xích ở đầu trục bánh.', specs: [['Vật liệu', 'Nhôm']], tips: ['Tra mỡ bạc chốt càng.'],
    },
    {
      id: 'banh-sau', name: 'Bánh sau + nhông sau + đĩa', cat: 'banh', build: rearWheel, explode: [-1.05, 0, 0.6], after: ['gap-sau'],
      desc: 'Vành đúc 17 inch, nhông sau (nhông tải) bên phải, đĩa phanh bên trái.', specs: [['Vành', '17 inch đúc']], tips: ['Căn thẳng bánh bằng vạch chỉnh hai bên càng.'],
    },
    {
      id: 'phanh-sau', name: 'Ngàm phanh sau', cat: 'banh', build: rearCaliper, explode: [-1.0, -0.0, -0.7], after: ['banh-sau'],
      desc: 'Ngàm phanh đĩa phía sau, điều khiển bằng tay phanh trái.', specs: [], tips: [],
    },
    {
      id: 'xich', name: 'Xích tải', cat: 'dongco', build: chain, explode: [-0.35, -0.0, 0.75], after: ['dong-co', 'banh-sau'],
      desc: 'Truyền mô-men từ nhông trước (15 răng) sang nhông sau (42 răng) – giảm tốc ~2,8 lần, tăng lực kéo.',
      specs: [['Tỉ số (mô phỏng)', '15/42 ≈ 1 : 2,8']], tips: ['Độ chùng xích chuẩn khoảng 2–3 cm ở giữa nhánh dưới.', 'Lắp khoá xích với đầu hở ngược chiều quay.'],
    },
    {
      id: 'giam-xoc-sau', name: 'Giảm xóc sau (đôi)', cat: 'khung', build: rearShocks, explode: [-0.55, 0.75, 0.5], after: ['gap-sau', 'khung'],
      desc: 'Hai giảm xóc lò xo vàng nối càng sau với khung phụ.', specs: [], tips: [],
    },
    {
      id: 'bo-dieu-khien', name: 'Bộ điều khiển động cơ', cat: 'dongco', build: () => controllerBox({ pos: [-0.45, 0.72, 0], rot: [0, Math.PI, 0] }), explode: [-0.55, 0.45, 1.0], after: ['khung', 'bo-day'],
      desc: 'Biến dòng DC 72 V thành dòng 3 pha điều chế độ rộng xung (PWM), điều khiển mô-men theo tay ga, hỗ trợ hãm tái sinh.',
      specs: [['Vào', '72 V DC'], ['Ra', '3 pha U/V/W']], tips: ['Lắp keo tản nhiệt giữa đế bộ điều khiển và giá đỡ.'],
    },
    {
      id: 'dc-dc', name: 'Bộ chuyển đổi DC-DC', cat: 'dien', build: () => dcdcBox({ pos: [-0.6, 0.82, 0] }), explode: [-0.8, 0.55, 0.75], after: ['khung', 'bo-day'],
      desc: 'Hạ 72 V xuống 12 V cho đèn, còi, đồng hồ.', specs: [['Vào', '72 V'], ['Ra', '12 V']], tips: [],
    },
    {
      id: 'ro-le', name: 'Rơ-le nguồn & cầu chì', cat: 'dien', build: () => relayFuse({ pos: [-0.38, 0.86, 0] }), explode: [-0.3, 0.6, 0.85], after: ['khung', 'bo-day'],
      desc: 'Đóng/ngắt đường cao áp chính và bảo vệ các nhánh điện.', specs: [], tips: [],
    },
    {
      id: 'op-hong', name: 'Ốp hông dưới yên', cat: 'vo', shell: true, build: sideCovers, explode: [-0.45, 0.2, -0.95], after: ['bo-dieu-khien', 'dc-dc', 'ro-le'],
      desc: 'Hai tấm ốp che bộ điều khiển, DC-DC và rơ-le.', specs: [], tips: [],
    },
    {
      id: 'yen', name: 'Yên da', cat: 'vo', shell: true, build: seat, explode: [-0.35, 1.3, 0], after: ['op-hong', 'op-binh', 'giam-xoc-sau'],
      desc: 'Yên dài phong cách cổ điển.', specs: [], tips: ['Tháo yên đầu tiên khi muốn tiếp cận pin hoặc bộ điều khiển.'],
    },
    {
      id: 'duoi-xe', name: 'Đuôi xe & chắn bùn sau', cat: 'vo', shell: true, build: tail, explode: [-0.95, 0.65, -0.3], after: ['khung'],
      desc: 'Ốp đuôi, chắn bùn và giá biển số.', specs: [], tips: [],
    },
    {
      id: 'den-hau', name: 'Đèn hậu & đèn phanh', cat: 'dien', build: taillight, explode: [-1.0, 0.95, 0.3], after: ['duoi-xe', 'bo-day'],
      desc: 'Đèn hậu LED, sáng mạnh khi bóp phanh.', specs: [['Nguồn', '12 V']], tips: [],
    },
    {
      id: 'chan-chong', name: 'Chân chống nghiêng + công tắc', cat: 'khung', build: () => sideStand({ pivot: [-0.1, 0.27, -0.12], foot: [-0.28, 0.012, -0.3] }), explode: [0, 0, -0.8], after: ['khung'],
      desc: 'Công tắc an toàn ngăn động cơ chạy khi chân chống còn hạ.', specs: [], tips: [],
    },
  ],
  wires: [
    { id: 'hv-pin-rl', from: 'pin', to: 'ro-le', type: 'hv', ch: 'hv', label: 'Cao áp: Pin → Rơ-le', pts: [[-0.16, 0.86, 0.05], [-0.27, 0.92, 0.03], [-0.37, 0.89, 0]] },
    { id: 'hv-rl-ctl', from: 'ro-le', to: 'bo-dieu-khien', type: 'hv', ch: 'hvMotor', label: 'Cao áp: Rơ-le → Bộ điều khiển', pts: [[-0.36, 0.86, 0.02], [-0.36, 0.8, 0.05], [-0.42, 0.76, 0.03]] },
    { id: 'hv-rl-dc', from: 'ro-le', to: 'dc-dc', type: 'hv', ch: 'hv', label: 'Cao áp: Rơ-le → DC-DC', pts: [[-0.4, 0.87, 0.03], [-0.5, 0.87, 0.04], [-0.57, 0.84, 0.02]] },
    { id: 'ph-ctl-mt', from: 'bo-dieu-khien', to: 'dong-co', type: 'phase', ch: 'phase', label: '3 dây pha U/V/W: Bộ điều khiển → Động cơ', pts: [[-0.35, 0.705, 0], [-0.3, 0.6, 0.07], [-0.16, 0.48, 0.095], [-0.08, 0.43, 0.085]] },
    { id: 'lv-dc-head', from: 'dc-dc', to: 'den-pha', type: 'lv', ch: 'head', label: '12V: DC-DC → Đèn pha', pts: [[-0.6, 0.84, 0.03], [-0.3, 0.95, 0.07], [0.1, 0.98, 0.11], [0.38, 0.99, 0.08], [0.5, 1.03, 0.02]] },
    { id: 'lv-dc-dash', from: 'dc-dc', to: 'dong-ho', type: 'lv', ch: 'dash', label: '12V: DC-DC → Đồng hồ', pts: [[-0.6, 0.84, 0.0], [-0.3, 0.94, 0.08], [0.1, 0.97, 0.1], [0.37, 1.01, 0.06], [0.41, 1.18, 0]] },
    { id: 'lv-dc-horn', from: 'dc-dc', to: 'coi', type: 'lv', ch: 'horn', label: '12V: DC-DC → Còi', pts: [[-0.6, 0.82, 0.04], [-0.3, 0.9, 0.1], [0.2, 0.95, 0.1], [0.39, 0.78, 0.1], [0.42, 0.73, 0.02]] },
    { id: 'lv-dc-tail', from: 'dc-dc', to: 'den-hau', type: 'lv', ch: 'tail', label: '12V: DC-DC → Đèn hậu', pts: [[-0.62, 0.84, 0], [-0.85, 0.93, 0], [-0.99, 0.94, 0]] },
    { id: 'sg-thr', from: 'tay-ga', to: 'bo-dieu-khien', type: 'signal', ch: 'throttle', label: 'Tín hiệu tay ga → Bộ điều khiển', pts: [bar(0.24), [0.4, 1.05, 0.12], [0.3, 0.98, 0.115], [-0.2, 0.94, 0.11], [-0.45, 0.8, 0.07], [-0.54, 0.73, 0.03]] },
    { id: 'sg-brk', from: 'tay-lai', to: 'bo-dieu-khien', type: 'signal', ch: 'brake', label: 'Công tắc phanh → Bộ điều khiển & đèn phanh', pts: [[BAR[0] + 0.005, BAR[1] + 0.01, -0.2], [0.4, 1.05, -0.12], [0.3, 0.98, -0.115], [-0.2, 0.94, -0.11], [-0.45, 0.8, -0.07], [-0.54, 0.73, -0.03]] },
    { id: 'sg-std', from: 'chan-chong', to: 'bo-dieu-khien', type: 'signal', ch: 'stand', label: 'Công tắc chân chống → Bộ điều khiển', pts: [[-0.085, 0.29, -0.12], [-0.2, 0.4, -0.115], [-0.4, 0.6, -0.08], [-0.54, 0.7, -0.03]] },
    { id: 'sg-key', from: 'khoa', to: 'pin', type: 'signal', ch: 'key', label: 'Tín hiệu bật khoá → BMS', pts: [[0.36, 0.97, 0.1], [0.3, 0.85, 0.125], [0.15, 0.65, 0.122]] },
    { id: 'sg-can', from: 'bo-dieu-khien', to: 'dong-ho', type: 'signal', ch: 'can', label: 'Đường truyền dữ liệu CAN: Bộ điều khiển ↔ Đồng hồ', pts: [[-0.54, 0.74, 0.04], [-0.3, 0.89, 0.095], [0.2, 0.965, 0.105], [0.38, 1.03, 0.05], [0.41, 1.17, 0.02]] },
    { id: 'ch-port-pin', from: 'cong-sac', to: 'pin', type: 'charge', ch: 'charge', label: 'Đường sạc: Cổng sạc → Pin', pts: [[0.12, 0.9, -0.155], [0.06, 0.8, -0.125], [-0.05, 0.72, -0.118]] },
  ],
};
