<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\StaffProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventStaffController extends Controller
{

public function index()
{
    return Auth::user()
        ->staffProfile()
        ->select('id', 'stage_name', 'skills')
        ->orderBy('stage_name')
        ->get();
}


public function staff()
{
    return $this->staffProfile();
}



    /* ============================
        EDIT — FORM STAFF EVENTO
    ============================ */
    public function edit(Event $event)
    {
        // 🔐 sicurezza: solo eventi dell’utente
        abort_if($event->created_by !== auth()->id(), 403);

        $staffProfiles = StaffProfile::where('user_id', auth()->id())
            ->orderBy('stage_name')
            ->get();

        // staff già assegnato
        $assigned = $event->staff()->get();

        return view(
            'dashboard.events.events-staff',
            compact('event', 'staffProfiles', 'assigned')
        );
    }

    /* ============================
        UPDATE — SYNC STAFF EVENTO
    ============================ */
    public function update(Request $request, Event $event)
    {
        // 🔐 sicurezza: solo eventi dell’utente
        abort_if($event->created_by !== auth()->id(), 403);

        $syncData = [];

        if ($request->has('staff')) {
            foreach ($request->staff as $staffId => $row) {

                // ❌ se non attivo → skip
                if (empty($row['enabled'])) {
                    continue;
                }

                $staff = StaffProfile::where('user_id', auth()->id())
                    ->find($staffId);

                if (!$staff) {
                    continue;
                }

                // 🧠 ruolo evento:
                // override se presente, altrimenti ruolo base
                $roleInEvent = trim($row['role_in_event'] ?? '') !== ''
                    ? $row['role_in_event']
                    : $staff->role;

                $syncData[$staffId] = [
                    'role_in_event' => $roleInEvent,
                    'fee'           => $row['fee'] ?? null,
                    'notes'         => $row['notes'] ?? null,
                ];
            }
        }

        $event->staff()->sync($syncData);

        return redirect()
            ->route('admin.events.staff.edit', $event)
            ->with('success', 'Staff evento aggiornato con successo.');
    }
}
