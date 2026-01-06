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
            // default 1h
            return self::startSlot($start, $unitMinutes) + intdiv(60, $unitMinutes);
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
     * Slot index di inizio timeline (4h prima evento)
     */
    public static function rangeStartSlot(
        Carbon $start,
        int $beforeHours = 4,
        int $unitMinutes = 15
    ): int {
        $startMin = self::minutes($start);
        $rangeMin = $startMin - ($beforeHours * 60);

        return intdiv($rangeMin, $unitMinutes);
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

public static function axisStartSlot(
    Carbon $start,
    int $beforeHours = 4,
    int $unitMinutes = 15
): int {
    // Ora evento meno X ore
    $axisStart = $start
        ->copy()
        ->subHours($beforeHours)
        ->startOfHour(); // UX: sempre ora intera

    $minutes = self::minutes($axisStart);

    return intdiv($minutes, $unitMinutes);
}

}