<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Location;
use App\Models\User;

class ManagerDashboardController extends Controller
{
   public function index()
{
    $userId = auth()->id();

    // Eventi creati da questo utente
    $events = Event::where('created_by', $userId)
                    ->with('location')
                    ->latest()
                    ->get();

    // KPI
    $totalEvents   = $events->count();
    $activeEvents  = $events->where('status', 'published')->count();
    $locationsCount = \App\Models\Location::count();
    $staffCount = \App\Models\User::count(); // o il tuo modello staff

    return view('dashboard.dashboard-index', compact(
        'events',
        'totalEvents',
        'activeEvents',
        'locationsCount',
        'staffCount'
    ));
}

}
