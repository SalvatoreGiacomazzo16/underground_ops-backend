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

    {{-- Quick Actions --}}
  <div class="uo-quick-actions mb-5">

    {{-- CREA EVENTO --}}
    <a href="{{ route('admin.events.create') }}" class="uo-dashboard-btn">
        + Nuovo Evento
    </a>

    {{-- LOCATION --}}
   <a href="{{ route('admin.locations.index') }}" class="uo-dashboard-btn">
    Gestione Location
</a>


   {{-- STAFF --}}
<a href="{{ route('admin.staff.create') }}" class="uo-dashboard-btn">
   + Staff
</a>

</div>


    {{-- Analytics Placeholder --}}
    <div class="uo-section mb-5">
        <h2 class="uo-section-title">Analytics</h2>

        <div class="uo-analytics-card">
            <canvas id="eventsChart"></canvas>
        </div>
    </div>

</div>

@endsection
