// IDs 0–3 were accepted by earlier versions of the presence protocol.
export const COSTUMES = [
 {id:4, name:'Đường Tăng', collection:'Tây Du Ký', colors:['#ac3327','#eeb34d'], profile:0, hair:5, style:'pilgrim'},
 {id:5, name:'Tôn Ngộ Không', collection:'Tây Du Ký', colors:['#ba7c26','#f1bc4a'], profile:2, hair:0, style:'monkey'},
 {id:6, name:'Trư Bát Giới', collection:'Tây Du Ký', colors:['#3e4b65','#df9d91'], profile:4, hair:5, style:'boar'},
 {id:7, name:'Sa Tăng', collection:'Tây Du Ký', colors:['#306466','#89503a'], profile:6, hair:5, style:'river'},
 {id:8, name:'Spider-Man', collection:'Marvel', colors:['#ae2c30','#224e87'], profile:2, hair:5, style:'spider'},
 {id:9, name:'Iron Man', collection:'Marvel', colors:['#9f201e','#deaf46'], profile:6, hair:5, style:'iron'},
 {id:10, name:'Captain America', collection:'Marvel', colors:['#28456e','#a82d32'], profile:6, hair:5, style:'captain'},
 {id:11, name:'Thor', collection:'Marvel', colors:['#3b4750','#a9323a'], profile:6, hair:0, style:'thunder'},
 {id:12, name:'Siêu nhân Đỏ', collection:'Đội siêu nhân', colors:['#a62229','#ebe1c4'], profile:0, hair:5, style:'ranger'},
 {id:13, name:'Siêu nhân Lam', collection:'Đội siêu nhân', colors:['#174ea0','#ebe1c4'], profile:5, hair:5, style:'ranger'},
 {id:14, name:'Siêu nhân Lục', collection:'Đội siêu nhân', colors:['#267152','#e4c275'], profile:7, hair:5, style:'ranger'}
];
export const MAX_OUTFIT = COSTUMES.at(-1).id;
export const MARKET_STALLS = [
 {id:'fair-food', name:'Bếp phố hội', sign:'BẾP PHỐ HỘI', type:'food', x:-9.4, z:92, color:'#a54131', description:'Bánh gói lá, xửng tre và bếp nhỏ bên đường.', items:['Bánh chưng lá dong','Bánh đúc nóng','Khoai nướng']},
 {id:'fair-tea', name:'Trà & nước mát', sign:'TRÀ & NƯỚC MÁT', type:'tea', x:9.4, z:92, color:'#426e65', description:'Trà thơm và nước mát trong những bình gốm men xanh.', items:['Trà sen','Nước sấu','Nước mơ']},
 {id:'fair-toys', name:'Quầy tò he', sign:'TÒ HE', type:'toys', x:-9.4, z:83, color:'#b97c2e', description:'Chọn một món bột nặn nhiều màu để ghi vào sổ hội.', items:['Cá chép','Chim nhỏ','Khỉ ôm đào']},
 {id:'fair-lanterns', name:'Tiệm đèn giấy', sign:'ĐÈN GIẤY', type:'lanterns', x:9.4, z:83, color:'#9d424c', description:'Đèn xếp bằng giấy màu, treo dưới mái sạp.', items:['Đèn cá chép','Đèn ngôi sao','Đèn sen']},
 {id:'fair-letters', name:'Sạp xin chữ', sign:'XIN CHỮ', type:'letters', x:-9.4, z:74, color:'#66557b', description:'Xin một chữ để tải về làm kỷ niệm.', items:['An','Nhẫn','Tâm','Hòa']},
 {id:'fair-costumes', name:'Tủ hóa trang', sign:'TỦ HÓA TRANG', type:'costumes', x:9.4, z:74, color:'#376d74', description:'Thử trang phục Tây Du Ký, Marvel và đội siêu nhân. Khách cùng sân nhìn thấy bộ đồ bạn mặc.'},
 {id:'fair-lottery-east', name:'Vé số phố hội', sign:'VÉ SỐ PHỐ HỘI', type:'lottery', x:9.4, z:100, color:'#176d8c', description:'Một xấp vé nhiều màu kiểu sạp vé số ngoài phố. Chọn mẫu để giữ làm kỷ niệm.', items:['Vé sen đỏ','Vé mai vàng','Vé hội xanh']},
 {id:'fair-lottery-west', name:'Vé số tam quan', sign:'VÉ SỐ TAM QUAN', type:'lottery', x:-9.4, z:56, color:'#a53161', description:'Vé giấy họa tiết tam quan, đèn cá và đoàn lân.', items:['Vé tam quan','Vé đèn cá','Vé múa lân']},
 {id:'fair-fortune-coin', name:'Bàn xem bói · Đồng xu', sign:'XEM QUẺ ĐỒNG XU', type:'fortune', x:-9.4, z:100, color:'#8f345b', description:'Thử gieo ba đồng xu và đọc một lời gợi mở.', items:[]},
 {id:'fair-fortune-bamboo', name:'Bàn xem bói · Thẻ tre', sign:'XIN THẺ TRE', type:'fortune', x:-9.4, z:65, color:'#5f478e', description:'Rút một thẻ tre để lấy một câu nhắc nhỏ cho hôm nay.', items:['Đi chậm một nhịp và để ý điều mình thường bỏ qua.','Dành ít phút cho việc đơn giản nhất đang chờ mình.','Hỏi thăm một người mà mình lâu rồi chưa gặp.']},
 {id:'fair-fortune-card', name:'Bàn xem bói · Thẻ hoa', sign:'XEM QUẺ THẺ HOA', type:'fortune', x:9.4, z:56, color:'#286f5e', description:'Rút một thẻ hoa và đọc câu hỏi chiêm nghiệm đi cùng.', items:['Hoa sen · Việc gì giúp mình bình tâm ngay lúc này?','Hoa mai · Mình muốn bắt đầu lại từ đâu?','Hoa cúc · Điều giản dị nào đáng dành thêm thời gian?']},
 {id:'fair-fruit', name:'Gánh trái cây', sign:'TRÁI CÂY THEO MÙA', type:'fruit', x:-12, z:46, color:'#b86524', description:'Những giỏ trái cây và mía xếp dưới mái sọc.', items:['Xoài xanh','Ổi giòn','Mía ướp lạnh']},
 {id:'fair-snacks', name:'Hàng chè và bánh', sign:'CHÈ & BÁNH', type:'food', x:12, z:46, color:'#a43e35', description:'Một quầy nhỏ với chè đậu, xôi và bánh lá.', items:['Chè đậu xanh','Xôi lá cẩm','Bánh ít']},
 {id:'fair-stage', name:'Sân diễn', sign:'SÂN DIỄN', type:'stage', x:9.4, z:65, color:'#8b3830', description:'Ghé sân khấu xem đoàn hóa trang đi qua, tập hợp cùng bạn bè hoặc chụp một khung hình.'}
];
export const stallFront = ({x,z})=>[x-Math.sign(x)*3.4,z];
export const MARKET_CARTS = [
 {id:'fair-food', name:'Xe bánh rong', sign:'BÁNH NÓNG', type:'food', color:'#ab4034', x:-5.7, z:95.8},
 {id:'fair-toys', name:'Xe tò he', sign:'TÒ HE', type:'toys', color:'#287a6d', x:5.7, z:79},
 {id:'fair-lottery-east', name:'Xe vé số', sign:'VÉ SỐ', type:'lottery', color:'#226b91', x:5.6, z:96.1},
 {id:'fair-tea', name:'Xe nước sấu', sign:'NƯỚC SẤU', type:'tea', color:'#407345', x:-5.6, z:87.5},
 {id:'fair-fruit', name:'Xe trái cây', sign:'TRÁI CÂY', type:'fruit', color:'#c47726', x:5.65, z:87.6},
 {id:'fair-lottery-west', name:'Xe vé số tam quan', sign:'VÉ SỐ', type:'lottery', color:'#9f3e65', x:-5.65, z:78.6},
 {id:'fair-snacks', name:'Xe chè rong', sign:'CHÈ RONG', type:'tea', color:'#8a4c9a', x:-5.6, z:68.7},
 {id:'fair-lanterns', name:'Xe đèn giấy', sign:'ĐÈN GIẤY', type:'toys', color:'#ad5330', x:5.65, z:69.1},
 {id:'fair-fruit', name:'Gánh mía lạnh', sign:'MÍA LẠNH', type:'fruit', color:'#57944f', x:-6.2, z:51},
 {id:'fair-lottery-east', name:'Xe vé số sân hội', sign:'VÉ SỐ', type:'lottery', color:'#397b85', x:6.2, z:51},
];
export const FAIR_BUNTING_ROWS=[50,60,70,79,86,93,101,107];

export const LION_POINT={x:3.5,z:78.5};
export const BEAT_MS=400;
