<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Chat;
use App\Models\Message;
use App\Services\WhatsAppService;
use App\Services\BillingService;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(
            Chat::with(['contact', 'messages', 'agent'])
                ->where('tenant_id', $tenantId)
                ->orderBy('updated_at', 'desc')
                ->get()
        );
    }

    public function sendMessage(Request $request, Chat $chat)
    {
        $validated = $request->validate([
            'message_body' => 'required|string',
        ]);

        $billing = new BillingService();
        $tenant = Auth::user()->tenant;

        if (!$billing->canSend($tenant)) {
            return response()->json(['message' => 'Insufficient credits'], 403);
        }

        try {
            $whatsapp = new WhatsAppService($tenant);
            $whatsapp->sendTextMessage($chat->contact->phone_number, $validated['message_body']);

            $billing->incrementUsage($tenant);

            $message = Message::create([
                'chat_id' => $chat->id,
                'sender_type' => 'agent',
                'user_id' => Auth::id(),
                'message_body' => $validated['message_body'],
                'status' => 'sent'
            ]);

            // Use Tenant-specific Pusher config and broadcast
            \App\Services\PusherService::useTenantConfig($tenant);
            broadcast(new \App\Events\MessageReceived($message))->toOthers();

            return response()->json($message, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function show(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $chat = Chat::with(['contact', 'messages', 'agent'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);
        return response()->json($chat);
    }

    public function update(Request $request, string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $chat = Chat::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'status' => 'nullable|string|in:open,resolved,bot',
        ]);

        if (array_key_exists('user_id', $validated)) {
            if (!empty($validated['user_id'])) {
                $user = \App\Models\User::findOrFail($validated['user_id']);
                if ($user->tenant_id !== $tenantId) {
                    return response()->json(['message' => 'Agent does not belong to this team'], 403);
                }
            }
        }

        $chat->update($validated);

        return response()->json($chat->load(['contact', 'messages', 'agent']));
    }

    public function destroy(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $chat = Chat::where('tenant_id', $tenantId)->findOrFail($id);
        $chat->delete();

        return response()->json(['message' => 'Chat deleted']);
    }
}
