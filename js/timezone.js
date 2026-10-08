const TZ = (() => {
    let offset = -(new Date().getTimezoneOffset() / 60);

    function detect() {
        offset = -(new Date().getTimezoneOffset() / 60);
        return offset;
    }
    function set(h) { offset = h; }
    function get() { return offset; }

    function formatTime(unixSec) {
        const d = new Date((unixSec + offset * 3600) * 1000);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return hh + ':' + mm;
    }
    function formatDate(unixSec) {
        const d = new Date((unixSec + offset * 3600) * 1000);
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        return day + '/' + month;
    }
    function dayKey(unixSec) {
        const d = new Date((unixSec + offset * 3600) * 1000);
        return d.toISOString().slice(0, 10);
    }
    function weekday(unixSec) {
        const d = new Date((unixSec + offset * 3600) * 1000);
        return d.getUTCDay();
    }
    function label() {
        const sign = offset >= 0 ? '+' : '';
        return 'GMT' + sign + offset;
    }
    function isSameDay(unixSec, date) {
        const d = new Date((unixSec + offset * 3600) * 1000);
        return d.getUTCFullYear() === date.getFullYear() &&
               d.getUTCMonth() === date.getMonth() &&
               d.getUTCDate() === date.getDate();
    }
    return { detect, set, get, formatTime, formatDate, dayKey, weekday, label, isSameDay };
})();
