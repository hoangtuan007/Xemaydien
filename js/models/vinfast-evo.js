// Mẫu 1: Xe tay ga điện, động cơ đặt trong bánh sau (in-hub) — lấy cảm hứng từ VinFast Evo200.
// Hình học là mô phỏng đơn giản hoá cho mục đích học tập, không phải bản vẽ kỹ thuật của hãng.
import * as THREE from 'three';
import {
  MAT, mat, box, cyl, rod, pipe, profile, smoothProfile, spring, wheel, rotor, markLamp,
} from '../shapes.js';
import {
  wrap, batteryPack, controllerBox, dcdcBox, relayFuse, keyModule, horn, chargePort, throttleGrip, sideStand, mirrors,
} from './common.js';

const BODY = 0x1f8fd6; // xanh dương
const BODY2 = 0xf2f4f7;

const FW = [0.63, 0.25, 0]; // tâm bánh trước
const RW = [-0.6, 0.25, 0]; // tâm bánh sau
const steer = (t) => [0.63 - 0.267 * t, 0.25 + 0.964 * t]; // trục lái

function frame() {
  const g = new THREE.Group();
  const s = MAT.steel();
  const head0 = steer(0.45), head1 = steer(0.7);
  g.add(rod([head0[0], head0[1], 0], [head1[0], head1[1], 0], 0.03, s));
  g.add(pipe([[head0[0], head0[1] + 0.05, 0], [0.44, 0.5, 0], [0.4, 0.34, 0]], 0.025, s));
  [-1, 1].forEach((k) => {
    const z = 0.11 * k;
    g.add(pipe([[0.42, 0.33, z * 0.4], [0.38, 0.29, z], [-0.1, 0.28, z], [-0.28, 0.42, z], [-0.55, 0.58, z], [-0.92, 0.66, z * 0.8]], 0.016, s, { seg: 80 }));
  });
  [[0.38, 0.29], [-0.1, 0.28], [-0.55, 0.58], [-0.85, 0.65]].forEach(([x, y]) => g.add(rod([x, y, -0.11], [x, y, 0.11], 0.012, s)));
  // giá bắt càng sau
  g.add(box(0.06, 0.06, 0.24, s, [-0.18, 0.31, 0], [0, 0, 0], 0.01));
  return wrap(g);
}

function frontFork() {
  const g = new THREE.Group();
  const c = MAT.chrome(), b = MAT.black();
  const top = steer(0.5), crown = steer(0.47);
  [-1, 1].forEach((k) => {
    const z = 0.085 * k;
    const low = [FW[0], FW[1], z];
    const mid = [...steer(0.2), z];
    g.add(rod(low, mid, 0.022, b));
    g.add(rod(mid, [crown[0], crown[1], z], 0.016, c));
  });
  g.add(box(0.06, 0.03, 0.2, MAT.steel(), [crown[0], crown[1], 0], [0, 0, 0.27], 0.008));
  const st = steer(0.78);
  g.add(rod([crown[0], crown[1], 0], [st[0], st[1], 0], 0.018, MAT.steel()));
  g.add(cyl(0.012, 0.2, MAT.steel(), [FW[0], FW[1], 0], 'z', 12));
  void top;
  return wrap(g);
}

function frontWheel() {
  const g = new THREE.Group();
  const w = wheel({ r: 0.25, rimR: 0.16, width: 0.1, spokes: 5, rimColor: 0x2b2f36 });
  w.add(rotor(0.11, 0.06));
  w.position.set(...FW);
  w.userData.spin = 'front';
  g.add(w);
  return g;
}

function frontCaliper() {
  const g = new THREE.Group();
  const a = (125 * Math.PI) / 180;
  const p = [FW[0] + Math.cos(a) * 0.1, FW[1] + Math.sin(a) * 0.1, 0.062];
  g.add(box(0.07, 0.04, 0.035, mat(0xc1121f, { metal: 0.4, rough: 0.4 }), p, [0, 0, a + Math.PI / 2], 0.008));
  g.add(rod([p[0], p[1], 0.075], [steer(0.18)[0], steer(0.18)[1], 0.085], 0.006, MAT.black()));
  return wrap(g);
}

function frontFender() {
  const g = new THREE.Group();
  const geo = new THREE.TorusGeometry(0.29, 0.03, 8, 40, Math.PI * 0.62);
  const m = new THREE.Mesh(geo, MAT.paint(BODY));
  m.scale.z = 2.2;
  m.rotation.z = Math.PI * 0.22;
  m.position.set(FW[0], FW[1], 0);
  m.castShadow = true;
  g.add(m);
  return wrap(g);
}

function handlebar() {
  const g = new THREE.Group();
  const st = steer(0.78);
  const y = st[1] + 0.04;
  g.add(rod([st[0], y, -0.3], [st[0], y, 0.26], 0.012, MAT.steel()));
  g.add(cyl(0.017, 0.11, MAT.rubber(), [st[0], y, -0.33], 'z', 18));
  // ốp đầu (che ghi đông)
  g.add(smoothProfile([[st[0] - 0.12, y - 0.04], [st[0] - 0.1, y + 0.05], ['q', st[0], y + 0.08, st[0] + 0.12, y + 0.03], [st[0] + 0.1, y - 0.05]], 0.4, MAT.paint(BODY2), { bevel: 0.025 }));
  // tay phanh hai bên (có công tắc phanh)
  [-1, 1].forEach((k) => {
    g.add(rod([st[0] + 0.02, y + 0.01, k * 0.2], [st[0] + 0.07, y - 0.005, k * 0.36], 0.007, MAT.alu()));
    g.add(box(0.035, 0.03, 0.03, MAT.black(), [st[0] + 0.01, y, k * 0.2], [0, 0, 0], 0.005));
  });
  // cụm công tắc trái (còi, xi nhan, đèn)
  g.add(box(0.05, 0.05, 0.04, MAT.black(), [st[0], y, -0.24], [0, 0, 0], 0.01));
  return wrap(g);
}

function dashboard() {
  const g = new THREE.Group();
  const st = steer(0.78);
  const p = [st[0] - 0.05, st[1] + 0.105, 0];
  g.add(box(0.06, 0.02, 0.2, MAT.black(), p, [0, 0, 0.6], 0.008));
  g.add(markLamp(box(0.045, 0.004, 0.17, MAT.lamp(0x0d1b2a), [p[0] - 0.006, p[1] + 0.009, 0], [0, 0, 0.6], 0.001), 'dash', 0x4cc9f0));
  return wrap(g);
}

function headlight() {
  const g = new THREE.Group();
  g.add(box(0.08, 0.09, 0.24, MAT.black(), [0.645, 0.84, 0], [0, 0, -0.35], 0.02));
  g.add(markLamp(box(0.012, 0.07, 0.21, MAT.lamp(0xe8f1ff), [0.69, 0.855, 0], [0, 0, -0.35], 0.01), 'head', 0xffffff));
  // đèn định vị chữ V
  [-1, 1].forEach((k) => g.add(markLamp(box(0.01, 0.012, 0.12, MAT.lamp(0xe8f1ff), [0.695, 0.76, k * 0.07], [0, k * 0.35, -0.2], 0.004), 'head', 0xbfe3ff)));
  return wrap(g);
}

function frontCover() {
  const g = new THREE.Group();
  const pts = [[0.33, 0.34], [0.36, 0.72], ['q', 0.38, 0.97, 0.47, 0.99], [0.56, 0.95], ['q', 0.7, 0.88, 0.71, 0.73], [0.66, 0.58], ['q', 0.56, 0.5, 0.47, 0.44], [0.42, 0.34]];
  g.add(smoothProfile(pts, 0.38, MAT.paint(BODY), { bevel: 0.035 }));
  // viền đen chân yếm
  g.add(box(0.05, 0.4, 0.36, MAT.plastic(0x2b2d33), [0.36, 0.55, 0], [0, 0, -0.08], 0.02));
  return wrap(g);
}

function floorboard() {
  const g = new THREE.Group();
  g.add(box(0.5, 0.025, 0.36, MAT.plastic(0x2b2d33), [0.14, 0.335, 0], [0, 0, 0], 0.01));
  for (let i = 0; i < 7; i++) g.add(box(0.44, 0.006, 0.012, MAT.rubber(), [0.14, 0.35, -0.15 + i * 0.05], [0, 0, 0], 0.002));
  [-1, 1].forEach((k) => g.add(profile([[-0.12, 0.33], [0.4, 0.33], [0.36, 0.17], [-0.08, 0.17]], 0.02, MAT.paint(BODY), { zc: k * 0.17, bevel: 0.006 })));
  return wrap(g);
}

function trunk() {
  const g = new THREE.Group();
  const m = MAT.plastic(0x3a3d44);
  const c = [-0.4, 0.58];
  g.add(box(0.42, 0.012, 0.24, m, [c[0], 0.46, 0], [0, 0, 0], 0.004));
  [-1, 1].forEach((k) => g.add(box(0.42, 0.25, 0.01, m, [c[0], c[1], k * 0.12], [0, 0, 0], 0.003)));
  [-1, 1].forEach((k) => g.add(box(0.01, 0.25, 0.24, m, [c[0] + k * 0.21, c[1], 0], [0, 0, 0], 0.003)));
  return wrap(g);
}

function rearBody() {
  const g = new THREE.Group();
  const pts = [[-0.08, 0.34], [-0.11, 0.55], [-0.14, 0.73], [-0.5, 0.75], [-0.8, 0.79], ['q', -0.98, 0.81, -1.0, 0.72], [-0.95, 0.63], [-0.78, 0.6], ['q', -0.62, 0.56, -0.45, 0.5], [-0.3, 0.38]];
  g.add(smoothProfile(pts, 0.34, MAT.paint(BODY), { bevel: 0.03 }));
  // đường viền trang trí
  [-1, 1].forEach((k) => g.add(box(0.6, 0.012, 0.004, MAT.chrome(), [-0.5, 0.66, k * 0.172], [0, 0, 0.06], 0.002)));
  // tay dắt sau
  g.add(pipe([[-0.62, 0.82, -0.14], [-0.85, 0.84, -0.12], [-0.9, 0.84, 0], [-0.85, 0.84, 0.12], [-0.62, 0.82, 0.14]], 0.012, MAT.black()));
  return wrap(g);
}

function seat() {
  const g = new THREE.Group();
  const pts = [[-0.13, 0.74], ['q', -0.14, 0.82, -0.25, 0.82], [-0.5, 0.82], ['q', -0.6, 0.84, -0.66, 0.88], [-0.84, 0.88], ['q', -0.9, 0.86, -0.86, 0.79], [-0.15, 0.74]];
  g.add(smoothProfile(pts, 0.3, mat(0x2a211c, { rough: 0.8 }), { bevel: 0.03 }));
  return wrap(g);
}

function taillight() {
  const g = new THREE.Group();
  g.add(box(0.04, 0.05, 0.2, MAT.black(), [-0.99, 0.72, 0], [0, 0, 0.3], 0.012));
  g.add(markLamp(box(0.008, 0.035, 0.18, MAT.lamp(0x5a0000), [-1.012, 0.725, 0], [0, 0, 0.3], 0.004), 'tail', 0xff2a2a));
  return wrap(g);
}

function swingarm() {
  const g = new THREE.Group();
  const s = mat(0x2b2f36, { metal: 0.6, rough: 0.35 });
  [-1, 1].forEach((k) => {
    const z = 0.1 * k;
    g.add(box(0.44, 0.045, 0.025, s, [(-0.18 + RW[0]) / 2, (0.31 + RW[1]) / 2, z], [0, 0, Math.atan2(0.31 - RW[1], -0.18 - RW[0])], 0.008));
  });
  g.add(cyl(0.025, 0.24, s, [-0.18, 0.31, 0], 'z', 16));
  g.add(cyl(0.012, 0.24, MAT.steel(), [RW[0], RW[1], 0], 'z', 12));
  return wrap(g);
}

function hubMotorWheel() {
  const g = new THREE.Group();
  const w = wheel({ r: 0.25, rimR: 0.16, width: 0.1, spokes: 0, hubR: 0.13, hubW: 0.12, rimColor: 0x2b2f36 });
  // vỏ động cơ in-hub + cánh tản nhiệt
  const shell = mat(0x9aa3ad, { metal: 0.85, rough: 0.3 });
  w.add(cyl(0.128, 0.125, shell, [0, 0, 0], 'z', 40));
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    w.add(box(0.07, 0.008, 0.005, mat(0x6c757d, { metal: 0.8 }), [Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0.064], [0, 0, a], 0));
  }
  w.add(cyl(0.035, 0.13, mat(0xff7a1a, { metal: 0.3 }), [0, 0, 0], 'z', 20));
  w.add(rotor(0.1, -0.068));
  w.position.set(...RW);
  w.userData.spin = 'rear';
  g.add(w);
  // trục cố định + cáp ra
  g.add(cyl(0.014, 0.24, MAT.steel(), [RW[0], RW[1], 0], 'z', 12));
  return g;
}

function rearCaliper() {
  const g = new THREE.Group();
  const a = (60 * Math.PI) / 180;
  g.add(box(0.06, 0.035, 0.03, mat(0x343a40, { metal: 0.5 }), [RW[0] + Math.cos(a) * 0.09, RW[1] + Math.sin(a) * 0.09, -0.07], [0, 0, a + Math.PI / 2], 0.008));
  return wrap(g);
}

function rearShocks() {
  const g = new THREE.Group();
  [-1, 1].forEach((k) => {
    const z = 0.125 * k;
    const a = [-0.56, 0.27, z], b = [-0.5, 0.58, z];
    g.add(rod(a, b, 0.012, MAT.chrome()));
    g.add(spring([-0.555, 0.32, z], [-0.505, 0.54, z], 0.024, 0.0045, 9, mat(0xe63946, { metal: 0.5 })));
    g.add(cyl(0.02, 0.03, MAT.black(), a, 'z', 12));
    g.add(cyl(0.02, 0.03, MAT.black(), b, 'z', 12));
  });
  return wrap(g);
}

function harness() {
  const g = new THREE.Group();
  const b = mat(0x111111, { rough: 0.9 });
  g.add(pipe([[0.42, 1.0, 0], [0.42, 0.85, 0.04], [0.41, 0.6, 0.06], [0.33, 0.36, 0.07], [0.0, 0.33, 0.08], [-0.3, 0.46, 0.06], [-0.6, 0.56, 0.03]], 0.011, b, { seg: 90 }));
  return wrap(g);
}

// ---- Định nghĩa các bộ phận ----
export default {
  id: 'evo',
  brand: 'VinFast',
  name: 'Evo200 (mô phỏng)',
  kind: 'Xe tay ga · động cơ trong bánh sau (in-hub)',
  accent: '#1f8fd6',
  vmax: 70,
  pmax: 2500,
  voltage: 60,
  socDrain: 0.35,
  summary: [
    ['Động cơ', 'In-hub bánh sau, 1.500 W định danh / 2.500 W tối đa'],
    ['Pin', 'LFP 3,5 kWh, đặt cố định dưới sàn để chân'],
    ['Tốc độ tối đa', '~70 km/h (chế độ SPORT)'],
    ['Quãng đường', '~200 km/lần sạc (điều kiện thử của hãng)'],
    ['Sạc', 'Bộ sạc 400 W, ~10 giờ'],
    ['Chống nước', 'IP67'],
  ],
  layoutNote: 'Động cơ nằm ngay trong bánh sau nên không cần xích hay dây đai: bộ điều khiển cấp dòng 3 pha trực tiếp vào cuộn dây stator, nam châm trên vỏ bánh quay theo.',
  camera: { pos: [1.9, 1.3, 2.4], target: [0, 0.5, 0] },
  parts: [
    {
      id: 'khung', name: 'Khung xe', cat: 'khung', build: frame, explode: [0, 0, -0.7], after: [],
      desc: 'Khung thép ống dạng underbone – "xương sống" chịu lực, nơi mọi bộ phận khác bắt vào.',
      specs: [['Vật liệu', 'Thép ống hàn'], ['Kiểu', 'Underbone, sàn để chân phẳng']],
      tips: ['Lắp đầu tiên, tháo sau cùng.', 'Kiểm tra mối hàn và ổ cổ phốt trước khi lắp các cụm khác.'],
    },
    {
      id: 'bo-day', name: 'Bó dây điện (harness)', cat: 'dien', build: harness, explode: [0, 1.4, -0.6], after: ['khung'],
      desc: 'Ống gen bọc toàn bộ dây nối giữa pin, bộ điều khiển, đèn, đồng hồ và các công tắc.',
      specs: [['Thành phần', 'Dây nguồn, dây tín hiệu, giắc chống nước']],
      tips: ['Đi dây theo khung, cố định bằng dây rút, tránh mép sắc và chỗ nóng.', 'Giắc chống nước phải bấm "tách" chắc chắn.'],
    },
    {
      id: 'cang-truoc', name: 'Phuộc trước & cổ lái', cat: 'khung', build: frontFork, explode: [0.75, 0.25, 0], after: ['khung'],
      desc: 'Giảm xóc ống lồng thuỷ lực, nối bánh trước với cổ lái để đánh lái và hấp thụ dao động.',
      specs: [['Kiểu', 'Ống lồng, thuỷ lực'], ['Ổ cổ', 'Bi côn']],
      tips: ['Tra mỡ ổ bi cổ lái, siết đai ốc cổ vừa đủ để lái nhẹ mà không rơ.'],
    },
    {
      id: 'banh-truoc', name: 'Bánh trước + đĩa phanh', cat: 'banh', build: frontWheel, explode: [1.25, 0, 0.45], after: ['cang-truoc'],
      desc: 'Vành hợp kim 12", lốp không săm, đĩa phanh bắt trên moay-ơ.',
      specs: [['Vành', 'Hợp kim 12 inch'], ['Lốp', 'Không săm']],
      tips: ['Lắp đúng chiều mũi tên trên lốp.', 'Siết trục bánh theo lực siết khuyến cáo rồi mới lắp ngàm phanh.'],
    },
    {
      id: 'phanh-truoc', name: 'Ngàm phanh đĩa trước', cat: 'banh', build: frontCaliper, explode: [0.95, 0.1, 0.8], after: ['banh-truoc'],
      desc: 'Ngàm phanh thuỷ lực kẹp đĩa phanh trước.',
      specs: [['Kiểu', 'Đĩa thuỷ lực']],
      tips: ['Không bóp tay phanh khi đã tháo ngàm (piston sẽ bị đẩy ra).', 'Lắp xong bóp phanh vài lần cho má phanh áp sát đĩa.'],
    },
    {
      id: 'chan-bun-truoc', name: 'Chắn bùn trước', cat: 'vo', shell: true, build: frontFender, explode: [0.9, 0.6, 0.3], after: ['cang-truoc'],
      desc: 'Che bùn nước bắn lên từ bánh trước.', specs: [['Vật liệu', 'Nhựa ABS sơn']], tips: ['Bắt 4 vít vào chân phuộc.'],
    },
    {
      id: 'tay-lai', name: 'Ghi đông, tay phanh & công tắc', cat: 'dieukhien', build: handlebar, explode: [0.2, 0.75, -0.2], after: ['cang-truoc', 'bo-day'],
      desc: 'Ghi đông gắn trên cổ lái, có hai tay phanh (mỗi tay có công tắc báo phanh) và cụm công tắc còi/đèn/xi nhan.',
      specs: [['Công tắc phanh', 'Thường mở, đóng khi bóp phanh → ngắt ga']],
      tips: ['Công tắc phanh báo cho bộ điều khiển ngắt động cơ ngay khi bóp phanh – tính năng an toàn bắt buộc.'],
    },
    {
      id: 'tay-ga', name: 'Tay ga điện (cảm biến Hall)', cat: 'dieukhien', build: () => throttleGrip({ pos: [steer(0.78)[0], steer(0.78)[1] + 0.04, 0.26] }), explode: [0.25, 0.85, 0.55], after: ['tay-lai'],
      desc: 'Không có dây cáp như xe xăng: tay ga xoay một nam châm qua cảm biến Hall, tạo tín hiệu 0,8–4,2 V gửi về bộ điều khiển.',
      specs: [['Tín hiệu', 'Analog 0,8 – 4,2 V'], ['Nguồn', '5 V từ bộ điều khiển']],
      tips: ['Giắc tay ga 3 dây: đỏ (5V), đen (mass), xanh (tín hiệu).'],
    },
    {
      id: 'guong', name: 'Gương chiếu hậu', cat: 'vo', build: () => mirrors({ base: [steer(0.78)[0], steer(0.78)[1] + 0.05, 0], z: 0.22 }), explode: [0, 1.05, 0], after: ['tay-lai'],
      desc: 'Cặp gương bắt ren vào ghi đông.', specs: [['Ren', 'M10']], tips: ['Bên trái thường là ren ngược ở nhiều mẫu xe.'],
    },
    {
      id: 'dong-ho', name: 'Đồng hồ LCD', cat: 'dieukhien', build: dashboard, explode: [0.55, 1.0, 0.3], after: ['tay-lai', 'bo-day'],
      desc: 'Hiển thị tốc độ, % pin, chế độ lái, lỗi. Nhận dữ liệu từ bộ điều khiển qua đường truyền tín hiệu (CAN/UART).',
      specs: [['Kết nối', 'CAN / UART với bộ điều khiển'], ['Nguồn', '12 V']],
      tips: ['Nếu đồng hồ báo mã lỗi, tra mã trong sổ hướng dẫn trước khi tháo các bộ phận.'],
    },
    {
      id: 'den-pha', name: 'Đèn pha LED', cat: 'dien', build: headlight, explode: [1.05, 0.65, 0.25], after: ['khung', 'bo-day'],
      desc: 'Cụm đèn pha và đèn định vị LED, lấy nguồn 12 V từ bộ DC-DC.', specs: [['Nguồn', '12 V DC'], ['Loại', 'LED']], tips: ['Chỉnh góc chiếu bằng vít điều chỉnh sau chóa đèn.'],
    },
    {
      id: 'coi', name: 'Còi điện', cat: 'dien', build: () => horn({ pos: [0.6, 0.6, 0] }), explode: [1.05, 0.2, 0.75], after: ['khung', 'bo-day'],
      desc: 'Còi 12 V, kích hoạt qua nút bấm trên cụm công tắc trái.', specs: [['Nguồn', '12 V']], tips: ['Không cần phân biệt cực với còi đĩa thông thường.'],
    },
    {
      id: 'khoa', name: 'Khoá điện / Smartkey', cat: 'dien', build: () => keyModule({ pos: [0.41, 0.86, 0.09], rot: [0, Math.PI, 0] }), explode: [0.4, 0.55, 0.95], after: ['khung', 'bo-day'],
      desc: 'Khi bật khoá, tín hiệu "đánh thức" gửi tới BMS để đóng rơ-le nguồn chính, cấp điện cao áp cho toàn xe.',
      specs: [['Chức năng', 'Bật/tắt nguồn, chống trộm']], tips: ['Luôn tắt khoá và rút chìa trước khi tháo bất kỳ bộ phận điện nào.'],
    },
    {
      id: 'dc-dc', name: 'Bộ chuyển đổi DC-DC', cat: 'dien', build: () => dcdcBox({ pos: [0.37, 0.62, 0.08] }), explode: [0.35, 0.3, 1.05], after: ['khung', 'bo-day'],
      desc: 'Hạ điện áp pin (~60 V) xuống 12 V cho đèn, còi, đồng hồ – thay vai trò ắc quy 12 V trên xe xăng.',
      specs: [['Vào', '~48–72 V DC'], ['Ra', '12 V DC']], tips: ['Nếu đèn, còi, đồng hồ cùng tắt mà xe vẫn có điện cao áp → kiểm tra DC-DC và cầu chì 12 V.'],
    },
    {
      id: 'op-dau', name: 'Ốp đầu & yếm trước', cat: 'vo', shell: true, build: frontCover, explode: [1.15, 0.7, -0.45], after: ['cang-truoc', 'den-pha', 'coi', 'khoa', 'dc-dc'],
      desc: 'Mặt nạ và yếm bao phía trước, che đèn pha, còi, khoá điện và bộ DC-DC.', specs: [['Vật liệu', 'Nhựa ABS/PP sơn']],
      tips: ['Nhựa ốp có nhiều lẫy gài – tháo từ dưới lên, không bẩy mạnh.'],
    },
    {
      id: 'pin', name: 'Khối pin LFP + BMS', cat: 'dien', build: () => batteryPack({ pos: [0.14, 0.215, 0], size: [0.42, 0.12, 0.2] }), explode: [0.15, 0.05, 1.15], after: ['khung', 'bo-day'],
      desc: 'Nguồn năng lượng chính, gồm hàng chục cell LFP ghép nối tiếp/song song. Mạch BMS (bảng mạch xanh) cân bằng cell, đo nhiệt độ và cắt nguồn khi quá dòng/quá áp.',
      specs: [['Hoá học', 'LFP (Lithium Sắt Photphat)'], ['Dung lượng', '3,5 kWh'], ['Vị trí', 'Dưới sàn để chân – trọng tâm thấp']],
      tips: ['⚠ Điện áp cao: dùng găng cách điện, tháo cực âm (–) trước, lắp cực âm sau cùng.', 'Không đặt dụng cụ kim loại lên hai cọc pin.'],
    },
    {
      id: 'ro-le', name: 'Rơ-le nguồn & cầu chì', cat: 'dien', build: () => relayFuse({ pos: [-0.1, 0.4, 0] }), explode: [-0.1, 0.25, 0.9], after: ['khung', 'bo-day'],
      desc: 'Rơ-le (contactor) đóng/ngắt đường cao áp từ pin; hộp cầu chì bảo vệ các nhánh khi chập mạch.', specs: [['Cầu chì chính', '~40–60 A (mô phỏng)']],
      tips: ['Cầu chì đứt thì phải tìm nguyên nhân chập, không thay bằng cầu chì lớn hơn.'],
    },
    {
      id: 'san-de-chan', name: 'Sàn để chân', cat: 'vo', shell: true, build: floorboard, explode: [0.1, 0.0, -0.95], after: ['khung', 'pin'],
      desc: 'Tấm sàn và ốp hông bao kín khoang pin bên dưới.', specs: [['Vật liệu', 'Nhựa + thảm cao su']], tips: ['Phải tháo sàn mới tiếp cận được pin.'],
    },
    {
      id: 'gap-sau', name: 'Càng sau (gắp)', cat: 'khung', build: swingarm, explode: [-0.55, 0, -0.75], after: ['khung'],
      desc: 'Hai tay đòn nối trục bánh sau với khung qua chốt xoay, cho bánh sau dao động lên xuống.', specs: [['Kiểu', 'Hai tay đòn']], tips: ['Tra mỡ bạc chốt xoay khi lắp.'],
    },
    {
      id: 'dong-co', name: 'Động cơ in-hub + bánh sau', cat: 'dongco', build: hubMotorWheel, explode: [-0.95, 0, 0.65], after: ['gap-sau', 'bo-day'],
      desc: 'Động cơ không chổi than (BLDC) nằm trong moay-ơ bánh sau: stator cố định trên trục, vỏ bánh gắn nam châm quay quanh. Truyền động trực tiếp, không xích.',
      specs: [['Công suất', '1.500 W định danh / 2.500 W tối đa'], ['Kiểu', 'BLDC in-hub'], ['Dây', '3 dây pha + dây cảm biến Hall']],
      tips: ['Dây pha đi ra từ trục – tháo giắc trước khi tháo trục bánh.', 'Nối sai thứ tự 3 pha sẽ làm động cơ quay giật hoặc quay ngược.'],
    },
    {
      id: 'phanh-sau', name: 'Cụm phanh sau', cat: 'banh', build: rearCaliper, explode: [-0.95, 0.15, -0.65], after: ['dong-co'],
      desc: 'Ngàm phanh kẹp đĩa phanh phía sau.', specs: [['Liên kết', 'Tay phanh trái']], tips: ['Một số đời xe dùng phanh tang trống ở bánh sau.'],
    },
    {
      id: 'giam-xoc-sau', name: 'Giảm xóc sau (đôi)', cat: 'khung', build: rearShocks, explode: [-0.6, 0.65, 0.45], after: ['gap-sau', 'khung'],
      desc: 'Hai lò xo trụ kết hợp giảm chấn dầu, nối càng sau với khung.', specs: [['Số lượng', '2']], tips: ['Kê xe bằng chân chống giữa trước khi tháo giảm xóc.'],
    },
    {
      id: 'bo-dieu-khien', name: 'Bộ điều khiển động cơ (controller)', cat: 'dongco', build: () => controllerBox({ pos: [-0.72, 0.55, 0] }), explode: [-0.65, 0.35, 0.95], after: ['khung', 'bo-day'],
      desc: '"Bộ não" của hệ truyền động: đọc tay ga, phanh, chân chống, cảm biến Hall rồi băm dòng DC từ pin thành dòng 3 pha (PWM) cấp cho động cơ. Có thể hãm tái sinh nạp lại pin.',
      specs: [['Vào', 'DC từ pin'], ['Ra', '3 pha U/V/W'], ['Tín hiệu', 'Tay ga, phanh, chân chống, Hall, CAN']],
      tips: ['Bắt chặt lên khung kim loại để tản nhiệt.', 'Tụ điện bên trong giữ điện sau khi tắt – chờ vài phút trước khi chạm vào cọc.'],
    },
    {
      id: 'cop', name: 'Cốp xe', cat: 'vo', shell: true, build: trunk, explode: [-0.35, 0.85, 0.25], after: ['khung'],
      desc: 'Hộc chứa đồ dưới yên (~22 lít).', specs: [['Dung tích', '~22 L']], tips: ['Lắp cốp trước khi lắp ốp thân.'],
    },
    {
      id: 'vo-than', name: 'Ốp thân sau', cat: 'vo', shell: true, build: rearBody, explode: [-0.45, 0.85, -0.55], after: ['cop', 'bo-dieu-khien', 'ro-le', 'giam-xoc-sau'],
      desc: 'Vỏ nhựa bao thân sau, che bộ điều khiển, rơ-le và đầu trên giảm xóc.', specs: [['Vật liệu', 'Nhựa ABS sơn']], tips: ['Đánh dấu vị trí từng vít – vít ốp thường có độ dài khác nhau.'],
    },
    {
      id: 'yen', name: 'Yên xe', cat: 'vo', shell: true, build: seat, explode: [-0.3, 1.25, 0], after: ['vo-than'],
      desc: 'Yên bản lề, mở để lấy đồ trong cốp.', specs: [['Kiểu', 'Bản lề trước']], tips: ['Lắp sau cùng ở phần thân sau.'],
    },
    {
      id: 'den-hau', name: 'Đèn hậu & đèn phanh', cat: 'dien', build: taillight, explode: [-0.85, 0.45, 0], after: ['vo-than', 'bo-day'],
      desc: 'Đèn hậu sáng mờ khi bật khoá, sáng mạnh khi bóp phanh (nhờ công tắc phanh).', specs: [['Nguồn', '12 V']], tips: ['Kiểm tra cả hai chế độ sáng sau khi lắp.'],
    },
    {
      id: 'cong-sac', name: 'Cổng sạc', cat: 'dien', build: () => chargePort({ pos: [-0.32, 0.6, -0.175], normal: -1 }), explode: [-0.75, 0.2, -0.95], after: ['vo-than', 'bo-day'],
      desc: 'Nhận điện từ bộ sạc ngoài và đưa vào pin qua BMS. Khi đang sạc, bộ điều khiển khoá không cho xe chạy.', specs: [['Bộ sạc', '400 W ngoài xe']], tips: ['Nắp cổng sạc phải đóng kín để đảm bảo chống nước.'],
    },
    {
      id: 'chan-chong', name: 'Chân chống nghiêng + công tắc', cat: 'khung', build: () => sideStand({ pivot: [0.0, 0.27, -0.12], foot: [-0.16, 0.012, -0.27] }), explode: [0, 0, -0.75], after: ['khung'],
      desc: 'Chân chống có công tắc an toàn: khi chân chống đang hạ, bộ điều khiển không cho động cơ chạy.', specs: [['Công tắc', 'Cảm biến từ / tiếp điểm']], tips: ['Nếu xe không chạy dù đã bật khoá – kiểm tra chân chống đã gạt lên chưa.'],
    },
  ],

  // ---- Dây điện (mô phỏng đường đi trong xe) ----
  wires: [
    { id: 'hv-pin-rl', from: 'pin', to: 'ro-le', type: 'hv', ch: 'hv', label: 'Cao áp: Pin → Rơ-le', pts: [[-0.03, 0.29, 0.05], [-0.07, 0.34, 0.05], [-0.1, 0.38, 0.01]] },
    { id: 'hv-rl-ctl', from: 'ro-le', to: 'bo-dieu-khien', type: 'hv', ch: 'hvMotor', label: 'Cao áp: Rơ-le → Bộ điều khiển', pts: [[-0.08, 0.43, 0], [-0.3, 0.48, 0.03], [-0.55, 0.53, 0.03], [-0.63, 0.54, 0.0]] },
    { id: 'hv-rl-dc', from: 'ro-le', to: 'dc-dc', type: 'hv', ch: 'hv', label: 'Cao áp: Rơ-le → DC-DC', pts: [[-0.08, 0.42, 0.03], [0.1, 0.37, 0.09], [0.3, 0.42, 0.09], [0.36, 0.6, 0.08]] },
    { id: 'ph-ctl-mt', from: 'bo-dieu-khien', to: 'dong-co', type: 'phase', ch: 'phase', label: '3 dây pha U/V/W: Bộ điều khiển → Động cơ', pts: [[-0.81, 0.54, 0], [-0.84, 0.45, 0.09], [-0.7, 0.3, 0.1], [-0.6, 0.25, 0.075]] },
    { id: 'lv-dc-head', from: 'dc-dc', to: 'den-pha', type: 'lv', ch: 'head', label: '12V: DC-DC → Đèn pha', pts: [[0.39, 0.64, 0.08], [0.5, 0.75, 0.05], [0.63, 0.83, 0]] },
    { id: 'lv-dc-dash', from: 'dc-dc', to: 'dong-ho', type: 'lv', ch: 'dash', label: '12V: DC-DC → Đồng hồ', pts: [[0.37, 0.64, 0.08], [0.41, 0.85, 0.03], [0.42, 1.0, 0.0], [steer(0.78)[0] - 0.05, steer(0.78)[1] + 0.1, 0]] },
    { id: 'lv-dc-horn', from: 'dc-dc', to: 'coi', type: 'lv', ch: 'horn', label: '12V: DC-DC → Còi', pts: [[0.39, 0.61, 0.08], [0.5, 0.61, 0.03], [0.58, 0.6, 0]] },
    { id: 'lv-dc-tail', from: 'dc-dc', to: 'den-hau', type: 'lv', ch: 'tail', label: '12V: DC-DC → Đèn hậu', pts: [[0.36, 0.6, 0.06], [0.25, 0.36, -0.09], [-0.1, 0.33, -0.09], [-0.5, 0.6, -0.08], [-0.97, 0.72, 0]] },
    { id: 'sg-thr', from: 'tay-ga', to: 'bo-dieu-khien', type: 'signal', ch: 'throttle', label: 'Tín hiệu tay ga → Bộ điều khiển', pts: [[steer(0.78)[0], steer(0.78)[1] + 0.04, 0.24], [0.42, 0.95, 0.12], [0.42, 0.6, 0.1], [0.3, 0.34, 0.11], [-0.1, 0.34, 0.11], [-0.5, 0.55, 0.08], [-0.63, 0.56, 0.02]] },
    { id: 'sg-brk', from: 'tay-lai', to: 'bo-dieu-khien', type: 'signal', ch: 'brake', label: 'Công tắc phanh → Bộ điều khiển (ngắt ga) & đèn phanh', pts: [[steer(0.78)[0] + 0.01, steer(0.78)[1] + 0.04, -0.2], [0.42, 0.95, -0.1], [0.42, 0.6, -0.08], [0.3, 0.34, -0.11], [-0.1, 0.34, -0.11], [-0.5, 0.55, -0.07], [-0.63, 0.56, -0.02]] },
    { id: 'sg-std', from: 'chan-chong', to: 'bo-dieu-khien', type: 'signal', ch: 'stand', label: 'Công tắc chân chống → Bộ điều khiển', pts: [[0.015, 0.28, -0.12], [-0.2, 0.38, -0.1], [-0.5, 0.53, -0.05], [-0.63, 0.55, -0.03]] },
    { id: 'sg-key', from: 'khoa', to: 'pin', type: 'signal', ch: 'key', label: 'Tín hiệu bật khoá → BMS', pts: [[0.41, 0.86, 0.08], [0.4, 0.6, 0.11], [0.3, 0.33, 0.1], [0.2, 0.22, 0.112]] },
    { id: 'sg-can', from: 'bo-dieu-khien', to: 'dong-ho', type: 'signal', ch: 'can', label: 'Đường truyền dữ liệu CAN: Bộ điều khiển ↔ Đồng hồ', pts: [[-0.63, 0.57, 0.03], [-0.3, 0.5, 0.06], [0.1, 0.36, 0.06], [0.4, 0.6, 0.05], [0.42, 0.95, 0.02], [steer(0.78)[0] - 0.04, steer(0.78)[1] + 0.1, 0.03]] },
    { id: 'ch-port-pin', from: 'cong-sac', to: 'pin', type: 'charge', ch: 'charge', label: 'Đường sạc: Cổng sạc → Pin', pts: [[-0.32, 0.6, -0.16], [-0.2, 0.45, -0.1], [0.0, 0.3, -0.08], [0.1, 0.25, -0.1]] },
  ],
};
