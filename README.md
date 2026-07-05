# Royal300 WhatsApp SaaS Panel

A comprehensive WhatsApp Marketing and Automation solution built on the Meta WhatsApp Cloud API. 

## 🚀 Key Features
- **Visual Flow Builder**: An interactive, drag-and-drop node graph editor to design custom conversation flows (Triggers, Conditions, Actions, Messages).
- **Campaign Management**: Broadcast personalized messages to imported contact lists with dynamic variables (`{{1}}`, `{{2}}`).
- **Team Inbox**: Unified real-time chat interface with dynamic unread message indicators, auto-retry logic, and seamless WhatsApp Template reconstruction.
- **Automation Rules**: Set up quick keyword-based autoresponders.
- **Template Synchronization**: Real-time sync with Meta's approved WhatsApp templates.
- **Detailed Analytics**: Track delivery statuses, read rates, and monitor campaign performance.
- **SaaS Ready**: Multi-tenant architecture designed to scale.

---

## 🛠️ Technology Stack
- **Frontend**: React 18, Tailwind CSS, Rsbuild (Fast bundler)
- **Backend**: Laravel 11, MySQL, PHP 8.2+
- **Real-time Engine**: API Polling Fallbacks (Laravel Echo ready)
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

## 🔑 Access Credentials (Local Dev)
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@royal300.com` | `password123` |
| **Manager** | `royal300ad@gmail.com` | `password` |

---

## 📡 Webhook Setup
To receive incoming WhatsApp messages locally:
1. Expose your server using `ngrok http 8000`.
2. Set Callback URL in Meta: `[NGROK_URL]/api/webhook`.
3. Set Verify Token: `royal300_secret_token`.
4. Subscribe to the `messages` field.

---

## 🚀 Deployment (VPS)
We include a custom automated deployment script to sync code directly to your VPS.
1. Run `./vps_sync.sh` from your local machine to sync files securely via `rsync`.
2. This script automatically builds the frontend remotely and syncs changes directly to GitHub!

---
*Created with ❤️ by Antigravity AI*
