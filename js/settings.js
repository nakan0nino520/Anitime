const SettingsView = (() => {
    function open() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.add('show');
        const s = Store.getSettings();
        overlay.innerHTML = `
            <div class="detail-sheet settings-sheet">
                <button class="detail-close" id="settingsClose">✕</button>
                <h2 class="settings-title">Cài đặt</h2>

                <div class="settings-group">
                    <label class="settings-label">Ngôn ngữ tên phim</label>
                    <select class="glass-select" id="setTitleLang">
                        <option value="ROMAJI" ${s.titleLang === 'ROMAJI' ? 'selected' : ''}>Romaji (Kimetsu no Yaiba)</option>
                        <option value="ENGLISH" ${s.titleLang === 'ENGLISH' ? 'selected' : ''}>English (Demon Slayer)</option>
                        <option value="NATIVE" ${s.titleLang === 'NATIVE' ? 'selected' : ''}>Tiếng Nhật (鬼滅の刃)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Múi giờ</label>
                    <select class="glass-select" id="setTz">
                        <option value="auto">Tự động (${TZ.label()})</option>
                        <option value="7">GMT+7 (Việt Nam)</option>
                        <option value="9">GMT+9 (Nhật Bản)</option>
                        <option value="8">GMT+8 (Trung Quốc)</option>
                        <option value="0">GMT+0 (UTC)</option>
                        <option value="-5">GMT-5 (New York)</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Trang mặc định</label>
                    <select class="glass-select" id="setStartPage">
                        <option value="schedule" ${s.startPage === 'schedule' ? 'selected' : ''}>Lịch chiếu</option>
                        <option value="seasonal" ${s.startPage === 'seasonal' ? 'selected' : ''}>Mùa hiện tại</option>
                        <option value="library" ${s.startPage === 'library' ? 'selected' : ''}>Thư viện</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Vùng miền</label>
                    <select class="glass-select" id="setRegion">
                        <option value="VN" ${s.region === 'VN' ? 'selected' : ''}>Việt Nam</option>
                        <option value="US" ${s.region === 'US' ? 'selected' : ''}>Hoa Kỳ</option>
                        <option value="JP" ${s.region === 'JP' ? 'selected' : ''}>Nhật Bản</option>
                        <option value="GLOBAL" ${s.region === 'GLOBAL' ? 'selected' : ''}>Toàn cầu</option>
                    </select>
                </div>

                <div class="settings-group">
                    <label class="settings-label">Nhắc trước khi phát</label>
                    <select class="glass-select" id="setReminder">
                        <option value="5" ${s.reminderMinutes === 5 ? 'selected' : ''}>5 phút</option>
                        <option value="15" ${s.reminderMinutes === 15 ? 'selected' : ''}>15 phút</option>
                        <option value="30" ${s.reminderMinutes === 30 ? 'selected' : ''}>30 phút</option>
                        <option value="60" ${s.reminderMinutes === 60 ? 'selected' : ''}>1 giờ</option>
                    </select>
                </div>

                <div class="settings-actions">
                    <button class="glass-btn wide" id="btnExport">📤 Xuất dữ liệu</button>
                    <button class="glass-btn wide" id="btnImport">📥 Nhập dữ liệu</button>
                    <button class="glass-btn wide danger" id="btnClearAll">🗑 Xóa toàn bộ dữ liệu</button>
                </div>

                <p class="settings-version">AniTime v1.0 · Miễn phí · Không quảng cáo</p>
            </div>
        `;

        document.getElementById('settingsClose').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

        document.getElementById('setTitleLang').addEventListener('change', (e) => {
            Store.setSetting('titleLang', e.target.value);
            UI.toast('Đã lưu');
        });
        document.getElementById('setTz').addEventListener('change', (e) => {
            const v = e.target.value;
            if (v === 'auto') TZ.detect();
            else TZ.set(parseInt(v));
            Store.setSetting('tzOffset', v === 'auto' ? null : parseInt(v));
            document.getElementById('tzInfo').textContent = TZ.label();
            UI.toast('Múi giờ: ' + TZ.label());
        });
        document.getElementById('setStartPage').addEventListener('change', (e) => {
            Store.setSetting('startPage', e.target.value);
            UI.toast('Đã lưu');
        });
        document.getElementById('setRegion').addEventListener('change', (e) => {
            Store.setSetting('region', e.target.value);
            UI.toast('Đã lưu');
        });
        document.getElementById('setReminder').addEventListener('change', (e) => {
            Store.setSetting('reminderMinutes', parseInt(e.target.value));
            UI.toast('Đã lưu');
        });

        document.getElementById('btnExport').addEventListener('click', () => {
            const data = Store.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'anitime-backup-' + Date.now() + '.json';
            a.click();
            UI.toast('Đã xuất dữ liệu');
        });
        document.getElementById('btnImport').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        Store.importAll(data);
                        UI.toast('Đã nhập dữ liệu thành công');
                        LibraryView.render();
                    } catch (err) {
                        UI.toast('Lỗi: File không hợp lệ');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });
        document.getElementById('btnClearAll').addEventListener('click', () => {
            if (!confirm('Xóa toàn bộ thư viện và cài đặt?')) return;
            Store.clear();
            UI.toast('Đã xóa tất cả');
            LibraryView.render();
            close();
        });
    }

    function close() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('show');
        overlay.innerHTML = '';
    }

    return { open, close };
})();
