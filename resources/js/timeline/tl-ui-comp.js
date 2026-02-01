// ================================
// 05_COMPONENTS.JS
// Generatori di HTML e Logica di Template
// ================================
import { escapeHtml } from './tl-utils.js';

// ================================
// STAFF RENDERING
// ================================

export function renderStaffRow(block) {
    const staff = Array.isArray(block.staff) ? block.staff : [];

    // --- Empty state
    if (staff.length === 0) {
        return `
        <div class="uo-block-staff uo-block-staff--empty">
            <button class="uo-block-staff-add" data-add-staff>
                + Staff
            </button>
        </div>
        `;
    }

    const MAX_VISIBLE = 3;
    const visibleStaff = staff.slice(0, MAX_VISIBLE);
    const extraCount = staff.length - MAX_VISIBLE;

    const chips = visibleStaff.map(member => `
        <span
            class="uo-staff-chip ${member.isQuick ? 'is-quick' : ''}"
            data-staff-id="${member.id}"
            tabindex="0"
            title="${member.isQuick
            ? 'Aggiunto rapidamente (non salvato)'
            : (member.role || '')
        }"
        >
            <span class="uo-staff-chip-label">
                ${member.name}${member.isQuick ? ' ⚡' : ''}
            </span>
        </span>
    `).join('');

    const extraChip = extraCount > 0
        ? `
        <span class="uo-staff-chip uo-staff-chip--more" title="Altri staff">
            +${extraCount}
        </span>
        `
        : '';

    return `
        <div class="uo-block-staff">
            <div class="uo-block-staff-list">
                ${chips}
                ${extraChip}
            </div>

            <button
                class="uo-block-staff-add"
                data-add-staff
                title="Aggiungi staff"
            >
                +
            </button>
        </div>
    `;
}

// ================================
// TIME AXIS GENERATOR
// ================================

export function generateTimeSlots({
    axisStartSlot,
    totalSlots,
    unitMinutes = 15
}) {
    const slots = [];

    // 🔑 usa < totalSlots (non <=) se vuoi esattamente totalSlots righe.
    // Se invece vuoi includere l'ultima linea, lascia <=.
    for (let i = 0; i <= totalSlots; i++) {
        const absoluteMinutes = (axisStartSlot + i) * unitMinutes;
        const isHour = (absoluteMinutes % 60) === 0;

        const norm = ((absoluteMinutes % 1440) + 1440) % 1440;
        const hour = Math.floor(norm / 60);

        slots.push({
            index: i,
            absoluteMinutes,              // ✅ FIX: ora esiste
            isHour,
            displayHour: isHour ? String(hour).padStart(2, "0") : null
        });
    }

    return slots;
}

// ================================
// TIME AXIS RENDER (SLOT-BASED)
// ================================
export function renderTimeAxis(cfg, { UNIT_MINUTES }) {
    const axis = document.getElementById('timeline-axis');
    if (!axis) return [];

    axis.innerHTML = '';

    const slots = generateTimeSlots({
        axisStartSlot: cfg.axis_start_slot,
        totalSlots: cfg.total_slots,
        unitMinutes: UNIT_MINUTES
    });

    slots.forEach(slot => {
        const el = document.createElement('div');
        el.className = 'uo-timeline-axis-slot';

        if (slot.isHour) {
            el.classList.add('is-hour');
            el.textContent = slot.displayHour;
        }

        axis.appendChild(el);
    });

    return slots;
}

export function updateTimelineHeaderContext(cfg) {
    if (!cfg || cfg.mode !== "multi") return;

    const dateEl = document.getElementById("uo-timeline-current-date");
    const statusEl = document.getElementById("uo-timeline-date-status");
    if (!dateEl || !statusEl) return;

    const startDateStr = dateEl.dataset.startDate;
    if (!startDateStr) return;

    const baseDate = new Date(startDateStr);
    const windowIndex = cfg.page?.index ?? 0;

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

    statusEl.textContent = label;
    statusEl.className = `uo-meta-status ${cls}`;
}





// ================================
// EVENT RANGE (HIGHLIGHT)
// ================================


export function renderEventRangeFromAxis({
    canvas,
    slots,
    eventStartMinutes,
    eventEndMinutes,
    unitMinutes,    // CONFIG.UNIT_MINUTES
    slotHeight      // CONFIG.SLOT_HEIGHT
}) {
    if (!canvas || !Array.isArray(slots) || slots.length === 0) return;
    if (eventStartMinutes == null) return;

    let range = canvas.querySelector(".uo-event-range-axis");
    if (!range) {
        range = document.createElement("div");
        range.className = "uo-event-range uo-event-range-axis";
        range.setAttribute("aria-hidden", "true");
        canvas.appendChild(range);
    }

    // overnight normalize rispetto allo start
    const normalize = (m) => {
        let mm = m;
        if (mm != null && mm < eventStartMinutes) mm += 1440;
        return mm;
    };

    const startAbs = normalize(eventStartMinutes);
    const endAbs = normalize(eventEndMinutes ?? (eventStartMinutes + 180));

    const snapDown = (m) => Math.floor(m / unitMinutes) * unitMinutes;
    const snapUp = (m) => Math.ceil(m / unitMinutes) * unitMinutes;

    const startSnap = snapDown(startAbs);
    const endSnap = snapUp(endAbs);

    const axisAbs0 = slots[0].absoluteMinutes; // ✅ ora esiste
    const startIndex = Math.round((startSnap - axisAbs0) / unitMinutes);
    const endIndex = Math.round((endSnap - axisAbs0) / unitMinutes);

    const si = Math.max(0, Math.min(slots.length - 1, startIndex));
    const ei = Math.max(0, Math.min(slots.length - 1, endIndex));

    const topPx = si * slotHeight;
    const heightPx = Math.max(slotHeight, (ei - si) * slotHeight);

    range.style.top = `${topPx}px`;
    range.style.height = `${heightPx}px`;

}



function minutesToHHMM(totalMinutes) {
    // ora leggibile anche se totalMinutes > 1440
    const minutes = ((totalMinutes % 1440) + 1440) % 1440;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}


export function renderEventRangeFromSlots({ canvas, slotHeight }) {
    const cfg = window.__TIMELINE_CONFIG__;
    if (!cfg?.event) return;

    let el = canvas.querySelector(".uo-event-range");
    if (!el) {
        el = document.createElement("div");
        el.className = "uo-event-range uo-event-range--slots";
        canvas.appendChild(el);
    }



    const unit = cfg.unit_minutes ?? 15;

    // axis start minutes: in MULTI abbiamo axis_start_minutes (assoluti)
    const axisStartMinutes =
        cfg.axis_start_minutes ??
        cfg.axis_start_slot * unit;

    // ===== RANGE VISIVO (sempre clippato, così non si “comprimes”)
    // in SINGLE usa time_real (0..1440 o 1440+ se overnight)
    // in MULTI time_real è già assoluto e clippato alla finestra
    const vis = cfg.time_real;
    if (!vis?.start_minutes || !vis?.end_minutes) return;

    const startMinVis = vis.start_minutes;
    const endMinVis = vis.end_minutes;

    const relStart = startMinVis - axisStartMinutes;
    const relEnd = endMinVis - axisStartMinutes;

    const pxPerMinute = slotHeight / unit;
    const top = relStart * pxPerMinute;
    const height = Math.max(2, (relEnd - relStart) * pxPerMinute);

    el.style.top = `${top}px`;
    el.style.height = `${height}px`;

    // =========================
    // MULTIDAY TIME LABEL — SOLO IN FONDO
    // =========================
    const isMulti = cfg.mode === "multi";

    if (isMulti) {
        // pulizia
        el.querySelectorAll(".uo-range-time").forEach(n => n.remove());

        const clippedBottom = !!cfg.event?.is_clipped_bottom;
        const full = cfg.time_full;
        if (!full) return;

        // 👉 badge SEMPRE e SOLO in basso
        const badge = document.createElement("div");
        badge.className = "uo-range-time uo-range-time--bottom";
        badge.textContent =
            `${minutesToHHMM(full.start_minutes)} → ${minutesToHHMM(full.end_minutes)}`;

        el.appendChild(badge);





    }



    // ===== TOOLTIP (QUI È LA FIX)
    // MULTI: mostra SEMPRE il range completo dell’evento
    // SINGLE: mostra il range reale (eventuale overnight)

    const full = cfg.time_full;

    const tooltipStart = isMulti && full?.start_minutes != null
        ? full.start_minutes
        : startMinVis;

    const tooltipEnd = isMulti && full?.end_minutes != null
        ? full.end_minutes
        : endMinVis;

    // suffix “continua” se clippato nella finestra corrente
    const clippedTop = !!cfg.event?.is_clipped_top;
    const clippedBottom = !!cfg.event?.is_clipped_bottom;

    let suffix = "";
    if (isMulti) {
        if (clippedTop && clippedBottom) suffix = "  (← continua • continua →)";
        else if (clippedTop) suffix = "  (← continua)";
        else if (clippedBottom) suffix = "  (continua →)";
    }

    el.dataset.tooltip =
        `${minutesToHHMM(tooltipStart)} → ${minutesToHHMM(tooltipEnd)}` +
        suffix;

}

//STAFF STRIP
export function renderStaffStrip(block) {
    const staff = Array.isArray(block.staff) ? block.staff : [];
    const MAX_VISIBLE = 7;

    // =========================
    // STATO VUOTO
    // =========================
    if (staff.length === 0) {
        return `
        <div class="uo-block-staff-strip is-empty" data-staff-strip>
            <span class="uo-staff-chip is-empty">
                <span class="uo-staff-icon">👥</span>
                <span class="uo-staff-count">STAFF: 0</span>
            </span>
        </div>
        `;
    }

    const visibleStaff = staff.slice(0, MAX_VISIBLE);
    const hiddenStaff = staff.slice(MAX_VISIBLE);
    const hiddenCount = hiddenStaff.length;

    // =========================
    // CHIP CON RUOLO TRA PARENTESI
    // =========================
    const chips = visibleStaff.map(m => {
        const isQuick = !!m.isQuick;
        const role = (m.role || '').trim();

        return `
        <span class="uo-staff-chip ${isQuick ? 'is-quick' : ''}">
            <span class="uo-staff-name">
                ${escapeHtml(m.name)}
                ${!isQuick && role ? ` <span class="uo-staff-role-inline">(${escapeHtml(role)})</span>` : ''}
            </span>
            ${isQuick ? `<span class="uo-staff-badge">⚡</span>` : ''}
        </span>
    `;
    }).join('');


    // =========================
    // +X CON HOVER LIST
    // =========================
    const more = hiddenCount > 0 ? `
        <span class="uo-staff-more">
            +${hiddenCount}

            <div class="uo-staff-hover">
                ${hiddenStaff.map(m => `
                    <div class="uo-staff-hover-item">
                        <span class="uo-staff-hover-name">
                            ${escapeHtml(m.name)}
                        </span>
                        ${m.isQuick
            ? `<span class="uo-staff-hover-badge">⚡</span>`
            : m.role
                ? `<span class="uo-staff-hover-badge">${escapeHtml(m.role)}</span>`
                : ''
        }
                    </div>
                `).join('')}
            </div>
        </span>
    ` : '';

    return `
    <div class="uo-block-staff-strip" data-staff-strip>
        ${chips}
        ${more}
    </div>
    `;
}


export function renderAssignedStaff(block, container) {
    if (!container) return;

    if (!block.staff || block.staff.length === 0) {
        container.innerHTML = `
            <div class="uo-staff-assigned-empty">
                Nessuno staff assegnato a questo blocco
            </div>
        `;
        return;
    }

    container.innerHTML = block.staff.map(m => `
        <div class="uo-staff-assigned-row" data-staff-id="${m.id}">
            <span class="uo-staff-assigned-name">
                ${m.isQuick ? '⚡' : '👤'} ${escapeHtml(m.name)}
            </span>
            <div class="uo-staff-assigned-actions">
                ${m.isQuick ? `<button data-rename>✏️</button>` : ''}
                <button data-remove>✕</button>
            </div>
        </div>
    `).join('');
}

// ================================
// COLOR CONTEXT MENU (UI WORKFLOW)
// ================================
export function initColorMenu({
    blocks,
    canvas,
    palette,
    onUpdate
}) {
    let contextMenuEl = null;

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

        palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'uo-color-swatch';
            swatch.style.backgroundColor = color;

            swatch.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();

                onUpdate(blockId, color);
                closeContextMenu();
            });

            menu.appendChild(swatch);
        });

        document.body.appendChild(menu);
        contextMenuEl = menu;
    }

    // Chiudi menu se clicchi fuori
    document.addEventListener('pointerdown', (e) => {
        if (contextMenuEl && !contextMenuEl.contains(e.target)) {
            closeContextMenu();
        }
    });

    return {
        openColorMenu,
        closeContextMenu
    };
}


