@extends('layouts.admin')



@section('content')
<div class="uo-timeline">
<script>
    window.UO_CONTEXT = {
        userId: {{ auth()->id() }},
        eventId: {{ $event->id }}
    };
</script>


    {{-- HEADER TIMELINE --}}
    {{-- Header sticky con titolo e metadati evento --}}
    <div class="uo-timeline-header">
        <h2 class="uo-timeline-title">Timeline Ops</h2>
        <p class="uo-timeline-meta">
            Evento: <strong>Nome Evento</strong> • Location
        </p>
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
