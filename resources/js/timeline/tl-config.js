// ================================
// 01_CONFIG.JS
// Configurazioni e Costanti Globali
// ================================

// MOCK CONTEXT (Simuliamo ciò che Blade inietterà)
export const CTX = window.UO_CONTEXT || {
    userId: 'guest_user',
    eventId: 'demo_event_01'
};

// CONFIG = SOLO DATI STATICI
export const CONFIG = {
    UNIT_MINUTES: 15,
    SLOT_HEIGHT: 20,
    DEFAULT_DURATION: 60,
    SCROLL_SPEED: 12,
    SCROLL_THRESHOLD: 50
};

// PALETTE
export const NEON_PALETTE = [
    '#ff00ff',
    '#04D9FF',
    '#9d00ff',
    '#ff9900',
    '#d9b802',
    '#39ff14'
];
