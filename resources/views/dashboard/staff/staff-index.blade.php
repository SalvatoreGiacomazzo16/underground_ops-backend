@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    {{-- HERO --}}
    <div class="uo-hero mb-5">
        <div class="uo-hero-bg"></div>
        <div class="uo-hero-content">
            <h1 class="uo-hero-title">Gestione Staff</h1>
            <p class="uo-hero-subtitle">CREW MANAGEMENT — UNDERGROUND OPS</p>
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="uo-quick-actions mb-4">
        <a href="{{ route('admin.staff.create') }}" class="uo-dashboard-btn">
            + Nuovo Staff
        </a>
    </div>

    {{-- SUCCESS MESSAGE --}}
    @if(session('success'))
        <div class="alert alert-success mb-4">
            {{ session('success') }}
        </div>
    @endif

    {{-- STAFF LIST --}}
    <div class="uo-section">
        <h2 class="uo-section-title mb-4">Team Attuale</h2>

        <div class="table-responsive">
            <table class="table table-dark table-hover align-middle">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nome / Stage Name</th>
                        <th>Tipo</th>
                        <th>Telefono</th>
                        <th>Attivo</th>
                        <th>Utente collegato</th>
                    </tr>
                </thead>

                <tbody>
                    @forelse($staff as $member)
                        <tr>
                            <td>{{ $member->id }}</td>

                            <td class="fw-bold text-white">
                                {{ $member->stage_name }}
                            </td>

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

                            <td>
                                {{ $member->user?->email ?? '-' }}
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center text-secondary py-4">
                                Nessuno staff presente.
                            </td>
                        </tr>
                    @endforelse
                </tbody>

            </table>
        </div>

        <div class="mt-3">
            {{ $staff->links() }}
        </div>

    </div>

</div>
@endsection
