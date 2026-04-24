/**
 * Shared device-capability flags.
 * Import from here rather than re-detecting per module.
 */
export const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
