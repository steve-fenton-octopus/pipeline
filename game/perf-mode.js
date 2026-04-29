import { deviceLowPerformance } from './device.js';

const STORAGE_KEY = 'pipeline-perf-override';

/** @returns {'auto' | 'full' | 'reduced'} */
export function getPerfOverride() {
    try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === 'full' || v === 'reduced' || v === 'auto') return v;
    } catch {
        /* private mode */
    }
    return 'auto';
}

export function setPerfOverride(mode) {
    try {
        localStorage.setItem(STORAGE_KEY, mode);
    } catch {
        /* ignore */
    }
}

export function cyclePerfOverride() {
    const order = ['auto', 'full', 'reduced'];
    const cur = getPerfOverride();
    const i = Math.max(0, order.indexOf(cur));
    const next = order[(i + 1) % order.length];
    setPerfOverride(next);
    return next;
}

/** Whether reduced visuals should be applied (auto detection + user override). */
export function effectiveLowPerformance() {
    const o = getPerfOverride();
    if (o === 'full') return false;
    if (o === 'reduced') return true;
    return deviceLowPerformance;
}

export function applyPerfModeToDocument() {
    document.body.classList.toggle('reduce-effects', effectiveLowPerformance());
    document.body.dataset.perfOverride = getPerfOverride();
    updatePerfChipHints();
}

function updatePerfChipHints() {
    const chip = document.getElementById('perf-mode-indicator');
    if (!chip) return;

    const o = getPerfOverride();
    const autoWasLow = deviceLowPerformance;
    const low = effectiveLowPerformance();

    const sourceLabel = o === 'auto' ? 'auto' : 'manual';
    const icon = low ? '⚡' : '✨';
    const tierWord = low ? 'Reduced' : 'Full';

    const textEl = chip.querySelector('.perf-chip-text');
    if (textEl) {
        textEl.innerHTML = `${icon} <span class="perf-chip-main">${tierWord}</span> <span class="perf-chip-tag">(${sourceLabel})</span>`;
    }

    let detail;
    if (o === 'auto') {
        detail = autoWasLow
            ? 'Following device detection (reduced).'
            : 'Following device detection (full).';
    } else if (o === 'full') {
        detail = 'You chose full effects; overrides auto.';
    } else {
        detail = 'You chose reduced effects; overrides auto.';
    }

    chip.title = `${detail} Click to cycle: Auto → Full → Reduced.`;

    const prettySource = o === 'auto' ? 'automatic' : 'manual';
    chip.setAttribute(
        'aria-label',
        `Performance: ${tierWord} effects, ${prettySource}. Click to cycle Auto, Full, or Reduced.`
    );
}
