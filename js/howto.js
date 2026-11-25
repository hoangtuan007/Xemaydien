// Hướng dẫn lắp từng bộ phận (dùng chung cho mọi mẫu xe).
// Khoá có thể kèm hậu tố kiểu truyền động, ví dụ 'dong-co:hub'. Lực siết là giá trị tham khảo phổ biến.
const H = {
  khung: {
    attach: 'Đặt lên giá/kệ đỡ – là bộ phận gốc',
    fasteners: 'Không có (đặt trên giá đỡ)',
    tools: ['Giá đỡ xe', 'Đèn soi kiểm tra mối hàn'],
    steps: [
      'Đặt khung lên giá đỡ, cổ lái hướng về phía trước.',
      'Kiểm tra mối hàn, lỗ bắt bu-lông và ren trước khi lắp.',
      'Lắp vòng bi cổ lái (tra mỡ) vào ống cổ khung.',
    ],
  },
  'bo-day': {
    attach: 'Đi dọc theo khung, từ cổ lái về đuôi xe',
    fasteners: '8–12 dây rút nhựa + kẹp dây',
    tools: ['Kìm cắt', 'Dây rút'],
    steps: [
      'Trải bó dây dọc khung, đầu nhiều nhánh nhất hướng về cổ lái.',
      'Luồn qua các kẹp dây trên khung, tránh mép sắc và vùng quay của bánh.',
      'Cố định bằng dây rút, chừa độ chùng ở cổ lái để đánh lái không căng dây.',
      'Chưa cắm giắc nào – các giắc sẽ được cắm khi lắp từng linh kiện.',
    ],
  },
  'cang-truoc': {
    attach: 'Luồn ty lái qua ống cổ của khung',
    fasteners: '1 đai ốc cổ lái + 2 bu-lông kẹp chạc ba',
    tools: ['Cờ lê móc cổ lái', 'Mỡ bò'],
    steps: [
      'Tra mỡ vào vòng bi trên và dưới của cổ lái.',
      'Luồn ty lái của phuộc từ dưới lên qua ống cổ khung.',
      'Vặn đai ốc cổ lái tới khi hết rơ, nhưng phuộc vẫn đánh lái nhẹ nhàng.',
      'Siết đai ốc hãm phía trên.',
    ],
  },
  'banh-truoc': {
    attach: 'Kẹp giữa hai chân phuộc trước, bằng trục bánh',
    fasteners: '1 trục bánh + 1 đai ốc (~50 N·m)',
    tools: ['Cờ lê 17/19', 'Cần lực'],
    steps: [
      'Đặt bánh giữa hai chân phuộc, đĩa phanh nằm phía có ngàm phanh.',
      'Lắp ống cách hai bên moay-ơ rồi luồn trục bánh qua.',
      'Siết đai ốc trục theo lực khuyến cáo.',
      'Quay thử bánh: phải quay trơn, không đảo.',
    ],
  },
  'phanh-truoc': {
    attach: 'Ôm ngoài đĩa phanh, bắt vào tai chân phuộc',
    fasteners: '2 bu-lông M8 (~25 N·m), có keo khoá ren',
    tools: ['Lục giác 6', 'Keo khoá ren'],
    steps: [
      'Đẩy piston và má phanh vào hết để có khe.',
      'Úp ngàm phanh vào đĩa sao cho đĩa nằm giữa hai má.',
      'Bắt 2 bu-lông vào tai phuộc, siết đều hai bên.',
      'Bóp tay phanh vài lần cho má áp sát đĩa.',
    ],
  },
  'chan-bun-truoc': {
    attach: 'Bắt lên hai chân phuộc trước',
    fasteners: '4 vít M6',
    tools: ['Tua vít / lục giác 4'],
    steps: ['Đặt chắn bùn lên trên bánh trước.', 'Bắt 4 vít vào tai trên chân phuộc, siết vừa tay (nhựa dễ nứt).'],
  },
  'tay-lai': {
    attach: 'Kẹp lên đầu ty lái phía trên',
    fasteners: '2 bu-lông kẹp ghi đông M8',
    tools: ['Lục giác 6'],
    steps: [
      'Đặt ghi đông lên đầu ty lái, căn hai bên cân đối.',
      'Siết 2 bu-lông kẹp chéo nhau cho đều.',
      'Cắm giắc công tắc phanh trái/phải và cụm công tắc vào bó dây.',
    ],
  },
  'tay-ga': {
    attach: 'Lồng vào đầu phải ghi đông',
    fasteners: '1 vít kẹp + 1 giắc 3 chân',
    tools: ['Lục giác 3'],
    steps: [
      'Lồng tay ga vào đầu phải ghi đông, chừa khe 2 mm với cụm công tắc.',
      'Siết vít kẹp, xoay thử: tay ga phải tự trả về khi buông.',
      'Cắm giắc 3 dây (5 V – mass – tín hiệu) vào bó dây.',
    ],
  },
  guong: {
    attach: 'Vặn vào chân gương trên ghi đông',
    fasteners: '2 ren M10 + đai ốc hãm',
    tools: ['Cờ lê 14'],
    steps: ['Vặn gương vào lỗ ren trên ghi đông (bên trái có thể là ren ngược).', 'Chỉnh góc nhìn rồi siết đai ốc hãm.'],
  },
  'dong-ho': {
    attach: 'Bắt lên giá đồng hồ trên ghi đông/ốp đầu',
    fasteners: '2–3 vít + 1 giắc nhiều chân',
    tools: ['Tua vít'],
    steps: ['Cắm giắc đồng hồ (nguồn 12 V + đường dữ liệu CAN).', 'Đặt đồng hồ vào giá, bắt vít giữ.'],
  },
  'den-pha': {
    attach: 'Bắt vào giá đèn phía trước',
    fasteners: '2–3 vít + 1 giắc 12 V',
    tools: ['Tua vít'],
    steps: ['Cắm giắc nguồn 12 V cho đèn.', 'Đặt cụm đèn vào giá, bắt vít.', 'Chỉnh vít góc chiếu sao cho chùm sáng hơi chúc xuống.'],
  },
  coi: {
    attach: 'Bắt vào pát còi trên khung phía trước',
    fasteners: '1 bu-lông M6 + 2 cốt dây',
    tools: ['Cờ lê 10'],
    steps: ['Bắt còi vào pát trên khung, miệng còi hướng xuống để không đọng nước.', 'Cắm 2 cốt dây 12 V.'],
  },
  khoa: {
    attach: 'Bắt vào giá khoá phía sau yếm',
    fasteners: '2 bu-lông chống tháo + 1 giắc',
    tools: ['Đầu vít chống tháo'],
    steps: ['Luồn ổ khoá vào lỗ trên yếm/khung.', 'Bắt 2 bu-lông chống tháo.', 'Cắm giắc tín hiệu bật khoá (đi tới BMS).'],
  },
  'dc-dc': {
    attach: 'Bắt lên khung, nơi thoáng gió',
    fasteners: '2 vít M5 + giắc vào (cao áp) + giắc ra (12 V)',
    tools: ['Tua vít', 'Găng cách điện'],
    steps: ['Bắt bộ DC-DC lên khung bằng 2 vít.', 'Cắm giắc ra 12 V trước.', 'Cắm giắc vào cao áp sau cùng (khoá đang tắt).'],
  },
  'op-dau': {
    attach: 'Ôm bao ngoài cổ lái, che đèn, còi, khoá, DC-DC',
    fasteners: '6–8 vít + lẫy gài',
    tools: ['Tua vít', 'Lục giác 4'],
    steps: [
      'Kiểm tra mọi giắc phía trước đã cắm chắc (đèn, còi, khoá, DC-DC).',
      'Gài các lẫy của yếm vào khung từ dưới lên.',
      'Úp mặt nạ, căn khít khe với đèn pha.',
      'Bắt vít từ trong ra ngoài, không siết quá tay.',
    ],
  },
  pin: {
    attach: 'Đặt vào khoang pin, bắt vào giá trên khung',
    fasteners: '4 bu-lông M8 (~20 N·m) + giắc cao áp + giắc tín hiệu BMS',
    tools: ['Găng cách điện', 'Cờ lê 12', 'Cần lực'],
    steps: [
      '⚠ Đảm bảo khoá điện TẮT và rơ-le đang mở.',
      'Đặt pin vào khoang, cọc pin hướng về phía rơ-le.',
      'Bắt 4 bu-lông giữ pin, siết chéo cho đều.',
      'Nối cực dương (+) trước, cực âm (–) SAU CÙNG.',
      'Cắm giắc tín hiệu BMS và giắc đánh thức từ khoá điện.',
    ],
  },
  'pin:seat': {
    attach: 'Đặt vào hộc pin dưới yên – pin rời, không cần bu-lông',
    fasteners: 'Ray trượt + giắc tự khớp đáy hộc',
    tools: ['Không cần dụng cụ'],
    steps: [
      'Mở yên. Kiểm tra giắc ở đáy hộc pin sạch và khô.',
      'Cầm quai, hạ pin thẳng đứng theo ray trượt.',
      'Ấn nhẹ tới khi nghe "tách" – giắc đáy tự khớp.',
      'Gạt chốt khoá pin (nếu có) rồi đóng yên.',
    ],
  },
  'ro-le': {
    attach: 'Bắt lên khung gần cọc pin',
    fasteners: '2 vít + 2 cọc cao áp M6 + hộp cầu chì',
    tools: ['Cờ lê 10', 'Găng cách điện'],
    steps: ['Bắt rơ-le và hộp cầu chì lên khung.', 'Nối dây từ pin vào cọc vào của rơ-le.', 'Nối dây ra tới bộ điều khiển và DC-DC.', 'Cắm cầu chì đúng định mức in trên nắp hộp.'],
  },
  'san-de-chan': {
    attach: 'Phủ lên khung giữa, che khoang dưới sàn',
    fasteners: '6 vít + lẫy gài với yếm',
    tools: ['Tua vít'],
    steps: ['Đặt sàn lên hai thanh khung dưới.', 'Gài mép trước vào chân yếm.', 'Bắt vít quanh mép sàn.'],
  },
  'gap-sau': {
    attach: 'Bắt vào giá chốt càng trên khung',
    fasteners: '1 chốt càng (bu-lông xuyên M12, ~60 N·m)',
    tools: ['Cờ lê 17/19', 'Mỡ bò'],
    steps: ['Tra mỡ vào bạc chốt càng.', 'Đưa càng vào giá trên khung, căn lỗ.', 'Luồn chốt càng xuyên qua và siết đai ốc.', 'Nâng hạ càng thử: phải nhẹ, không rơ ngang.'],
  },
  'dong-co:hub': {
    attach: 'Lắp vào đuôi càng sau, bằng trục bánh',
    fasteners: '2 đai ốc trục (~80 N·m) + long đen chống xoay + giắc 3 pha & Hall',
    tools: ['Cờ lê 22', 'Cần lực'],
    steps: [
      'Đưa cụm bánh-động cơ vào giữa hai tay càng sau.',
      'Đặt long đen chống xoay đúng khe – trục động cơ không được xoay theo.',
      'Siết 2 đai ốc trục theo lực khuyến cáo.',
      'Đi dây pha dọc càng, cố định bằng kẹp.',
      'Cắm giắc 3 pha đúng màu (vàng–xanh lá–xanh dương) và giắc cảm biến Hall.',
    ],
  },
  'dong-co:side': {
    attach: 'Bắt lên tay càng sau bên trái, phía trước bánh',
    fasteners: '3 bu-lông M8 + giắc 3 pha & Hall',
    tools: ['Lục giác 6', 'Cần lực'],
    steps: [
      'Đặt động cơ lên pát của càng sau, puly hướng ra ngoài.',
      'Bắt 3 bu-lông nhưng chưa siết chặt (để chỉnh căng dây đai sau).',
      'Cắm giắc 3 pha đúng màu và giắc Hall.',
    ],
  },
  'dong-co:mid': {
    attach: 'Treo vào giá động cơ giữa khung, trước chốt càng',
    fasteners: '3–4 bu-lông M10 (~45 N·m) + giắc 3 pha & Hall',
    tools: ['Cờ lê 14/17', 'Kích nâng'],
    steps: [
      'Dùng kích nâng động cơ vào giá giữa khung.',
      'Căn lỗ, luồn các bu-lông treo và siết theo lực khuyến cáo.',
      'Lắp nhông trước lên trục động cơ, khoá phe cài.',
      'Cắm giắc 3 pha đúng màu và giắc cảm biến vị trí.',
    ],
  },
  'banh-sau': {
    attach: 'Lắp vào đuôi càng sau, bằng trục bánh',
    fasteners: '1 trục bánh + đai ốc (~90 N·m) + bộ tăng xích/đai',
    tools: ['Cờ lê 22/24', 'Cần lực'],
    steps: [
      'Đưa bánh vào giữa hai tay càng, nhông/puly nằm về phía truyền động.',
      'Luồn trục qua bộ tăng hai bên.',
      'Chưa siết hẳn – để chỉnh căng xích/dây đai ở bước sau.',
    ],
  },
  xich: {
    attach: 'Vòng qua nhông trước (động cơ) và nhông sau (bánh)',
    fasteners: '1 khoá xích (mắt nối)',
    tools: ['Kìm phe', 'Thước đo độ chùng'],
    steps: [
      'Vòng xích qua nhông sau rồi nhông trước.',
      'Nối hai đầu bằng mắt nối, kẹp khoá với đầu hở ngược chiều quay.',
      'Chỉnh bộ tăng hai bên đều nhau tới khi nhánh dưới chùng 2–3 cm.',
      'Siết trục bánh sau, quay thử và tra dầu xích.',
    ],
  },
  'day-dai': {
    attach: 'Vòng qua puly động cơ và puly bánh sau',
    fasteners: 'Không bu-lông – căng bằng cách dời động cơ',
    tools: ['Thước đo lực căng dây đai'],
    steps: [
      'Vòng dây đai qua puly bánh sau rồi puly động cơ (không dùng tua vít nạy).',
      'Đẩy động cơ về trước để căng đai; ấn giữa nhánh, độ võng ~1 cm.',
      'Siết chặt 3 bu-lông động cơ và trục bánh sau.',
    ],
  },
  'phanh-sau': {
    attach: 'Ôm đĩa phanh sau, bắt vào pát trên càng',
    fasteners: '2 bu-lông M8 (~25 N·m)',
    tools: ['Lục giác 6'],
    steps: ['Úp ngàm vào đĩa phanh sau.', 'Bắt 2 bu-lông vào pát càng.', 'Bóp tay phanh trái để kiểm tra.'],
  },
  'giam-xoc-sau': {
    attach: 'Nối càng sau (dưới) với khung (trên)',
    fasteners: '4 bu-lông M10 (2 trên, 2 dưới)',
    tools: ['Cờ lê 14', 'Kích kê xe'],
    steps: ['Kê xe để càng sau không bị đè.', 'Bắt đầu dưới giảm xóc vào càng.', 'Nâng càng tới khi lỗ trên trùng pát khung, bắt bu-lông trên.', 'Siết cả 4 bu-lông.'],
  },
  'bo-dieu-khien': {
    attach: 'Bắt lên tấm đỡ kim loại trên khung (để tản nhiệt)',
    fasteners: '4 vít M6 + 3 cọc pha + giắc tín hiệu',
    tools: ['Lục giác 5', 'Keo tản nhiệt', 'Găng cách điện'],
    steps: [
      'Bôi lớp keo tản nhiệt mỏng lên đế bộ điều khiển.',
      'Bắt 4 vít lên tấm đỡ trên khung.',
      'Nối 3 dây pha U-V-W tới động cơ (đúng màu).',
      'Cắm giắc tín hiệu: tay ga, phanh, chân chống, Hall, CAN.',
      'Nối dây cao áp từ rơ-le SAU CÙNG.',
    ],
  },
  cop: {
    attach: 'Đặt vào khung sau, dưới yên',
    fasteners: '4 vít',
    tools: ['Tua vít'],
    steps: ['Thả cốp vào giữa hai thanh khung sau.', 'Bắt 4 vít ở mép cốp.'],
  },
  'vo-than': {
    attach: 'Ôm bao thân sau, che bộ điều khiển và cốp',
    fasteners: '8–10 vít + lẫy gài',
    tools: ['Tua vít', 'Lục giác 4'],
    steps: ['Kiểm tra mọi giắc phía sau đã cắm chắc.', 'Úp ốp thân từ trên xuống, gài lẫy với sàn để chân.', 'Bắt vít hai bên và dưới đuôi.'],
  },
  yen: {
    attach: 'Bắt bản lề yên lên ốp thân / khung',
    fasteners: '2 bu-lông bản lề + chốt khoá yên',
    tools: ['Cờ lê 10'],
    steps: ['Đặt bản lề yên vào pát phía trước.', 'Bắt 2 bu-lông bản lề.', 'Đóng yên thử: chốt khoá phải ăn khớp.'],
  },
  'den-hau': {
    attach: 'Bắt vào đuôi xe',
    fasteners: '2 vít + 1 giắc 12 V (3 chân: đèn hậu, đèn phanh, mass)',
    tools: ['Tua vít'],
    steps: ['Cắm giắc 3 chân của đèn.', 'Đặt đèn vào đuôi, bắt 2 vít.', 'Bật khoá + bóp phanh để thử cả hai chế độ sáng.'],
  },
  'cong-sac': {
    attach: 'Bắt vào lỗ trên vỏ xe',
    fasteners: '4 vít + giắc nối tới pin',
    tools: ['Tua vít'],
    steps: ['Luồn dây cổng sạc vào trong vỏ.', 'Bắt cổng vào lỗ trên vỏ bằng 4 vít, gioăng cao su ở ngoài.', 'Cắm giắc nối tới pin/BMS.'],
  },
  'chan-chong': {
    attach: 'Bắt vào pát chân chống bên trái khung',
    fasteners: '1 bu-lông chốt + lò xo hồi + giắc công tắc',
    tools: ['Cờ lê 14', 'Móc lò xo'],
    steps: ['Bắt chân chống vào pát bằng bu-lông chốt.', 'Móc lò xo hồi (dùng móc, không dùng tay).', 'Cắm giắc công tắc chân chống.', 'Gạt lên xuống thử: phải bật về dứt khoát.'],
  },
  'op-binh': {
    attach: 'Úp bao trùm khối pin giữa khung',
    fasteners: '6 vít + 2 chốt nhanh',
    tools: ['Lục giác 4'],
    steps: ['Kiểm tra giắc pin và giắc cổng sạc đã cắm.', 'Úp ốp bình từ trên xuống, căn khe với khung.', 'Bắt vít hai bên và chốt phía sau.'],
  },
  'op-hong': {
    attach: 'Bắt hai bên khung phụ dưới yên',
    fasteners: '2 vít mỗi bên + lẫy',
    tools: ['Tua vít'],
    steps: ['Gài lẫy của ốp hông vào khung phụ.', 'Bắt vít mỗi bên.'],
  },
  'duoi-xe': {
    attach: 'Bắt vào khung phụ phía sau',
    fasteners: '4 bu-lông M6',
    tools: ['Lục giác 4'],
    steps: ['Đặt ốp đuôi và chắn bùn sau lên khung phụ.', 'Bắt 4 bu-lông.', 'Lắp giá biển số.'],
  },
};

const GENERIC = {
  attach: 'Gắn vào vị trí được đánh dấu bằng bóng xanh',
  fasteners: 'Bu-lông/vít kèm theo',
  tools: ['Bộ tua vít, cờ lê'],
  steps: ['Đưa bộ phận vào đúng vị trí.', 'Bắt bu-lông/vít giữ.', 'Cắm giắc (nếu có).'],
};

export function howto(model, partId) {
  const drive = model.drive === 'hub' ? 'hub' : model.drive === 'side-belt' ? 'side' : 'mid';
  if (partId === 'dong-co') return H[`dong-co:${drive}`] || GENERIC;
  if ((partId === 'pin' || partId === 'pin-2') && model.battery === 'seat-dual') return H['pin:seat'];
  if (partId === 'pin-2') return H.pin;
  return H[partId] || GENERIC;
}
