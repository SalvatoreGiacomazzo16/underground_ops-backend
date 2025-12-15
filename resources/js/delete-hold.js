document.addEventListener("DOMContentLoaded", () => {
    const HOLD_TIME = 1500;
    const csrfToken =
        document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

    let timer = null;
    let activeBtn = null;

    /* ============================
       EVENT DELEGATION
    ============================ */
    document.addEventListener("mousedown", onStart, true);
    document.addEventListener("touchstart", onStart, {
        passive: false,
        capture: true,
    });

    document.addEventListener("mouseup", onStop, true);
    document.addEventListener("mouseleave", onStop, true);
    document.addEventListener("touchend", onStop, true);
    document.addEventListener("touchcancel", onStop, true);

    function onStart(e) {
        const btn = e.target.closest("[data-delete-button]");
        if (!btn) return;

        const form = btn.closest("form[data-delete]");
        if (!form) return;

        e.preventDefault();

        activeBtn = btn;
        btn.classList.add("holding");
        btn.style.setProperty("--holdTime", HOLD_TIME + "ms");

        timer = setTimeout(() => {
            doDelete(form);
        }, HOLD_TIME);
    }

    function onStop() {
        if (!activeBtn) return;

        activeBtn.classList.remove("holding");
        clearTimeout(timer);

        timer = null;
        activeBtn = null;
    }

    /* ============================
       DELETE LOGIC
    ============================ */
    async function doDelete(form) {
        const url = form.action;
        const rowSelector = form.dataset.deleteRow;

        const row =
            (rowSelector ? form.closest(rowSelector) : null) ||
            form.closest("[data-location-col]") ||
            form.closest(".uo-event-card") ||
            form.closest("tr");

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": csrfToken,
                    "X-Requested-With": "XMLHttpRequest",
                    "Accept": "application/json",
                },
                body: new FormData(form),
                credentials: "same-origin",
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.error("DELETE FAIL", {
                    url,
                    status: res.status,
                    statusText: res.statusText,
                    body,
                });
                throw new Error(`Delete failed (${res.status})`);
            }

            if (row) {
                row.style.transition = "opacity .3s";
                row.style.opacity = "0";

                setTimeout(() => {

                    /* ============================
                       EVENT DAY CLEANUP
                    ============================ */

                    // ⬅️ PRENDI IL WRAPPER PRIMA
                    const dayWrapper = row.closest(".uo-event-day");

                    row.remove();

                    if (dayWrapper) {
                        const remainingEventsInDay =
                            dayWrapper.querySelectorAll(".uo-event-card").length;

                        if (remainingEventsInDay === 0) {
                            dayWrapper.remove();
                        }
                    }

                    /* ============================
                       GLOBAL EMPTY STATE
                    ============================ */

                    const remainingDays =
                        document.querySelectorAll(".uo-event-day").length;

                    if (remainingDays === 0) {
                        const timeline = document.querySelector(".uo-events-timeline");

                        if (timeline) {
                            timeline.innerHTML = `
                <div class="uo-empty-state text-center text-secondary py-5">
                    Nessun evento programmato.
                </div>
            `;
                        }
                    }

                }, 300);


            }
        } catch (err) {
            console.error(err);
            alert("Errore durante l'eliminazione.");
        } finally {
            onStop();
        }
    }
});
