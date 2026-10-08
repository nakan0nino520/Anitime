// js/settings.js

const SettingsView = (() => {

    function open() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;
        overlay.classList.add('show');
        render();
    }

    function close() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;
        overlay.classList.remove('show');
        setTimeout(() => { overlay.innerHTML = ''; }, 400);
    }

    function render() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return;

        const s = typeof Store !== 'undefined' ? Store.getSettings() : {};
        const list = typeof Store !== 'undefined' ? Store.getList() : {};
        const watchCount = Object.keys(list).length;

        overlay.innerHTML = `
            <div class="detail-sheet settings-sheet">
                <div class="detail-grabber"></div>
                <button class="detail-close" id="settingsClose">✕</button>

                <div class="settings-hero">
                    <div class="settings-hero-icon">⚙</div>
                    <h1 class="settings-hero-title">Cài đặt</h1>
                    <p class="settings-hero-sub">${watchCount} anime trong thư viện</p>
                </div>

                <!-- NHÓM 1: GIAO DIỆN -->
                <div class="settings-section">
                    <div class="settings-section-title">🎨 Giao diện</div>

                    <div class="settings-card">
                        <div class="settings-row">
                            <div class="settings-icon-wrap">🌙</div>
                            <div class="settings-text">
                                <div class="settings-label">Chế độ tối</div>
                                <div class="settings-desc">Luôn bật cho trải nghiệm tốt nhất</div>
                            </div>
                            <div class="toggle on locked"><div class="toggle-knob"></div></div>
                        </div>

                        <div class="settings-row">
                            <div class="settings-icon-wrap">🌐</div>
                            <div class="settings-text">
                                <div class="settings-label">Ngôn ngữ tên phim</div>
                                <div class="settings-desc">Romaji / English / 日本語</div>
                            </div>
                            <select class="settings-select" id="setTitleLang">
                                <option value="ROMAJI" ${s.titleLang === 'ROMAJI' ? 'selected' : ''}>Romaji</option>
                                <option value="ENGLISH" ${s.titleLang === 'ENGLISH' ? 'selected' : ''}>English</option>
                                <option value="NATIVE" ${s.titleLang === 'NATIVE' ? 'selected' : ''}>日本語</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- NHÓM 2: LỊCH & THÔNG BÁO -->
                <div class="settings-section">
                    <div class="settings-section-title">📅 Lịch & Thông báo</div>

                    <div class="settings-card">
                        <div class="settings-row">
                            <div class="settings-icon-wrap">🕐</div>
                            <div class="settings-text">
                                <div class="settings-label">Múi giờ</div>
                                <div class="settings-desc">Hiện tại: ${typeof TZ !== 'undefined' ? TZ.label() : 'GMT+7'}</div>
                            </div>
                            <select class="settings-select" id="setTz">
                                <option value="auto" ${s.tzOffset === null || s.tzOffset === undefined ? 'selected' : ''}>Tự động</option>
                                <option value="7" ${s.tzOffset === 7 ? 'selected' : ''}>GMT+7</option>
                                <option value="9" ${s.tzOffset === 9 ? 'selected' : ''}>GMT+9</option>
                                <option value="8" ${s.tzOffset === 8 ? 'selected' : ''}>GMT+8</option>
                                <option value="0" ${s.tzOffset === 0 ? 'selected' : ''}>GMT+0</option>
                                <option value="-5" ${s.tzOffset === -5 ? 'selected' : ''}>GMT-5</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <div class="settings-icon-wrap">🔔</div>
                            <div class="settings-text">
                                <div class="settings-label">Thông báo</div>
                                <div class="settings-desc">Nhắc khi anime sắp phát</div>
                            </div>
                            <div class="toggle ${s.notifications ? 'on' : ''}" id="toggleNotify">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>

                        <div class="settings-row">
                            <div class="settings-icon-wrap">⏰</div>
                            <div class="settings-text">
                                <div class="settings-label">Nhắc trước</div>
                                <div class="settings-desc">Báo trước khi phát sóng</div>
                            </div>
                            <select class="settings-select" id="setReminder">
                                <option value="5" ${s.reminderMinutes === 5 ? 'selected' : ''}>5 phút</option>
                                <option value="15" ${s.reminderMinutes === 15 ? 'selected' : ''}>15 phút</option>
                                <option value="30" ${s.reminderMinutes === 30 ? 'selected' : ''}>30 phút</option>
                                <option value="60" ${s.reminderMinutes === 60 ? 'selected' : ''}>1 giờ</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- NHÓM 3: LỌC & HIỂN THỊ -->
                <div class="settings-section">
                    <div class="settings-section-title">🎯 Lọc & Hiển thị</div>

                    <div class="settings-card">
                        <div class="settings-row">
                            <div class="settings-icon-wrap">❤</div>
                            <div class="settings-text">
                                <div class="settings-label">Chỉ hiện My List</div>
                                <div class="settings-desc">Chỉ hiện anime trong thư viện</div>
                            </div>
                            <div class="toggle ${s.filterMyList ? 'on' : ''}" id="toggleFilterMyList">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>

                        <div class="settings-row">
                            <div class="settings-icon-wrap">🚫</div>
                            <div class="settings-text">
                                <div class="settings-label">Ẩn anime đã bỏ</div>
                                <div class="settings-desc">Không hiện anime đã drop</div>
                            </div>
                            <div class="toggle ${s.hideDropped ? 'on' : ''}" id="toggleHideDropped">
                                <div class="toggle-knob"></div>
                            </div>
                        </div>

                        <div class="settings-row">
                            <div class="settings-icon-wrap">🏠</div>
                            <div class="settings-text">
                                <div class="settings-label">Trang mặc định</div>
                                <div class="settings-desc">Khi mở ứng dụng</div>
                            </div>
                            <select class="settings-select" id="setStartPage">
                                <option value="schedule" ${s.startPage === 'schedule' ? 'selected' : ''}>Lịch</option>
                                <option value="seasonal" ${s.startPage === 'seasonal' ? 'selected' : ''}>Mùa</option>
                                <option value="library" ${s.startPage === 'library' ? 'selected' : ''}>Thư viện</option>
                            </select>
                        </div>

                        <div class="settings-row">
                            <div class="settings-icon-wrap">📍</div>
                            <div class="settings-text">
                                <div class="settings-label">Vùng miền</div>
                                <div class="settings-desc">Link streaming theo khu vực</div>
                            </div>
                            <select class="settings-select" id="setRegion">
                                <option value="VN" ${s.region === 'VN' ? 'selected' : ''}>VN</option>
                                <option value="US" ${s.region === 'US' ? 'selected' : ''}>US</option>
                                <option value="JP" ${s.region === 'JP' ? 'selected' : ''}>JP</option>
                                <option value="GLOBAL" ${s.region === 'GLOBAL' ? 'selected' : ''}>Toàn cầu</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- NHÓM 4: DỮ LIỆU -->
                <div class="settings-section">
                    <div class="settings-section-title">💾 Dữ liệu</div>

                    <div class="settings-card">
                        <button class="settings-action" id="btnExport">
                            <div class="settings-icon-wrap blue">📤</div>
                            <div class="settings-text">
                                <div class="settings-label">Xuất dữ liệu</div>
                                <div class="settings-desc">Sao lưu danh sách và cài đặt</div>
                            </div>
                            <span class="chevron">›</span>
                        </button>

                        <button class="settings-action" id="btnImport">
                            <div class="settings-icon-wrap green">📥</div>
                            <div class="settings-text">
                                <div class="settings-label">Nhập dữ liệu</div>
                                <div class="settings-desc">Khôi phục từ file backup</div>
                            </div>
                            <span class="chevron">›</span>
                        </button>

                        <button class="settings-action" id="btnClearAll">
                            <div class="settings-icon-wrap red">🗑</div>
                            <div class="settings-text">
                                <div class="settings-label" style="color:#ff375f">Xóa toàn bộ dữ liệu</div>
                                <div class="settings-desc">Xóa thư viện và cài đặt</div>
                            </div>
                            <span class="chevron">›</span>
                        </button>
                    </div>
                </div>

                <!-- FOOTER -->
                <div class="settings-footer">
                    <div class="settings-logo">📺</div>
                    <div class="settings-app-name">AniTime</div>
                    <div class="settings-version">Phiên bản 1.0.0</div>
                    <div class="settings-credit">Made with ❤ · Powered by AniList API</div>
                </div>
            </div>
        `;

        bindSettingsEvents();
    }

    function bindSettingsEvents() {
        const settingsClose = document.getElementById('settingsClose');
        if (settingsClose) settingsClose.addEventListener('click', close);

        // CLICK NGOÀI ĐỂ ĐÓNG (Chỉ bind 1 lần)
        const overlay = document.getElementById('modalOverlay');
        if (overlay && !overlay._boundClose) {
            overlay._boundClose = true;
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay && overlay.querySelector('.settings-sheet')) close();
            });
        }

        // NGÔN NGỮ
        const setTitleLang = document.getElementById('setTitleLang');
        if (setTitleLang) {
            setTitleLang.addEventListener('change', (e) => {
                if (typeof Store !== 'undefined') Store.setSetting('titleLang', e.target.value);
                if (typeof UI !== 'undefined') UI.toast('✓ Đã lưu ngôn ngữ');
                if (window.ScheduleView) ScheduleView.render();
            });
        }

        // MÚI GIỜ
        const setTz = document.getElementById('setTz');
        if (setTz) {
            setTz.addEventListener('change', (e) => {
                const v = e.target.value;
                if (typeof TZ !== 'undefined') {
                    if (v === 'auto') {
                        TZ.detect();
                        if (typeof Store !== 'undefined') Store.setSetting('tzOffset', null);
                    } else {
                        TZ.set(parseInt(v));
                        if (typeof Store !== 'undefined') Store.setSetting('tzOffset', parseInt(v));
                    }
                }
                const tzInfo = document.getElementById('tzInfo');
                if (tzInfo && typeof TZ !== 'undefined') tzInfo.textContent = TZ.label();
                if (typeof UI !== 'undefined' && typeof TZ !== 'undefined') UI.toast('✓ Múi giờ: ' + TZ.label());
                if (window.ScheduleView) ScheduleView.render();
            });
        }

        // TOGGLE NOTIFY
        const toggleNotify = document.getElementById('toggleNotify');
        if (toggleNotify) {
            toggleNotify.addEventListener('click', async () => {
                const isOn = toggleNotify.classList.contains('on');
                if (!isOn) {
                    if ('Notification' in window) {
                        const perm = await Notification.requestPermission();
                        if (perm === 'granted') {
                            toggleNotify.classList.add('on');
                            if (typeof Store !== 'undefined') Store.setSetting('notifications', true);
                            if (typeof UI !== 'undefined') UI.toast('✓ Đã bật thông báo');
                        } else {
                            if (typeof UI !== 'undefined') UI.toast('⚠ Cần cấp quyền thông báo');
                        }
                    } else {
                        if (typeof UI !== 'undefined') UI.toast('⚠ Thiết bị không hỗ trợ');
                    }
                } else {
                    toggleNotify.classList.remove('on');
                    if (typeof Store !== 'undefined') Store.setSetting('notifications', false);
                    if (typeof UI !== 'undefined') UI.toast('Đã tắt thông báo');
                }
            });
        }

        // NHẮC TRƯỚC
        const setReminder = document.getElementById('setReminder');
        if (setReminder) {
            setReminder.addEventListener('change', (e) => {
                if (typeof Store !== 'undefined') Store.setSetting('reminderMinutes', parseInt(e.target.value));
                if (typeof UI !== 'undefined') UI.toast('✓ Đã lưu');
            });
        }

        // FILTER MY LIST
        const toggleFilterMyList = document.getElementById('toggleFilterMyList');
        if (toggleFilterMyList) {
            toggleFilterMyList.addEventListener('click', () => {
                toggleFilterMyList.classList.toggle('on');
                const isOn = toggleFilterMyList.classList.contains('on');
                if (typeof Store !== 'undefined') Store.setSetting('filterMyList', isOn);
                if (typeof UI !== 'undefined') UI.toast(isOn ? '✓ Chỉ hiện My List' : '✓ Hiện tất cả');
                if (window.ScheduleView) ScheduleView.render();
            });
        }

        // HIDE DROPPED
        const toggleHideDropped = document.getElementById('toggleHideDropped');
        if (toggleHideDropped) {
            toggleHideDropped.addEventListener('click', () => {
                toggleHideDropped.classList.toggle('on');
                const isOn = toggleHideDropped.classList.contains('on');
                if (typeof Store !== 'undefined') Store.setSetting('hideDropped', isOn);
                if (typeof UI !== 'undefined') UI.toast(isOn ? '✓ Đã ẩn anime bỏ' : '✓ Hiện anime bỏ');
                if (window.ScheduleView) ScheduleView.render();
            });
        }

        // START PAGE
        const setStartPage = document.getElementById('setStartPage');
        if (setStartPage) {
            setStartPage.addEventListener('change', (e) => {
                if (typeof Store !== 'undefined') Store.setSetting('startPage', e.target.value);
                if (typeof UI !== 'undefined') UI.toast('✓ Đã lưu');
            });
        }

        // REGION
        const setRegion = document.getElementById('setRegion');
        if (setRegion) {
            setRegion.addEventListener('change', (e) => {
                if (typeof Store !== 'undefined') Store.setSetting('region', e.target.value);
                if (typeof UI !== 'undefined') UI.toast('✓ Đã lưu vùng');
            });
        }

        // EXPORT
        const btnExport = document.getElementById('btnExport');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                try {
                    if (typeof Store === 'undefined') return;
                    const data = Store.exportAll();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'anitime-backup-' + Date.now() + '.json';
                    a.click();
                    if (typeof UI !== 'undefined') UI.toast('✓ Đã xuất dữ liệu');
                } catch (err) {
                    if (typeof UI !== 'undefined') UI.toast('⚠ Lỗi xuất dữ liệu');
                }
            });
        }

        // IMPORT
        const btnImport = document.getElementById('btnImport');
        if (btnImport) {
            btnImport.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        try {
                            if (typeof Store === 'undefined') return;
                            const data = JSON.parse(ev.target.result);
                            Store.importAll(data);
                            if (typeof UI !== 'undefined') UI.toast('✓ Đã nhập dữ liệu');
                            if (window.LibraryView && typeof LibraryView.render === 'function') LibraryView.render();
                            if (window.ScheduleView && typeof ScheduleView.render === 'function') ScheduleView.render();
                            setTimeout(() => { close(); open(); }, 500);
                        } catch (err) {
                            if (typeof UI !== 'undefined') UI.toast('⚠ File không hợp lệ');
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
            });
        }

        // CLEAR ALL
        const btnClearAll = document.getElementById('btnClearAll');
        if (btnClearAll) {
            btnClearAll.addEventListener('click', () => {
                if (!confirm('⚠ Xóa TOÀN BỘ dữ liệu?\n\nHành động này không thể hoàn tác!')) return;
                if (typeof Store !== 'undefined') Store.clear();
                if (typeof UI !== 'undefined') UI.toast('✓ Đã xóa tất cả');
                if (window.LibraryView && typeof LibraryView.render === 'function') LibraryView.render();
                if (window.ScheduleView && typeof ScheduleView.render === 'function') ScheduleView.render();
                close();
            });
        }
    }

    return { open, close };
})();

window.SettingsView = SettingsView;
