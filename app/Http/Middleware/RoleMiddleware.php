<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $requiredRole): Response
    {
        $user = $request->user();

        // Utente non loggato
        if (!$user) {
            return redirect()->route('login');
        }

        // Se il ruolo NON combacia → accesso negato
        if (!$user->hasRole($requiredRole)) {
            abort(403, 'Access denied.');
        }

        return $next($request);
    }
}