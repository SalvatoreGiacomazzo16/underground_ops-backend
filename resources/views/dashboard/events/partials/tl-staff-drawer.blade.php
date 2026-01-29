{{-- ======================================================
   STAFF DRAWER — Timeline
   Lives outside the timeline canvas (global overlay)
====================================================== --}}

<div
    id="uo-staff-drawer"
    class="uo-staff-drawer is-hidden"
>
    {{-- OVERLAY --}}
    <div
        class="uo-staff-drawer__overlay"
        data-close-staff-drawer
    ></div>

    {{-- PANEL --}}
    <aside
        class="uo-staff-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="uo-staff-drawer-title"
    >
      <header class="uo-staff-drawer__header">
    <div class="uo-staff-drawer__header-main">
        <h3
            id="uo-staff-drawer-title"
            class="uo-staff-drawer__title"
        >
            Staff
        </h3>

        <div
            id="uo-staff-drawer-time"
            class="uo-staff-drawer__time"
        >
            {{-- popolato via JS --}}
        </div>
    </div>

    <button
        type="button"
        class="uo-staff-drawer__close"
        data-close-staff-drawer
        aria-label="Chiudi pannello staff"
    >
        ×
    </button>
</header>

<section class="uo-staff-drawer__content">

    {{-- =========================
        STAFF ASSEGNATO (VERITÀ)
    ========================== --}}
    <div class="uo-staff-section">
        <h4 class="uo-staff-section__title">
            Staff assegnato
        </h4>

        <div class="uo-staff-assigned-list" data-staff-assigned>
            {{-- Stato vuoto --}}
            <div class="uo-staff-empty">
                Nessuno staff assegnato a questo blocco
            </div>


        </div>
    </div>

    <hr class="uo-staff-divider">

    {{-- =========================
        AGGIUNTA RAPIDA ⚡
    ========================== --}}
    <div class="uo-staff-section">
        <h4 class="uo-staff-section__title">
            Aggiunta rapida ⚡
        </h4>

        <div class="uo-staff-quick-add">
            <input
                type="text"
                class="uo-input"
                placeholder="Nome staff al volo"
                data-staff-quick-input
            >

            <button
                type="button"
                class="uo-btn uo-btn-outline"
                data-staff-quick-add
            >
                +
            </button>
        </div>
    </div>

    <hr class="uo-staff-divider">

    {{-- =========================
        STAFF DELL’ACCOUNT (ACCORDION)
    ========================== --}}
    <div class="uo-staff-section">

        <button
            type="button"
            class="uo-staff-accordion-trigger"
            data-staff-accordion-toggle
            aria-expanded="false"
        >
            <span class="uo-staff-accordion-arrow">▶</span>
            <span class="uo-staff-accordion-title">
                Staff dell'account
            </span>
            <span class="uo-staff-accordion-count">
                (0)
            </span>
        </button>

        <div
            class="uo-staff-accordion-panel"
            data-staff-accordion-panel
            hidden
        >
            {{-- Placeholder statico --}}
            <div class="uo-staff-account-list">

                <div class="uo-staff-account-empty text-white">
                    Nessuno staff disponibile per questo account
                </div>


            </div>
        </div>

    </div>

</section>

</div>
