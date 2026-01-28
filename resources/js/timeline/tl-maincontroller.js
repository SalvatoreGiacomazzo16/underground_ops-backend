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
        updateStaffOverflow();
    }

    document.addEventListener('pointerdown', (e) => {
        if (contextMenuEl && !contextMenuEl.contains(e.target)) {
            closeContextMenu();
            if (e.target.closest('.uo-timeline-block')) {
                return;
            }
        }
    });

    // ----------------
    // Rendering Logic
    // ----------------
    function renderBlocks() {
        if (isEditingText) return;

        // pulizia
        canvas.querySelectorAll('.uo-timeline-block').forEach(el => el.remove());

        const timelineMinutes = cfg.total_slots * CONFIG.UNIT_MINUTES;
        const MIN_DURATION = 60;

        blocks.forEach(block => {
            if (!Array.isArray(block.staff)) block.staff = [];

            const snappedStart = snapToUnit(block.tStart);
            const snappedDuration = snapToUnit(block.duration);

            // durata minima garantita
            const safeDuration = Math.max(snappedDuration, MIN_DURATION);

            // fuori timeline
            if (snappedStart < 0 || snappedStart >= timelineMinutes) return;

            const top = minutesToPixels(snappedStart);
            const height = minutesToPixels(safeDuration);

            const el = document.createElement('div');
            el.className = 'uo-timeline-block';
            el.dataset.blockId = block.id;

            if (block.id === activeBlockId) {
                el.classList.add('is-active');
            }

            el.style.top = `${top}px`;
            el.style.height = `${height}px`;
            el.style.backgroundColor = block.color;

            // size class basata sull’altezza reale renderizzata
            let sizeClass = 'uo-block--m';
            if (height <= 80) sizeClass = 'uo-block--s';     // ~60 min
            else if (height >= 160) sizeClass = 'uo-block--l';
            el.classList.add(sizeClass);

            // markup
            el.innerHTML = `
            <button
            class="uo-block-delete"
            type="button"
            title="Elimina blocco"
            aria-label="Elimina blocco"
            data-delete-block
            >
            ×
            </button>

            <div class="uo-block-main">
                <div class="uo-block-title">
                ${block.label || 'SENZA TITOLO'}
                </div>

                <div class="uo-block-duration">
                ${safeDuration} min
                </div>
                </div>

                ${renderStaffStrip(block)}

                <div class="uo-resizer" title="Ridimensiona"></div>
                `;

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
                    deleteBlock(block.id);
                });
            }

            /* =========================
            INLINE EDIT TITOLO
            ========================= */
            const titleEl = el.querySelector('.uo-block-title');
            if (titleEl) {
                titleEl.addEventListener('pointerdown', e => {
                    e.stopPropagation(); // evita drag
                });

                titleEl.addEventListener('click', e => {
                    e.stopPropagation();
                    startInlineEdit(block.id, titleEl);
                });
            }

            /* =========================
            ADD STAFF (placeholder)
            ========================= */
            const staffAddBtn = el.querySelector('[data-staff-add]');
            if (staffAddBtn) {
                staffAddBtn.addEventListener('pointerdown', ev => {
                    ev.preventDefault();
                    ev.stopPropagation(); // evita drag
                });

                staffAddBtn.addEventListener('click', ev => {
                    ev.preventDefault();
                    ev.stopPropagation();

                    openStaffDrawer(block.id, block.label);
                });
            }

            // blocca drag quando si interagisce con +N
            const staffMore = el.querySelector('[data-staff-more]');
            if (staffMore) {
                staffMore.addEventListener('pointerdown', ev => {
                    ev.preventDefault();
                    ev.stopPropagation();
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

            canvas.appendChild(el);
        });
    }

    function minutesToHHMM(totalMinutes) {
        // supporta anche minuti > 1440 (multi-day)
        const m = Math.max(0, Math.floor(totalMinutes));
        const hh = Math.floor(m / 60) % 24;
        const mm = m % 60;

        const hStr = String(hh).padStart(2, '0');
        const mStr = String(mm).padStart(2, '0');
        return `${hStr}:${mStr}`;
    }

    let accountStaffCache = [];
    // ===============================
    // STAFF DRAWER — OPEN / CLOSE
    // ===============================
    async function fetchAccountStaff() {


        const res = await fetch('/admin/staff/json', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            }
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Fetch staff failed (${res.status}): ${text.slice(0, 200)}`);
        }

        return await res.json();


    }



    const staffDrawer = document.getElementById('uo-staff-drawer');
    const staffDrawerPanel = staffDrawer?.querySelector('.uo-staff-drawer__panel');

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
        // STEP 2C — POPOLA ACCORDION STAFF ACCOUNT
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



    function renderStaffStrip(block) {
        const staff = Array.isArray(block.staff) ? block.staff : [];

        // =========================
        // STATO VUOTO
        // =========================
        if (staff.length === 0) {
            return `
          <div class="uo-block-staff-strip is-empty" data-staff-strip>
            <span class="uo-staff-chip is-empty">
              <span class="uo-staff-icon">👥STAFF:</span>
              <span class="uo-staff-count">0</span>
              <button
                type="button"
                class="uo-staff-add"
                data-staff-add
                title="Aggiungi staff"
              >+</button>
            </span>
          </div>
        `;
        }

        // =========================
        // STATO CON STAFF
        // =========================
        const chips = staff.map(m => {
            const isQuick = !!m.isQuick;
            const role = (m.role || '').trim();
            const badge = isQuick ? '⚡' : (role ? role : '');
            const title = isQuick
                ? `${m.name} ⚡`
                : (role ? `${m.name} (${role})` : m.name);

            return `
          <span class="uo-staff-chip ${isQuick ? 'is-quick' : ''}"
                title="${escapeHtml(title)}">
            <span class="uo-staff-name">${escapeHtml(m.name)}</span>
            ${badge ? `<span class="uo-staff-badge">${escapeHtml(badge)}</span>` : ''}
          </span>
        `;
        }).join('');

        return `
      <div class="uo-block-staff-strip" data-staff-strip>
        ${chips}

        <!-- placeholder +x (calcolato DOPO) -->
        <span class="uo-staff-more is-hidden" data-staff-more></span>

        <button
          type="button"
          class="uo-staff-add"
          data-staff-add
          title="Aggiungi staff"
        >+</button>
      </div>
    `;
    }

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

                // hover list
                moreEl.innerHTML = `
        +${hiddenCount}
        <span class="uo-staff-hover">
          ${chips
                        .filter(c => c.classList.contains('is-hidden'))
                        .map(c => `<div class="uo-staff-hover-item">${c.textContent}</div>`)
                        .join('')}
        </span>
      `;
            }
        });
    }





    // helper semplice per evitare XSS nei title / html
    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }



    function deleteBlock(blockId) {
        blocks = blocks.filter(b => b.id !== blockId);
        activeBlockId = null;
        TimelineRepository.save(blocks);
        renderBlocks();
        updateStaffOverflow();
    }
    function openBlockContextMenu({ x, y, blockId }) {
        closeContextMenus();

        const menu = document.createElement('div');
        menu.className = 'uo-context-menu';

        menu.innerHTML = `
        <button class="uo-context-item uo-context-item--danger">
            Elimina blocco
        </button>
    `;

        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        document.body.appendChild(menu);

        // Click su "Elimina"
        menu.querySelector('.uo-context-item--danger')
            .addEventListener('click', e => {
                e.stopPropagation();
                deleteBlock(blockId);
                closeContextMenus();
            });

        // Click fuori → chiudi
        setTimeout(() => {
            document.addEventListener('click', closeContextMenus, { once: true });
        }, 0);


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

        // click destro mouse ignorato
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

        /* =========================
           CREATE — GUARDIA GUTTER
        ========================= */

        const y = e.clientY;
        const blockUnderCursor = Array.from(
            canvas.querySelectorAll('.uo-timeline-block')
        ).find(blockEl => {
            const r = blockEl.getBoundingClientRect();
            return y >= r.top && y <= r.bottom;
        });

        if (blockUnderCursor) {
            return;
        }

        /* =========================
           CREATE
        ========================= */

        if (currentGhostY === null) return;

        activeBlockId = null;

        const startSlot = Math.round(currentGhostY / CONFIG.SLOT_HEIGHT);
        let tStart = startSlot * CONFIG.UNIT_MINUTES;
        let tDuration = snapToUnit(CONFIG.DEFAULT_DURATION);

        const totalMinutes = cfg.total_slots * CONFIG.UNIT_MINUTES;

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
        updateStaffOverflow();
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
