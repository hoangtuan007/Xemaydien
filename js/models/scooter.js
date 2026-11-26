// Bộ sinh mô hình XE TAY GA điện có tham số.
// Một cấu hình (kiểu dáng, kiểu truyền động, vị trí pin, màu sắc, thông số) -> một mẫu xe hoàn chỉnh
// gồm các bộ phận 3D, quan hệ thứ tự lắp và đường dây điện.
// Hình học là mô phỏng đơn giản hoá cho mục đích học tập, không phải bản vẽ kỹ thuật của hãng.
import * as THREE from 'three';
import {
  MAT, mat, box, cyl, rod, pipe, profile, smoothProfile, spring, wheel, rotor, sprocket, chainLoop, markLamp,
} from '../shapes.js';
import {
  wrap, batteryPack, controllerBox, dcdcBox, relayFuse, keyModule, horn, chargePort, throttleGrip, sideStand, mirrors,
} from './common.js';

// Kích thước cơ sở theo kiểu dáng (toạ độ X của tâm bánh trước/sau, bán kính lốp, bán kính vành, bề rộng lốp)
const STYLES = {
  modern: { fx: 0.63, rx: -0.6, r: 0.25, rimR: 0.16, width: 0.1, spokes: 5 },
  classic: { fx: 0.64, rx: -0.6, r: 0.27, rimR: 0.18, width: 0.1, spokes: 5 },
  sport: { fx: 0.68, rx: -0.64, r: 0.27, rimR: 0.18, width: 0.11, spokes: 6 },
  maxi: { fx: 0.7, rx: -0.68, r: 0.27, rimR: 0.18, width: 0.12, spokes: 5 },
};

// Biên dạng mặt bên (toạ độ gốc ứng với bánh trước x=0.63, bánh sau x=-0.6, lốp r=0.25)
const FRONT = {
  modern: [[0.33, 0.34], [0.36, 0.72], ['q', 0.38, 0.97, 0.47, 0.99], [0.56, 0.95], ['q', 0.7, 0.88, 0.71, 0.73], [0.66, 0.58], ['q', 0.56, 0.5, 0.47, 0.44], [0.42, 0.34]],
  classic: [[0.33, 0.34], [0.35, 0.75], ['q', 0.37, 1.0, 0.48, 0.99], ['q', 0.64, 0.97, 0.69, 0.8], ['q', 0.71, 0.62, 0.6, 0.5], [0.47, 0.42], [0.42, 0.34]],
  sport: [[0.33, 0.34], [0.37, 0.78], [0.42, 1.0], [0.52, 1.02], [0.73, 0.88], [0.74, 0.76], [0.66, 0.56], [0.5, 0.44], [0.42, 0.34]],
  maxi: [[0.32, 0.34], [0.35, 0.8], ['q', 0.38, 1.04, 0.5, 1.04], [0.6, 1.0], ['q', 0.77, 0.92, 0.76, 0.74], [0.68, 0.54], ['q', 0.56, 0.46, 0.46, 0.42], [0.42, 0.34]],
};
const REAR = {
  modern: [[-0.08, 0.34], [-0.11, 0.55], [-0.14, 0.73], [-0.5, 0.75], [-0.8, 0.79], ['q', -0.98, 0.81, -1.0, 0.72], [-0.95, 0.63], [-0.78, 0.6], ['q', -0.62, 0.56, -0.45, 0.5], [-0.3, 0.38]],
  classic: [[-0.08, 0.34], [-0.12, 0.6], [-0.15, 0.73], [-0.55, 0.75], ['q', -1.0, 0.78, -0.98, 0.64], ['q', -0.94, 0.57, -0.78, 0.58], ['q', -0.6, 0.55, -0.45, 0.5], [-0.3, 0.38]],
  sport: [[-0.08, 0.34], [-0.12, 0.6], [-0.15, 0.74], [-0.6, 0.77], [-0.92, 0.86], [-1.02, 0.84], [-0.96, 0.7], [-0.78, 0.6], [-0.45, 0.5], [-0.3, 0.38]],
  maxi: [[-0.08, 0.34], [-0.1, 0.6], [-0.13, 0.76], [-0.6, 0.79], [-0.95, 0.84], ['q', -1.04, 0.84, -1.04, 0.74], [-0.96, 0.62], [-0.8, 0.6], ['q', -0.62, 0.56, -0.45, 0.5], [-0.3, 0.38]],
};
const SEAT = {
  modern: [[-0.13, 0.74], ['q', -0.14, 0.82, -0.25, 0.82], [-0.5, 0.82], ['q', -0.6, 0.84, -0.66, 0.88], [-0.84, 0.88], ['q', -0.9, 0.86, -0.86, 0.79], [-0.15, 0.74]],
  classic: [[-0.13, 0.74], ['q', -0.14, 0.83, -0.26, 0.83], [-0.52, 0.83], ['q', -0.62, 0.84, -0.7, 0.86], [-0.86, 0.86], ['q', -0.92, 0.84, -0.88, 0.78], [-0.15, 0.75]],
  sport: [[-0.13, 0.75], ['q', -0.14, 0.83, -0.25, 0.83], [-0.55, 0.83], [-0.65, 0.88], [-0.9, 0.93], ['q', -0.95, 0.92, -0.92, 0.87], [-0.6, 0.8], [-0.15, 0.76]],
  maxi: [[-0.12, 0.77], ['q', -0.13, 0.86, -0.25, 0.86], [-0.55, 0.86], ['q', -0.62, 0.86, -0.66, 0.91], [-0.92, 0.91], ['q', -0.98, 0.89, -0.94, 0.82], [-0.14, 0.78]],
};
const TAIL = { modern: [-0.99, 0.72, 0.3], classic: [-0.995, 0.69, 0.1], sport: [-1.0, 0.78, 0.5], maxi: [-1.045, 0.77, 0.1] };

export function makeScooter(cfg) {
  const st = STYLES[cfg.style];
  const R = st.r, WID = st.width;
  const FW = [st.fx, R, 0], RW = [st.rx, R, 0];
  const dy = R - 0.25, dxr = st.rx + 0.6, dxf = st.fx - 0.63;
  const steer = (t) => [FW[0] - 0.267 * t, FW[1] + 0.964 * t];
  const TOP = steer(0.78);
  const BAR = [TOP[0], TOP[1] + 0.04];
  const col = cfg.colors;
  const drive = cfg.drive;
  const dual = cfg.battery === 'seat-dual';
  const PIVOT = drive === 'mid-chain' ? [-0.28, 0.33] : [-0.18, 0.31];
  const armZ = drive === 'hub' ? 0.1 : 0.125;
  const MOTOR = drive === 'mid-chain' ? [-0.14, 0.34, 0] : drive === 'side-belt' ? [RW[0] + 0.34, RW[1] + 0.03, -0.06] : [...RW];
  const legZ = WID / 2 + 0.035;
  // dời toạ độ biên dạng gốc sang kích thước của kiểu dáng này
  const mapPt = (x, y, kind) => {
    if (kind === 'rear') return [x < -0.4 ? x + dxr : x, y > 0.45 ? y + dy : y];
    return [x + dxf, y + dy];
  };
  const tx = (pts, kind) => pts.map((c) => (c[0] === 'q' ? ['q', ...mapPt(c[1], c[2], kind), ...mapPt(c[3], c[4], kind)] : mapPt(c[0], c[1], kind)));
  const bodyMat = () => MAT.paint(col.body);

  // ---------- Hình học các bộ phận ----------
  function frame() {
    const g = new THREE.Group();
    const s = MAT.steel();
    const h0 = steer(0.45), h1 = steer(0.7);
    g.add(rod([h0[0], h0[1], 0], [h1[0], h1[1], 0], 0.03, s));
    g.add(pipe([[h0[0], h0[1] + 0.05, 0], [0.44 + dxf * 0.5, 0.5, 0], [0.4, 0.34, 0]], 0.025, s));
    [-1, 1].forEach((k) => {
      const z = 0.11 * k;
      g.add(pipe([[0.42, 0.33, z * 0.4], [0.38, 0.29, z], [-0.1, 0.28, z], [-0.28, 0.42, z], [-0.55, 0.58 + dy, z], [-0.92 + dxr, 0.66 + dy, z * 0.8]], 0.016, s, { seg: 80 }));
    });
    [[0.38, 0.29], [-0.1, 0.28], [-0.55, 0.58 + dy], [-0.85 + dxr, 0.65 + dy]].forEach(([x, y]) => g.add(rod([x, y, -0.11], [x, y, 0.11], 0.012, s)));
    g.add(box(0.06, 0.06, 0.26, s, [PIVOT[0], PIVOT[1], 0], [0, 0, 0], 0.01));
    if (drive === 'mid-chain') g.add(box(0.14, 0.03, 0.22, s, [MOTOR[0], MOTOR[1] - 0.09, 0], [0, 0, 0], 0.006));
    return wrap(g);
  }

  function frontFork() {
    const g = new THREE.Group();
    const crown = steer(0.47);
    [-1, 1].forEach((k) => {
      const z = legZ * k;
      const mid = [...steer(0.2), z];
      g.add(rod([FW[0], FW[1], z], mid, 0.022, MAT.black()));
      g.add(rod(mid, [crown[0], crown[1], z], 0.016, cfg.style === 'sport' ? mat(0xc9a227, { metal: 0.8, rough: 0.3 }) : MAT.chrome()));
    });
    g.add(box(0.06, 0.03, legZ * 2 + 0.04, MAT.steel(), [crown[0], crown[1], 0], [0, 0, 0.27], 0.008));
    g.add(rod([crown[0], crown[1], 0], [TOP[0], TOP[1], 0], 0.018, MAT.steel()));
    g.add(cyl(0.012, legZ * 2 + 0.03, MAT.steel(), FW, 'z', 12));
    return wrap(g);
  }

  function frontWheel() {
    const g = new THREE.Group();
    const w = wheel({ r: R, rimR: st.rimR, width: WID, spokes: st.spokes, rimColor: col.rim });
    w.add(rotor(R * 0.44, WID / 2 + 0.012));
    w.position.set(...FW);
    w.userData.spin = 'front';
    g.add(w);
    return g;
  }

  function caliper(center, rr, z, angDeg, color) {
    const g = new THREE.Group();
    const a = (angDeg * Math.PI) / 180;
    g.add(box(0.07, 0.04, 0.035, mat(color, { metal: 0.4, rough: 0.4 }), [center[0] + Math.cos(a) * rr, center[1] + Math.sin(a) * rr, z], [0, 0, a + Math.PI / 2], 0.008));
    return wrap(g);
  }

  function frontFender() {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.03, 8, 40, Math.PI * 0.62), bodyMat());
    m.scale.z = 2.2 + (WID - 0.1) * 10;
    m.rotation.z = Math.PI * 0.22;
    m.position.set(...FW);
    m.castShadow = true;
    g.add(m);
    return wrap(g);
  }

  function handlebar() {
    const g = new THREE.Group();
    const [x, y] = BAR;
    g.add(rod([x, y, -0.3], [x, y, 0.26], 0.012, MAT.steel()));
    g.add(cyl(0.017, 0.11, MAT.rubber(), [x, y, -0.33], 'z', 18));
    const cover = cfg.style === 'classic'
      ? [[x - 0.11, y - 0.05], ['q', x - 0.1, y + 0.07, x + 0.02, y + 0.07], ['q', x + 0.12, y + 0.05, x + 0.1, y - 0.05]]
      : [[x - 0.12, y - 0.04], [x - 0.1, y + 0.05], ['q', x, y + 0.08, x + 0.12, y + 0.03], [x + 0.1, y - 0.05]];
    g.add(smoothProfile(cover, cfg.style === 'maxi' ? 0.46 : 0.4, MAT.paint(col.trim), { bevel: 0.025 }));
    [-1, 1].forEach((k) => {
      g.add(rod([x + 0.02, y + 0.01, k * 0.2], [x + 0.07, y - 0.005, k * 0.36], 0.007, MAT.alu()));
      g.add(box(0.035, 0.03, 0.03, MAT.black(), [x + 0.01, y, k * 0.2], [0, 0, 0], 0.005));
    });
    g.add(box(0.05, 0.05, 0.04, MAT.black(), [x, y, -0.24], [0, 0, 0], 0.01));
    return wrap(g);
  }

  function dashboard() {
    const g = new THREE.Group();
    const p = [BAR[0] - 0.05, BAR[1] + 0.065, 0];
    if (cfg.style === 'classic') {
      const b = cyl(0.06, 0.025, MAT.black(), p, 'y', 32); b.rotation.z = 0.6; g.add(b);
      const f = markLamp(cyl(0.05, 0.004, MAT.lamp(0x0d1b2a), [p[0] - 0.008, p[1] + 0.012, 0], 'y', 32), 'dash', 0x80ffdb); f.rotation.z = 0.6; g.add(f);
    } else {
      const w = cfg.style === 'modern' ? 0.2 : 0.26;
      g.add(box(0.06, 0.02, w, MAT.black(), p, [0, 0, 0.6], 0.008));
      g.add(markLamp(box(0.045, 0.004, w * 0.86, MAT.lamp(0x0d1b2a), [p[0] - 0.006, p[1] + 0.009, 0], [0, 0, 0.6], 0.001), 'dash', 0x4cc9f0));
    }
    return wrap(g);
  }

  const headPort = (() => {
    if (cfg.headlight === 'round') return [BAR[0] + 0.1, BAR[1] - 0.01, 0];
    const [x, y] = mapPt(0.66, 0.83, 'front');
    return [x, y, 0];
  })();
  function headlight() {
    const g = new THREE.Group();
    const lampMat = () => MAT.lamp(0xe8f1ff);
    if (cfg.headlight === 'round') {
      const c = [BAR[0] + 0.13, BAR[1] - 0.01, 0];
      g.add(cyl(0.075, 0.07, MAT.paint(col.trim), c, 'x', 36));
      g.add(cyl(0.078, 0.012, MAT.chrome(), [c[0] + 0.035, c[1], 0], 'x', 36));
      g.add(markLamp(cyl(0.066, 0.01, lampMat(), [c[0] + 0.04, c[1], 0], 'x', 36), 'head', 0xffffff));
    } else if (cfg.headlight === 'twin') {
      const [x, y] = mapPt(0.715, 0.82, 'front');
      [-1, 1].forEach((k) => {
        g.add(box(0.03, 0.06, 0.11, MAT.black(), [x - 0.01, y, k * 0.08], [0, k * 0.3, -0.25], 0.01));
        g.add(markLamp(box(0.008, 0.045, 0.1, lampMat(), [x + 0.008, y, k * 0.08], [0, k * 0.3, -0.25], 0.004), 'head', 0xffffff));
      });
      g.add(markLamp(box(0.01, 0.012, 0.06, lampMat(), [x + 0.01, y - 0.09, 0], [0, 0, -0.3], 0.004), 'head', 0xbfe3ff));
    } else if (cfg.headlight === 'bar') {
      const [x, y] = mapPt(0.735, 0.8, 'front');
      g.add(box(0.05, 0.07, 0.34, MAT.black(), [x - 0.015, y, 0], [0, 0, -0.2], 0.02));
      g.add(markLamp(box(0.01, 0.045, 0.32, lampMat(), [x + 0.01, y, 0], [0, 0, -0.2], 0.008), 'head', 0xffffff));
    } else {
      const [x, y] = mapPt(0.645, 0.84, 'front');
      g.add(box(0.08, 0.09, 0.24, MAT.black(), [x, y, 0], [0, 0, -0.35], 0.02));
      g.add(markLamp(box(0.012, 0.07, 0.21, lampMat(), [x + 0.045, y + 0.015, 0], [0, 0, -0.35], 0.01), 'head', 0xffffff));
      [-1, 1].forEach((k) => g.add(markLamp(box(0.01, 0.012, 0.12, lampMat(), [x + 0.05, y - 0.08, k * 0.07], [0, k * 0.35, -0.2], 0.004), 'head', 0xbfe3ff)));
    }
    return wrap(g);
  }

  function frontCover() {
    const g = new THREE.Group();
    const wide = cfg.style === 'maxi' ? 0.44 : cfg.style === 'sport' ? 0.4 : 0.38;
    g.add(smoothProfile(tx(FRONT[cfg.style], 'front'), wide, bodyMat(), { bevel: 0.035 }));
    g.add(box(0.05, 0.4, wide - 0.02, MAT.plastic(col.inner ?? 0x2b2d33), [0.36 + dxf, 0.55 + dy, 0], [0, 0, -0.08], 0.02));
    if (cfg.style === 'classic') {
      [-1, 1].forEach((k) => g.add(box(0.2, 0.01, 0.004, MAT.chrome(), [0.6 + dxf, 0.62 + dy, k * (wide / 2 + 0.002)], [0, 0, -0.9], 0.002)));
    }
    if (col.stripe) [-1, 1].forEach((k) => g.add(box(0.2, 0.02, 0.004, MAT.paint(col.stripe), [0.6 + dxf, 0.7 + dy, k * (wide / 2 + 0.002)], [0, 0, -0.6], 0.002)));
    return wrap(g);
  }

  function floorboard() {
    const g = new THREE.Group();
    const w = cfg.style === 'maxi' ? 0.4 : 0.36;
    g.add(box(0.5, 0.025, w, MAT.plastic(0x2b2d33), [0.14, 0.335, 0], [0, 0, 0], 0.01));
    for (let i = 0; i < 7; i++) g.add(box(0.44, 0.006, 0.012, MAT.rubber(), [0.14, 0.35, -0.15 + i * 0.05], [0, 0, 0], 0.002));
    [-1, 1].forEach((k) => g.add(profile([[-0.12, 0.33], [0.4, 0.33], [0.36, 0.17], [-0.08, 0.17]], 0.02, bodyMat(), { zc: k * (w / 2 - 0.01), bevel: 0.006 })));
    return wrap(g);
  }

  const TRUNK = dual ? { c: [-0.56 + dxr * 0.5, 0.6 + dy], w: 0.26 } : cfg.style === 'maxi' ? { c: [-0.42, 0.6 + dy], w: 0.5 } : { c: [-0.4, 0.58 + dy], w: 0.42 };
  function trunk() {
    const g = new THREE.Group();
    const m = MAT.plastic(0x3a3d44);
    const { c, w } = TRUNK;
    const d = cfg.style === 'maxi' ? 0.28 : 0.24;
    g.add(box(w, 0.012, d, m, [c[0], c[1] - 0.12, 0], [0, 0, 0], 0.004));
    [-1, 1].forEach((k) => g.add(box(w, 0.25, 0.01, m, [c[0], c[1], k * d / 2], [0, 0, 0], 0.003)));
    [-1, 1].forEach((k) => g.add(box(0.01, 0.25, d, m, [c[0] + k * w / 2, c[1], 0], [0, 0, 0], 0.003)));
    return wrap(g);
  }

  function rearBody() {
    const g = new THREE.Group();
    const wide = cfg.style === 'maxi' ? 0.38 : 0.34;
    g.add(smoothProfile(tx(REAR[cfg.style], 'rear'), wide, bodyMat(), { bevel: 0.03 }));
    const trim = cfg.style === 'classic' ? MAT.chrome() : col.stripe ? MAT.paint(col.stripe) : MAT.chrome();
    [-1, 1].forEach((k) => g.add(box(0.6, cfg.style === 'sport' ? 0.03 : 0.012, 0.004, trim, [-0.5 + dxr * 0.5, 0.66 + dy, k * (wide / 2 + 0.002)], [0, 0, cfg.style === 'sport' ? 0.14 : 0.06], 0.002)));
    const ty = (cfg.style === 'sport' ? 0.9 : 0.84) + dy;
    g.add(pipe([[-0.62 + dxr, ty - 0.02, -0.14], [-0.85 + dxr, ty, -0.12], [-0.9 + dxr, ty, 0], [-0.85 + dxr, ty, 0.12], [-0.62 + dxr, ty - 0.02, 0.14]], 0.012, cfg.style === 'classic' ? MAT.chrome() : MAT.black()));
    return wrap(g);
  }

  function seat() {
    const g = new THREE.Group();
    g.add(smoothProfile(tx(SEAT[cfg.style], 'rear'), cfg.style === 'maxi' ? 0.33 : 0.3, mat(col.seat, { rough: 0.8 }), { bevel: 0.03 }));
    return wrap(g);
  }

  const tailP = (() => { const [x, y, a] = TAIL[cfg.style]; const [mx, my] = mapPt(x, y, 'rear'); return [mx, my, a]; })();
  function taillight() {
    const g = new THREE.Group();
    const [x, y, a] = tailP;
    const w = cfg.style === 'maxi' ? 0.28 : 0.2;
    g.add(box(0.04, 0.05, w, MAT.black(), [x, y, 0], [0, 0, a], 0.012));
    g.add(markLamp(box(0.008, 0.035, w - 0.02, MAT.lamp(0x5a0000), [x - 0.022, y + 0.005, 0], [0, 0, a], 0.004), 'tail', 0xff2a2a));
    return wrap(g);
  }

  function swingarm() {
    const g = new THREE.Group();
    const s = mat(0x2b2f36, { metal: 0.6, rough: 0.35 });
    const ang = Math.atan2(PIVOT[1] - RW[1], PIVOT[0] - RW[0]);
    const len = Math.hypot(PIVOT[0] - RW[0], PIVOT[1] - RW[1]);
    [-1, 1].forEach((k) => g.add(box(len, 0.045, 0.025, s, [(PIVOT[0] + RW[0]) / 2, (PIVOT[1] + RW[1]) / 2, k * armZ], [0, 0, ang], 0.008)));
    g.add(cyl(0.025, armZ * 2 + 0.04, s, [PIVOT[0], PIVOT[1], 0], 'z', 16));
    g.add(cyl(0.012, armZ * 2 + 0.04, MAT.steel(), RW, 'z', 12));
    return wrap(g);
  }

  function hubMotorWheel() {
    const g = new THREE.Group();
    const w = wheel({ r: R, rimR: st.rimR, width: WID, spokes: 0, hubR: 0.13, hubW: 0.12, rimColor: col.rim });
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
    g.add(cyl(0.014, 0.24, MAT.steel(), RW, 'z', 12));
    return g;
  }

  const BELT_Z = -0.155;
  function rearWheel() {
    const g = new THREE.Group();
    const w = wheel({ r: R, rimR: st.rimR, width: WID, spokes: st.spokes, rimColor: col.rim });
    if (drive === 'side-belt') {
      w.add(cyl(0.112, 0.03, mat(0x8d99ae, { metal: 0.85, rough: 0.3 }), [0, 0, BELT_Z], 'z', 48));
      w.add(cyl(0.03, Math.abs(BELT_Z) * 2 - 0.12, MAT.alu(), [0, 0, BELT_Z / 2], 'z', 16));
      w.add(rotor(0.1, WID / 2 + 0.015));
    } else {
      w.add(sprocket(0.11, 0.1, 40, mat(0x8d99ae, { metal: 0.85, rough: 0.3 })));
      w.add(rotor(0.1, -(WID / 2 + 0.015)));
    }
    w.position.set(...RW);
    w.userData.spin = 'rear';
    g.add(w);
    return g;
  }

  function sideMotor() {
    const g = new THREE.Group();
    const shell = mat(0x3a3f47, { metal: 0.7, rough: 0.35 });
    g.add(cyl(0.075, 0.12, shell, MOTOR, 'z', 36));
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.add(box(0.01, 0.012, 0.11, mat(0x555b63, { metal: 0.7 }), [MOTOR[0] + Math.cos(a) * 0.076, MOTOR[1] + Math.sin(a) * 0.076, MOTOR[2]], [0, 0, a], 0));
    }
    g.add(cyl(0.05, 0.124, mat(0xff7a1a, { metal: 0.3 }), MOTOR, 'z', 24));
    const pul = new THREE.Group();
    pul.position.set(MOTOR[0], MOTOR[1], BELT_Z);
    pul.add(cyl(0.037, 0.03, mat(0x8d99ae, { metal: 0.85 }), [0, 0, 0], 'z', 24));
    pul.add(box(0.05, 0.008, 0.032, MAT.steel(), [0, 0, 0], [0, 0, 0], 0));
    pul.userData.spin = 'motor';
    g.add(pul);
    g.add(cyl(0.012, Math.abs(BELT_Z - MOTOR[2]), MAT.steel(), [MOTOR[0], MOTOR[1], (BELT_Z + MOTOR[2]) / 2], 'z', 12));
    g.add(box(0.14, 0.02, 0.06, MAT.steel(), [MOTOR[0], MOTOR[1] - 0.07, -armZ], [0, 0, 0], 0.004));
    return wrap(g);
  }

  function midMotor() {
    const g = new THREE.Group();
    const shell = mat(0x1d1d1f, { metal: 0.6, rough: 0.35 });
    g.add(cyl(0.085, 0.15, shell, MOTOR, 'z', 40));
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.add(box(0.012, 0.012, 0.14, mat(0x34373d, { metal: 0.6 }), [MOTOR[0] + Math.cos(a) * 0.085, MOTOR[1] + Math.sin(a) * 0.085, 0], [0, 0, a], 0));
    }
    g.add(cyl(0.06, 0.154, mat(col.motor ?? 0xc9a227, { metal: 0.7, rough: 0.3 }), MOTOR, 'z', 32));
    const r = new THREE.Group();
    r.position.set(...MOTOR);
    r.add(sprocket(0.045, 0.1, 15, mat(0x8d99ae, { metal: 0.85 })));
    r.add(cyl(0.012, 0.04, MAT.steel(), [0, 0, 0.09], 'z', 12));
    r.userData.spin = 'motor';
    g.add(r);
    return wrap(g);
  }

  function belt() {
    return wrap(chainLoop([MOTOR[0], MOTOR[1]], 0.04, [RW[0], RW[1]], 0.115, BELT_Z, mat(0x18181a, { rough: 0.8 }), 0.009));
  }
  function chain() {
    return wrap(chainLoop([MOTOR[0], MOTOR[1]], 0.047, [RW[0], RW[1]], 0.112, 0.1, mat(0x9a9a9a, { metal: 0.9, rough: 0.35 })));
  }

  function rearShocks() {
    const g = new THREE.Group();
    const top = 0.58 + dy;
    [-1, 1].forEach((k) => {
      if (drive === 'side-belt' && k < 0) return; // xe động cơ bên chỉ có 1 giảm xóc bên phải
      const z = (armZ + 0.025) * k;
      const a = [RW[0] + 0.04, RW[1] + 0.02, z], b = [RW[0] + 0.1, top, z];
      g.add(rod(a, b, 0.012, MAT.chrome()));
      g.add(spring([a[0] + 0.006, a[1] + 0.05, z], [b[0] - 0.006, b[1] - 0.04, z], 0.024, 0.0045, 9, mat(col.spring ?? 0xe63946, { metal: 0.5 })));
      g.add(cyl(0.02, 0.03, MAT.black(), a, 'z', 12));
      g.add(cyl(0.02, 0.03, MAT.black(), b, 'z', 12));
    });
    return wrap(g);
  }

  // ---------- Bó dây & định tuyến dây ----------
  const spine = new THREE.CatmullRomCurve3([
    [BAR[0], BAR[1] - 0.03, 0], [0.42 + dxf, 0.85 + dy, 0.04], [0.41 + dxf, 0.6, 0.06], [0.33, 0.36, 0.07], [0.0, 0.34, 0.08], [-0.3, 0.47 + dy * 0.5, 0.06], [-0.62 + dxr * 0.5, 0.6 + dy, 0.03],
  ].map((p) => new THREE.Vector3(...p)));
  const dense = spine.getSpacedPoints(36);
  function harness() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TubeGeometry(spine, 90, 0.011, 8, false), mat(0x111111, { rough: 0.9 })));
    return wrap(g);
  }
  const nearest = (p) => { let bi = 0, bd = Infinity; dense.forEach((q, i) => { const d = q.distanceTo(new THREE.Vector3(...p)); if (d < bd) { bd = d; bi = i; } }); return bi; };
  function route(a, b, lane = 0) {
    const ia = nearest(a), ib = nearest(b);
    let seg = ia <= ib ? dense.slice(ia, ib + 1) : dense.slice(ib, ia + 1).reverse();
    seg = seg.filter((_, i) => i % 3 === 1).map((p) => [p.x, p.y + lane * 0.004, p.z + lane * 0.008]);
    return [a, ...seg, b];
  }

  // ---------- Vị trí cổng nối ----------
  const BATS = dual
    ? [{ id: 'pin', pos: [-0.24, 0.56 + dy, -0.055], size: [0.2, 0.24, 0.095] }, { id: 'pin-2', pos: [-0.24, 0.56 + dy, 0.055], size: [0.2, 0.24, 0.095] }]
    : [{ id: 'pin', ...(cfg.battery === 'floor-big' ? { pos: [0.15, 0.21, 0], size: [0.46, 0.13, 0.21] } : { pos: [0.14, 0.215, 0], size: [0.42, 0.12, 0.2] }) }];
  const batTerm = (b) => (dual ? [b.pos[0] + 0.06, b.pos[1] - b.size[1] / 2, b.pos[2]] : [b.pos[0] - b.size[0] / 2 + 0.04, b.pos[1] + b.size[1] / 2 + 0.012, 0.05]);
  const batBms = (b) => (dual ? [b.pos[0] + 0.03, b.pos[1] - 0.04, b.pos[2] + Math.sign(b.pos[2]) * 0.05] : [b.pos[0] + b.size[0] * 0.15, b.pos[1], b.size[2] / 2 + 0.012]);
  const CTL = [-0.72 + dxr * 0.5, 0.63 + dy, 0];
  const P = {
    relay: [-0.08, 0.43, 0],
    ctlSig: [CTL[0] + 0.095, CTL[1], 0.0],
    ctlPh: [CTL[0] - 0.095, CTL[1] - 0.01, 0],
    dcdc: [0.37 + dxf * 0.5, 0.62 + dy * 0.5, 0.08],
    key: [steer(0.47)[0] - 0.07, 0.86 + dy, 0.09],
    horn: [FW[0] - 0.03, 0.6 + dy * 1.5, 0],
    dash: [BAR[0] - 0.05, BAR[1] + 0.065, 0],
    thr: [BAR[0], BAR[1], 0.24],
    brk: [BAR[0] + 0.01, BAR[1], -0.2],
    stand: [0.015, 0.28, -0.12],
    charge: [-0.32, 0.62 + dy, -(cfg.style === 'maxi' ? 0.195 : 0.175)],
    motor: drive === 'hub' ? [RW[0], RW[1], 0.075] : drive === 'side-belt' ? [MOTOR[0], MOTOR[1] + 0.075, MOTOR[2]] : [MOTOR[0] + 0.03, MOTOR[1] + 0.085, 0.05],
  };
  const phasePts = drive === 'hub'
    ? [P.ctlPh, [P.ctlPh[0] - 0.03, 0.5 + dy, 0.09], [RW[0] - 0.1, RW[1] + 0.06, 0.1], P.motor]
    : drive === 'side-belt'
      ? [P.ctlPh, [P.ctlPh[0] + 0.05, 0.52 + dy, -0.06], [MOTOR[0] - 0.02, MOTOR[1] + 0.14, -0.05], P.motor]
      : [P.ctlPh, [-0.6, 0.52, 0.07], [-0.3, 0.44, 0.08], P.motor];

  // ---------- Danh sách bộ phận ----------
  const parts = [];
  const add = (p) => parts.push({ specs: [], tips: [], ...p });
  const motorName = drive === 'hub' ? 'Động cơ in-hub + bánh sau' : drive === 'side-belt' ? 'Động cơ đặt bên (side motor)' : 'Động cơ đặt giữa + nhông trước';

  add({ id: 'khung', name: 'Khung xe', cat: 'khung', build: frame, explode: [0, 0, -0.7], after: [],
    desc: 'Khung thép ống dạng underbone – "xương sống" chịu lực, nơi mọi bộ phận khác bắt vào.', specs: [['Kiểu', 'Underbone, sàn để chân phẳng']], tips: ['Lắp đầu tiên, tháo sau cùng.'] });
  add({ id: 'bo-day', name: 'Bó dây điện (harness)', cat: 'dien', build: harness, explode: [0, 1.4, -0.6], after: ['khung'],
    desc: 'Ống gen bọc toàn bộ dây nối giữa pin, bộ điều khiển, đèn, đồng hồ và các công tắc.', tips: ['Đi dây theo khung, tránh mép sắc và chỗ nóng.'] });
  add({ id: 'cang-truoc', name: 'Phuộc trước & cổ lái', cat: 'khung', build: frontFork, explode: [0.75, 0.25, 0], after: ['khung'],
    desc: 'Giảm xóc ống lồng thuỷ lực, nối bánh trước với cổ lái để đánh lái và hấp thụ dao động.', specs: [['Kiểu', 'Ống lồng, thuỷ lực']] });
  add({ id: 'banh-truoc', name: `Bánh trước ${cfg.wheelInch}" + đĩa phanh`, cat: 'banh', build: frontWheel, explode: [1.25, 0, 0.45], after: ['cang-truoc'],
    desc: `Vành hợp kim ${cfg.wheelInch} inch, lốp không săm, đĩa phanh bắt trên moay-ơ.`, specs: [['Vành', `${cfg.wheelInch} inch`]] });
  add({ id: 'phanh-truoc', name: 'Ngàm phanh đĩa trước', cat: 'banh', build: () => caliper(FW, R * 0.4, WID / 2 + 0.014, 125, 0xc1121f), explode: [0.95, 0.1, 0.8], after: ['banh-truoc'],
    desc: 'Ngàm phanh thuỷ lực kẹp đĩa phanh trước' + (cfg.abs ? ', có ABS chống bó cứng.' : '.'), specs: [['Kiểu', cfg.abs ? 'Đĩa thuỷ lực + ABS' : 'Đĩa thuỷ lực']] });
  add({ id: 'chan-bun-truoc', name: 'Chắn bùn trước', cat: 'vo', shell: true, build: frontFender, explode: [0.9, 0.6, 0.3], after: ['cang-truoc'],
    desc: 'Che bùn nước bắn lên từ bánh trước.' });
  add({ id: 'tay-lai', name: 'Ghi đông, tay phanh & công tắc', cat: 'dieukhien', build: handlebar, explode: [0.2, 0.75, -0.2], after: ['cang-truoc', 'bo-day'],
    desc: 'Ghi đông có hai tay phanh (mỗi tay có công tắc báo phanh) và cụm công tắc còi/đèn/xi nhan.', specs: [['Công tắc phanh', 'Đóng khi bóp → ngắt ga']] });
  add({ id: 'tay-ga', name: 'Tay ga điện (cảm biến Hall)', cat: 'dieukhien', build: () => throttleGrip({ pos: [BAR[0], BAR[1], 0.26] }), explode: [0.25, 0.85, 0.55], after: ['tay-lai'],
    desc: 'Xoay tay ga làm nam châm quay qua cảm biến Hall → điện áp tín hiệu 0,8–4,2 V gửi về bộ điều khiển.', specs: [['Tín hiệu', 'Analog 0,8 – 4,2 V']] });
  add({ id: 'guong', name: 'Gương chiếu hậu', cat: 'vo', build: () => mirrors({ base: [BAR[0], BAR[1] + 0.01, 0], z: 0.22, round: cfg.style === 'classic' }), explode: [0, 1.05, 0], after: ['tay-lai'],
    desc: 'Cặp gương bắt ren vào ghi đông.' });
  add({ id: 'dong-ho', name: cfg.dashName ?? 'Đồng hồ LCD', cat: 'dieukhien', build: dashboard, explode: [0.55, 1.0, 0.3], after: ['tay-lai', 'bo-day'],
    desc: 'Hiển thị tốc độ, % pin, chế độ lái, mã lỗi; nhận dữ liệu từ bộ điều khiển qua CAN.', specs: [['Kết nối', 'CAN / UART'], ['Nguồn', '12 V']] });
  add({ id: 'den-pha', name: 'Đèn pha LED', cat: 'dien', build: headlight, explode: [1.05, 0.65, 0.25], after: cfg.headlight === 'round' ? ['tay-lai', 'bo-day'] : ['khung', 'bo-day'],
    desc: cfg.headlight === 'round' ? 'Đèn pha tròn cổ điển gắn trên ốp đầu, quay theo tay lái.' : 'Cụm đèn pha LED trên mặt nạ trước.', specs: [['Nguồn', '12 V DC']] });
  add({ id: 'coi', name: 'Còi điện', cat: 'dien', build: () => horn({ pos: P.horn }), explode: [1.05, 0.2, 0.75], after: ['khung', 'bo-day'], desc: 'Còi 12 V.' });
  add({ id: 'khoa', name: cfg.keyName ?? 'Khoá điện / Smartkey', cat: 'dien', build: () => keyModule({ pos: P.key, rot: [0, Math.PI, 0] }), explode: [0.4, 0.55, 0.95], after: ['khung', 'bo-day'],
    desc: 'Bật khoá → tín hiệu đánh thức tới BMS → rơ-le đóng, cấp điện cao áp.', tips: ['Luôn tắt khoá trước khi tháo bộ phận điện.'] });
  add({ id: 'dc-dc', name: 'Bộ chuyển đổi DC-DC', cat: 'dien', build: () => dcdcBox({ pos: P.dcdc }), explode: [0.35, 0.3, 1.05], after: ['khung', 'bo-day'],
    desc: `Hạ điện áp pin (~${cfg.voltage} V) xuống 12 V cho đèn, còi, đồng hồ – thay cho ắc quy 12 V của xe xăng.`, specs: [['Ra', '12 V DC']] });
  add({ id: 'op-dau', name: 'Ốp đầu & yếm trước', cat: 'vo', shell: true, build: frontCover, explode: [1.15, 0.7, -0.45],
    after: ['cang-truoc', 'coi', 'khoa', 'dc-dc', ...(cfg.headlight === 'round' ? [] : ['den-pha'])],
    desc: 'Mặt nạ và yếm bao phía trước, che còi, khoá điện và DC-DC.' });

  BATS.forEach((b, i) => add({
    id: b.id, name: dual ? `Pin rời số ${i + 1}` : cfg.batteryName, cat: 'dien',
    build: () => batteryPack({ pos: b.pos, size: b.size, handle: dual, bmsSide: dual ? Math.sign(b.pos[2]) : 1, color: cfg.batteryColor ?? 0x23324a }),
    explode: dual ? [-0.1 + i * 0.1, 0.55 + i * 0.45, 1.0 + i * 0.25] : [0.15, 0.05, 1.15], after: ['khung', 'bo-day'],
    desc: cfg.batteryDesc, specs: cfg.batterySpecs,
    tips: dual ? ['Pin rời: mở yên là nhấc ra được, mang lên nhà để sạc.', 'Xe vẫn chạy được với 1 pin, quãng đường giảm khoảng một nửa.'] : ['⚠ Điện áp cao: tháo cực âm (–) trước, lắp cực âm sau cùng.'],
  }));
  add({ id: 'ro-le', name: 'Rơ-le nguồn & cầu chì', cat: 'dien', build: () => relayFuse({ pos: [-0.1, 0.4, 0] }), explode: [-0.1, 0.25, 0.9], after: ['khung', 'bo-day'],
    desc: 'Rơ-le (contactor) đóng/ngắt đường cao áp từ pin; hộp cầu chì bảo vệ các nhánh khi chập mạch.' });
  add({ id: 'san-de-chan', name: 'Sàn để chân', cat: 'vo', shell: true, build: floorboard, explode: [0.1, 0.0, -0.95], after: dual ? ['khung'] : ['khung', 'pin'],
    desc: dual ? 'Tấm sàn để chân (khoang dưới sàn trống, pin nằm dưới yên).' : 'Tấm sàn và ốp hông bao kín khoang pin bên dưới.' });
  add({ id: 'gap-sau', name: 'Càng sau (gắp)', cat: 'khung', build: swingarm, explode: [-0.55, 0, -0.75], after: ['khung'],
    desc: 'Tay đòn nối trục bánh sau với khung qua chốt xoay, cho bánh sau dao động lên xuống.' });

  if (drive === 'hub') {
    add({ id: 'dong-co', name: motorName, cat: 'dongco', build: hubMotorWheel, explode: [-0.95, 0, 0.65], after: ['gap-sau', 'bo-day'],
      desc: 'Động cơ BLDC nằm trong moay-ơ bánh sau: stator cố định trên trục, vỏ bánh gắn nam châm quay quanh. Truyền động trực tiếp, không xích, không dây đai.',
      specs: cfg.motorSpecs, tips: ['Nối sai thứ tự 3 pha sẽ làm động cơ quay giật hoặc quay ngược.'] });
    add({ id: 'phanh-sau', name: 'Cụm phanh sau', cat: 'banh', build: () => caliper(RW, 0.09, -0.07, 60, 0x343a40), explode: [-0.95, 0.15, -0.65], after: ['dong-co'], desc: 'Ngàm phanh kẹp đĩa phía sau.' });
  } else {
    add({ id: 'banh-sau', name: `Bánh sau ${cfg.wheelInch}" + ${drive === 'side-belt' ? 'puly' : 'nhông sau'}`, cat: 'banh', build: rearWheel, explode: [-1.0, 0, 0.65], after: ['gap-sau'],
      desc: drive === 'side-belt' ? 'Bánh sau có puly lớn bên trái nhận lực từ dây đai.' : 'Bánh sau có nhông sau (nhông tải) bên phải nhận lực từ xích.' });
    add({ id: 'dong-co', name: motorName, cat: 'dongco', build: drive === 'side-belt' ? sideMotor : midMotor,
      explode: drive === 'side-belt' ? [-0.15, 0.1, -0.95] : [0.3, 0, 1.0], after: drive === 'side-belt' ? ['gap-sau', 'bo-day'] : ['khung', 'bo-day'],
      desc: drive === 'side-belt'
        ? 'Động cơ đặt cạnh bánh sau, gắn trên càng – quay theo càng khi xe nhún. Lực truyền qua dây đai răng tới puly bánh sau, êm và không cần tra dầu.'
        : 'Động cơ treo giữa khung, ngay trước chốt càng. Trục ra gắn nhông trước kéo xích – khối lượng dồn về giữa xe, bánh sau nhẹ.',
      specs: cfg.motorSpecs, tips: ['Nối sai thứ tự 3 pha sẽ làm động cơ quay giật hoặc quay ngược.'] });
    if (drive === 'side-belt') {
      add({ id: 'day-dai', name: 'Dây đai truyền động', cat: 'dongco', build: belt, explode: [-0.45, 0.05, -1.15], after: ['dong-co', 'banh-sau'],
        desc: 'Dây đai răng bằng cao su lõi sợi, truyền lực từ puly động cơ sang puly bánh – êm, sạch, không cần bôi trơn.', specs: [['Tỉ số (mô phỏng)', `≈ 1 : ${cfg.ratio}`]] });
    } else {
      add({ id: 'xich', name: 'Xích tải', cat: 'dongco', build: chain, explode: [-0.35, 0, 0.85], after: ['dong-co', 'banh-sau'],
        desc: 'Truyền mô-men từ nhông trước sang nhông sau, giảm tốc và tăng lực kéo.', specs: [['Tỉ số (mô phỏng)', `≈ 1 : ${cfg.ratio}`]] });
    }
    add({ id: 'phanh-sau', name: 'Cụm phanh sau', cat: 'banh', build: () => caliper(RW, 0.09, drive === 'side-belt' ? WID / 2 + 0.017 : -(WID / 2 + 0.017), 60, 0x343a40), explode: [-0.95, 0.15, -0.65], after: ['banh-sau'], desc: 'Ngàm phanh kẹp đĩa phía sau.' });
  }
  add({ id: 'giam-xoc-sau', name: drive === 'side-belt' ? 'Giảm xóc sau (đơn)' : 'Giảm xóc sau (đôi)', cat: 'khung', build: rearShocks, explode: [-0.6, 0.65, 0.45], after: ['gap-sau', 'khung'],
    desc: 'Lò xo trụ kết hợp giảm chấn dầu, nối càng sau với khung.' });
  add({ id: 'bo-dieu-khien', name: 'Bộ điều khiển động cơ (controller)', cat: 'dongco', build: () => controllerBox({ pos: CTL }), explode: [-0.65, 0.35, 0.95], after: ['khung', 'bo-day'],
    desc: '"Bộ não" của hệ truyền động: đọc tay ga, phanh, chân chống, cảm biến Hall rồi băm dòng DC từ pin thành dòng 3 pha (PWM) cấp cho động cơ.',
    specs: [['Vào', `DC ~${cfg.voltage} V`], ['Ra', '3 pha U/V/W']], tips: ['Tụ điện bên trong giữ điện sau khi tắt – chờ vài phút trước khi chạm cọc.'] });
  add({ id: 'cop', name: 'Cốp xe', cat: 'vo', shell: true, build: trunk, explode: [-0.35, 0.85, 0.25], after: ['khung'],
    desc: `Hộc chứa đồ dưới yên${cfg.trunk ? ` (${cfg.trunk})` : ''}.` });
  add({ id: 'vo-than', name: 'Ốp thân sau', cat: 'vo', shell: true, build: rearBody, explode: [-0.45, 0.85, -0.55], after: ['cop', 'bo-dieu-khien', 'ro-le', 'giam-xoc-sau'],
    desc: 'Vỏ nhựa bao thân sau, che bộ điều khiển, rơ-le và đầu trên giảm xóc.' });
  add({ id: 'yen', name: 'Yên xe', cat: 'vo', shell: true, build: seat, explode: [-0.3, 1.25, 0], after: ['vo-than', ...(dual ? ['pin', 'pin-2'] : [])],
    desc: dual ? 'Yên bản lề – mở yên là lấy được hai pin rời.' : 'Yên bản lề, mở để lấy đồ trong cốp.' });
  add({ id: 'den-hau', name: 'Đèn hậu & đèn phanh', cat: 'dien', build: taillight, explode: [-0.85, 0.45, 0], after: ['vo-than', 'bo-day'],
    desc: 'Đèn hậu sáng mờ khi bật khoá, sáng mạnh khi bóp phanh.', specs: [['Nguồn', '12 V']] });
  add({ id: 'cong-sac', name: 'Cổng sạc', cat: 'dien', build: () => chargePort({ pos: P.charge, normal: -1 }), explode: [-0.75, 0.2, -0.95], after: ['vo-than', 'bo-day'],
    desc: 'Nhận điện từ bộ sạc và đưa vào pin qua BMS. Đang sạc thì xe bị khoá truyền động.', specs: cfg.chargeSpecs ?? [] });
  add({ id: 'chan-chong', name: 'Chân chống nghiêng + công tắc', cat: 'khung', build: () => sideStand({ pivot: [0.0, 0.27, -0.12], foot: [-0.16, 0.012, -0.27] }), explode: [0, 0, -0.75], after: ['khung'],
    desc: 'Công tắc an toàn: chân chống còn hạ thì bộ điều khiển không cho động cơ chạy.' });

  // ---------- Dây điện ----------
  const wires = [];
  BATS.forEach((b, i) => {
    const t = batTerm(b);
    wires.push({ id: `hv-${b.id}`, from: b.id, to: 'ro-le', type: 'hv', ch: 'hv', label: `Cao áp: ${dual ? `Pin ${i + 1}` : 'Pin'} → Rơ-le`, pts: dual ? [t, [t[0] + 0.05, 0.42, t[2]], P.relay] : [t, [t[0] - 0.03, 0.34, 0.05], P.relay] });
  });
  const mainBat = BATS[0];
  wires.push(
    { id: 'hv-rl-ctl', from: 'ro-le', to: 'bo-dieu-khien', type: 'hv', ch: 'hvMotor', label: 'Cao áp: Rơ-le → Bộ điều khiển', pts: route(P.relay, P.ctlSig, 1) },
    { id: 'hv-rl-dc', from: 'ro-le', to: 'dc-dc', type: 'hv', ch: 'hv', label: 'Cao áp: Rơ-le → DC-DC', pts: route(P.relay, P.dcdc, 2) },
    { id: 'ph-ctl-mt', from: 'bo-dieu-khien', to: 'dong-co', type: 'phase', ch: 'phase', label: '3 dây pha U/V/W: Bộ điều khiển → Động cơ', pts: phasePts },
    { id: 'lv-dc-head', from: 'dc-dc', to: 'den-pha', type: 'lv', ch: 'head', label: '12V: DC-DC → Đèn pha', pts: route(P.dcdc, headPort, -1) },
    { id: 'lv-dc-dash', from: 'dc-dc', to: 'dong-ho', type: 'lv', ch: 'dash', label: '12V: DC-DC → Đồng hồ', pts: route(P.dcdc, P.dash, -2) },
    { id: 'lv-dc-horn', from: 'dc-dc', to: 'coi', type: 'lv', ch: 'horn', label: '12V: DC-DC → Còi', pts: [P.dcdc, [(P.dcdc[0] + P.horn[0]) / 2, P.horn[1] + 0.02, 0.04], P.horn] },
    { id: 'lv-dc-tail', from: 'dc-dc', to: 'den-hau', type: 'lv', ch: 'tail', label: '12V: DC-DC → Đèn hậu', pts: [...route(P.dcdc, [-0.62 + dxr * 0.5, 0.6 + dy, 0], -3), [tailP[0] + 0.03, tailP[1], 0]] },
    { id: 'sg-thr', from: 'tay-ga', to: 'bo-dieu-khien', type: 'signal', ch: 'throttle', label: 'Tín hiệu tay ga → Bộ điều khiển', pts: route(P.thr, P.ctlSig, 3) },
    { id: 'sg-brk', from: 'tay-lai', to: 'bo-dieu-khien', type: 'signal', ch: 'brake', label: 'Công tắc phanh → Bộ điều khiển & đèn phanh', pts: route(P.brk, P.ctlSig, -4) },
    { id: 'sg-std', from: 'chan-chong', to: 'bo-dieu-khien', type: 'signal', ch: 'stand', label: 'Công tắc chân chống → Bộ điều khiển', pts: route(P.stand, P.ctlSig, 4) },
    { id: 'sg-key', from: 'khoa', to: 'pin', type: 'signal', ch: 'key', label: 'Tín hiệu bật khoá → BMS', pts: route(P.key, batBms(mainBat), 5) },
    { id: 'sg-can', from: 'bo-dieu-khien', to: 'dong-ho', type: 'signal', ch: 'can', label: 'Dữ liệu CAN: Bộ điều khiển ↔ Đồng hồ', pts: route(P.ctlSig, P.dash, -5) },
    { id: 'ch-port-pin', from: 'cong-sac', to: 'pin', type: 'charge', ch: 'charge', label: 'Đường sạc: Cổng sạc → Pin', pts: [P.charge, [P.charge[0] + 0.06, 0.48, -0.12], [mainBat.pos[0], mainBat.pos[1] + 0.05, -0.1], batTerm(mainBat)] },
  );

  const driveTrain = drive === 'hub' ? [] : drive === 'side-belt' ? ['day-dai', 'banh-sau'] : ['xich', 'banh-sau'];
  return {
    id: cfg.id, brand: cfg.brand, name: cfg.name, kind: cfg.kind, accent: cfg.accent, style: cfg.style,
    vmax: cfg.vmax, pmax: cfg.pmax, voltage: cfg.voltage, socDrain: cfg.socDrain ?? 0.3,
    drive, battery: cfg.battery, dualBattery: dual, driveTrain, rearR: R, ratio: cfg.ratio ?? 1,
    summary: cfg.summary, layoutNote: cfg.layoutNote, sources: cfg.sources ?? [], officialUrl: cfg.officialUrl,
    camera: { pos: [1.9 + dxf, 1.3, 2.4], target: [0, 0.5, 0] },
    parts, wires,
  };
}
