export class Room {
    #isBooked = false;
    #basePrice = 0;
    constructor(id, type, floor, basePrice, isBooked = false) {
    this.id = id;
    this.type = type;
    this.floor = floor;
    if (basePrice < 0) {
        throw new Error(`Lỗi: Giá phòng ${this.id} Không được để giá âm`);
    } else {
        this.#basePrice = basePrice;
    }
    // Cập nhật trạng thái phòng được truyền vào từ localStorage
    this.#isBooked = isBooked; 
}
    set basePrice(newPrice) {
        if (newPrice < 0) {
            throw new Error(`Lỗi: Giá phòng ${this.id} Không được để giá âm`)
        } else {
            this.#basePrice = newPrice;
        }
    }
    get basePrice() {
        return this.#basePrice;
    }
    get isBooked() {
        return this.#isBooked;
    }
    book() {
        if (this.#isBooked) {
            return {
                status: false,
                message: `Phòng ${this.id} đã có khách đặt`
            };
        }
        this.#isBooked = true;
        return {
            status: true,
            message: `Đã đặt phòng ${this.id} thành công`
        };
    }
    cancel() {
        this.#isBooked = false;
    }
    get Information() {
        return {
            id: this.id,
            type: this.type,
            floor: this.floor,
            price: this.#basePrice,
            status: this.#isBooked ? "Đã đặt" : "Còn trống"
        };
    }
}
export class Customer {
    constructor(id, name, phone, referredBy = null) {
        this.id = id;
        this.name = name;
        const regex = /^(\+84|0)(3|5|7|8|9)\d{8}$/;
        if (!regex.test(phone)) {
            throw new Error(`Lỗi: Số điện thoại khách ${this.name} không hợp lệ`);
        } else {
            this.phone = phone;
        }
        this.referredBy = referredBy;
    }
}