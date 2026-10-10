// js/hot-anime.js
// 2 KHUNG: ĐANG HOT + ĐÃ HOT

const HotAnime = (() => {
    let currentFormatFilter = 'ALL';
    const HOT_POPULARITY = 50000;
    const HOT_SCORE = 80;
    const SUPER_HOT_POPULARITY = 200000;
    const SUPER_HOT_SCORE = 88;

    let state = {
        year: new Date().getFullYear(),
        season: getCurrentSeason(),
        genre: 'ALL'
    };

    const SEASONS = [
        { value: 'WINTER', label: '❄️ Đông' },
        { value: 'SPRING', label: '🌸 Xuân' },
        { value: 'SUMMER', label: '☀️ Hè' },
        { value: 'FALL', label: '🍂 Thu' }
    ];

    const GENRES = [
        { value: 'ALL', label: '🎭 Tất cả' },
        { value: 'Action', label: '⚔️ Action' },
        { value: 'Adventure', label: '🗺️ Adventure' },
        { value: 'Comedy', label: '😂 Comedy' },
        { value: 'Drama', label: '🎭 Drama' },
        { value: 'Fantasy', label: '🧙 Fantasy' },
        { value: 'Horror', label: '👻 Horror' },
        { value: 'Mystery', label: '🔍 Mystery' },
        { value: 'Romance', label: '💕 Romance' },
        { value: 'Sci-Fi', label: '🚀 Sci-Fi' },
        { value: 'Slice of Life', label: '🌸 Slice of Life' },
        { value: 'Sports', label: '⚽ Sports' },
        { value: 'Supernatural', label: '✨ Supernatural' },
        { value: 'Thriller', label: '😱 Thriller' }
    ];

    function getCurrentSeason() {
        const m = new Date().getMonth() + 1;
        if (m >= 1 && m <= 3) return 'WINTER';
        if (m >= 4 && m <= 6) return 'SPRING';
        if (m >= 7 && m <= 9) return 'SUMMER';
        return 'FALL';
    }

    function isSuperHot(anime) {
        if (!anime) return false;
        const pop = anime.popularity || 0;
        const score = anime.averageScore || 0;
        return pop >= SUPER_HOT_POPULARITY || score >= SUPER_HOT_SCORE;
    }

    // ===== LẤY FORMAT CHO API =====
    function getApiFormat() {
        if (currentFormatFilter === 'ALL') return 'TV';
        return currentFormatFilter;
    }

    // ===== KHỞI TẠO =====
    function init() {
        console.log('[HotAnime] init');
        initLiveSection();
        loadClassicSection();
    }

    // ===== KHUNG 1: ĐANG HOT =====
    function initLiveSection() {
        const btnYear = document.getElementById('hotFilterYear');
        const btnSeason = document.getElementById('hotFilterSeason');
        const btnGenre = document.getElementById('hotFilterGenre');

        if (btnYear) btnYear.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('year'); });
        if (btnSeason) btnSeason.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('season'); });
        if (btnGenre) btnGenre.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('genre'); });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hot-filter-bar') && !e.target.closest('.hot-dropdown')) {
                closeDropdown();
            }
        });

        updateLabels();
        loadLiveSection();
    }

    function updateLabels() {
        const yearLabel = document.getElementById('hotYearLabel');
        const seasonLabel = document.getElementById('hotSeasonLabel');
        const genreLabel = document.getElementById('hotGenreLabel');

        if (yearLabel) yearLabel.textContent = state.year;
        if (seasonLabel) {
            const s = SEASONS.find(x => x.value === state.season);
            seasonLabel.textContent = s ? s.label : state.season;
        }
        if (genreLabel) {
            if (state.genre === 'ALL') {
                genreLabel.textContent = '🎭 Thể loại';
            } else {
                const g = GENRES.find(x => x.value === state.genre);
                genreLabel.textContent = g ? g.label : state.genre;
            }
        }

        document.getElementById('hotFilterGenre')?.classList.toggle('active', state.genre !== 'ALL');
    }

    function openDropdown(type) {
        const dropdown = document.getElementById('hotDropdown');
        if (!dropdown) return;

        if (dropdown.dataset.type === type && dropdown.classList.contains('show')) {
            closeDropdown();
            return;
        }

        dropdown.dataset.type = type;
        dropdown.classList.add('show');

        let items = [];
        if (type === 'year') {
            const now = new Date().getFullYear() + 1;
            for (let y = now; y >= 2000; y--) items.push({ value: y, label: y });
        } else if (type === 'season') {
            items = SEASONS;
        } else if (type === 'genre') {
            items = GENRES;
        }

        const currentValue = state[type];

        dropdown.innerHTML = items.map(it => `
            <button class="hot-dropdown-item ${it.value == currentValue ? 'active' : ''}" data-value="${it.value}">
                ${it.label}
            </button>
        `).join('');

        dropdown.querySelectorAll('.hot-dropdown-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.value;
                if (type === 'year') state.year = parseInt(val);
                else if (type === 'season') state.season = val;
                else if (type === 'genre') state.genre = val;

                updateLabels();
                closeDropdown();
                loadLiveSection();
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    }

    function closeDropdown() {
        const dropdown = document.getElementById('hotDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }

    // ===== LOAD KHUNG ĐANG HOT =====
    async function loadLiveSection() {
        const hotScroll = document.getElementById('hotLiveScroll') || document.getElementById('hotScroll');
        if (!hotScroll) return;

        hotScroll.innerHTML = '<div class="hot-loading"><div class="spinner-small"></div></div>';

        try {
            const apiFormat = getApiFormat();
            let data = await API.getSeasonal(state.season, state.year, apiFormat);
            data = data || [];

            // LỌC: CHỈ ANIME ĐANG CHIẾU
            data = data.filter(a => a.status === 'RELEASING');

            // LỌC THEO GENRE
            if (state.genre !== 'ALL') {
                data = data.filter(a => (a.genres || []).includes(state.genre));
            }

            // SẮP XẾP THEO ĐỘ HOT
            data.sort((a, b) => {
                const scoreA = (a.popularity || 0) + (a.averageScore || 0) * 100;
                const scoreB = (b.popularity || 0) + (b.averageScore || 0) * 100;
                return scoreB - scoreA;
            });

            const list = data.slice(0, 15);

            if (!list.length) {
                hotScroll.innerHTML = '<div class="hot-empty">📭 Chưa có anime nào đang chiếu</div>';
                return;
            }

            hotScroll.innerHTML = list.map((a, i) => renderLiveCard(a, i + 1)).join('');

            hotScroll.querySelectorAll('.hot-live-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.dataset.id);
                    if (id && window.DetailView) DetailView.open(id);
                });
            });
        } catch (err) {
            console.error('[HotAnime] Lỗi live:', err);
            hotScroll.innerHTML = '<div class="hot-empty">Lỗi tải dữ liệu</div>';
        }
    }

    // ===== LOAD KHUNG ĐÃ HOT =====
    async function loadClassicSection() {
        const classicScroll = document.getElementById('hotClassicScroll');
        if (!classicScroll) return; // Nếu giao diện không có khung này thì bỏ qua an toàn

        classicScroll.innerHTML = '<div class="hot-loading"><div class="spinner-small"></div></div>';

        try {
            const allData = [];
            const seasons = ['FALL', 'SUMMER', 'SPRING', 'WINTER'];
            const currentYear = new Date().getFullYear();
            const apiFormat = getApiFormat();

            for (const year of [currentYear, currentYear - 1]) {
                for (const season of seasons) {
                    try {
                        const data = await API.getSeasonal(season, year, apiFormat);
                        if (data) allData.push(...data);
                        // Thêm độ trễ ngắn tránh bị API bên thứ ba chặn do gọi quá nhanh
                        await new Promise(r => setTimeout(r, 200));
                    } catch (e) {}
                }
            }

            let data = allData.filter(a => a.status === 'FINISHED');

            data = data.filter(a => {
                const pop = a.popularity || 0;
                const score = a.averageScore || 0;
                return pop >= HOT_POPULARITY || score >= HOT_SCORE;
            });

            const seen = new Set();
            data = data.filter(a => {
                if (seen.has(a.id)) return false;
                seen.add(a.id);
                return true;
            });

            data.sort((a, b) => {
                const scoreA = (a.popularity || 0) + (a.averageScore || 0) * 100;
                const scoreB = (b.popularity || 0) + (b.averageScore || 0) * 100;
                return scoreB - scoreA;
            });

            const list = data.slice(0, 15);

            if (!list.length) {
                classicScroll.innerHTML = '<div class="hot-empty">📭 Chưa có anime nào</div>';
                return;
            }

            classicScroll.innerHTML = list.map((a, i) => renderClassicCard(a, i + 1)).join('');

            classicScroll.querySelectorAll('.hot-classic-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.dataset.id);
                    if (id && window.DetailView) DetailView.open(id);
                });
            });
        } catch (err) {
            console.error('[HotAnime] Lỗi classic:', err);
            classicScroll.innerHTML = '<div class="hot-empty">Lỗi tải dữ liệu</div>';
        }
    }

    // ===== RENDER CARD ĐANG HOT =====
    function renderLiveCard(a, rank) {
        const title = (typeof UI !== 'undefined' && UI.titleOf) ? UI.titleOf(a) : (a.title?.romaji || '');
        const cover = a.coverImage?.large || a.coverImage?.extraLarge || '';
        const score = a.averageScore ? (a.averageScore / 10).toFixed(1) : '?';
        const pop = a.popularity ? (a.popularity / 1000).toFixed(0) + 'K' : '?';
        const superHot = isSuperHot(a);

        return `
            <div class="hot-live-card ${superHot ? 'super-hot' : ''}" data-id="${a.id}">
                <div class="hot-live-rank">${rank}</div>
                <div class="hot-live-img-wrap">
                    <img class="hot-live-img" src="${cover}" loading="lazy" alt="" onerror="this.style.background='#2a2a2a'">
                    <div class="hot-live-badge-card">● LIVE</div>
                    ${superHot ? '<div class="hot-live-fire">🔥</div>' : ''}
                </div>
                <div class="hot-live-card-title">${UI.escapeHtml(title)}</div>
                <div class="hot-live-card-meta">
                    <span class="hot-live-score">★ ${score}</span>
                    <span>${pop}</span>
                </div>
            </div>
        `;
    }

    // ===== RENDER CARD ĐÃ HOT =====
    function renderClassicCard(a, rank) {
        const title = (typeof UI !== 'undefined' && UI.titleOf) ? UI.titleOf(a) : (a.title?.romaji || '');
        const cover = a.coverImage?.large || a.coverImage?.extraLarge || '';
        const score = a.averageScore ? (a.averageScore / 10).toFixed(1) : '?';
        const eps = a.episodes || '?';
        const superHot = isSuperHot(a);

        return `
            <div class="hot-classic-card ${superHot ? 'legend' : ''}" data-id="${a.id}">
                <div class="hot-classic-crown-wrap">
                    ${rank <= 3 ? '<span class="hot-classic-crown-icon">👑</span>' : ''}
                </div>
                <div class="hot-classic-rank">#${rank}</div>
                <div class="hot-classic-img-wrap">
                    <img class="hot-classic-img" src="${cover}" loading="lazy" alt="" onerror="this.style.background='#2a2a2a'">
                    <div class="hot-classic-overlay"></div>
                    <div class="hot-classic-badge">KINH ĐIỂN</div>
                </div>
                <div class="hot-classic-card-title">${UI.escapeHtml(title)}</div>
                <div class="hot-classic-card-meta">
                    <span class="hot-classic-score">★ ${score}</span>
                    <span>📺 ${eps}</span>
                </div>
            </div>
        `;
    }

    // ===== CẬP NHẬT FORMAT FILTER TỪ SCHEDULE =====
    function updateFormatFilter(format) {
        currentFormatFilter = format || 'ALL';
        console.log('[HotAnime] Format filter:', currentFormatFilter);
        loadLiveSection();
        loadClassicSection();
    }

    return { init, updateFormatFilter, loadHotSection, isHot, isSuperHot };
    })();

window.HotAnime = HotAnime;
