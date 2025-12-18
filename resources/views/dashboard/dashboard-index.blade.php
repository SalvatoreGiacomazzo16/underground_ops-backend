@extends('layouts.admin')

@section('content')

<div class="uo-dashboard container-fluid">

    {{-- HERO --}}
    <div class="uo-hero mb-5">
        <div class="uo-hero-bg"></div>
        <div class="uo-hero-content">
            <h1 class="uo-hero-title">Benvenuto/a, {{ Auth::user()->name }}</h1>
            <p class="uo-hero-subtitle">CONTROL ROOM — UNDERGROUND OPS</p>
        </div>
    </div>

    {{-- KPI --}}
    <div class="row g-4 mb-5">

        <div class="col-6 col-md-3">
            <div class="uo-kpi-card">
                <div class="uo-kpi-value">{{ $totalEvents ?? 0 }}</div>
                <div class="uo-kpi-label">Eventi Totali</div>
            </div>
        </div>

        <div class="col-6 col-md-3">
            <div class="uo-kpi-card">
                <div class="uo-kpi-value">{{ $activeEvents }}</div>
                <div class="uo-kpi-label">Attivi</div>
            </div>
        </div>

        <div class="col-6 col-md-3">
            <div class="uo-kpi-card">
                <div class="uo-kpi-value">{{ $totalLocations ?? 0 }}</div>
                <div class="uo-kpi-label">Locations</div>
            </div>
        </div>

        <div class="col-6 col-md-3">
            <div class="uo-kpi-card">
                <div class="uo-kpi-value">{{ $staffCount ?? 0 }}</div>
                <div class="uo-kpi-label">Staff</div>
            </div>
        </div>

    </div>


{{-- Recent Events --}}
<div class="uo-section mb-5">
    <h2 class="uo-section-title">Ultimi Eventi</h2>

    <div class="uo-event-list">

        @forelse ($events->take(5) as $event)
            <div class="uo-event-item">

                {{-- INFO --}}
                <div class="uo-event-info">
                    <h4 class="uo-event-title">{{ $event->title }}</h4>

                    <p class="uo-event-meta">
                        {{ $event->start_datetime ? $event->start_datetime->format('d/m/Y H:i') : 'Data non definita' }}
                        —
                        {{ $event->location->name ?? 'Location non impostata' }}
                    </p>
                </div>

                {{-- BADGE STATUS --}}
                @php
                    $badgeClass = [
                        'published' => 'uo-badge-active',
                        'draft'     => 'uo-badge-draft',
                        'cancelled' => 'uo-badge-cancelled',
                        'archived'  => 'uo-badge-archived',
                    ][$event->status] ?? 'uo-badge-default';
                @endphp

                <span class="uo-badge {{ $badgeClass }}">
                    {{ ucfirst($event->status) }}
                </span>

            </div>
        @empty
            {{-- Nessun evento --}}
            <p class="text-secondary mt-3">Nessun evento presente.</p>
        @endforelse

    </div>
</div>

 {{-- OPERATIONS --}}
<div class="uo-section mb-5">

    <h2 class="uo-section-title">Operations</h2>
    <p class="uo-section-subtitle text-secondary">
        Azioni operative rapide
    </p>

    <div class="row g-4 mt-3">

        {{-- EVENTI --}}
        <div class="col-12 col-md-4">
            <div class="uo-operation-card">

                <div class="uo-operation-icon">
                    🎫
                </div>

                <div class="uo-operation-content">
                    <h4 class="uo-operation-title">Eventi</h4>
                    <p class="uo-operation-desc">
                        Crea e gestisci i tuoi eventi
                    </p>
                </div>

                <div class="uo-operation-actions">
                    <a href="{{ route('admin.events.create') }}" class="uo-btn uo-btn-primary">
                        + Nuovo Evento
                    </a>

                </div>

            </div>
        </div>

        {{-- LOCATION --}}
        <div class="col-12 col-md-4">
            <div class="uo-operation-card">

                <div class="uo-operation-icon">
                    📍
                </div>

                <div class="uo-operation-content">
                    <h4 class="uo-operation-title">Location</h4>
                    <p class="uo-operation-desc">
                        Gestisci venue e spazi
                    </p>
                </div>

                <div class="uo-operation-actions">
                    <a href="{{ route('admin.locations.index') }}" class="uo-btn uo-btn-primary">
                        Gestione Location
                    </a>
                </div>

            </div>
        </div>

        {{-- STAFF --}}
        <div class="col-12 col-md-4">
            <div class="uo-operation-card">

                <div class="uo-operation-icon">
                    👥
                </div>

                <div class="uo-operation-content">
                    <h4 class="uo-operation-title">Staff</h4>
                    <p class="uo-operation-desc">
                        Team, ruoli e assegnazioni
                    </p>
                </div>

                <div class="uo-operation-actions">
                    <a href="{{ route('admin.staff.create') }}" class="uo-btn uo-btn-primary">
                        + Aggiungi Staff
                    </a>
                </div>

            </div>
        </div>

    </div>

</div>


@endsection
