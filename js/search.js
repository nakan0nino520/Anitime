const SearchView = (() => {
    const el = () => document.getElementById('searchResults');
    let initialized = false;
    let searchTimer = null;
    let lastKeyword = '';

    function init() {
        if (initialized) return;
        initialized = true;
        const input = document.getElementById('searchInput');
        if (!input) return;
        input.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                const kw = input.value.trim();
                if (kw.length >= 2) {
                    lastKeyword = kw;
                    search(kw);
                } else if (kw.length === 0) {
                    el().innerHTML = `<div class="loading"><p>Nhập từ khóa để tìm</p></div>`;
                }
            }, 400);
        });
    }

    async function search(keyword) {
        const container = el();
        if (!container) return;
        container.innerHTML = UI.skeleton(6);
        try {
            const data = await API.search(keyword);
            if (!data || !data.length) {
                container.innerHTML = `<div class="loading"><p>Không tìm thấy anime nào</p></div>`;
                return;
            }
            container.classList.add('grid-view');
            container.innerHTML = data.map(m => UI.animeCard(m, { compact: true })).join('');
            container.querySelectorAll('.anime-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.fav-btn')) return;
                    DetailView.open(parseInt(card.dataset.id));
                });
            });
            container.querySelectorAll('.fav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    const st = Store.getStatus(id);
                    if (st === 'WATCHING' || st === 'PLANNING') {
                        Store.setStatus(id, null);
                        btn.classList.remove('active');
                        btn.querySelector('svg').setAttribute('fill', 'none');
                    } else {
                        Store.setStatus(id, 'PLANNING');
                        btn.classList.add('active');
                        btn.querySelector('svg').setAttribute('fill', 'currentColor');
                        UI.toast('Đã thêm vào Kế hoạch');
                    }
                });
            });
        } catch (err) {
            container.innerHTML = `<div class="loading"><p>Lỗi tìm kiếm</p></div>`;
        }
    }

    return { init };
})();
