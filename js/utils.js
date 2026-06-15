export function calculateReferralPoints(customerID, allCustomers) {
    // Tìm đối tượng khách hàng hiện tại trong danh sách tổng
    const currentCust = allCustomers.find(c => c.id === customerID);
    if (!currentCust || !currentCust.referredBy) { 
        return 0;
    }
    // RECURSIVE STEP: Cộng 10 điểm và tìm tiếp cấp trên
    return 10 + calculateReferralPoints(currentCust.referredBy, allCustomers);
}