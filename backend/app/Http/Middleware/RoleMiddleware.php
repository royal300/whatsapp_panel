<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $userRole = $request->user()->role;

        // super_admin can access everything
        if ($userRole === 'super_admin') {
            return $next($request);
        }

        if (!in_array($userRole, $roles)) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        return $next($request);
    }
}
