const Countdown = (() => {
    let timer = null;
    const listeners = new Set();

    function parts(unixSec) {
        const diff = unixSec * 1000 - Date.now();
        if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
        return {
            d: Math.floor(diff / 86400000),
            h: Math.floor((diff % 86400000) / 3600000),
            m: Math.floor((diff % 3600000) / 60000),
            s: Math.floor((diff % 60000) / 1000),
            past: false
        };
    }

    function format(unixSec) {
        const p = parts(unixSec);
        if (p.past) return 'Đã phát';
        if (p.d > 0) return p.d + ' ngày ' + p.h + 'h';
        if (p.h > 0) return p.h + 'h ' + p.m + 'p';
        if (p.m > 0) return p.m + 'p ' + p.s + 's';
        return p.s + 's';
    }

    function formatFull(unixSec) {
        const p = parts(unixSec);
        if (p.past) return 'Đã phát';
        if (p.d > 0) return `${p.d}n ${p.h}g ${p.m}p`;
        if (p.h > 0) return `${p.h}g ${p.m}p ${p.s}g`;
        if (p.m > 0) return `${p.m}p ${p.s}g`;
        return `${p.s} giây`;
    }

    function start() {
        if (timer) return;
        timer = setInterval(() => {
            listeners.forEach(fn => { try { fn(); } catch (e) {} });
        }, 1000);
    }
    function stop() {
        if (timer) { clearInterval(timer); timer = null; }
    }
    function onTick(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    }

    return { parts, format, formatFull, start, stop, onTick };
})();
