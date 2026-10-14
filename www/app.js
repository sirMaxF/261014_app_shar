// app.js — UI-обвязка для теста
(function () {
    const $ = (id) => document.getElementById(id);

    const statusEl = $('status');
    const btnEnable = $('btn-enable');
    const btnDisable = $('btn-disable');
    const btnManual = $('btn-manual');
    const btnClear = $('btn-clear');
    const inpThreshold = $('inp-threshold');
    const inpCooldown = $('inp-cooldown');
    const lblThreshold = $('lbl-threshold');
    const lblCooldown = $('lbl-cooldown');
    const logEl = $('log');
    const lastShakeEl = $('last-shake');

    let shakeCount = 0;

    function log(msg) {
        const t = new Date().toLocaleTimeString();
        logEl.textContent += `[${t}] ${msg}\n`;
        logEl.scrollTop = logEl.scrollHeight;
    }

    function setStatus(on) {
        statusEl.textContent = on ? 'включено' : 'выключено';
        statusEl.className = on ? 'on' : 'off';
        btnEnable.disabled = on;
        btnDisable.disabled = !on;
    }

    // ── события от детектора ──
    window.addEventListener('shake', (e) => {
        shakeCount++;
        const d = e.detail || {};
        const info = `shake #${shakeCount}  delta=${(d.delta ?? 0).toFixed(2)}  x=${(d.x ?? 0).toFixed(2)} y=${(d.y ?? 0).toFixed(2)} z=${(d.z ?? 0).toFixed(2)}`;
        log(info);
        lastShakeEl.textContent = `${shakeCount} (${new Date().toLocaleTimeString()})`;

        // визуальный фидбек
        document.body.classList.add('shaking');
        setTimeout(() => document.body.classList.remove('shaking'), 300);
    });

    // ── кнопки ──
    btnEnable.addEventListener('click', async () => {
        log('запрос разрешения…');
        const ok = await window.Shake.enable({
            threshold: Number(inpThreshold.value),
            cooldown: Number(inpCooldown.value),
        });
        if (ok) {
            log('детектор включён');
            setStatus(true);
        } else {
            log('не удалось включить (разрешение или нет поддержки)');
            setStatus(false);
        }
    });

    btnDisable.addEventListener('click', () => {
        window.Shake.disable();
        log('детектор выключен');
        setStatus(false);
    });

    btnManual.addEventListener('click', () => {
        window.Shake.trigger();
        log('ручной триггер');
    });

    btnClear.addEventListener('click', () => {
        logEl.textContent = '';
        shakeCount = 0;
        lastShakeEl.textContent = '—';
    });

    // ── настройки ──
    inpThreshold.addEventListener('input', () => {
        lblThreshold.textContent = inpThreshold.value;
        window.Shake.setOptions({ threshold: Number(inpThreshold.value) });
    });

    inpCooldown.addEventListener('input', () => {
        lblCooldown.textContent = inpCooldown.value;
        window.Shake.setOptions({ cooldown: Number(inpCooldown.value) });
    });

    // ── диагностика окружения ──
    log('user-agent: ' + navigator.userAgent);
    log('devicemotion: ' + ('DeviceMotionEvent' in window ? 'есть' : 'нет'));
    log('vibrate: ' + ('vibrate' in navigator ? 'есть' : 'нет'));
    log('requestPermission: ' + (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function' ? 'есть' : 'нет'));
})();