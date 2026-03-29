<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Template;
use Illuminate\Support\Facades\Auth;
use App\Services\WhatsAppService;

class TemplateController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(Template::where('tenant_id', $tenantId)->orderBy('created_at', 'desc')->get());
    }

    public function sync()
    {
        $tenant = Auth::user()->tenant;
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 404);

        try {
            $ws = new WhatsAppService($tenant);
            $res = $ws->syncTemplates();

            if (isset($res['data'])) {
                foreach ($res['data'] as $mt) {
                    // Extract body text from components
                    $bodyText = '';
                    if (isset($mt['components'])) {
                        foreach ($mt['components'] as $comp) {
                            if ($comp['type'] === 'BODY') $bodyText = $comp['text'];
                        }
                    }

                    Template::updateOrCreate(
                        ['tenant_id' => $tenant->id, 'name' => $mt['name']],
                        [
                            'whatsapp_template_id' => $mt['id'] ?? null,
                            'language' => $mt['language'] ?? 'en',
                            'category' => $mt['category'] ?? 'UTILITY',
                            'status' => $mt['status'] ?? 'PENDING',
                            'content' => $mt['components'] ?? [],
                            // We can add a custom attribute for body text if needed, or just parse content on frontend
                        ]
                    );
                }
            }

            return response()->json(['message' => 'Templates synced successfully', 'count' => count($res['data'] ?? [])]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|regex:/^[a-z0-9_]+$/',
            'language' => 'required|string',
            'category' => 'required|string',
            'components' => 'required|array'
        ]);

        $tenant = Auth::user()->tenant;
        
        try {
            $ws = new WhatsAppService($tenant);
            $res = $ws->createTemplate(
                $validated['name'],
                $validated['category'],
                $validated['language'],
                $validated['components']
            );

            if (isset($res['error'])) {
                return response()->json(['message' => 'Meta API Error: ' . ($res['error']['message'] ?? 'Unknown Error')], 400);
            }

            $template = Template::create([
                'tenant_id' => $tenant->id,
                'whatsapp_template_id' => $res['id'] ?? null,
                'name' => $validated['name'],
                'language' => $validated['language'],
                'category' => $validated['category'],
                'status' => 'PENDING',
                'content' => $validated['components']
            ]);

            return response()->json($template, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Creation failed: ' . $e->getMessage()], 500);
        }
    }

    public function show(string $id) 
    {
        $tenantId = Auth::user()->tenant_id;
        $template = Template::where('tenant_id', $tenantId)->findOrFail($id);
        return response()->json($template);
    }

    public function refreshStatus(string $id)
    {
        $tenant = Auth::user()->tenant;
        $template = Template::where('tenant_id', $tenant->id)->findOrFail($id);

        try {
            $ws = new WhatsAppService($tenant);
            $res = $ws->getTemplateByName($template->name);

            if (isset($res['data']) && count($res['data']) > 0) {
                $mt = $res['data'][0];
                $template->update([
                    'status' => $mt['status'] ?? $template->status,
                    'whatsapp_template_id' => $mt['id'] ?? $template->whatsapp_template_id
                ]);
            }

            return response()->json($template);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Refresh failed: ' . $e->getMessage()], 500);
        }
    }

    public function test(Request $request, string $id)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'variables' => 'nullable|array'
        ]);

        $tenant = Auth::user()->tenant;
        $template = Template::where('tenant_id', $tenant->id)->findOrFail($id);

        try {
            $ws = new WhatsAppService($tenant);
            
            // Format variables for Meta
            $formattedComponents = [];
            if (!empty($validated['variables'])) {
                $parameters = [];
                foreach ($validated['variables'] as $val) {
                    $parameters[] = ['type' => 'text', 'text' => (string)$val];
                }
                $formattedComponents[] = [
                    'type' => 'body',
                    'parameters' => $parameters
                ];
            }

            $res = $ws->sendTemplateMessage(
                $validated['phone'],
                $template->name,
                $template->language,
                $formattedComponents
            );

            if (isset($res['error'])) {
                return response()->json(['message' => 'Meta API Error: ' . ($res['error']['message'] ?? 'Unknown Error')], 400);
            }

            return response()->json(['message' => 'Test message sent successfully!', 'response' => $res]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Test send failed: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $id) { /*...*/ }
    public function destroy(string $id) { /*...*/ }
}
