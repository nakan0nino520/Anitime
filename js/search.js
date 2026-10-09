// js/search.js

const SearchView = (() => {
    const el = () => document.getElementById('searchResults');
    let initialized = false;
    let searchTimer = null;
    let lastKeyword = '';
    
    // Mở rộng cấu trúc filter để chứa đủ 5 tab từ modal
    let currentFilters = { 
        genres: [], 
        themes: [], 
        demographics: [], 
        source: [], 
        other: [], 
        format: null, 
        year: null, 
        sort: 'POPULARITY_DESC' 
    };

    function init() {
        if (initialized) return;
        initialized = true;

        const input = document.getElementById('searchInput');
        if (input) {
            input.addEventListener('input', () => {
                clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    const kw = input.value.trim();
                    lastKeyword = kw;
                    executeSearch(kw, currentFilters);
                }, 400);
            });
        }

        // ===== BIND NÚT MỞ BỘ LỌC THỂ LOẠI =====
        const btnOpenGenre = document.getElementById('btnOpenGenreFilter');
        if (btnOpenGenre && window.GenreFilter) {
            btnOpenGenre.addEventListener('click', () => {
                GenreFilter.open((result) => {
                    console.log('[Search] Bộ lọc đã chọn:', result);
                    
                    // GÁN ĐẦY ĐỦ CÁC DANH MỤC TỪ KẾT QUẢ MODAL
                    currentFilters.genres = result.genres || [];
                    currentFilters.themes = result.themes || [];
                    currentFilters.demographics = result.demographics || [];
                    currentFilters.source = result.source || [];
                    currentFilters.other = result.other || [];

                    // LƯU BỘ LỌC VÀO STORE
                    if (typeof Store !== 'undefined') {
                        Store.set('genre_filter', result);
                    }

                    // CẬP NHẬT TRẠNG THÁI GIAO DIỆN NÚT
                    updateGenreButtonState();

                    // THỰC HIỆN TÌM KIẾM LẠI THEO BỘ LỌC MỚI
                    const inputEl = document.getElementById('searchInput');
                    const kw = inputEl ? inputEl.value.trim() : '';
                    executeSearch(kw, currentFilters);
                });
            });
        }

        // KHÔI PHỤC BỘ LỌC ĐÃ LƯU TRƯỚC ĐÓ (NẾU CÓ)
        const savedFilter = (typeof Store !== 'undefined') ? Store.get('genre_filter', null) : null;
        if (savedFilter) {
            currentFilters.genres = savedFilter.genres || [];
            currentFilters.themes = savedFilter.themes || [];
            currentFilters.demographics = savedFilter.demographics || [];
            currentFilters.source = savedFilter.source || [];
            currentFilters.other = savedFilter.other || [];
            updateGenreButtonState();
        }
    }

    // CẬP NHẬT GIAO DIỆN NÚT THỂ LOẠI KHI CÓ TAG ĐƯỢC CHỌN
    function updateGenreButtonState() {
        const btnOpenGenre = document.getElementById('btnOpenGenreFilter');
        if (!btnOpenGenre) return;

        // Tính tổng số lượng tag đã chọn ở tất cả các tab
        const total = currentFilters.genres.length + 
                      currentFilters.themes.length + 
                      currentFilters.demographics.length + 
                      currentFilters.source.length + 
                      currentFilters.other.length;

        if (total > 0) {
            btnOpenGenre.classList.add('active');
            btnOpenGenre.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Thể loại (${total})
            `;
        } else {
            btnOpenGenre.classList.remove('active');
            btnOpenGenre.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Thể loại
            `;
        }
    }

    // HÀM THỰC THI TÌM KIẾM CHUNG (KẾT HỢP KEYWORD VÀ FILTERS)
    async function executeSearch(keyword, filters) {
        const container = el();
        if (!container) return;

        // Nếu không có từ khóa và không có filter nào được chọn
        const hasKeyword = keyword && keyword.length >= 2;
        const hasFilters = (filters.genres.length > 0) || 
                           (filters.themes.length > 0) || 
                           (filters.demographics.length > 0) || 
                           (filters.source.length > 0) || 
                           (filters.other.length > 0) || 
                           filters.format || 
                           filters.year;

        if (!hasKeyword && !hasFilters) {
            container.innerHTML = `<div class="loading"><p>Nhập từ khóa hoặc chọn bộ lọc để tìm</p></div>`;
            return;
        }

        // Kiểm tra Rate Limit: Giới hạn tối thiểu 600ms cho mỗi lần gọi API tìm kiếm
        if (typeof RateLimiter !== 'undefined' && !RateLimiter.check('search_api_call', 600)) {
            return;
        }

        container.innerHTML = UI.skeleton(6);

        try {
            const data = await API.search(hasKeyword ? keyword : null, filters);

            if (!data || !data.length) {
                container.innerHTML = `
                    <div class="loading">
                        <p>Không tìm thấy anime nào phù hợp</p>
                        <p style="font-size:12px;margin-top:8px;color:var(--text-3)">Thử thay đổi từ khóa hoặc bộ lọc</p>
                    </div>
                `;
                return;
            }

            container.classList.add('grid-view');
            container.innerHTML = data.map(m => UI.animeCard(m, { compact: true })).join('');

            // BIND CLICK XEM CHI TIẾT ANIME
            container.querySelectorAll('.anime-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.fav-btn')) return;
                    const id = parseInt(card.dataset.id);
                    if (id && window.DetailView) {
                        DetailView.open(id);
                    }
                });
            });

            // BIND NÚT YÊU THÍCH / LƯU TRỮ NHANH
            container.querySelectorAll('.fav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Chống spam click nút yêu thích (giãn cách tối thiểu 200ms)
                    if (typeof RateLimiter !== 'undefined' && !RateLimiter.check('search_fav_btn', 200)) {
                        return;
                    }

                    const id = parseInt(btn.dataset.id);
                    if (!id) return;

                    const st = Store.getStatus(id);
                    if (st === 'WATCHING' || st === 'PLANNING') {
                        Store.setStatus(id, null);
                        btn.classList.remove('active');
                        btn.querySelector('svg').setAttribute('fill', 'none');
                        UI.toast('Đã xóa khỏi thư viện');
                    } else {
                        Store.setStatus(id, 'PLANNING');
                        btn.classList.add('active');
                        btn.querySelector('svg').setAttribute('fill', 'currentColor');
                        UI.toast('Đã thêm vào Kế hoạch');
                    }
                });
            });

            UI.toast(`✓ Tìm thấy ${data.length} anime`);
        } catch (err) {
            console.error('[Search] Lỗi:', err);
            container.innerHTML = `<div class="loading"><p>Lỗi kết nối tìm kiếm</p></div>`;
        }
    }

    return { init };
})();

window.SearchView = SearchView;
