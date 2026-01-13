<?php

namespace App\Support;

use Carbon\Carbon;

class TimelineTime
{
    /* ============================================================
        BASE TIME HELPERS
    ============================================================ */

    /**
     * Minuti wall-clock (0–1439)
     */
    public static function minutes(Carbon $dt): int
    {
        return ($dt->hour * 60) + $dt->minute;
    }

    /**
     * Giorno base dell’evento (startOfDay)
     */
    private static function baseDay(Carbon $eventStart): Carbon
    {
        return $eventStart->copy()->startOfDay();
    }

    /**
     * Minuti ASSOLUTI rispetto al giorno base (può superare 1440)
     */
    private static function absMinutes(Carbon $baseDay, Carbon $dt): int
    {
        return $baseDay->diffInMinutes($dt, false);
    }

    /* ============================================================
        SLOT HELPERS
    ============================================================ */

    public static function startSlot(
        Carbon $start,
        int $unitMinutes = 15
    ): int {
        return intdiv(self::minutes($start), $unitMinutes);
    }

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

        if ($endMin < $startMin) {
            $endMin += 1440;
        }

        return (int) ceil($endMin / $unitMinutes);
    }

    public static function totalSlots(
        int $totalHours = 12,
        int $unitMinutes = 15
    ): int {
        return intdiv($totalHours * 60, $unitMinutes);
    }

    /**
     * Axis start = X ore prima dell’evento, arrotondato all’ora
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

    /* ============================================================
        DOMAIN DECISION
    ============================================================ */

    /**
     * Evento MULTI se ESCE dalla finestra visiva
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

    /* ============================================================
        MULTI DAY WINDOW
    ============================================================ */

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

        $base = self::baseDay($eventStart);

        // ===== finestra base (page 0)
        $baseAxisStart = $eventStart
            ->copy()
            ->subHours($beforeHours)
            ->startOfHour();

        $windowMinutes = $windowHours * 60;

        // durata totale evento
        $totalMinutes = self::absMinutes($base, $eventEnd)
            - self::absMinutes($base, $eventStart);

        $totalPages = max(1, (int) ceil($totalMinutes / $windowMinutes));
        $pageIndex  = max(0, min($pageIndex, $totalPages - 1));

        // ===== axis della pagina (CONTINUO)
        $axisStart = $baseAxisStart
            ->copy()
            ->addMinutes($windowMinutes * $pageIndex);

        $axisEnd = $axisStart->copy()->addMinutes($windowMinutes);

        // ===== clipping visibile
        $visibleStart = $eventStart->greaterThan($axisStart)
            ? $eventStart
            : $axisStart;

        $visibleEnd = $eventEnd->lessThan($axisEnd)
            ? $eventEnd
            : $axisEnd;

        $hasVisible = $visibleEnd->greaterThan($visibleStart);

        // ===== minuti assoluti
        $axisStartAbs   = self::absMinutes($base, $axisStart);
        $axisEndAbs     = self::absMinutes($base, $axisEnd);
        $visibleStartAbs = self::absMinutes($base, $visibleStart);
        $visibleEndAbs   = self::absMinutes($base, $visibleEnd);

        // ===== slot relativi alla pagina
        $startOffset = $visibleStartAbs - $axisStartAbsabs = $axisStartAbs;
        $endOffset   = $visibleEndAbs   - $axisStartAbs;

        $startSlot = $hasVisible
            ? intdiv($startOffset, $unitMinutes)
            : null;

        $endSlot = $hasVisible
            ? (int) ceil($endOffset / $unitMinutes)
            : null;

        return [
            'page' => [
                'index'     => $pageIndex,
                'total'     => $totalPages,
                'is_first'  => $pageIndex === 0,
                'is_last'   => $pageIndex === ($totalPages - 1),
            ],

            // 🔑 continuità temporale
            'axis_start_slot'    => intdiv($axisStartAbs, $unitMinutes),
            'axis_start_minutes' => $axisStartAbs,

            'event' => [
                'has_visible_part' => $hasVisible,
                'start_slot'       => $hasVisible ? max(0, $startSlot) : null,
                'end_slot'         => $hasVisible ? max(0, $endSlot) : null,

                'is_clipped_top'    => $eventStart->lessThan($axisStart),
                'is_clipped_bottom' => $eventEnd->greaterThan($axisEnd),
            ],

            // per range + hover (VISIBILE)
            'time_real' => [
                'start_minutes' => $hasVisible ? $visibleStartAbs : null,
                'end_minutes'   => $hasVisible ? $visibleEndAbs : null,
            ],

            // per info complete (opzionale)
            'time_full' => [
                'start_minutes' => self::absMinutes($base, $eventStart),
                'end_minutes'   => self::absMinutes($base, $eventEnd),
            ],
        ];
    }

    /* ============================================================
        SINGLE SOURCE OF TRUTH
    ============================================================ */

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

        /* =======================
            SINGLE DAY
        ======================= */
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

        /* =======================
            MULTI DAY
        ======================= */
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

        // 🔑 RANGE COMPLETO EVENTO (PER TOOLTIP)
        'time_full' => [
            'start_minutes' => self::minutes($start),
            'end_minutes' => (
                $end && self::minutes($end) < self::minutes($start)
                    ? self::minutes($end) + 1440
                    : self::minutes($end)
            ),
        ],
    ],
    $window
);

    }
}
