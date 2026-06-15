import { bookingSystem } from './bookingSystem.js';
import { Customer } from './models.js';
import { calculateReferralPoints } from './utils.js';

const hotelSystem = new bookingSystem();
hotelSystem.initFloorMatrix();

//Khởi tạo dữ liệu mẫu
const savedCustomers =
    JSON.parse(localStorage.getItem("hotel_customers") || "[]");

if (savedCustomers.length === 0) {
    hotelSystem.customers.push(new Customer("KH001", "Nguyễn Văn A", "0911111111", null));
    hotelSystem.customers.push(new Customer("KH002", "Nguyễn Văn B", "0922222222", "KH001"));
    hotelSystem.customers.push(new Customer("KH003", "Nguyễn Văn C", "0933333333", "KH002"));
    console.table(hotelSystem.customers);
    // Lưu danh sách khách hàng mẫu này vào máy trước
    hotelSystem.saveData();
}

let currentSortOrder = 'none';

function drawRevenueChart() {
    const canvas = document.getElementById("revenueChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Xóa đồ thị cũ

    const stats = hotelSystem.getAdminStatistics();
    const data = [
        { label: "Standard", value: stats.revenueByType.Standard, color: "#3498db" },
        { label: "Deluxe", value: stats.revenueByType.Deluxe, color: "#e67e22" },
        { label: "Suite", value: stats.revenueByType.Suite, color: "#9b59b6" }
    ];

    const maxVal = Math.max(...data.map(d => d.value), 1000000);

    // --- ĐỊNH VỊ TOẠ ĐỘ RỘNG RÃI CHO KHÔNG GIAN MỚI ---
    const startX = 100;          // Tăng lề trái để hiển thị các số tiền lớn không bị lệch
    const chartHeight = 140;     // Chiều cao cột cân đối
    const bottomY = 190;         // Đáy cột cao ráo, cách mép dưới khung 60px hoàn hảo
    const barWidth = 50;         // Tăng độ rộng cột nhìn cho bề thế
    const colSpacing = 160;      // Tăng khoảng cách giữa các cột để giãn đều theo chiều ngang 600px

    // Vẽ Trục hoành và Trục tung (Nét liền)
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX - 15, 30);
    ctx.lineTo(startX - 15, bottomY);
    ctx.lineTo(startX + 400, bottomY);
    ctx.stroke();

    data.forEach((item, index) => {
        const x = startX + index * colSpacing;
        const barHeight = (item.value / maxVal) * chartHeight;
        const y = bottomY - barHeight;

        // 1. Vẽ cột hình chữ nhật đổ bóng nhẹ
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // 2. In tên loại phòng dưới chân cột rõ ràng
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.label, x + (barWidth / 2), bottomY + 25);

        // 3. In số tiền hiển thị trên đầu cột thoải mái
        ctx.fillStyle = "#475569";
        ctx.font = "11px Arial";
        ctx.fillText(item.value.toLocaleString('vi-VN') + ' đ', x + (barWidth / 2), y - 10);
    });
}

function renderHotelMap(allowedIds = null, highlightIds = null) {
    const mapContainer = document.getElementById("hotel-map-container");
    mapContainer.innerHTML = "";
    const hotelMatrix = hotelSystem.getMatrixData();

    for (let i = 0; i < hotelMatrix.length; i++) {
        let floorArray = hotelMatrix[i];
        for (let j = 0; j < floorArray.length; j++) {
            let roomInfo = floorArray[j];

            if (allowedIds === null || allowedIds.includes(roomInfo.id)) {
                let isOccupied = (roomInfo.status === "Đã đặt");
                let bgClass = isOccupied ? "bg-red" : "bg-green";

                // AC: Highlight phòng cạnh nhau nếu nằm trong danh sách gợi ý
                if (highlightIds && highlightIds.includes(roomInfo.id)) {
                    bgClass = "bg-highlight";
                }

                let finalClass = `room-card ${bgClass} ${isOccupied ? 'occupied' : ''}`;

                // Tạo thẻ div cho từng phòng
                const card = document.createElement("div");
                card.className = finalClass;
                card.innerHTML = `
                    <h3>Phòng ${roomInfo.id}</h3>
                    <p>Loại: <strong>${roomInfo.type}</strong></p>
                    <p>Tầng: ${roomInfo.floor}</p>
                    <p>Giá: ${roomInfo.price.toLocaleString('vi-VN')}đ</p>
                    <span class="room-status">${roomInfo.status}</span>
                `;

                // Gán sự kiện khi click vào phòng trống sẽ mở modal đặt phòng
                card.onclick = () => openBookingModal(roomInfo.id, roomInfo.status);

                // Đẩy phòng vào vùng chứa trên giao diện
                mapContainer.appendChild(card);
            }
        }
    }
}

function renderBookingHistory(sortedBookings = null) {
    const tbody = document.getElementById("booking-history-tbody");
    tbody.innerHTML = "";

    let historyList = sortedBookings ? sortedBookings : [...hotelSystem.bookings];

    for (let i = 0; i < historyList.length; i++) {
        let invoice = historyList[i];
        tbody.innerHTML += `
            <tr>
                <td><strong>${invoice.bookingID}</strong></td>
                <td>Phòng ${invoice.roomID} (${invoice.roomDetails.price.toLocaleString('vi-VN')}đ)</td>
                <td>${invoice.customerID}</td>
                <td>${invoice.date}</td>
                <td>
                    <button onclick="executeCancel('${invoice.bookingID}', '${invoice.roomID}')" 
                            style="padding: 4px 8px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
                        Hủy đặt
                    </button>
                </td>
            </tr>
        `;
    }
}

function toggleSortByPrice() {
    let bookingsCopy = [...hotelSystem.bookings]; // Tạo bản sao để sắp xếp
    if (currentSortOrder === 'none' || currentSortOrder === 'desc') {
        // CHUẨN SENIOR: Bắt buộc truyền callback (a, b) => a - b để tránh bẫy sort chuỗi mặc định của JS
        bookingsCopy.sort((a, b) => a.roomDetails.price - b.roomDetails.price);
        currentSortOrder = 'asc';
    } else {
        bookingsCopy.sort((a, b) => b.roomDetails.price - a.roomDetails.price);
        currentSortOrder = 'desc';
    }
    // Gọi lại hàm vẽ bảng với mảng đã được sắp xếp mới
    renderBookingHistory(bookingsCopy);
}

function executeBooking(event) {
    event.preventDefault();

    const roomId = document.getElementById("modal-room-id").value;
    const custId = document.getElementById("cust-id").value.trim();
    const custName = document.getElementById("cust-name").value.trim();
    const custPhone = document.getElementById("cust-phone").value.trim();

    let errorDiv = document.getElementById("form-error-msg");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.id = "form-error-msg";
        errorDiv.style.color = "red";
        errorDiv.style.marginTop = "10px";
        errorDiv.style.fontWeight = "bold";
        document.getElementById("form-customer-booking").appendChild(errorDiv);
    }
    errorDiv.innerText = "";

    if (custId === "" || custName === "" || custPhone === "") {
        errorDiv.innerText = "⚠️ Lỗi: Vui lòng nhập đầy đủ thông tin khách hàng!";
        return;
    }

    try {
        // CƠ CHẾ KIỂM TRA & TỰ ĐỘNG DỰNG CÂY ĐỆ QUY CHO NGƯỜI DÙNG TEST
        let existingCustomer = hotelSystem.customers.find(c => c.id === custId);

        if (!existingCustomer) {
            // Nếu người dùng gõ KH_C mà hệ thống chưa có dữ liệu mẫu, ta chủ động tạo luôn cả chuỗi giới thiệu mồi!
            if (custId === "KH_C") {
                // Tạo một cây gia phả giới thiệu hoàn chỉnh để test đệ quy
                const khA = new Customer("KH_A", "Ông Cổ A", "0911111111", null);
                const khB = new Customer("KH_B", "Ông Giữa B", "0922222222", "KH_A");
                const khC = new Customer("KH_C", custName, custPhone, "KH_B"); // KH_C nối vào KH_B

                // Đẩy cả 3 người vào hệ thống
                hotelSystem.customers.push(khA, khB, khC);
                existingCustomer = khC;
            } else {
                // Khách hàng mới bình thường khác
                const newCustomer = new Customer(custId, custName, custPhone);
                hotelSystem.customers.push(newCustomer);
                existingCustomer = newCustomer;
            }
        }

        // Tiến hành đặt phòng với ID của khách hàng
        const result = hotelSystem.bookingRoom(roomId, existingCustomer.id);

        if (result.success === true) {
            // Tính toán lại điểm đệ quy thực tế trong mảng customers vừa cập nhật
            console.log(
                hotelSystem.customers.find(c => c.id === "KH003")
            );
            let points = calculateReferralPoints(existingCustomer.id, hotelSystem.customers);
            let msg = result.message;
            if (points >= 20) {
                msg += `\n🎉 Chúc mừng! Bạn được giảm giá 5% nhờ có ${points} điểm thưởng referral đa cấp!`;
            }

            alert(msg);

            // Đồng bộ lại dữ liệu ra máy và vẽ lại giao diện
            hotelSystem.saveData();
            drawRevenueChart();
            closeModal();
            renderHotelMap();

            if (document.getElementById("view-admin").classList.contains("active")) {
                renderBookingHistory();
                const freshStats = hotelSystem.getAdminStatistics();
                document.getElementById("txt-total-revenue").innerText = freshStats.totalRevenue.toLocaleString('vi-VN') + ' đ';
                document.getElementById("txt-vip-count").innerText = freshStats.vipCount + ' hóa đơn';
            }
        } else {
            errorDiv.innerText = "⚠️ " + result.message;
        }
    } catch (error) {
        errorDiv.innerText = "⚠️ " + error.message;
    }
}

function switchView(viewName) {
    // 1. Lấy các thẻ giao diện bằng ID
    const viewClient = document.getElementById("view-client");
    const viewAdmin = document.getElementById("view-admin");
    const navClient = document.getElementById("nav-client");
    const navAdmin = document.getElementById("nav-admin");
    // 2. Xóa trạng thái hiển thị (active) của cả 2 bên để đưa về trạng thái trống
    viewClient?.classList.remove("active");
    viewAdmin?.classList.remove("active");
    navClient?.classList.remove("active");
    navAdmin?.classList.remove("active");
    // 3. Kích hoạt đúng màn hình được chọn
    if (viewName === "client") {
        viewClient?.classList.add("active");
        navClient?.classList.add("active");
        // Vẽ sơ đồ phòng cho khách xem
        renderHotelMap();
    } else if (viewName === "admin") {
        viewAdmin?.classList.add("active");
        navAdmin?.classList.add("active");
        // Hiển thị lịch sử hóa đơn
        renderBookingHistory();
        // IN THỐNG KÊ RA CONSOLE ĐỂ KIỂM TRA (ADM-01)
        const stats = hotelSystem.getAdminStatistics();
        const emailList = hotelSystem.getCustomerThankYouList();
        document.getElementById("txt-total-revenue").innerText = stats.totalRevenue.toLocaleString('vi-VN') + ' đ';
        document.getElementById("txt-vip-count").innerText = stats.vipCount + ' hóa đơn';
        console.log("=== THỐNG KÊ DOANH THU ĐÃ DÙNG REDUCE & FILTER ===");
        console.log(`- Tổng doanh thu hệ thống: ${stats.totalRevenue.toLocaleString('vi-VN')}đ`);
        console.log(`- Số lượng hóa đơn VIP (>2 triệu): ${stats.vipCount} hóa đơn`);
        console.log("=== DANH SÁCH KHÁCH HÀNG EMAIL TRI ÂN ĐÃ DÙNG MAP ===");
        console.log(emailList);
        // Tự động vẽ biểu đồ Canvas (Bọc trong try-catch để phòng ngừa lỗi trống dữ liệu)
        try {
            drawRevenueChart();
        } catch (e) {
            console.log("Chưa có dữ liệu để vẽ biểu đồ doanh thu.");
        }
    }
}

function openBookingModal(roomId, status) {
    if (status === "Đã đặt") {
        alert(`Phòng ${roomId} đã có người ở rồi bạn ơi!`);
        return; // Dừng hàm, không cho mở form
    }
    // Nếu phòng trống: Lưu số phòng vào ô ẩn (Hidden Input) để lát nữa biết đặt cho phòng nào
    document.getElementById("modal-room-id").value = roomId;
    // Hiển thị hộp thoại lên màn hình
    document.getElementById("booking-modal").style.display = "flex";
}

// Hàm đóng hộp thoại
function closeModal() {
    document.getElementById("booking-modal").style.display = "none";
    document.getElementById("form-customer-booking").reset(); // Xóa sạch chữ ở các ô input thường
    // ĐÓNG GÓP SENIOR: Chủ động xóa dữ liệu trong ô Input ẩn (Hidden)
    document.getElementById("modal-room-id").value = "";
    // Xóa tin nhắn lỗi cũ của form (nếu có) để lần sau mở lên form sạch sẽ
    const errorDiv = document.getElementById("form-error-msg");
    if (errorDiv) errorDiv.innerText = "";
}

function handleSearch() {
    const filterID = document.getElementById("search-id").value.trim();
    const filterType = document.getElementById("search-type").value;
    const filterFloor = document.getElementById("search-floor").value;
    // Gọi hàm tìm kiếm từ hệ thống đã viết sẵn của bạn
    const filteredRooms = hotelSystem.searchRooms(filterID, filterType, filterFloor);
    const allowedIds = filteredRooms.map(room => room.id);
    // Vẽ lại bản đồ chỉ hiển thị các phòng khớp kết quả lọc
    renderHotelMap(allowedIds);
}
function handleSuggestGroup() {
    const qtyInput =
        document.getElementById("group-quantity").value;
    const quantity = parseInt(qtyInput);
    if (isNaN(quantity)) {
        alert("Vui lòng nhập số lượng phòng cần tìm!");
        return;
    }
    try {
        const filterID =
            document.getElementById("search-id").value.trim();
        const filterType =
            document.getElementById("search-type").value;
        const filterFloor =
            document.getElementById("search-floor").value;
        // Lấy danh sách phòng đang được lọc
        const filteredRooms =
            hotelSystem.searchRooms(
                filterID,
                filterType,
                filterFloor
            );
        const allowedIds =
            filteredRooms.map(room => room.id);
        // Tìm cụm phòng liền kề theo điều kiện lọc
        const suggestedRooms =
            hotelSystem.suggestAdjacentRooms(
                quantity,
                filterID,
                filterType,
                filterFloor
            );
        if (suggestedRooms) {
            renderHotelMap(
                allowedIds,
                suggestedRooms
            );
        } else {
            alert(
                "Rất tiếc, hiện tại không còn cụm phòng trống liền kề nào đủ số lượng theo điều kiện lọc!"
            );
            renderHotelMap(allowedIds);
        }
    } catch (error) {
        alert("⚠️ " + error.message);
    }
}

window.onload = function () {
    renderHotelMap();
    // Đồng bộ phạm vi truy cập để HTML onclick gọi được trực tiếp
    window.switchView = switchView;
    window.toggleSortByPrice = toggleSortByPrice;
    window.executeBooking = executeBooking;
    window.closeModal = closeModal;

    // Gắn 2 hàm bạn cần tìm ra global:
    window.handleSearch = handleSearch;
    window.handleSuggestGroup = handleSuggestGroup;
    window.executeCancel = executeCancel;
};

function executeCancel(bookingId, roomId) {
    const confirmCancel = confirm(`Bạn có chắc chắn muốn hủy đặt phòng ${roomId} (Hóa đơn: ${bookingId}) không?`);
    if (!confirmCancel) return;
    try {
        // Gọi hàm điều phối hệ thống vừa tạo ở Bước 1
        hotelSystem.cancelBookingSystemWide(bookingId, roomId);
        alert("🎉 Đã hủy phòng thành công! Trạng thái phòng và lịch sử đã được cập nhật.");
        // 1. Lưu lại trạng thái mới vào LocalStorage
        hotelSystem.saveData();
        // 2. Vẽ lại sơ đồ phòng bên Client (Phòng sẽ đổi từ Đỏ -> Xanh)
        renderHotelMap();
        // 3. Vẽ lại bảng lịch sử đơn hàng ở Admin (Mất đi dòng vừa hủy)
        renderBookingHistory();
        // 4. Tính toán lại số liệu doanh thu mới sau khi giảm và đẩy lên giao diện
        const freshStats = hotelSystem.getAdminStatistics();
        document.getElementById("txt-total-revenue").innerText = freshStats.totalRevenue.toLocaleString('vi-VN') + ' đ';
        document.getElementById("txt-vip-count").innerText = freshStats.vipCount + ' hóa đơn';
        // 5. Vẽ lại biểu đồ doanh thu thụt giảm tương ứng
        drawRevenueChart();
    } catch (error) {
        alert("⚠️ Có lỗi xảy ra khi hủy phòng: " + error.message);
    }
}