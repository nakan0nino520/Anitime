// js/schedule.js

const ScheduleView = {
    async init() {
        await this.load();
    },
    async refresh() {
        await this.load();
    },
    async load() {
        const loadingEl = document.querySelector('#schedule .loading') 
                        || document.querySelector('.loading')
                        || document.getElementById('loading');

        // Mốc thời gian đầu ngày & cuối ngày (GIÂY)
        const now = new Date();
        const startOfDay = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime() / 1000);
        const endOfDay = startOfDay + 86400;

        try {
            if (typeof API === 'undefined' || typeof API.getSchedule !== 'function') {
                throw new Error("Chưa nạp đối tượng API từ api.js!");
            }

            const schedules = await API.getSchedule(startOfDay, endOfDay);

            if (!schedules || schedules.length === 0) {
                this.renderEmpty("Không có lịch phát sóng cho hôm nay.");
            } else {
                this.render(schedules);
            }

        } catch (error) {
            console.error("Lỗi khi tải lịch phát sóng:", error);
            this.renderEmpty("Đã xảy ra lỗi khi kết nối máy chủ.");
        } finally {
            // Luôn ẩn spinner khi kết thúc
            if (loadingEl) {
                loadingEl.style.display = 'none';
            }
        }
    },

    render(list) {
        const container = document.getElementById('schedule');
        if (!container) return;

        container.innerHTML = '';

        list.forEach(item => {
            const media = item.media;
            const title = media.title.userPreferred || media.title.romaji || media.title.english || media.title.native;
            const cover = media.coverImage.large;
            const ep = item.episode;
            
            const cardHtml = `
                <div class="anime-card" data-id="${media.id}">
                    <img class="anime-cover" src="${cover}" alt="${title}" loading="lazy">
                    <div class="anime-info">
                        <div class="anime-title">${title}</div>
                        <div class="anime-time">
                            <span class="anime-ep">Tập ${ep}</span>
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHtml);
        });
    },

    renderEmpty(message) {
        const container = document.getElementById('schedule');
        if (container) {
            container.innerHTML = `<div class="empty-state" style="text-align:center; padding: 24px; color: var(--text-2); font-weight: 600;">${message}</div>`;
        }
    }
};

// Gán biến toàn cục cho app.js sử dụng
window.ScheduleView = ScheduleView;
