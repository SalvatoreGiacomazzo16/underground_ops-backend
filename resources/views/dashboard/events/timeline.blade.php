@extends('layouts.admin')

@section('content')
@php
    $eventDate = null;
    $statusLabel = null;
    $statusClass = null;

    if ($event->start_datetime) {
        $eventDate = \Carbon\Carbon::parse($event->start_datetime)->startOfDay();
        $today = now()->startOfDay();

        $diffDays = $today->diffInDays($eventDate, false);

        if ($diffDays === 0) {
            $statusLabel = 'Oggi';
            $statusClass = 'is-today';
        } elseif ($diffDays > 0) {
            $months = intdiv($diffDays, 30);
            $days = $diffDays % 30;

            if ($months > 0) {
                $monthLabel = $months === 1 ? 'mese' : 'mesi';
                $dayLabel   = $days === 1 ? 'giorno' : 'giorni';

                $statusLabel = "tra {$months} {$monthLabel}";
                if ($days > 0) {
                    $statusLabel .= " e {$days} {$dayLabel}";
                }
            } else {
                $dayLabel = $diffDays === 1 ? 'giorno' : 'giorni';
                $statusLabel = "tra {$diffDays} {$dayLabel}";
            }

            $statusClass = 'is-future';
        } else {
            $pastDays = abs($diffDays);
            $dayLabel = $pastDays === 1 ? 'giorno' : 'giorni';
            $statusLabel = "terminato {$pastDays} {$dayLabel} fa";
            $statusClass = 'is-past';
        }
    }
@endphp


<div class="uo-timeline">
<script>
    window.UO_CONTEXT = {
        userId: {{ auth()->id() }},
        eventId: {{ $event->id }}
    };
</script>


 {{-- HEADER TIMELINE — EVENT CONTEXT --}}
<div class="uo-timeline-header">

    <div class="uo-timeline-header__stack">

        <div class="uo-timeline-header__main">
            <span class="uo-meta-label">Evento</span>
            <strong class="uo-meta-value">
                {{ $event->title }}
            </strong>
        </div>

        @if($event->start_datetime)
            <div class="uo-timeline-header__date">
                <span class="uo-meta-date">
                    📅 {{ $eventDate->translatedFormat('l d F Y') }}
                </span>

                <span class="uo-meta-status {{ $statusClass }}">
                    {{ $statusLabel }}
                </span>
            </div>
        @endif

        @if($event->location)
            <div class="uo-timeline-header__sub">
                <span class="uo-meta-separator">•</span>
                <span class="uo-meta-value">
                   <strong>{{ $event->location->name }}</strong>
                </span>
            </div>
        @endif

    </div>
</div>


<script>
  window.__TIMELINE_EVENT__ = {
    start: @json(optional($event->start_datetime)->toIso8601String()),
    end:   @json(optional($event->end_datetime)->toIso8601String()),
  };
</script>





    {{-- BODY --}}
    {{-- Questo è il contenitore che gestisce lo scroll verticale (scrollTop) --}}
    <div class="uo-timeline-body">

        {{-- AXIS: Colonna sinistra dove JS inietta gli orari --}}
        <div class="uo-timeline-axis" id="timeline-axis"></div>

        {{-- CANVAS: Area interattiva destra --}}
        <div class="uo-timeline-canvas">
            {{-- GHOST: Linea guida per lo snap --}}
            <div class="uo-timeline-ghost"></div>

            {{-- I blocchi (.uo-timeline-block) verranno iniettati qui dal JS --}}
{{-- Range visivo inizio - fine evento --}}
            <div class="uo-event-range" aria-hidden="true"></div>

        </div>
    </div>

</div>
@endsection
