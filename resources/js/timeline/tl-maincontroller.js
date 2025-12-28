// ================================
// TIMELINE.JS (MAIN CONTROLLER)
// ================================

// ================================
// IMPORTS (SEMPRE IN ALTO)
// ================================

import { CONFIG, NEON_PALETTE } from './tl-config.js';
import {
    snapToUnit,
    minutesToPixels,
    clamp,
    generateId,
    getCanvasRelativeY
} from './tl-utils.js';

import { TimelineRepository } from './tl-storage.js';
import { injectStyles } from './tl-style.js';
import { renderStaffRow, generateTimeSlots } from './tl-ui-comp.js';

// ================================
// TIMELINE — EVENT CONTEXT & RANGE
// ================================

// Evento iniettato dal backend
const EVENT_START = window.__TIMELINE_EVENT__?.start
    ? new Date(window.__TIMELINE_EVENT__.start)
    : null;

// PRODUCT DECISION
const TIMELINE_BEFORE_HOURS = 4;
const TIMELINE_AFTER_HOURS = 8;

// Fallback sicuro
const EVENT_START_MINUTES = EVENT_START
    ? EVENT_START.getHours() * 60 + EVENT_START.getMinutes()
    : 22 * 60;

// Range timeline
const RANGE_START_MINUTES =
    EVENT_START_MINUTES - TIMELINE_BEFORE_HOURS * 60;

const RANGE_TOTAL_MINUTES =
    (TIMELINE_BEFORE_HOURS + TIMELINE_AFTER_HOURS) * 60;


// ================================
// DOM READY (RIMOSSO DUPLICATO QUI - FIX ORDER)
// ================================
// Il blocco DOMContentLoaded duplicato è stato rimosso per evitare ReferenceError
// su renderBlocks e conflitti di scope. L'inizializzazione è spostata in fondo.

// ================================
// TIME AXIS
// ================================

function renderTimeAxis() {
    const axis = document.getElementById('timeline-axis');
    if (!axis) return;

    axis.innerHTML = '';

    const slots = generateTimeSlots({
        rangeStartMinutes: RANGE_START_MINUTES,
        rangeTotalMinutes: RANGE_TOTAL_MINUTES,
        unitMinutes: CONFIG.UNIT_MINUTES
    });

    slots.forEach(slot => {
        const el = document.createElement('div');
        el.className = 'uo-timeline-axis-slot';

        if (slot.isHour) {
            el.classList.add('is-hour');

            el.textContent = `
    ${slot.displayHour}
    `;
        }


        axis.appendChild(el);
    });
}


// ================================
// NOW LINE
// ================================

function setupNowLine() {
    const nowLine = document.querySelector('.uo-timeline-now');
    if (!nowLine || !EVENT_START) return;

    function updateNowLine() {
        const now = new Date();

        if (now.toDateString() !== EVENT_START.toDateString()) {
            nowLine.style.display = 'none';
            return;
        }

        const nowMinutes =
            now.getHours() * 60 + now.getMinutes();

        const minutesFromStart =
            nowMinutes - RANGE_START_MINUTES;

        if (
            minutesFromStart < 0 ||
            minutesFromStart > RANGE_TOTAL_MINUTES
        ) {
            nowLine.style.display = 'none';
            return;
        }

        nowLine.style.top =
            `${minutesToPixels(minutesFromStart)}px`;

        nowLine.style.display = 'block';
    }

    updateNowLine();
    setInterval(updateNowLine, 60_000);
}

// ================================
// EXPORTS (se servono)
// ================================

// Riesporto generateTimeSlots per compatibilità (come nel file originale)
export { generateTimeSlots };

// ================================
// MAIN LOGIC (SINGLE ENTRY POINT)
// ================================

document.addEventListener('DOMContentLoaded', () => {

    injectStyles();

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
    // State — Data (INITIAL LOAD)
    // ----------------
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

        const OFFSET = 6;

        // 🔑 coordinate di PAGINA
        menu.style.left = `${x + OFFSET}px`;
        menu.style.top = `${y + OFFSET}px`;

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
            TimelineRepository.save(blocks);
        }
    }

    document.addEventListener('pointerdown', (e) => {
        if (contextMenuEl && !contextMenuEl.contains(e.target)) {
            closeContextMenu();
        }
    });

    // ----------------
    // Rendering Logic
    // ----------------
    function renderBlocks() {
        if (isEditingText) return;

        canvas.querySelectorAll('.uo-timeline-block').forEach(el => el.remove());

        blocks.forEach(block => {
            // sicurezza: staff sempre array
            if (!Array.isArray(block.staff)) {
                block.staff = [];
            }

            const snappedStart = snapToUnit(block.tStart);
            const snappedDuration = snapToUnit(block.duration);

            const relativeStart = snappedStart - RANGE_START_MINUTES
                ;
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

            // Uso del componente importato
            const staffHtml = renderStaffRow(block);

            el.innerHTML = `
                <div class="uo-block-actions">
                    <button class="uo-delete-btn" title="Remove">×</button>
                </div>
                <div class="uo-block-content">
                    <span class="uo-block-label" title="Click to edit">${block.label}</span>
                    ${staffHtml}
                    <span class="uo-block-meta">${snappedDuration}m</span>
                </div>
                <div class="uo-resizer"></div>
            `;

            // ----------------
            // Label edit
            // ----------------
            const labelEl = el.querySelector('.uo-block-label');
            labelEl.addEventListener('pointerdown', e => e.stopPropagation());
            labelEl.addEventListener('click', e => {
                e.stopPropagation();
                startInlineEdit(block.id, labelEl);
            });

            // ----------------
            // Delete
            // ----------------
            const deleteEl = el.querySelector('.uo-delete-btn');
            deleteEl.addEventListener('pointerdown', e => {
                e.stopPropagation();
                deleteBlock(block.id);
            });

            // ----------------
            // Context menu (color)
            // ----------------
            el.addEventListener('contextmenu', e => {
                e.preventDefault();
                e.stopPropagation();
                openColorMenu(e.pageX, e.pageY, block.id);
            });

            // ----------------
            // Staff add & Inline Edit
            // ----------------
            const addStaffBtn = el.querySelector('[data-add-staff]');
            if (addStaffBtn) {
                addStaffBtn.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddStaff(block.id);
                });

                // ----------------
                // Staff inline rename (FAST)
                // ----------------
                el.querySelectorAll('.uo-staff-chip.is-quick').forEach(chipEl => {
                    chipEl.addEventListener('pointerdown', e => {
                        e.preventDefault();
                        e.stopPropagation();
                        const staffId = chipEl.dataset.staffId;
                        startStaffInlineEdit(block.id, staffId, chipEl);
                    });
                });
            }

            canvas.appendChild(el);
        });
    }

    // ----------------
    // Staff Add Logic
    // ----------------
    function handleAddStaff(blockId) {
        console.log('FAST STAFF ADD', blockId);
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        block.staff.push({
            id: `quick_${Date.now()}`,
            name: 'STAFF',
            role: null,
            isQuick: true
        });

        TimelineRepository.save(blocks);
        renderBlocks();
    }

    // ----------------
    // Staff Inline Edit (FAST)
    // ----------------
    function startStaffInlineEdit(blockId, staffId, chipEl) {
        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const staff = block.staff.find(s => s.id === staffId && s.isQuick);
        if (!staff) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = staff.name;
        input.className = 'uo-staff-input';

        chipEl.replaceWith(input);

        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });

        const save = () => {
            const val = input.value.trim();
            staff.name = val || 'STAFF';

            TimelineRepository.save(blocks);
            renderBlocks();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            e.stopPropagation();
        });

        input.addEventListener('pointerdown', e => e.stopPropagation());
    }

    // ----------------
    // Inline Editing Logic (Block Label)
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
                TimelineRepository.save(blocks);
            }
            renderBlocks();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            e.stopPropagation();
        });

        input.addEventListener('pointerdown', e => e.stopPropagation());
        input.addEventListener('click', e => e.stopPropagation());
    }

    // ----------------
    // Delete Block
    // ----------------
    function deleteBlock(blockId) {
        blocks = blocks.filter(b => b.id !== blockId);
        activeBlockId = null;
        renderBlocks();
        TimelineRepository.save(blocks);
    }

    // ----------------
    // INIT (SPOSTATO E UNIFICATO QUI)
    // ----------------
    renderTimeAxis();
    setupNowLine(); // [FIX] Spostato qui per scope e ordine corretto
    renderBlocks(); // [FIX] Ora è definito e sicuro da chiamare

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

        const rawY = getCanvasRelativeY(clientY, canvas);
        const maxY = canvas.scrollHeight;

        const clampedY = clamp(rawY, 0, maxY);
        const snappedY = Math.round(clampedY / CONFIG.SLOT_HEIGHT) * CONFIG.SLOT_HEIGHT;

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

        let minStart = RANGE_START_MINUTES
            ;
        const timelineMinutes =
            (canvas.scrollHeight / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;
        let maxEnd = RANGE_START_MINUTES
            + timelineMinutes;

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

        scroller.scrollTop += (scrollDirection * CONFIG.SCROLL_SPEED);

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

        if (distTop < CONFIG.SCROLL_THRESHOLD) {
            newDirection = -1; // Up
        } else if (distBottom < CONFIG.SCROLL_THRESHOLD) {
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

        const currentRawY = getCanvasRelativeY(clientY, canvas);
        const deltaY = currentRawY - dragStartY;

        const limits = getCollisionLimits(activeBlockId);

        // --- RESIZE ---
        if (isResizing) {
            let newHeightRaw = initialBlockHeight + deltaY;
            let snappedHeight = Math.round(newHeightRaw / CONFIG.SLOT_HEIGHT) * CONFIG.SLOT_HEIGHT;

            const currentStart =
                RANGE_START_MINUTES
                +
                (initialBlockTop / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

            const futureDuration =
                (snappedHeight / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

            const maxAllowedDuration = limits.maxEnd - currentStart;

            let clampedDuration = Math.min(futureDuration, maxAllowedDuration);
            clampedDuration = Math.max(clampedDuration, CONFIG.UNIT_MINUTES);

            activeElement.style.height =
                `${minutesToPixels(clampedDuration)}px`;
        }

        // --- DRAG ---
        if (isDragging) {
            let newTopRaw = initialBlockTop + deltaY;
            let snappedTop = Math.round(newTopRaw / CONFIG.SLOT_HEIGHT) * CONFIG.SLOT_HEIGHT;

            const activeBlock = blocks.find(b => b.id === activeBlockId);
            const duration = activeBlock ? activeBlock.duration : CONFIG.DEFAULT_DURATION;

            const futureStart =
                RANGE_START_MINUTES
                +
                (snappedTop / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

            const minAllowedStart = limits.minStart;
            const maxAllowedStart = limits.maxEnd - duration;

            const clampedStart =
                clamp(futureStart, minAllowedStart, maxAllowedStart);

            activeElement.style.top =
                `${minutesToPixels(clampedStart - RANGE_START_MINUTES
                )}px`;
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

        const rawY = getCanvasRelativeY(e.clientY, canvas);

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
        const minutesFromStart = (currentGhostY / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

        let tStart = RANGE_START_MINUTES
            + minutesFromStart;
        let tDuration = snapToUnit(CONFIG.DEFAULT_DURATION);

        // Smart Placement
        let limitStart = RANGE_START_MINUTES
            ;
        const totalMinutes = (canvas.scrollHeight / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;
        let limitEnd = RANGE_START_MINUTES
            + totalMinutes;

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
                tDuration = Math.max(CONFIG.UNIT_MINUTES, limitEnd - limitStart);
            }
        }

        const newBlock = {
            id: generateId(),
            tStart: tStart,
            duration: tDuration,
            label: 'NEW SLOT',
            color: NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)],
            // [ESTENSIONE] Inizializzazione array staff vuoto
            staff: []
        };

        blocks.push(newBlock);
        activeBlockId = newBlock.id;
        renderBlocks();
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
                const newStart = RANGE_START_MINUTES
                    + (finalTop / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;
                const newDuration = (finalHeight / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

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

        if (needsSave) {
            TimelineRepository.save(blocks);
        }
    });
});
