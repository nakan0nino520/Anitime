// js/detail.js - TRANG CHI TIẾT ANIME - PHIÊN BẢN iOS CAO CẤP

const DetailView = (() => {
    let currentAnime = null;
    let sheetEl = null;
    let scrollY = 0;

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
        const cast = (a.characters?.edges || []).slice(0, 8);
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
        const escTitle = (typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(title) : title;

        const html = `
            <!-- BANNER -->
            <div class="detail-banner" style="background-image:url('${banner}')">
                <div class="detail-banner-overlay"></div>
                ${nativeTitle ? `<div class="detail-native-title">${(typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(nativeTitle) : nativeTitle}</div>` : ''}
            </div>

            <!-- HEADER -->
            <div class="detail-header">
                <img class="detail-cover" src="${cover}" alt="${escTitle}" loading="lazy" onerror="this.style.display='none'">
                <div class="detail-title-block">
                    <h1 class="detail-title copyable" data-copy-type="title" data-copy-text="${UI.escapeHtml(title)}">${UI.escapeHtml(title)}</h1>
                    ${sub ? `<p class="detail-subtitle copyable" data-copy-type="subtitle" data-copy-text="${UI.escapeHtml(sub)}">${UI.escapeHtml(sub)}</p>` : ''}
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

            <!-- ACTIONS -->
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

            <!-- PROGRESS -->
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

            <!-- SCORE -->
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

            <!-- THÔNG TIN -->
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

            <!-- STATS -->
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

            <!-- GENRES -->
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

            <!-- SYNOPSIS -->
            ${description ? `
                <div class="detail-section">
                    <h3>Nội dung</h3>
                    <p class="detail-synopsis copyable" id="synopsis" data-original="${UI.escapeHtml(description)}" data-copy-type="synopsis">${(typeof UI !== 'undefined' && UI.escapeHtml) ? UI.escapeHtml(description) : description}</p>
                    <span class="copy-hint">💡 Nhấn giữ để sao chép</span>
                    <button class="btn-read-more" id="btnReadMore">
                        <span>Đọc thêm</span>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>
            ` : ''}

            <!-- TRAILER -->
            ${trailer ? `
                <div class="detail-section">
                    <h3>Trailer chính thức</h3>
                    <div class="trailer-wrap">
                        <iframe src="https://www.youtube.com/embed/${trailer}?rel=0&modestbranding=1" allowfullscreen loading="lazy" title="Trailer"></iframe>
                    </div>
                </div>
            ` : ''}

            <!-- CAST -->
            ${cast.length ? `
                <div class="detail-section">
                    <h3>Diễn viên lồng tiếng</h3>
                    <div class="cast-list">
                        ${cast.map(c => `
                            <div class="cast-item">
                                ${c.node.image?.medium
                                    ? `<img src="${c.node.image.medium}" class="cast-avatar" loading="lazy" alt="" onerror="this.style.visibility='hidden'">`
                                    : `<div class="cast-avatar cast-avatar-empty">👤</div>`
                                }
                                <div class="cast-info">
                                    <div class="cast-name">${UI.escapeHtml(c.node.name.full)}</div>
                                    <div class="cast-role">${UI.escapeHtml(c.role || 'Vai chính')}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- STREAMING -->
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

            <!-- RELATIONS -->
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

            <!-- BOTTOM ACTIONS -->
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

        bindDetailEvents(a);
    }

    // ========== BIND SỰ KIỆN CHI TIẾT ==========
    function bindDetailEvents(a) {
        const sheet = document.getElementById('detailSheet');
        if (!sheet) return;

        // ===== NHẤN GIỮ ĐỂ SAO CHÉP =====
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

    // ========== NHẤN GIỮ ĐỂ SAO CHÉP ==========
    function bindCopyableElements(container) {
        const copyables = container.querySelectorAll('.copyable');
        console.log('[Detail] Bind copyable:', copyables.length);

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
                }, 500);
            };

            const endHold = () => {
                isHolding = false;
                el.classList.remove('holding');
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
            };

            const cancelHold = () => {
                if (!isHolding) return;
                isHolding = false;
                el.classList.remove('holding');
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
            };

            // TOUCH (MOBILE)
            el.addEventListener('touchstart', startHold, { passive: true });
            el.addEventListener('touchend', endHold);
            el.addEventListener('touchcancel', cancelHold);
            el.addEventListener('touchmove', cancelHold, { passive: true });

            // MOUSE (DESKTOP)
            el.addEventListener('mousedown', startHold);
            el.addEventListener('mouseup', endHold);
            el.addEventListener('mouseleave', cancelHold);

            // CLICK PHẢI CHUỘT ĐỂ COPY NHANH
            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                doCopy(el);
            });
        });
    }

    // ========== THỰC HIỆN COPY ==========
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

    return { open, close };
})();

window.DetailView = DetailView;
