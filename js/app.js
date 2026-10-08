// js/app.js

(function () {
    'use strict';

    // ========== ÁP DỤNG HIỆU ỨNG VÀO BODY ==========
    function applyEffectsToBody() {
        if (typeof Store === 'undefined') return;
        const s = Store.getSettings();
        const body = document.body;
        body.classList.toggle('reduce-effects', !!s.reduceEffects);
        body.classList.toggle('no-animations', !!s.disableAnimations);
        body.classList.toggle('no-blur', !!s.disableBlur);
        body.classList.toggle('compact-mode', !!s.compactMode);
    }

    // KHỞI TẠO MÚI GIỜ
    if (typeof TZ !== 'undefined') {
        TZ.detect();
        const settings = typeof Store !== 'undefined' ? Store.getSettings() : {};
        if (settings.tzOffset !== null && settings.tzOffset !== undefined) {
            TZ.set(settings.tzOffset);
        }
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
        if (page === 'schedule' && typeof ScheduleView !== 'undefined') ScheduleView.init();
        else if (page === 'seasonal' && typeof SeasonalView !== 'undefined') SeasonalView.init();
        else if (page === 'library' && typeof LibraryView !== 'undefined') LibraryView.init();
        else if (page === 'search' && typeof SearchView !== 'undefined') SearchView.init();
        else if (page === 'news' && typeof NewsView !== 'undefined') NewsView.init();

        // LƯU TRANG HIỆN TẠI
        if (typeof Store !== 'undefined') Store.setSetting('lastPage', page);
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
            if (active === 'view-schedule' && typeof ScheduleView !== 'undefined') ScheduleView.refresh();
            else if (active === 'view-seasonal' && typeof SeasonalView !== 'undefined') SeasonalView.load();
            else if (active === 'view-news' && typeof NewsView !== 'undefined') NewsView.load();
            if (typeof UI !== 'undefined') UI.toast('Đã làm mới');
        });
    }

    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            if (typeof SettingsView !== 'undefined') SettingsView.open();
        });
    }

    // PHÍM TẮT
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (typeof DetailView !== 'undefined') DetailView.close();
            if (typeof SettingsView !== 'undefined') SettingsView.close();
        }
    });

    // CHẶN ZOOM CỦA TRÌNH DUYỆT
    document.addEventListener('gesturestart', (e) => e.preventDefault());

    // ========== KHỞI ĐỘNG ==========
    const settings = typeof Store !== 'undefined' ? Store.getSettings() : {};
    const startPage = settings.startPage || 'schedule';
    switchView(startPage);

    // ========== ÁP DỤNG HIỆU ỨNG ĐÃ LƯU ==========
    applyEffectsToBody();

    // THÔNG BÁO PERMISSION
    if (settings.notifications && typeof Notify !== 'undefined' && Notify.isEnabled() === false) {
        Notify.requestPermission();
    }

    // EXPORT RA NGOÀI BIẾN TOÀN CỤC
    window.applyEffectsToBody = applyEffectsToBody;
    window.switchView = switchView;

    console.log('%c AniTime v1.0 ', 'background:#0a84ff;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold');
    console.log('%c Dữ liệu: AniList API · Host: GitHub Pages ', 'color:#8e8e93;font-size:11px');
})();
