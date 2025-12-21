{{-- File: layouts/sidebar-content-mobile.blade.php — DEEP UNDERGROUND --}}
<ul class="sidebar-nav nav flex-column gap-3">

    {{-- Dashboard --}}
    <li>
        <a href="{{ route('admin.dashboard') }}"
           class="sidebar-link {{ Request::routeIs('admin.dashboard') ? 'active' : '' }}">
            <i class="fas fa-grip-horizontal me-2"></i> Dashboard
        </a>
    </li>

    {{-- Eventi --}}
    <li>
        <a href="{{ route('admin.events.index') }}"
           class="sidebar-link {{ Request::routeIs('admin.events.*') ? 'active' : '' }}">
            <i class="fas fa-calendar-alt me-2"></i> Eventi
        </a>
    </li>

    {{-- Locations --}}
    <li>
        <a href="{{ route('admin.locations.index') }}"
           class="sidebar-link {{ Request::routeIs('admin.locations.*') ? 'active' : '' }}">
            <i class="fas fa-map-marker-alt me-2"></i> Locations
        </a>
    </li>

    {{-- Staff --}}
    <li>
        <a href="{{ route('admin.staff.index') }}"
           class="sidebar-link {{ Request::routeIs('admin.staff.*') ? 'active' : '' }}">
            <i class="fas fa-users-cog me-2"></i> Staff
        </a>
    </li>


</ul>
