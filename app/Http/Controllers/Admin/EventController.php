<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index()
    {
        $events = Event::with('location')
            ->orderByDesc('start_datetime')
            ->paginate(15);

        return view('dashboard.events.events-index', compact('events'));
    }

    public function create()
    {
        $locations = Location::all();
        return view('dashboard.dashboard-create', compact('locations'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_type' => 'required|string|in:live,djset,party,festival',
            'start_datetime' => 'required|date',
            'end_datetime' => 'nullable|date|after_or_equal:start_datetime',
            'location_id' => 'required|exists:locations,id',
            'status' => 'required|in:draft,published,cancelled,archived',
            'visibility' => 'required|in:public,private',
            'max_capacity' => 'nullable|integer',
            'min_age' => 'nullable|integer',
            'base_ticket_price' => 'nullable|numeric',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['created_by'] = auth()->id();
        $data['updated_by'] = auth()->id();

        Event::create($data);

        return redirect()->route('admin.events.index')
            ->with('success', 'Evento creato con successo!');
    }

    // 🔥 FORM EDIT
    public function edit(Event $event)
    {
        $locations = Location::all();

        return view('dashboard.events.events-edit', compact('event', 'locations'));
    }

    // 🔥 SALVATAGGIO UPDATE
    public function update(Request $request, Event $event)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_type' => 'required|string|in:live,djset,party,festival',
            'start_datetime' => 'required|date',
            'end_datetime' => 'nullable|date|after_or_equal:start_datetime',
            'location_id' => 'required|exists:locations,id',
            'status' => 'required|in:draft,published,cancelled,archived',
            'visibility' => 'required|in:public,private',
            'max_capacity' => 'nullable|integer',
            'min_age' => 'nullable|integer',
            'base_ticket_price' => 'nullable|numeric',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['updated_by'] = auth()->id();

        $event->update($data);

        return redirect()->route('admin.events.index')
            ->with('success', 'Evento modificato con successo!');
    }

    // 🔥 DELETE
    public function destroy(Event $event)
    {
        $event->delete();

        return redirect()->route('admin.events.index')
            ->with('success', 'Evento eliminato.');
    }
}