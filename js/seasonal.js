const SeasonalView = (() => {
    const el = () => document.getElementById('seasonal');
    let currentSeason = 'WINTER';
    let currentYear = new Date().getFullYear();
    let currentFormat = 'TV';
    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;

        // XÁC ĐỊNH MÙA HIỆN TẠI
        const m = new Date().getMonth() + 1;
        if (m >= 1 && m <= 3) currentSeason = 'WINTER';
        else if (m >= 4 && m <= 6) currentSeason = 'SPRING';
        else if (m >= 7 && m <= 9) currentSeason = 'SUMMER';
        else currentSeason = 'FALL';

        const sel = document.getElementById('seasonSelect');
        if (sel) {
            sel.value = currentSeason;
            sel.addEventListener('change', () => {
                currentSeason = sel.value;
                load();
            });
        }

        const yearSel = document.getElementById('yearSelect');
        if (yearSel) {
            yearSel.innerHTML = '';
            const now = new Date().getFullYear();
            for (let y = now + 1; y >= 2000; y--) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                if (y === currentYear) opt.selected = true;
                yearSel.appendChild(opt);
            }
            yearSel.addEventListener('change', () => {
                currentYear = parseInt(yearSel.value);
                load();
            });
        }

        const tabs = document.getElementById('formatTabs');
        if (tabs) {
            tabs.querySelectorAll('.seg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    tabs.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentFormat = btn.dataset.format;
                    load();
                });
            });
        }

        load();
    }

    async function load() {
        const container = el();
        if (!container) return;
        container.classList.remove('grid-view');
        container.innerHTML = UI.skeleton(6);

        try {
            const data = await API.getSeasonal(currentSeason, currentYear, currentFormat);
            if (!data || !data.length) {
                container.innerHTML = `<div class="loading"><p>Không có anime nào trong mùa này</p></div>`;
                return;
            }
            container.classList.add('grid-view');
            container.innerHTML = data.map(m => UI.animeCard(m, { compact: true })).join('');
            container.querySelectorAll('.anime-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.fav-btn')) return;
                    DetailView.open(parseInt(card.dataset.id));
                });
            });
            container.querySelectorAll('.fav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    toggleFavorite(id, btn);
                });
            });
        } catch (err) {
            container.innerHTML = `<div class="loading"><p>Lỗi tải dữ liệu</p></div>`;
        }
    }

    function toggleFavorite(id, btn) {
        const current = Store.getStatus(id);
        if (current === 'WATCHING' || current === 'PLANNING') {
            Store.setStatus(id, null);
            btn.classList.remove('active');
            btn.querySelector('svg').setAttribute('fill', 'none');
        } else {
            Store.setStatus(id, 'PLANNING');
            btn.classList.add('active');
            btn.querySelector('svg').setAttribute('fill', 'currentColor');
            UI.toast('Đã thêm vào Kế hoạch');
        }
    }

    return { init, load };
})();
