<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Location;
use App\Models\StaffProfile;
use Illuminate\Support\Facades\Auth;

class ManagerDashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $totalEvents = Event::where('created_by', $userId)->count();

        $activeEvents = Event::where('created_by', $userId)
            ->where('status', 'published')
            ->count();

        $totalLocations = Location::where('created_by', $userId)->count();

        $staffCount = StaffProfile::where('user_id', $userId)->count();

        $events = Event::with('location')
            ->where('created_by', $userId)
            ->orderByDesc('start_datetime')
            ->get();

        return view('dashboard.dashboard-index', compact(
            'totalEvents',
            'activeEvents',
            'totalLocations',
            'staffCount',
            'events'
        ));
    }
}