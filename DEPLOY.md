# 🚀 OPCalls Deployment Guide

## Pre-Flight Checklist

Before deploying, ensure you have:

- [ ] Supabase project created
- [ ] Stripe account with test/live keys
- [ ] Twilio account with funds
- [ ] Retell AI account with API key
- [ ] Domain configured (e.g., opcalls.com)

---

## Step 1: Database Setup (Supabase)

Your Supabase project should already have migrations applied. If not:

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order from `/supabase/migrations/`

**Verify tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected: `agents`, `billing_state`, `calls`, `entitlements`, `organizations`, `plans`, `profiles`, `provisioning_jobs`, etc.

---

## Step 2: Stripe Products

### Create Products in Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Create these products:

| Product | Monthly Price | Annual Price (20% off) |
|---------|---------------|------------------------|
| Starter | $97/mo | $929/yr |
| Growth | $297/mo | $2,851/yr |
| Enterprise | Custom | Custom |

3. Copy the Price IDs (start with `price_`)

### Update Database

```sql
-- Update with your actual price IDs
UPDATE plans SET 
  stripe_price_id = 'price_STARTER_MONTHLY',
  stripe_price_id_yearly = 'price_STARTER_YEARLY'
WHERE code = 'starter';

UPDATE plans SET 
  stripe_price_id = 'price_GROWTH_MONTHLY',
  stripe_price_id_yearly = 'price_GROWTH_YEARLY'
WHERE code = 'growth';
```

---

## Step 3: Deploy to Netlify

### Option A: GitHub Integration (Recommended)

1. Push code to GitHub
2. Connect repo to Netlify
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`

### Option B: CLI Deploy

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## Step 4: Environment Variables

Add these to Netlify → Site Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=https://opcalls.com
CRON_SECRET=generate-random-32-char-string

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Retell
RETELL_API_KEY=...
RETELL_WEBHOOK_SECRET=...
```

---

## Step 5: Configure Webhooks

### Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://opcalls.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy signing secret → Add as `STRIPE_WEBHOOK_SECRET`

### Retell Webhook

1. Retell Dashboard → Settings → Webhooks
2. Add: `https://opcalls.com/api/webhooks/retell`
3. Enable: Call started, Call ended, Call analyzed

### Twilio Voice URL

1. Twilio Console → Phone Numbers → Your Number
2. Voice URL: `https://opcalls.com/api/webhooks/twilio/voice`
3. Method: POST

---

## Step 6: Create Admin User

1. Sign up on your deployed site
2. Get your user ID from Supabase Auth → Users
3. Run in SQL Editor:

```sql
INSERT INTO admin_users (user_id, role, email) 
VALUES (
  'your-uuid-here',
  'super_admin',
  'your@email.com'
);
```

---

## Step 7: Test Everything

### Landing Page
- [ ] Page loads with dark theme
- [ ] "Get Your AI Agent Built" opens modal
- [ ] Modal form submits successfully
- [ ] Check `done_for_you_requests` table

### Auth Flow
- [ ] Signup creates user
- [ ] Signup creates org + profile (check DB)
- [ ] Login redirects to /setup or /dashboard

### Onboarding (/setup)
- [ ] All 6 steps render correctly
- [ ] Phone number search works (Twilio connected)
- [ ] Agent creation works (Retell connected)
- [ ] Provisioning completes

### Dashboard
- [ ] Stats display correctly
- [ ] Call history loads
- [ ] Agent management works

### Admin Dashboard (/admin)
- [ ] Only accessible to admin users
- [ ] Platform stats load
- [ ] Organization list paginates

### Billing
- [ ] Checkout redirects to Stripe
- [ ] Webhook updates subscription status
- [ ] Customer portal works

---

## Troubleshooting

### "Unauthorized" on admin routes
- Check `admin_users` table has your user_id

### Twilio errors
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
- Ensure account has funds

### Retell errors
- Check `RETELL_API_KEY` is valid
- Verify webhook URL is correct

### Stripe webhook fails
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Verify webhook endpoint is accessible

---

## Going Live Checklist

- [ ] Switch from Stripe test keys to live keys
- [ ] Verify all environment variables are production values
- [ ] Test full signup → provision → call flow
- [ ] Monitor Supabase logs for errors
- [ ] Set up monitoring/alerting

---

## Support

- Logs: Netlify → Deploys → Functions
- Database: Supabase Dashboard → Logs
- Stripe: Dashboard → Developers → Logs

---

🎉 **You're ready to start making millions!**
