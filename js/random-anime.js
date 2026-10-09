// js/random-anime.js
// ANIME NGẪU NHIÊN - CHỌN THỂ LOẠI ĐỂ QUAY

const RandomAnime = (() => {
    let initialized = false;
    let currentAnime = null;
    let currentGenre = 'ALL';

    // ===== DANH SÁCH 13 THỂ LOẠI =====
    const GENRES = [
        { value: 'ALL', label: '🎲 Tất cả' },
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

    // ===== KHỞI TẠO =====
    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[RandomAnime] init');

        const btnOpen = document.getElementById('btnRandomAnime');
        const modal = document.getElementById('randomModal');
        if (!btnOpen || !modal) {
            console.warn('[RandomAnime] Không tìm thấy element');
            return;
        }

        btnOpen.addEventListener('click', open);

        const closeBtn = document.getElementById('randomModalClose');
        if (closeBtn) closeBtn.addEventListener('click', close);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        const genreBar = document.getElementById('randomGenreBar');
        if (genreBar) renderGenreChips();

        const rollBtn = document.getElementById('randomRollBtn');
        if (rollBtn) rollBtn.addEventListener('click', roll);

        const rollAgainBtn = document.getElementById('randomRollAgainBtn');
        if (rollAgainBtn) rollAgainBtn.addEventListener('click', roll);

        const detailBtn = document.getElementById('randomDetailBtn');
        if (detailBtn) {
            detailBtn.addEventListener('click', () => {
                if (currentAnime && currentAnime.id) {
                    close();
                    setTimeout(() => {
                        if (window.DetailView) DetailView.open(currentAnime.id);
                    }, 400);
                }
            });
        }
    }

    // ===== VẼ 13 CHIP THỂ LOẠI =====
    function renderGenreChips() {
        const genreBar = document.getElementById('randomGenreBar');
        if (!genreBar) return;
        genreBar.innerHTML = GENRES.map(g => `
            <button class="random-genre-chip ${g.value === currentGenre ? 'active' : ''}" data-genre="${g.value}">
                ${g.label}
            </button>
        `).join('');

        genreBar.querySelectorAll('.random-genre-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                genreBar.querySelectorAll('.random-genre-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentGenre = chip.dataset.genre;
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
    }

    // ===== MỞ MODAL =====
    function open() {
        const modal = document.getElementById('randomModal');
        if (!modal) return;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        currentAnime = null;
        currentGenre = 'ALL';
        renderGenreChips();

        const result = document.getElementById('randomResult');
        if (result) {
            result.innerHTML = `
                <div class="random-empty">
                    <div class="random-empty-icon">🎲</div>
                    <h3>Sẵn sàng chưa?</h3>
                    <p>Chọn thể loại rồi nhấn "Quay" để nhận anime ngẫu nhiên</p>
                </div>
            `;
        }

        const rollBtn = document.getElementById('randomRollBtn');
        if (rollBtn) rollBtn.style.display = 'flex';

        const detailBtn = document.getElementById('randomDetailBtn');
        const rollAgainBtn = document.getElementById('randomRollAgainBtn');
        if (detailBtn) detailBtn.style.display = 'none';
        if (rollAgainBtn) rollAgainBtn.style.display = 'none';
    }

    // ===== ĐÓNG MODAL =====
    function close() {
        const modal = document.getElementById('randomModal');
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }

    // ===== QUAY =====
    async function roll() {
        const result = document.getElementById('randomResult');
        if (!result) return;

        result.innerHTML = `
            <div class="random-loading">
                <div class="random-dice">🎲</div>
                <p>Đang quay...</p>
            </div>
        `;

        const rollBtn = document.getElementById('randomRollBtn');
        const detailBtn = document.getElementById('randomDetailBtn');
        const rollAgainBtn = document.getElementById('randomRollAgainBtn');
        if (rollBtn) rollBtn.style.display = 'none';
        if (detailBtn) detailBtn.style.display = 'none';
        if (rollAgainBtn) rollAgainBtn.style.display = 'none';

        try {
            const page = Math.floor(Math.random() * 50) + 1;
            const genreFilter = currentGenre === 'ALL' ? null : [currentGenre];

            const query = `
                query ($page: Int, $genres: [String]) {
                    Page(page: $page, perPage: 1) {
                        media(
                            genre_in: $genres,
                            type: ANIME,
                            sort: POPULARITY_DESC,
                            isAdult: false,
                            format_in: [TV, MOVIE, OVA, ONA]
                        ) {
                            id
                            title { romaji native english }
                            coverImage { extraLarge large }
                            bannerImage
                            description(asHtml: false)
                            genres
                            averageScore
                            popularity
                            episodes
                            duration
                            format
                            status
                            season
                            seasonYear
                            siteUrl
                            studios(isMain: true) { nodes { name } }
                            trailer { id site }
                        }
                    }
                }
            `;

            // Sử dụng window.API nếu tồn tại để đồng bộ cấu hình, nếu không dùng fetch trực tiếp
            let jsonData;
            if (window.API && typeof window.API === 'object') {
                // Tận dụng hệ thống gọi chung
                const endpoint = 'https://graphql.anilist.co';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ query, variables: { page, genres: genreFilter } })
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                jsonData = await res.json();
                if (jsonData.errors) throw new Error(jsonData.errors[0].message);
            } else {
                const res = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { page, genres: genreFilter } })
                });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                jsonData = await res.json();
                if (jsonData.errors) throw new Error(jsonData.errors[0].message);
            }

            const media = jsonData?.data?.Page?.media?.[0];
            if (!media) throw new Error('Không có kết quả');

            currentAnime = media;
            renderAnime(media);

            if (detailBtn) detailBtn.style.display = 'flex';
            if (rollAgainBtn) rollAgainBtn.style.display = 'flex';
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

        } catch (err) {
            console.error('[RandomAnime] Lỗi:', err);
            result.innerHTML = `
                <div class="random-empty">
                    <div class="random-empty-icon">⚠</div>
                    <h3>Không thể quay</h3>
                    <p>${escapeHtml(err.message)}</p>
                    <button class="random-roll-btn" id="randomRetryBtn" style="margin-top:20px">
                        <span class="random-roll-icon">🎲</span>
                        <span>Thử lại</span>
                    </button>
                </div>
            `;
            const retryBtn = document.getElementById('randomRetryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', roll);
            }
        }
    }

    // ===== RENDER ANIME CARD =====
    function renderAnime(media) {
        const result = document.getElementById('randomResult');
        if (!result) return;

        const title = media.title?.romaji || media.title?.english || media.title?.native || 'Unknown';
        const titleNative = media.title?.native || '';
        const cover = media.coverImage?.extraLarge || media.coverImage?.large || '';
        const banner = media.bannerImage || '';
        const desc = cleanHtml(media.description || '');
        const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
        const episodes = media.episodes || '?';
        const duration = media.duration ? media.duration + 'p' : '';
        const format = media.format || 'TV';
        const season = media.season && media.seasonYear ? `${media.season} ${media.seasonYear}` : '';
        const studios = (media.studios?.nodes || []).map(s => s.name).join(', ');
        const genres = (media.genres || []).slice(0, 4);
        const trailer = media.trailer?.site === 'youtube' ? media.trailer.id : null;

        const scoreClr = score !== '—' && parseFloat(score) >= 8 ? '#30d158'
            : score !== '—' && parseFloat(score) >= 7 ? '#0a84ff'
            : score !== '—' && parseFloat(score) >= 6 ? '#ff9f0a'
            : '#ff375f';

        result.innerHTML = `
            <div class="random-anime-card">
                ${banner ? `
                    <div class="random-banner" style="background-image:url('${banner}')">
                        <div class="random-banner-overlay"></div>
                    </div>
                ` : ''}

                <div class="random-card-body">
                    <div class="random-card-top">
                        <img class="random-cover" src="${cover}" alt="" loading="lazy">
                        <div class="random-card-info">
                            <h3 class="random-title">${escapeHtml(title)}</h3>
                            ${titleNative ? `<p class="random-native">${escapeHtml(titleNative)}</p>` : ''}

                            <div class="random-badges">
                                <span class="random-badge score" style="--score-color:${scoreClr}">⭐ ${score}</span>
                                ${format ? `<span class="random-badge">${format}</span>` : ''}
                                ${episodes !== '?' ? `<span class="random-badge">${episodes} tập</span>` : ''}
                                ${duration ? `<span class="random-badge">${duration}</span>` : ''}
                            </div>

                            ${season ? `<div class="random-season">${season}</div>` : ''}
                            ${studios ? `<div class="random-studio">🎬 ${escapeHtml(studios)}</div>` : ''}
                        </div>
                    </div>

                    ${genres.length ? `
                        <div class="random-genres">
                            ${genres.map(g => `<span class="random-genre-tag">${escapeHtml(g)}</span>`).join('')}
                        </div>
                    ` : ''}

                    ${desc ? `
                        <div class="random-desc">
                            ${escapeHtml(desc.slice(0, 350))}${desc.length > 350 ? '...' : ''}
                        </div>
                    ` : ''}

                    ${trailer ? `
                        <div class="random-trailer">
                            <iframe src="https://www.youtube.com/embed/${trailer}?rel=0&modestbranding=1" allowfullscreen loading="lazy" title="Trailer"></iframe>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ===== HELPER =====
    function cleanHtml(str) {
        if (!str) return '';
        return str
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return { init, open, close, roll };
})();

window.RandomAnime = RandomAnime;
