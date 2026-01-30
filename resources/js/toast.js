window.toast = function (
    type = 'info',
    message = '',
    options = {}
) {
    const {
        duration = 4000,
    } = options;

    const container = document.getElementById('uo-toasts');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `uo-toast ${type}`;

    toast.innerHTML = `
        <div class="uo-toast-content">${message}</div>
        <div class="uo-toast-close">×</div>
    `;

    container.appendChild(toast);

    const close = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 200);
    };

    toast.querySelector('.uo-toast-close').addEventListener('click', close);

    if (duration > 0) {
        setTimeout(close, duration);
    }


};
