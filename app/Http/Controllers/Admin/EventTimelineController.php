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

    // 🔑 dominio
    $isMultiDay = TimelineTime::isMultiDayEvent($start, $end);

   $axisStartSlot = TimelineTime::axisStartSlot($start, 4, $unit);
$axisStartMinutes = $axisStartSlot * $unit;

$startReal = TimelineTime::minutes($start);
$endReal   = $end ? TimelineTime::minutes($end) : ($startReal + 60);

// overnight reale
if ($end && $endReal < $startReal) {
    $endReal += 1440;
}

$timelineConfig = [
    'mode' => $isMultiDay ? 'multi' : 'single',

    'unit_minutes' => $unit,
    'total_slots'  => TimelineTime::totalSlots(12, $unit),

    'axis_start_slot'    => $axisStartSlot,
    'axis_start_minutes' => $axisStartMinutes, // 🔑 serve al range preciso

    'event' => [
        // questi restano slot-based per logiche blocchi/snap
        'has_visible_part' => true,
        'start_slot' => TimelineTime::startSlot($start, $unit) - $axisStartSlot,
        'end_slot'   => TimelineTime::endSlot($start, $end, $unit) - $axisStartSlot,
    ],

    // 🔥 QUESTO è il segreto della precisione
    'time_real' => [
        'start_minutes' => $startReal, // es 21*60+27
        'end_minutes'   => $endReal,   // es 2*60+29 (+1440 se overnight)
    ],
];



    return view('dashboard.events.timeline', compact(
        'event',
        'timelineConfig'
    ));
}

}