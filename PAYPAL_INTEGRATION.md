# PayPal Integration Complete ✅

This document describes the complete PayPal integration for FandomForge, replacing Stripe with PayPal for all payments and subscriptions.

## What Was Implemented

### 1. **Database Schema Updates**
- ✅ Added PayPal fields to `payments` table:
  - `paypalTransactionId` - Transaction ID from PayPal
  - `paypalOrderId` - Order ID from PayPal
  - `creatorEarnings` - Amount the creator receives (80% by default)
  - `platformCommission` - Amount the platform keeps (20% by default)
  - `commissionPercentage` - Configurable commission rate

- ✅ Updated `subscriptions` table:
  - `paypalSubscriptionId` - PayPal subscription ID for cancellations
  - `paypalPlanId` - PayPal billing plan ID
  - `amount` - Monthly subscription price

- ✅ Created new `creatorPayouts` table:
  - Track pending, processing, and completed payouts to creators
  - `status`: pending, processing, completed, failed
  - `paypalPayoutId` - ID of PayPal payout batch

### 2. **Backend Implementation** (`server/`)

#### PayPal Client (`server/paypal.ts`)
- Token management with caching
- Order creation (PPV/one-time payments)
- Order capture (finalize payment)
- Billing plans (recurring subscriptions)
- Subscription creation and management
- Payout batch creation for creator earnings

#### API Routes (`server/routes.ts`)
**New Payment Endpoints:**
- `POST /api/payments/create-ppv` - Create PPV order
- `POST /api/payments/capture-ppv` - Capture PPV payment
- `POST /api/payments/create-subscription` - Create subscription
- `POST /api/payments/confirm-subscription` - Confirm after PayPal approval
- `POST /api/payments/cancel-subscription/:id` - Cancel subscription
- `POST /api/payments/webhook/paypal` - PayPal webhook handler
- `GET /api/creator/:id/earnings` - Get creator earnings breakdown
- `POST /api/admin/payouts/batch` - Process batch payouts

#### Storage Layer (`server/storage.ts`)
- Added methods for creator earnings tracking
- Added methods for creator payout management
- Commission calculations built-in

### 3. **Frontend Implementation** (`client/src/`)

#### Payment Components
- **PPVCheckout.tsx** - Dialog for PPV purchases with PayPal redirect
- **SubscriptionCheckout.tsx** - Dialog for subscriptions with PayPal redirect
- **CreatorEarningsDisplay.tsx** - Dashboard widget showing earnings breakdown

#### Payment Pages
- **PaymentSuccessPage.tsx** - Handles PayPal success redirects
- **PaymentCancelPage.tsx** - Handles user cancellations

#### API Client (`client/src/lib/api.ts`)
```typescript
paymentApi = {
  createPPVOrder(),
  capturePPVOrder(),
  createSubscription(),
  confirmSubscription(),
  cancelSubscription(),
  getCreatorEarnings(),
  getCommission(),
  batchPayout()
}
```

### 4. **Commission Structure**
```
Default: 20% to platform, 80% to creator

Example:
- $30 subscription → Creator: $24, Platform: $6
- $5 PPV video → Creator: $4, Platform: $1
- $10 tip → Creator: $8, Platform: $2
```

## Setup Instructions

### 1. Get PayPal Credentials

1. Go to https://developer.paypal.com
2. Create/login to your account
3. Navigate to "Apps & Credentials"
4. Create a new app (or use Sandbox for testing)
5. Copy your **Client ID** and **Client Secret**

### 2. Create PayPal Billing Plan (Optional)

For subscriptions, you can predefine billing plans in PayPal dashboard, or the system creates them dynamically.

### 3. Set Environment Variables

Update your `.env` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your-client-id-from-paypal
PAYPAL_CLIENT_SECRET=your-client-secret-from-paypal
PAYPAL_MODE=sandbox  # Use "production" for live

# Return URLs (must be accessible by PayPal)
PAYPAL_RETURN_URL=http://localhost:5173/payment-success
PAYPAL_CANCEL_URL=http://localhost:5173/payment-cancel

# Webhook (set up in PayPal dashboard)
PAYPAL_WEBHOOK_ID=optional-for-production
```

### 4. Update Frontend URLs

The app redirects users to PayPal and back. Make sure your return URLs are publicly accessible in production:

```env
PAYPAL_RETURN_URL=https://yourdomain.com/payment-success
PAYPAL_CANCEL_URL=https://yourdomain.com/payment-cancel
```

### 5. Set Up Webhook (Production)

1. Go to PayPal Developer Dashboard → Webhooks
2. Create webhook with URL: `https://yourdomain.com/api/payments/webhook/paypal`
3. Subscribe to events:
   - BILLING.SUBSCRIPTION.CREATED
   - BILLING.SUBSCRIPTION.UPDATED
   - BILLING.SUBSCRIPTION.CANCELLED
   - PAYMENT.CAPTURE.COMPLETED
4. Add the Webhook ID to `.env` (for verification)

### 6. Database Migration

Run Drizzle migrations to update your database:

```bash
npm run db:push
```

This will:
- Update `payments` table with new PayPal fields
- Update `subscriptions` table with new PayPal fields
- Create new `creatorPayouts` table

## Payment Flows

### PPV (Pay-Per-View) Flow

```
User clicks "Buy Video" ($5)
        ↓
Frontend calls POST /api/payments/create-ppv
    ├─ Creates PayPal order
    ├─ Stores pending payment in DB
    └─ Returns approval URL
        ↓
User redirected to PayPal approval page
        ↓
User approves payment (with card or PayPal account)
        ↓
PayPal redirects to /payment-success?token=...
        ↓
Frontend calls POST /api/payments/capture-ppv
    ├─ Verifies payment with PayPal
    ├─ Marks payment as "completed"
    └─ Creator gains $4, Platform gains $1
        ↓
User can now access video
```

### Subscription Flow

```
User clicks "Subscribe" ($9.99/month)
        ↓
Frontend calls POST /api/payments/create-subscription
    ├─ Creates PayPal billing plan
    ├─ Creates subscription request
    └─ Returns approval URL
        ↓
User redirected to PayPal approval page
        ↓
User approves recurring subscription
        ↓
PayPal redirects to /subscription-success?subscription_id=...
        ↓
Frontend calls POST /api/payments/confirm-subscription
    ├─ Verifies subscription is ACTIVE
    ├─ Stores in DB with PayPal subscription ID
    └─ Creator gains $7.99, Platform gains $2.00
        ↓
User is now subscribed for monthly access
        ↓
PayPal charges monthly + sends webhooks
```

### Creator Earnings Flow

```
Payments collected over time
        ↓
Creator views dashboard → GET /api/creator/:id/earnings
        ↓
Shows breakdown:
├─ Total: $150.00
├─ From subscriptions: $100.00
├─ From PPV: $50.00
└─ Transactions: 15 sales
        ↓
Admin: POST /api/admin/payouts/batch
        ↓
Sends payout to creator's PayPal account
        ↓
Creator receives funds in 1-2 business days
```

## Key Features

✅ **Fully Integrated PayPal**
- Supports both PayPal and credit/debit cards (users choose PayPal checkout)
- No PayPal account required for credit card payments

✅ **Automatic Commission**
- 20% to platform, 80% to creator (configurable)
- Calculated instantly with each transaction

✅ **Creator Earnings Dashboard**
- Real-time earnings display
- Breakdown by subscription vs PPV
- Transaction history

✅ **Batch Payouts**
- Admin can payout multiple creators at once
- PayPal handles disbursements to creator accounts
- Tracks payout status in database

✅ **Webhook Support**
- Automatic status updates from PayPal
- Subscription renewal tracking
- Cancellation detection

## Testing

### Sandbox Mode (Development)

PayPal provides sandbox accounts for testing. Use these test cards:
- **4532015112830366** - Visa
- **6011111111111117** - Discover
- **3782822463100005** - American Express

Generate sandbox accounts at: https://developer.paypal.com/dashboard/accounts

### Testing Checklist

- [ ] Create PPV order → approve in PayPal → verify payment captured
- [ ] Create subscription → approve in PayPal → verify monthly billing
- [ ] Cancel subscription → verify cancellation in app & PayPal
- [ ] View creator earnings → verify correct amounts
- [ ] Test webhook handling (manually trigger or use PayPal webhook simulator)
- [ ] Test with different amounts and commission rates

## Troubleshooting

### "Failed to get PayPal access token"
- Check `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- Verify mode is correct (sandbox vs production)

### User redirects to blank page
- Check `PAYPAL_RETURN_URL` and `PAYPAL_CANCEL_URL` are correct
- Verify these URLs exist in your app (they do, as we created the pages)

### Webhook not working
- Webhook ID must be set in PayPal dashboard
- Verify webhook URL is publicly accessible
- Check PayPal webhook logs for errors

### Creator earnings not showing
- Verify payments have status "completed"
- Check commission percentages are set correctly
- Try refreshing the query cache

## Next Steps

1. **Test thoroughly** in sandbox mode
2. **Set up PAG Business payouts** in PayPal for creators
3. **Configure production credentials** when ready
4. **Update return URLs** to production domain
5. **Set up webhooks** in PayPal dashboard
6. **Monitor first payments** closely

## Support

For PayPal API documentation: https://developer.paypal.com/docs/
For webhook events: https://developer.paypal.com/docs/integration/webhooks/
