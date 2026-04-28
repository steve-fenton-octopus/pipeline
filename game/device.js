/**
 * Runs a short canvas benchmark to estimate rendering throughput.
 * Draws arcs, gradients, and blended shapes — the same kind of work
 * the game's SVG filters and compositing require — then returns an
 * ops-per-millisecond score.
 */
function measurePerformance() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;

    const iterations = 500;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        // Gradient fill — exercises the rasteriser
        const grad = ctx.createRadialGradient(100, 100, 10, 100, 100, 90);
        grad.addColorStop(0, `hsl(${i % 360}, 80%, 60%)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.5;

        // Arc + fill — exercises compositing
        ctx.beginPath();
        ctx.arc(100 + (i % 50) - 25, 100 + (i % 50) - 25, 40, 0, Math.PI * 2);
        ctx.fill();

        // Shadow blur — closest analogue to SVG feGaussianBlur
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;
        ctx.fillRect(50, 50, 100, 100);
        ctx.shadowBlur = 0;
    }

    const elapsed = performance.now() - start;
    // Clean up
    canvas.width = 0;
    canvas.height = 0;

    // Return ops per millisecond — higher is faster
    return iterations / elapsed;
}

/**
 * Score threshold below which we consider the device "low-performance"
 * and strip expensive visual effects. Determined empirically:
 *   • Modern desktop / laptop  → typically 15 – 80+ ops/ms
 *   • High-end tablet (M-chip) → typically 10 – 25 ops/ms
 *   • Budget phone / old iPad  → typically 1 – 8 ops/ms
 *
 * A threshold of 8 keeps effects enabled on anything that can actually
 * sustain them without dropping frames.
 */
const LOW_PERF_THRESHOLD = 8;

const perfScore = measurePerformance();
export const isLowPerformance = perfScore < LOW_PERF_THRESHOLD;

if (import.meta.env?.DEV || location.hostname === 'localhost') {
    console.debug(
        `[device] perf score: ${perfScore.toFixed(2)} ops/ms → ${isLowPerformance ? 'LOW' : 'HIGH'} fidelity`
    );
}
