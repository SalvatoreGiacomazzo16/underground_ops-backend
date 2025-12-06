@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Tutti gli Eventi</h1>
        <p class="text-secondary">ARCHIVIO COMPLETO — UNDERGROUND OPS</p>
    </div>

    <div class="uo-quick-actions mb-4">
        <a href="{{ route('admin.events.create') }}" class="uo-dashboard-btn">
            + Nuovo Evento
        </a>
    </div>

    {{-- TABELLA EVENTI --}}
    <x-uo-table
        :headers="['#','Titolo','Tipo','Data','Location','Stato']"
        :columns="[5,25,10,15,30,10]"
        actions="true"
    >
        @foreach($events as $event)
            <tr>
                <td>{{ $event->id }}</td>

                <td class="fw-bold text-white">{{ $event->title }}</td>

                <td>{{ ucfirst($event->event_type) }}</td>

                <td>{{ $event->start_datetime?->format('d/m/Y H:i') }}</td>

                <td>{{ $event->location->name ?? '-' }}</td>

                <td>
                    <span class="uo-badge uo-badge-{{ $event->status }}">
                        {{ strtoupper($event->status) }}
                    </span>
                </td>

                {{-- AZIONI --}}
                <td class="uo-actions">

                    {{-- EDIT --}}
                    <a href="{{ route('admin.events.edit', $event) }}"
                       class="uo-action-btn uo-edit">✏️</a>

                    {{-- DELETE --}}
                    <form action="{{ route('admin.events.destroy', $event) }}"
                          method="POST" class="d-inline">
                        @csrf
                        @method('DELETE')
                        <button class="uo-action-btn uo-delete">🗑️</button>
                    </form>

                </td>
            </tr>
        @endforeach
    </x-uo-table>

    <div class="mt-4 uo-pagination">
        @include('components.pagination', ['paginator' => $events])
    </div>

</div>
@endsection
