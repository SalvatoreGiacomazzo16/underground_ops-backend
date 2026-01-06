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

        $unit = 15;

     $axisStartSlot = TimelineTime::axisStartSlot($start, 4, $unit);
$axisStartMinutes = $axisStartSlot * $unit;

$startReal = TimelineTime::minutes($start);
$endReal = $end ? TimelineTime::minutes($end) : ($startReal + 60);


// overnight real
if ($end && $endReal < $startReal) {
    $endReal += 1440;
}

$timelineConfig = [
    'unit_minutes'      => $unit,
    'total_slots'       => TimelineTime::totalSlots(12, $unit),

    'axis_start_slot'   => $axisStartSlot,
    'axis_start_minutes'=> $axisStartMinutes,

    'event' => [
        // questi possono restare (servono per snapping/CRUD)
        'start_slot' => TimelineTime::startSlot($start, $unit) - $axisStartSlot,
        'end_slot'   => TimelineTime::endSlot($start, $end, $unit) - $axisStartSlot,
    ],

    'time_real' => [
        'start_minutes' => $startReal,
        'end_minutes'   => $endReal,
    ],
];

        return view('dashboard.events.timeline', compact(
            'event',
            'timelineConfig'
        ));
    }
}