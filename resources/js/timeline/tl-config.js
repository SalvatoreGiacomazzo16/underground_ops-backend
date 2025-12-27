// ================================
// 01_CONFIG.JS
// Configurazioni e Costanti Globali
// ================================

// MOCK CONTEXT (Simuliamo ciò che Blade inietterà)
// In produzione: window.UO_CONTEXT fornito dal backend
export const CTX = window.UO_CONTEXT || {
    userId: 'guest_user',
    eventId: 'demo_event_01'
};

export const CONFIG = {
    UNIT_MINUTES: 15,
    SLOT_HEIGHT: 20,
    RANGE_START_MINUTES: 12 * 60, // 12:00
    DEFAULT_DURATION: 60,
    SCROLL_SPEED: 12,
    SCROLL_THRESHOLD: 50
};

export const NEON_PALETTE = [
    '#ff00ff', // Magenta Neon
    '#04D9FF', // Cyan Neon
    '#9d00ff', // Purple Neon
    '#ff9900', // Orange Neon
    '#d9b802', // Gold/Dark Yellow
    '#39ff14'  // Green Neon
];
