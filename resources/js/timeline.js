// ================================
// Timeline Ops — Core Constants
// ================================

const UNIT_MINUTES = 15;
const SLOT_HEIGHT = 20;
const RANGE_START_MINUTES = 12 * 60; // 12:00 = 720

// ================================
// Core Math
// ================================

function snapToUnit(minutes, unit = UNIT_MINUTES) {
    return Math.round(minutes / unit) * unit;
}

function minutesToPixels(minutes) {
    return (minutes / UNIT_MINUTES) * SLOT_HEIGHT;
}

// ================================
// Timeline Ops — Time Slots Generator
// ================================

export function generateTimeSlots({
    startHour = 12,
    endHour = 6,
    unitMinutes = 15
} = {}) {
    const slots = [];

    const rangeStartMinutes = startHour * 60;
    const rangeEndMinutes =
        (endHour <= startHour ? 24 + endHour : endHour) * 60;

    const totalDuration = rangeEndMinutes - rangeStartMinutes;
    const slotsCount = totalDuration / unitMinutes;

    for (let i = 0; i < slotsCount; i++) {
        const absoluteMinutes = rangeStartMinutes + i * unitMinutes;

        const isHour = absoluteMinutes % 60 === 0;
        const displayHour = Math.floor(absoluteMinutes / 60) % 24;

        slots.push({
            index: i,
            isHour,
            displayHour: isHour ? String(displayHour).padStart(2, '0') : null
        });
    }

    return slots;
}

// ================================
// DOM Ready — Interaction Engine
// ================================

document.addEventListener('DOMContentLoaded', () => {

    // ----------------
    // Utilities
    // ----------------
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // ----------------
    // References
    // ----------------
    const canvas = document.querySelector('.uo-timeline-canvas');
    const ghost = document.querySelector('.uo-timeline-ghost');
    const scroller = document.querySelector('.uo-timeline-body');

    if (!canvas) {
        console.warn('Timeline canvas not found');
        return;
    }

    // ----------------
    // Config
    // ----------------
    const DEFAULT_DURATION = 60;

    // ----------------
    // State — Data
    // ----------------
    let blocks = [
        { id: 'b1', tStart: 777, duration: 118, label: 'DJ SET', color: '#c9169a' },
        { id: 'b2', tStart: 842, duration: 97, label: 'LIVE', color: '#8f2cf4' },
        { id: 'b3', tStart: 915, duration: 183, label: 'AFTER', color: '#ff7ad9' }
    ];

    // ----------------
    // State — Runtime
    // ----------------
    let activeBlockId = null;
    let isDragging = false;
    let isResizing = false;

    let isContextMenuOpen = false;

    let lastClientY = null;
    let currentGhostY = null;

    let dragStartY = 0;
    let initialBlockTop = 0;
    let initialBlockHeight = 0;
    let activeElement = null;

    // ----------------
    // Context Menu Handling
    // ----------------
    canvas.addEventListener('contextmenu', () => {
        isContextMenuOpen = true;
    });

    // ----------------
    // Helpers
    // ----------------
    function generateId() {
        return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // ----------------
    // Rendering
    // ----------------
    function renderBlocks() {
        canvas.querySelectorAll('.uo-timeline-block').forEach(el => el.remove());

        blocks.forEach(block => {
            const snappedStart = snapToUnit(block.tStart);
            const snappedDuration = snapToUnit(block.duration);

            const relativeStart = snappedStart - RANGE_START_MINUTES;
            if (relativeStart < 0) return;

            const top = minutesToPixels(relativeStart);
            const height = minutesToPixels(snappedDuration);

            const el = document.createElement('div');
            el.className = 'uo-timeline-block';
            el.dataset.blockId = block.id;

            if (block.id === activeBlockId) {
                el.classList.add('is-active');
            }

            el.style.top = `${top}px`;
            el.style.height = `${height}px`;
            el.style.backgroundColor = block.color;

            el.innerHTML = `
                <div class="uo-block-content">
                    <span class="uo-block-label">${block.label}</span>
                    <span class="uo-block-meta">${snappedDuration} min</span>
                </div>
                <div class="uo-resizer"></div>
            `;

            canvas.appendChild(el);
        });
    }

    renderBlocks();

    // ----------------
    // Ghost Logic (Source of Truth)
    // ----------------
    function updateGhostPosition(clientY) {
        if (!ghost) return;

        if (isDragging || isResizing || clientY === null) {
            ghost.style.opacity = '0';
            currentGhostY = null;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const scrollTop = scroller ? scroller.scrollTop : 0;

        const rawY = (clientY - rect.top) + scrollTop;
        const maxY = canvas.scrollHeight;

        const clampedY = clamp(rawY, 0, maxY);
        const snappedY = Math.round(clampedY / SLOT_HEIGHT) * SLOT_HEIGHT;

        currentGhostY = snappedY;
        ghost.style.top = `${snappedY}px`;
        ghost.style.opacity = '1';
    }

    // ----------------
    // Scroll sync
    // ----------------
    if (scroller) {
        scroller.addEventListener('scroll', () => {
            if (lastClientY !== null) {
                updateGhostPosition(lastClientY);
            }
        }, { passive: true });
    }

    // ----------------
    // Collision Handling — Phase 1
    // ----------------
    function getCollisionLimits(activeId) {
        const activeBlock = blocks.find(b => b.id === activeId);

        let minStart = RANGE_START_MINUTES;
        const timelineMinutes =
            (canvas.scrollHeight / SLOT_HEIGHT) * UNIT_MINUTES;
        let maxEnd = RANGE_START_MINUTES + timelineMinutes;

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

    // ----------------
    // Pointer Down
    // ----------------
    canvas.addEventListener('pointerdown', (e) => {

        // Consume first click after context menu
        if (
            isContextMenuOpen &&
            e.pointerType === 'mouse' &&
            e.button === 0
        ) {
            isContextMenuOpen = false;
            return;
        }

        // Block right & middle click
        if (e.pointerType === 'mouse' && e.button !== 0) {
            return;
        }

        const targetBlock = e.target.closest('.uo-timeline-block');
        const targetResizer = e.target.closest('.uo-resizer');

        const rect = canvas.getBoundingClientRect();
        const scrollTop = scroller ? scroller.scrollTop : 0;
        const rawY = (e.clientY - rect.top) + scrollTop;

        if (ghost) ghost.style.opacity = '0';

        // --- RESIZE ---
        if (targetResizer && targetBlock) {
            e.preventDefault();
            isResizing = true;
            activeElement = targetBlock;
            activeBlockId = targetBlock.dataset.blockId;

            targetResizer.setPointerCapture(e.pointerId);

            dragStartY = rawY;
            initialBlockHeight = parseFloat(targetBlock.style.height);
            initialBlockTop = parseFloat(targetBlock.style.top);

            renderBlocks();
            return;
        }

        // --- DRAG / DELETE ---
        if (targetBlock) {
            if (e.altKey) {
                blocks = blocks.filter(b => b.id !== targetBlock.dataset.blockId);
                activeBlockId = null;
                renderBlocks();
                return;
            }

            e.preventDefault();
            isDragging = true;
            activeElement = targetBlock;
            activeBlockId = targetBlock.dataset.blockId;

            targetBlock.setPointerCapture(e.pointerId);

            dragStartY = rawY;
            initialBlockTop = parseFloat(targetBlock.style.top);

            renderBlocks();
            return;
        }

        // --- CREATE ---
        if (currentGhostY === null) return;

        activeBlockId = null;

        const minutesFromStart =
            (currentGhostY / SLOT_HEIGHT) * UNIT_MINUTES;

        const newBlock = {
            id: generateId(),
            tStart: RANGE_START_MINUTES + minutesFromStart,
            duration: snapToUnit(DEFAULT_DURATION),
            label: 'NEW SLOT',
            color: '#c9169a'
        };

        blocks.push(newBlock);
        activeBlockId = newBlock.id;
        renderBlocks();
    });

    // ----------------
    // Pointer Move
    // ----------------
    canvas.addEventListener('pointermove', (e) => {
        lastClientY = e.clientY;

        if (!isDragging && !isResizing) {
            updateGhostPosition(lastClientY);
            return;
        }

        if (!activeElement) return;

        const rect = canvas.getBoundingClientRect();
        const scrollTop = scroller ? scroller.scrollTop : 0;
        const currentRawY = (e.clientY - rect.top) + scrollTop;
        const deltaY = currentRawY - dragStartY;

        const limits = getCollisionLimits(activeBlockId);

        // --- RESIZE ---
        if (isResizing) {
            let newHeightRaw = initialBlockHeight + deltaY;
            let snappedHeight = Math.round(newHeightRaw / SLOT_HEIGHT) * SLOT_HEIGHT;

            const currentStart =
                RANGE_START_MINUTES +
                (initialBlockTop / SLOT_HEIGHT) * UNIT_MINUTES;

            const futureDuration =
                (snappedHeight / SLOT_HEIGHT) * UNIT_MINUTES;

            const maxAllowedDuration = limits.maxEnd - currentStart;

            let clampedDuration = Math.min(futureDuration, maxAllowedDuration);
            clampedDuration = Math.max(clampedDuration, UNIT_MINUTES);

            activeElement.style.height =
                `${minutesToPixels(clampedDuration)}px`;
        }

        // --- DRAG ---
        if (isDragging) {
            let newTopRaw = initialBlockTop + deltaY;
            let snappedTop = Math.round(newTopRaw / SLOT_HEIGHT) * SLOT_HEIGHT;

            const activeBlock = blocks.find(b => b.id === activeBlockId);
            const duration = activeBlock ? activeBlock.duration : DEFAULT_DURATION;

            const futureStart =
                RANGE_START_MINUTES +
                (snappedTop / SLOT_HEIGHT) * UNIT_MINUTES;

            const minAllowedStart = limits.minStart;
            const maxAllowedStart = limits.maxEnd - duration;

            const clampedStart =
                clamp(futureStart, minAllowedStart, maxAllowedStart);

            activeElement.style.top =
                `${minutesToPixels(clampedStart - RANGE_START_MINUTES)}px`;
        }
    });

    // ----------------
    // Pointer Leave
    // ----------------
    canvas.addEventListener('pointerleave', () => {
        lastClientY = null;
        currentGhostY = null;
        if (ghost) ghost.style.opacity = '0';
    });

    // ----------------
    // Pointer Up
    // ----------------
    canvas.addEventListener('pointerup', () => {
        if (!isDragging && !isResizing) return;

        if (activeElement) {
            const id = activeElement.dataset.blockId;
            const index = blocks.findIndex(b => b.id === id);

            if (index > -1) {
                const finalTop = parseFloat(activeElement.style.top);
                const finalHeight = parseFloat(activeElement.style.height);

                blocks[index].tStart =
                    RANGE_START_MINUTES +
                    (finalTop / SLOT_HEIGHT) * UNIT_MINUTES;

                blocks[index].duration =
                    (finalHeight / SLOT_HEIGHT) * UNIT_MINUTES;
            }
        }

        isDragging = false;
        isResizing = false;
        activeElement = null;

        renderBlocks();

        if (lastClientY !== null) {
            updateGhostPosition(lastClientY);
        }
    });
});
