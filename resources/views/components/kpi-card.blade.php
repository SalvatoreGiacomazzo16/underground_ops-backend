<div class="card shadow-sm h-100">
    <div class="card-body d-flex flex-column">
        <h6 class="text-muted mb-2">{{ $title }}</h6>
        <h2 class="fw-bold mb-3">{{ $value }}</h2>

        <div class="mt-auto">
            {{ $slot }}
        </div>
    </div>
</div>
