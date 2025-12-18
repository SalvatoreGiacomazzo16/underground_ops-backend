@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">
  {{-- HERO --}}
    <div class="mb-4">
        <h1 class="uo-section-title mb-1">Gestione Location</h1>
        <p class="text-secondary">LOCATION MANAGEMENT — UNDERGROUND OPS</p>
    </div>
    <div class="row g-4">

        {{-- CREATE CARD GLASS (EMPTY STATE) --}}
        <div
            class="col-md-6 col-lg-4 {{ $locations->count() > 0 ? 'd-none' : '' }}"
            data-location-create
        >
            <a
                href="{{ route('admin.locations.create') }}"
                class="uo-location-card-v3 uo-location-card-create"
            >
                <div class="uo-location-create-inner">
                    <div class="uo-location-create-icon">+</div>

                    <div class="uo-location-create-text">
                        <span class="title">Nuova Location</span>
                        <span class="subtitle">Inizia creando la prima venue</span>
                    </div>
                </div>
            </a>
        </div>

        {{-- DASHBOARD BUTTON (TOP ACTION) --}}
        <div class="col-12 {{ $locations->count() === 0 ? 'd-none' : '' }}">
            <div class="uo-quick-actions mb-4">
                <a href="{{ route('admin.locations.create') }}" class="uo-dashboard-btn">
                    + Nuova Location
                </a>
            </div>
        </div>

        {{-- LOCATION ESISTENTI --}}
        @forelse($locations as $location)
            <div
                class="col-md-6 col-lg-4"
                data-location-col

            >
                <div class="uo-location-card-v3">

                    {{-- HEADER --}}
                    <div class="uo-location-header">
                        <h3 class="uo-location-name">{{ $location->name }}</h3>

                        <span class="uo-location-city">
                            {{ $location->city ?? '—' }}
                            {{ $location->province ? "({$location->province})" : '' }}
                        </span>

                        @if($location->is_primary ?? false)
                            <span class="uo-location-badge-primary">PRINCIPALE</span>
                        @endif
                    </div>

                    {{-- MICRO MAP --}}
                    <div class="uo-location-map">
                        <span class="map-dot"></span>
                        <span class="map-label">VENUE POSITION</span>
                    </div>

                    {{-- BODY --}}
                    <div class="uo-location-body">

                        <div class="uo-location-row">
                            <span class="label">📍 Indirizzo</span>
                            <span class="value">
                                {{ $location->address ?? 'Non specificato' }}
                            </span>
                        </div>

                        <div class="uo-location-row">
                            <span class="label">🎛 Capienza</span>
                            <span class="value">
                                {{ $location->capacity_min ?? '?' }} —
                                {{ $location->capacity_max ?? '?' }}
                            </span>
                        </div>

                        @if($location->contact_name)
                            <div class="uo-location-row">
                                <span class="label">👤 Referente</span>
                                <span class="value">{{ $location->contact_name }}</span>
                            </div>
                        @endif

                    </div>

                    {{-- FOOTER --}}
                    <div class="uo-location-footer">
                        <div class="uo-location-actions">

                            {{-- EDIT --}}
                            <a
                                href="{{ route('admin.locations.edit', $location) }}"
                                class="uo-action-icon edit"
                            >
                                @include('icons.edit')
                            </a>

                            {{-- DELETE (HOLD) --}}
                            <form
                                method="POST"
                                action="{{ route('admin.locations.destroy', $location) }}"
                                data-delete
                                    data-delete-row="[data-location-col]"
                            >
                                @csrf
                                @method('DELETE')

                                <button
                                    type="button"
                                    class="uo-action-icon delete bar-delete"
                                    data-delete-button
                                >
                                    @include('icons.delete')
                                    <span class="delete-bar"></span>
                                </button>
                            </form>

                        </div>
                    </div>

                </div>
            </div>
        @empty
            {{-- vuoto: gestito dalla create-card --}}
        @endforelse

    </div>

</div>
@endsection
