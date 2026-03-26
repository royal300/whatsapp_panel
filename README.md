# Royal300 WhatsApp SaaS Panel

A comprehensive WhatsApp Marketing and Team Inbox solution built on the Meta WhatsApp Cloud API.

## 🚀 Key Features
- **Campaign Management**: Broadcast personalized messages using mapping variables (`{{1}}`, `{{2}}`).
- **Template Synchronization**: Real-time sync with Meta's approved templates.
- **Team Inbox**: Unified dashboard for incoming/outgoing chats with auto-retry and real-time polling.
- **Detailed Analytics**: Track delivery status, read rates, and recipient logs.
- **SaaS Ready**: Multi-tenant architecture with per-tenant WhatsApp configurations and billing (in progress).

---

## 🛠️ Technology Stack
- **Backend**: Laravel 11, MySQL, PHP 8.2+
- **Frontend**: React 18, Tailwind CSS, Rsbuild
- **Real-time**: Laravel Echo & Polling Fallback
- **Integrations**: Meta WhatsApp Cloud API

---

## ⚙️ Installation & Setup

### 1. Backend Setup
1. Move to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   composer install
   ```
3. Set up environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Run migrations and seed data:
   ```bash
   php artisan migrate --seed
   ```
5. Start the server:
   ```bash
   php artisan serve --port=8000
   ```

### 2. Frontend Setup
1. Move to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

---

## 🔑 Access Credentials (Dev)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@royal300.com` | `password` |
| **Manager** | `royal300ad@gmail.com` | `password` |

---

## 📡 Webhook Setup (Local)
To receive incoming messages on `localhost`:
1. Expose your server using `ngrok http 8000`.
2. Set Callback URL in Meta: `[NGROK_URL]/api/webhook`.
3. Set Verify Token: `royal300_secret_token`.
4. Subscribe to the `messages` field.

---

## 📄 Recent Updates
- **2026-03-23**: 
  - Integrated Broadcast Sync with Team Inbox.
  - Implemented Template Reconstruction (Actual text instead of placeholders).
  - Added 10-second polling and auto-scroll to Inbox UI.
  - Enabled metadata tracking for campaigns.

---
*Created with ❤️ by Antigravity AI*
