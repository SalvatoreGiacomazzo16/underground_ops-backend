<?php

namespace App\Support;

use Carbon\Carbon;

class TimelineTime
{
    /**
     * Minuti assoluti wall-clock (0–1439)
     */
    public static function minutes(Carbon $dt): int
    {
        return ($dt->hour * 60) + $dt->minute;
    }

    /**
     * Slot index (snappato per difetto)
     * es: 16:39 → slot 66 (con unit 15)
     */
    public static function startSlot(
        Carbon $start,
        int $unitMinutes = 15
    ): int {
        $minutes = self::minutes($start);
        return intdiv($minutes, $unitMinutes);
    }

    /**
     * Slot index di fine (snappato per eccesso)
     * gestisce overnight
     */
    public static function endSlot(
        Carbon $start,
        ?Carbon $end,
        int $unitMinutes = 15
    ): int {
        if (!$end) {
            return self::startSlot($start, $unitMinutes)
                + intdiv(60, $unitMinutes);
        }

        $startMin = self::minutes($start);
        $endMin   = self::minutes($end);

        // overnight
        if ($endMin < $startMin) {
            $endMin += 1440;
        }

        return (int) ceil($endMin / $unitMinutes);
    }

    /**
     * Numero totale di slot della timeline (12h fisse)
     */
    public static function totalSlots(
        int $totalHours = 12,
        int $unitMinutes = 15
    ): int {
        return intdiv($totalHours * 60, $unitMinutes);
    }

    /**
     * Slot di partenza dell’axis (4h prima, ora intera)
     */
    public static function axisStartSlot(
        Carbon $start,
        int $beforeHours = 4,
        int $unitMinutes = 15
    ): int {
        $axisStart = $start
            ->copy()
            ->subHours($beforeHours)
            ->startOfHour();

        return intdiv(self::minutes($axisStart), $unitMinutes);
    }

    /**
     * 🔑 DECISIONE DOMINIO
     * Evento considerato multi-window se ESCE dalla finestra visiva
     */
    public static function isMultiWindowEvent(
        Carbon $eventStart,
        ?Carbon $eventEnd,
        int $windowHours = 12,
        int $beforeHours = 4
    ): bool {
        if (!$eventEnd) return false;

        $end = $eventEnd->copy();
        if ($end->lessThan($eventStart)) {
            $end->addDay();
        }

        $windowStart = $eventStart
            ->copy()
            ->subHours($beforeHours)
            ->startOfHour();

        $windowEnd = $windowStart
            ->copy()
            ->addHours($windowHours);

        return
            $eventStart->lessThan($windowStart) ||
            $end->greaterThan($windowEnd);
    }

    /**
     * MULTI DAY — finestra paginata
     */
    public static function buildMultiDayWindow(
        Carbon $eventStart,
        Carbon $eventEnd,
        int $pageIndex,
        int $windowHours = 12,
        int $beforeHours = 4,
        int $unitMinutes = 15
    ): array {
        if ($eventEnd->lessThan($eventStart)) {
            $eventEnd = $eventEnd->copy()->addDay();
        }

        $windowMinutes = $windowHours * 60;
      // prima finestra (page 0)
$firstWindowStart = $eventStart
    ->copy()
    ->subHours($beforeHours)
    ->startOfHour();

$firstWindowEnd = $firstWindowStart
    ->copy()
    ->addHours($windowHours);

// fine evento normalizzata
$normalizedEnd = $eventEnd->copy();
if ($normalizedEnd->lessThan($eventStart)) {
    $normalizedEnd->addDay();
}

// minuti eccedenti la prima finestra
$overflowMinutes = max(
    0,
    $firstWindowEnd->diffInMinutes($normalizedEnd, false)
);

// pagine totali
$totalPages = 1 + (int) ceil($overflowMinutes / $windowMinutes);


        $pageIndex = max(0, min($pageIndex, $totalPages - 1));

        if ($pageIndex === 0) {
            $axisStart = $eventStart
                ->copy()
                ->subHours($beforeHours)
                ->startOfHour();
        } else {
            $axisStart = $eventStart
                ->copy()
                ->addMinutes($windowMinutes * $pageIndex);
        }

        $axisEnd = $axisStart->copy()->addMinutes($windowMinutes);

        $visibleStart = $eventStart->greaterThan($axisStart)
            ? $eventStart
            : $axisStart;

        $visibleEnd = $eventEnd->lessThan($axisEnd)
            ? $eventEnd
            : $axisEnd;

        $hasVisible = $visibleEnd->greaterThan($visibleStart);

        $axisStartMinutes = self::minutes($axisStart);
        $startMinutes     = self::minutes($visibleStart);
        $endMinutes       = self::minutes($visibleEnd);

        if ($endMinutes < $startMinutes) {
            $endMinutes += 1440;
        }

        $axisStartSlot = intdiv($axisStartMinutes, $unitMinutes);

        return [
            'page' => [
                'index'     => $pageIndex,
                'total'     => $totalPages,
                'is_first'  => $pageIndex === 0,
                'is_last'   => $pageIndex === ($totalPages - 1),
            ],

            'axis_start_slot' => $axisStartSlot,

          'event' => [
    'has_visible_part' => $hasVisible,

    'start_slot' => $hasVisible
        ? intdiv($startMinutes - $axisStartMinutes, $unitMinutes)
        : null,

    'end_slot' => $hasVisible
        ? (int) ceil(($endMinutes - $axisStartMinutes) / $unitMinutes)
        : null,

    // 🔑 STEP A — CLIPPING FLAGS
    'is_clipped_top'    => $eventStart->lessThan($axisStart),
    'is_clipped_bottom' => $eventEnd->greaterThan($axisEnd),
],


            'time_real' => [
                'start_minutes' => self::minutes($eventStart),
                'end_minutes'   => self::minutes($eventEnd),
            ],
        ];
    }

    /**
     * 🔑 SINGLE SOURCE OF TRUTH
     */
    public static function buildTimelineConfig(
        Carbon $start,
        ?Carbon $end,
        int $pageIndex = 0,
        int $unitMinutes = 15,
        int $windowHours = 12,
        int $beforeHours = 4
    ): array {
        $isMulti = self::isMultiWindowEvent(
            $start,
            $end,
            $windowHours,
            $beforeHours
        );

        if (!$isMulti) {
            $axisStartSlot = self::axisStartSlot($start, $beforeHours, $unitMinutes);

            $startMin = self::minutes($start);
            $endMin   = $end ? self::minutes($end) : ($startMin + 60);

            if ($end && $endMin < $startMin) {
                $endMin += 1440;
            }

            return [
                'mode' => 'single',
                'unit_minutes' => $unitMinutes,

                'axis_start_slot' => $axisStartSlot,
                'range_start_slot' => 0,
                'total_slots' => self::totalSlots($windowHours, $unitMinutes),

                'event' => [
                    'has_visible_part' => true,
                    'start_slot' =>
                        self::startSlot($start, $unitMinutes) - $axisStartSlot,
                    'end_slot' =>
                        self::endSlot($start, $end, $unitMinutes) - $axisStartSlot,
                ],

                'time_real' => [
                    'start_minutes' => $startMin,
                    'end_minutes'   => $endMin,
                ],
            ];
        }

        $window = self::buildMultiDayWindow(
            $start,
            $end,
            $pageIndex,
            $windowHours,
            $beforeHours,
            $unitMinutes
        );

        return array_merge(
            [
                'mode' => 'multi',
                'unit_minutes' => $unitMinutes,
                'range_start_slot' => 0,
                'total_slots' => self::totalSlots($windowHours, $unitMinutes),
            ],
            $window
        );
    }
}