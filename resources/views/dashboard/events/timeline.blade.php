@extends('layouts.admin')



@section('content')
<div class="uo-timeline">
<script>
    window.UO_CONTEXT = {
        userId: {{ auth()->id() }},
        eventId: {{ $event->id }}
    };
</script>


   {{-- HEADER TIMELINE — EVENT CONTEXT --}}
<div class="uo-timeline-header">

    <div class="uo-timeline-header__main">
        <span class="uo-meta-label">Evento</span>
        <strong class="uo-meta-value">
            {{ $event->title }}
        </strong>
    </div>

    @if($event->location)
        <div class="uo-timeline-header__sub">
            <span class="uo-meta-separator">•</span>
            <span class="uo-meta-value">
                {{ $event->location->name }}
            </span>
        </div>
    @endif

</div>



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
        </div>
    </div>

</div>
@endsection
