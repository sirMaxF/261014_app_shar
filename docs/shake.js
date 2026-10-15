(function (global) {
    'use strict';

    const STANDARDNYYE = {
        porog: 14,
        pauza: 1200,
        vibratsiyaMs: 40,
    };

    let param = { ...STANDARDNYYE };
    let rabotaet = false;
    let posledniyX = 0, posledniyY = 0, posledniyZ = 0;
    let posledneeVibratsiya = 0;

    function obrabotkaDvizheniya(e) {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;

        const delta =
            Math.abs(a.x - posledniyX) +
            Math.abs(a.y - posledniyY) +
            Math.abs(a.z - posledniyZ);

        const teper = Date.now();
        if (delta > param.porog && teper - posledneeVibratsiya > param.pauza) {
            posledneeVibratsiya = teper;
            vypolnitVibratsiyu({ delta, x: a.x, y: a.y, z: a.z });
        }
        posledniyX = a.x; posledniyY = a.y; posledniyZ = a.z;
    }

    function vypolnitVibratsiyu(detail) {
        if (param.vibratsiyaMs > 0 && navigator.vibrate) {
            navigator.vibrate(param.vibratsiyaMs);
        }
        global.dispatchEvent(new CustomEvent('vzryv', { detail }));
    }

    const Vibratsiya = {
        async vklyuchit(userOptions = {}) {
            param = { ...STANDARDNYYE, ...userOptions };
            if (rabotaet) return true;

            if (
                typeof DeviceMotionEvent !== 'undefined' &&
                typeof DeviceMotionEvent.requestPermission === 'function'
            ) {
                try {
                    const res = await DeviceMotionEvent.requestPermission();
                    if (res !== 'granted') return false;
                } catch (err) {
                    return false;
                }
            }

            if (typeof DeviceMotionEvent === 'undefined') return false;

            global.addEventListener('devicemotion', obrabotkaDvizheniya);
            rabotaet = true;
            return true;
        },

        vyklyuchit() {
            if (!rabotaet) return;
            global.removeEventListener('devicemotion', obrabotkaDvizheniya);
            rabotaet = false;
        },

        isRunning: () => rabotaet,

        spustit(detail = { manual: true }) {
            vypolnitVibratsiyu(detail);
        },

        zadatParametry(o) { param = { ...param, ...o }; },
    };

    global.Vibratsiya = Vibratsiya;
})(window);