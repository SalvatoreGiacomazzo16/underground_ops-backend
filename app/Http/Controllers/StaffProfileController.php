<?php

namespace App\Http\Controllers;

use App\Models\StaffProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffProfileController extends Controller
{
    public function index()
    {
        // Mostra solo lo staff dell’utente
        $staff = StaffProfile::where('user_id', Auth::id())->get();

        return view('staff.index', compact('staff'));
    }

    public function create()
    {
        return view('staff.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'stage_name' => 'required|string|max:255',
            'phone' => 'nullable|string',
            'bio' => 'nullable|string',
            'skills' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $data['user_id'] = Auth::id();

        StaffProfile::create($data);

        return redirect()->route('staff.index')
                         ->with('success', 'Profilo staff creato.');
    }

    public function edit(StaffProfile $staff)
    {
        abort_if($staff->user_id !== Auth::id(), 403);

        return view('staff.edit', compact('staff'));
    }

    public function update(Request $request, StaffProfile $staff)
    {
        abort_if($staff->user_id !== Auth::id(), 403);

        $data = $request->validate([
            'stage_name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string',
            'bio' => 'nullable|string',
            'skills' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        $staff->update($data);

        return redirect()->route('staff.index')
                         ->with('success', 'Profilo staff aggiornato.');
    }

    public function destroy(StaffProfile $staff)
    {
        abort_if($staff->user_id !== Auth::id(), 403);

        $staff->delete();

        return redirect()->route('staff.index')
                         ->with('success', 'Profilo staff rimosso.');
    }
}