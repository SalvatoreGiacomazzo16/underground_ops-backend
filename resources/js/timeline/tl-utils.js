// ================================
// 02_UTILS.JS
// Funzioni matematiche e Helper puri
// ================================

import { CONFIG } from './tl-config.js';

export function snapToUnit(minutes, unit = CONFIG.UNIT_MINUTES) {
    return Math.round(minutes / unit) * unit;
}

export function minutesToPixels(minutes) {
    return (minutes / CONFIG.UNIT_MINUTES) * CONFIG.SLOT_HEIGHT;
}


export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function generateId() {
    return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Coordinate Helper
export function getCanvasRelativeY(clientY, canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    return clientY - rect.top;
}



