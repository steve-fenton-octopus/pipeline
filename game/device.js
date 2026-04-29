/**
 * Device capability for easing animations and SVG filters.
 *
 * A synchronous canvas loop alone often misclassifies machines: it measures
 * burst raster throughput, not compositor frame pacing. Low-spec Linux desktops
 * can still score well on a tiny 200×200 canvas while SVG filters and many
 * CSS animations judder. We combine:
 *
 * 1. Hardware / memory / motion-preference heuristics
 * 2. A sync canvas score with periodic readback (catches slow GPU read paths)
 * 3. requestAnimationFrame sampling with light per-frame canvas work (frame budget)
 */

const SYNC_ITERATIONS = 600;
const FRAME_SAMPLES = 36;
const SKIP_FIRST_FRAMES = 4;

/** Below this ops/ms (after readback stress), treat as low tier. */
const SYNC_LOW_OPS_PER_MS = 12;

/** Frame budget: ~60fps target is 16.7ms; allow modest slack for variance. */
const FRAME_MEAN_MS_BAD = 22;
const FRAME_P95_MS_BAD = 30;
const FRAME_MAX_MS_BAD = 48;
const FRAME_JANK_RATIO_BAD = 0.18;
const JANK_THRESHOLD_MS = 26;

function syncCanvasScore() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const start = performance.now();

    for (let i = 0; i < SYNC_ITERATIONS; i++) {
        const grad = ctx.createRadialGradient(100, 100, 10, 100, 100, 90);
        grad.addColorStop(0, `hsl(${i % 360}, 80%, 60%)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.5;

        ctx.beginPath();
        ctx.arc(100 + (i % 50) - 25, 100 + (i % 50) - 25, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.fillRect(50, 50, 100, 100);
        ctx.shadowBlur = 0;

        // Periodic readback forces GPU sync — weak iGPUs / software paths tank here.
        if (i % 40 === 39) {
            ctx.getImageData(0, 0, 1, 1);
        }
    }

    const elapsed = performance.now() - start;
    canvas.width = 0;
    canvas.height = 0;

    return SYNC_ITERATIONS / Math.max(elapsed, 0.001);
}

function hardwareSignalsLow() {
    const cores = navigator.hardwareConcurrency;
    if (typeof cores === 'number' && cores > 0 && cores <= 2) return true;

    const mem = navigator.deviceMemory;
    if (typeof mem === 'number' && mem <= 3) return true;

    if (typeof matchMedia === 'function') {
        try {
            if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
        } catch {
            /* ignore */
        }
    }

    return false;
}

/**
 * Per-frame work roughly similar to compositing + a bit of raster load.
 * Reuses one canvas for the whole sample window.
 */
function makeFrameStressCtx() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    return { canvas, ctx: canvas.getContext('2d') };
}

function frameStressTick(ctx, frameIndex) {
    if (!ctx) return;
    const f = frameIndex;
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    grad.addColorStop(0, `hsl(${(f * 17) % 360}, 70%, 55%)`);
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#fff';
    ctx.fillRect((f * 13) % 200, (f * 7) % 200, 80, 80);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.fillRect(40, 40, 176, 176);
    ctx.shadowBlur = 0;
    if (f % 6 === 0) ctx.getImageData(0, 0, 2, 2);
}

function analyzeFrameDeltas(deltas) {
    if (deltas.length < 8) return { bad: true, meanMs: 99, p95Ms: 99, maxMs: 99, jankRatio: 1 };

    const trimmed = deltas.slice(SKIP_FIRST_FRAMES);
    const sorted = [...trimmed].sort((a, b) => a - b);
    const sum = trimmed.reduce((a, b) => a + b, 0);
    const meanMs = sum / trimmed.length;
    const p95Ms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    const maxMs = sorted[sorted.length - 1];
    const janks = trimmed.filter((d) => d > JANK_THRESHOLD_MS).length;
    const jankRatio = janks / trimmed.length;

    const bad =
        meanMs > FRAME_MEAN_MS_BAD ||
        p95Ms > FRAME_P95_MS_BAD ||
        maxMs > FRAME_MAX_MS_BAD ||
        jankRatio > FRAME_JANK_RATIO_BAD;

    return { bad, meanMs, p95Ms, maxMs, jankRatio };
}

async function sampleFrameBudget() {
    if (typeof document !== 'undefined' && document.hidden) {
        return { bad: false, meanMs: 16, p95Ms: 18, maxMs: 20, jankRatio: 0, skipped: true };
    }

    const { canvas, ctx } = makeFrameStressCtx();
    if (!ctx) {
        return { bad: true, meanMs: 99, p95Ms: 99, maxMs: 99, jankRatio: 1, skipped: true };
    }

    const deltas = [];
    let prev = performance.now();
    let frameIndex = 0;

    await new Promise((resolve) => {
        function tick(now) {
            const delta = now - prev;
            prev = now;
            if (frameIndex > 0) deltas.push(delta);

            frameStressTick(ctx, frameIndex);
            frameIndex++;

            if (frameIndex <= FRAME_SAMPLES) {
                requestAnimationFrame(tick);
            } else {
                canvas.width = 0;
                canvas.height = 0;
                resolve();
            }
        }
        requestAnimationFrame(tick);
    });

    return analyzeFrameDeltas(deltas);
}

async function assessDevice() {
    const syncOpsPerMs = syncCanvasScore();
    const syncLow = syncOpsPerMs < SYNC_LOW_OPS_PER_MS;
    const hwLow = hardwareSignalsLow();

    let frameStats = { bad: false, meanMs: 0, p95Ms: 0, maxMs: 0, jankRatio: 0 };
    try {
        frameStats = await sampleFrameBudget();
    } catch {
        frameStats = { bad: true, meanMs: 99, p95Ms: 99, maxMs: 99, jankRatio: 1 };
    }

    // Any strong signal opts into reduced effects (better default than judder).
    const isLowPerformance = hwLow || syncLow || frameStats.bad;

    return {
        isLowPerformance,
        syncOpsPerMs,
        syncLow,
        hwLow,
        frameStats,
    };
}

const profile = await assessDevice();

export const isLowPerformance = profile.isLowPerformance;

if (import.meta.env?.DEV || location.hostname === 'localhost') {
    const { syncOpsPerMs, syncLow, hwLow, frameStats } = profile;
    console.debug('[device]', {
        fidelity: isLowPerformance ? 'LOW' : 'HIGH',
        syncOpsPerMs: syncOpsPerMs.toFixed(2),
        syncLow,
        hwLow,
        frames: {
            bad: frameStats.bad,
            meanMs: frameStats.meanMs?.toFixed?.(1) ?? frameStats.meanMs,
            p95Ms: frameStats.p95Ms?.toFixed?.(1) ?? frameStats.p95Ms,
            maxMs: frameStats.maxMs?.toFixed?.(1) ?? frameStats.maxMs,
            jankRatio: frameStats.jankRatio?.toFixed?.(2) ?? frameStats.jankRatio,
        },
    });
}
