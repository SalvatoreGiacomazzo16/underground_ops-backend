<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class StaffController extends Controller
{
    public function index()
    {
  $staff = StaffProfile::with('user')
            ->orderByDesc('created_at')
            ->paginate(15);

      return view('dashboard.staff.staff-index', compact('staff'));
    }

    public function create()
    {
        // Utenti che ancora NON hanno uno staff_profile
        $users = User::whereDoesntHave('staffProfile')
            ->orderBy('name')
            ->get();
      return view('dashboard.staff.staff-create', compact('users'));
    }
public function store(Request $request)
{
    $data = $request->validate([
        'staff_type' => 'required|in:registered,external',
        'user_id'    => 'nullable|exists:users,id',

        'stage_name' => 'nullable|string|max:255',
        'phone'      => 'nullable|string|max:255',
        'bio'        => 'nullable|string',
        'skills'     => 'nullable|string', // comma-separated

        'is_active'  => 'sometimes|boolean',
        'notes'      => 'nullable|string',
    ]);

    // ------ FIX QUI (era $validated) ------
    $skillsArray = null;
    if (!empty($data['skills'])) {
        $skillsArray = collect(explode(',', $data['skills']))
            ->map(fn ($s) => trim($s))
            ->filter()
            ->values()
            ->toArray();
    }

    // ------ FIX QUI (era $validated) ------
    if ($data['staff_type'] === 'registered') {
        $user = User::findOrFail($data['user_id']);

        $staff = StaffProfile::create([
            'user_id'    => $user->id,
            'stage_name' => $data['stage_name'] ?? $user->name,
            'phone'      => $data['phone'] ?? null,
            'bio'        => $data['bio'] ?? null,
            'skills'     => $skillsArray,
            'is_external'=> 0,
            'is_active'  => $request->boolean('is_active'),
            'notes'      => $data['notes'] ?? null,
        ]);
    } else {
        $staff = StaffProfile::create([
            'user_id'    => null,
            'stage_name' => $data['stage_name'],
            'phone'      => $data['phone'] ?? null,
            'bio'        => $data['bio'] ?? null,
            'skills'     => $skillsArray,
            'is_external'=> 1,
            'is_active'  => $request->boolean('is_active'),
            'notes'      => $data['notes'] ?? null,
        ]);
    }

    return redirect()
        ->route('admin.staff.index')
        ->with('success', 'Profilo staff creato con successo.');
}



    public function edit(StaffProfile $staff)
    {
        $users = User::orderBy('name')->get();

        // serve per ricostruire la stringa "HTML, Graphic, DJ" ecc
        $skillsString = $staff->skills ? implode(', ', $staff->skills) : '';

        return view('admin.staff.edit', compact('staff', 'users', 'skillsString'));
    }

   public function update(Request $request, StaffProfile $staff)
{
    $data = $request->validate([
        'stage_name' => 'sometimes|string|max:255',
        'phone' => 'nullable|string',
        'bio' => 'nullable|string',
        'skills' => 'nullable|array',
        'notes' => 'nullable|string',
    ]);

    $staff->update($data);

    return redirect()->route('admin.staff.index')
                     ->with('success', 'Profilo staff aggiornato.');
}

public function destroy(StaffProfile $staff)
{
    $staff->delete();

    return redirect()->route('admin.staff.index')
                     ->with('success', 'Profilo staff rimosso.');
}


    public function __construct()
{
    $this->middleware('can:manage-staff');
}

}
