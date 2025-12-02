<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Event;
use App\Models\Location;

class EventController extends Controller
{
    /**
     * Lista eventi (admin/events)
     */
    public function index()
    {
        $events = Event::with('location')->get();
        return view('admin.events.index', compact('events'));
    }

    /**
     * Pagina CREATE EVENT
     * (View corretta → dashboard/dashboard-create)
     */
    public function create()
    {
        // Precarico le location per il form
        $locations = Location::all();

        return view('dashboard.dashboard-create', compact('locations'));
    }

    /**
     * Salvataggio nuovo evento
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_type' => 'required|string|in:live,djset,party,festival',
            'start_datetime' => 'required|date',
            'end_datetime' => 'nullable|date|after_or_equal:start_datetime',
            'location_id' => 'required|integer|exists:locations,id',
            'status' => 'required|string|in:draft,published,cancelled,archived',
            'visibility' => 'required|string|in:public,private',
            'max_capacity' => 'nullable|integer',
            'min_age' => 'nullable|integer',
            'base_ticket_price' => 'nullable|numeric',
        ]);

        // Slug dal titolo
        $data['slug'] = Str::slug($data['title']);

        // Utente che crea l’evento
        $data['created_by'] = auth()->id();
        $data['updated_by'] = auth()->id();

        Event::create($data);

        return redirect()
            ->route('admin.dashboard')
            ->with('success', 'Evento creato con successo!');
    }
}