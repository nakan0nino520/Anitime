// js/library.js
// THƯ VIỆN CÁ NHÂN - 6 TAB

const LibraryView = (() => {
    const el = () => document.getElementById('library');
    const tabsEl = () => document.getElementById('libraryTabs');
    let currentStatus = 'WATCHING';
    let tabsBound = false;

    const STATUS_LABELS = {
        WATCHING: 'Đang xem',
        PLANNING: 'Kế hoạch',
        COMPLETED: 'Hoàn thành',
        PAUSED: 'Tạm dừng',
        DROPPED: 'Bỏ',
        CONSIDERING: 'Cân nhắc'
    };

    const STATUS_ICONS = {
        WATCHING: '▶',
        PLANNING: '🕐',
        COMPLETED: '✓',
        PAUSED: '⏸',
        DROPPED: '✕',
        CONSIDERING: '💭'
    };

    // ===== KHỞI TẠO =====
    function init() {
        console.log('[Library] init');
        bindTabsOnce();
        render();
    }

    // ===== BIND TABS 1 LẦN =====
    function bindTabsOnce() {
        const tabs = tabsEl();
        if (!tabs) {
            console.warn('[Library] Không tìm thấy #libraryTabs');
            return;
        }

        if (tabsBound) return;
        tabsBound = true;

        const btns = tabs.querySelectorAll('.seg-btn');
        console.log('[Library] Bind tabs:', btns.length);

        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const newStatus = btn.dataset.status;
                if (!newStatus) return;

                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (newStatus === currentStatus) return;
                currentStatus = newStatus;
                render();

                if (navigator.vibrate) navigator.vibrate(10);
            });
        });
    }

    // ===== RENDER =====
    function render() {
        const container = el();
        if (!container) return;

        if (typeof Store === 'undefined') {
            container.innerHTML = '<div class="loading"><p>Lỗi tải dữ liệu</p></div>';
            return;
        }

        const list = Store.getList();
        const entries = Object.entries(list)
            .filter(([id, data]) => data.status === currentStatus)
            .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));

        console.log('[Library] Render', currentStatus, ':', entries.length, 'entries');

        if (!entries.length) {
            container.classList.remove('grid-view');
            container.innerHTML = `
                <div class="library-empty">
                    <div class="library-empty-icon">${STATUS_ICONS[currentStatus]}</div>
                    <h3>Chưa có anime nào</h3>
                    <p>Thêm anime vào <strong>"${STATUS_LABELS[currentStatus]}"</strong> từ trang chi tiết</p>
                    <button class="library-empty-btn" onclick="if(window.switchView)switchView('schedule')">
                        Khám phá lịch chiếu
                    </button>
                </div>
            `;
            return;
        }

        container.classList.remove('grid-view');
        container.innerHTML = entries.map(([id, data]) => renderEntry(id, data)).join('');

        bindCardEvents(container);
        bindActionButtons(container);
    }

    // ===== RENDER ENTRY =====
    function renderEntry(id, data) {
        const media = data.data || {};
        const title = getTitle(media);
        const cover = (media.coverImage && (media.coverImage.large || media.coverImage.extraLarge)) || '';
        const episodes = media.episodes || '?';
        const progress = data.progress || 0;
        const score = data.score || 0;
        const percent = (episodes !== '?' && episodes > 0) ? Math.round((progress / episodes) * 100) : 0;

        return `
            <article class="anime-card library-card" data-id="${id}">
                <div class="library-cover-wrap">
                    ${cover ? '<img class="anime-cover" src="' + cover + '" loading="lazy" alt="">' : '<div class="anime-cover"></div>'}
                    ${progress > 0 ? '<div class="library-progress-badge">' + progress + '/' + episodes + '</div>' : ''}
                </div>
                <div class="anime-info">
                    <h3 class="anime-title">${escapeHtml(title)}</h3>
                    <div class="anime-meta">
                        ${episodes !== '?' ? '<span class="anime-meta-item">📺 ' + episodes + ' tập</span>' : ''}
                        ${score ? '<span class="anime-meta-item">⭐ ' + score + '/10</span>' : ''}
                        ${media.format ? '<span class="anime-meta-item">' + media.format + '</span>' : ''}
                    </div>
                    ${progress > 0 && episodes !== '?' ? `
                        <div class="library-progress-bar">
                            <div class="library-progress-fill" style="width:${percent}%"></div>
                        </div>
                        <div class="library-progress-text">Đã xem ${progress}/${episodes} tập (${percent}%)</div>
                    ` : ''}
                    <div class="library-actions">${renderActions(data.status, id)}</div>
                </div>
            </article>
        `;
    }

    // ===== NÚT HÀNH ĐỘNG =====
    function renderActions(status, id) {
        if (status === 'WATCHING') {
            return `
                <button class="lib-btn minus" data-action="progress" data-id="${id}" data-delta="-1">−</button>
                <button class="lib-btn plus" data-action="progress" data-id="${id}" data-delta="1">+</button>
                <button class="lib-btn success" data-action="complete" data-id="${id}">✓ Xong</button>
                <button class="lib-btn warning" data-action="pause" data-id="${id}">⏸</button>
            `;
        }
        if (status === 'PLANNING') {
            return `
                <button class="lib-btn primary" data-action="start" data-id="${id}">▶ Bắt đầu</button>
                <button class="lib-btn danger" data-action="remove" data-id="${id}">✕</button>
            `;
        }
        if (status === 'COMPLETED') {
            return '<button class="lib-btn primary" data-action="rewatch" data-id="' + id + '">↻ Xem lại</button>';
        }
        if (status === 'PAUSED') {
            return `
                <button class="lib-btn primary" data-action="resume" data-id="${id}">▶ Tiếp tục</button>
                <button class="lib-btn danger" data-action="drop" data-id="${id}">✕ Bỏ</button>
            `;
        }
        if (status === 'DROPPED') {
            return `
                <button class="lib-btn primary" data-action="restart" data-id="${id}">↻ Xem lại</button>
                <button class="lib-btn danger" data-action="remove" data-id="${id}">🗑</button>
            `;
        }
        if (status === 'CONSIDERING') {
            return `
                <button class="lib-btn primary" data-action="plan" data-id="${id}">🕐 Kế hoạch</button>
                <button class="lib-btn danger" data-action="remove" data-id="${id}">✕</button>
            `;
        }
        return '';
    }

    // ===== BIND CARD =====
    function bindCardEvents(container) {
        container.querySelectorAll('.anime-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.lib-btn')) return;
                const id = parseInt(card.dataset.id);
                if (!id) return;
                if (window.DetailView && typeof DetailView.open === 'function') {
                    DetailView.open(id);
                }
            });
        });
    }

    // ===== BIND NÚT =====
    function bindActionButtons(container) {
        container.querySelectorAll('.lib-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                const delta = parseInt(btn.dataset.delta || 0);
                if (action && id) handleAction(action, id, delta);
            });
        });
    }

    // ===== XỬ LÝ HÀNH ĐỘNG =====
    function handleAction(action, id, delta) {
        if (typeof Store === 'undefined') return;
        if (navigator.vibrate) navigator.vibrate(10);

        switch (action) {
            case 'progress': {
                const u = Store.updateProgress(id, delta);
                if (u && typeof UI !== 'undefined') {
                    const total = (u.data && u.data.episodes) || '?';
                    UI.toast(delta > 0 ? '+1 tập (' + u.progress + '/' + total + ')' : '-1 tập (' + u.progress + '/' + total + ')');
                }
                render();
                break;
            }
            case 'complete':
                Store.setStatus(id, 'COMPLETED');
                if (typeof UI !== 'undefined') UI.toast('✓ Đã đánh dấu hoàn thành');
                render();
                break;
            case 'pause':
                Store.setStatus(id, 'PAUSED');
                if (typeof UI !== 'undefined') UI.toast('⏸ Đã tạm dừng');
                render();
                break;
            case 'start':
            case 'resume':
            case 'rewatch':
                Store.setStatus(id, 'WATCHING');
                if (typeof UI !== 'undefined') UI.toast('▶ Đang xem');
                render();
                break;
            case 'restart':
                Store.setStatus(id, 'WATCHING');
                Store.setProgress(id, 0);
                if (typeof UI !== 'undefined') UI.toast('↻ Xem lại từ đầu');
                render();
                break;
            case 'drop':
                Store.setStatus(id, 'DROPPED');
                if (typeof UI !== 'undefined') UI.toast('✕ Đã bỏ');
                render();
                break;
            case 'plan':
                Store.setStatus(id, 'PLANNING');
                if (typeof UI !== 'undefined') UI.toast('🕐 Đã thêm vào kế hoạch');
                render();
                break;
            case 'remove':
                if (confirm('Xóa anime này khỏi thư viện?')) {
                    Store.setStatus(id, null);
                    if (typeof UI !== 'undefined') UI.toast('🗑 Đã xóa');
                    render();
                }
                break;
        }
    }

    // ===== HELPER =====
    function getTitle(media) {
        if (!media) return 'Unknown';
        const s = (typeof Store !== 'undefined') ? Store.getSettings() : {};
        const lang = s.titleLang || 'ROMAJI';
        const t = media.title || {};
        if (lang === 'ENGLISH' && t.english) return t.english;
        if (lang === 'NATIVE' && t.native) return t.native;
        return t.romaji || t.english || t.native || 'Unknown';
    }

    function escapeHtml(str) {
        if (!str) return '';
        if (typeof UI !== 'undefined' && UI.escapeHtml) return UI.escapeHtml(str);
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return { init, render };
})();

window.LibraryView = LibraryView;
