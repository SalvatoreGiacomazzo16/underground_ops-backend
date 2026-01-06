<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use App\Support\TimelineTime;

class EventController extends Controller
{
    /* ============================
        TIMELINE (DEFAULT)
    ============================ */
   /* ============================
    TIMELINE (DEFAULT)
============================ */
public function index()
{
    $events = Event::with('location')
        ->where('created_by', Auth::id())
        ->orderBy('start_datetime')
        ->get();

    // 🔑 Prepariamo i dati per la timeline
    $timelineEvents = $events->map(fn ($event) => [
        'id'         => $event->id,
        'title'      => $event->title,
        'start_slot' => TimelineTime::startSlot($event->start_datetime),
        'end_slot'   => TimelineTime::endSlot(
            $event->start_datetime,
            $event->end_datetime
        ),
    ]);

    // grouping per giorno (come prima)
    $eventsByDay = $events->groupBy(
        fn ($event) => $event->start_datetime->toDateString()
    );

    return view(
        'dashboard.events.events-index',
        compact('eventsByDay', 'timelineEvents')
    );
}


    /* ============================
        TABLE VIEW
    ============================ */
    public function table()
    {
        $events = Event::with('location')
            ->where('created_by', Auth::id())
            ->orderByDesc('start_datetime')
            ->paginate(15);

        return view('dashboard.events.events-table-format', compact('events'));
    }

    /* ============================
        CREATE
    ============================ */
    public function create()
    {
        $locations = Location::where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        return view('dashboard.events.events-create', compact('locations'));
    }

    /* ============================
        STORE
    ============================ */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'event_type'     => 'required|in:live,djset,party,festival',

            'start_datetime' => [
                'required',
                'date',
                function ($attr, $value, $fail) {
                    $start = Carbon::parse($value);
                    $now   = now()->subMinutes(5); // ⏱ tolleranza 5 min

                    if ($start->lt($now)) {
                        $fail('La data di inizio non può essere nel passato.');
                    }
                },
            ],

            'end_datetime' => [
                'nullable',
                'date',
                'after:start_datetime',
            ],

            'location_id' => [
                'required',
                Rule::exists('locations', 'id')
                    ->where(fn ($q) => $q->where('user_id', Auth::id())),
            ],

            'status'            => 'required|in:draft,published,cancelled,archived',
            'visibility'        => 'required|in:public,private',
            'max_capacity'      => 'nullable|integer|min:0',
            'min_age'           => 'nullable|integer|min:0',
            'base_ticket_price' => 'nullable|numeric|min:0',
        ]);

        $data['slug']       = Str::slug($data['title']);
        $data['created_by'] = Auth::id();
        $data['updated_by'] = Auth::id();

        Event::create($data);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Evento creato con successo!');
    }

    /* ============================
        EDIT
    ============================ */
    public function edit(Event $event)
    {
        abort_if($event->created_by !== Auth::id(), 403);

        $locations = Location::where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        return view('dashboard.events.events-edit', compact('event', 'locations'));
    }

    /* ============================
        UPDATE
    ============================ */
    public function update(Request $request, Event $event)
    {
        abort_if($event->created_by !== Auth::id(), 403);

        $data = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'event_type'     => 'required|in:live,djset,party,festival',

            'start_datetime' => [
                'required',
                'date',
                function ($attr, $value, $fail) {
                    $start = Carbon::parse($value);
                    $now   = now()->subMinutes(5);

                    if ($start->lt($now)) {
                        $fail('La data di inizio non può essere nel passato.');
                    }
                },
            ],

            'end_datetime' => [
                'nullable',
                'date',
                'after:start_datetime',
            ],

            'location_id' => [
                'required',
                Rule::exists('locations', 'id')
                    ->where(fn ($q) => $q->where('user_id', Auth::id())),
            ],

            'status'            => 'required|in:draft,published,cancelled,archived',
            'visibility'        => 'required|in:public,private',
            'max_capacity'      => 'nullable|integer|min:0',
            'min_age'           => 'nullable|integer|min:0',
            'base_ticket_price' => 'nullable|numeric|min:0',
        ]);

        $data['slug']       = Str::slug($data['title']);
        $data['updated_by'] = Auth::id();

        $event->update($data);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Evento modificato con successo!');
    }

    /* ============================
        DELETE
    ============================ */
    public function destroy(Event $event, Request $request)
    {
        abort_if($event->created_by !== Auth::id(), 403);

        $event->delete();

        if ($request->expectsJson() || $request->ajax()) {
            return response()->noContent();
        }

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Evento eliminato.');
    }
}
