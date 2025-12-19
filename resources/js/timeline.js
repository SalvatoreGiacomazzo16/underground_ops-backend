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

    // --- Utilities ---
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // --- References ---
    const canvas = document.querySelector('.uo-timeline-canvas');
    const ghost = document.querySelector('.uo-timeline-ghost');
    const scroller = document.querySelector('.uo-timeline-body');

    if (!canvas) {
        console.warn('Timeline canvas not found');
        return;
    }

    // --- Config ---
    const DEFAULT_DURATION = 60;

    // --- State: Data ---
    let blocks = [
        { id: 'b1', tStart: 777, duration: 118, label: 'DJ SET', color: '#c9169a' },
        { id: 'b2', tStart: 842, duration: 97, label: 'LIVE', color: '#8f2cf4' },
        { id: 'b3', tStart: 915, duration: 183, label: 'AFTER', color: '#ff7ad9' }
    ];

    // --- State: Runtime Interaction ---
    let activeBlockId = null;
    let isDragging = false;
    let isResizing = false;

    // Tracking per Ghost + Scroll Sync
    let lastClientY = null;
    let currentGhostY = null; // FIX: Source of truth per il posizionamento

    // Variabili temporanee per Drag/Resize
    let dragStartY = 0;
    let initialBlockTop = 0;
    let initialBlockHeight = 0;
    let activeElement = null;

    // ================================
    // Helper: ID Generator
    // ================================
    function generateId() {
        return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }

    // ================================
    // Rendering System
    // ================================
    function renderBlocks() {
        // Rimuovi blocchi esistenti
        canvas.querySelectorAll('.uo-timeline-block').forEach(el => el.remove());

        blocks.forEach(block => {
            const snappedStart = snapToUnit(block.tStart);
            const snappedDuration = snapToUnit(block.duration);

            const relativeStart = snappedStart - RANGE_START_MINUTES;
            if (relativeStart < 0) return; // Fuori range

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

            // Markup interno strutturato
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

    // First paint
    renderBlocks();

    // ================================
    // Core Logic: GHOST POSITIONING
    // ================================
    function updateGhostPosition(clientY) {
        if (!ghost) return;

        // Se stiamo draggando/resizzando o il mouse è fuori, nascondi ghost
        if (isDragging || isResizing || clientY === null) {
            ghost.style.opacity = '0';
            currentGhostY = null; // Reset per sicurezza
            return;
        }

        const rect = canvas.getBoundingClientRect();

        // Calcolo Y relativo al canvas (senza scrollTop perché rect.top cambia con lo scroll)
        const rawY = (clientY - rect.top);

        const maxY = canvas.scrollHeight;
        const clampedY = clamp(rawY, 0, maxY);
        const snappedY = Math.round(clampedY / SLOT_HEIGHT) * SLOT_HEIGHT;

        // FIX: Salva l'ultima posizione valida calcolata (Source of Truth)
        currentGhostY = snappedY;

        ghost.style.top = `${snappedY}px`;
        ghost.style.opacity = '1';
    }

    // ================================
    // Event: SCROLL (Fix per Wheel Tracking)
    // ================================
    if (scroller) {
        scroller.addEventListener('scroll', () => {
            // Aggiorna la ghost usando l'ultima posizione nota del mouse
            if (lastClientY !== null) {
                updateGhostPosition(lastClientY);
            }
        }, { passive: true });
    }

    // ================================
    // Interaction: POINTER DOWN
    // ================================
    canvas.addEventListener('pointerdown', (e) => {
        const targetBlock = e.target.closest('.uo-timeline-block');
        const targetResizer = e.target.closest('.uo-resizer');

        // Coordinate Y iniziali per il drag/resize
        const rect = canvas.getBoundingClientRect();
        const scrollTop = scroller ? scroller.scrollTop : 0;
        const rawY = (e.clientY - rect.top) + scrollTop;

        // Nascondi subito la ghost
        if (ghost) ghost.style.opacity = '0';

        // --- CASO 1: RESIZE ---
        if (targetResizer && targetBlock) {
            e.preventDefault();
            e.stopPropagation();

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

        // --- CASO 2: DRAG / SELECT / DELETE ---
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

        // --- CASO 3: CREAZIONE (Click su vuoto) ---
        // FIX: Usa currentGhostY invece di ricalcolare da e.clientY
        // Questo allinea perfettamente la creazione alla preview visiva (Ghost)
        if (currentGhostY === null) return;

        activeBlockId = null;

        const minutesFromStart = (currentGhostY / SLOT_HEIGHT) * UNIT_MINUTES;

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

    // ================================
    // Interaction: POINTER MOVE (Unified)
    // ================================
    canvas.addEventListener('pointermove', (e) => {
        // Memorizza sempre l'ultima Y valida per lo scroll handler
        lastClientY = e.clientY;

        // Gestione Ghost (se non siamo impegnati in altro)
        if (!isDragging && !isResizing) {
            updateGhostPosition(lastClientY);
            return;
        }

        if (!activeElement) return;

        const rect = canvas.getBoundingClientRect();
        const scrollTop = scroller ? scroller.scrollTop : 0;
        const currentRawY = (e.clientY - rect.top) + scrollTop;

        const deltaY = currentRawY - dragStartY;

        // --- LOGICA RESIZE ---
        if (isResizing) {
            let newHeightRaw = initialBlockHeight + deltaY;
            let snappedHeight = Math.round(newHeightRaw / SLOT_HEIGHT) * SLOT_HEIGHT;

            const maxAvailableHeight = canvas.scrollHeight - initialBlockTop;
            snappedHeight = clamp(snappedHeight, SLOT_HEIGHT, maxAvailableHeight);

            activeElement.style.height = `${snappedHeight}px`;
        }

        // --- LOGICA DRAG ---
        if (isDragging) {
            let newTopRaw = initialBlockTop + deltaY;
            let snappedTop = Math.round(newTopRaw / SLOT_HEIGHT) * SLOT_HEIGHT;

            const maxTop = canvas.scrollHeight - parseFloat(activeElement.style.height);
            snappedTop = clamp(snappedTop, 0, maxTop);

            activeElement.style.top = `${snappedTop}px`;
        }
    });

    // ================================
    // Interaction: POINTER LEAVE
    // ================================
    canvas.addEventListener('pointerleave', () => {
        lastClientY = null;
        if (ghost) ghost.style.opacity = '0';
        currentGhostY = null;
    });

    // ================================
    // Interaction: POINTER UP (Commit State)
    // ================================
    canvas.addEventListener('pointerup', (e) => {
        if (!isDragging && !isResizing) return;

        if (activeElement) {
            const currentBlockId = activeElement.dataset.blockId;
            const blockIndex = blocks.findIndex(b => b.id === currentBlockId);

            if (blockIndex > -1) {
                const finalTop = parseFloat(activeElement.style.top);
                const finalHeight = parseFloat(activeElement.style.height);

                const relativeMinutes = (finalTop / SLOT_HEIGHT) * UNIT_MINUTES;
                const durationMinutes = (finalHeight / SLOT_HEIGHT) * UNIT_MINUTES;

                blocks[blockIndex].tStart = RANGE_START_MINUTES + relativeMinutes;
                blocks[blockIndex].duration = durationMinutes;
            }
        }

        // Reset
        isDragging = false;
        isResizing = false;
        activeElement = null;

        renderBlocks();

        // Ripristina ghost tracking immediato
        if (lastClientY !== null) {
            updateGhostPosition(lastClientY);
        }
    });
});
