// ===== PRO STRIKER - theme.js =====
// Shared "Matchday" visual language for every non-match screen: main menu,
// difficulty/tournament select, pause, stats. Live match rendering (pitch,
// players, ball, scoreboard) is untouched — this only reskins the chrome
// around it. Every primitive here is a pure draw function; call order/state
// (window._xBtn rects etc.) in renderer.js is unchanged, only the visuals are.
console.log('[ProStriker] theme.js loaded');

const Theme = {
    night:    '#0a0e18',
    night2:   '#131b2e',
    gold:     '#ffd76a',
    goldDim:  '#c9a227',
    red:      '#e6432f',
    blue:     '#3d7fd6',
    green:    '#2ecc71',
    chalk:    '#eef2f0',
    chalkDim: 'rgba(238,242,240,0.55)',

    display: (size, weight = 400) => `${weight} ${size}px "Bebas Neue", "Outfit", sans-serif`,
    body:    (size, weight = 600) => `${weight} ${size}px "Outfit", sans-serif`
};

// ----- Backdrop: floodlit stadium at night, replaces the old flat radial menu bg -----
function drawStadiumBackdrop() {
    const g = ctx.createLinearGradient(0, 0, 0, 600);
    g.addColorStop(0, '#0d1424');
    g.addColorStop(0.55, Theme.night);
    g.addColorStop(1, '#05070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 900, 600);

    // Floodlight beams from top corners
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    [{ x: 30, y: -80 }, { x: 870, y: -80 }].forEach(src => {
        const beam = ctx.createRadialGradient(src.x, src.y, 20, src.x, src.y, 480);
        beam.addColorStop(0, 'rgba(255,215,106,0.14)');
        beam.addColorStop(1, 'rgba(255,215,106,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.arc(src.x, src.y, 480, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();

    // Faint oversized pitch centre-circle + halfway markers, abstracted as a
    // stadium-screen background graphic rather than a literal pitch.
    ctx.save();
    ctx.strokeStyle = 'rgba(238,242,240,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(450, 660, 260, Math.PI, Math.PI * 2, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(190, 600); ctx.lineTo(190, 440);
    ctx.moveTo(710, 600); ctx.lineTo(710, 440);
    ctx.moveTo(0, 400); ctx.lineTo(900, 400);
    ctx.stroke();
    ctx.restore();

    // Drifting floodlight dust (reuses the existing menuBgParticles array)
    if (typeof menuBgParticles !== 'undefined') {
        for (let p of menuBgParticles) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = 900; if (p.x > 900) p.x = 0;
            if (p.y < 0) p.y = 600; if (p.y > 600) p.y = 0;
            ctx.beginPath();
            ctx.fillStyle = `rgba(255,215,106,${p.alpha * 0.45})`;
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Vignette
    const vg = ctx.createRadialGradient(450, 280, 180, 450, 300, 560);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 900, 600);
}

// ----- "Kit tag" panel: a card with one clipped corner + gold hairline,
// echoing a jersey number tag / matchday ticket stub instead of a plain
// rounded rectangle. Geometry (x,y,w,h) is always the caller's hit-test rect. -----
function drawKitPanel(x, y, w, h, opts = {}) {
    const clip = opts.clip ?? Math.min(16, h * 0.3);
    const fill = opts.fill ?? 'rgba(255,255,255,0.045)';
    const border = opts.border ?? 'rgba(255,215,106,0.30)';
    const lineWidth = opts.lineWidth ?? 1.5;
    const glow = opts.glow ?? null;
    ctx.save();
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = opts.glowBlur ?? 16; }
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - clip, y);
    ctx.lineTo(x + w, y + clip);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + clip, y + h);
    ctx.lineTo(x, y + h - clip);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = border;
    ctx.stroke();
    ctx.restore();
}

// ----- Section header: Bebas Neue display title + a short gold pitch-line tick -----
function drawSectionHeader(text, x, y, opts = {}) {
    const size = opts.size ?? 40;
    const align = opts.align ?? 'center';
    ctx.save();
    ctx.textAlign = align;
    ctx.fillStyle = opts.color ?? Theme.chalk;
    ctx.font = Theme.display(size);
    ctx.shadowColor = Theme.gold;
    ctx.shadowBlur = 12;
    ctx.fillText(text.toUpperCase(), x, y);
    ctx.shadowBlur = 0;
    if (opts.tick !== false) {
        const tickW = opts.tickWidth ?? 46;
        const cx = align === 'right' ? x - 0 : x;
        ctx.strokeStyle = Theme.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - (align === 'left' ? 0 : tickW / 2), y + 14);
        ctx.lineTo(cx + (align === 'left' ? tickW : tickW / 2), y + 14);
        ctx.stroke();
    }
    if (opts.eyebrow) {
        ctx.fillStyle = Theme.chalkDim;
        ctx.font = Theme.body(12, 700);
        ctx.textAlign = align;
        ctx.fillText(opts.eyebrow.toUpperCase(), x, y - size * 0.62);
    }
    ctx.restore();
}

// ----- Nav button (main menu): kit-tag panel, key glyph + label -----
function drawNavButton(x, y, w, h, keyLabel, label, accent, active = false) {
    drawKitPanel(x, y, w, h, {
        fill: active ? `${accent}22` : 'rgba(255,255,255,0.045)',
        border: active ? accent : 'rgba(255,255,255,0.16)',
        glow: active ? accent : null
    });
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = Theme.display(20);
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 8;
    ctx.fillText(keyLabel, x + 18, y + h / 2 + 7);
    ctx.shadowBlur = 0;
    ctx.fillStyle = Theme.chalk;
    ctx.font = Theme.body(15, 700);
    ctx.fillText(label.toUpperCase(), x + 68, y + h / 2 + 5);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w - 20, y + h / 2 - 9);
    ctx.lineTo(x + w - 20, y + h / 2 + 9);
    ctx.stroke();
    ctx.restore();
}

// ----- Pill button: for stat cards / small choice cards (difficulty, format, back) -----
function drawChoiceCard(x, y, w, h, title, sub, accent, selected = false, opts = {}) {
    drawKitPanel(x, y, w, h, {
        clip: opts.clip ?? 12,
        fill: selected ? `${accent}22` : 'rgba(255,255,255,0.04)',
        border: selected ? accent : 'rgba(255,255,255,0.14)',
        lineWidth: selected ? 2.5 : 1.5,
        glow: selected ? accent : null,
        glowBlur: 14
    });
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = Theme.display(selected ? 26 : 22);
    if (selected) { ctx.shadowColor = accent; ctx.shadowBlur = 12; }
    ctx.fillText(title.toUpperCase(), x + w / 2, y + h * (opts.titleY ?? 0.42));
    ctx.shadowBlur = 0;
    if (sub) {
        ctx.fillStyle = Theme.chalkDim;
        ctx.font = Theme.body(11, 500);
        ctx.fillText(sub, x + w / 2, y + h * (opts.subY ?? 0.62));
    }
    ctx.restore();
}

function drawBackPill(x, y, w, h, label = '← BACK', accent = Theme.chalkDim) {
    drawKitPanel(x, y, w, h, {
        fill: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.2)'
    });
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = Theme.chalk;
    ctx.font = Theme.body(16, 700);
    ctx.fillText(label, x + w / 2, y + h / 2 + 6);
    ctx.restore();
}