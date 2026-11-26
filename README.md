# Xưởng Xe Điện 3D

Trang web học **tháo – lắp xe máy điện** và hiểu **bố trí điện, động cơ** bằng mô hình 3D tương tác.
8 mẫu xe tham khảo, chia theo cách bố trí động cơ và pin:

| Hãng | Mẫu (mô phỏng) | Động cơ / truyền động | Pin |
|---|---|---|---|
| VinFast | Evo200 | In-hub bánh sau | LFP dưới sàn để chân |
| VinFast | Feliz S | In-hub bánh sau | LFP dưới sàn để chân |
| VinFast | Klara S | In-hub bánh sau | **2 pin rời dưới yên** |
| VinFast | Vento S | **Động cơ đặt bên + dây đai** | LFP dưới sàn |
| VinFast | Theon S | **Động cơ đặt giữa + xích** | LFP 72 V dưới sàn |
| Dat Bike | Weaver++ | Động cơ đặt giữa + xích | Pin 72 V trong "bình xăng" |
| Dat Bike | Quantum S1 / S3 | Truyền động xích | LFP 6,4 / 4,3 kWh dưới sàn |

## Tính năng

- **Tháo rời**: nhấp để xem bộ phận làm gì, nhấp đúp để tháo. Phải tháo đúng thứ tự như xe thật: yên → ốp → pin…
  Bộ phận bị chặn có 🔒, kèm danh sách cần tháo trước.
- **Lắp ráp kéo – thả – tự khớp**: kéo một bộ phận lại gần vị trí của nó, bóng xanh hiện ra và các bộ phận nó gắn vào
  sáng lên. Đủ gần thì bộ phận tự hút vào, rồi có hoạt ảnh bắt vít và cắm giắc điện.
  Thả sai thứ tự thì bóng chuyển đỏ và báo cần lắp gì trước.
- **Hướng dẫn lắp từng bước** cho mọi bộ phận: gắn vào đâu, chi tiết bắt (bu-lông, lực siết tham khảo),
  dụng cụ, thứ tự cắm giắc. Các bước tự đánh dấu khi bộ phận khớp vào xe.
- **Sơ đồ điện**: vỏ xe trong suốt (X-quang), dây điện tô màu theo loại (cao áp, 3 pha, 12 V, tín hiệu, sạc).
  Bật khoá, gạt chân chống, vặn ga để thấy dòng điện chạy, bánh quay, đèn sáng. Có sơ đồ khối đồng bộ.
  Thử tháo một bộ phận để xem vì sao xe không chạy (thiếu rơ-le, thiếu xích, đang bóp phanh…).
- **Thử thách**: xe bị tháo hết, danh sách xáo trộn; lắp lại nhanh nhất với ít lỗi nhất (lưu kỷ lục trên trình duyệt).
- Quy tắc an toàn: không cho tháo bộ phận điện khi khoá điện đang bật hoặc đang cắm sạc.

## Chạy thử

Trang là HTML/JS thuần, không cần build. Chỉ cần một web server tĩnh (vì dùng ES modules):

```bash
python3 -m http.server 8000
# mở http://localhost:8000
```

Có thể đăng lên **GitHub Pages**: Settings → Pages → Deploy from branch → chọn nhánh và thư mục `/`.

## Cấu trúc

```
index.html               Giao diện
css/style.css            Giao diện sáng/tối, responsive
js/app.js                Cảnh 3D, quy tắc tháo/lắp, các chế độ
js/sim.js                Mô phỏng logic điện (khoá, rơ-le, bộ điều khiển, an toàn)
js/schematic.js          Sơ đồ khối SVG
js/howto.js              Hướng dẫn lắp từng bộ phận
js/shapes.js             Hàm dựng hình (bánh, đĩa phanh, nhông, xích, lò xo…)
js/models/common.js      Bộ phận điện dùng chung (pin, controller, DC-DC…)
js/models/scooter.js     Bộ sinh xe tay ga có tham số (kiểu dáng, truyền động, vị trí pin)
js/models/lineup.js      Danh sách 8 mẫu xe + thông số + nguồn
js/models/datbike-weaver.js Mẫu xe số điện động cơ đặt giữa
assets/photos/           Ảnh xe thật (Wikimedia Commons) + photos.json khai báo tác giả, giấy phép
vendor/                  three.js r160 (MIT) đóng gói sẵn để chạy offline
```

### Thêm mẫu xe mới

Xe tay ga: thêm một cấu hình `makeScooter({...})` vào `js/models/lineup.js`
(kiểu dáng `modern | classic | sport | maxi`, truyền động `hub | side-belt | mid-chain`,
pin `floor | floor-big | seat-dual`, màu, thông số). Kiểu xe khác: viết file riêng như
`datbike-weaver.js` với danh sách `parts` (`build()`, `explode`, `after`) và `wires`, rồi thêm vào `LINEUP`.

## Ảnh xe thật

Ảnh trong `assets/photos/` lấy từ **Wikimedia Commons** theo giấy phép tự do (CC BY, CC BY-SA, CC0),
đã thu nhỏ còn tối đa 800px. Ảnh dùng lại theo đúng giấy phép gốc: ghi tên tác giả, dẫn link giấy phép,
và ảnh CC BY-SA khi chia sẻ lại vẫn giữ giấy phép CC BY-SA. Trên trang, mỗi ảnh đều hiện dòng ghi công.

- Commons chưa có ảnh tự do của **Dat Bike** (Weaver++, Quantum), nên các mẫu này giữ hình bóng và có nút dẫn tới trang của hãng.
- Ảnh mẫu Theon S là xe **Theon đời đầu** (Theon S là bản nâng cấp), trên trang có ghi chú.
- Ảnh bộ phận (động cơ in-hub, phanh, giảm xóc, xích, đồng hồ, đèn) là ảnh minh hoạ cùng loại bộ phận, không nhất thiết của đúng mẫu xe.

| File | Ảnh gốc | Tác giả | Giấy phép |
|---|---|---|---|
| `vinfast-evo200.jpg` | [Newone - Yellow VinFast Evo200 electric scooter.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_Yellow_VinFast_Evo200_electric_scooter.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-feliz-s.jpg` | [NewOne - Xanh SM VinFast Feliz S cyan 01.jpg](https://commons.wikimedia.org/wiki/File:NewOne_-_Xanh_SM_VinFast_Feliz_S_cyan_01.jpg) | Newone | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| `vinfast-klara-s-1.jpg` | [Newone -VinFast Klara S red.jpg](https://commons.wikimedia.org/wiki/File:Newone_-VinFast_Klara_S_red.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-klara-s-2.jpg` | [Newone - VinFast Klara S 03.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_Klara_S_03.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-klara-s-3.jpg` | [Newone - VinFast Klara S 05.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_Klara_S_05.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-vento-s-1.jpg` | [Newone - White VinFast Vento S 01.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_White_VinFast_Vento_S_01.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-vento-s-2.jpg` | [Newone - White VinFast Vento S 02.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_White_VinFast_Vento_S_02.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-vento-s-3.jpg` | [Newone - White VinFast Vento S 03.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_White_VinFast_Vento_S_03.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-theon-1.jpg` | [Newone - VinFast Theon black 006.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_Theon_black_006.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `vinfast-theon-2.jpg` | [Newone - VinFast Theon black 008.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_Theon_black_008.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-vinfast-lfp-battery.jpg` | [Newone - VinFast scooter LFP battery 1.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_scooter_LFP_battery_1.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-klara-removable-battery.jpg` | [Newone - VinFast lithium-ion battery for Klara scooter by Bosch.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_lithium-ion_battery_for_Klara_scooter_by_Bosch.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-hub-motor-open.jpg` | [Wheel hub motor of an electric kick scooter, sidepanel removed (2022).jpg](https://commons.wikimedia.org/wiki/File:Wheel_hub_motor_of_an_electric_kick_scooter,_sidepanel_removed_(2022).jpg) | Andrez1 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-brake-caliper.jpg` | [Brembo p4-32 Caliper.jpg](https://commons.wikimedia.org/wiki/File:Brembo_p4-32_Caliper.jpg) | Sinank56 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-rear-caliper.jpg` | [Honda rear brake caliper.jpg](https://commons.wikimedia.org/wiki/File:Honda_rear_brake_caliper.jpg) | MAbbey | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-vinfast-front-wheel.jpg` | [Newone - VinFast Theon black 014.jpg](https://commons.wikimedia.org/wiki/File:Newone_-_VinFast_Theon_black_014.jpg) | Newone | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-chain-sprocket.jpg` | [Day 46 Cy365 Geared Up (61099044).jpeg](https://commons.wikimedia.org/wiki/File:Day_46_Cy365_Geared_Up_(61099044).jpeg) | Makia Minich | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| `part-rear-shock.jpg` | [GSXR Shock (3639723588).jpg](https://commons.wikimedia.org/wiki/File:GSXR_Shock_(3639723588).jpg) | Andrew Napier | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |
| `part-ev-dashboard.jpg` | [GenZe Electric Scooter 2.0s dashboard - June 2018 (1998).jpg](https://commons.wikimedia.org/wiki/File:GenZe_Electric_Scooter_2.0s_dashboard_-_June_2018_(1998).jpg) | Gregory Varnum | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| `part-headlight.jpg` | [Honda Zoomer Dual Headlight.JPG](https://commons.wikimedia.org/wiki/File:Honda_Zoomer_Dual_Headlight.JPG) | Khaosaming | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |

## Lưu ý

Thông số lấy từ công bố công khai của hãng và báo chí (đường dẫn nguồn có trong `js/models/lineup.js` và trên trang).
Một số thông tin chưa xác minh được (công suất động cơ Feliz S, Klara S; vị trí động cơ Quantum) được ghi rõ là mô phỏng/giả định. Hình dáng 3D, vị trí linh kiện và đường dây là
**mô phỏng đơn giản hoá để học tập**, không phải tài liệu sửa chữa chính hãng.
Không tự ý tháo pin hoặc hệ thống cao áp trên xe thật nếu không có chuyên môn và dụng cụ cách điện.
Tên VinFast và Dat Bike thuộc về chủ sở hữu tương ứng; dự án này không liên kết với hai hãng.
