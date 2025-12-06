@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Gestione Staff</h1>
        <p class="text-secondary">CREW MANAGEMENT — UNDERGROUND OPS</p>
    </div>

    <div class="uo-quick-actions mb-4">
        <a href="{{ route('admin.staff.create') }}" class="uo-dashboard-btn">
            + Nuovo Staff
        </a>
    </div>

    <x-uo-table
        :headers="['#','Nome','Tipo','Telefono','Attivo','Utente']"
        :columns="[5,25,10,15,10,25]"
        actions="true"
    >
        @foreach($staff as $member)
            <tr>
                <td>{{ $member->id }}</td>

                <td class="fw-bold">{{ $member->stage_name }}</td>

                <td>
                    @if($member->is_external)
                        <span class="uo-badge uo-badge-draft">Esterno</span>
                    @else
                        <span class="uo-badge uo-badge-active">Registrato</span>
                    @endif
                </td>

                <td>{{ $member->phone ?? '-' }}</td>

                <td>
                    @if($member->is_active)
                        <span class="uo-badge uo-badge-active">Attivo</span>
                    @else
                        <span class="uo-badge uo-badge-cancelled">Inattivo</span>
                    @endif
                </td>

                <td>{{ $member->user?->email ?? '-' }}</td>

                {{-- AZIONI --}}
                <td class="uo-actions">

                    {{-- EDIT --}}
                    <a href="{{ route('admin.staff.edit', $member) }}"
                       class="uo-action-btn uo-edit">✏️</a>

                    {{-- DELETE --}}
                    <form action="{{ route('admin.staff.destroy', $member) }}"
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
        @include('components.pagination', ['paginator' => $staff])
    </div>

</div>
@endsection
