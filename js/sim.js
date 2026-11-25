// Mô phỏng logic điện của xe máy điện (đơn giản hoá cho mục đích học tập).
// Đầu vào: mẫu xe, hàm has(id) cho biết bộ phận đã lắp chưa, trạng thái điều khiển của người dùng.

export function createSimState() {
  return { key: false, standDown: true, brake: false, throttle: 0, horn: false, charging: false, soc: 78, speed: 0, mode: 'eco' };
}

export function simulate(model, has, s) {
  const blockers = [];
  const warnings = [];
  const harness = has('bo-day');
  const battery = has('pin');
  const relay = has('ro-le');
  const keyMod = has('khoa');

  if (!battery) blockers.push('Chưa lắp khối pin – xe không có nguồn.');
  if (!harness) blockers.push('Chưa lắp bó dây điện – các bộ phận không được nối với nhau.');
  if (!relay) blockers.push('Thiếu rơ-le nguồn / cầu chì – mạch cao áp bị hở.');
  if (!keyMod) blockers.push('Thiếu khoá điện – BMS không nhận được lệnh bật nguồn.');
  else if (!s.key) blockers.push('Khoá điện đang TẮT.');

  const charging = s.charging && battery && harness && has('cong-sac');
  if (s.charging && !has('cong-sac')) warnings.push('Chưa lắp cổng sạc – không sạc được.');

  const keyOn = s.key && keyMod;
  const hvOn = battery && harness && relay && keyOn && s.soc > 0;
  const lvOn = hvOn && has('dc-dc');
  if (hvOn && !has('dc-dc')) warnings.push('Thiếu DC-DC – mất điện 12 V: đèn, còi, đồng hồ không hoạt động.');
  if (battery && s.soc <= 0) blockers.push('Pin đã cạn – hãy cắm sạc.');

  if (!has('bo-dieu-khien')) blockers.push('Thiếu bộ điều khiển động cơ.');
  if (!has('dong-co')) blockers.push('Thiếu động cơ.');
  if (!has('tay-ga')) blockers.push('Thiếu tay ga – bộ điều khiển không có tín hiệu tăng tốc.');
  if (charging) blockers.push('Đang cắm sạc – bộ điều khiển khoá truyền động để an toàn.');
  const standDown = s.standDown && has('chan-chong');
  if (standDown) blockers.push('Chân chống đang hạ – công tắc an toàn ngắt động cơ.');
  const brakeSw = s.brake && has('tay-lai');
  if (brakeSw) blockers.push('Đang bóp phanh – công tắc phanh ngắt động cơ.');

  const canRun = blockers.length === 0;
  const motorOn = canRun && s.throttle > 0.02;

  // Truyền động tới bánh
  let wheelDriven = motorOn;
  if (model.id === 'weaver') {
    if (!has('xich')) { warnings.push('Thiếu xích – động cơ quay nhưng bánh sau không quay.'); wheelDriven = false; }
    if (!has('banh-sau')) { warnings.push('Thiếu bánh sau.'); wheelDriven = false; }
  }

  const sportK = s.mode === 'sport' ? 1 : 0.7;
  const powerW = motorOn ? model.pmax * s.throttle * sportK : 0;
  const currentA = powerW / model.voltage;

  const rate = (on, base = 0.35) => (on ? base : 0);
  const ch = {
    hv: rate(hvOn, 0.3),
    hvMotor: hvOn ? 0.25 + (motorOn ? s.throttle * 1.6 : 0) : 0,
    phase: motorOn ? 0.35 + s.throttle * 2.2 : 0,
    head: rate(lvOn && has('den-pha')),
    tail: rate(lvOn && has('den-hau')),
    dash: rate(lvOn && has('dong-ho')),
    horn: rate(lvOn && s.horn && has('coi'), 0.9),
    throttle: hvOn && has('tay-ga') && s.throttle > 0.02 ? 0.3 + s.throttle : 0,
    brake: rate(hvOn && brakeSw, 0.6),
    stand: rate(hvOn && standDown, 0.4),
    key: rate(keyOn && battery, 0.4),
    can: rate(lvOn && has('dong-ho') && has('bo-dieu-khien'), 0.5),
    charge: rate(charging, 0.8),
  };

  const lamps = {
    head: lvOn && has('den-pha'),
    tail: lvOn && has('den-hau'),
    brake: lvOn && has('den-hau') && s.brake,
    dash: lvOn && has('dong-ho'),
    key: keyOn && battery,
  };

  let status;
  if (charging) status = { level: 'charge', text: 'Đang sạc pin' };
  else if (motorOn && wheelDriven) status = { level: 'run', text: 'Xe đang chạy' };
  else if (motorOn) status = { level: 'warn', text: 'Động cơ quay nhưng bánh không quay' };
  else if (canRun) status = { level: 'ready', text: 'Sẵn sàng – vặn tay ga để chạy' };
  else status = { level: 'off', text: 'Xe chưa chạy được' };

  return { hvOn, lvOn, motorOn, wheelDriven, charging, blockers, warnings, ch, lamps, powerW, currentA, status };
}

// Cập nhật các đại lượng liên tục theo thời gian (tốc độ, % pin)
export function stepSim(model, s, r, dt) {
  const target = r.motorOn && r.wheelDriven ? model.vmax * s.throttle * (s.mode === 'sport' ? 1 : 0.75) : 0;
  const k = target > s.speed ? 1.4 : (s.brake ? 5 : 0.8);
  s.speed += (target - s.speed) * Math.min(1, k * dt);
  if (s.speed < 0.05) s.speed = 0;
  if (r.motorOn) s.soc = Math.max(0, s.soc - model.socDrain * s.throttle * dt);
  if (r.charging) s.soc = Math.min(100, s.soc + 2.5 * dt);
}
