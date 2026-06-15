import { Room, Customer } from './models.js';
import { calculateReferralPoints } from './utils.js';

export class bookingSystem {
    constructor() {
        this.rooms = [];
        this.bookings = [];
        this.customers = [];
    }
    addRoom(newRoom) {
        this.rooms.push(newRoom);
    }
    initFloorMatrix() {
        // [ADM-04] LẤY DATA TỪ LOCALSTORAGE KHI F5 TRANG
        const localRooms = localStorage.getItem("hotel_rooms");
        const localBookings = localStorage.getItem("hotel_bookings");
        const localCustomers = localStorage.getItem("hotel_customers");

        if (localRooms && localBookings) {
            const rawMatrix = JSON.parse(localRooms);
            this.bookings = JSON.parse(localBookings);
            this.customers = localCustomers ? JSON.parse(localCustomers) : [];

            // THỬ THÁCH PHỤC HỒI (Re-instantiation): Ép data raw chạy qua "new Room()" để lấy lại hàm #isBooked, book()...
            this.rooms = rawMatrix.map(floorArray =>
                floorArray.map(r => new Room(r.id, r.type, r.floor, r.price, r.status === "Đã đặt"))
            );
            return; // Thoát hàm, không khởi tạo lại từ đầu nữa
        }

        // --- Khởi tạo mặc định nếu chưa có dữ liệu trong máy (giữ nguyên code cũ của bạn bên dưới) ---
        const roomTypeMap = { 1: { type: "Standard", price: 1000000 }, 2: { type: "Deluxe", price: 2000000 }, 3: { type: "Suite", price: 4000000 } };
        const hotelmatrix = [[1, 1, 2, 2, 3],
        [1, 2, 2, 3, 3],
        [2, 2, 3, 3, 3]
        ];
        for (let i = 0; i < hotelmatrix.length; i++) {
            let floorArray = [];
            for (let j = 0; j < hotelmatrix[i].length; j++) {
                let roomTypeCode = hotelmatrix[i][j];
                let roomID = (i + 1) + "0" + (j + 1);
                floorArray.push(new Room(roomID, roomTypeMap[roomTypeCode].type, i + 1, roomTypeMap[roomTypeCode].price));
            }
            this.rooms.push(floorArray);
        }
        this.saveData();
    }
    saveData() {
        const rawRoomsMatrix = this.rooms.map(floorArray => floorArray.map(r => r.Information));
        localStorage.setItem("hotel_rooms", JSON.stringify(rawRoomsMatrix));
        localStorage.setItem("hotel_bookings", JSON.stringify(this.bookings));
        localStorage.setItem("hotel_customers", JSON.stringify(this.customers));
    }

    // [ADM-05 & SYS-05] Hàm gom nhóm doanh thu bằng reduce() tách biệt hoàn toàn với logic vẽ giao diện
    getAdminStatistics() {
        // 1. Lọc các hóa đơn có giá trị phòng > 2.000.000đ
        const vipBookings = this.bookings.filter(b => b.roomDetails.price > 2000000);
        // 2. Tính tổng doanh thu toàn bộ hóa đơn trong hệ thống
        const totalRevenue = this.bookings.reduce((sum, b) => sum + b.roomDetails.price, 0);
        // 3. Dùng reduce để tính tổng tiền theo từng loại phòng phục vụ vẽ biểu đồ Canvas
        const revenueByType = this.bookings.reduce((acc, b) => {
            const type = b.roomDetails.type;
            if (acc[type] !== undefined) acc[type] += b.roomDetails.price;
            return acc;
        }, { Standard: 0, Deluxe: 0, Suite: 0 });
        return {
            totalRevenue,
            vipCount: vipBookings.length,
            vipList: vipBookings, // Trả về danh sách chi tiết phòng VIP
            revenueByType         // Trả về dữ liệu nhóm doanh thu cho hàm vẽ biểu đồ
        };
    }
    cancelBookingSystemWide(bookingID, roomID) {
        // 1. Duyệt qua ma trận phòng 2D để tìm đúng phòng có ID cần hủy
        let roomFound = null;
        for (let floor = 0; floor < this.rooms.length; floor++) {
            const room = this.rooms[floor].find(r => r.id === roomID);
            if (room) {
                roomFound = room;
                break;
            }
        }
        // 2. Kích hoạt hàm cancel() của Class Room mà bạn đã viết sẵn
        if (roomFound && typeof roomFound.cancel === 'function') {
            roomFound.cancel();
        } else if (roomFound) {
            // Dự phòng nếu hàm cancel trong class Room của bạn viết hoa hoặc đổi tên
            roomFound.isBooked = false;
            roomFound.customer = null;
        }
        // 3. Xóa hóa đơn này ra khỏi danh sách bookings (Lịch sử đặt phòng)
        this.bookings = this.bookings.filter(b => b.bookingID !== bookingID);
        return { success: true };
    }
    searchRooms(filterID, filterType, filterFloor) {
        let foundRooms = [];
        for (let i = 0; i < this.rooms.length; i++) {
            let currentFloorArray = this.rooms[i];
            for (let j = 0; j < currentFloorArray.length; j++) {
                let currentRoom = currentFloorArray[j];
                let matchID = (filterID === null || filterID === "") || (currentRoom.id === filterID);
                let matchType = (filterType === null || filterType === "") || (currentRoom.type === filterType);
                let matchFloor = (filterFloor === null || filterFloor === "") || (currentRoom.floor === Number(filterFloor));
                let isAvailable = (currentRoom.isBooked === false);
                if (matchID && matchType && matchFloor) {
                    foundRooms.push(currentRoom.Information);
                }
            }
        }
        return foundRooms;
    }
    bookingRoom(roomID, customerID) {
        let targetRoom = null;
        for (let i = 0; i < this.rooms.length; i++) {
            let currentFloorArray = this.rooms[i];
            for (let j = 0; j < currentFloorArray.length; j++) {
                if (currentFloorArray[j].id === roomID) {
                    targetRoom = currentFloorArray[j];
                    break;
                }
            }
            if (targetRoom) break;
        }
        if (targetRoom === null) {
            return {
                success: false,
                message: "Phòng bạn muốn đặt đã hết!"
            };
        }
        let bookingResult = targetRoom.book();
        if (bookingResult.status === true) {
            // LẤY GIÁ PHÒNG GỐC
            let finalPrice = targetRoom.Information.price;
            // ÁP DỤNG ĐỆ QUY TÍNH ĐIỂM: Nếu điểm >= 20 thì giảm giá 5% hóa đơn
            let points = calculateReferralPoints(customerID, this.customers);
            if (points >= 20) {
                finalPrice = finalPrice * 0.95; // Giảm 5% giá phòng
            }
            let newBooking = {
                bookingID: "BK" + Math.floor(Math.random() * 10000),
                roomID: targetRoom.id,
                customerID: customerID,
                date: new Date().toLocaleDateString('vi-VN'),
                roomDetails: {
                    ...targetRoom.Information,
                    price: finalPrice // Lưu giá tiền thực tế sau khi giảm vào hóa đơn
                }
            };
            this.bookings.push(newBooking);
            this.saveData(); // <--- Thêm dòng này để tự động lưu lại vào localStorage
            return {
                success: true,
                message: `${bookingResult.message}. Đã tạo hoá đơn ${newBooking.bookingID}`
            };
        }
    }
    getMatrixData() {
        let matrixData = [];
        for (let i = 0; i < this.rooms.length; i++) {
            let floorArray = this.rooms[i];
            let floorData = [];
            for (let j = 0; j < floorArray.length; j++) {
                floorData.push(floorArray[j].Information);
            }
            matrixData.push(floorData);
        }
        return matrixData;
    }
    suggestAdjacentRooms(quantity, filterID = "", filterType = "", filterFloor = "") {
        if (quantity <= 1) {
            throw new Error("Số lượng phòng cần tìm phải lớn hơn 1!");
        }
        let allValidClusters = [];
        for (let i = 0; i < this.rooms.length; i++) {
            let floorArray = this.rooms[i];
            for (let j = 0; j <= floorArray.length - quantity; j++) {
                let consecutiveRooms = [];
                let isAllAvailable = true;
                for (let k = 0; k < quantity; k++) {
                    let room = floorArray[j + k];
                    // Điều kiện giống searchRooms()
                    let matchID =
                        (filterID === "" || filterID === null) ||
                        (room.id === filterID);
                    let matchType =
                        (filterType === "" || filterType === null) ||
                        (room.type === filterType);
                    let matchFloor =
                        (filterFloor === "" || filterFloor === null) ||
                        (room.floor === Number(filterFloor));
                    if (
                        room.isBooked ||
                        !matchID ||
                        !matchType ||
                        !matchFloor
                    ) {
                        isAllAvailable = false;
                        break;
                    }
                    consecutiveRooms.push(room);
                }
                if (isAllAvailable) {
                    allValidClusters.push(
                        consecutiveRooms.map(room => room.id)
                    );
                }
            }
        }
        if (allValidClusters.length > 0) {
            const randomIndex =
                Math.floor(Math.random() * allValidClusters.length);

            return allValidClusters[randomIndex];
        }
        return null;
    }
    // 2. Dùng map() để trích xuất danh sách tên khách hàng gửi Email tri ân
    getCustomerThankYouList() {
        return this.customers.map(cust => cust.name);
    }
}