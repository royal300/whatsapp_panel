# 🚀 Royal300 WhatsApp SaaS Panel

A premium, comprehensive WhatsApp Marketing and Team Inbox solution engineered for scale. Built on the **Meta WhatsApp Cloud API**, this panel provides everything businesses need to manage customer interactions and broadcast marketing campaigns efficiently.

---

## ✨ Key Features

### 📬 Team Inbox & Real-time Chat
- **Unified Dashboard**: Manage all incoming and outgoing messages from a single screen.
- **Intelligent Name Fallback**: Automatically prioritizes **Saved Name > WhatsApp Profile Name > Phone Number**.
- **Profile Picture Support**: Seamlessly displays contact avatars for a more human interaction.
- **Real-time Sync**: Powered by Laravel Echo and robust 10-second polling failovers.
- **Auto-Discovery**: Automatically captures and stores WhatsApp profile names on the first message.

### 👥 Advanced Contacts (CRM)
- **Full CRUD**: Create, edit, and delete contacts with a sleek user interface.
- **Smart CSV Import**: Bulk upload thousands of contacts with automated phone formatting and tag syncing.
- **Tagging System**: Organize your audience with dynamic tags for targeted broadcasting.
- **Audience Insights**: High-level metrics on subscriber status and engagement.

### 📢 Targeted Campaigns
- **Dynamic Variable Mapping**: Personalized broadcasts using `{{1}}`, `{{2}}` variables.
- **Error Tracking**: Detailed logs for failed messages with actionable error insights.
- **Template Management**: Real-time synchronization with Meta's approved message templates.
- **CSV Templates**: Downloadable ready-to-use CSV templates for campaign data.

### 🏗️ SaaS & Branding
- **Multi-Tenant Architecture**: Secure data isolation between different business accounts.
- **Custom Branding**: Tenants can set their own **Business Name** and **Profile Picture** within the panel.
- **VPS Ready**: Includes automated synchronization and deployment scripts for easy scaling.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Laravel 11 (PHP 8.2+) |
| **Frontend** | React 18, Tailwind CSS, Rsbuild |
| **Database** | MySQL 8.0 / PostgreSQL |
| **Real-time** | Laravel Echo, Pusher, Webhooks |
| **Branding** | Material Symbols, Headline Typography |

---

## ⚙️ Installation & Setup

### 1. Backend Setup
```bash
cd backend
composer install
cp .env.example .env     # Configure DB and WA_CLOUD_API keys
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 Deployment (VPS)
This project includes a specialized deployment workflow:
1. **Sync**: Use `bash vps_sync.sh` to push local changes to the VPS.
2. **Deploy**: The `deploy.sh` script on the server handles migrations, dependency updates, and frontend builds automatically.

---

## 📄 Recent Updates
- **2026-03-29**:
  - ✨ Added **Contacts CRM** with full CRUD and CSV bulk import.
  - 🖼️ Implemented **Profile Picture** support across Inbox and Contacts.
  - 🏷️ Fixed **Tag mapping** in Chat sidebar.
  - 🔄 Updated **Inbox Fallback Logic** for superior contact name display.
  - 📊 Added **Error Message tracking** in Campaign logs.

---
*Created with ❤️ by Antigravity AI*
