@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    {{-- TITOLO --}}
    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Tutti gli Eventi</h1>
        <p class="text-secondary">ARCHIVIO COMPLETO — UNDERGROUND OPS</p>
    </div>

    {{-- ACTION --}}
    <div class="uo-quick-actions mb-4">
        <a href="{{ route('admin.events.create') }}" class="uo-dashboard-btn">
            + Nuovo Evento
        </a>
    </div>

    {{-- TABELLA EVENTI --}}

    <x-uo-table
         wrapperId="uo-events-table"
    wrapperClass="uo-events-table-wrapper"
    :headers="['#','Titolo','Tipo','Data','Location','Stato']"
    :columns="[5,25,10,15,30,15]"
    actions="true"
    >
        @foreach($events as $event)
            <tr>

                {{-- ID --}}
                <td>{{ $event->id }}</td>

                {{-- Titolo --}}
                <td class="fw-bold text-white">{{ $event->title }}</td>

                {{-- Tipo --}}
                <td>{{ ucfirst($event->event_type) }}</td>

                {{-- Data --}}
                <td>{{ $event->start_datetime?->format('d/m/Y H:i') }}</td>

                {{-- Location --}}
                <td>{{ $event->location->name ?? '-' }}</td>

              {{-- Stato --}}
<td>
    @php
        $badgeClass = [
            'published' => 'uo-badge-active',
            'draft'     => 'uo-badge-draft',
            'cancelled' => 'uo-badge-cancelled',
            'archived'  => 'uo-badge-archived',
        ][$event->status] ?? 'uo-badge-default';
    @endphp

    <span class="uo-badge {{ $badgeClass }}">
        {{ strtoupper($event->status) }}
    </span>
</td>
           {{-- AZIONI --}}
<td class="uo-actions">

    {{-- EDIT --}}
    <a href="{{ route('admin.events.edit', $event) }}" class="uo-action-icon edit">
        @include('icons.edit')
    </a>

    {{-- DELETE --}}
    <form action="{{ route('admin.events.destroy', $event) }}" method="POST" class="d-inline">
        @csrf
        @method('DELETE')
        <button type="button" class="uo-action-icon delete bar-delete">
            @include('icons.delete')
            <span class="delete-bar"></span>
        </button>
    </form>

</td>


            </tr>
        @endforeach
    </x-uo-table>
  </div>
    {{-- PAGINATION --}}
    <div class="mt-4 uo-pagination">
        @include('components.pagination', ['paginator' => $events])
    </div>

</div>
@endsection
