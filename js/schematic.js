// Sơ đồ khối hệ thống điện (SVG), đồng bộ với mô hình 3D và bộ mô phỏng.
const C = [58, 168, 278, 388];
const NODES = {
  khoa: { x: C[0], y: 36, label: 'Khoá điện' },
  'cong-sac': { x: C[1], y: 36, label: 'Cổng sạc' },
  'tay-ga': { x: C[2], y: 36, label: 'Tay ga' },
  'tay-lai': { x: C[3], y: 36, label: 'Phanh' },
  pin: { x: C[0], y: 136, label: 'Pin + BMS' },
  'ro-le': { x: C[1], y: 136, label: 'Rơ-le/cầu chì' },
  'bo-dieu-khien': { x: C[2], y: 136, label: 'Bộ điều khiển' },
  'chan-chong': { x: C[3], y: 136, label: 'Chân chống' },
  'dc-dc': { x: C[1], y: 246, label: 'DC-DC 12V' },
  'dong-co': { x: C[2], y: 246, label: 'Động cơ' },
  xich: { x: C[3], y: 246, label: 'Xích' },
  'banh-sau': { x: C[3], y: 326, label: 'Bánh sau' },
  'den-pha': { x: C[0], y: 426, label: 'Đèn pha' },
  coi: { x: C[1], y: 426, label: 'Còi' },
  'den-hau': { x: C[2], y: 426, label: 'Đèn hậu' },
  'dong-ho': { x: C[3], y: 426, label: 'Đồng hồ' },
};
// tuyến vẽ riêng cho những đường dễ chồng lên nút khác
const ROUTES = { 'sg-can': [[300, 136], [300, 192], [333, 192], [333, 398], [388, 398], [388, 426]] };
const NW = 100, NH = 34;
const COLORS = { hv: '#ff7a1a', lv: '#e53935', signal: '#29b6f6', charge: '#b05cff', mech: '#9aa5b1', phase: ['#f5c400', '#2e9d4f', '#1e6fd9'] };
const SVGNS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(SVGNS, tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (parent) parent.appendChild(e);
  return e;
}

export class Schematic {
  constructor(container, onSelect) {
    this.container = container;
    this.onSelect = onSelect;
  }

  setModel(model) {
    this.model = model;
    this.container.innerHTML = '';
    const svg = el('svg', { viewBox: '0 0 446 452', class: 'schem', role: 'img', 'aria-label': 'Sơ đồ khối hệ thống điện' }, this.container);
    this.svg = svg;
    const edgesG = el('g', {}, svg);
    const nodesG = el('g', {}, svg);
    this.edges = [];
    this.nodes = {};

    const edges = model.wires.map((w) => ({ ...w }));
    if (model.id === 'weaver') {
      edges.push({ id: 'm1', from: 'dong-co', to: 'xich', type: 'mech', ch: 'mech1' });
      edges.push({ id: 'm2', from: 'xich', to: 'banh-sau', type: 'mech', ch: 'mech2' });
    }
    // phân bổ độ lệch khi nhiều cạnh cùng đi vào một nút
    const inCount = {}, inIdx = {}, outCount = {}, outIdx = {};
    edges.forEach((e) => { inCount[e.to] = (inCount[e.to] || 0) + 1; outCount[e.from] = (outCount[e.from] || 0) + 1; });

    edges.forEach((e) => {
      const a = NODES[e.from], b = NODES[e.to];
      if (!a || !b) return;
      inIdx[e.to] = (inIdx[e.to] || 0); outIdx[e.from] = (outIdx[e.from] || 0);
      const offIn = (inIdx[e.to]++ - (inCount[e.to] - 1) / 2) * 9;
      const offOut = (outIdx[e.from]++ - (outCount[e.from] - 1) / 2) * 9;
      const lines = e.type === 'phase' ? [-6, 0, 6] : [0];
      const paths = lines.map((d, i) => {
        let dpath;
        if (ROUTES[e.id]) dpath = 'M' + ROUTES[e.id].map(([x, y]) => `${x + d},${y}`).join(' L');
        else if (Math.abs(a.y - b.y) < 2) dpath = `M${a.x},${a.y + d + offOut * 0.4} H${b.x}`;
        else if (Math.abs(a.x - b.x) < 2) dpath = `M${a.x + d + offOut},${a.y} V${b.y}`;
        else {
          const ym = b.y > a.y ? b.y - 46 + offIn * 0.5 : a.y - 46;
          dpath = `M${a.x + offOut},${a.y} V${ym} H${b.x + offIn} V${b.y}`;
        }
        const color = e.type === 'phase' ? COLORS.phase[i] : COLORS[e.type];
        el('path', { d: dpath, class: 'edge-bg' }, edgesG);
        const p = el('path', { d: dpath, class: `edge ${e.type}`, stroke: color }, edgesG);
        const title = el('title', {}, p); title.textContent = e.label || 'Liên kết cơ khí';
        return p;
      });
      this.edges.push({ def: e, paths });
    });

    Object.entries(NODES).forEach(([id, n]) => {
      const part = model.parts.find((p) => p.id === id);
      if (!part) return;
      const g = el('g', { class: 'node', transform: `translate(${n.x - NW / 2},${n.y - NH / 2})`, tabindex: 0, role: 'button' }, nodesG);
      el('rect', { width: NW, height: NH, rx: 9 }, g);
      const t = el('text', { x: NW / 2, y: NH / 2 + 5, 'text-anchor': 'middle' }, g);
      t.textContent = n.label;
      const tt = el('title', {}, g); tt.textContent = part.name;
      g.addEventListener('click', () => this.onSelect(id));
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') this.onSelect(id); });
      this.nodes[id] = g;
    });
  }

  update(has, r, selected, s) {
    if (!this.model) return;
    Object.entries(this.nodes).forEach(([id, g]) => {
      g.classList.toggle('missing', !has(id));
      g.classList.toggle('selected', id === selected);
      let powered = false;
      if (['pin', 'khoa'].includes(id)) powered = r.ch.key > 0 || r.charging;
      else if (['ro-le', 'bo-dieu-khien', 'dc-dc'].includes(id)) powered = r.hvOn;
      else if (id === 'dong-co') powered = r.motorOn;
      else if (['xich', 'banh-sau'].includes(id)) powered = r.motorOn && r.wheelDriven;
      else if (id === 'den-pha') powered = r.lamps.head;
      else if (id === 'den-hau') powered = r.lamps.tail;
      else if (id === 'dong-ho') powered = r.lamps.dash;
      else if (id === 'coi') powered = r.ch.horn > 0;
      else if (id === 'cong-sac') powered = r.charging;
      else if (id === 'tay-ga') powered = r.ch.throttle > 0;
      else if (id === 'tay-lai') powered = r.ch.brake > 0;
      else if (id === 'chan-chong') powered = r.ch.stand > 0;
      g.classList.toggle('powered', powered);
    });
    this.edges.forEach(({ def, paths }) => {
      let rate = r.ch[def.ch] || 0;
      if (def.type === 'mech') rate = r.motorOn && (def.ch === 'mech1' ? has('xich') : r.wheelDriven) ? 0.4 + s.throttle * 2 : 0;
      const ok = has(def.from) && has(def.to) && (def.type === 'mech' || has('bo-day'));
      paths.forEach((p) => {
        p.classList.toggle('on', ok && rate > 0);
        p.classList.toggle('broken', !ok);
        if (rate > 0) p.style.animationDuration = `${(1.6 / (rate + 0.2)).toFixed(2)}s`;
      });
    });
  }
}
