<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;

class EventTimelineController extends Controller
{
    public function show(Event $event)
    {
        abort_if($event->created_by !== auth()->id(), 403);

        return view('dashboard.events.timeline', [
            'event' => $event,
        ]);
    }
}