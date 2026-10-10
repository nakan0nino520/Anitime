const HotAnime = (() => {
    let currentFormatFilter = 'ALL';
    const HOT_POPULARITY = 100000;
    const HOT_SCORE = 85;
    const SUPER_HOT_POPULARITY = 300000;
    const SUPER_HOT_SCORE = 90;

    let state = {
        year: new Date().getFullYear(),
        season: getCurrentSeason(),
        genre: 'ALL',
        sort: 'HOT'
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

    const SORTS = [
        { value: 'HOT', label: '🔥 HOT' },
        { value: 'SCORE', label: '⭐ Điểm cao' },
        { value: 'NEWEST', label: '🆕 Mới nhất' },
        { value: 'AZ', label: '🔤 A-Z' }
    ];

    function getCurrentSeason() {
        const m = new Date().getMonth() + 1;
        if (m >= 1 && m <= 3) return 'WINTER';
        if (m >= 4 && m <= 6) return 'SPRING';
        if (m >= 7 && m <= 9) return 'SUMMER';
        return 'FALL';
    }

    function isHot(anime) {
        if (!anime) return false;
        const pop = anime.popularity || 0;
        const score = anime.averageScore || 0;
        return pop >= HOT_POPULARITY || score >= HOT_SCORE;
    }

    function isSuperHot(anime) {
        if (!anime) return false;
        const pop = anime.popularity || 0;
        const score = anime.averageScore || 0;
        return pop >= SUPER_HOT_POPULARITY || score >= SUPER_HOT_SCORE;
    }

    function init() {
        console.log('[HotAnime] init');
        initHotSection();
    }

    function initHotSection() {
        const section = document.querySelector('.hot-section');
        if (!section) {
            console.log('[HotAnime] Không có hot section');
            return;
        }

        const btnYear = document.getElementById('hotFilterYear');
        const btnSeason = document.getElementById('hotFilterSeason');
        const btnGenre = document.getElementById('hotFilterGenre');
        const btnSort = document.getElementById('hotFilterSort');

        if (btnYear) btnYear.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('year'); });
        if (btnSeason) btnSeason.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('season'); });
        if (btnGenre) btnGenre.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('genre'); });
        if (btnSort) btnSort.addEventListener('click', (e) => { e.stopPropagation(); openDropdown('sort'); });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.hot-filter-bar') && !e.target.closest('.hot-dropdown')) {
                closeDropdown();
            }
        });

        updateLabels();
        loadHotSection();
    }

    function updateLabels() {
        const yearLabel = document.getElementById('hotYearLabel');
        const seasonLabel = document.getElementById('hotSeasonLabel');
        const genreLabel = document.getElementById('hotGenreLabel');
        const sortLabel = document.getElementById('hotSortLabel');

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
        if (sortLabel) {
            const s = SORTS.find(x => x.value === state.sort);
            sortLabel.textContent = s ? s.label : state.sort;
        }

        document.getElementById('hotFilterGenre')?.classList.toggle('active', state.genre !== 'ALL');
        document.getElementById('hotFilterSort')?.classList.toggle('active', state.sort !== 'HOT');
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
        } else if (type === 'sort') {
            items = SORTS;
        }

        const currentValue = state[type === 'year' ? 'year' : type === 'season' ? 'season' : type === 'genre' ? 'genre' : 'sort'];

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
                else if (type === 'sort') state.sort = val;

                updateLabels();
                closeDropdown();
                loadHotSection();
                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    }

    function closeDropdown() {
        const dropdown = document.getElementById('hotDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }

    async function loadHotSection() {
        const hotScroll = document.getElementById('hotScroll');
        if (!hotScroll) return;

        hotScroll.innerHTML = '<div class="hot-loading"><div class="spinner-small"></div></div>';

        try {
            let data = await API.getSeasonal(state.season, state.year, 'TV');
            data = data || [];

            if (state.genre !== 'ALL') {
                data = data.filter(a => (a.genres || []).includes(state.genre));
            }

            data = sortData(data, state.sort);
            const list = data.slice(0, 12);

            if (!list.length) {
                hotScroll.innerHTML = '<div class="hot-empty">📭 Không có anime nào</div>';
                return;
            }

            hotScroll.innerHTML = list.map((a, i) => renderCard(a, i + 1)).join('');

            hotScroll.querySelectorAll('.hot-card').forEach(card => {
                card.addEventListener('click', () => {
                    const id = parseInt(card.dataset.id);
                    if (id && window.DetailView) DetailView.open(id);
                });
            });
        } catch (err) {
            console.error('[HotAnime] Lỗi:', err);
            hotScroll.innerHTML = '<div class="hot-empty">Lỗi tải dữ liệu</div>';
        }
    }

    function sortData(data, sort) {
        const arr = [...data];
        if (sort === 'HOT') {
            arr.sort((a, b) => {
                const scoreA = (a.popularity || 0) + (a.averageScore || 0) * 100;
                const scoreB = (b.popularity || 0) + (b.averageScore || 0) * 100;
                return scoreB - scoreA;
            });
        } else if (sort === 'SCORE') {
            arr.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
        } else if (sort === 'NEWEST') {
            arr.sort((a, b) => (b.id || 0) - (a.id || 0));
        } else if (sort === 'AZ') {
            arr.sort((a, b) => {
                const ta = (a.title?.romaji || '').toLowerCase();
                const tb = (b.title?.romaji || '').toLowerCase();
                return ta.localeCompare(tb);
            });
        }
        return arr;
    }

    function renderCard(a, rank) {
        const title = (typeof UI !== 'undefined' && UI.titleOf) ? UI.titleOf(a) : (a.title?.romaji || '');
        const cover = a.coverImage?.large || a.coverImage?.extraLarge || '';
        const score = a.averageScore ? (a.averageScore / 10).toFixed(1) : '?';
        const pop = a.popularity ? (a.popularity / 1000).toFixed(0) + 'K' : '?';
        const superHot = isSuperHot(a);

        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';

        return `
            <div class="hot-card ${superHot ? 'super-hot' : ''}" data-id="${a.id}">
                <div class="hot-card-rank ${rankClass}">${rank}</div>
                <div class="hot-card-img-wrap">
                    <img class="hot-card-img" src="${cover}" loading="lazy" alt="" onerror="this.style.background='#2a2a2a'">
                    ${superHot ? '<div class="hot-card-fire">🔥</div>' : ''}
                </div>
                <div class="hot-card-title">${UI.escapeHtml(title)}</div>
                <div class="hot-card-meta">
                    <span class="hot-card-score">★ ${score}</span>
                    <span class="hot-card-pop">${pop}</span>
                </div>
            </div>
        `;
    }

    return { init, loadHotSection, isHot, isSuperHot };
})();

window.HotAnime = HotAnime;
