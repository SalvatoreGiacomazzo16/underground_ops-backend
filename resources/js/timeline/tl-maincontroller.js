// ================================
// TIMELINE.JS (MAIN CONTROLLER) — SLOT-BASED PURO
// ================================

import { CONFIG, NEON_PALETTE } from './tl-config.js';
import {
    snapToUnit,
    minutesToPixels,
    pixelsToMinutes,
    clamp,
    generateId,
    getCanvasRelativeY,
    escapeHtml,
    getCollisionLimits,
    minutesToHHMM,
    deleteBlock
} from './tl-utils.js';
import { TimelineRepository, fetchAccountStaff } from './tl-storage.js';
import {
    generateTimeSlots,
    renderEventRangeFromSlots,
    renderTimeAxis,
    updateTimelineHeaderContext,
    renderStaffStrip,
    renderAssignedStaff,
    initColorMenu,
    buildBlockElement
} from './tl-ui-comp.js';
import { findNearestFreeStart, bindHoldAction } from './tl-utils.js';

// ================================
// MAIN (SINGLE ENTRY POINT)
// ================================
document.addEventListener('DOMContentLoaded', () => {

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


    // Altezza timeline: 1 slot = SLOT_HEIGHT
    // (serve perché canvas abbia area reale e scorribile/cliccabile)
    canvas.style.position = canvas.style.position || 'relative';
    canvas.style.minHeight = `${cfg.total_slots * CONFIG.SLOT_HEIGHT}px`;

    // ----------------
    // Axis + Range
    // ----------------
    renderTimeAxis(cfg, CONFIG);

    // ----------------
    // Header Date Sync (MULTI DAY)
    // ----------------
    updateTimelineHeaderContext(cfg);

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

    function setBlocks(nextBlocks) {
        blocks = nextBlocks;
        TimelineRepository.save(blocks);
        renderBlocks();
        updateStaffOverflow();
    }

    function setActiveBlockId(id) {
        activeBlockId = id;
    }

    document.addEventListener('pointerdown', (e) => {
        if (contextMenuEl && !contextMenuEl.contains(e.target)) {
            closeContextMenu();
            if (e.target.closest('.uo-timeline-block')) {
                return;
            }
        }
    });

    function attachBlockEvents(el, block, ctx) {
        const {
            blocks,
            CONFIG,
            openColorMenu,
            startInlineEdit,
            openStaffDrawer,
            updateStaffOverflow,
            deleteBlock,
            setActiveBlockId
        } = ctx;

        /* =========================
           DELETE
        ========================= */
        const delBtn = el.querySelector('[data-delete-block]');
        if (delBtn) {
            delBtn.addEventListener('pointerdown', e => {
                e.preventDefault();
                e.stopPropagation();
            });

            delBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();

                const updated = deleteBlock({
                    blocks,
                    blockId: block.id
                });

                ctx.setActiveBlockId(null);
                ctx.setBlocks(updated);


                setActiveBlockId(null);
                updateStaffOverflow();
            });
        }

        /* =========================
           INLINE EDIT TITOLO
        ========================= */
        const titleEl = el.querySelector('.uo-block-title');
        if (titleEl) {
            titleEl.addEventListener('pointerdown', e => {
                e.stopPropagation();
            });

            titleEl.addEventListener('click', e => {
                e.stopPropagation();
                startInlineEdit(block.id, titleEl);
            });
        }

        /* =========================
           ADD STAFF
        ========================= */
        const staffAddBtn = el.querySelector('[data-staff-add]');
        if (staffAddBtn) {
            staffAddBtn.addEventListener('pointerdown', e => {
                e.preventDefault();
                e.stopPropagation();
            });

            staffAddBtn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                openStaffDrawer(block.id, block.label);
            });
        }

        /* =========================
           BLOCCA DRAG SU +N
        ========================= */
        const staffMore = el.querySelector('[data-staff-more]');
        if (staffMore) {
            staffMore.addEventListener('pointerdown', e => {
                e.preventDefault();
                e.stopPropagation();
            });
        }

        /* =========================
           CONTEXT MENU — COLORE
        ========================= */
        el.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            openColorMenu(e.pageX, e.pageY, block.id);
        });
    }

    function renderBlocks() {
        if (isEditingText) return;

        canvas
            .querySelectorAll('.uo-timeline-block')
            .forEach(el => el.remove());

        const ctx = {
            blocks,
            CONFIG,
            cfg,
            activeBlockId,
            setActiveBlockId: id => activeBlockId = id,
            setBlocks,
            openColorMenu,
            startInlineEdit,
            openStaffDrawer,
            updateStaffOverflow,
            deleteBlock
        };

        blocks.forEach(block => {
            const el = buildBlockElement(block, ctx);
            if (!el) return;

            attachBlockEvents(el, block, ctx);
            canvas.appendChild(el);
        });
    }


    const { openColorMenu, closeContextMenu } = initColorMenu({
        blocks,
        canvas,
        palette: NEON_PALETTE,
        onUpdate: (blockId, color) => {
            const block = blocks.find(b => b.id === blockId);
            if (!block) return;

            block.color = color;
            TimelineRepository.save(blocks);
            renderBlocks();
            updateStaffOverflow();
        }
    });


    let accountStaffCache = [];
    // ===============================
    // STAFF DRAWER — OPEN / CLOSE
    // ===============================

    const staffDrawer = document.getElementById('uo-staff-drawer');
    const staffDrawerPanel = staffDrawer?.querySelector('.uo-staff-drawer__panel');
    const assignedListEl =
        staffDrawer?.querySelector('.uo-staff-assigned-list');

    function openStaffDrawer(blockId, blockLabel = '') {
        if (!staffDrawer) return;

        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        activeBlockId = blockId;

        // =========================
        // TITOLO
        // =========================
        const titleEl = document.getElementById('uo-staff-drawer-title');
        if (titleEl) {
            titleEl.textContent = `Staff — ${blockLabel || 'Blocco'}`;
        }

        // =========================
        // ORARIO DINAMICO
        // =========================
        const timeEl = document.getElementById('uo-staff-drawer-time');
        if (timeEl) {
            const unit = CONFIG.UNIT_MINUTES;

            const axisStart =
                cfg.axis_start_minutes ??
                (cfg.axis_start_slot * unit) ??
                0;

            const startMinutes = axisStart + block.tStart;
            const endMinutes = startMinutes + block.duration;

            timeEl.textContent =
                `${minutesToHHMM(startMinutes)} → ${minutesToHHMM(endMinutes)} • ${block.duration} min`;
        }

        // =========================
        // APERTURA DRAWER
        // =========================
        staffDrawer.classList.remove('is-hidden');
        staffDrawer.removeAttribute('inert');

        // =========================
        // STAFF ASSEGNATO (LISTA)
        // =========================
        renderAssignedStaff(block, assignedListEl);

        // =========================
        // AGGIUNTA RAPIDA ⚡ (INPUT + ENTER)
        // =========================
        const quickInput = staffDrawer.querySelector('[data-staff-quick-input]');
        const quickAddBtn = staffDrawer.querySelector('[data-staff-quick-add]');

        function handleQuickStaffAdd() {
            if (!quickInput) return;

            const name = quickInput.value.trim();
            if (!name) return;

            addQuickStaffToActiveBlock(name);

            quickInput.value = '';
            quickInput.focus();

            // aggiorna lista staff assegnato
            renderAssignedStaff(block, assignedListEl);

        }

        if (quickAddBtn) {
            quickAddBtn.onclick = handleQuickStaffAdd;
        }

        if (quickInput) {
            quickInput.onkeydown = (e) => {
                if (e.key !== 'Enter') return;
                if (e.shiftKey) return;

                e.preventDefault();
                handleQuickStaffAdd();
            };
        }

        // =========================
        // STAFF DELL’ACCOUNT (ACCORDION)
        // =========================
        const accountListEl = staffDrawer.querySelector('.uo-staff-account-list');
        const countEl = staffDrawer.querySelector('.uo-staff-accordion-count');

        if (!accountListEl || !countEl) {
            console.warn('Staff drawer: elementi DOM mancanti');
            return;
        }

        // Stato iniziale
        accountListEl.innerHTML = `
        <div class="uo-staff-account-empty text-white">
            Caricamento staff…
        </div>
    `;
        countEl.textContent = '(…)';

        // Fetch + render
        fetchAccountStaff()
            .then(staff => {
                accountStaffCache = Array.isArray(staff) ? staff : [];

                countEl.textContent = `(${accountStaffCache.length})`;

                if (!accountStaffCache.length) {
                    accountListEl.innerHTML = `
                    <div class="uo-staff-account-empty text-white">
                        Nessuno staff disponibile per questo account
                    </div>
                `;
                    return;
                }

                accountListEl.innerHTML = accountStaffCache.map(s => `
                <div class="uo-staff-row" data-staff-id="${s.id}">
                    <div class="uo-staff-main">
                        <span class="uo-staff-name">
                            ${s.stage_name ?? ''}
                            ${s.role
                        ? `<span class="uo-staff-role-inline"> (${s.role})</span>`
                        : (
                            Array.isArray(s.skills) && s.skills.length
                                ? `<span class="uo-staff-role-inline"> (${s.skills.join(', ')})</span>`
                                : ''
                        )
                    }
                        </span>
                    </div>

                    <button
                        type="button"
                        class="uo-staff-assign"
                        title="Assegna"
                        data-staff-id="${s.id}"
                    >+</button>
                </div>
            `).join('');
            })
            .catch(err => {
                console.error('Errore fetchAccountStaff:', err);
                accountStaffCache = [];
                countEl.textContent = '(!)';
                accountListEl.innerHTML = `
                <div class="uo-staff-account-empty text-white">
                    Errore caricamento staff
                </div>
            `;
            });
    }


    const assignedContainer = staffDrawer.querySelector('[data-staff-assigned]');
    if (!assignedContainer) {
        console.warn('assignedContainer not found');
    } else {
        initAssignedStaffActions({
            assignedContainer,
            getActiveBlock: () => blocks.find(b => b.id === activeBlockId),
            onRemove: (staffId) => removeStaffFromActiveBlock(staffId),
            onRename: ({ staffId, row }) => startQuickStaffRename({ staffId, row }),
        });
    }

    function initAssignedStaffActions({ assignedContainer, getActiveBlock, onRemove, onRename }) {
        const HOLD_TIME = 1500;

        let timer = null;
        let activeBtn = null;

        // pointerdown: start hold OR rename
        assignedContainer.addEventListener('pointerdown', (e) => {
            const row = e.target.closest('.uo-staff-assigned-row');
            if (!row) return;

            const staffId = row.dataset.staffId;
            if (!staffId) return;

            // ✏️ rename (click immediato)
            const renameBtn = e.target.closest('[data-rename]');
            if (renameBtn) {
                e.preventDefault();
                e.stopPropagation();
                onRename({ staffId, row });
                return;
            }

            // ❌ delete hold
            const removeBtn = e.target.closest('[data-remove]');
            if (!removeBtn) return;

            e.preventDefault();
            e.stopPropagation();

            // safety: serve blocco attivo
            const block = getActiveBlock();
            if (!block) return;

            activeBtn = removeBtn;

            // avvia animazione gauge
            removeBtn.classList.add('holding');
            removeBtn.style.setProperty('--holdTime', `${HOLD_TIME}ms`);

            // cattura pointer per ricevere pointerup anche se esci dal bottone
            try { removeBtn.setPointerCapture(e.pointerId); } catch { }

            timer = window.setTimeout(() => {
                onRemove(staffId);
                cleanupHold();
            }, HOLD_TIME);
        });

        // stop: pointerup/cancel
        assignedContainer.addEventListener('pointerup', cleanupHold);
        assignedContainer.addEventListener('pointercancel', cleanupHold);
        assignedContainer.addEventListener('pointerleave', cleanupHold);

        function cleanupHold() {
            if (!activeBtn) return;

            activeBtn.classList.remove('holding');
            if (timer) window.clearTimeout(timer);

            timer = null;
            activeBtn = null;
        }
    }


    function startQuickStaffRename({ staffId, row }) {
        const block = blocks.find(b => b.id === activeBlockId);
        if (!block) return;

        const member = block.staff.find(s => String(s.id) === String(staffId));
        if (!member || !member.isQuick) return;

        const nameEl = row.querySelector('.uo-staff-assigned-name');
        if (!nameEl) return;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = member.name;
        input.className = 'uo-staff-rename-input';

        nameEl.replaceWith(input);

        requestAnimationFrame(() => {
            input.focus();
            input.select();
        });

        const save = () => {
            const val = input.value.trim();
            if (val) {
                member.name = val;
                TimelineRepository.save(blocks);
            }

            renderAssignedStaff(block, assignedContainer);
            rerenderBlockStaff(block.id);
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                renderAssignedStaff(block, assignedContainer);
            }
        });
    }


    function removeStaffFromActiveBlock(staffId) {
        if (!activeBlockId) return;

        const block = blocks.find(b => b.id === activeBlockId);
        if (!block) return;

        block.staff = block.staff.filter(s => String(s.id) !== String(staffId));

        TimelineRepository.save(blocks);

        // UI sync
        renderAssignedStaff(block, assignedContainer);
        rerenderBlockStaff(block.id);
    }


    function closeStaffDrawer() {
        if (!staffDrawer) return;

        staffDrawer.classList.add('is-hidden');
        staffDrawer.setAttribute('inert', '');
    }

    function addQuickStaffToActiveBlock(name) {
        if (!activeBlockId) return;

        const block = blocks.find(b => b.id === activeBlockId);
        if (!block) return;

        block.staff = Array.isArray(block.staff) ? block.staff : [];

        // ❌ evita duplicati (case-insensitive) SOLO quick
        const exists = block.staff.some(
            s => s.isQuick && String(s.name).toLowerCase() === name.toLowerCase()
        );
        if (exists) return;

        block.staff.push({
            id: `quick_${Date.now()}`,
            name,
            role: '',
            isQuick: true
        });

        TimelineRepository.save(blocks);
        rerenderBlockStaff(block.id);
        renderAssignedStaff(block, assignedListEl);
    }

    const quickInput = staffDrawer.querySelector('[data-staff-quick-input]');
    const quickAddBtn = staffDrawer.querySelector('[data-staff-quick-add]');

    if (quickAddBtn && quickInput) {
        quickAddBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const name = quickInput.value.trim();

            // ❌ validazioni
            if (name.length < 3) {
                quickInput.classList.add('is-error');
                return;
            }

            quickInput.classList.remove('is-error');

            addQuickStaffToActiveBlock(name);

            quickInput.value = '';
        };
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.uo-staff-assign');
        if (!btn) return;

        const staffId =
            Number(btn.dataset.staffId) ||
            Number(btn.closest('.uo-staff-row')?.dataset.staffId);

        if (!staffId) return;

        handleAssignStaffFromDb(staffId);
    });

    function handleAssignStaffFromDb(staffId) {
        if (!activeBlockId) return;

        const block = blocks.find(b => b.id === activeBlockId);
        if (!block) return;

        block.staff = Array.isArray(block.staff) ? block.staff : [];

        // prende dallo stesso array usato per renderizzare l’accordion
        const staff = accountStaffCache.find(s => Number(s.id) === Number(staffId));
        if (!staff) return;

        // ❌ evita duplicati (DB)
        const alreadyExists = block.staff.some(m => !m.isQuick && Number(m.id) === Number(staff.id));
        if (alreadyExists) return;

        block.staff.push({
            id: staff.id,
            name: staff.stage_name ?? '',
            role: staff.role ?? '',
            isQuick: false,
        });

        TimelineRepository.save(blocks);
        rerenderBlockStaff(block.id);
        renderAssignedStaff(block, assignedListEl);

    }

    function rerenderBlockStaff(blockId) {
        const blockEl = document.querySelector(`.uo-timeline-block[data-block-id="${blockId}"]`);
        if (!blockEl) return;

        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        // 1) preferito: strip con data attr
        let staffContainer = blockEl.querySelector('[data-staff-strip]');

        // 2) fallback: vecchio container staff (se usi class diversa)
        if (!staffContainer) {
            staffContainer = blockEl.querySelector('.uo-block-staff-strip');
        }

        if (!staffContainer) {
            console.warn('rerenderBlockStaff: staff strip non trovata nel DOM');
            return;
        }

        staffContainer.outerHTML = renderStaffStrip(block);

        // se hai overflow logic
        if (typeof updateStaffOverflow === 'function') {
            updateStaffOverflow();
        }
    }
    // -------------------------------
    // CLOSE HANDLERS
    // -------------------------------
    // click su overlay o bottone X
    document.addEventListener('click', (e) => {
        if (!staffDrawer || staffDrawer.classList.contains('is-hidden')) return;

        if (
            e.target.matches('[data-close-staff-drawer]') ||
            (e.target === staffDrawer && !staffDrawerPanel.contains(e.target))
        ) {
            closeStaffDrawer();
        }
    });

    // ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeStaffDrawer();
        }
    });

    // ===============================
    // STAFF ACCORDION — OPEN / CLOSE
    // ===============================
    (function initStaffAccordion() {
        const drawer = document.getElementById('uo-staff-drawer');
        if (!drawer) return;

        const trigger = drawer.querySelector('[data-staff-accordion-toggle]');
        const panel = drawer.querySelector('[data-staff-accordion-panel]');

        if (!trigger || !panel) return;

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isOpen = trigger.getAttribute('aria-expanded') === 'true';

            if (isOpen) {
                // CLOSE
                trigger.setAttribute('aria-expanded', 'false');
                panel.hidden = true;
            } else {
                // OPEN
                trigger.setAttribute('aria-expanded', 'true');
                panel.hidden = false;
            }
        });
    })();

    document.addEventListener('click', e => {
        const toggle = e.target.closest('.uo-accordion-toggle');
        if (!toggle) return;

        toggle.classList.toggle('is-open');
        toggle.nextElementSibling.classList.toggle('is-open');
    });

    function updateStaffOverflow() {
        document.querySelectorAll('[data-staff-strip]').forEach(strip => {
            const chipsWrap = strip.querySelector('[data-staff-chips]');
            const chips = Array.from(chipsWrap?.children || []);
            const moreEl = strip.querySelector('[data-staff-more]');

            if (!chipsWrap || !moreEl) return;

            // reset
            chips.forEach(c => c.classList.remove('is-hidden'));
            moreEl.classList.add('is-hidden');
            moreEl.innerHTML = '';

            const maxWidth = chipsWrap.clientWidth * 0.8; // 🔑 soglia 80%
            let used = 0;
            let hiddenCount = 0;

            for (const chip of chips) {
                const w = chip.offsetWidth + 6; // gap stimato
                if (used + w <= maxWidth) {
                    used += w;
                } else {
                    chip.classList.add('is-hidden');
                    hiddenCount++;
                }
            }

            if (hiddenCount > 0) {
                moreEl.textContent = `+${hiddenCount}`;
                moreEl.classList.remove('is-hidden');
                //hover list
                moreEl.textContent = `+${hiddenCount}`;
                moreEl.dataset.staffHover = JSON.stringify(
                    chips
                        .filter(c => c.classList.contains('is-hidden'))
                        .map(c => c.textContent)
                );

            }
        });
    }

    let floatingStaffHover = null;
    let currentStaffTrigger = null;

    document.addEventListener('mouseover', (e) => {
        const target =
            e.target instanceof Element
                ? e.target
                : e.target.parentElement;

        if (!target) return;

        const trigger = target.closest('[data-staff-more]');
        if (!trigger) return;

        // se è già aperto per questo trigger, non rifare nulla
        if (floatingStaffHover && currentStaffTrigger === trigger) return;

        const items = JSON.parse(trigger.dataset.staffHover || '[]');
        if (!items.length) return;

        // cleanup eventuale
        floatingStaffHover?.remove();

        const rect = trigger.getBoundingClientRect();

        floatingStaffHover = document.createElement('div');
        floatingStaffHover.className = 'uo-staff-hover-floating';
        floatingStaffHover.innerHTML = items
            .map(n => `<div class="uo-staff-hover-item">${n}</div>`)
            .join('');

        floatingStaffHover.style.top = `${rect.bottom + 6}px`;
        floatingStaffHover.style.left = `${rect.left}px`;


        document.body.appendChild(floatingStaffHover);

        // 🔑 stato globale
        document.body.classList.add('is-staff-hover-open');
        currentStaffTrigger = trigger;
    });

    document.addEventListener('mouseout', (e) => {
        if (!floatingStaffHover) return;

        const from =
            e.target instanceof Element
                ? e.target
                : e.target.parentElement;

        const to =
            e.relatedTarget instanceof Element
                ? e.relatedTarget
                : e.relatedTarget?.parentElement;

        if (!from) return;

        const leavingTrigger = from.closest('[data-staff-more]');
        const enteringHover = to?.closest('.uo-staff-hover-floating');
        const enteringTrigger = to?.closest('[data-staff-more]');

        // se sto andando dal +X → hover (o viceversa), NON chiudere
        if (leavingTrigger && (enteringHover || enteringTrigger)) {
            return;
        }

        // chiusura reale
        floatingStaffHover.remove();
        floatingStaffHover = null;
        currentStaffTrigger = null;

        document.body.classList.remove('is-staff-hover-open');
    });

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
            updateStaffOverflow();
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

        const limits = getCollisionLimits({
            blocks,
            activeId: activeBlockId,
            timelineMinutes: cfg.total_slots * CONFIG.UNIT_MINUTES
        });

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

    function createBlockAt({ blocks, tStart }) {
        const newBlock = {
            id: generateId(),
            tStart,
            duration: 60,
            label: 'NEW SLOT',
            color: NEON_PALETTE[Math.floor(Math.random() * NEON_PALETTE.length)],
            staff: []
        };

        return {
            blocks: [...blocks, newBlock],
            activeBlockId: newBlock.id
        };
    }

    // ----------------
    // Pointer Down
    // ----------------
    canvas.addEventListener('pointerdown', (e) => {
        closeContextMenu();

        // ignora click destro mouse
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const targetBlock = e.target.closest('.uo-timeline-block');
        const targetResizer = e.target.closest('.uo-resizer');

        const rawY = getCanvasRelativeY(e.clientY, canvas);

        if (ghost) ghost.style.opacity = '0';

        const setActiveVisuals = (blockEl) => {
            canvas.querySelectorAll('.uo-timeline-block.is-active')
                .forEach(el => el.classList.remove('is-active'));
            if (blockEl) blockEl.classList.add('is-active');
        };

        /* =========================
           RESIZE
        ========================= */
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

        /* =========================
           DRAG
        ========================= */
        if (targetBlock) {

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

        /* =========================
           CREATE — GUARDIA GUTTER
        ========================= */

        if (currentGhostY == null) return;

        const clickedMinute =
            (currentGhostY / CONFIG.SLOT_HEIGHT) * CONFIG.UNIT_MINUTES;

        const MIN_DURATION = 60;
        const timelineEnd = cfg.total_slots * CONFIG.UNIT_MINUTES;

        // 🔧 se clicchi troppo in basso, shifta verso l’alto
        const probeMinute = Math.min(
            clickedMinute,
            timelineEnd - MIN_DURATION
        );

        const startMinute = findNearestFreeStart({
            blocks,
            clickedMinute,
            minDuration: MIN_DURATION,
            timelineEnd
        });

        if (startMinute === null) {
            toast(
                'warning',
                'Non c’è spazio sufficiente per creare un blocco',
                { duration: 2200 }
            );
            return;
        }

        const result = createBlockAt({
            blocks,
            tStart: startMinute
        });

        setActiveBlockId(result.activeBlockId);
        setBlocks(result.blocks);
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
        updateStaffOverflow();

        if (lastClientY !== null) updateGhostPosition(lastClientY);

        if (needsSave) TimelineRepository.save(blocks);
    });

    // ----------------
    // First render
    // ----------------
    renderBlocks();
    updateStaffOverflow();
});
