<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StaffController extends Controller
{
    public function __construct()
    {
        $this->middleware('can:manage-staff')->except(['json']);
    }

    public function index()
    {
        $staff = StaffProfile::where('user_id', Auth::id())
            ->orderBy('stage_name')
            ->paginate(15);

        return view('dashboard.staff.staff-index', compact('staff'));
    }

    public function create()
    {
        return view('dashboard.staff.staff-create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'stage_name' => 'required|string|max:255',
            'role'       => 'required|string|max:255',
            'phone'      => 'nullable|string|max:255',
            'bio'        => 'nullable|string',
            'skills'     => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
            'notes'      => 'nullable|string',
        ]);

        // skills string → array
        $skillsArray = null;
        if (!empty($data['skills'])) {
            $skillsArray = collect(explode(',', $data['skills']))
                ->map(fn ($s) => trim($s))
                ->filter()
                ->values()
                ->toArray();
        }

        StaffProfile::create([
            'account_id' => Auth::id(),
            'user_id'    => Auth::id(),
            'stage_name' => $data['stage_name'],
            'role'       => $data['role'],
            'phone'      => $data['phone'] ?? null,
            'bio'        => $data['bio'] ?? null,
            'skills'     => $skillsArray,
            'is_active'  => $request->boolean('is_active'),
            'notes'      => $data['notes'] ?? null,
        ]);

        return redirect()
            ->route('admin.staff.index')
            ->with('success', 'Profilo staff creato con successo.');
    }

    public function edit(StaffProfile $staff)
    {
        abort_if($staff->user_id !== Auth::id(), 403);

        $skillsString = $staff->skills ? implode(', ', $staff->skills) : '';

        return view('dashboard.staff.staff-edit', compact('staff', 'skillsString'));
    }

    public function update(Request $request, StaffProfile $staff)
    {
        abort_if($staff->user_id !== Auth::id(), 403);

        $data = $request->validate([
            'stage_name' => 'required|string|max:255',
            'role'       => 'required|string|max:255',
            'phone'      => 'nullable|string|max:255',
            'bio'        => 'nullable|string',
            'skills'     => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
            'notes'      => 'nullable|string',
        ]);

        $skillsArray = null;
        if (!empty($data['skills'])) {
            $skillsArray = collect(explode(',', $data['skills']))
                ->map(fn($s) => trim($s))
                ->filter()
                ->values()
                ->toArray();
        }

        $staff->update([
            'stage_name' => $data['stage_name'],
            'role'       => $data['role'],
            'phone'      => $data['phone'] ?? null,
            'bio'        => $data['bio'] ?? null,
            'skills'     => $skillsArray,
            'is_active'  => $request->boolean('is_active'),
            'notes'      => $data['notes'] ?? null,
        ]);

        return redirect()
            ->route('admin.staff.index')
            ->with('success', 'Profilo staff aggiornato.');
    }

  public function destroy(StaffProfile $staff, Request $request)
{
    abort_if($staff->user_id !== Auth::id(), 403);

    $staff->delete();

    if ($request->expectsJson() || $request->ajax()) {
        return response()->noContent();
    }

    return redirect()
        ->route('admin.staff.index')
        ->with('success', 'Profilo staff rimosso.');
}

public function json()
{
    abort_unless(request()->expectsJson(), 404);

    return response()->json(
        StaffProfile::where('user_id', Auth::id())
            ->orderBy('stage_name')
            ->get(['id', 'stage_name', 'role', 'skills'])
    );
}




}
