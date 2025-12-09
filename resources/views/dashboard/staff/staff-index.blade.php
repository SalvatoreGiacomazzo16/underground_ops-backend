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
        @foreach($staff as $member)
            <tr>

                {{-- ID --}}
                <td>{{ $member->id }}</td>

                {{-- Nome --}}
                <td class="fw-bold">{{ $member->stage_name }}</td>

                {{-- Ruolo --- Badge unico azzurro neon --}}
                <td>
                    @if($member->role)
                        <span class="uo-role-badge">
                            {{ strtoupper($member->role) }}
                        </span>
                    @else
                        <span class="text-secondary">-</span>
                    @endif
                </td>

                {{-- Telefono --}}
                <td>{{ $member->phone ?? '-' }}</td>

                {{-- Attivo --}}
                <td>
                    @if($member->is_active)
                        <span class="uo-badge uo-badge-active">Attivo</span>
                    @else
                        <span class="uo-badge uo-badge-cancelled">Inattivo</span>
                    @endif
                </td>

            {{-- AZIONI --}}
<td class="uo-actions">

    {{-- EDIT --}}
    <a href="{{ route('admin.staff.edit', $staff) }}" class="uo-action-icon edit">
        @include('icons.edit')
    </a>

    {{-- DELETE --}}
    <form action="{{ route('admin.staff.destroy', $staff) }}" method="POST" class="d-inline">
        @csrf
        @method('DELETE')
        <button class="uo-action-icon delete">
            @include('icons.delete')
        </button>
    </form>

</td>


            </tr>
        @endforeach
    </x-uo-table>

    {{-- PAGINATION --}}
    <div class="mt-4 uo-pagination">
        @include('components.pagination', ['paginator' => $staff])
    </div>

</div>
@endsection
