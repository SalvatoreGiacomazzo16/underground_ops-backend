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

    $isMulti = ($timelineConfig['mode'] ?? 'single') === 'multi';
@endphp

<div class="uo-timeline">

    {{-- CONTEXT JS --}}
    <script>
        window.UO_CONTEXT = {
            userId: {{ auth()->id() }},
            eventId: {{ $event->id }}
        };
    </script>

    {{-- =========================
         HEADER TIMELINE
    ========================== --}}
    <div class="uo-timeline-header">

  @if($isMulti)
    <div class="uo-timeline-multiday">

        <span class="uo-meta-badge is-multiday">
            ⏱ evento multi-giorno
        </span>

        <div class="uo-timeline-pagination">

            {{-- PRECEDENTE --}}
            @if(!$timelineConfig['page']['is_first'])
                <a
                    href="{{ route('admin.events.timeline', $event) }}?page={{ $timelineConfig['page']['index'] - 1 }}"
                    class="uo-timeline-nav is-prev"
                >
                    ← precedente
                </a>
            @else
                <span class="uo-timeline-nav is-prev is-disabled">
                    ← precedente
                </span>
            @endif

            {{-- INDICATORE --}}
            <span class="uo-timeline-page-indicator">
                Finestra
                <strong>{{ $timelineConfig['page']['index'] + 1 }}</strong>
                /
                <strong>{{ $timelineConfig['page']['total'] }}</strong>
            </span>

            {{-- SUCCESSIVA --}}
            @if(!$timelineConfig['page']['is_last'])
                <a
                    href="{{ route('admin.events.timeline', $event) }}?page={{ $timelineConfig['page']['index'] + 1 }}"
                    class="uo-timeline-nav is-next"
                >
                    successiva →
                </a>
            @else
                <span class="uo-timeline-nav is-next is-disabled">
                    successiva →
                </span>
            @endif

        </div>
    </div>
@endif



        {{-- INFO EVENTO --}}
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

    {{-- CONFIG PER JS --}}
    <script>
        window.__TIMELINE_CONFIG__ = @json($timelineConfig);
    </script>

    {{-- =========================
         BODY TIMELINE
    ========================== --}}
    <div class="uo-timeline-body">

        {{-- AXIS --}}
        <div class="uo-timeline-axis" id="timeline-axis"></div>

        {{-- CANVAS --}}
        <div class="uo-timeline-canvas">
            <div class="uo-timeline-ghost"></div>
            {{-- blocchi e range vengono iniettati dal JS --}}
        </div>

    </div>

</div>
@endsection
