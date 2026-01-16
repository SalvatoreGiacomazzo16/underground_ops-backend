// ================================
// 05_COMPONENTS.JS
// Generatori di HTML e Logica di Template
// ================================

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
// EVENT RANGE (HIGHLIGHT)
// ================================

export function renderEventRangeLegacy({
    canvas,
    eventStartMinutes,
    eventEndMinutes,
    rangeStartMinutes,
    pxPerMinute,
}) {
    if (!canvas || eventStartMinutes == null) return;

    let range = canvas.querySelector('.uo-event-range');
    if (!range) {
        range = document.createElement('div');
        range.className = 'uo-event-range';
        range.setAttribute('aria-hidden', 'true');
        canvas.appendChild(range);
    }

    const SNAP_MINUTES = 15;
    const snapDown = (m) => Math.floor(m / SNAP_MINUTES) * SNAP_MINUTES;
    const snapUp = (m) => Math.ceil(m / SNAP_MINUTES) * SNAP_MINUTES;

    let start = snapDown(eventStartMinutes);
    let end = snapUp(eventEndMinutes ?? (eventStartMinutes + 180));

    if (end < start) end += 24 * 60;

    const startOffset = start - rangeStartMinutes;
    const duration = end - start;

    range.style.top = `${startOffset * pxPerMinute}px`;
    range.style.height = `${duration * pxPerMinute}px`;
}

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
    // MULTIDAY TIME LABEL (SINGOLA, INTELLIGENTE)
    // =========================
    const isMulti = cfg.mode === "multi";

    if (isMulti) {
        el.querySelectorAll(".uo-range-time").forEach(n => n.remove());

        const clippedTop = !!cfg.event?.is_clipped_top;
        const clippedBottom = !!cfg.event?.is_clipped_bottom;

        const full = cfg.time_full;
        if (!full) return;

        const isFirstPage = !clippedTop;
        const isLastPage = !clippedBottom;

        let position = null;

        // 👉 LOGICA UX CORRETTA
        if (isFirstPage) {
            position = "top";
        } else {
            position = "bottom";
        }

        const badge = document.createElement("div");
        badge.className = `uo-range-time uo-range-time--${position}`;

        // testo badge
        let text = `${minutesToHHMM(full.start_minutes)} → ${minutesToHHMM(full.end_minutes)}`;

        // suffix SOLO nella prima pagina
        if (isFirstPage && clippedBottom) {
            text += " (continua →)";
        }

        badge.textContent = text;
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





