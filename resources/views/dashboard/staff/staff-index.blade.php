@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    {{-- HERO --}}
    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Gestione Staff</h1>
        <p class="text-secondary">CREW MANAGEMENT — UNDERGROUND OPS</p>
    </div>

    {{-- Quick Actions --}}
    <div class="uo-quick-actions mb-4">
        <a href="{{ route('admin.staff.create') }}" class="uo-dashboard-btn">
            + Nuovo Staff
        </a>
    </div>

    {{-- STAFF TABLE --}}
<x-uo-table
    :headers="['#','Nome','Ruolo','Telefono','Attivo']"
    :columns="[5,25,20,20,10]"
    actions="true"
>
    @forelse($staff as $member)
        <tr>

            <td>{{ $member->id }}</td>

            <td class="fw-bold">{{ $member->stage_name }}</td>

            <td>
                @if($member->role)
                    <span class="uo-role-badge">
                        {{ strtoupper($member->role) }}
                    </span>
                @else
                    <span class="text-secondary">-</span>
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

            <td class="uo-actions">
                <a href="{{ route('admin.staff.edit', $member) }}" class="uo-action-icon edit">
                    @include('icons.edit')
                </a>

                <form action="{{ route('admin.staff.destroy', $member) }}" method="POST" class="d-inline">
                    @csrf
                    @method('DELETE')
                    <button type="button" class="uo-action-icon delete bar-delete">
                        @include('icons.delete')
                        <span class="delete-bar"></span>
                    </button>
                </form>
            </td>

        </tr>
    @empty
        <tr>
            <td colspan="6" class="text-center text-secondary py-4">
                Nessuno staff aggiunto.
            </td>
        </tr>
    @endforelse
</x-uo-table>


    {{-- PAGINATION --}}
    <div class="mt-4 uo-pagination">
        @include('components.pagination', ['paginator' => $staff])
    </div>

</div>
@endsection
