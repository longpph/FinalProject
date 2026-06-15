// class Room {
//     #isBooked = false;
//     #basePrice = 0;
//     constructor(id, type, floor, basePrice, isBooked = false) {
//     this.id = id;
//     this.type = type;
//     this.floor = floor;
//     if (basePrice < 0) {
//         throw new Error(`Lỗi: Giá phòng ${this.id} Không được để giá âm`);
//     } else {
//         this.#basePrice = basePrice;
//     }
//     // Cập nhật trạng thái phòng được truyền vào từ localStorage
//     this.#isBooked = isBooked; 
// }
//     set basePrice(newPrice) {
//         if (newPrice < 0) {
//             throw new Error(`Lỗi: Giá phòng ${this.id} Không được để giá âm`)
//         } else {
//             this.#basePrice = newPrice;
//         }
//     }
//     get basePrice() {
//         return this.#basePrice;
//     }
//     get isBooked() {
//         return this.#isBooked;
//     }
//     book() {
//         if (this.#isBooked) {
//             return {
//                 status: false,
//                 message: `Phòng ${this.id} đã có khách đặt`
//             };
//         }
//         this.#isBooked = true;
//         return {
//             status: true,
//             message: `Đã đặt phòng ${this.id} thành công`
//         };
//     }
//     cancel() {
//         this.#isBooked = false;
//     }
//     get Information() {
//         return {
//             id: this.id,
//             type: this.type,
//             floor: this.floor,
//             price: this.#basePrice,
//             status: this.#isBooked ? "Đã đặt" : "Còn trống"
//         };
//     }
// }
// class Customer {
//     constructor(id, name, phone, referredBy = null) {
//         this.id = id;
//         this.name = name;
//         const regex = /^(\+84|0)(3|5|7|8|9)\d{8}$/;
//         if (!regex.test(phone)) {
//             throw new Error(`Lỗi: Số điện thoại khách ${this.name} không hợp lệ`);
//         } else {
//             this.phone = phone;
//         }
//         this.referredBy = referredBy;
//     }
// }
// class bookingSystem {
//     constructor() {
//         this.rooms = [];
//         this.bookings = [];
//         this.customers = [];
//     }
//     addRoom(newRoom) {
//         this.rooms.push(newRoom);
//     }
//     initFloorMatrix() {
//         // [ADM-04] LẤY DATA TỪ LOCALSTORAGE KHI F5 TRANG
//         const localRooms = localStorage.getItem("hotel_rooms");
//         const localBookings = localStorage.getItem("hotel_bookings");
//         const localCustomers = localStorage.getItem("hotel_customers");

//         if (localRooms && localBookings) {
//             const rawMatrix = JSON.parse(localRooms);
//             this.bookings = JSON.parse(localBookings);
//             this.customers = localCustomers ? JSON.parse(localCustomers) : [];

//             // THỬ THÁCH PHỤC HỒI (Re-instantiation): Ép data raw chạy qua "new Room()" để lấy lại hàm #isBooked, book()...
//             this.rooms = rawMatrix.map(floorArray =>
//                 floorArray.map(r => new Room(r.id, r.type, r.floor, r.price, r.status === "Đã đặt"))
//             );
//             return; // Thoát hàm, không khởi tạo lại từ đầu nữa
//         }

//         // --- Khởi tạo mặc định nếu chưa có dữ liệu trong máy (giữ nguyên code cũ của bạn bên dưới) ---
//         const roomTypeMap = { 1: { type: "Standard", price: 1000000 }, 2: { type: "Deluxe", price: 2000000 }, 3: { type: "Suite", price: 4000000 } };
//         const hotelmatrix = [   [1, 1, 2, 2, 3],
//                                 [1, 2, 2, 3, 3],
//                                 [2, 2, 3, 3, 3]
//                             ];
//         for (let i = 0; i < hotelmatrix.length; i++) {
//             let floorArray = [];
//             for (let j = 0; j < hotelmatrix[i].length; j++) {
//                 let roomTypeCode = hotelmatrix[i][j];
//                 let roomID = (i + 1) + "0" + (j + 1);
//                 floorArray.push(new Room(roomID, roomTypeMap[roomTypeCode].type, i + 1, roomTypeMap[roomTypeCode].price));
//             }
//             this.rooms.push(floorArray);
//         }
//         this.saveData();
//     }
//     saveData() {
//         const rawRoomsMatrix = this.rooms.map(floorArray => floorArray.map(r => r.Information));
//         localStorage.setItem("hotel_rooms", JSON.stringify(rawRoomsMatrix));
//         localStorage.setItem("hotel_bookings", JSON.stringify(this.bookings));
//         localStorage.setItem("hotel_customers", JSON.stringify(this.customers));
//     }

//     // [ADM-05 & SYS-05] Hàm gom nhóm doanh thu bằng reduce() tách biệt hoàn toàn với logic vẽ giao diện
//     getAdminStatistics() {
//         // 1. Lọc các hóa đơn có giá trị phòng > 2.000.000đ
//         const vipBookings = this.bookings.filter(b => b.roomDetails.price > 2000000);
        
//         // 2. Tính tổng doanh thu toàn bộ hóa đơn trong hệ thống
//         const totalRevenue = this.bookings.reduce((sum, b) => sum + b.roomDetails.price, 0);
        
//         // 3. Dùng reduce để tính tổng tiền theo từng loại phòng phục vụ vẽ biểu đồ Canvas
//         const revenueByType = this.bookings.reduce((acc, b) => {
//             const type = b.roomDetails.type;
//             if (acc[type] !== undefined) acc[type] += b.roomDetails.price;
//             return acc;
//         }, { Standard: 0, Deluxe: 0, Suite: 0 });

//         return { 
//             totalRevenue, 
//             vipCount: vipBookings.length, 
//             vipList: vipBookings, // Trả về danh sách chi tiết phòng VIP
//             revenueByType         // Trả về dữ liệu nhóm doanh thu cho hàm vẽ biểu đồ
//         };
//     }
//     searchRooms(filterID, filterType, filterFloor) {
//         let foundRooms = [];
//         for (let i = 0; i < this.rooms.length; i++) {
//             let currentFloorArray = this.rooms[i];
//             for (let j = 0; j < currentFloorArray.length; j++) {
//                 let currentRoom = currentFloorArray[j];
//                 let matchID = (filterID === null || filterID === "") || (currentRoom.id === filterID);
//                 let matchType = (filterType === null || filterType === "") || (currentRoom.type === filterType);
//                 let matchFloor = (filterFloor === null || filterFloor === "") || (currentRoom.floor === Number(filterFloor));
//                 let isAvailable = (currentRoom.isBooked === false);
//                 if (matchID && matchType && matchFloor) {
//                     foundRooms.push(currentRoom.Information);
//                 }
//             }
//         }
//         return foundRooms;
//     }
//     bookingRoom(roomID, customerID) {
//         let targetRoom = null;
//         for (let i = 0; i < this.rooms.length; i++) {
//             let currentFloorArray = this.rooms[i];
//             for (let j = 0; j < currentFloorArray.length; j++) {
//                 if (currentFloorArray[j].id === roomID) {
//                     targetRoom = currentFloorArray[j];
//                     break;
//                 }
//             }
//             if (targetRoom) break;
//         }
//         if (targetRoom === null) {
//             return {
//                 success: false,
//                 message: "Phòng bạn muốn đặt đã hết!"
//             };
//         }
//         let bookingResult = targetRoom.book();
//         if (bookingResult.status === true) {
//             // LẤY GIÁ PHÒNG GỐC
//             let finalPrice = targetRoom.Information.price;
//             // ÁP DỤNG ĐỆ QUY TÍNH ĐIỂM: Nếu điểm >= 20 thì giảm giá 5% hóa đơn
//             let points = calculateReferralPoints(customerID, this.customers);
//             if (points >= 20) {
//                 finalPrice = finalPrice * 0.95; // Giảm 5% giá phòng
//             }
//             let newBooking = {
//                 bookingID: "BK" + Math.floor(Math.random() * 10000),
//                 roomID: targetRoom.id,
//                 customerID: customerID,
//                 date: new Date().toLocaleDateString('vi-VN'),
//                 roomDetails: {
//                     ...targetRoom.Information,
//                     price: finalPrice // Lưu giá tiền thực tế sau khi giảm vào hóa đơn
//                 }
//             };
//             this.bookings.push(newBooking);
//             this.saveData(); // <--- Thêm dòng này để tự động lưu lại vào localStorage
//             return {
//                 success: true,
//                 message: `${bookingResult.message}. Đã tạo hoá đơn ${newBooking.bookingID}`
//             };
//         }
//     }
//     getMatrixData() {
//         let matrixData = [];
//         for (let i = 0; i < this.rooms.length; i++) {
//             let floorArray = this.rooms[i];
//             let floorData = [];
//             for (let j = 0; j < floorArray.length; j++) {
//                 floorData.push(floorArray[j].Information);
//             }
//             matrixData.push(floorData);
//         }
//         return matrixData;
//     }
//     suggestAdjacentRooms(quantity) {
//         // 1. KIỂM TRA ĐIỀU KIỆN (Validate): Số lượng phòng nhập vào phải lớn hơn 1
//         if (quantity <= 1) {
//             throw new Error("Số lượng phòng cần tìm cho nhóm/gia đình phải lớn hơn 1!");
//         }
//         const maxRoomsPerFloor = this.rooms[0] ? this.rooms[0].length : 0;
//         if (quantity > maxRoomsPerFloor) {
//             throw new Error(`Khách sạn chỉ có tối đa ${maxRoomsPerFloor} phòng mỗi tầng. Không thể tìm cụm ${quantity} phòng liền kề!`);
//         }
//         // Tạo một mảng để lưu lại TẤT CẢ các cụm phòng hợp lệ tìm thấy trong toàn khách sạn
//         let allValidClusters = [];
//         // Duyệt qua từng tầng (Mảng 2D)
//         for (let i = 0; i < this.rooms.length; i++) {
//             let floorArray = this.rooms[i];
//             // Duyệt qua từng vị trí có thể tạo thành một cụm 'quantity' phòng liên tiếp
//             for (let j = 0; j <= floorArray.length - quantity; j++) {
//                 let consecutiveRooms = [];
//                 let isAllAvailable = true;
//                 // Kiểm tra xem chuỗi phòng tính từ j có trống hết không
//                 for (let k = 0; k < quantity; k++) {
//                     let room = floorArray[j + k];
//                     if (room.isBooked) {
//                         isAllAvailable = false;
//                         break;
//                     }
//                     consecutiveRooms.push(room);
//                 }
//                 // Nếu cụm này hoàn toàn trống, lưu mảng ID phòng vào danh sách tổng
//                 if (isAllAvailable) {
//                     allValidClusters.push(consecutiveRooms.map(r => r.id));
//                 }
//             }
//         }
//         // 2. XỬ LÝ NGẪU NHIÊN (Random):
//         if (allValidClusters.length > 0) {
//             // Tính toán một chỉ số index ngẫu nhiên trong số các cụm tìm được
//             const randomIndex = Math.floor(Math.random() * allValidClusters.length);
//             // Trả về cụm phòng ngẫu nhiên đó
//             return allValidClusters[randomIndex];
//         }
//         return null; // Không tìm thấy cụm nào thỏa mãn
//     }
//     // 2. Dùng map() để trích xuất danh sách tên khách hàng gửi Email tri ân
//     getCustomerThankYouList() {
//         return this.customers.map(cust => cust.name);
//     }
// }
// function drawRevenueChart() {
//     const canvas = document.getElementById("revenueChart");
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
    
//     ctx.clearRect(0, 0, canvas.width, canvas.height); // Xóa đồ thị cũ
    
//     const stats = hotelSystem.getAdminStatistics(); 
//     const data = [
//         { label: "Standard", value: stats.revenueByType.Standard, color: "#3498db" },
//         { label: "Deluxe", value: stats.revenueByType.Deluxe, color: "#e67e22" },
//         { label: "Suite", value: stats.revenueByType.Suite, color: "#9b59b6" }
//     ];

//     const maxVal = Math.max(...data.map(d => d.value), 1000000); 
    
//     // --- ĐỊNH VỊ TOẠ ĐỘ RỘNG RÃI CHO KHÔNG GIAN MỚI ---
//     const startX = 100;          // Tăng lề trái để hiển thị các số tiền lớn không bị lệch
//     const chartHeight = 140;     // Chiều cao cột cân đối
//     const bottomY = 190;         // Đáy cột cao ráo, cách mép dưới khung 60px hoàn hảo
//     const barWidth = 50;         // Tăng độ rộng cột nhìn cho bề thế
//     const colSpacing = 160;      // Tăng khoảng cách giữa các cột để giãn đều theo chiều ngang 600px

//     // Vẽ Trục hoành và Trục tung (Nét liền thanh lịch)
//     ctx.strokeStyle = "#cbd5e1";
//     ctx.lineWidth = 1;
//     ctx.beginPath();
//     ctx.moveTo(startX - 15, 30);            
//     ctx.lineTo(startX - 15, bottomY);       
//     ctx.lineTo(startX + 400, bottomY);      
//     ctx.stroke();

//     data.forEach((item, index) => {
//         const x = startX + index * colSpacing;
//         const barHeight = (item.value / maxVal) * chartHeight; 
//         const y = bottomY - barHeight;

//         // 1. Vẽ cột hình chữ nhật đổ bóng nhẹ
//         ctx.fillStyle = item.color;
//         ctx.fillRect(x, y, barWidth, barHeight);

//         // 2. In tên loại phòng dưới chân cột rõ ràng
//         ctx.fillStyle = "#1e293b";
//         ctx.font = "bold 13px Arial";
//         ctx.textAlign = "center";
//         ctx.fillText(item.label, x + (barWidth / 2), bottomY + 25);

//         // 3. In số tiền hiển thị trên đầu cột thoải mái
//         ctx.fillStyle = "#475569";
//         ctx.font = "11px Arial";
//         ctx.fillText(item.value.toLocaleString('vi-VN') + ' đ', x + (barWidth / 2), y - 10);
//     });
// }
// const hotelSystem = new bookingSystem();
// hotelSystem.initFloorMatrix();
// function switchView(viewName) {
//     // 1. Lấy các thẻ giao diện bằng ID
//     const viewClient = document.getElementById("view-client");
//     const viewAdmin = document.getElementById("view-admin");
//     const navClient = document.getElementById("nav-client");
//     const navAdmin = document.getElementById("nav-admin");
//     // 2. Xóa trạng thái hiển thị (active) của cả 2 bên để đưa về trạng thái trống
//     viewClient.classList.remove("active");
//     viewAdmin.classList.remove("active");
//     navClient.classList.remove("active");
//     navAdmin.classList.remove("active");
//     // 3. Kích hoạt đúng màn hình được chọn
//     if (viewName === "client") {
//         viewClient.classList.add("active");
//         navClient.classList.add("active");
//         // Vẽ sơ đồ phòng cho khách xem
//         renderHotelMap(); 
//     } else if (viewName === "admin") {
//         viewAdmin.classList.add("active");
//         navAdmin.classList.add("active");
//         // Hiển thị lịch sử hóa đơn
//         renderBookingHistory();
//         // IN THỐNG KÊ RA CONSOLE ĐỂ KIỂM TRA (ADM-01)
//         const stats = hotelSystem.getAdminStatistics();
//         const emailList = hotelSystem.getCustomerThankYouList();
//         console.log("=== THỐNG KÊ DOANH THU ĐÃ DÙNG REDUCE & FILTER ===");
//         console.log(`- Tổng doanh thu hệ thống: ${stats.totalRevenue.toLocaleString('vi-VN')}đ`);
//         console.log(`- Số lượng hóa đơn VIP (>2 triệu): ${stats.vipCount} hóa đơn`);
//         console.log("=== DANH SÁCH KHÁCH HÀNG EMAIL TRI ÂN ĐÃ DÙNG MAP ===");
//         console.log(emailList);
//         // Tự động vẽ biểu đồ Canvas (Bọc trong try-catch để phòng ngừa lỗi trống dữ liệu)
//         try {
//             drawRevenueChart();
//         } catch (e) {
//             console.log("Chưa có dữ liệu để vẽ biểu đồ doanh thu.");
//         }
//     }
// }
// function renderHotelMap(allowedIds = null, highlightIds = null) {
//     const mapContainer = document.getElementById("hotel-map-container");
//     mapContainer.innerHTML = "";
//     const hotelMatrix = hotelSystem.getMatrixData();

//     for (let i = 0; i < hotelMatrix.length; i++) {
//         let floorArray = hotelMatrix[i];
//         for (let j = 0; j < floorArray.length; j++) {
//             let roomInfo = floorArray[j];

//             if (allowedIds === null || allowedIds.includes(roomInfo.id)) {
//                 let isOccupied = (roomInfo.status === "Đã đặt");
//                 let bgClass = isOccupied ? "bg-red" : "bg-green";

//                 // AC: Highlight phòng cạnh nhau nếu nằm trong danh sách gợi ý
//                 if (highlightIds && highlightIds.includes(roomInfo.id)) {
//                     bgClass = "bg-highlight";
//                 }

//                 let finalClass = `room-card ${bgClass} ${isOccupied ? 'occupied' : ''}`;

//                 // Tạo thẻ div cho từng phòng
//                 const card = document.createElement("div");
//                 card.className = finalClass;
//                 card.innerHTML = `
//                     <h3>Phòng ${roomInfo.id}</h3>
//                     <p>Loại: <strong>${roomInfo.type}</strong></p>
//                     <p>Tầng: ${roomInfo.floor}</p>
//                     <p>Giá: ${roomInfo.price.toLocaleString('vi-VN')}đ</p>
//                     <span class="room-status">${roomInfo.status}</span>
//                 `;

//                 // Gán sự kiện khi click vào phòng trống sẽ mở modal đặt phòng
//                 card.onclick = () => openBookingModal(roomInfo.id, roomInfo.status);

//                 // Đẩy phòng vào vùng chứa trên giao diện
//                 mapContainer.appendChild(card);
//             }
//         }
//     }
// }
// function handleSearch() {
//     const filterID = document.getElementById("search-id").value.trim();
//     const filterType = document.getElementById("search-type").value;
//     const filterFloor = document.getElementById("search-floor").value;
//     // Gọi hàm tìm kiếm từ hệ thống đã viết sẵn của bạn
//     const filteredRooms = hotelSystem.searchRooms(filterID, filterType, filterFloor);
//     const allowedIds = filteredRooms.map(room => room.id);
//     // Vẽ lại bản đồ chỉ hiển thị các phòng khớp kết quả lọc
//     renderHotelMap(allowedIds);
// }
// function handleSuggestGroup() {
//     const qtyInput = document.getElementById("group-quantity").value;
//     const quantity = parseInt(qtyInput);
//     // Kiểm tra ô nhập liệu có bị trống hoặc gõ chữ hay không
//     if (isNaN(quantity)) {
//         alert("Vui lòng nhập số lượng phòng cần tìm!");
//         return;
//     }
//     try {
//         // Gọi hàm hệ thống
//         const suggestIds = hotelSystem.suggestAdjacentRooms(quantity);

//         if (suggestIds) {
//             // Hiển thị highlight cụm phòng ngẫu nhiên lên sơ đồ
//             renderHotelMap(null, suggestIds);
//             alert(`Hệ thống ngẫu nhiên gợi ý cụm ${quantity} phòng trống cạnh nhau: ${suggestIds.join(", ")}`);
//         } else {
//             alert("Rất tiếc, hiện tại không còn cụm phòng trống liền kề nào đủ số lượng ở cùng một tầng!");
//             renderHotelMap(); // Reset map về bình thường
//         }
//     } catch (error) {
//         // Bắt các lỗi validate: số lượng <= 1 hoặc số lượng vượt quá số phòng/tầng
//         alert("⚠️ " + error.message);
//     }
// }
// function openBookingModal(roomId, status) {
//     if (status === "Đã đặt") {
//         alert(`Phòng ${roomId} đã có người ở rồi bạn ơi!`);
//         return; // Dừng hàm, không cho mở form
//     }
//     // Nếu phòng trống: Lưu số phòng vào ô ẩn (Hidden Input) để lát nữa biết đặt cho phòng nào
//     document.getElementById("modal-room-id").value = roomId;
//     // Hiển thị hộp thoại lên màn hình
//     document.getElementById("booking-modal").style.display = "flex";
// }
// // Hàm đóng hộp thoại
// function closeModal() {
//     document.getElementById("booking-modal").style.display = "none";
//     document.getElementById("form-customer-booking").reset(); // Xóa sạch chữ ở các ô input thường
//     // ĐÓNG GÓP SENIOR: Chủ động xóa dữ liệu trong ô Input ẩn (Hidden)
//     document.getElementById("modal-room-id").value = "";
//     // Xóa tin nhắn lỗi cũ của form (nếu có) để lần sau mở lên form sạch sẽ
//     const errorDiv = document.getElementById("form-error-msg");
//     if (errorDiv) errorDiv.innerText = "";
// }
// Hàm xử lý khi người dùng ấn nút "Xác Nhận Đặt Phòng"
// function executeBooking(event) {
//     event.preventDefault();

//     const roomId = document.getElementById("modal-room-id").value;
//     const custId = document.getElementById("cust-id").value.trim();
//     const custName = document.getElementById("cust-name").value.trim();
//     const custPhone = document.getElementById("cust-phone").value.trim();

//     let errorDiv = document.getElementById("form-error-msg");
//     if (!errorDiv) {
//         errorDiv = document.createElement("div");
//         errorDiv.id = "form-error-msg";
//         errorDiv.style.color = "red";
//         errorDiv.style.marginTop = "10px";
//         errorDiv.style.fontWeight = "bold";
//         document.getElementById("form-customer-booking").appendChild(errorDiv);
//     }
//     errorDiv.innerText = "";

//     if (custId === "" || custName === "" || custPhone === "") {
//         errorDiv.innerText = "⚠️ Lỗi: Vui lòng nhập đầy đủ thông tin khách hàng!";
//         return;
//     }

//     try {
//         // CƠ CHẾ KIỂM TRA & TỰ ĐỘNG DỰNG CÂY ĐỆ QUY CHO NGƯỜI DÙNG TEST
//         let existingCustomer = hotelSystem.customers.find(c => c.id === custId);
        
//         if (!existingCustomer) {
//             // Nếu người dùng gõ KH_C mà hệ thống chưa có dữ liệu mẫu, ta chủ động tạo luôn cả chuỗi giới thiệu mồi!
//             if (custId === "KH_C") {
//                 // Tạo một cây gia phả giới thiệu hoàn chỉnh để test đệ quy
//                 const khA = new Customer("KH_A", "Ông Cổ A", "0911111111", null);
//                 const khB = new Customer("KH_B", "Ông Giữa B", "0922222222", "KH_A");
//                 const khC = new Customer("KH_C", custName, custPhone, "KH_B"); // KH_C nối vào KH_B
                
//                 // Đẩy cả 3 người vào hệ thống
//                 hotelSystem.customers.push(khA, khB, khC);
//                 existingCustomer = khC;
//             } else {
//                 // Khách hàng mới bình thường khác
//                 const newCustomer = new Customer(custId, custName, custPhone);
//                 hotelSystem.customers.push(newCustomer);
//                 existingCustomer = newCustomer;
//             }
//         }

//         // Tiến hành đặt phòng với ID của khách hàng
//         const result = hotelSystem.bookingRoom(roomId, existingCustomer.id);

//         if (result.success === true) {
//             // Tính toán lại điểm đệ quy thực tế trong mảng customers vừa cập nhật
//             let points = calculateReferralPoints(existingCustomer.id, hotelSystem.customers);
//             let msg = result.message;
//             if (points >= 20) {
//                 msg += `\n🎉 Chúc mừng! Bạn được giảm giá 5% nhờ có ${points} điểm thưởng referral đa cấp!`;
//             }

//             alert(msg);
            
//             // Đồng bộ lại dữ liệu ra máy và vẽ lại giao diện
//             hotelSystem.saveData(); 
//             drawRevenueChart(); 
//             closeModal();
//             renderHotelMap();
            
//             if (document.getElementById("view-admin").classList.contains("active")) {
//                 renderBookingHistory();
//             }
//         } else {
//             errorDiv.innerText = "⚠️ " + result.message;
//         }
//     } catch (error) {
//         errorDiv.innerText = "⚠️ " + error.message;
//     }
// }
// let currentSortOrder = 'none';

// function renderBookingHistory(sortedBookings = null) {
//     const tbody = document.getElementById("booking-history-tbody");
//     tbody.innerHTML = "";

//     // Nếu không có mảng đã sắp xếp truyền vào, lấy mảng mặc định từ hệ thống
//     // Dùng toán tử Spread [...] để tạo bản sao, tránh làm đảo lộn mảng gốc9 của hệ thống
//     let historyList = sortedBookings ? sortedBookings : [...hotelSystem.bookings];

//     for (let i = 0; i < historyList.length; i++) {
//         let invoice = historyList[i];
//         tbody.innerHTML += `
//             <tr>
//                 <td><strong>${invoice.bookingID}</strong></td>
//                 <td>Phòng ${invoice.roomID} (${invoice.roomDetails.price.toLocaleString('vi-VN')}đ)</td>
//                 <td>${invoice.customerID}</td>
//                 <td>${invoice.date}</td>
//             </tr>
//         `;
//     }
// }
// Hàm kích hoạt khi Admin bấm vào tiêu đề cột "Mã Phòng"
// function toggleSortByPrice() {
//     let bookingsCopy = [...hotelSystem.bookings]; // Tạo bản sao để sắp xếp

//     if (currentSortOrder === 'none' || currentSortOrder === 'desc') {
//         // CHUẨN SENIOR: Bắt buộc truyền callback (a, b) => a - b để tránh bẫy sort chuỗi mặc định của JS
//         bookingsCopy.sort((a, b) => a.roomDetails.price - b.roomDetails.price);
//         currentSortOrder = 'asc';
//     } else {
//         bookingsCopy.sort((a, b) => b.roomDetails.price - a.roomDetails.price);
//         currentSortOrder = 'desc';
//     }

//     // Gọi lại hàm vẽ bảng với mảng đã được sắp xếp mới
//     renderBookingHistory(bookingsCopy);
// }
// Sự kiện tự động kích hoạt ngay khi trang web tải xong xuôi
// window.onload = function () {
//     renderHotelMap();
// };
// function calculateReferralPoints(customerID, allCustomers) {
//     // Tìm đối tượng khách hàng hiện tại trong danh sách tổng
//     const currentCust = allCustomers.find(c => c.id === customerID);
//     // BASE CASE (Điều kiện dừng): Nếu không tồn tại khách này, hoặc không có ai giới thiệu (null / rỗng)
//     if (!currentCust || currentCust.referredBy === null || currentCust.referredBy === "") {
//         return 0; // Trả về 0 để dừng đệ quy, tránh lỗi Stack Overflow (Tràn bộ nhớ đệm)
//     }
//     // RECURSIVE STEP (Bước đệ quy): Cấp này ăn 10 điểm + gọi lại chính nó để tính điểm người giới thiệu cấp trên
//     return 10 + calculateReferralPoints(currentCust.referredBy, allCustomers);
// }
// if (!localStorage.getItem("hotel_rooms")) {
//     hotelSystem.customers.push(new Customer("KH001", "Nguyễn Văn A", "0911111111", null));   
//     hotelSystem.customers.push(new Customer("KH002", "Nguyễn Văn B", "0922222222", "KH_A")); 
//     hotelSystem.customers.push(new Customer("KH003", "Nguyễn Văn C", "0933333333", "KH_B"));    
//     // Lưu danh sách khách hàng mẫu này vào máy trước
//     hotelSystem.saveData();
// }