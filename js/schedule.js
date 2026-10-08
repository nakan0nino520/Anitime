const ScheduleView = (() => {
    const el = () => document.getElementById('schedule');
    const daysNav = () => document.getElementById('daysNav');
    let currentDate = new Date();
    let scheduleCache = [];
    let currentView = 'daily';
    let filterMyList = false;

    function init() {
        renderDaysNav();
        renderInfoBar();
        load();
        bindSegmented();
        Countdown.onTick(() => UI.tickCountdowns());
        Countdown.start();
    }

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

    function renderInfoBar() {
        const tzInfo = document.getElementById('tzInfo');
        if (tzInfo) tzInfo.textContent = TZ.label();
        const s = Store.getSettings();
        filterMyList = s.filterMyList || false;
        const btn = document.getElementById('btnFilterMyList');
        if (btn) btn.classList.toggle('active', filterMyList);
        if (btn && !btn._bound) {
            btn._bound = true;
            btn.addEventListener('click', () => {
                filterMyList = !filterMyList;
                btn.classList.toggle('active', filterMyList);
                Store.setSetting('filterMyList', filterMyList);
                render();
            });
        }
    }

    function bindSegmented() {
        const tabs = document.getElementById('scheduleViewTabs');
        if (!tabs) return;
        tabs.querySelectorAll('.seg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tabs.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.view;
                render();
            });
        });
    }

    async function load() {
        const container = el();
        if (!container) return;
        container.innerHTML = UI.skeleton(4);

        const from = new Date(currentDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(from);
        to.setDate(to.getDate() + 1);

        try {
            const data = await API.getSchedule(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000));
            scheduleCache = data.sort((a, b) => a.airingAt - b.airingAt);
            render();
        } catch (err) {
            container.innerHTML = `<div class="loading"><p>Lỗi tải dữ liệu. <br>Kiểm tra kết nối mạng.</p></div>`;
        }
    }

    function render() {
        const container = el();
        if (!container) return;

        let items = scheduleCache;

        // LỌC MY LIST
        if (filterMyList) {
            items = items.filter(it => {
                const st = Store.getStatus(it.media.id);
                return st === 'WATCHING' || st === 'PLANNING';
            });
        }

        // ẨN DROPPED
        const s = Store.getSettings();
        if (s.hideDropped) {
            items = items.filter(it => Store.getStatus(it.media.id) !== 'DROPPED');
        }

        if (!items.length) {
            container.innerHTML = `<div class="loading"><p>Không có anime nào ${filterMyList ? 'trong My List ' : ''}phát sóng ngày này</p></div>`;
            return;
        }

        if (currentView === 'grid') {
            container.classList.add('grid-view');
            container.innerHTML = items.map(it => UI.animeCard(it)).join('');
        } else if (currentView === 'week') {
            container.classList.remove('grid-view');
            container.innerHTML = renderWeekView(items);
        } else {
            container.classList.remove('grid-view');
            container.innerHTML = items.map(it => UI.animeCard(it)).join('');
        }

        // BIND CLICK
        container.querySelectorAll('.anime-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.fav-btn')) return;
                const id = card.dataset.id;
                DetailView.open(parseInt(id));
            });
        });
        container.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                toggleFavorite(id, btn);
            });
        });
    }

    function renderWeekView(items) {
        const byDay = {};
        items.forEach(it => {
            const key = TZ.dayKey(it.airingAt);
            if (!byDay[key]) byDay[key] = [];
            byDay[key].push(it);
        });
        let html = '';
        Object.keys(byDay).sort().forEach(day => {
            html += `<div class="week-day-header">${day}</div>`;
            html += byDay[day].map(it => UI.animeCard(it)).join('');
        });
        return html;
    }

    function toggleFavorite(id, btn) {
        const current = Store.getStatus(id);
        if (current === 'WATCHING' || current === 'PLANNING') {
            Store.setStatus(id, null);
            btn.classList.remove('active');
            btn.querySelector('svg').setAttribute('fill', 'none');
            UI.toast('Đã xóa khỏi yêu thích');
        } else {
            Store.setStatus(id, 'PLANNING');
            btn.classList.add('active');
            btn.querySelector('svg').setAttribute('fill', 'currentColor');
            UI.toast('Đã thêm vào Kế hoạch');
        }
    }

    function refresh() {
        currentDate = new Date();
        renderDaysNav();
        load();
    }

    return { init, refresh, load };
})();
