<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\StaffProfile;
use Illuminate\Http\Request;

class EventStaffController extends Controller
{
    public function edit(Event $event)
    {
        $staffProfiles = StaffProfile::orderBy('stage_name')->get();

        // staff già assegnato
        $assigned = $event->staff()->get();

        return view('admin.events.staff', compact('event', 'staffProfiles', 'assigned'));
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'staff'                 => 'array',
            'staff.*.id'            => 'required|exists:staff_profiles,id',
            'staff.*.role_in_event' => 'nullable|string|max:255',
            'staff.*.fee'           => 'nullable|numeric|min:0',
            'staff.*.notes'         => 'nullable|string',
        ]);

        // Costruiamo l'array per sync()
        $syncData = [];

        if ($request->has('staff')) {
            foreach ($request->staff as $row) {
                $staffId = $row['id'];

                $syncData[$staffId] = [
                    'role_in_event' => $row['role_in_event'] ?? null,
                    'fee'           => $row['fee'] ?? null,
                    'notes'         => $row['notes'] ?? null,
                    // checkin/checkout li gestirai più avanti
                ];
            }
        }

        $event->staff()->sync($syncData);

        return redirect()
            ->route('admin.events.staff.edit', $event)
            ->with('success', 'Staff evento aggiornato con successo.');
    }
}