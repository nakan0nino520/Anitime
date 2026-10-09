// js/content-warning.js
// CẢNH BÁO NỘI DUNG ANIME - TỰ ĐỘNG PHÂN TÍCH

const ContentWarning = (() => {

    // ===== ĐỊNH NGHĨA CÁC LOẠI CẢNH BÁO =====
    const WARNING_RULES = [
        {
            id: 'gore',
            icon: '🩸',
            title: 'Máu me & Bạo lực',
            desc: 'Có cảnh máu me, chém giết, bạo lực',
            color: '#ff375f',
            level: 'high',
            genres: ['Horror', 'Thriller'],
            tags: ['Gore', 'Blood', 'Violence', 'Torture', 'Murder', 'Death', 'Gore']
        },
        {
            id: 'adult',
            icon: '🔞',
            title: 'Nội dung người lớn',
            desc: 'Có yếu tố gợi cảm, không phù hợp trẻ em',
            color: '#ff375f',
            level: 'high',
            genres: ['Ecchi', 'Hentai'],
            tags: ['Ecchi', 'Sexual Content', 'Nudity', 'Sex', 'Hentai', 'Smut'],
            checkAdult: true
        },
        {
            id: 'heavy',
            icon: '😢',
            title: 'Nội dung nặng nề',
            desc: 'Có thể gây cảm xúc tiêu cực, chủ đề u ám',
            color: '#ff9f0a',
            level: 'medium',
            genres: ['Drama', 'Psychological', 'Tragedy'],
            tags: ['Tragedy', 'Depression', 'Death', 'Grief', 'Sad', 'Melancholy', 'Suicide', 'Self-Harm']
        },
        {
            id: 'complex',
            icon: '💔',
            title: 'Tình cảm phức tạp',
            desc: 'Có yếu tố tình cảm đa chiều, tay ba, tay tư',
            color: '#bf5af2',
            level: 'low',
            genres: ['Romance'],
            tags: ['Harem', 'Reverse Harem', 'Love Triangle', 'Love Polygon', 'Romantic Subtext']
        },
        {
            id: 'mental',
            icon: '🧠',
            title: 'Chủ đề tâm lý',
            desc: 'Khai thác tâm lý, có thể gây căng thẳng',
            color: '#ff9f0a',
            level: 'medium',
            genres: ['Psychological'],
            tags: ['Psychological', 'Mental Illness', 'Anxiety', 'PTSD', 'Trauma']
        },
        {
            id: 'war',
            icon: '⚔️',
            title: 'Chiến tranh & Xung đột',
            desc: 'Có cảnh chiến tranh, xung đột vũ trang',
            color: '#ff9f0a',
            level: 'medium',
            genres: ['Military'],
            tags: ['War', 'Military', 'Battle', 'Combat', 'Genocide']
        },
        {
            id: 'dark',
            icon: '🌑',
            title: 'Chủ đề tăm tối',
            desc: 'Có yếu tố đen tối, tội phạm, tà ác',
            color: '#8e8e93',
            level: 'low',
            genres: ['Supernatural', 'Mystery'],
            tags: ['Dark Fantasy', 'Crime', 'Organized Crime', 'Mafia', 'Drugs', 'Yakuza']
        }
    ];

    // ===== PHÂN TÍCH 1 ANIME =====
    function analyze(anime) {
        if (!anime) return [];

        const warnings = [];
        const genres = (anime.genres || []).map(g => g.toLowerCase());
        const tags = ((anime.tags || []).map(t => (t.name || t).toLowerCase()));
        const isAdult = anime.isAdult || false;

        WARNING_RULES.forEach(rule => {
            let matched = false;

            // CHECK ADULT
            if (rule.checkAdult && isAdult) matched = true;

            // CHECK GENRES
            if (!matched && rule.genres) {
                matched = rule.genres.some(g => genres.includes(g.toLowerCase()));
            }

            // CHECK TAGS
            if (!matched && rule.tags) {
                matched = rule.tags.some(t => tags.includes(t.toLowerCase()));
            }

            if (matched) {
                warnings.push(rule);
            }
        });

        // SẮP XẾP THEO LEVEL
        const levelOrder = { high: 0, medium: 1, low: 2 };
        warnings.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

        return warnings;
    }

    // ===== TẠO HTML BANNER =====
    function renderBanner(warnings) {
        if (!warnings || !warnings.length) return '';

        const hasHigh = warnings.some(w => w.level === 'high');
        const mainLevel = hasHigh ? 'high' : warnings.some(w => w.level === 'medium') ? 'medium' : 'low';

        return `
            <div class="content-warning-banner level-${mainLevel}" id="contentWarningBanner">
                <div class="cw-header">
                    <div class="cw-icon">⚠️</div>
                    <div class="cw-title">
                        <div class="cw-title-main">Cảnh báo nội dung</div>
                        <div class="cw-title-sub">
                            Anime này có ${warnings.length} yếu tố cần lưu ý
                        </div>
                    </div>
                    <button class="cw-toggle" id="cwToggle">Xem</button>
                </div>
                <div class="cw-list" id="cwList">
                    ${warnings.map(w => `
                        <div class="cw-item" style="--cw-color:${w.color}">
                            <div class="cw-item-icon">${w.icon}</div>
                            <div class="cw-item-info">
                                <div class="cw-item-title">${w.title}</div>
                                <div class="cw-item-desc">${w.desc}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ===== BIND SỰ KIỆN TOGGLE =====
    function bindBannerEvents(container) {
        const banner = container.querySelector('#contentWarningBanner');
        const toggle = container.querySelector('#cwToggle');
        const list = container.querySelector('#cwList');

        if (!banner || !toggle || !list) return;

        toggle.addEventListener('click', () => {
            const isOpen = list.classList.contains('open');
            list.classList.toggle('open', !isOpen);
            toggle.textContent = isOpen ? 'Xem' : 'Ẩn';
            if (navigator.vibrate) navigator.vibrate(5);
        });

        // NHẤN VÀO BANNER CŨNG TOGGLE
        banner.addEventListener('click', (e) => {
            if (e.target.closest('.cw-toggle')) return;
            const isOpen = list.classList.contains('open');
            list.classList.toggle('open', !isOpen);
            toggle.textContent = isOpen ? 'Xem' : 'Ẩn';
        });
    }

    return { analyze, renderBanner, bindBannerEvents };
})();

window.ContentWarning = ContentWarning;
