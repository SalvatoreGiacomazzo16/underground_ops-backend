<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index()
    {
        $events = Event::with('location')
            ->where('created_by', Auth::id())
            ->orderByDesc('start_datetime')
            ->paginate(15);

        return view('dashboard.events.events-index', compact('events'));
    }

  public function create()
{
    $locations = Location::where('user_id', Auth::id())
        ->orderBy('name')
        ->get();

    return view('dashboard.events.events-create', compact('locations'));
}

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'event_type'       => 'required|string|in:live,djset,party,festival',
            'start_datetime'   => 'required|date',
            'end_datetime'     => 'nullable|date|after_or_equal:start_datetime',
            'location_id'      => 'required|exists:locations,id',
            'status'           => 'required|in:draft,published,cancelled,archived',
            'visibility'       => 'required|in:public,private',
            'max_capacity'     => 'nullable|integer',
            'min_age'          => 'nullable|integer',
            'base_ticket_price'=> 'nullable|numeric',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        Event::create($data);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Evento creato con successo!');
    }

    public function edit(Event $event)
    {
        abort_if($event->created_by !== Auth::id(), 403);

        $locations = Location::where('created_by', Auth::id())->get();

        return view('dashboard.events.events-edit', compact('event', 'locations'));
    }

    public function update(Request $request, Event $event)
    {
        abort_if($event->created_by !== Auth::id(), 403);

        $data = $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'event_type'       => 'required|string|in:live,djset,party,festival',
            'start_datetime'   => 'required|date',
            'end_datetime'     => 'nullable|date|after_or_equal:start_datetime',
            'location_id'      => 'required|exists:locations,id',
            'status'           => 'required|in:draft,published,cancelled,archived',
            'visibility'       => 'required|in:public,private',
            'max_capacity'     => 'nullable|integer',
            'min_age'          => 'nullable|integer',
            'base_ticket_price'=> 'nullable|numeric',
        ]);

        $data['slug'] = Str::slug($data['title']);
        $data['updated_by'] = Auth::id();

        $event->update($data);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Evento modificato con successo!');
    }

    public function destroy(Event $event)
    {
        abort_if($event->created_by !== Auth::id(), 403);

        $event->delete();

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Evento eliminato.');
    }
}
