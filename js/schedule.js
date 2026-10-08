// js/schedule.js
import { API } from './api.js';

export async function loadSchedule() {
    // Tìm phần tử hiển thị "Đang tải lịch phát...[span_1](start_span)"[span_1](end_span)
    const loadingEl = document.querySelector('.loading') || document.getElementById('loading');

    // 1. Lấy mốc thời gian BẮT ĐẦU và KẾT THÚC của hôm nay (Đơn vị: GIÂY)
    const now = new Date();
    const startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime() / 1000);
    const endOfDay = startOfDay + 86400; // Cộng thêm 24 giờ

    try {
        // 2. Gọi API lấy lịch chiếu
        const schedules = await API.getSchedule(startOfDay, endOfDay);

        if (!schedules || schedules.length === 0) {
            renderEmptyState("Không có lịch phát sóng cho hôm nay.");
            return;
        }

        // 3. Render danh sách phim ra màn hình
        renderScheduleUI(schedules);

    } catch (error) {
        console.error("Lỗi khi tải lịch phát sóng:", error);
        renderEmptyState("Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại!");
    } finally {
        // 4. ⚠️ QUAN TRỌNG NHẤT: Bắt buộc ẩn Spinner dù thành công hay thất bại
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}

// Hàm bổ trợ hiển thị UI khi không có dữ liệu
function renderEmptyState(message) {
    const container = document.querySelector('.schedule-container') || document.body;
    // Bạn điều chỉnh class/id hiển thị nội dung tùy theo index.html
}

// Hàm bổ trợ render danh sách phim
function renderScheduleUI(list) {
    // Code render thẻ Anime Card của bạn tại đây...
}
