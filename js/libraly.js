const LibraryView = (() => {
    const el = () => document.getElementById('library');
    let currentStatus = 'WATCHING';
    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;
        const tabs = document.getElementById('libraryTabs');
        if (tabs) {
            tabs.querySelectorAll('.seg-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    tabs.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentStatus = btn.dataset.status;
                    render();
                });
            });
        }
        render();
    }

    function render() {
        const container = el();
        if (!container) return;
        const list = Store.getList();
        const entries = Object.entries(list)
            .filter(([id, data]) => data.status === currentStatus)
            .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));

        if (!entries.length) {
            const labels = {
                WATCHING: 'Đang xem', COMPLETED: 'Đã hoàn thành', PLANNING: 'Kế hoạch',
                CONSIDERING: 'Cân nhắc', PAUSED: 'Tạm dừng', DROPPED: 'Đã bỏ'
            };
            container.innerHTML = `<div class="loading"><p>Chưa có anime nào trong mục "${labels[currentStatus]}"</p></div>`;
            return;
        }

        container.classList.remove('grid-view');
        container.innerHTML = entries.map(([id, data]) => {
            const media = data.data || { id: parseInt(id), title: { romaji: 'Anime #' + id } };
            const card = UI.animeCard({ media }, { compact: true });
            const progressHtml = `
                <div class="progress-counter" data-id="${id}">
                    <button class="prog-btn minus" data-delta="-1">−</button>
                    <span class="prog-value">${data.progress || 0}</span>
                    <button class="prog-btn plus" data-delta="1">+</button>
                </div>
            `;
            const statusHtml = `
                <div class="status-chip status-${data.status.toLowerCase()}">${statusLabel(data.status)}</div>
            `;
            return card.replace('</article>', progressHtml + statusHtml + '</article>');
        }).join('');

        // BIND
        container.querySelectorAll('.anime-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.fav-btn') || e.target.closest('.progress-counter')) return;
                DetailView.open(parseInt(card.dataset.id));
            });
        });
        container.querySelectorAll('.prog-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const counter = btn.closest('.progress-counter');
                const id = parseInt(counter.dataset.id);
                const delta = parseInt(btn.dataset.delta);
                const updated = Store.updateProgress(id, delta);
                if (updated) {
                    counter.querySelector('.prog-value').textContent = updated.progress;
                    UI.toast(delta > 0 ? `+1 tập (${updated.progress})` : `-1 tập (${updated.progress})`);
                }
            });
        });
        container.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                Store.setStatus(id, null);
                UI.toast('Đã xóa khỏi thư viện');
                render();
            });
        });
    }

    function statusLabel(s) {
        const map = {
            WATCHING: 'Đang xem', COMPLETED: 'Hoàn thành', PLANNING: 'Kế hoạch',
            CONSIDERING: 'Cân nhắc', PAUSED: 'Tạm dừng', DROPPED: 'Đã bỏ'
        };
        return map[s] || s;
    }

    return { init, render };
})();
