@extends('layouts.admin')

@section('content')
  {{-- HERO --}}
    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Gestione Eventi</h1>
        <p class="text-secondary">EVENTS MANAGEMENT — UNDERGROUND OPS</p>
    </div>
<div class="uo-dashboard container-fluid">

    {{-- ACTION BAR --}}
    <div class="uo-quick-actions mb-4 d-flex gap-2 flex-wrap align-items-center">
        <a href="{{ route('admin.events.create') }}"
           class="uo-dashboard-btn">
            + Nuovo Evento
        </a>

        {{-- TOGGLE FORMATO --}}
        <a href="{{ request()->routeIs('admin.events.index')
                    ? route('admin.events.table')
                    : route('admin.events.index') }}"
           class="uo-dashboard-btn uo-dashboard-btn--ghost ms-auto">
            Cambia formato
        </a>
    </div>

    {{-- HEADER --}}
    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Eventi</h1>
        <p class="text-secondary">TIMELINE OPERATIVA — UNDERGROUND OPS</p>
    </div>

    {{-- TIMELINE --}}
    <div class="uo-events-timeline" data-events-timeline>

        @forelse($eventsByDay as $date => $events)

          @php
    $dayStart = \Carbon\Carbon::parse($date);

    // trova la data di fine più lontana tra gli eventi di quel giorno
    $dayEnd = $events
        ->pluck('end_datetime')
        ->filter()
        ->map(fn ($d) => \Carbon\Carbon::parse($d))
        ->max();

    $isMultiDay = $dayEnd && !$dayStart->isSameDay($dayEnd);

    $label = null;
    if (!$isMultiDay) {
        if ($dayStart->isToday()) $label = 'OGGI';
        elseif ($dayStart->isTomorrow()) $label = 'DOMANI';
    }

    $headerText = $isMultiDay
        ? ($dayStart->translatedFormat('d F') . ' → ' . $dayEnd->translatedFormat('d F'))
        : $dayStart->translatedFormat('l d F');
@endphp


            <div class="uo-event-day mb-5" data-event-day>

                {{-- DAY HEADER --}}
                <div class="uo-event-day-header mb-3">
                    @if($label)
                        <span class="uo-event-day-label">{{ $label }}</span>
                    @endif

                    <h3 class="uo-event-day-date">
                        {{ $headerText }}
                    </h3>
                </div>

                {{-- EVENTS --}}
                @foreach($events as $event)

                    @php
                        $badgeClass = [
                            'published' => 'uo-badge-active',
                            'draft'     => 'uo-badge-draft',
                            'cancelled' => 'uo-badge-cancelled',
                            'archived'  => 'uo-badge-archived',
                        ][$event->status] ?? 'uo-badge-default';
                    @endphp

                    <div class="uo-event-card" data-event-card>

                        {{-- HEADER --}}
                        <div class="uo-event-card-header d-flex justify-content-between align-items-start gap-3">

                            {{-- TITLE + BADGE --}}
                            <div class="uo-event-title-wrap d-flex align-items-center gap-2">
                                <h4 class="uo-event-title mb-0">
                                    {{ $event->title }}
                                </h4>

                                <span class="uo-badge {{ $badgeClass }}">
                                    {{ strtoupper($event->status) }}
                                </span>
                            </div>

                            {{-- ACTIONS --}}
                            <div class="uo-event-card-actions d-flex gap-2">
                                <a href="{{ route('admin.events.edit', $event) }}"
                                   class="uo-action-icon edit">
                                    @include('icons.edit')
                                </a>

<form
    action="{{ route('admin.events.destroy', $event) }}"
    method="POST"
    data-delete
    data-delete-row=".uo-event-card"
>
    @csrf
    @method('DELETE')

    <button
        type="button"
        class="uo-action-icon delete bar-delete"
        data-delete-button
    >
        @include('icons.delete')
        <span class="delete-bar"></span>
    </button>
</form>

                            </div>

                        </div>

                        {{-- META --}}
                        <div class="uo-event-meta">
                            <span class="uo-event-time">
                                {{ $event->start_datetime->format('H:i') }}
                                @if($event->end_datetime)
                                    → {{ $event->end_datetime->format('H:i') }}
                                @endif
                            </span>

                            <span class="uo-event-location">
                                {{ $event->location->name ?? '—' }}
                            </span>

                            <span class="uo-event-type">
                                {{ strtoupper($event->event_type) }}
                            </span>
                        </div>
                    {{-- TIMELINE ENTRY POINT --}}
<div class="uo-event-card-footer mt-3">
    <a href="{{ route('admin.events.timeline', $event) }}"
       class="uo-timeline-btn">
        Organizza la serata
    </a>
</div>
                    </div>


                @endforeach

            </div>

        @empty
            <div class="uo-empty-state text-center text-secondary py-5">
                Nessun evento programmato.
            </div>
        @endforelse

    </div>

</div>
@endsection
