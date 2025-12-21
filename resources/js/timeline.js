// ================================
// Timeline Ops — Context & Config
// ================================

// [FIX] Rimosse le vecchie costanti che causavano il disallineamento della chiave
// const EVENT_ID = window.UO_EVENT_ID; // Rimosso
// const STORAGE_KEY = ...;             // Rimosso

// MOCK CONTEXT (Simuliamo ciò che Blade inietterà)
// In produzione: window.UO_CONTEXT fornito dal backend
const CTX = window.UO_CONTEXT || {
    userId: 'guest_user',
    eventId: 'demo_event_01'
};

const UNIT_MINUTES = 15;
const SLOT_HEIGHT = 20;
const RANGE_START_MINUTES = 12 * 60; // 12:00

const NEON_PALETTE = [
    '#ff00ff', // Magenta Neon
    '#04D9FF', // Cyan Neon
    '#9d00ff', // Purple Neon
    '#ff9900', // Orange Neon
    '#d9b802', // Gold/Dark Yellow
    '#39ff14'  // Green Neon
];

// ================================
// STORAGE LAYER (Repository Pattern)
// ================================
// Questo modulo isola la logica di persistenza.
// OGGI: Usa localStorage.
// DOMANI: Sostituirai il contenuto di 'save' e 'load' con chiamate API.
const TimelineRepository = {
    getKey() {
        // Namespace protetto + User isolation + Event isolation
        return `uo_v1:${CTX.userId}:${CTX.eventId}`;
    },

    load() {
        try {
            const raw = localStorage.getItem(this.getKey());
            if (!raw) return []; // Nessun dato salvato -> array vuoto
            const data = JSON.parse(raw);
            // Validazione minima: deve essere un array
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Timeline storage corrupted, resetting.', e);
            return []; // Fallback sicuro
        }
    },

    save(blocks) {
        try {
            // Puliamo i dati prima di salvare (rimuoviamo riferimenti DOM se ce ne fossero)
            // Salviamo solo il DTO (Data Transfer Object) puro
            const cleanData = blocks.map(b => ({
                id: b.id,
                tStart: b.tStart,
                duration: b.duration,
                label: b.label,
                color: b.color
            }));

            // In futuro: await fetch('/api/timeline/save', { body: ... })
            localStorage.setItem(this.getKey(), JSON.stringify(cleanData));

            // Opzionale: Visual feedback di salvataggio (console per ora)
            // console.log('Saved to', this.getKey());
        } catch (e) {
            console.error('Save failed (quota exceeded?)', e);
        }
    }
};

// ================================
// UI Styling (Injected)
// ================================
function injectStyles() {
    const styleId = 'uo-timeline-styles';
    if (document.getElementById(styleId)) return;

    const css = `
/* --- Block Internals --- */
.uo-block-content {
    pointer-events: none;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 4px;
    box-sizing: border-box;
    overflow: hidden;
}

.uo-block-label {
    pointer-events: auto;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: text;
    text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 2px 4px;
    margin: -2px -4px;
    border-radius: 2px;
    user-select: none;
}

.uo-block-label:hover {
    background: rgba(255,255,255,0.1);
}

.uo-block-input {
    pointer-events: auto;
    all: unset;
    display: block;
    width: 100%;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    background: rgba(0,0,0,0.5);
    color: white;
    border-radius: 2px;
    padding: 2px 4px;
    margin: -2px -4px;
    box-sizing: border-box;
    cursor: text;
}

.uo-block-input::selection {
    background: rgba(255,255,255,0.3);
    color: white;
}

.uo-block-meta {
    font-size: 9px;
    opacity: 0.8;
    margin-top: 2px;
}

/* --- Delete Action --- */
.uo-delete-btn {
    pointer-events: auto;
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
    font-size: 14px;
    line-height: 1;
    font-weight: bold;
    color: rgba(255,255,255,0.7);
    background: rgba(0,0,0,0.3);
    border-radius: 2px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.1s ease, background 0.1s;
    z-index: 10;
}

.uo-timeline-block:hover .uo-delete-btn {
    opacity: 1;
}

.uo-delete-btn:hover {
    background: rgba(255, 0, 0, 0.8);
    color: white;
}

/* --- Context Menu --- */
.uo-context-menu {
    position: fixed;
    background: #1a1a1a;
    border: 1px solid #333;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    padding: 8px;
    border-radius: 4px;
    display: flex;
    gap: 6px;
    z-index: 9999;
    animation: fadeIn 0.1s ease-out;
}

.uo-color-swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: transform 0.1s;
}

.uo-color-swatch:hover {
    transform: scale(1.2);
    border-color: white;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}
    `;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
}


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
// Time Slots Generator
// ================================

export function generateTimeSlots({
    startHour = 12,
    endHour = 6,
    unitMinutes = 15
} = {}) {
    const slots = [];
    const rangeStartMinutes = startHour * 60;
    const rangeEndMinutes = (endHour <= startHour ? 24 + endHour : endHour) * 60;
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

    injectStyles();

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

    // Auto-Scroll Config
    const SCROLL_SPEED = 12;
    const SCROLL_THRESHOLD = 50;

    // ----------------
    // State — Data (INITIAL LOAD)
    // ----------------
    // [FIX] Usiamo direttamente il Repository per il caricamento
    // Questo assicura che la chiave di lettura sia identica a quella di scrittura
    let blocks = TimelineRepository.load();

    // ----------------
    // State — Runtime
    // ----------------
    let activeBlockId = null;
    let isDragging = false;
    let isResizing = false;
    let isEditingText = false;

    let contextMenuEl = null;

    let lastClientY = null;
    let currentGhostY = null;

    let dragStartY = 0;
    let initialBlockTop = 0;
    let initialBlockHeight = 0;
    let activeElement = null;

    let autoScrollAF = null;
    let scrollDirection = 0;

    // ----------------
    // Context Menu System
    // ----------------
    function closeContextMenu() {
        if (contextMenuEl) {
            contextMenuEl.remove();
            contextMenuEl = null;
        }
    }

    function openColorMenu(x, y, blockId) {
        closeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'uo-context-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        NEON_PALETTE.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'uo-color-swatch';
            swatch.style.backgroundColor = color;
            swatch.onpointerdown = (e) => {
                e.stopPropagation();
                updateBlockColor(blockId, color);
                closeContextMenu();
            };
            menu.appendChild(swatch);
        });

        document.body.appendChild(menu);
        contextMenuEl = menu;
    }

    function updateBlockColor(blockId, color) {
        const block = blocks.find(b => b.id === blockId);
        if (block) {
            block.color = color;
            renderBlocks();
            // 2. PERSISTENZA: Colore cambiato -> Save
            TimelineRepository.save(blocks);
        }
    }

    document.addEventListener('pointerdown', (e) => {
        if (contextMenuEl && !contextMenuEl.contains(e.target)) {
            closeContextMenu();
        }
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
        if (isEditingText) return;

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
                <div class="uo-delete-btn" title="Remove">×</div>
                <div class="uo-block-content">
                    <span class="uo-block-label" title="Click to edit">${block.label}</span>
                    <span class="uo-block-meta">${snappedDuration}m</span>
                </div>
                <div class="uo-resizer"></div>
            `;

            const labelEl = el.querySelector('.uo-block-label');

            labelEl.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });

            labelEl.addEventListener('click', (e) => {
                e.stopPropagation();
                startInlineEdit(block.id, labelEl);
            });

            const deleteEl = el.querySelector('.uo-delete-btn');
            deleteEl.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                deleteBlock(block.id);
            });

            el.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openColorMenu(e.pageX, e.pageY, block.id);
            });

            canvas.appendChild(el);
        });
    }

    // ----------------
    // Inline Editing Logic
    // ----------------
    function startInlineEdit(blockId, labelEl) {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        isEditingText = true;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = block.label;
        input.className = 'uo-block-input';

        labelEl.replaceWith(input);

        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });

        const save = () => {
            if (!isEditingText) return;

            isEditingText = false;
            if (input.value.trim()) {
                block.label = input.value.trim();
                // 3. PERSISTENZA: Testo modificato -> Save
                TimelineRepository.save(blocks);
            }
            renderBlocks();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
            e.stopPropagation();
        });

        input.addEventListener('pointerdown', e => e.stopPropagation());
        input.addEventListener('click', e => e.stopPropagation());
    }

    function deleteBlock(blockId) {
        blocks = blocks.filter(b => b.id !== blockId);
        activeBlockId = null;
        renderBlocks();
        // 4. PERSISTENZA: Blocco cancellato -> Save
        TimelineRepository.save(blocks);
    }

    renderBlocks();

    // ----------------
    // Coordinate Helper
    // ----------------
    function getCanvasRelativeY(clientY) {
        const rect = canvas.getBoundingClientRect();
        return clientY - rect.top;
    }

    // ----------------
    // Ghost Logic
    // ----------------
    function updateGhostPosition(clientY) {
        if (!ghost) return;

        if (isDragging || isResizing || clientY === null || isEditingText) {
            ghost.style.opacity = '0';
            currentGhostY = null;
            return;
        }

        const rawY = getCanvasRelativeY(clientY);
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
    // Collision Handling
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
    // Auto-Scroll Engine
    // ----------------
    function performAutoScroll() {
        if (scrollDirection === 0 || !scroller) {
            cancelAnimationFrame(autoScrollAF);
            autoScrollAF = null;
            return;
        }

        scroller.scrollTop += (scrollDirection * SCROLL_SPEED);

        if (lastClientY !== null) {
            handlePointerMoveLogic(lastClientY);
        }

        autoScrollAF = requestAnimationFrame(performAutoScroll);
    }

    function checkAutoScroll(clientY) {
        if (!scroller) return;

        const rect = scroller.getBoundingClientRect();
        const distTop = clientY - rect.top;
        const distBottom = rect.bottom - clientY;

        let newDirection = 0;

        if (distTop < SCROLL_THRESHOLD) {
            newDirection = -1; // Up
        } else if (distBottom < SCROLL_THRESHOLD) {
            newDirection = 1;  // Down
        }

        if (newDirection !== scrollDirection) {
            scrollDirection = newDirection;

            if (scrollDirection !== 0 && !autoScrollAF) {
                performAutoScroll();
            } else if (scrollDirection === 0 && autoScrollAF) {
                cancelAnimationFrame(autoScrollAF);
                autoScrollAF = null;
            }
        }
    }

    function stopAutoScroll() {
        scrollDirection = 0;
        if (autoScrollAF) {
            cancelAnimationFrame(autoScrollAF);
            autoScrollAF = null;
        }
    }

    // ----------------
    // Core Logic
    // ----------------
    function handlePointerMoveLogic(clientY) {
        if (!isDragging && !isResizing) {
            updateGhostPosition(clientY);
            return;
        }

        if (!activeElement) return;

        const currentRawY = getCanvasRelativeY(clientY);
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
    }

    // ----------------
    // Pointer Down
    // ----------------
    canvas.addEventListener('pointerdown', (e) => {
        closeContextMenu();

        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const targetBlock = e.target.closest('.uo-timeline-block');
        const targetResizer = e.target.closest('.uo-resizer');

        const rawY = getCanvasRelativeY(e.clientY);

        if (ghost) ghost.style.opacity = '0';

        const setActiveVisuals = (blockEl) => {
            canvas.querySelectorAll('.uo-timeline-block.is-active').forEach(el =>
                el.classList.remove('is-active')
            );
            if (blockEl) blockEl.classList.add('is-active');
        };

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

            setActiveVisuals(targetBlock);
            return;
        }

        // --- DRAG / DELETE (ALT) ---
        if (targetBlock) {
            if (e.altKey) {
                deleteBlock(targetBlock.dataset.blockId);
                return;
            }

            e.preventDefault();
            isDragging = true;
            activeElement = targetBlock;
            activeBlockId = targetBlock.dataset.blockId;

            targetBlock.setPointerCapture(e.pointerId);

            dragStartY = rawY;
            initialBlockTop = parseFloat(targetBlock.style.top);

            setActiveVisuals(targetBlock);
            return;
        }

        // --- CREATE ---
        if (currentGhostY === null) return;

        activeBlockId = null;
        const minutesFromStart = (currentGhostY / SLOT_HEIGHT) * UNIT_MINUTES;

        let tStart = RANGE_START_MINUTES + minutesFromStart;
        let tDuration = snapToUnit(DEFAULT_DURATION);

        // Smart Placement
        let limitStart = RANGE_START_MINUTES;
        const totalMinutes = (canvas.scrollHeight / SLOT_HEIGHT) * UNIT_MINUTES;
        let limitEnd = RANGE_START_MINUTES + totalMinutes;

        for (const b of blocks) {
            const bEnd = b.tStart + b.duration;
            if (bEnd <= tStart) limitStart = Math.max(limitStart, bEnd);
            if (b.tStart >= tStart) limitEnd = Math.min(limitEnd, b.tStart);
        }

        if (tStart + tDuration > limitEnd) {
            const shiftedStart = limitEnd - tDuration;
            if (shiftedStart >= limitStart) {
                tStart = shiftedStart;
            } else {
                tStart = limitStart;
                tDuration = Math.max(UNIT_MINUTES, limitEnd - limitStart);
            }
        }

        const newBlock = {
            id: generateId(),
            tStart: tStart,
            duration: tDuration,
            label: 'NEW SLOT',
            color: NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)]
        };

        blocks.push(newBlock);
        activeBlockId = newBlock.id;
        renderBlocks();
        // 5. PERSISTENZA: Nuovo blocco creato -> Save
        TimelineRepository.save(blocks);
    });

    // ----------------
    // Pointer Move
    // ----------------
    canvas.addEventListener('pointermove', (e) => {
        lastClientY = e.clientY;

        if (isDragging || isResizing) {
            checkAutoScroll(e.clientY);
        }
        handlePointerMoveLogic(e.clientY);
    });

    // ----------------
    // Pointer Leave
    // ----------------
    canvas.addEventListener('pointerleave', () => {
        if (!isDragging && !isResizing) {
            lastClientY = null;
            currentGhostY = null;
            if (ghost) ghost.style.opacity = '0';
        }
    });

    // ----------------
    // Pointer Up
    // ----------------
    canvas.addEventListener('pointerup', () => {
        stopAutoScroll();

        if (!isDragging && !isResizing) return;

        let needsSave = false;

        if (activeElement) {
            const id = activeElement.dataset.blockId;
            const index = blocks.findIndex(b => b.id === id);

            if (index > -1) {
                const finalTop = parseFloat(activeElement.style.top);
                const finalHeight = parseFloat(activeElement.style.height);

                // Check se è cambiato qualcosa per evitare save inutili
                const newStart = RANGE_START_MINUTES + (finalTop / SLOT_HEIGHT) * UNIT_MINUTES;
                const newDuration = (finalHeight / SLOT_HEIGHT) * UNIT_MINUTES;

                if (blocks[index].tStart !== newStart || blocks[index].duration !== newDuration) {
                    blocks[index].tStart = newStart;
                    blocks[index].duration = newDuration;
                    needsSave = true;
                }
            }
        }

        isDragging = false;
        isResizing = false;
        activeElement = null;

        renderBlocks();

        if (lastClientY !== null) {
            updateGhostPosition(lastClientY);
        }

        // 6. PERSISTENZA: Fine movimento -> Save (se ci sono state modifiche)
        if (needsSave) {
            TimelineRepository.save(blocks);
        }
    });
});
