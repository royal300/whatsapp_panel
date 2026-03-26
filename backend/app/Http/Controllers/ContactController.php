<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Contact;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(Contact::where('tenant_id', $tenantId)->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'phone_number' => 'required|string',
            'status' => 'nullable|string|in:subscribed,unsubscribed'
        ]);

        $validated['tenant_id'] = Auth::user()->tenant_id;
        
        $contact = Contact::create($validated);

        return response()->json($contact, 201);
    }

    public function show(string $id) { /*...*/ }
    public function update(Request $request, string $id) { /*...*/ }
    public function destroy(string $id) { /*...*/ }
}
