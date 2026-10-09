const TraceMoe = (() => {
    const API_URL = 'https://api.trace.moe/search';
    let initialized = false;

    // ========== KHỞI TẠO ==========
    function init() {
        if (initialized) return;
        initialized = true;
        console.log('[TraceMoe] init');

        const btnOpen = document.getElementById('btnTraceMoe');
        const modal = document.getElementById('traceModal');
        if (!btnOpen || !modal) {
            console.warn('[TraceMoe] Không tìm thấy element');
            return;
        }

        // NÚT MỞ
        btnOpen.addEventListener('click', open);

        // NÚT ĐÓNG
        const closeBtn = document.getElementById('traceModalClose');
        if (closeBtn) closeBtn.addEventListener('click', close);

        // CLICK NGOÀI ĐỂ ĐÓNG
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        // UPLOAD FILE
        const fileInput = document.getElementById('traceFileInput');
        const uploadBtn = document.getElementById('traceUploadBtn');
        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) handleFile(file);
            });
        }

        // KÉO THẢ
        const dropZone = document.getElementById('traceDropZone');
        if (dropZone) {
            ['dragenter', 'dragover'].forEach(evt => {
                dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('dragover');
                });
            });
            ['dragleave', 'drop'].forEach(evt => {
                dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('dragover');
                });
            });
            dropZone.addEventListener('drop', (e) => {
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    handleFile(file);
                }
            });
        }

        // PASTE URL
        const urlBtn = document.getElementById('traceUrlBtn');
        const urlInput = document.getElementById('traceUrlInput');
        if (urlBtn && urlInput) {
            urlBtn.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (url) {
                    searchByUrl(url);
                } else {
                    UI.toast('⚠ Nhập URL ảnh trước');
                }
            });
        }
    }

    // ========== MỞ MODAL ==========
    function open() {
        const modal = document.getElementById('traceModal');
        if (!modal) return;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        // RESET
        const result = document.getElementById('traceResult');
        if (result) result.innerHTML = '';

        const fileInput = document.getElementById('traceFileInput');
        if (fileInput) fileInput.value = '';
    }

    // ========== ĐÓNG MODAL ==========
    function close() {
        const modal = document.getElementById('traceModal');
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }

    // ========== XỬ LÝ FILE ==========
    async function handleFile(file) {
        // KIỂM TRA FILE
        if (!file.type.startsWith('image/')) {
            UI.toast('⚠ Chỉ hỗ trợ ảnh');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            UI.toast('⚠ Ảnh quá lớn (tối đa 10MB)');
            return;
        }

        // HIỂN THỊ PREVIEW
        showPreview(URL.createObjectURL(file));

        // HIỂN THỊ LOADING
        showLoading();

        // GỌI API
        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);

            const data = await res.json();
            renderResults(data, file.name);
        } catch (err) {
            console.error('[TraceMoe] Lỗi:', err);
            showError(err.message);
        }
    }

    // ========== TÌM BẰNG URL ==========
    async function searchByUrl(url) {
        showPreview(url);
        showLoading();

        try {
            const res = await fetch(API_URL + '?url=' + encodeURIComponent(url));
            if (!res.ok) throw new Error('HTTP ' + res.status);

            const data = await res.json();
            renderResults(data, url);
        } catch (err) {
            console.error('[TraceMoe] Lỗi:', err);
            showError(err.message);
        }
    }

    // ========== HIỂN THỊ PREVIEW ==========
    function showPreview(src) {
        const preview = document.getElementById('tracePreview');
        if (!preview) return;
        preview.innerHTML = `<img src="${src}" alt="Preview">`;
    }

    // ========== HIỂN THỊ LOADING ==========
    function showLoading() {
        const result = document.getElementById('traceResult');
        if (!result) return;
        result.innerHTML = `
            <div class="trace-loading">
                <div class="spinner"></div>
                <p>Đang tìm anime...</p>
                <p style="font-size:11px;color:var(--text-3);margin-top:8px">Có thể mất 5-15 giây</p>
            </div>
        `;
    }

    // ========== HIỂN THỊ LỖI ==========
    function showError(msg) {
        const result = document.getElementById('traceResult');
        if (!result) return;
        result.innerHTML = `
            <div class="trace-error">
                <div class="trace-error-icon">⚠</div>
                <h3>Không thể tìm</h3>
                <p>${escapeHtml(msg)}</p>
                <p style="font-size:11px;color:var(--text-3);margin-top:8px">
                    Thử ảnh khác hoặc đợi 1 phút rồi thử lại
                </p>
            </div>
        `;
    }

    // ========== HIỂN THỊ KẾT QUẢ ==========
    function renderResults(data, imageName) {
        const result = document.getElementById('traceResult');
        if (!result) return;

        if (!data || !data.result || !data.result.length) {
            result.innerHTML = `
                <div class="trace-error">
                    <div class="trace-error-icon">🔍</div>
                    <h3>Không tìm thấy anime</h3>
                    <p>Ảnh này có thể không phải từ anime hoặc chất lượng quá thấp</p>
                </div>
            `;
            return;
        }

        const items = data.result.slice(0, 10);

        result.innerHTML = `
            <div class="trace-header">
                <span class="trace-count">Tìm thấy ${items.length} kết quả</span>
                <span class="trace-frames">${data.frameCount || 0} frames đã quét</span>
            </div>
            <div class="trace-results">
                ${items.map((item, i) => renderResultItem(item, i)).join('')}
            </div>
        `;

        // BIND CLICK ĐỂ XEM CHI TIẾT
        result.querySelectorAll('.trace-item').forEach((el, i) => {
            el.addEventListener('click', () => {
                const item = items[i];
                showDetail(item);
            });
        });
    }

    // ========== RENDER 1 KẾT QUẢ ==========
    function renderResultItem(item, index) {
        const similarity = (item.similarity * 100).toFixed(1);
        const title = item.anilist?.title?.romaji || item.filename || 'Unknown';
        const episode = item.episode || '?';
        const time = formatTime(item.from);
        const preview = item.image || '';

        // MÀU THEO ĐỘ CHÍNH XÁC
        let accuracyClass = 'low';
        if (similarity >= 95) accuracyClass = 'high';
        else if (similarity >= 85) accuracyClass = 'medium';

        return `
            <div class="trace-item" data-index="${index}">
                <div class="trace-thumb">
                    <img src="${preview}" loading="lazy" alt="" onerror="this.style.background='#2a2a2a'">
                    <div class="trace-accuracy ${accuracyClass}">${similarity}%</div>
                </div>
                <div class="trace-info">
                    <div class="trace-title">${escapeHtml(title)}</div>
                    <div class="trace-meta">
                        ${item.episode ? `<span class="trace-meta-item">📺 Tập ${item.episode}</span>` : ''}
                        <span class="trace-meta-item">⏱ ${time}</span>
                    </div>
                    ${item.anilist?.isAdult ? '<div class="trace-adult">18+</div>' : ''}
                </div>
                <div class="trace-chevron">›</div>
            </div>
        `;
    }

    // ========== HIỂN THỊ CHI TIẾT ==========
    function showDetail(item) {
        const result = document.getElementById('traceResult');
        if (!result) return;

        const similarity = (item.similarity * 100).toFixed(1);
        const title = item.anilist?.title?.romaji || item.filename || 'Unknown';
        const titleNative = item.anilist?.title?.native || '';
        const episode = item.episode || '?';
        const time = formatTime(item.from);
        const preview = item.image || '';
        const videoUrl = item.video || '';
        const anilistId = item.anilist?.id || null;

        // LINK XEM
        const videoLink = videoUrl ? `
            <video 
                src="${videoUrl}" 
                controls 
                autoplay 
                muted 
                playsinline
                class="trace-video"
                poster="${preview}"
            ></video>
        ` : `<img src="${preview}" class="trace-detail-image">`;

        // NÚT XEM TRÊN ANILIST
        const anilistBtn = anilistId ? `
            <a href="https://anilist.co/anime/${anilistId}" target="_blank" rel="noopener" class="trace-btn primary">
                Xem trên AniList
            </a>
        ` : '';

        // NÚT MỞ CHI TIẾT TRONG APP
        const detailBtn = anilistId ? `
            <button class="trace-btn" onclick="TraceMoe.openDetail(${anilistId})">
                Mở trong app
            </button>
        ` : '';

        result.innerHTML = `
            <button class="trace-back" id="traceBack">‹ Quay lại</button>

            <div class="trace-detail">
                <div class="trace-detail-media">
                    ${videoLink}
                </div>

                <div class="trace-detail-info">
                    <h3 class="trace-detail-title">${escapeHtml(title)}</h3>
                    ${titleNative ? `<p class="trace-detail-native">${escapeHtml(titleNative)}</p>` : ''}

                    <div class="trace-detail-badges">
                        <span class="trace-badge accuracy">${similarity}% khớp</span>
                        ${item.episode ? `<span class="trace-badge">📺 Tập ${item.episode}</span>` : ''}
                        <span class="trace-badge">⏱ ${time}</span>
                    </div>

                    <div class="trace-detail-actions">
                        ${detailBtn}
                        ${anilistBtn}
                        <button class="trace-btn" onclick="TraceMoe.copyInfo('${escapeAttr(title)}', ${item.episode || 0}, '${time}')">
                            📋 Copy thông tin
                        </button>
                    </div>
                </div>
            </div>
        `;

        // BIND BACK
        document.getElementById('traceBack').addEventListener('click', () => {
            // QUAY LẠI DANH SÁCH
            const data = window._traceLastData;
            if (data) renderResults(data);
        });
    }

    // ========== MỞ CHI TIẾT TRONG APP ==========
    function openDetail(anilistId) {
        close();
        setTimeout(() => {
            if (window.DetailView) DetailView.open(anilistId);
        }, 400);
    }

    // ========== COPY THÔNG TIN ==========
    function copyInfo(title, episode, time) {
        const text = `${title}\nTập ${episode} - ${time}`;
        copyToClipboard(text);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                UI.toast('✓ Đã copy');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        UI.toast('✓ Đã copy');
    }

    // ========== FORMAT THỜI GIAN ==========
    function formatTime(seconds) {
        if (!seconds && seconds !== 0) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

    function escapeAttr(str) {
        return String(str || '').replace(/'/g, '\\\'').replace(/"/g, '&quot;');
    }

    return { init, open, close, openDetail, copyInfo };
})();

window.TraceMoe = TraceMoe;
