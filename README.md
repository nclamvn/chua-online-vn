# Hiên An

Hiên An là một quần thể chùa Việt 3D trên web. Bạn có thể đi bộ qua hồ sen, vào chánh điện, ghé phố hội hoặc ngồi thiền cùng khách trong một sân. [Mở bản công khai](https://hien-an-r4.nclamvn.chatgpt.site/).

## Chạy cục bộ

Cần Node.js 22.13 trở lên và npm. Các lệnh sau dùng cơ sở dữ liệu D1 cục bộ. Chạy vòng lặp migration một lần khi khởi tạo cơ sở dữ liệu mới.

```sh
npm ci
npm run build

for migration in drizzle/*.sql; do
  node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js \
    d1 execute DB --config dist/server/wrangler.json --local \
    --persist-to .wrangler/state --file "$migration" || break
done

npm start -- --port 4387
```

Mở [http://127.0.0.1:4387](http://127.0.0.1:4387). Sau khi sửa Worker hoặc API, chạy lại build và khởi động lại server.

## Kiểm tra

```sh
npm run lint -- --max-warnings=0
npm run typecheck
npm test
npm run test:integration
```

Bộ tích hợp cần server cục bộ đang chạy và sân `hien-an-03` trống. Đặt `HIEN_AN_TEST_URL` nếu dùng cổng khác. Bộ này kiểm tra kết nối nhiều phiên, đồng bộ chắp tay, sức chứa và giữ chỗ chánh điện, gieo quẻ và phiếu lễ mô phỏng.

## Cấu trúc

- `public/` chứa giao diện, cảnh Three.js, tài nguyên và ghi công.
- `app/api/`, `worker/` và `lib/` xử lý sân chung và phiếu lễ.
- `drizzle/` chứa migration D1, áp dụng theo thứ tự tên tệp.
- `scripts/` chứa lệnh build và kiểm tra.

Ba sân chung hỗ trợ tối đa 200 phiên đang hoạt động mỗi sân. Chế độ Ngày hội lớn thêm tối đa 1.000 nhân vật mô phỏng trên trình duyệt. Phiếu lễ, vé hội và quẻ là nội dung mô phỏng. Thông tin nguồn và giấy phép tài nguyên nằm trong [trang ghi công](public/credits.html).
