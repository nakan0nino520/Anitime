const Notify = (() => {
    const timers = new Map();

    async function requestPermission() {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        const result = await Notification.requestPermission();
        return result;
    }

    function isEnabled() {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    function show(title, body, data = {}) {
        if (!isEnabled()) return null;
        try {
            const n = new Notification(title, {
                body,
                icon: 'icons/icon-192.png',
                badge: 'icons/icon-192.png',
                tag: data.tag || 'anitime-' + Date.now(),
                data,
                silent: false
            });
            n.onclick = () => {
                window.focus();
                if (data.url) location.href = data.url;
                n.close();
            };
            return n;
        } catch (e) {
            console.error('Notify:', e);
            return null;
        }
    }

    // LÊN LỊCH NHẮC
    function schedule(animeId, animeTitle, airingAtSec, minutesBefore) {
        cancel(animeId);
        const targetMs = airingAtSec * 1000 - minutesBefore * 60000;
        const delay = targetMs - Date.now();
        if (delay <= 0) return false;

        const timer = setTimeout(() => {
            show('🔔 Anime sắp phát', animeTitle, { animeId, url: '#detail-' + animeId });
            timers.delete(animeId);
        }, delay);
        timers.set(animeId, timer);
        return true;
    }

    function cancel(animeId) {
        if (timers.has(animeId)) {
            clearTimeout(timers.get(animeId));
            timers.delete(animeId);
        }
    }

    function cancelAll() {
        timers.forEach(t => clearTimeout(t));
        timers.clear();
    }

    return { requestPermission, isEnabled, show, schedule, cancel, cancelAll };
})();
