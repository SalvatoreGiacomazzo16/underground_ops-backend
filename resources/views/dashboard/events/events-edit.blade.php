@extends('layouts.admin')

@section('content')
<div class="container-fluid">

  <div class="d-flex align-items-center justify-content-between mb-4">
    <h1 class="fx-glitch uo-glitch-text mb-0">
        Modifica Evento
    </h1>

    <a
        href="{{ route('admin.events.staff.edit', $event) }}"
        class="uo-btn-secondary"
    >
        🎧 Gestisci Staff Evento
    </a>
</div>



    {{-- EVENTO --}}
    <div class="uo-card p-4 uo-form-animated mb-4">
        <form action="{{ route('admin.events.update', $event) }}" method="POST">
            @csrf
            @method('PUT')

            @include('dashboard.events.partials.events-form', [
                'event'     => $event,
                'locations' => $locations
            ])

            <button class="uo-btn-primary mt-4">
                Salva Modifiche
            </button>
        </form>
    </div>

    {{-- STAFF EVENTO --}}
    <div class="uo-card p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="mb-0">👥 Staff Evento</h3>

            <a
                href="{{ route('admin.events.staff.edit', $event) }}"
                class="uo-btn-secondary"
            >
                Gestisci Staff
            </a>
        </div>

        @if($event->staff->isEmpty())
            <div class="uo-empty-state text-secondary">
                Nessuno staff assegnato a questo evento.
            </div>
        @else
            <ul class="uo-staff-mini-list">
                @foreach($event->staff as $member)
                    <li class="uo-staff-mini-item">
                        <strong>{{ $member->stage_name }}</strong>
                        <span class="text-secondary">
                            {{ $member->pivot->role_in_event ?? 'Ruolo non specificato' }}
                        </span>
                    </li>
                @endforeach
            </ul>
        @endif
    </div>

</div>
@endsection
