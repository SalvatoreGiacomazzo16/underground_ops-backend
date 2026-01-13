<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Support\TimelineTime;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class EventTimelineController extends Controller
{
  public function show(Event $event)
{
    abort_if($event->created_by !== Auth::id(), 403);

    $start = Carbon::parse($event->start_datetime);
    $end   = $event->end_datetime
        ? Carbon::parse($event->end_datetime)
        : null;

    $pageIndex = (int) request()->query('page', 0);

    $timelineConfig = TimelineTime::buildTimelineConfig(
        start: $start,
        end: $end,
        pageIndex: $pageIndex
    );

    return view('dashboard.events.timeline', [
        'event' => $event,
        'timelineConfig' => $timelineConfig,
    ]);
}


}