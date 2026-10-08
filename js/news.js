const NewsView = (() => {
    const el = () => document.getElementById('news');
    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;
        load();
    }

    async function load() {
        const container = el();
        if (!container) return;
        container.innerHTML = UI.skeleton(4);
        try {
            const rss = 'https://www.animenewsnetwork.com/news/rss.xml';
            const endpoint = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss);
            const res = await fetch(endpoint);
            const json = await res.json();
            if (!json.items || !json.items.length) {
                container.innerHTML = `<div class="loading"><p>Không có tin tức</p></div>`;
                return;
            }
            container.classList.remove('grid-view');
            container.innerHTML = json.items.slice(0, 20).map(item => `
                <a class="news-card" href="${item.link}" target="_blank" rel="noopener">
                    ${item.thumbnail ? `<img class="news-thumb" src="${item.thumbnail}" loading="lazy" alt="">` : ''}
                    <div class="news-info">
                        <h3 class="news-title">${UI.escapeHtml(item.title)}</h3>
                        <p class="news-desc">${UI.escapeHtml((item.description || '').replace(/<[^>]+>/g, '').slice(0, 120))}...</p>
                        <span class="news-date">${UI.formatDate(item.pubDate)}</span>
                    </div>
                </a>
            `).join('');
        } catch (err) {
            container.innerHTML = `<div class="loading"><p>Lỗi tải tin tức</p></div>`;
        }
    }

    return { init };
})();
