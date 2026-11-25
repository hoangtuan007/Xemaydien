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
vendor/                  three.js r160 (MIT) đóng gói sẵn để chạy offline
```

### Thêm mẫu xe mới

Xe tay ga: thêm một cấu hình `makeScooter({...})` vào `js/models/lineup.js`
(kiểu dáng `modern | classic | sport | maxi`, truyền động `hub | side-belt | mid-chain`,
pin `floor | floor-big | seat-dual`, màu, thông số). Kiểu xe khác: viết file riêng như
`datbike-weaver.js` với danh sách `parts` (`build()`, `explode`, `after`) và `wires`, rồi thêm vào `LINEUP`.

## Lưu ý

Thông số lấy từ công bố công khai của hãng và báo chí (đường dẫn nguồn có trong `js/models/lineup.js` và trên trang).
Một số thông tin chưa xác minh được (công suất động cơ Feliz S, Klara S; vị trí động cơ Quantum) được ghi rõ là mô phỏng/giả định. Hình dáng 3D, vị trí linh kiện và đường dây là
**mô phỏng đơn giản hoá để học tập**, không phải tài liệu sửa chữa chính hãng.
Không tự ý tháo pin hoặc hệ thống cao áp trên xe thật nếu không có chuyên môn và dụng cụ cách điện.
Tên VinFast và Dat Bike thuộc về chủ sở hữu tương ứng; dự án này không liên kết với hai hãng.
