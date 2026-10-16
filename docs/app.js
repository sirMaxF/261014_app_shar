(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const elPredskazanie = $('predskazanie');
    const elShar = $('shar');
    const elPodskazka = $('podskazka');
    const knopka = $('knopka');
    const canvasFon = $('fon');

    const LS_KEY = 'magicball.shakeEnabled';

    // ── фон: множество мелких шариков на canvas ──
    const ctx = canvasFon.getContext('2d');
    let shari = [];
    let shir = 0, vys = 0, DPR = 1;

    const TSVETY = ['#4be1c3', '#4b9de1', '#9b4be1', '#7ad9ff', '#b06bff'];

    function izmenitRazmer() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        shir = canvasFon.width = Math.floor(innerWidth * DPR);
        vys = canvasFon.height = Math.floor(innerHeight * DPR);
        canvasFon.style.width = innerWidth + 'px';
        canvasFon.style.height = innerHeight + 'px';
    }

    function sozdatShari() {
        const kolichestvo = Math.min(90, Math.floor((innerWidth * innerHeight) / 9000));
        shari = [];
        for (let i = 0; i < kolichestvo; i++) {
            // медленный дрейф: 0.3–0.7 px/кадр, случайное направление
            const ugol = Math.random() * Math.PI * 2;
            const skorost = (0.3 + Math.random() * 0.4) * DPR;
            shari.push({
                x: Math.random() * shir,
                y: Math.random() * vys,
                r: (Math.random() * 3 + 1.5) * DPR,
                vx: Math.cos(ugol) * skorost,
                vy: Math.sin(ugol) * skorost,
                tsvet: TSVETY[(Math.random() * TSVETY.length) | 0],
                alfa: 0.25 + Math.random() * 0.5,
            });
        }
    }

    const BYSKOST = 0.5;   // базовая скорость дрейфа, px/кадр (до DPR)

    function risovat() {
        ctx.clearRect(0, 0, shir, vys);
        for (const b of shari) {
            // очень слабое трение
            b.vx *= 0.999;
            b.vy *= 0.999;

            // подтягиваем модуль скорости к базовому, направление сохраняем
            const sp = Math.hypot(b.vx, b.vy);
            if (sp > 0.0001) {
                const cel = BYSKOST * DPR;
                const k = sp > cel ? 0.98 : 1.02;
                b.vx *= k;
                b.vy *= k;
            } else {
                // если случайно остановился — толкаем в случайную сторону
                const ugol = Math.random() * Math.PI * 2;
                b.vx = Math.cos(ugol) * BYSKOST * DPR;
                b.vy = Math.sin(ugol) * BYSKOST * DPR;
            }

            b.x += b.vx;
            b.y += b.vy;

            // отражение от краёв
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); }
            if (b.x > shir - b.r) { b.x = shir - b.r; b.vx = -Math.abs(b.vx); }
            if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); }
            if (b.y > vys - b.r) { b.y = vys - b.r; b.vy = -Math.abs(b.vy); }

            ctx.globalAlpha = b.alfa;
            ctx.fillStyle = b.tsvet;
            ctx.shadowColor = b.tsvet;
            ctx.shadowBlur = 12 * DPR;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        requestAnimationFrame(risovat);
    }

    // ── импульс от встряхивания: разлетаются и мерцают ──
    function vzryv(sil) {
        const p = Math.min(Math.max(sil || 1, 0.5), 4);
        for (const b of shari) {
            const ugol = Math.random() * Math.PI * 2;
            const skorost = (2 + Math.random() * 6) * p * DPR;
            b.vx += Math.cos(ugol) * skorost;
            b.vy += Math.sin(ugol) * skorost;
            b.alfa = Math.min(1, b.alfa + 0.3);
        }
    }

    // ── предсказание ──
    let posledniyIndex = -1;

    function vybratPredskazanie() {
        const massiv = window.PREDSKAZANIYA || ["..."];
        if (massiv.length === 1) return massiv[0];
        let i = posledniyIndex;
        // не повторяем то же самое дважды подряд
        while (i === posledniyIndex) {
            i = (Math.random() * massiv.length) | 0;
        }
        posledniyIndex = i;
        return massiv[i];
    }

    function pokazatPredskazanie() {
        elPredskazanie.classList.remove('pokazano');
        // перезапуск анимации
        void elPredskazanie.offsetWidth;

        elShar.classList.add('puls');
        setTimeout(() => elShar.classList.remove('puls'), 1000);
        setTimeout(() => {
            elPredskazanie.classList.add('pokazano');
            elPredskazanie.textContent = vybratPredskazanie()
        }, 1000);
    }

    // ── события ──
    window.addEventListener('vzryv', (e) => {
        if (!Vibratsiya.isRunning()) return;
        const sil = e.detail?.delta ? e.detail.delta / 20 : 1;
        vzryv(sil);
        pokazatPredskazanie();
    });

    knopka.addEventListener('click', async () => {
        if (!Vibratsiya.isRunning()) {
            const ok = await Vibratsiya.vklyuchit();
            if (ok) {
                try { localStorage.setItem(LS_KEY, '1'); } catch { }
                elPodskazka.textContent = 'Трясите телефон или нажмите ещё раз';
                knopka.textContent = 'Спросить';
            } else {
                try { localStorage.removeItem(LS_KEY); } catch { }
                elPodskazka.textContent = 'Нет доступа к сенсорам — нажмите ещё раз';
                return;
            }
        }
        vzryv(2);
        pokazatPredskazanie();
    });

    // ── init ──
    izmenitRazmer();
    sozdatShari();
    risovat();

    window.addEventListener('resize', () => {
        izmenitRazmer();
        sozdatShari();
    });

    // автовключение при повторных запусках, если разрешение уже выдавалось
    (async () => {
        let flag = false;
        try { flag = localStorage.getItem(LS_KEY) === '1'; } catch { }

        if (flag) {
            const ok = await Vibratsiya.vklyuchit();
            if (ok) {
                elPodskazka.textContent = 'Трясите телефон или нажимайте кнопку';
                knopka.textContent = 'Спросить';
                return;
            }
            try { localStorage.removeItem(LS_KEY); } catch { }
        }

        elPodskazka.textContent = 'Нажмите «Активировать», чтобы включить шар';
        knopka.textContent = 'Активировать';
    })();
})();