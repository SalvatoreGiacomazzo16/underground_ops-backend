document.addEventListener("DOMContentLoaded", () => {

    const holdTime = 1500;

    document.querySelectorAll(".bar-delete").forEach(btn => {
        let timer = null;
        let holding = false;

        // passa holdTime al CSS
        btn.style.setProperty("--holdTime", holdTime + "ms");

        const start = (e) => {
            e.preventDefault();
            if (holding) return;
            holding = true;

            // attiva animazione CSS
            btn.classList.add("holding");

            timer = setTimeout(() => {
                doAjaxDelete(btn);
            }, holdTime);
        };

        const stop = () => {
            if (!holding) return;
            holding = false;

            clearTimeout(timer);
            timer = null;

            // ferma animazione / nasconde barra
            btn.classList.remove("holding");
        };

        // desktop
        btn.addEventListener("mousedown", start);
        btn.addEventListener("mouseup", stop);
        btn.addEventListener("mouseleave", stop);

        // mobile
        btn.addEventListener("touchstart", start);
        btn.addEventListener("touchend", stop);
        btn.addEventListener("touchcancel", stop);
    });

    function doAjaxDelete(btn) {
        const form = btn.closest("form");
        const row = btn.closest("tr");
        const url = form.action;
        const token = form.querySelector("input[name=_token]").value;

        fetch(url, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": token,
                "X-Requested-With": "XMLHttpRequest"
            },
            body: new FormData(form)
        }).then(() => {
            // fade-out riga
            row.style.transition = "opacity .3s";
            row.style.opacity = "0";
            setTimeout(() => row.remove(), 300);
        }).catch(err => {
            console.error(err);
            alert("Errore durante l'eliminazione.");
        });
    }

});
