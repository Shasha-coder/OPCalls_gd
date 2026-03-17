# 🚀 OPCalls - AI Voice Agent SaaS Platform

<p align="center">
  <strong>Never Miss Another Call</strong><br/>
  AI-powered voice agents that handle calls 24/7, book appointments, and never lose a customer.
</p>

---

## ✨ Features

### For Customers
- 🤖 **AI Receptionist** - 24/7 call handling with natural conversation
- 📅 **Smart Booking** - Automatic appointment scheduling
- 📞 **Real Phone Numbers** - Local or toll-free numbers
- 📊 **Analytics Dashboard** - Call insights, sentiment analysis
- ⚡ **Instant Setup** - 6-step onboarding wizard

### For Your Business
- 💳 **Stripe Billing** - Subscriptions with customer portal
- 🏢 **Multi-tenant** - Isolated orgs with per-tenant Twilio subaccounts
- 🔄 **Durable Provisioning** - Idempotent jobs with retry & rollback
- 🛡️ **Admin Dashboard** - Full platform visibility & control
- 📈 **Provider Abstraction** - Swap Twilio/Retell easily

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Styling | Tailwind CSS + Custom Design System |
| Telephony | Twilio (Numbers, SIP, Voice) |
| AI Voice | Retell AI |
| Billing | Stripe |
| Deployment | Netlify / Vercel |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

---

## 🚢 Deployment Checklist

### 1. Environment Variables
Add all variables from `.env.example` to your hosting provider.

### 2. Webhooks
- **Stripe**: `https://yourdomain.com/api/webhooks/stripe`
- **Retell**: `https://yourdomain.com/api/webhooks/retell`
- **Twilio**: `https://yourdomain.com/api/webhooks/twilio/voice`

### 3. Stripe Products
Create products in Stripe Dashboard and update `plans` table:
```sql
UPDATE plans SET stripe_price_id = 'price_xxx' WHERE code = 'starter';
UPDATE plans SET stripe_price_id = 'price_xxx' WHERE code = 'growth';
```

### 4. First Admin User
```sql
INSERT INTO admin_users (user_id, role, email) 
VALUES ('your-supabase-user-id', 'super_admin', 'you@email.com');
```

---

## 📁 Structure

```
├── app/
│   ├── api/              # API routes (billing, telephony, AI, admin)
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin dashboard
│   └── setup/            # Onboarding wizard
├── components/           # React components
├── lib/
│   ├── billing/          # Stripe integration
│   ├── telephony/        # Twilio services
│   ├── ai/               # Retell integration
│   └── provisioning/     # Durable job system
└── hooks/                # React hooks
```

---

## 💰 Default Plans

| Plan | Price | Minutes | Agents |
|------|-------|---------|--------|
| Free | $0/mo | 100 | 1 |
| Starter | $97/mo | 500 | 2 |
| Growth | $297/mo | 2,000 | 5 |
| Enterprise | Custom | Unlimited | Unlimited |

---

<p align="center">
  Built with 💚 by the OPCalls Team
</p>
