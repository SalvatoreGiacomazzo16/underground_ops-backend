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

export function pixelsToMinutes(px) {
    return (px / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;
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

function hasBlockCollision(blocks, start, duration) {
    return blocks.some(b => {
        const bStart = b.tStart;
        const bEnd = b.tStart + b.duration;

        return start < bEnd && start + duration > bStart;
    });
}
//FUNZIONE BLOCCO FINE CANVAS
export function findNearestFreeStart({
    blocks,
    clickedMinute,
    minDuration,
    timelineEnd
}) {
    if (!Array.isArray(blocks)) return null;

    const gap = findGapForMinute(blocks, clickedMinute, timelineEnd);
    if (!gap) return null;

    const gapSize = gap.end - gap.start;
    if (gapSize < minDuration) return null;

    // start candidato clampato nel gap
    const idealStart = clamp(
        clickedMinute,
        gap.start,
        gap.end - minDuration
    );

    // 🔒 GUARDIA FONDAMENTALE: collisione reale
    const collision = hasBlockCollision(
        blocks,
        idealStart,
        minDuration
    );

    if (collision) return null;

    return idealStart;
}


function findGapForMinute(blocks, minute, timelineEnd) {
    const sorted = [...blocks].sort((a, b) => a.tStart - b.tStart);

    let prevEnd = 0;

    for (const b of sorted) {
        if (minute >= prevEnd && minute <= b.tStart) {
            return {
                start: prevEnd,
                end: b.tStart
            };
        }
        prevEnd = b.tStart + b.duration;
    }

    // gap finale
    if (minute >= prevEnd && minute <= timelineEnd) {
        return {
            start: prevEnd,
            end: timelineEnd
        };
    }

    return null;
}

//Delete gauge only client
export function bindHoldAction({
    element,
    duration = 1200,
    onConfirm,
    onCancel
}) {
    let timer = null;

    const start = (e) => {
        e.preventDefault();
        e.stopPropagation();

        element.classList.add('holding');
        element.style.setProperty('--holdTime', duration + 'ms');

        timer = setTimeout(() => {
            onConfirm?.();
            cleanup();
        }, duration);
    };

    const stop = () => {
        if (!timer) return;
        onCancel?.();
        cleanup();
    };

    const cleanup = () => {
        clearTimeout(timer);
        timer = null;
        element.classList.remove('holding');
    };

    element.addEventListener('pointerdown', start);
    element.addEventListener('pointerup', stop);
    element.addEventListener('pointerleave', stop);
}

// helper semplice per evitare XSS nei title / html
export function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// ----------------
// Collision Handling (timeline normalizzata)
// ----------------
export function getCollisionLimits({
    blocks,
    activeId,
    timelineMinutes
}) {
    const activeBlock = blocks.find(b => b.id === activeId);

    let minStart = 0;
    let maxEnd = timelineMinutes;

    if (!activeBlock) return { minStart, maxEnd };

    blocks.forEach(other => {
        if (other.id === activeId) return;

        if (other.tStart + other.duration <= activeBlock.tStart) {
            minStart = Math.max(minStart, other.tStart + other.duration);
        }

        if (other.tStart >= activeBlock.tStart + activeBlock.duration) {
            maxEnd = Math.min(maxEnd, other.tStart);
        }
    });

    return { minStart, maxEnd };
}

export function minutesToHHMM(totalMinutes) {
    const m = Math.max(0, Math.floor(totalMinutes));
    const hh = Math.floor(m / 60) % 24;
    const mm = m % 60;

    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function deleteBlock({
    blocks,
    blockId
}) {
    return blocks.filter(b => b.id !== blockId);
}







