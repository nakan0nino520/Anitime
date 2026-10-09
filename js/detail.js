// js/detail.js - TRANG CHI TIẾT ANIME - PHIÊN BẢN iOS CAO CẤP (ĐÃ TỐI ƯU MƯỢT MÀ & TÍCH HỢP CẢNH BÁO NỘI DUNG)

const DetailView = (() => {
    let currentAnime = null;
    let sheetEl = null;
    let scrollY = 0;

    // ========== BIẾN LƯU TRỮ ==========
    let allCharacters = [];
    let allEpisodes = [];
    let malIdCache = null;

    // ========== MỞ CHI TIẾT ==========
    async function open(id) {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        // LƯU VỊ TRÍ CUỘN HIỆN TẠI
        scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';

        overlay.classList.add('show');
        overlay.innerHTML = `
            <div class="detail-sheet" id="detailSheet">
                <div class="detail-grabber"></div>
                <button class="detail-close" id="detailClose" aria-label="Đóng">✕</button>
                <div class="detail-loading">
                    <div class="spinner"></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        `;

        sheetEl = document.getElementById('detailSheet');
        bindSheetEvents();

        try {
            if (typeof API === 'undefined' || typeof API.getDetail !== 'function') {
                throw new Error("Không tìm thấy hàm API.getDetail trong api.js");
            }
            currentAnime = await API.getDetail(id);
            render(currentAnime);
        } catch (err) {
            console.error('Detail error:', err);
            renderError(err);
        }
    }

    // ========== ĐÓNG CHI TIẾT ==========
    function close() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        overlay.classList.remove('show');

        // KHÔI PHỤC CUỘN
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);

        setTimeout(() => {
            overlay.innerHTML = '';
            currentAnime = null;
            sheetEl = null;
            allCharacters = [];
            allEpisodes = [];
            malIdCache = null;
        }, 400);
    }

    // ========== SỰ KIỆN SHEET ==========
    function bindSheetEvents() {
        const overlay = document.getElementById('modalOverlay');
        const closeBtn = document.getElementById('detailClose');

        if (closeBtn) closeBtn.addEventListener('click', close);

        // CLICK NGOÀI ĐỂ ĐÓNG
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) close();
            });
        }

        // SWIPE XUỐNG ĐỂ ĐÓNG
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        if (sheetEl) {
            sheetEl.addEventListener('touchstart', (e) => {
                if (sheetEl.scrollTop > 5) return;
                startY = e.touches[0].clientY;
                currentY = startY;
                isDragging = true;
            }, { passive: true });

            sheetEl.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                if (diff > 0 && sheetEl.scrollTop <= 5) {
                    sheetEl.style.transition = 'none';
                    sheetEl.style.transform = `translateY(${diff * 0.6}px)`;
                }
            }, { passive: true });

            sheetEl.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                const diff = currentY - startY;
                sheetEl.style.transition = '';
                if (diff > 120) {
                    close();
                } else {
                    sheetEl.style.transform = '';
                }
            });
        }

        // PHÍM ESC ĐỂ ĐÓNG
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                close();
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    // ========== HELPER: FORMAT NGÀY ==========
    function formatDate(d) {
        if (!d || !d.year) return null;
        const day = d.day ? String(d.day).padStart(2, '0') : null;
        const month = d.month ? String(d.month).padStart(2, '0') : null;
        if (day && month) return `${day}/${month}/${d.year}`;
        if (month) return `${month}/${d.year}`;
        return `${d.year}`;
    }

    // ========== HELPER: FORMAT SỐ ==========
    function formatNumber(num) {
        if (!num && num !== 0) return '—';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    // ========== HELPER: LÀM SẠCH HTML ==========
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
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // ========== HELPER: MÀU SCORE ==========
    function scoreColor(score) {
        if (!score) return 'var(--text-3)';
        const s = score / 10;
        if (s >= 8.5) return '#30d158';
        if (s >= 7.5) return '#0a84ff';
        if (s >= 6.5) return '#ff9f0a';
        if (s >= 5) return '#ffd60a';
        return '#ff375f';
    }

    // ========== HELPER: BADGE FORMAT ==========
    function formatIcon(format) {
        const map = {
            'TV': '📺',
            'MOVIE': '🎬',
            'OVA': '💿',
            'ONA': '🌐',
            'SPECIAL': '⭐',
            'TV_SHORT': '📹',
            'MUSIC': '🎵'
        };
        return map[format] || '📺';
    }

    // ========== HELPER: TRẠNG THÁI ==========
    function statusLabel(s) {
        const map = {
            'FINISHED': '✓ Đã kết thúc',
            'RELEASING': '● Đang phát',
            'NOT_YET_RELEASED': '⏳ Sắp ra mắt',
            'CANCELLED': '✕ Đã hủy',
            'HIATUS': '⏸ Tạm hoãn'
        };
        return map[s] || s;
    }

    // ========== RENDER CHÍNH ==========
    function render(a) {
        if (!sheetEl) return;

        const status = typeof Store !== 'undefined' ? Store.getStatus(a.id) : null;
        const entry = typeof Store !== 'undefined' ? Store.getList()[a.id] : null;
        const progress = entry?.progress || 0;
        const userScore = entry?.score || 0;

        const title = (typeof UI !== 'undefined' && UI.titleOf) ? UI.titleOf(a) : (a.title?.romaji || a.title?.english || '');
        const sub = (typeof UI !== 'undefined' && UI.subtitleOf) ? UI.subtitleOf(a) : '';
        const nativeTitle = a.title?.native || '';
        const banner = a.bannerImage || a.coverImage?.extraLarge || a.coverImage?.large;
        const cover = a.coverImage?.extraLarge || a.coverImage?.large;
        const studios = (a.studios?.nodes || []).map(s => s.name).join(', ');
        const staff = (a.staff?.edges || []).slice(0, 6);
        const links = (a.externalLinks || []).filter(l => l.type === 'STREAMING').slice(0, 8);
        const relations = (a.relations?.edges || []).slice(0, 6);
        const recommendations = (a.recommendations?.nodes || []).slice(0, 6);
        const trailer = a.trailer && a.trailer.site === 'youtube' ? a.trailer.id : null;
        const description = cleanHtml(a.description);
        const startDate = formatDate(a.startDate);
        const endDate = formatDate(a.endDate);
        const avgScore = a.averageScore ? (a.averageScore / 10).toFixed(1) : '—';
        const scoreClr = scoreColor(a.averageScore);
        const totalEps = a.episodes || '?';

        // ===== PHÂN TÍCH CẢNH BÁO NỘI DUNG =====
        let warningHTML = '';
        try {
            if (window.ContentWarning && typeof ContentWarning.analyze === 'function') {
                const warnings = ContentWarning.analyze(a);
                warningHTML = ContentWarning.renderBanner(warnings);
            }
        } catch (err) {
            console.warn('[Detail] ContentWarning lỗi:', err);
        }

        const escTitle = (typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(title) : title;
        const escSub = sub ? ((typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(sub) : sub) : '';
        const escDesc = description ? ((typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(description) : description) : '';

        const html = `
            <div class="detail-banner" style="background-image:url('${banner}')">
                <div class="detail-banner-overlay"></div>
                ${nativeTitle ? `<div class="detail-native-title">${(typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(nativeTitle) : nativeTitle}</div>` : ''}
            </div>

            <div class="detail-header">
                <img class="detail-cover" src="${cover}" alt="${escTitle}" loading="lazy" onerror="this.style.display='none'">
                <div class="detail-title-block">
                    <h1 class="detail-title copyable" data-copy-type="title" data-copy-text="${escTitle}">${escTitle}</h1>
                    ${sub ? `<p class="detail-subtitle copyable" data-copy-type="subtitle" data-copy-text="${escSub}">${escSub}</p>` : ''}
                    <div class="detail-badges">
                        <span class="badge badge-score" style="--score-clr:${scoreClr}">
                            <span class="badge-icon">★</span>
                            <span>${avgScore}</span>
                        </span>
                        ${a.format ? `<span class="badge">${formatIcon(a.format)}${a.format}</span>` : ''}
                        ${a.episodes ? `<span class="badge">📺 ${a.episodes} tập</span>` : ''}
                        ${a.duration ? `<span class="badge">⏱ ${a.duration}p</span>` : ''}
                        ${a.status ? `<span class="badge">${statusLabel(a.status)}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="detail-actions">
                <select class="glass-select status-select" id="statusSelect">
                    <option value="">— Thêm vào thư viện —</option>
                    <option value="WATCHING" ${status === 'WATCHING' ? 'selected' : ''}>▶ Đang xem</option>
                    <option value="PLANNING" ${status === 'PLANNING' ? 'selected' : ''}>🕐 Kế hoạch</option>
                    <option value="COMPLETED" ${status === 'COMPLETED' ? 'selected' : ''}>✓ Đã hoàn thành</option>
                    <option value="PAUSED" ${status === 'PAUSED' ? 'selected' : ''}>⏸ Tạm dừng</option>
                    <option value="DROPPED" ${status === 'DROPPED' ? 'selected' : ''}>✕ Đã bỏ</option>
                    <option value="CONSIDERING" ${status === 'CONSIDERING' ? 'selected' : ''}>💭 Cân nhắc</option>
                </select>
            </div>

            ${(status === 'WATCHING' || status === 'PAUSED') ? `
                <div class="detail-card detail-progress">
                    <label class="detail-card-label">📊 Tiến độ xem</label>
                    <div class="progress-counter big" data-id="${a.id}">
                        <button class="prog-btn minus" data-delta="-1" aria-label="Giảm">−</button>
                        <span class="prog-value">
                            <strong>${progress}</strong>
                            <span class="prog-total">/ ${totalEps}</span>
                        </span>
                        <button class="prog-btn plus" data-delta="1" aria-label="Tăng">+</button>
                    </div>
                </div>
            ` : ''}

            <div class="detail-card detail-score">
                <label class="detail-card-label">⭐ Đánh giá của bạn</label>
                <div class="score-display">
                    <span class="score-current">${userScore ? userScore + '/10' : 'Chưa đánh giá'}</span>
                </div>
                <div class="score-stars" data-id="${a.id}">
                    ${[1,2,3,4,5,6,7,8,9,10].map(i => `
                        <button class="star ${i <= userScore ? 'active' : ''}" data-score="${i}" aria-label="Đánh giá ${i}">★</button>
                    `).join('')}
                </div>
            </div>

            ${warningHTML}

            <div class="detail-section">
                <h3>Thông tin</h3>
                <div class="detail-info-grid">
                    ${a.format ? `<div class="info-item"><span class="info-icon">🎬</span><div class="info-content"><span class="info-label">Định dạng</span><span class="info-value">${a.format}</span></div></div>` : ''}
                    ${a.episodes ? `<div class="info-item"><span class="info-icon">📺</span><div class="info-content"><span class="info-label">Số tập</span><span class="info-value">${a.episodes} tập</span></div></div>` : ''}
                    ${a.duration ? `<div class="info-item"><span class="info-icon">⏱</span><div class="info-content"><span class="info-label">Thời lượng</span><span class="info-value">${a.duration} phút/tập</span></div></div>` : ''}
                    ${a.status ? `<div class="info-item"><span class="info-icon">📡</span><div class="info-content"><span class="info-label">Trạng thái</span><span class="info-value">${statusLabel(a.status)}</span></div></div>` : ''}
                    ${(a.season && a.seasonYear) ? `<div class="info-item"><span class="info-icon">🗓</span><div class="info-content"><span class="info-label">Mùa</span><span class="info-value">${a.season}${a.seasonYear}</span></div></div>` : ''}
                    ${a.source ? `<div class="info-item"><span class="info-icon">📖</span><div class="info-content"><span class="info-label">Nguồn</span><span class="info-value">${a.source}</span></div></div>` : ''}
                    ${studios ? `<div class="info-item"><span class="info-icon">🏢</span><div class="info-content"><span class="info-label">Studio</span><span class="info-value">${UI.escapeHtml(studios)}</span></div></div>` : ''}
                    ${startDate ? `<div class="info-item"><span class="info-icon">📅</span><div class="info-content"><span class="info-label">Khởi chiếu</span><span class="info-value">${startDate}</span></div></div>` : ''}
                    ${endDate ? `<div class="info-item"><span class="info-icon">🏁</span><div class="info-content"><span class="info-label">Kết thúc</span><span class="info-value">${endDate}</span></div></div>` : ''}
                </div>
            </div>

            <div class="detail-section">
                <h3>Thống kê</h3>
                <div class="detail-stats">
                    <div class="stat-card">
                        <div class="stat-value" style="color:${scoreClr}">${avgScore}</div>
                        <div class="stat-label">Điểm TB</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${formatNumber(a.popularity)}</div>
                        <div class="stat-label">Phổ biến</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${formatNumber(a.favourites)}</div>
                        <div class="stat-label">Yêu thích</div>
                    </div>
                </div>
            </div>

            ${(a.genres && a.genres.length) ? `
                <div class="detail-section">
                    <h3>Thể loại</h3>
                    <div class="detail-genres">
                        ${a.genres.map(g => {
                            const clr = (typeof UI !== 'undefined' && UI.genreColor) ? UI.genreColor(g) : '#0a84ff';
                            return `<span class="genre-chip" style="background:${clr}22;color:${clr};border-color:${clr}44">${(typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(g) : g}</span>`;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            ${description ? `
                <div class="detail-section">
                    <h3>Nội dung</h3>
                    <p class="detail-synopsis copyable" id="synopsis" data-original="${escDesc}" data-copy-type="synopsis">${escDesc}</p>
                    <button class="btn-read-more" id="btnReadMore">
                        <span>Đọc thêm</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>
            ` : ''}

            ${trailer ? `
                <div class="detail-section">
                    <h3>Trailer chính thức</h3>
                    <div class="trailer-wrap">
                        <iframe src="https://www.youtube.com/embed/${trailer}?rel=0&modestbranding=1" allowfullscreen loading="lazy" title="Trailer"></iframe>
                    </div>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3>
                    Nhân vật
                    <button class="btn-view-characters" id="btnViewCharacters">
                        🎭 Xem tất cả
                    </button>
                </h3>
                <div class="characters-count" id="charactersCount">
                    <span class="loading-count">Đang tải...</span>
                </div>
                <div class="characters-preview" id="charactersPreview">
                    <div class="loading-small"><div class="spinner-small"></div></div>
                </div>
            </div>

            <div class="detail-section">
                <h3>
                    Danh sách tập
                    <button class="btn-view-characters" id="btnViewEpisodes">
                        📺 Xem tất cả
                    </button>
                </h3>
                <div class="episodes-preview" id="episodesPreview">
                    <div class="loading-small"><div class="spinner-small"></div></div>
                </div>
            </div>

            ${links.length ? `
                <div class="detail-section">
                    <h3>Xem bản quyền</h3>
                    <div class="streaming-links">
                        ${links.map(l => `
                            <a href="${l.url}" target="_blank" rel="noopener" class="stream-link">
                                <span class="stream-icon">▶</span>
                                <span>${UI.escapeHtml(l.site)}</span>
                            </a>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${relations.length ? `
                <div class="detail-section">
                    <h3>Phần liên quan</h3>
                    <div class="relation-scroll">
                        ${relations.map(r => `
                            <div class="relation-card" data-id="${r.node.id}">
                                <img src="${r.node.coverImage?.large || ''}" alt="" loading="lazy" onerror="this.style.background='#2a2a2a'">
                                <span>${UI.escapeHtml(r.node.title?.romaji || 'N/A')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="detail-section detail-bottom-actions">
                ${a.siteUrl ? `
                    <a href="${a.siteUrl}" target="_blank" rel="noopener" class="bottom-action-btn">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Xem trên AniList
                    </a>
                ` : ''}
                <button class="bottom-action-btn" id="btnShare">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    Chia sẻ
                </button>
            </div>
        `;

        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'detail-content';
        contentWrapper.innerHTML = html;

        const loading = sheetEl.querySelector('.detail-loading');
        if (loading) loading.remove();
        sheetEl.appendChild(contentWrapper);

        // CHÈN MODAL NHÂN VẬT
        const charModal = document.createElement('div');
        charModal.className = 'sub-modal';
        charModal.id = 'charactersModal';
        charModal.innerHTML = `
            <div class="sub-modal-header">
                <button class="sub-modal-close" id="charactersModalClose">✕</button>
                <div class="sub-modal-title">Nhân vật</div>
                <div style="width:36px"></div>
            </div>
            <div class="sub-modal-body" id="charactersModalBody"></div>
        `;
        sheetEl.appendChild(charModal);

        // CHÈN MODAL TẬP PHIM
        const epModal = document.createElement('div');
        epModal.className = 'sub-modal';
        epModal.id = 'episodesModal';
        epModal.innerHTML = `
            <div class="sub-modal-header">
                <button class="sub-modal-close" id="episodesModalClose">✕</button>
                <div class="sub-modal-title">Danh sách tập</div>
                <div style="width:36px"></div>
            </div>
            <div class="sub-modal-body" id="episodesModalBody"></div>
        `;
        sheetEl.appendChild(epModal);

        bindDetailEvents(a);
    }

    // ========== BIND SỰ KIỆN CHI TIẾT ==========
    function bindDetailEvents(a) {
        const sheet = document.getElementById('detailSheet');
        if (!sheet) return;

        // KÍCH HOẠT NHẤN GIỮ ĐỂ SAO CHÉP ĐÃ TỐI ƯU
        bindCopyableElements(sheet);

        const btnReadMore = sheet.querySelector('#btnReadMore');
        if (btnReadMore) {
            btnReadMore.addEventListener('click', () => {
                const syn = sheet.querySelector('#synopsis');
                if (!syn) return;
                syn.classList.toggle('expanded');
                const span = btnReadMore.querySelector('span');
                if (span) span.textContent = syn.classList.contains('expanded') ? 'Thu gọn' : 'Đọc thêm';
                const svg = btnReadMore.querySelector('svg');
                if (svg) svg.style.transform = syn.classList.contains('expanded') ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }

        const statusSel = sheet.querySelector('#statusSelect');
        if (statusSel) {
            statusSel.addEventListener('change', () => {
                const val = statusSel.value || null;
                if (typeof Store !== 'undefined') {
                    Store.setStatus(a.id, val, {
                        id: a.id,
                        title: a.title,
                        coverImage: a.coverImage,
                        episodes: a.episodes,
                        format: a.format
                    });
                }
                if (typeof UI !== 'undefined') UI.toast(val ? '✓ Đã thêm vào thư viện' : '✓ Đã xóa khỏi thư viện');
                setTimeout(() => open(a.id), 200);
            });
        }

        sheet.querySelectorAll('.prog-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const delta = parseInt(btn.dataset.delta);
                if (typeof Store !== 'undefined') {
                    const updated = Store.updateProgress(a.id, delta);
                    if (updated) {
                        const el = sheet.querySelector('.prog-value strong');
                        if (el) el.textContent = updated.progress;
                        if (typeof UI !== 'undefined') UI.toast(delta > 0 ? `+1 tập (${updated.progress})` : `-1 tập (${updated.progress})`);
                    }
                }
            });
        });

        sheet.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                const score = parseInt(star.dataset.score);
                if (typeof Store !== 'undefined') Store.setScore(a.id, score);
                sheet.querySelectorAll('.star').forEach(s => {
                    s.classList.toggle('active', parseInt(s.dataset.score) <= score);
                });
                const display = sheet.querySelector('.score-current');
                if (display) display.textContent = score + '/10';
                if (typeof UI !== 'undefined') UI.toast(`⭐ Đã chấm ${score}/10`);
            });
        });

        sheet.querySelectorAll('.relation-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                if (!id) return;
                close();
                setTimeout(() => open(id), 450);
            });
        });

        // ===== LOAD NHÂN VẬT =====
        loadCharacters(a.id, a.idMal);

        // ===== LOAD TẬP PHIM =====
        loadEpisodes(a.idMal || a.id, a.id);

        // ===== BIND NÚT XEM TẤT CẢ NHÂN VẬT =====
        const btnViewCharacters = sheet.querySelector('#btnViewCharacters');
        if (btnViewCharacters) {
            btnViewCharacters.addEventListener('click', () => {
                openCharactersModal();
            });
        }

        // ===== BIND NÚT XEM TẤT CẢ TẬP =====
        const btnViewEpisodes = sheet.querySelector('#btnViewEpisodes');
        if (btnViewEpisodes) {
            btnViewEpisodes.addEventListener('click', () => {
                openEpisodesModal();
            });
        }

        // ===== BIND ĐÓNG MODAL NHÂN VẬT =====
        const charModalClose = sheet.querySelector('#charactersModalClose');
        if (charModalClose) {
            charModalClose.addEventListener('click', () => {
                closeSubModal('charactersModal');
            });
        }

        // ===== BIND ĐÓNG MODAL TẬP =====
        const epModalClose = sheet.querySelector('#episodesModalClose');
        if (epModalClose) {
            epModalClose.addEventListener('click', () => {
                closeSubModal('episodesModal');
            });
        }

        // ===== BIND CẢNH BÁO NỘI DUNG =====
        if (window.ContentWarning && typeof ContentWarning.bindBannerEvents === 'function') {
            ContentWarning.bindBannerEvents(sheet);
        }

        const btnShare = sheet.querySelector('#btnShare');
        if (btnShare) {
            btnShare.addEventListener('click', async () => {
                const shareData = {
                    title: a.title?.romaji || 'AniTime',
                    text: 'Xem anime trên AniTime',
                    url: a.siteUrl || location.href
                };
                try {
                    if (navigator.share) {
                        await navigator.share(shareData);
                    } else {
                        await navigator.clipboard.writeText(shareData.url);
                        if (typeof UI !== 'undefined') UI.toast('✓ Đã copy link');
                    }
                } catch (err) {
                    if (err.name !== 'AbortError' && typeof UI !== 'undefined') UI.toast('Không thể chia sẻ');
                }
            });
        }
    }

    // ========== RENDER LỖI ==========
    function renderError(err) {
        if (!sheetEl) return;
        sheetEl.innerHTML = `
            <div class="detail-grabber"></div>
            <button class="detail-close" id="detailClose">✕</button>
            <div class="detail-error">
                <div class="detail-error-icon">⚠</div>
                <h3>Không thể tải</h3>
                <p>${(typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(err.message || 'Lỗi không xác định') : 'Lỗi không xác định'}</p>
                <button class="detail-retry" onclick="location.reload()">Thử lại</button>
            </div>
        `;
        const closeBtn = document.getElementById('detailClose');
        if (closeBtn) closeBtn.addEventListener('click', close);
    }

    // ========== HÀM HỖ TRỢ: NHẤN GIỮ ĐỂ SAO CHÉP (TỐI ƯU KHÔNG LAG) ==========
    function bindCopyableElements(container) {
        const copyables = container.querySelectorAll('.copyable');
        copyables.forEach(el => {
            let holdTimer = null;
            let isHolding = false;

            const startHold = (e) => {
                if (e.target.closest('button') || e.target.closest('a')) return;
                isHolding = true;
                el.classList.add('holding');
                if (navigator.vibrate) navigator.vibrate(10);

                holdTimer = setTimeout(() => {
                    if (!isHolding) return;
                    doCopy(el);
                    endHold();
                }, 500);
            };

            const endHold = () => {
                if (!isHolding) return;
                isHolding = false;
                el.classList.remove('holding');
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
            };

            el.addEventListener('touchstart', startHold, { passive: true });
            el.addEventListener('touchend', endHold, { passive: true });
            el.addEventListener('touchcancel', endHold, { passive: true });

            el.addEventListener('mousedown', startHold);
            el.addEventListener('mouseup', endHold);
            el.addEventListener('mouseleave', endHold);

            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                doCopy(el);
            });
        });
    }

    async function doCopy(el) {
        const type = el.dataset.copyType || 'text';
        let text = '';

        if (type === 'synopsis') {
            text = el.dataset.original || el.textContent;
        } else {
            text = el.dataset.copyText || el.textContent;
        }

        text = text.trim();
        if (!text) {
            if (typeof UI !== 'undefined') UI.toast('⚠ Không có nội dung để sao chép');
            return;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.top = '-9999px';
                textarea.style.left = '-9999px';
                textarea.setAttribute('readonly', '');
                document.body.appendChild(textarea);
                textarea.select();
                textarea.setSelectionRange(0, text.length);
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            const label = {
                title: 'tên anime',
                subtitle: 'tên phụ',
                synopsis: 'mô tả'
            }[type] || 'văn bản';

            if (typeof UI !== 'undefined') UI.toast('✓ Đã sao chép ' + label);
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

            el.classList.add('copied');
            setTimeout(() => el.classList.remove('copied'), 600);

        } catch (err) {
            console.error('[Detail] Copy lỗi:', err);
            if (typeof UI !== 'undefined') UI.toast('⚠ Không thể sao chép');
        }
    }

    // ========== LOAD NHÂN VẬT ==========
    async function loadCharacters(anilistId, malId) {
        const preview = sheetEl?.querySelector('#charactersPreview');
        const count = sheetEl?.querySelector('#charactersCount');
        if (!preview) return;

        try {
            const chars = await API.getCharacters(anilistId);
            allCharacters = chars;

            if (!chars.length) {
                preview.innerHTML = '<div class="empty-small">Không có thông tin nhân vật</div>';
                if (count) count.innerHTML = '';
                return;
            }

            // ĐẾM THEO VAI TRÒ
            const mainCount = chars.filter(c => c.role === 'MAIN').length;
            const supportCount = chars.filter(c => c.role === 'SUPPORTING').length;
            const backgroundCount = chars.filter(c => c.role === 'BACKGROUND').length;

            if (count) {
                count.innerHTML = `
                    <div class="char-count-badges">
                        <span class="char-count-badge main">⭐ ${mainCount} chính</span>
                        <span class="char-count-badge support">👥 ${supportCount} phụ</span>
                        ${backgroundCount > 0 ? `<span class="char-count-badge background">📌 ${backgroundCount} nền</span>` : ''}
                        <span class="char-count-total">Tổng: ${chars.length}</span>
                    </div>
                `;
            }

            // HIỂN THỊ 6 NHÂN VẬT CHÍNH ĐẦU TIÊN
            const previews = chars.slice(0, 6);
            preview.innerHTML = previews.map(c => `
                <div class="char-preview-item" data-char-id="${c.id}">
                    <img src="${c.image}" alt="${UI.escapeHtml(c.name)}" loading="lazy">
                    <div class="char-preview-name">${UI.escapeHtml(c.name)}</div>
                    <div class="char-preview-role role-${c.role.toLowerCase()}">${roleLabel(c.role)}</div>
                </div>
            `).join('');

            // BIND CLICK
            preview.querySelectorAll('.char-preview-item').forEach(el => {
                el.addEventListener('click', () => {
                    const id = parseInt(el.dataset.charId);
                    const char = allCharacters.find(c => c.id === id);
                    if (char) showCharacterDetail(char);
                });
            });

        } catch (err) {
            console.error('[Detail] loadCharacters:', err);
            preview.innerHTML = '<div class="empty-small">Lỗi tải nhân vật</div>';
            if (count) count.innerHTML = '';
        }
    }

    // ========== MỞ MODAL NHÂN VẬT ==========
    function openCharactersModal() {
        const modal = sheetEl?.querySelector('#charactersModal');
        const body = sheetEl?.querySelector('#charactersModalBody');
        if (!modal || !body) return;

        if (!allCharacters.length) {
            body.innerHTML = '<div class="empty-small">Chưa có dữ liệu nhân vật</div>';
            modal.classList.add('show');
            setTimeout(() => { body.scrollTop = 0; }, 20);
            return;
        }

        // NHÓM THEO VAI TRÒ
        const main = allCharacters.filter(c => c.role === 'MAIN');
        const support = allCharacters.filter(c => c.role === 'SUPPORTING');
        const background = allCharacters.filter(c => c.role === 'BACKGROUND');

        body.innerHTML = `
            ${main.length ? `
                <div class="char-group">
                    <div class="char-group-title">⭐ Nhân vật chính (${main.length})</div>
                    <div class="char-grid">
                        ${main.map(c => renderCharCard(c)).join('')}
                    </div>
                </div>
            ` : ''}

            ${support.length ? `
                <div class="char-group">
                    <div class="char-group-title">👥 Nhân vật phụ (${support.length})</div>
                    <div class="char-grid">
                        ${support.map(c => renderCharCard(c)).join('')}
                    </div>
                </div>
            ` : ''}

            ${background.length ? `
                <div class="char-group">
                    <div class="char-group-title">📌 Nhân vật nền (${background.length})</div>
                    <div class="char-grid">
                        ${background.map(c => renderCharCard(c)).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // BIND CLICK
        body.querySelectorAll('.char-card').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.charId);
                const char = allCharacters.find(c => c.id === id);
                if (char) showCharacterDetail(char);
            });
        });

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            body.scrollTop = 0;
        }, 20);
    }

    // ========== RENDER 1 CHAR CARD ==========
    function renderCharCard(c) {
        return `
            <div class="char-card" data-char-id="${c.id}">
                <img src="${c.image}" alt="${UI.escapeHtml(c.name)}" loading="lazy">
                <div class="char-card-name">${UI.escapeHtml(c.name)}</div>
                ${c.voiceActor ? `<div class="char-card-va">${UI.escapeHtml(c.voiceActor.name)}</div>` : ''}
            </div>
        `;
    }

    // ========== HIỂN THỊ CHI TIẾT NHÂN VẬT ==========
    function showCharacterDetail(char) {
        const body = sheetEl?.querySelector('#charactersModalBody');
        if (!body) return;

        body.innerHTML = `
            <button class="back-btn" id="backToChars">‹ Quay lại</button>
            <div class="char-detail">
                <div class="char-detail-header">
                    <img src="${char.image}" class="char-detail-avatar" alt="">
                    <div class="char-detail-info">
                        <h3>${UI.escapeHtml(char.name)}</h3>
                        ${char.nativeName ? `<p class="char-detail-native">${UI.escapeHtml(char.nativeName)}</p>` : ''}
                        <div class="char-detail-role role-${char.role.toLowerCase()}">${roleLabel(char.role)}</div>
                        <div class="char-detail-meta">
                            ${char.gender ? `<span>⚧ ${char.gender}</span>` : ''}
                            ${char.age ? `<span>🎂 ${char.age}</span>` : ''}
                            ${char.favourites ? `<span>❤ ${char.favourites.toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                </div>

                ${char.voiceActor ? `
                    <div class="char-detail-va">
                        <div class="char-detail-va-label">🎤 Diễn viên lồng tiếng</div>
                        <div class="char-detail-va-info">
                            ${char.voiceActor.image ? `<img src="${char.voiceActor.image}" alt="">` : ''}
                            <span>${UI.escapeHtml(char.voiceActor.name)}</span>
                        </div>
                    </div>
                ` : ''}

                ${char.description ? `
                    <div class="char-detail-desc">
                        <div class="char-detail-desc-label">📖 Tiểu sử</div>
                        <p>${UI.escapeHtml(cleanHtml(char.description))}</p>
                    </div>
                ` : ''}
            </div>
        `;

        setTimeout(() => { body.scrollTop = 0; }, 10);

        document.getElementById('backToChars').addEventListener('click', () => {
            openCharactersModal();
        });
    }

    // ========== HELPER: NHÃN VAI TRÒ ==========
    function roleLabel(role) {
        const map = {
            'MAIN': 'Nhân vật chính',
            'SUPPORTING': 'Nhân vật phụ',
            'BACKGROUND': 'Nhân vật nền'
        };
        return map[role] || role;
    }

    // ========== LOAD TẬP PHIM ==========
    async function loadEpisodes(malId, anilistId) {
        const preview = sheetEl?.querySelector('#episodesPreview');
        if (!preview) return;

        try {
            if (!malId && anilistId) {
                malId = await API.getMalIdFromAnilist(anilistId);
            }

            if (!malId) {
                preview.innerHTML = '<div class="empty-small">Không có dữ liệu tập</div>';
                return;
            }

            malIdCache = malId;
            const eps = await API.getEpisodes(malId);
            allEpisodes = eps;

            if (!eps.length) {
                preview.innerHTML = '<div class="empty-small">Chưa có thông tin tập</div>';
                return;
            }

            const previews = eps.slice(0, 5);
            preview.innerHTML = `
                <div class="episode-list">
                    ${previews.map(ep => renderEpisodeItem(ep)).join('')}
                </div>
                ${eps.length > 5 ? `
                    <div class="episode-more">+ ${eps.length - 5} tập khác</div>
                ` : ''}
            `;

            bindEpisodeItems(preview);

        } catch (err) {
            console.error('[Detail] loadEpisodes:', err);
            preview.innerHTML = '<div class="empty-small">Lỗi tải tập</div>';
        }
    }

    // ========== RENDER 1 EPISODE ITEM ==========
    function renderEpisodeItem(ep) {
        return `
            <div class="episode-item" data-ep="${ep.malId}">
                <div class="episode-number">${ep.malId}</div>
                <div class="episode-info">
                    <div class="episode-title">${UI.escapeHtml(ep.title || `Tập ${ep.malId}`)}</div>
                    <div class="episode-meta">
                        ${ep.aired ? `📅 ${formatAiredDate(ep.aired)}` : ''}
                        ${ep.filler ? '<span class="ep-badge filler">Filler</span>' : ''}
                        ${ep.recap ? '<span class="ep-badge recap">Recap</span>' : ''}
                    </div>
                </div>
                <div class="episode-chevron">›</div>
            </div>
        `;
    }

    // ========== BIND EPISODE ITEMS ==========
    function bindEpisodeItems(container) {
        container.querySelectorAll('.episode-item').forEach(el => {
            el.addEventListener('click', () => {
                const epNum = parseInt(el.dataset.ep);
                const ep = allEpisodes.find(e => e.malId === epNum);
                if (ep) showEpisodeDetail(ep);
            });
        });
    }

    // ========== MỞ MODAL TẬP PHIM ==========
    function openEpisodesModal() {
        const modal = sheetEl?.querySelector('#episodesModal');
        const body = sheetEl?.querySelector('#episodesModalBody');
        if (!modal || !body) return;

        if (!allEpisodes.length) {
            body.innerHTML = '<div class="empty-small">Chưa có dữ liệu tập</div>';
            modal.classList.add('show');
            setTimeout(() => { body.scrollTop = 0; }, 20);
            return;
        }

        body.innerHTML = `
            <div class="episode-list">
                ${allEpisodes.map(ep => renderEpisodeItem(ep)).join('')}
            </div>
        `;

        bindEpisodeItems(body);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            body.scrollTop = 0;
        }, 20);
    }

    // ========== HIỂN THỊ CHI TIẾT TẬP + SPOILER ==========
    async function showEpisodeDetail(ep) {
        const body = sheetEl?.querySelector('#episodesModalBody');
        if (!body) return;

        body.innerHTML = `
            <button class="back-btn" id="backToEps">‹ Quay lại</button>
            <div class="episode-detail">
                <h3 class="episode-detail-title">Tập ${ep.malId}</h3>
                <div class="episode-detail-sub">${UI.escapeHtml(ep.title || 'Không có tiêu đề')}</div>

                <div class="episode-detail-meta">
                    ${ep.aired ? `<span>📅 ${formatAiredDate(ep.aired)}</span>` : ''}
                    ${ep.filler ? '<span class="ep-badge filler">Filler</span>' : ''}
                    ${ep.recap ? '<span class="ep-badge recap">Recap</span>' : ''}
                </div>

                <div class="episode-spoiler-box" id="spoilerBox">
                    <div class="spoiler-warning">
                        <div class="spoiler-icon">⚠️</div>
                        <div class="spoiler-title">Cảnh báo tiết lộ nội dung</div>
                        <div class="spoiler-desc">Phần tóm tắt có thể tiết lộ tình tiết quan trọng</div>
                        <button class="spoiler-btn" id="spoilerConfirm">
                            👁 Xác nhận xem tóm tắt
                        </button>
                    </div>
                </div>

                <div class="episode-summary hidden" id="episodeSummary">
                    <div class="episode-summary-label">📖 Tóm tắt</div>
                    <div class="episode-summary-loading" id="summaryLoading">
                        <div class="spinner-small"></div>
                    </div>
                    <p class="episode-summary-text" id="summaryText" style="display:none"></p>
                </div>
            </div>
        `;

        setTimeout(() => { body.scrollTop = 0; }, 10);

        document.getElementById('backToEps').addEventListener('click', () => {
            openEpisodesModal();
        });

        document.getElementById('spoilerConfirm').addEventListener('click', async () => {
            const spoilerBox = document.getElementById('spoilerBox');
            const summary = document.getElementById('episodeSummary');
            const loading = document.getElementById('summaryLoading');
            const text = document.getElementById('summaryText');

            spoilerBox.style.display = 'none';
            summary.classList.remove('hidden');

            try {
                const detail = await API.getEpisodeDetail(malIdCache, ep.malId);
                loading.style.display = 'none';
                text.style.display = 'block';

                if (detail && detail.synopsis) {
                    text.textContent = detail.synopsis;
                } else {
                    text.textContent = 'Không có tóm tắt cho tập này.';
                    text.style.color = 'var(--text-3)';
                    text.style.fontStyle = 'italic';
                }
            } catch (err) {
                loading.style.display = 'none';
                text.style.display = 'block';
                text.textContent = 'Không thể tải tóm tắt.';
                text.style.color = 'var(--text-3)';
            }
        });
    }

    // ========== ĐÓNG SUB MODAL ==========
    function closeSubModal(modalId) {
        const modal = sheetEl?.querySelector('#' + modalId);
        if (modal) modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // ========== FORMAT NGÀY ==========
    function formatAiredDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    }

    return { open, close };
})();

window.DetailView = DetailView;
