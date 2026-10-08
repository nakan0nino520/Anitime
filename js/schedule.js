// js/schedule.js

const ScheduleView = (() => {
    const el = () => document.getElementById('schedule');
    const daysNav = () => document.getElementById('daysNav');
    let currentDate = new Date();
    let scheduleCache = [];
    let currentView = 'daily';
    let filterMyList = false;
    let initialized = false;

    // ========== KHỞI TẠO ==========
    function init() {
        console.log('[ScheduleView] init');
        if (!initialized) {
            renderDaysNav();
            renderInfoBar();
            bindSegmented();
            if (typeof Countdown !== 'undefined') {
                Countdown.onTick(() => typeof UI !== 'undefined' && UI.tickCountdowns && UI.tickCountdowns());
                Countdown.start();
            }
            initialized = true;
        }
        load();
    }

    // ========== THANH CHỌN NGÀY ==========
    function renderDaysNav() {
        const nav = daysNav();
        if (!nav) return;
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const today = new Date();
        nav.innerHTML = '';
        for (let i = -3; i <= 3; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const btn = document.createElement('button');
            btn.className = 'day-btn' + (i === 0 ? ' active' : '');
            const dayName = i === 0 ? 'Hôm nay' : i === 1 ? 'Mai' : i === -1 ? 'Hôm qua' : days[d.getDay()];
            btn.innerHTML = `
                <span class="day-num">${d.getDate()}</span>
                <span class="day-name">${dayName}</span>
            `;
            btn.addEventListener('click', () => {
                document.querySelectorAll('#daysNav .day-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDate = new Date(d);
                load();
            });
            nav.appendChild(btn);
        }
    }

    // ========== INFO BAR ==========
    function renderInfoBar() {
        const tzInfo = document.getElementById('tzInfo');
        if (tzInfo && typeof TZ !== 'undefined') tzInfo.textContent = TZ.label();
        
        if (typeof Store !== 'undefined') {
            const s = Store.getSettings();
            filterMyList = s.filterMyList || false;
        }
        
        const btn = document.getElementById('btnFilterMyList');
        if (btn) {
            btn.classList.toggle('active', filterMyList);
            if (!btn._bound) {
                btn._bound = true;
                btn.addEventListener('click', () => {
                    filterMyList = !filterMyList;
                    btn.classList.toggle('active', filterMyList);
                    if (typeof Store !== 'undefined') Store.setSetting('filterMyList', filterMyList);
                    render();
                });
            }
        }
    }

    // ========== BIND SEGMENTED TABS ==========
    function bindSegmented() {
        const tabs = document.getElementById('scheduleViewTabs');
        if (!tabs) {
            console.warn('[ScheduleView] Không tìm thấy #scheduleViewTabs');
            return;
        }
        console.log('[ScheduleView] Bind segmented tabs');
        const btns = tabs.querySelectorAll('.seg-btn');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newView = btn.dataset.view || 'daily';
                if (currentView !== newView) {
                    tabs.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentView = newView;
                    load(); // Reload lại API để lấy đủ ngày nếu đổi sang view Week
                }
            });
        });
    }

    // ========== TẢI DỮ LIỆU ==========
    async function load() {
        const container = el();
        if (!container) return;
        if (typeof UI !== 'undefined' && typeof UI.skeleton === 'function') {
            container.innerHTML = UI.skeleton(4);
        }

        const from = new Date(currentDate);
        from.setHours(0, 0, 0, 0);

        const to = new Date(from);
        // Nếu chọn View tuần -> Lấy 7 ngày, ngược lại lấy 1 ngày
        if (currentView === 'week') {
            to.setDate(to.getDate() + 7);
        } else {
            to.setDate(to.getDate() + 1);
        }

        try {
            if (typeof API === 'undefined' || typeof API.getSchedule !== 'function') {
                throw new Error("Chưa nạp đối tượng API từ api.js!");
            }

            const data = await API.getSchedule(
                Math.floor(from.getTime() / 1000),
                Math.floor(to.getTime() / 1000)
            );
            scheduleCache = (data || []).sort((a, b) => a.airingAt - b.airingAt);
            console.log('[ScheduleView] Nhận', scheduleCache.length, 'anime');
            render();
        } catch (err) {
            console.error('[ScheduleView] Lỗi load:', err);
            const msg = (typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(err.message || 'Không xác định') : (err.message || 'Lỗi');
            container.innerHTML = `
                <div class="loading">
                    <p>⚠ Lỗi tải dữ liệu</p>
                    <p style="font-size:12px;margin-top:8px;color:#8e8e93">${msg}</p>
                    <button onclick="ScheduleView.load()" style="margin-top:12px;padding:6px 16px;border-radius:12px;background:var(--accent);color:#fff;border:none;">Thử lại</button>
                </div>
            `;
        }
    }

    // ========== RENDER ==========
    function render() {
        const container = el();
        if (!container) return;

        let items = [...scheduleCache];

        // LỌC MY LIST
        if (filterMyList && typeof Store !== 'undefined') {
            items = items.filter(it => {
                const st = Store.getStatus(it.media.id);
                return st === 'WATCHING' || st === 'PLANNING';
            });
        }

        // ẨN DROPPED
        if (typeof Store !== 'undefined') {
            const s = Store.getSettings();
            if (s.hideDropped) {
                items = items.filter(it => Store.getStatus(it.media.id) !== 'DROPPED');
            }
        }

        // XỬ LÝ THEO VIEW
        if (currentView === 'grid') {
            container.classList.add('grid-view');
            if (!items.length) {
                container.classList.remove('grid-view');
                container.innerHTML = `<div class="loading"><p>Không có anime nào</p></div>`;
                return;
            }
            container.innerHTML = items.map(it => UI.animeCard(it, { compact: true })).join('');
        } else if (currentView === 'week') {
            container.classList.remove('grid-view');
            if (!items.length) {
                container.innerHTML = `<div class="loading"><p>Không có anime nào trong tuần này</p></div>`;
                return;
            }
            container.innerHTML = renderWeekView(items);
        } else {
            container.classList.remove('grid-view');
            if (!items.length) {
                container.innerHTML = `<div class="loading"><p>Không có anime nào phát sóng ngày này</p></div>`;
                return;
            }
            container.innerHTML = items.map(it => UI.animeCard(it)).join('');
        }

        // BIND CLICK CARD
        bindCardEvents(container);
    }

    // ========== BIND CLICK CARD ==========
    function bindCardEvents(container) {
        const cards = container.querySelectorAll('.anime-card');

        cards.forEach(card => {
            card.style.cursor = 'pointer';

            card.addEventListener('click', (e) => {
                if (e.target.closest('.fav-btn')) return;

                const id = parseInt(card.dataset.id);
                if (!id) return;

                if (window.DetailView && typeof DetailView.open === 'function') {
                    DetailView.open(id);
                } else if (typeof UI !== 'undefined') {
                    UI.toast('⚠ Không thể mở chi tiết');
                }
            });
        });

        // BIND FAV
        container.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                toggleFavorite(id, btn);
            });
        });
    }

    // ========== YÊU THÍCH ==========
    function toggleFavorite(id, btn) {
        if (typeof Store === 'undefined') return;
        const current = Store.getStatus(id);
        if (current === 'WATCHING' || current === 'PLANNING') {
            Store.setStatus(id, null);
            btn.classList.remove('active');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
            if (typeof UI !== 'undefined') UI.toast('Đã xóa khỏi yêu thích');
        } else {
            Store.setStatus(id, 'PLANNING');
            btn.classList.add('active');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'currentColor');
            if (typeof UI !== 'undefined') UI.toast('❤ Đã thêm vào Kế hoạch');
        }
    }

    // ========== WEEK VIEW ==========
    function renderWeekView(items) {
        const byDay = {};
        items.forEach(it => {
            const key = (typeof TZ !== 'undefined' && TZ.dayKey) ? TZ.dayKey(it.airingAt) : new Date(it.airingAt * 1000).toISOString().split('T')[0];
            if (!byDay[key]) byDay[key] = [];
            byDay[key].push(it);
        });

        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        let html = '';

        Object.keys(byDay).sort().forEach(day => {
            const d = new Date(day);
            const label = dayNames[d.getDay()] + ' · ' + d.getDate() + '/' + (d.getMonth() + 1);
            html += `<div class="week-day-header">${label}</div>`;
            html += byDay[day].map(it => UI.animeCard(it, { compact: true })).join('');
        });

        return html;
    }

    // ========== LÀM MỚI ==========
    function refresh() {
        currentDate = new Date();
        renderDaysNav();
        load();
    }

    return { init, refresh, load, render };
})();

window.ScheduleView = ScheduleView;
