const GenreFilter = (() => {
    const DATA = {
        genres: [
            'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi',
            'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music',
            'Mystery', 'Psychological', 'Romance', 'Sci-Fi',
            'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
        ],
        themes: [
            'Adult Cast', 'Anthropomorphic', 'CGDCT', 'Childcare',
            'Combat Sports', 'Crossdressing', 'Delinquents', 'Detective',
            'Educational', 'Gag Humor', 'Gore', 'Harem', 'High Stakes Game',
            'Historical', 'Idol', 'Isekai', 'Iyashikei', 'Love Polygon',
            'Magical Sex Shift', 'Mahou Shoujo', 'Martial Arts', 'Medical',
            'Military', 'Mythology', 'Organized Crime', 'Otaku Culture',
            'Parody', 'Performing Arts', 'Pets', 'Post-Apocalyptic',
            'Reincarnation', 'Reverse Harem', 'Romantic Subtext', 'Samurai',
            'School', 'Showbiz', 'Space', 'Strategy Game', 'Super Power',
            'Survival', 'Team Sports', 'Time Travel', 'Vampire', 'Video Game',
            'Villainess', 'Visual Arts', 'Workplace'
        ],
        demographics: [
            'Josei', 'Kids', 'Seinen', 'Shoujo', 'Shounen'
        ],
        source: [
            'Original', 'Manga', 'Light Novel', 'Visual Novel',
            'Video Game', 'Web Manga', 'Doujinshi', 'Novel',
            'Web Novel', 'Card Game', 'Book', 'Picture Book',
            'Radio', 'Music', 'Other', 'Unknown', 'Anime',
            'Live Action', 'Game'
        ],
        other: [
            'Airing', 'Not Yet Aired', 'Finished',
            'TV', 'Movie', 'OVA', 'ONA', 'Special',
            'Winter', 'Spring', 'Summer', 'Fall',
            '2020s', '2010s', '2000s', '1990s', '1980s', '1970s'
        ]
    };

    const TAB_LABELS = {
        genres: 'Thể loại',
        themes: 'Chủ đề',
        demographics: 'Đối tượng',
        source: 'Nguồn gốc',
        other: 'Khác'
    };

    let selected = {
        genres: new Set(),
        themes: new Set(),
        demographics: new Set(),
        source: new Set(),
        other: new Set()
    };

    let currentTab = 'genres';
    let onApplyCallback = null;
    let initialized = false;

    // ========== KHỞI TẠO ==========
    function init() {
        if (initialized) return;
        initialized = true;

        const modal = document.getElementById('genreModal');
        if (!modal) {
            console.warn('[GenreFilter] Không tìm thấy #genreModal');
            return;
        }

        const closeBtn = document.getElementById('genreModalClose');
        if (closeBtn) closeBtn.addEventListener('click', close);

        const menuBtn = document.getElementById('genreModalMenu');
        if (menuBtn) menuBtn.addEventListener('click', showMenu);

        document.querySelectorAll('.genre-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                renderContent();
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });

        const resetBtn = document.getElementById('genreReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                Object.keys(selected).forEach(k => selected[k].clear());
                renderContent();
                updateApplyBadge();
                if (typeof UI !== 'undefined') UI.toast('Đã đặt lại bộ lọc');
            });
        }

        const applyBtn = document.getElementById('genreApply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const result = getSelected();
                if (onApplyCallback) onApplyCallback(result);
                close();
                const total = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
                if (typeof UI !== 'undefined') UI.toast(total ? `✓ Đã chọn ${total} tag` : 'Không có tag nào');
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }

    // ========== MỞ ==========
    function open(callback) {
        init();
        onApplyCallback = callback || null;
        const modal = document.getElementById('genreModal');
        if (!modal) return;

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        currentTab = 'genres';
        document.querySelectorAll('.genre-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === 'genres');
        });

        renderContent();
        updateApplyBadge();
    }

    // ========== ĐÓNG ==========
    function close() {
        const modal = document.getElementById('genreModal');
        if (!modal) return;
        modal.classList.remove('show');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }

    // ========== RENDER ==========
    function renderContent() {
        const container = document.getElementById('genreContent');
        if (!container) return;

        const items = DATA[currentTab] || [];

        container.innerHTML = items.map(item => {
            const isSelected = selected[currentTab].has(item);
            return `
                <button class="genre-item ${isSelected ? 'selected' : ''}" data-value="${escapeHtml(item)}">
                    <span class="genre-item-text">${escapeHtml(item)}</span>
                    <span class="genre-item-check">✓</span>
                </button>
            `;
        }).join('');

        container.querySelectorAll('.genre-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.value;
                if (selected[currentTab].has(val)) {
                    selected[currentTab].delete(val);
                    btn.classList.remove('selected');
                } else {
                    selected[currentTab].add(val);
                    btn.classList.add('selected');
                }
                updateApplyBadge();
                if (navigator.vibrate) navigator.vibrate(5);
            });
        });
    }

    // ========== UPDATE BADGE ==========
    function updateApplyBadge() {
        const btn = document.getElementById('genreApply');
        if (!btn) return;
        const total = Object.values(selected).reduce((sum, set) => sum + set.size, 0);
        btn.textContent = total ? `Áp dụng (${total})` : 'Áp dụng';
        btn.classList.toggle('has-selection', total > 0);
    }

    // ========== MENU ==========
    function showMenu() {
        const options = ['Chọn tất cả tab này', 'Bỏ chọn tab này', 'Đặt lại tất cả'];
        const choice = prompt(
            'MENU:\n1. ' + options[0] + '\n2. ' + options[1] + '\n3. ' + options[2] + '\n\nNhập số (1-3):'
        );
        if (choice === '1') {
            DATA[currentTab].forEach(item => selected[currentTab].add(item));
            renderContent();
            updateApplyBadge();
        } else if (choice === '2') {
            selected[currentTab].clear();
            renderContent();
            updateApplyBadge();
        } else if (choice === '3') {
            Object.keys(selected).forEach(k => selected[k].clear());
            renderContent();
            updateApplyBadge();
        }
    }

    // ========== GET ==========
    function getSelected() {
        return {
            genres: Array.from(selected.genres),
            themes: Array.from(selected.themes),
            demographics: Array.from(selected.demographics),
            source: Array.from(selected.source),
            other: Array.from(selected.other)
        };
    }

    function clearAll() {
        Object.keys(selected).forEach(k => selected[k].clear());
        updateApplyBadge();
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

    return { open, close, init, getSelected, clearAll };
})();

window.GenreFilter = GenreFilter;
