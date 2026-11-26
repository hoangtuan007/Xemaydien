// Danh sách mẫu xe. Thông số lấy từ công bố công khai của hãng / báo chí (xem `sources`);
// các ô ghi "mô phỏng" hoặc "ước tính" là giá trị dùng cho bộ mô phỏng, không phải số liệu chính hãng.
import { makeScooter } from './scooter.js';
import weaver from './datbike-weaver.js';

const LFP_NOTE = 'Pin LFP (Lithium Sắt Photphat): bền chu kỳ, ít nguy cơ cháy nổ hơn pin NMC, chịu nhiệt tốt.';

const evo = makeScooter({
  id: 'evo200', officialUrl: 'https://shop.vinfastauto.com/vn_en/xe-may-dien-zgoo.html', brand: 'VinFast', name: 'Evo200', kind: 'Xe tay ga · động cơ in-hub bánh sau', accent: '#1f8fd6',
  style: 'modern', drive: 'hub', battery: 'floor', headlight: 'v', wheelInch: 12,
  colors: { body: 0x1f8fd6, trim: 0xf2f4f7, seat: 0x2a211c, rim: 0x2b2f36 },
  vmax: 70, pmax: 2500, voltage: 60, socDrain: 0.35,
  batteryName: 'Khối pin LFP + BMS', batteryDesc: `Pin cố định đặt dưới sàn để chân – trọng tâm thấp. ${LFP_NOTE}`,
  batterySpecs: [['Hoá học', 'LFP'], ['Dung lượng', '3,5 kWh'], ['Vị trí', 'Dưới sàn để chân']],
  motorSpecs: [['Công suất', '1.500 W định danh / 2.500 W tối đa'], ['Kiểu', 'BLDC in-hub']],
  chargeSpecs: [['Bộ sạc', '400 W, ~10 giờ']], trunk: '~22 lít',
  summary: [['Động cơ', 'In-hub bánh sau, 1.500 W / 2.500 W tối đa'], ['Pin', 'LFP 3,5 kWh, dưới sàn để chân'], ['Tốc độ tối đa', '~70 km/h'], ['Quãng đường', '~200 km/lần sạc (điều kiện thử của hãng)'], ['Sạc', '400 W, ~10 giờ'], ['Chống nước', 'IP67']],
  layoutNote: 'Động cơ nằm ngay trong bánh sau nên không cần xích hay dây đai: bộ điều khiển cấp dòng 3 pha trực tiếp vào cuộn dây stator, vỏ bánh có nam châm quay theo.',
  sources: [['VinFast – Evo200', 'https://shop.vinfastauto.com/vn_en/xe-may-dien-zgoo.html']],
});

const feliz = makeScooter({
  id: 'feliz-s', brand: 'VinFast', name: 'Feliz S', kind: 'Xe tay ga · động cơ in-hub bánh sau', accent: '#7a8c99',
  style: 'modern', drive: 'hub', battery: 'floor', headlight: 'bar', wheelInch: 14,
  colors: { body: 0xe4e8ec, trim: 0x2b2f36, seat: 0x6b4a33, rim: 0xb8c0c8, inner: 0x2b2f36 },
  vmax: 78, pmax: 2500, voltage: 60, socDrain: 0.3,
  batteryName: 'Khối pin LFP + BMS', batteryDesc: `Pin LFP thế hệ mới (cùng nhóm pin VinFast phát triển với Gotion) đặt dưới sàn. ${LFP_NOTE}`,
  batterySpecs: [['Hoá học', 'LFP'], ['Dung lượng (mô phỏng)', '~3,5 kWh']],
  motorSpecs: [['Kiểu', 'BLDC in-hub bánh sau'], ['Công suất', 'Xem bảng TSKT của hãng (mô phỏng: 2,5 kW)']],
  chargeSpecs: [['Bộ sạc', '1.000 W, ~6 giờ']],
  summary: [['Động cơ', 'In-hub bánh sau'], ['Pin', 'LFP, dưới sàn để chân'], ['Tốc độ tối đa', '~78 km/h'], ['Quãng đường', '~198 km/lần sạc (theo hãng)'], ['Sạc', '1.000 W, ~6 giờ'], ['Chống nước', 'IP67']],
  layoutNote: 'Cùng kiến trúc với Evo200 (in-hub + pin dưới sàn) nhưng bánh 14 inch và bộ sạc 1 kW nhanh hơn. Đây là bố trí phổ biến nhất ở xe tay ga điện phổ thông vì đơn giản, ít bảo dưỡng.',
  sources: [['Báo Lâm Đồng – 5 mẫu pin LFP', 'https://baolamdong.vn/vinfast-evo200-xe-may-dien-pin-lfp-gia-chi-tu-1936-trieu-dong-414730.html']],
});

const klara = makeScooter({
  id: 'klara-s', brand: 'VinFast', name: 'Klara S', kind: 'Xe tay ga cổ điển · in-hub · 2 pin rời dưới yên', accent: '#b08d57',
  style: 'classic', drive: 'hub', battery: 'seat-dual', headlight: 'round', wheelInch: 14,
  colors: { body: 0xefe4cc, trim: 0xefe4cc, seat: 0x6b3e26, rim: 0xc9ced4, inner: 0x5a4632 },
  vmax: 60, pmax: 1800, voltage: 60, socDrain: 0.3, batteryColor: 0x3b4252,
  batteryName: 'Pin rời', batteryDesc: `Hai khối pin rời có quai xách, cắm vào hộc dưới yên qua giắc ở đáy hộc. ${LFP_NOTE}`,
  batterySpecs: [['Số pin', '2 pin rời'], ['Dung lượng', '22 Ah mỗi pin'], ['Vị trí', 'Hộc dưới yên']],
  motorSpecs: [['Kiểu', 'BLDC in-hub bánh sau'], ['Công suất', 'Xem bảng TSKT của hãng (mô phỏng: 1,8 kW)']],
  trunk: 'nhỏ hơn vì nhường chỗ cho pin',
  summary: [['Động cơ', 'In-hub bánh sau'], ['Pin', '2 pin rời × 22 Ah, dưới yên'], ['Quãng đường', 'Tới ~194 km/lần sạc (theo hãng)'], ['Kiểu dáng', 'Cổ điển, đèn tròn trên ốp đầu']],
  layoutNote: 'Điểm khác biệt: pin rời đặt dưới yên. Chỉ cần mở yên là nhấc pin ra mang đi sạc – không cần tháo vỏ. Trong mô phỏng, xe vẫn chạy với 1 pin.',
  sources: [['VnReview – 5 mẫu xe VinFast', 'https://vnreview.vn/threads/vinfast-gioi-thieu-5-mau-xe-may-dien-di-chuyen-len-den-200-km-gia-tu-22-trieu-dong.26292/latest']],
});

const vento = makeScooter({
  id: 'vento-s', officialUrl: 'https://shop.vinfastauto.com/vn_en/xe-may-dien-vento-s.html', brand: 'VinFast', name: 'Vento S', kind: 'Xe tay ga thể thao · động cơ đặt bên + dây đai', accent: '#d62828',
  style: 'sport', drive: 'side-belt', battery: 'floor', headlight: 'twin', wheelInch: 14, ratio: 2.6,
  colors: { body: 0x59626c, trim: 0x1d1f23, seat: 0x1a1a1a, rim: 0x1d1f23, stripe: 0xd62828, spring: 0xd62828 },
  vmax: 89, pmax: 5200, voltage: 72, socDrain: 0.4,
  batteryName: 'Khối pin LFP + BMS', batteryDesc: `Pin LFP đặt dưới sàn để chân. ${LFP_NOTE}`,
  batterySpecs: [['Hoá học', 'LFP'], ['Dung lượng', '3,5 kWh'], ['Vị trí', 'Dưới sàn để chân']],
  motorSpecs: [['Công suất', '3.000 W định danh / 5.200 W tối đa'], ['Kiểu', 'Side motor'], ['Truyền động', 'Dây đai']],
  summary: [['Động cơ', 'Side motor 3.000 W / 5.200 W tối đa'], ['Truyền động', 'Dây đai tới bánh sau'], ['Pin', 'LFP 3,5 kWh'], ['Tốc độ tối đa', '89 km/h'], ['Quãng đường', '~160 km/lần sạc'], ['Chống nước', 'IP67']],
  layoutNote: 'Động cơ không nằm trong bánh mà đặt bên cạnh, trên càng sau, kéo bánh qua dây đai. Nhờ đó dùng được động cơ quay nhanh, nhỏ gọn và mạnh hơn, còn bánh sau nhẹ hơn loại in-hub.',
  sources: [['VinFast – Brochure Vento S', 'https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dwf3c81a02/Document/Brochure_VENTOS_012025.pdf']],
});

const theon = makeScooter({
  id: 'theon-s', officialUrl: 'https://shop.vinfastauto.com/vn_en/bike-theon.html', brand: 'VinFast', name: 'Theon S', kind: 'Xe tay ga cao cấp · động cơ đặt giữa + xích', accent: '#c9a227',
  style: 'sport', drive: 'mid-chain', battery: 'floor-big', headlight: 'bar', wheelInch: 14, ratio: 2.8,
  colors: { body: 0x23272d, trim: 0x111316, seat: 0x3b2a20, rim: 0x111316, stripe: 0xc9a227, spring: 0xc9a227, motor: 0xc9a227 },
  vmax: 99, pmax: 7100, voltage: 72, socDrain: 0.5, batteryColor: 0x2a2f38,
  batteryName: 'Khối pin LFP 72 V + BMS', batteryDesc: `Khối pin LFP 72 V lớn đặt dưới sàn để chân. ${LFP_NOTE}`,
  batterySpecs: [['Điện áp', '72 V'], ['Hoá học', 'LFP'], ['Vị trí', 'Dưới sàn để chân']],
  motorSpecs: [['Công suất', '3.500 W định danh / 7.100 W tối đa'], ['Điện áp', '72 V'], ['Truyền động', 'Xích']],
  summary: [['Động cơ', 'Đặt giữa, 3.500 W / 7.100 W tối đa'], ['Truyền động', 'Xích'], ['Pin', 'LFP 72 V, dưới sàn'], ['Quãng đường', '~150 km/lần sạc'], ['Hệ điện', '72 V']],
  layoutNote: 'Động cơ đặt giữa thân xe, trước chốt càng, kéo bánh sau bằng xích. Bánh sau không mang động cơ nên nhẹ, giảm xóc làm việc tốt hơn – phù hợp xe mạnh, chạy nhanh.',
  sources: [['VinFast – Theon S', 'https://shop.vinfastauto.com/vn_en/bike-theon.html'], ['Người Quan Sát – linh kiện Theon S', 'https://nguoiquansat.vn/kham-pha-loat-linh-kien-hang-hieu-ben-trong-vinfast-theon-s-63400.html']],
});

const quantumNote = 'Quantum dùng truyền động xích (theo bài trải nghiệm của VnReview). Vị trí đặt động cơ trong mô hình là giả định để minh hoạ, chưa đối chiếu bản vẽ của hãng.';
const quantumS1 = makeScooter({
  id: 'quantum-s1', officialUrl: 'https://dat.bike/en/xe-may-dien-quantum-en/', brand: 'Dat Bike', name: 'Quantum S1', kind: 'Xe tay ga cỡ lớn · truyền động xích · pin 6,4 kWh', accent: '#3d5a80',
  style: 'maxi', drive: 'mid-chain', battery: 'floor-big', headlight: 'bar', wheelInch: 14, ratio: 2.8,
  colors: { body: 0x3d4650, trim: 0x1d1f23, seat: 0x1c1c1c, rim: 0x1d1f23, stripe: 0x9fb3c8, motor: 0x9fb3c8 },
  vmax: 90, pmax: 7000, voltage: 72, socDrain: 0.25, batteryColor: 0x2a2f38, dashName: 'Màn hình TFT',
  batteryName: 'Khối pin LFP 6,4 kWh + BMS', batteryDesc: `Khối pin LFP dung lượng lớn đặt dưới sàn để chân. ${LFP_NOTE}`,
  batterySpecs: [['Hoá học', 'LFP'], ['Dung lượng', '6,4 kWh'], ['Điện áp (ước tính)', '72 V']],
  motorSpecs: [['Công suất tối đa', '~7.000 W (các nguồn ghi 6.000–7.000 W)'], ['Truyền động', 'Xích']],
  chargeSpecs: [['Bộ sạc', '1.800 W, ~4 giờ (0→100%)']], trunk: '41 lít',
  summary: [['Động cơ', '~7.000 W tối đa, truyền động xích'], ['Pin', 'LFP 6,4 kWh'], ['Tốc độ tối đa', '~90 km/h'], ['Quãng đường', '~285 km/lần sạc (theo hãng)'], ['Sạc', '1.800 W, ~4 giờ'], ['Cốp', '41 lít']],
  layoutNote: quantumNote,
  sources: [['Báo Hà Tĩnh – Quantum S1', 'https://baohatinh.vn/tv/dat-bike-quantum-s1-xe-may-dien-so-huu-cop-41-lit-va-pham-vi-di-chuyen-285-km-40389.html'], ['VnReview – trải nghiệm Quantum S1/S2/S3', 'https://vnreview.vn/threads/trai-nghiem-nhanh-xe-may-dien-dat-bike-quantum-series-s1-s2-hay-s3-thu-vi-hon.49192/latest']],
});

const quantumS3 = makeScooter({
  id: 'quantum-s3', officialUrl: 'https://dat.bike/en/pages/quantum-s3', brand: 'Dat Bike', name: 'Quantum S3', kind: 'Xe tay ga cỡ lớn · truyền động xích · pin 4,3 kWh', accent: '#8d99ae',
  style: 'maxi', drive: 'mid-chain', battery: 'floor', headlight: 'bar', wheelInch: 14, ratio: 2.8,
  colors: { body: 0xe8eaec, trim: 0x2b2d33, seat: 0x1c1c1c, rim: 0x2b2d33, stripe: 0x3d5a80, motor: 0x8d99ae },
  vmax: 90, pmax: 6000, voltage: 72, socDrain: 0.35, dashName: 'Màn hình TFT',
  batteryName: 'Khối pin LFP 4,3 kWh + BMS', batteryDesc: `Khối pin LFP đặt dưới sàn để chân. ${LFP_NOTE}`,
  batterySpecs: [['Hoá học', 'LFP'], ['Dung lượng', '4,3 kWh'], ['Điện áp (ước tính)', '72 V']],
  motorSpecs: [['Công suất', '6.000 W'], ['Truyền động', 'Xích']],
  chargeSpecs: [['Bộ sạc', '900 W, ~5 giờ']], trunk: '41 lít',
  summary: [['Động cơ', '6.000 W, truyền động xích'], ['Pin', 'LFP 4,3 kWh'], ['Tốc độ tối đa', '~90 km/h'], ['Quãng đường', '~200 km/lần sạc ở 35 km/h'], ['Sạc', '900 W, ~5 giờ']],
  layoutNote: `Bản tiêu chuẩn của dòng Quantum: cùng thân xe với S1 nhưng pin nhỏ hơn. ${quantumNote}`,
  sources: [['VnReview – trải nghiệm Quantum S1/S2/S3', 'https://vnreview.vn/threads/trai-nghiem-nhanh-xe-may-dien-dat-bike-quantum-series-s1-s2-hay-s3-thu-vi-hon.49192/latest'], ['Dat Bike – Quantum S3', 'https://dat.bike/en/pages/quantum-s3']],
});

export const LINEUP = [evo, feliz, klara, vento, theon, weaver, quantumS1, quantumS3];
export const BRANDS = ['VinFast', 'Dat Bike'];
