(function () {
    'use strict';

    // KHỞI TẠO MÚI GIỜ
    TZ.detect();
    const settings = Store.getSettings();
    if (settings.tzOffset !== null && settings.tzOffset !== undefined) {
        TZ.set(settings.tzOffset);
    }

    // ĐỔI VIEW
    function switchView(page) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        const view = document.getElementById('view-' + page);
        if (view) view.classList.add('active');
        const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
        if (btn) btn.classList.add('active');

        // INIT VIEW TƯƠNG ỨNG
        if (page === 'schedule') ScheduleView.init();
        else if (page === 'seasonal') SeasonalView.init();
        else if (page === 'library') LibraryView.init();
        else if (page === 'search') SearchView.init();
        else if (page === 'news') NewsView.init();

        // LƯU TRANG HIỆN TẠI
        Store.setSetting('lastPage', page);
    }

    // BIND BOTTOM NAV
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.page);
        });
    });

    // BIND TOPBAR BUTTONS
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            btnRefresh.style.transform = 'rotate(360deg)';
            setTimeout(() => btnRefresh.style.transform = '', 500);
            const active = document.querySelector('.view.active')?.id;
            if (active === 'view-schedule') ScheduleView.refresh();
            else if (active === 'view-seasonal') SeasonalView.load();
            else if (active === 'view-news') NewsView.load();
            UI.toast('Đã làm mới');
        });
    }

    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => SettingsView.open());
    }

    // PHÍM TẮT
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            DetailView.close();
            SettingsView.close();
        }
    });

    // CHẶN ZOOM
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    // KHỞI ĐỘNG
    const startPage = settings.startPage || 'schedule';
    switchView(startPage);

    // THÔNG BÁO PERMISSION
    if (settings.notifications && Notify.isEnabled() === false) {
        Notify.requestPermission();
    }

    // SERVICE WORKER (ĐÃ ĐĂNG KÝ TRONG INDEX.HTML)
    console.log('%c AniTime v1.0 ', 'background:#0a84ff;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold');
    console.log('%c Dữ liệu: AniList API · Host: GitHub Pages ', 'color:#8e8e93;font-size:11px');
})();
*/

// ==================================================================
// GIAI ĐOẠN 19: TỆP 18/20 - css/schedule.css
// ==================================================================
// DÁN MÃ:

/*
/* ==========================================================
   SCHEDULE.CSS - STYLE LỊCH + CARD
   ========================================================== */
.schedule {
    padding: 0 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.schedule.grid-view {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

/* ===== ANIME CARD ===== */
.anime-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--glass-1);
    backdrop-filter: var(--blur-m);
    -webkit-backdrop-filter: var(--blur-m);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    transition: all 0.3s var(--ease-spring);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-s);
    min-height: 124px;
}
.anime-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--grad-glass);
    opacity: 0.4;
    pointer-events: none;
}
.anime-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-m);
    border-color: var(--border-strong);
}
.anime-card:active {
    transform: scale(0.97);
    background: var(--glass-3);
}
.anime-card.airing {
    border-color: rgba(48, 209, 88, 0.5);
    box-shadow: 0 0 0 1px rgba(48, 209, 88, 0.3) inset, 0 8px 32px rgba(48, 209, 88, 0.25);
}
.anime-card.airing::after {
    content: '● LIVE';
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 10px;
    background: var(--green);
    color: #ffffff;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5px;
    border-radius: var(--r-pill);
    animation: livePulse 1.5s infinite;
    z-index: 2;
    box-shadow: 0 0 12px rgba(48, 209, 88, 0.6);
}
@keyframes livePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(0.96); }
}
.anime-cover {
    width: 72px;
    height: 100px;
    border-radius: var(--r-sm);
    object-fit: cover;
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    position: relative;
    z-index: 1;
}
.anime-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    position: relative;
    z-index: 1;
}
.anime-title {
    font-family: var(--font-rounded);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.3px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: var(--text);
}
.anime-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 11px;
    color: var(--text-2);
    font-weight: 500;
}
.anime-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 3px;
}
.anime-genres {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}
.genre-chip {
    padding: 2px 8px;
    border-radius: var(--r-pill);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.3px;
    border: 1px solid transparent;
    text-transform: uppercase;
}
.anime-time {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
    color: var(--accent);
    margin-top: auto;
    font-family: var(--font-rounded);
}
.time-icon { font-size: 12px; }
.anime-ep {
    padding: 2px 8px;
    background: rgba(10, 132, 255, 0.15);
    border-radius: var(--r-pill);
    font-size: 10px;
    font-weight: 700;
    color: var(--accent);
    border: 1px solid rgba(10, 132, 255, 0.25);
}
.anime-countdown {
    font-size: 11px;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
    font-family: var(--font-mono);
    font-weight: 600;
}
.progress-badge {
    font-size: 10px;
    color: var(--green);
    font-weight: 700;
    padding: 3px 8px;
    background: rgba(48, 209, 88, 0.12);
    border-radius: var(--r-pill);
    display: inline-block;
    align-self: flex-start;
}

/* ===== FAV BUTTON ===== */
.fav-btn {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: var(--blur-s);
    -webkit-backdrop-filter: var(--blur-s);
    border: 1px solid var(--border-strong);
    border-radius: 50%;
    color: var(--text-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s var(--ease-spring);
    z-index: 2;
    -webkit-appearance: none;
    appearance: none;
}
.fav-btn svg {
    width: 16px; height: 16px;
    transition: transform 0.3s var(--ease-spring);
}
.fav-btn.active {
    color: var(--pink);
    border-color: rgba(255, 55, 95, 0.5);
    background: rgba(255, 55, 95, 0.15);
    box-shadow: 0 0 16px rgba(255, 55, 95, 0.4);
}
.fav-btn:active { transform: scale(0.85); }
.fav-btn.active svg { animation: heartBeat 0.4s var(--ease-spring); }
@keyframes heartBeat {
    0% { transform: scale(1); }
    40% { transform: scale(1.35); }
    100% { transform: scale(1); }
}

/* ===== PROGRESS COUNTER ===== */
.progress-counter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: var(--r-pill);
    border: 1px solid var(--border);
    align-self: flex-start;
    position: relative;
    z-index: 2;
}
.progress-counter.big {
    padding: 8px 12px;
    gap: 16px;
}
.prog-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--glass-2);
    border: 1px solid var(--border-strong);
    color: var(--text);
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s var(--ease-spring);
    -webkit-appearance: none;
    appearance: none;
    font-family: var(--font);
    line-height: 1;
    padding: 0;
}
.prog-btn.minus { color: var(--pink); }
.prog-btn.plus { color: var(--green); }
.prog-btn:active {
    transform: scale(0.82);
    background: var(--glass-3);
}
.prog-value {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    min-width: 22px;
    text-align: center;
}
.progress-counter.big .prog-value { font-size: 18px; min-width: 40px; }

/* ===== STATUS CHIP ===== */
.status-chip {
    position: absolute;
    bottom: 12px;
    left: 96px;
    padding: 3px 10px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.4px;
    border-radius: var(--r-pill);
    text-transform: uppercase;
    border: 1px solid transparent;
    z-index: 2;
}
.status-watching { background: rgba(10, 132, 255, 0.15); color: var(--accent); border-color: rgba(10, 132, 255, 0.3); }
.status-completed { background: rgba(48, 209, 88, 0.15); color: var(--green); border-color: rgba(48, 209, 88, 0.3); }
.status-planning { background: rgba(255, 159, 10, 0.15); color: var(--orange); border-color: rgba(255, 159, 10, 0.3); }
.status-paused { background: rgba(255, 214, 10, 0.15); color: var(--yellow); border-color: rgba(255, 214, 10, 0.3); }
.status-dropped { background: rgba(255, 55, 95, 0.15); color: var(--pink); border-color: rgba(255, 55, 95, 0.3); }
.status-considering { background: rgba(191, 90, 242, 0.15); color: var(--purple); border-color: rgba(191, 90, 242, 0.3); }

/* ===== SKELETON ===== */
.anime-card.skeleton {
    pointer-events: none;
    background: var(--glass-1);
}
.skeleton-box {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}
.skeleton-line {
    height: 12px;
    border-radius: var(--r-xs);
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-bottom: 8px;
}
.skeleton-line.wide { width: 80%; }
.skeleton-line.medium { width: 60%; }
.skeleton-line.short { width: 40%; }
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

/* ===== WEEK VIEW ===== */
.week-day-header {
    font-family: var(--font-rounded);
    font-size: 15px;
    font-weight: 800;
    color: var(--text);
    padding: 16px 4px 8px;
    letter-spacing: -0.4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
}

/* ===== NEWS ===== */
.news-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--glass-1);
    backdrop-filter: var(--blur-m);
    -webkit-backdrop-filter: var(--blur-m);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    text-decoration: none;
    color: var(--text);
    transition: all 0.25s var(--ease-spring);
    box-shadow: var(--shadow-s);
}
.news-card:active { transform: scale(0.98); background: var(--glass-3); }
.news-thumb {
    width: 90px;
    height: 90px;
    border-radius: var(--r-md);
    object-fit: cover;
    flex-shrink: 0;
    background: #1a1a1a;
}
.news-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.news-title {
    font-size: 13px;
    font-weight: 700;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    letter-spacing: -0.2px;
}
.news-desc {
    font-size: 11px;
    color: var(--text-2);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.news-date {
    font-size: 10px;
    color: var(--text-3);
    font-family: var(--font-mono);
    font-weight: 600;
    margin-top: auto;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 420px) {
    .schedule.grid-view { grid-template-columns: 1fr; }
    .anime-cover { width: 60px; height: 85px; }
    .anime-title { font-size: 13px; }
    .status-chip { left: 84px; }
}
@media (min-width: 768px) {
    .schedule { padding: 0 24px 24px; }
    .schedule.grid-view { grid-template-columns: repeat(3, 1fr); gap: 14px; }
              }
