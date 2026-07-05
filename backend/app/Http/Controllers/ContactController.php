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
            'email' => 'nullable|email',
            'label' => 'nullable|string',
            'status' => 'nullable|string|in:subscribed,unsubscribed'
        ]);

        $normalizedPhone = str_starts_with($validated['phone_number'], '+') ? $validated['phone_number'] : '+' . $validated['phone_number'];

        $contact = Contact::updateOrCreate(
            ['tenant_id' => Auth::user()->tenant_id, 'phone_number' => $normalizedPhone],
            [
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'label' => $validated['label'] ?? null,
                'status' => $validated['status'] ?? 'subscribed'
            ]
        );

        return response()->json($contact, 201);
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'contacts' => 'required|array',
            'contacts.*.name' => 'required|string',
            'contacts.*.phone_number' => 'required|string',
            'contacts.*.email' => 'nullable|email',
            'contacts.*.label' => 'nullable|string'
        ]);

        $tenantId = Auth::user()->tenant_id;
        $contacts = $request->input('contacts');
        $created = [];

        foreach ($contacts as $c) {
            $normalizedPhone = str_starts_with($c['phone_number'], '+') ? $c['phone_number'] : '+' . $c['phone_number'];
            $created[] = Contact::updateOrCreate(
                ['tenant_id' => $tenantId, 'phone_number' => $normalizedPhone],
                [
                    'name' => $c['name'],
                    'email' => $c['email'] ?? null,
                    'label' => $c['label'] ?? null,
                    'status' => 'subscribed'
                ]
            );
        }

        return response()->json($created, 201);
    }

    public function destroyAll()
    {
        $tenantId = Auth::user()->tenant_id;
        Contact::where('tenant_id', $tenantId)->delete();
        return response()->json(['message' => 'All contacts cleared']);
    }

    public function show(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);
        return response()->json($contact);
    }

    public function update(Request $request, string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string',
            'phone_number' => 'required|string',
            'email' => 'nullable|email',
            'label' => 'nullable|string',
            'status' => 'nullable|string|in:subscribed,unsubscribed'
        ]);

        $contact->update($validated);

        return response()->json($contact);
    }

    public function destroy(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);
        $contact->delete();

        return response()->json(['message' => 'Contact deleted']);
    }
}
