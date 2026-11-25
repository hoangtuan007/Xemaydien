# Xưởng Xe Điện 3D

Trang web học **tháo – lắp xe máy điện** và hiểu **bố trí điện, động cơ** bằng mô hình 3D tương tác.
Hai mẫu xe tham khảo:

| Mẫu | Kiểu | Điểm học chính |
|---|---|---|
| **VinFast Evo200** (mô phỏng) | Xe tay ga, động cơ **in-hub** trong bánh sau | Truyền động trực tiếp, pin LFP dưới sàn để chân |
| **Dat Bike Weaver++** (mô phỏng) | Xe số điện, động cơ **đặt giữa** + **xích** | Nhông – xích, tỉ số truyền, pin lớn trong "bình xăng" |

## Tính năng

- **Tháo rời**: nhấp để xem bộ phận làm gì, nhấp đúp để tháo. Phải tháo đúng thứ tự như xe thật: yên → ốp → pin…
  Bộ phận bị chặn có 🔒, kèm danh sách cần tháo trước.
- **Lắp ráp**: bóng xanh chỉ vị trí lắp; nút *Gợi ý bước tiếp* chỉ bước tiếp theo theo đúng quy trình.
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
js/shapes.js             Hàm dựng hình (bánh, đĩa phanh, nhông, xích, lò xo…)
js/models/common.js      Bộ phận điện dùng chung (pin, controller, DC-DC…)
js/models/vinfast-evo.js Mẫu xe tay ga in-hub
js/models/datbike-weaver.js Mẫu xe động cơ đặt giữa
vendor/                  three.js r160 (MIT) đóng gói sẵn để chạy offline
```

### Thêm mẫu xe mới

Tạo một file trong `js/models/` theo cùng cấu trúc: danh sách `parts`
(mỗi bộ phận có `build()`, `explode` – vị trí khi tháo, `after` – các bộ phận phải lắp trước),
và danh sách `wires` (đường dây, loại dây, kênh mô phỏng). Sau đó thêm vào `MODELS` trong `js/app.js`.

## Lưu ý

Thông số lấy từ công bố công khai của hãng ([VinFast Evo200](https://shop.vinfastauto.com/vn_en/xe-may-dien-zgoo.html),
[Dat Bike Weaver++](https://dat.bike/en/pages/weaver-plus-plus)). Hình dáng 3D, vị trí linh kiện và đường dây là
**mô phỏng đơn giản hoá để học tập**, không phải tài liệu sửa chữa chính hãng.
Không tự ý tháo pin hoặc hệ thống cao áp trên xe thật nếu không có chuyên môn và dụng cụ cách điện.
Tên VinFast và Dat Bike thuộc về chủ sở hữu tương ứng; dự án này không liên kết với hai hãng.
