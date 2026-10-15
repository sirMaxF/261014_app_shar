// shake.js — универсальный детектор встряхивания
// Работает через devicemotion. Опционально — через Accelerometer API.

(function (global) {
    'use strict';

    const DEFAULTS = {
        threshold: 15,      // порог суммы дельт по осям
        cooldown: 1000,     // мс между срабатываниями
        vibrateMs: 200,     // длительность вибрации (0 = выкл)
    };

    let opts = { ...DEFAULTS };
    let running = false;
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastShakeTime = 0;

    // ── ядро: анализ данных акселерометра ──
    function handleMotion(e) {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;

        const delta =
            Math.abs(a.x - lastX) +
            Math.abs(a.y - lastY) +
            Math.abs(a.z - lastZ);

        const now = Date.now();

        if (delta > opts.threshold && now - lastShakeTime > opts.cooldown) {
            lastShakeTime = now;
            fireShake({ delta, x: a.x, y: a.y, z: a.z });
        }

        lastX = a.x; lastY = a.y; lastZ = a.z;
    }

    function fireShake(detail) {
        if (opts.vibrateMs > 0 && navigator.vibrate) {
            navigator.vibrate(opts.vibrateMs);
        }
        global.dispatchEvent(new CustomEvent('shake', { detail }));
    }

    // ── публичное API ──
    const Shake = {
        async enable(userOptions = {}) {
            opts = { ...DEFAULTS, ...userOptions };

            if (running) return true;

            // Android 13+ / iOS 13+: нужно разрешение из user gesture
            if (
                typeof DeviceMotionEvent !== 'undefined' &&
                typeof DeviceMotionEvent.requestPermission === 'function'
            ) {
                try {
                    const res = await DeviceMotionEvent.requestPermission();
                    if (res !== 'granted') {
                        console.warn('[shake] permission denied');
                        return false;
                    }
                } catch (err) {
                    console.warn('[shake] permission error', err);
                    return false;
                }
            }

            if (typeof DeviceMotionEvent === 'undefined') {
                console.warn('[shake] DeviceMotionEvent not supported');
                return false;
            }

            global.addEventListener('devicemotion', handleMotion);
            running = true;
            console.log('[shake] enabled', opts);
            return true;
        },

        disable() {
            if (!running) return;
            global.removeEventListener('devicemotion', handleMotion);
            running = false;
            console.log('[shake] disabled');
        },

        isRunning() {
            return running;
        },

        // ручной вызов для тестов (например, кнопкой)
        trigger(detail = { manual: true }) {
            fireShake(detail);
        },

        setOptions(newOpts) {
            opts = { ...opts, ...newOpts };
        },
    };

    global.Shake = Shake;
})(window);