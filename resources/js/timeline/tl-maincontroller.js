// ================================
// TIMELINE.JS (MAIN CONTROLLER) — SLOT-BASED PURO
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

import {
    renderStaffRow,
    generateTimeSlots,
    renderEventRangeFromSlots
} from './tl-ui-comp.js';

// ================================
// TIME AXIS RENDER (SLOT-BASED)
// ================================
function renderTimeAxis(cfg) {
    const axis = document.getElementById('timeline-axis');
    if (!axis) return [];

    axis.innerHTML = '';

    const slots = generateTimeSlots({
        axisStartSlot: cfg.axis_start_slot,      // assoluto (es: 72)
        totalSlots: cfg.total_slots,             // 12h -> 48 (se 15m)
        unitMinutes: CONFIG.UNIT_MINUTES
    });

    slots.forEach(slot => {
        const el = document.createElement('div');
        el.className = 'uo-timeline-axis-slot';

        // Mostriamo testo solo alle ore (ma lo slot esiste sempre ogni 15m)
        if (slot.isHour) {
            el.classList.add('is-hour');
            el.textContent = slot.displayHour;
        }

        axis.appendChild(el);
    });

    return slots;
}

// ================================
// MAIN (SINGLE ENTRY POINT)
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
    // Config (backend source of truth)
    // ----------------
    const cfg = window.__TIMELINE_CONFIG__;
    if (!cfg || !cfg.event) {
        console.warn('Missing window.__TIMELINE_CONFIG__');
        return;
    }
    function updateTimelineHeaderContext() {
        const cfg = window.__TIMELINE_CONFIG__;
        if (!cfg || cfg.mode !== "multi") return;

        const dateEl = document.getElementById("uo-timeline-current-date");
        const statusEl = document.getElementById("uo-timeline-date-status");

        if (!dateEl || !statusEl) return;

        const startDateStr = dateEl.dataset.startDate;
        if (!startDateStr) return;

        const baseDate = new Date(startDateStr);
        const windowIndex = cfg.page?.index ?? 0;

        // ===== DATA FINESTRA (NON calendario puro)
        const startMin = cfg.time_real?.start_minutes;
        const endMin = cfg.time_real?.end_minutes;
        if (startMin == null || endMin == null) return;

        const startDateTime = new Date(baseDate);
        startDateTime.setDate(startDateTime.getDate() + windowIndex);
        startDateTime.setHours(
            Math.floor(startMin / 60),
            startMin % 60,
            0,
            0
        );

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + (endMin - startMin));

        // ===== FORMAT DATA HEADER
        const sameDay =
            startDateTime.toDateString() === endDateTime.toDateString();

        const dateFormatter = new Intl.DateTimeFormat("it-IT", {
            weekday: "long",
            day: "2-digit",
            month: "long"
        });

        const timeFormatter = new Intl.DateTimeFormat("it-IT", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const datePart = sameDay
            ? dateFormatter.format(startDateTime)
            : `${dateFormatter.format(startDateTime)} → ${dateFormatter.format(endDateTime)}`;

        const timePart =
            `${timeFormatter.format(startDateTime)} → ${timeFormatter.format(endDateTime)}`;

        dateEl.textContent = `🗓 ${datePart} • ${timePart}`;

        // ===== BADGE OGGI / DOMANI / IERI (DINAMICO)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const windowDay = new Date(startDateTime);
        windowDay.setHours(0, 0, 0, 0);

        const diffDays = Math.round(
            (windowDay - today) / (1000 * 60 * 60 * 24)
        );

        let label = null;
        let cls = null;

        if (diffDays === 0) {
            label = "Oggi";
            cls = "is-today";
        } else if (diffDays === 1) {
            label = "Domani";
            cls = "is-future";
        } else if (diffDays === -1) {
            label = "Ieri";
            cls = "is-past";
        } else if (diffDays > 1) {
            label = `tra ${diffDays} giorni`;
            cls = "is-future";
        } else {
            label = `${Math.abs(diffDays)} giorni fa`;
            cls = "is-past";
        }

        // aggiorna badge
        statusEl.textContent = label;
        statusEl.className = `uo-meta-status ${cls}`;
    }






    // Altezza timeline: 1 slot = SLOT_HEIGHT
    // (serve perché canvas abbia area reale e scorribile/cliccabile)
    canvas.style.position = canvas.style.position || 'relative';
    canvas.style.minHeight = `${cfg.total_slots * CONFIG.SLOT_HEIGHT}px`;

    // ----------------
    // Axis + Range
    // ----------------
    renderTimeAxis(cfg);

    // ----------------
    // Header Date Sync (MULTI DAY)
    // ----------------
    updateTimelineHeaderContext();


    renderEventRangeFromSlots({
        canvas,
        rangeStartSlot: cfg.range_start_slot,   // tipicamente 0
        slotHeight: CONFIG.SLOT_HEIGHT
    });

    // ----------------
    // State — Data (INITIAL LOAD)
    // ----------------
    let blocks = TimelineRepository.load();

    // IMPORTANT: se in passato avevi salvato minuti assoluti (tipo 1320),
    // ora non li vedrai più in una timeline 0..720.
    // In quel caso, resetta localStorage per l’evento.

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
        if (!block) return;

        block.color = color;
        TimelineRepository.save(blocks);
        renderBlocks();
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

        const timelineMinutes = cfg.total_slots * CONFIG.UNIT_MINUTES;

        blocks.forEach(block => {
            if (!Array.isArray(block.staff)) block.staff = [];

            const snappedStart = snapToUnit(block.tStart);
            const snappedDuration = snapToUnit(block.duration);

            // dentro la timeline (0..12h)
            if (snappedStart < 0 || snappedStart >= timelineMinutes) return;

            const top = minutesToPixels(snappedStart);
            const height = minutesToPixels(snappedDuration);

            const el = document.createElement('div');
            el.className = 'uo-timeline-block';
            el.dataset.blockId = block.id;

            if (block.id === activeBlockId) el.classList.add('is-active');

            el.style.top = `${top}px`;
            el.style.height = `${height}px`;
            el.style.backgroundColor = block.color;

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

            // Label edit
            const labelEl = el.querySelector('.uo-block-label');
            labelEl.addEventListener('pointerdown', e => e.stopPropagation());
            labelEl.addEventListener('click', e => {
                e.stopPropagation();
                startInlineEdit(block.id, labelEl);
            });

            // Delete
            const deleteEl = el.querySelector('.uo-delete-btn');
            deleteEl.addEventListener('pointerdown', e => {
                e.stopPropagation();
                deleteBlock(block.id);
            });

            // Context menu (color)
            el.addEventListener('contextmenu', e => {
                e.preventDefault();
                e.stopPropagation();
                openColorMenu(e.pageX, e.pageY, block.id);
            });

            // Staff add
            const addStaffBtn = el.querySelector('[data-add-staff]');
            if (addStaffBtn) {
                addStaffBtn.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddStaff(block.id);
                });

                // Quick staff rename
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

    function deleteBlock(blockId) {
        blocks = blocks.filter(b => b.id !== blockId);
        activeBlockId = null;
        TimelineRepository.save(blocks);
        renderBlocks();
    }

    // ----------------
    // Staff Add Logic
    // ----------------
    function handleAddStaff(blockId) {
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
            const val = input.value.trim();
            if (val) {
                block.label = val;
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

    // Scroll sync
    if (scroller) {
        scroller.addEventListener('scroll', () => {
            if (lastClientY !== null) updateGhostPosition(lastClientY);
        }, { passive: true });
    }

    // ----------------
    // Collision Handling (timeline normalizzata)
    // ----------------
    function getCollisionLimits(activeId) {
        const timelineMinutes = cfg.total_slots * CONFIG.UNIT_MINUTES;

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

        if (distTop < CONFIG.SCROLL_THRESHOLD) newDirection = -1;
        else if (distBottom < CONFIG.SCROLL_THRESHOLD) newDirection = 1;

        if (newDirection !== scrollDirection) {
            scrollDirection = newDirection;

            if (scrollDirection !== 0 && !autoScrollAF) performAutoScroll();
            else if (scrollDirection === 0 && autoScrollAF) {
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
    // Core Drag/Resize Logic
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

        // RESIZE
        if (isResizing) {
            const newHeightRaw = initialBlockHeight + deltaY;
            const snappedHeight = Math.round(newHeightRaw / CONFIG.SLOT_HEIGHT) * CONFIG.SLOT_HEIGHT;

            const currentStart =
                (initialBlockTop / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

            const futureDuration =
                Math.round(snappedHeight / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

            const maxAllowedDuration = limits.maxEnd - currentStart;

            let clampedDuration = Math.min(futureDuration, maxAllowedDuration);
            clampedDuration = Math.max(clampedDuration, CONFIG.UNIT_MINUTES);

            activeElement.style.height = `${minutesToPixels(clampedDuration)}px`;
        }

        // DRAG
        if (isDragging) {
            const newTopRaw = initialBlockTop + deltaY;
            const snappedTop = Math.round(newTopRaw / CONFIG.SLOT_HEIGHT) * CONFIG.SLOT_HEIGHT;

            const activeBlock = blocks.find(b => b.id === activeBlockId);
            const duration = activeBlock ? activeBlock.duration : CONFIG.DEFAULT_DURATION;

            const futureStart =
                Math.round(snappedTop / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

            const minAllowedStart = limits.minStart;
            const maxAllowedStart = limits.maxEnd - duration;

            const clampedStart = clamp(futureStart, minAllowedStart, maxAllowedStart);

            activeElement.style.top = `${minutesToPixels(clampedStart)}px`;
        }
    }

    // ----------------
    // Pointer Down
    // ----------------
    canvas.addEventListener('pointerdown', (e) => {
        closeContextMenu();

        // click destro mouse ignorato (context menu gestito separatamente)
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

        // RESIZE
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

        // DRAG / DELETE (ALT)
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

        // CREATE
        if (currentGhostY === null) return;

        activeBlockId = null;

        const startSlot = Math.round(currentGhostY / CONFIG.SLOT_HEIGHT);
        let tStart = startSlot * CONFIG.UNIT_MINUTES;
        let tDuration = snapToUnit(CONFIG.DEFAULT_DURATION);

        const totalMinutes = cfg.total_slots * CONFIG.UNIT_MINUTES;

        // Smart placement (collision aware)
        let limitStart = 0;
        let limitEnd = totalMinutes;

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
            tStart,
            duration: tDuration,
            label: 'NEW SLOT',
            color: NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)],
            staff: []
        };

        blocks.push(newBlock);
        activeBlockId = newBlock.id;

        TimelineRepository.save(blocks);
        renderBlocks();
    });

    // Pointer Move
    canvas.addEventListener('pointermove', (e) => {
        lastClientY = e.clientY;

        if (isDragging || isResizing) checkAutoScroll(e.clientY);

        handlePointerMoveLogic(e.clientY);
    });

    // Pointer Leave
    canvas.addEventListener('pointerleave', () => {
        if (!isDragging && !isResizing) {
            lastClientY = null;
            currentGhostY = null;
            if (ghost) ghost.style.opacity = '0';
        }
    });

    // Pointer Up
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

                const newStart = (finalTop / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;
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

        if (lastClientY !== null) updateGhostPosition(lastClientY);

        if (needsSave) TimelineRepository.save(blocks);
    });

    // ----------------
    // First render
    // ----------------
    renderBlocks();
});
