// js/rateLimiter.js
const RateLimiter = (() => {
    // Lưu vết thời gian thực hiện của từng hành động
    const actionTimestamps = {};

    /**
     * Kiểm tra xem người dùng có đang bấm quá nhanh hay không
     * @param {string} actionKey - Tên hành động (vd: 'search_anime', 'click_button')
     * @param {number} cooldownMs - Thời gian giãn cách giữa 2 lần bấm (tính bằng mili-giây, ví dụ 1000 = 1 giây)
     * @returns {boolean} - true nếu được phép tiếp tục, false nếu bị chặn do spam
     */
    function check(actionKey, cooldownMs = 1000) {
        const now = Date.now();
        const lastTime = actionTimestamps[actionKey] || 0;

        if (now - lastTime < cooldownMs) {
            console.warn(`[Rate Limit] Thao tác "${actionKey}" bị chặn vì bấm quá nhanh.`);
            
            // Nếu web của bạn có hàm hiển thị thông báo (toast), gọi nó ở đây
            if (typeof UI !== 'undefined' && typeof UI.showToast === 'function') {
                UI.showToast('Bạn đang thao tác quá nhanh, từ từ thôi!');
            }
            return false; // Bị chặn
        }

        // Cập nhật lại mốc thời gian lần gọi mới nhất
        actionTimestamps[actionKey] = now;
        return true; // Cho phép đi tiếp
    }

    return { check };
})();
