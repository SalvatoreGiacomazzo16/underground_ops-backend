@extends('layouts.admin')

@if ($errors->any())
    <div class="alert alert-danger mb-4">
        <ul class="mb-0">
            @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

@section('content')
<div class="container-fluid">

    <h1 class="fx-glitch uo-glitch-text mb-4">Crea Nuovo Evento</h1>

    <div class="uo-card p-4 uo-form-animated">
        <form action="{{ route('admin.events.store') }}" method="POST">
            @csrf

            @include('dashboard.events.partials.events-form', [
                'locations' => $locations
            ])

            <button class="uo-btn-primary mt-4">
                Crea Evento
            </button>
        </form>
    </div>

</div>
@endsection

<script>
document.addEventListener('DOMContentLoaded', () => {
    const start = document.getElementById('start_datetime');
    const end   = document.getElementById('end_datetime');

    if (!start) return;

    const form = start.closest('form');
    if (!form) return;

    // ⏱ tolleranza 5 minuti
    const TOLERANCE_MS = 5 * 60 * 1000;

    form.addEventListener('submit', (e) => {
        if (!start.value) return;

        const startDate = new Date(start.value);
        const now = new Date();

        /* ============================
           START DATE — NOT IN PAST
        ============================ */

        if (startDate.getTime() < now.getTime() - TOLERANCE_MS) {
            e.preventDefault();
            window.toast('error', 'La data di inizio non può essere nel passato.');

            return;
        }

        /* ============================
           END DATE — OPTIONAL CHECK
           (solo se valorizzata)
        ============================ */

        if (end && end.value) {
            const endDate = new Date(end.value);

            if (endDate.getTime() <= startDate.getTime()) {
                e.preventDefault();
               window.toast('error', 'La data di fine deve essere successiva a quella di inizio.');

                return;
            }
        }
    });
});
</script>

