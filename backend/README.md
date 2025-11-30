# LinkedIn Agent Backend API

Authentication and credit management system for LinkedIn Agent Chrome extension.

## Features

- JWT-based authentication
- Email verification
- Credit-based usage tracking
- Stripe payment integration
- Plan management (Free, Starter, Pro, Enterprise)
- Daily credit refresh
- Redis caching
- MongoDB storage

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: MongoDB
- **Cache**: Redis
- **Payment**: Stripe
- **Email**: Nodemailer
- **Container**: Docker

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Stripe account (for payments)
- SMTP email service (Gmail, SendGrid, etc.)

### Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Copy environment file**
```bash
cp .env.example .env
```

3. **Configure environment variables**

Edit `.env` file and update:
- `JWT_SECRET`: Random secure string
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `STRIPE_PRICE_ID_*`: Your Stripe price IDs
- `EMAIL_*`: Your SMTP email configuration
- `MONGO_ROOT_PASSWORD`: Secure MongoDB password
- `REDIS_PASSWORD`: Secure Redis password

4. **Start with Docker Compose** (from root directory)
```bash
cd ..
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Redis on port 6379
- Backend API on port 3000

### Local Development (without Docker)

1. **Install dependencies**
```bash
npm install
```

2. **Start MongoDB and Redis locally** (or use cloud services)

3. **Run in development mode**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: { email, password, firstName, lastName }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Returns: { token, user, credits }
```

#### Verify Email
```
GET /api/auth/verify-email?token=<verification_token>
```

#### Get Profile
```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
```

#### Resend Verification
```
POST /api/auth/resend-verification
Body: { email }
```

### Credits

#### Get Credit Status
```
GET /api/credits/status
Headers: { Authorization: Bearer <token> }
Returns: { remaining, dailyLimit, used, percentUsed, nextRefresh }
```

#### Consume Credits
```
POST /api/credits/consume
Headers: { Authorization: Bearer <token> }
Body: { action, linkedInProfileUrl?, metadata? }
```

Actions:
- `profile_scan` - 1 credit
- `crm_sync` - 2 credits
- `bulk_message` - 3 credits
- `connection_request` - 5 credits

#### Get Usage History
```
GET /api/credits/history?limit=100
Headers: { Authorization: Bearer <token> }
```

#### Get Usage Stats
```
GET /api/credits/stats?days=30
Headers: { Authorization: Bearer <token> }
```

### Stripe (Payments)

#### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Headers: { Authorization: Bearer <token> }
Body: { plan: 'starter' | 'pro' | 'enterprise' }
Returns: { sessionId, url }
```

#### Webhook (Stripe)
```
POST /api/stripe/webhook
Headers: { stripe-signature }
Body: <raw stripe event>
```

#### Cancel Subscription
```
POST /api/stripe/cancel-subscription
Headers: { Authorization: Bearer <token> }
```

#### Get Customer Portal
```
GET /api/stripe/portal
Headers: { Authorization: Bearer <token> }
Returns: { url }
```

## Plan Limits

| Plan | Daily Credits | Price | Stripe Integration |
|------|--------------|-------|-------------------|
| Free | 50 | $0 | No payment required |
| Starter | 200 | $9.99/mo | Required |
| Pro | 1,000 | $29.99/mo | Required |
| Enterprise | 5,000 | $99.99/mo | Required |

## Credit Costs

| Action | Cost | Description |
|--------|------|-------------|
| Profile Scan | 1 | View LinkedIn profile |
| CRM Sync | 2 | Add/sync lead to CRM |
| Bulk Message | 3 | Send message via bulk messaging |
| Connection Request | 5 | Send connection request |

## Credit Warnings

Users receive email warnings at:
- **80% usage** (Low warning)
- **90% usage** (Critical warning)

When credits run out, all actions are **hard blocked**.

## Scheduler

- **Credit Refresh**: Runs every hour, refreshes credits for users whose 24-hour period has elapsed
- **Cleanup** (optional): Runs daily at 2 AM for maintenance tasks

## Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `JWT_SECRET`: Used for signing tokens
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: For webhook verification
- `EMAIL_*`: SMTP configuration for sending emails

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for stateless authentication
- Helmet.js for security headers
- CORS configured for specific origins
- Redis session caching
- Webhook signature verification

## Monitoring

Health check endpoint:
```
GET /health
```

Returns server status and timestamp.

## Troubleshooting

### MongoDB connection failed
- Check if MongoDB container is running
- Verify MongoDB credentials in `.env`
- Check network connectivity

### Redis connection failed
- Check if Redis container is running
- Verify Redis password in `.env`

### Stripe webhooks not working
- Verify webhook secret in `.env`
- Check Stripe dashboard for webhook delivery
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Email not sending
- Verify SMTP credentials
- Check email service logs
- For Gmail: enable "Less secure app access" or use App Password

## Development

### Type Checking
```bash
npm run type-check
```

### Build
```bash
npm run build
```

### Watch Mode
```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Update `FRONTEND_URL` to your production domain
3. Set secure passwords for MongoDB and Redis
4. Configure proper Stripe webhook endpoint
5. Use production SMTP service
6. Build and start:
```bash
npm run build
npm start
```

## License

Proprietary - LinkedIn Agent
