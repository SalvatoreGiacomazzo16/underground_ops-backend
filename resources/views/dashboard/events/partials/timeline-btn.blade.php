@props([
    'activeEventId' => null
])

<a
    href="#"
    class="uo-timeline-cta is-disabled"
    aria-disabled="true"
    tabindex="-1"
    data-timeline-cta
    data-href-template="{{ route('admin.events.timeline', '__EVENT__') }}"
>
    <span class="uo-timeline-cta__icon" aria-hidden="true">
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            aria-hidden="true"
        >
            <path
                d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                fill="currentColor"
            />
        </svg>
    </span>

    <span class="uo-timeline-cta__label">Organizza</span>
</a>
