const DetailView = (() => {
    async function open(id) {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;
        overlay.classList.add('show');
        overlay.innerHTML = `
            <div class="detail-sheet">
                <button class="detail-close" id="detailClose">✕</button>
                <div class="loading"><div class="spinner"></div></div>
            </div>
        `;
        document.getElementById('detailClose').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        try {
            const anime = await API.getDetail(id);
            renderDetail(anime);
        } catch (err) {
            overlay.querySelector('.detail-sheet').innerHTML = `<p style="padding:40px;text-align:center">Lỗi tải chi tiết</p>`;
        }
    }

    function close() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;
        overlay.classList.remove('show');
        overlay.innerHTML = '';
    }

    function renderDetail(a) {
        const overlay = document.getElementById('modalOverlay');
        const sheet = overlay.querySelector('.detail-sheet');
        const title = UI.titleOf(a);
        const sub = UI.subtitleOf(a);
        const status = Store.getStatus(a.id);
        const entry = Store.getList()[a.id];
        const progress = entry?.progress || 0;
        const userScore = entry?.score || 0;

        const banner = a.bannerImage || a.coverImage?.extraLarge || a.coverImage?.large;
        const cover = a.coverImage?.extraLarge || a.coverImage?.large;

        const studios = (a.studios?.nodes || []).map(s => s.name).join(', ');
        const staff = (a.staff?.edges || []).slice(0, 3).map(s => `${s.node.name.full} (${s.role})`).join('<br>');
        const cast = (a.characters?.edges || []).slice(0, 4).map(c => `${c.node.name.full} - ${c.role}`).join('<br>');

        const links = (a.externalLinks || []).filter(l => l.type === 'STREAMING').slice(0, 5);
        const trailer = a.trailer && a.trailer.site === 'youtube' ? a.trailer.id : null;

        const description = (a.description || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');

        sheet.innerHTML = `
            <button class="detail-close" id="detailClose">✕</button>
            <div class="detail-banner" style="background-image:url('${banner}')">
                <div class="detail-banner-overlay"></div>
            </div>
            <div class="detail-header">
                <img class="detail-cover" src="${cover}" alt="">
                <div class="detail-title-block">
                    <h2 class="detail-title">${UI.escapeHtml(title)}</h2>
                    ${sub ? `<p class="detail-subtitle">${UI.escapeHtml(sub)}</p>` : ''}
                    <div class="detail-badges">
                        <span class="badge">⭐ ${a.averageScore || '?'}</span>
                        <span class="badge">📺 ${a.episodes || '?'} tập</span>
                        ${a.format ? `<span class="badge">${a.format}</span>` : ''}
                        ${a.seasonYear ? `<span class="badge">${a.season} ${a.seasonYear}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="detail-actions">
                <select class="glass-select status-select" id="statusSelect">
                    <option value="">— Chọn trạng thái —</option>
                    <option value="WATCHING" ${status === 'WATCHING' ? 'selected' : ''}>Đang xem</option>
                    <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>Đã hoàn thành</option>
                    <option value="PLANNING" ${status === 'PLANNING' ? 'selected' : ''}>Kế hoạch xem</option>
                    <option value="CONSIDERING" ${status === 'CONSIDERING' ? 'selected' : ''}>Cân nhắc</option>
                    <option value="PAUSED" ${status === 'PAUSED' ? 'selected' : ''}>Tạm dừng</option>
                    <option value="DROPPED" ${status === 'DROPPED' ? 'selected' : ''}>Đã bỏ</option>
                </select>
            </div>

            ${status === 'WATCHING' || status === 'PAUSED' ? `
                <div class="detail-progress">
                    <label>Tiến độ xem</label>
                    <div class="progress-counter big" data-id="${a.id}">
                        <button class="prog-btn minus" data-delta="-1">−</button>
                        <span class="prog-value">${progress}</span>
                        <button class="prog-btn plus" data-delta="1">+</button>
                    </div>
                </div>
            ` : ''}

            <div class="detail-score">
                <label>Đánh giá của bạn</label>
                <div class="score-stars" data-id="${a.id}">
                    ${[1,2,3,4,5,6,7,8,9,10].map(i => `<button class="star ${i <= userScore ? 'active' : ''}" data-score="${i}">★</button>`).join('')}
                </div>
            </div>

            ${description ? `
                <div class="detail-section">
                    <h3>Nội dung</h3>
                    <p class="detail-synopsis">${UI.escapeHtml(description)}</p>
                </div>
            ` : ''}

            ${(a.genres && a.genres.length) ? `
                <div class="detail-section">
                    <h3>Thể loại</h3>
                    <div class="detail-genres">
                        ${a.genres.map(g => `<span class="genre-chip" style="background:${UI.genreColor(g)}22;color:${UI.genreColor(g)};border-color:${UI.genreColor(g)}44">${g}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${studios ? `
                <div class="detail-section">
                    <h3>Studio</h3>
                    <p>${UI.escapeHtml(studios)}</p>
                </div>
            ` : ''}

            ${trailer ? `
                <div class="detail-section">
                    <h3>Trailer</h3>
                    <div class="trailer-wrap">
                        <iframe src="https://www.youtube.com/embed/${trailer}" allowfullscreen loading="lazy"></iframe>
                    </div>
                </div>
            ` : ''}

            ${cast ? `
                <div class="detail-section">
                    <h3>Diễn viên lồng tiếng</h3>
                    <p>${cast}</p>
                </div>
            ` : ''}

            ${staff ? `
                <div class="detail-section">
                    <h3>Đội ngũ sản xuất</h3>
                    <p>${staff}</p>
                </div>
            ` : ''}

            ${links.length ? `
                <div class="detail-section">
                    <h3>Xem bản quyền</h3>
                    <div class="streaming-links">
                        ${links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="stream-link">${l.site}</a>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${a.siteUrl ? `
                <div class="detail-section">
                    <a href="${a.siteUrl}" target="_blank" rel="noopener" class="glass-btn wide">Xem trên AniList</a>
                </div>
            ` : ''}
        `;

        // BIND
        document.getElementById('detailClose').addEventListener('click', close);
        const statusSel = document.getElementById('statusSelect');
        statusSel.addEventListener('change', () => {
            Store.setStatus(a.id, statusSel.value || null, {
                id: a.id,
                title: a.title,
                coverImage: a.coverImage,
                episodes: a.episodes,
                format: a.format,
                averageScore: a.averageScore,
                season: a.season,
                seasonYear: a.seasonYear
            });
            UI.toast(statusSel.value ? 'Đã cập nhật trạng thái' : 'Đã xóa');
            setTimeout(() => open(a.id), 200);
        });

        sheet.querySelectorAll('.prog-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const delta = parseInt(btn.dataset.delta);
                const updated = Store.updateProgress(a.id, delta);
                if (updated) {
                    sheet.querySelector('.prog-value').textContent = updated.progress;
                    UI.toast(delta > 0 ? '+1 tập' : '-1 tập');
                }
            });
        });

        sheet.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                const score = parseInt(star.dataset.score);
                Store.setScore(a.id, score);
                sheet.querySelectorAll('.star').forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.score) <= score);
                });
                UI.toast('Đã chấm ' + score + '/10');
            });
        });
    }

    return { open, close };
})();
