const Store = (() => {
    const PREFIX = 'anitime_';

    function get(key, def = null) {
        try {
            const raw = localStorage.getItem(PREFIX + key);
            if (raw === null) return def;
            return JSON.parse(raw);
        } catch (e) { return def; }
    }
    function set(key, val) {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(val));
            return true;
        } catch (e) {
            console.error('Storage full:', e);
            return false;
        }
    }
    function remove(key) {
        try { localStorage.removeItem(PREFIX + key); } catch (e) {}
    }
    function clear() {
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith(PREFIX))
                .forEach(k => localStorage.removeItem(k));
        } catch (e) {}
    }

    // ===== WATCHLIST =====
    const WATCH_STATUSES = ['WATCHING', 'COMPLETED', 'PLANNING', 'CONSIDERING', 'PAUSED', 'DROPPED'];

    function getList() {
        return get('watchlist', {});
    }
    function setStatus(animeId, status, animeData = null) {
        const list = getList();
        if (!status) {
            delete list[animeId];
        } else {
            list[animeId] = {
                status,
                progress: list[animeId]?.progress || 0,
                score: list[animeId]?.score || 0,
                note: list[animeId]?.note || '',
                updatedAt: Date.now(),
                data: animeData || list[animeId]?.data || null
            };
        }
        set('watchlist', list);
        return list;
    }
    function getStatus(animeId) {
        return getList()[animeId]?.status || null;
    }
    function updateProgress(animeId, delta) {
        const list = getList();
        if (!list[animeId]) return null;
        list[animeId].progress = Math.max(0, (list[animeId].progress || 0) + delta);
        list[animeId].updatedAt = Date.now();
        set('watchlist', list);
        return list[animeId];
    }
    function setProgress(animeId, value) {
        const list = getList();
        if (!list[animeId]) return null;
        list[animeId].progress = Math.max(0, value);
        list[animeId].updatedAt = Date.now();
        set('watchlist', list);
        return list[animeId];
    }
    function setScore(animeId, score) {
        const list = getList();
        if (!list[animeId]) return null;
        list[animeId].score = score;
        set('watchlist', list);
        return list[animeId];
    }
    function setNote(animeId, note) {
        const list = getList();
        if (!list[animeId]) return null;
        list[animeId].note = note;
        set('watchlist', list);
        return list[animeId];
    }

    // ===== SETTINGS =====
    const DEFAULT_SETTINGS = {
        tzOffset: null,           // null = TỰ ĐỘNG
        titleLang: 'ROMAJI',      // ROMAJI | ENGLISH | NATIVE
        theme: 'DARK',            // DARK | LIGHT | AUTO
        region: 'VN',             // VN | US | JP | GLOBAL
        startPage: 'schedule',    // schedule | seasonal | library
        notifications: false,
        reminderMinutes: 15,
        filterMyList: false,
        hideDropped: true
    };
    function getSettings() {
        return { ...DEFAULT_SETTINGS, ...get('settings', {}) };
    }
    function setSetting(key, val) {
        const s = getSettings();
        s[key] = val;
        set('settings', s);
        return s;
    }
    function resetSettings() {
        set('settings', DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }

    // ===== EXPORT/IMPORT =====
    function exportAll() {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            watchlist: getList(),
            settings: getSettings()
        };
    }
    function importAll(data) {
        if (!data || typeof data !== 'object') throw new Error('Dữ liệu không hợp lệ');
        if (data.watchlist) set('watchlist', data.watchlist);
        if (data.settings) set('settings', data.settings);
        return true;
    }

    return {
        get, set, remove, clear,
        getList, setStatus, getStatus, updateProgress, setProgress, setScore, setNote,
        getSettings, setSetting, resetSettings,
        exportAll, importAll,
        WATCH_STATUSES
    };
})();
