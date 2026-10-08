const UI = (() => {
    // TOAST
    let toastTimer = null;
    function toast(msg, duration = 2000) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), duration);
    }

    // LẤY TÊN ANIME THEO NGÔN NGỮ
    function titleOf(media) {
        const s = Store.getSettings();
        const lang = s.titleLang || 'ROMAJI';
        const t = media.title || {};
        if (lang === 'ENGLISH' && t.english) return t.english;
        if (lang === 'NATIVE' && t.native) return t.native;
        return t.romaji || t.english || t.native || 'Unknown';
    }

    // LẤY TÊN PHỤ
    function subtitleOf(media) {
        const s = Store.getSettings();
        const lang = s.titleLang || 'ROMAJI';
        const t = media.title || {};
        if (lang === 'ROMAJI' && t.english) return t.english;
        if (lang === 'ENGLISH' && t.romaji) return t.romaji;
        if (lang === 'NATIVE' && t.romaji) return t.romaji;
        return '';
    }

    // MÀU THEO THỂ LOẠI
    function genreColor(genre) {
        const map = {
            Action: '#ff375f', Adventure: '#ff9f0a', Comedy: '#ffd60a',
            Drama: '#bf5af2', Fantasy: '#5e5ce6', Horror: '#8b0000',
            Mystery: '#5ac8fa', Romance: '#ff2d55', 'Sci-Fi': '#64d2ff',
            'Slice of Life': '#30d158', Sports: '#32ade6', Supernatural: '#af52de',
            Thriller: '#ff453a', Music: '#ff2d55', Mecha: '#5e5ce6'
        };
        return map[genre] || '#0a84ff';
    }

    // RENDER ANIME CARD
    function animeCard(item, opts = {}) {
        const media = item.media || item;
        const airingAt = item.airingAt || null;
        const episode = item.episode || null;
        const status = Store.getStatus(media.id);
        const entry = Store.getList()[media.id];
        const progress = entry?.progress || 0;
        const isAiring = airingAt && Math.abs(Date.now() / 1000 - airingAt) < 1800;

        const title = titleOf(media);
        const cover = media.coverImage?.large || '';
        const score = media.averageScore || '?';
        const eps = media.episodes || '?';
        const format = media.format || '';
        const genres = (media.genres || []).slice(0, 2);

        const time = airingAt ? TZ.formatTime(airingAt) : '';
        const countdown = airingAt ? Countdown.format(airingAt) : '';

        const html = `
            <article class="anime-card ${isAiring ? 'airing' : ''} ${opts.compact ? 'compact' : ''}" data-id="${media.id}">
                ${cover ? `<img class="anime-cover" src="${cover}" loading="lazy" alt="">` : '<div class="anime-cover"></div>'}
                <div class="anime-info">
                    <h3 class="anime-title">${escapeHtml(title)}</h3>
                    <div class="anime-meta">
                        <span class="anime-meta-item">⭐ ${score}</span>
                        <span class="anime-meta-item">📺 ${eps}</span>
                        ${format ? `<span class="anime-meta-item">${format}</span>` : ''}
                    </div>
                    ${genres.length ? `
                        <div class="anime-genres">
                            ${genres.map(g => `<span class="genre-chip" style="background:${genreColor(g)}22;color:${genreColor(g)};border-color:${genreColor(g)}44">${g}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${airingAt ? `
                        <div class="anime-time">
                            <span class="time-icon">🕐</span>
                            <span>${time}</span>
                            ${episode ? `<span class="anime-ep">Tập ${episode}</span>` : ''}
                        </div>
                        <div class="anime-countdown" data-airing="${airingAt}">${countdown}</div>
                    ` : ''}
                    ${progress > 0 ? `<div class="progress-badge">Đã xem ${progress} tập</div>` : ''}
                </div>
                <button class="fav-btn ${status === 'WATCHING' || status === 'PLANNING' ? 'active' : ''}" data-id="${media.id}" aria-label="Yêu thích">
                    <svg viewBox="0 0 24 24" fill="${status === 'WATCHING' || status === 'PLANNING' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </article>
        `;
        return html;
    }

    // ESCAPE HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ĐẾM NGƯỢC - CẬP NHẬT TẤT CẢ
    function tickCountdowns() {
        document.querySelectorAll('[data-airing]').forEach(el => {
            const airing = parseInt(el.dataset.airing);
            el.textContent = Countdown.format(airing);
        });
    }

    // SKELETON LOADING
    function skeleton(count = 4) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="anime-card skeleton">
                    <div class="anime-cover skeleton-box"></div>
                    <div class="anime-info">
                        <div class="skeleton-line wide"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
            `;
        }
        return html;
    }

    // FORMAT NGÀY
    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
    }

    return {
        toast, titleOf, subtitleOf, genreColor, animeCard,
        escapeHtml, tickCountdowns, skeleton, formatDate
    };
})();
