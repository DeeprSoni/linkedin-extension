import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticate, AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { APIResponse, PlanType } from '../types';
import { PLANS } from '../config/plans';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
});

/**
 * POST /stripe/create-checkout-session
 * Create Stripe checkout session for plan upgrade
 */
router.post(
  '/create-checkout-session',
  authenticate,
  async (req: AuthRequest, res: Response<APIResponse>) => {
    try {
      const { plan } = req.body as { plan: PlanType };

      if (!plan || !['starter', 'pro', 'enterprise'].includes(plan)) {
        res.status(400).json({
          success: false,
          error: 'Invalid plan selected'
        });
        return;
      }

      const user = await User.findById(req.user!.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const planConfig = PLANS[plan];
      if (!planConfig.stripePriceId) {
        res.status(400).json({
          success: false,
          error: 'Plan not available for purchase'
        });
        return;
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user._id.toString()
          }
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: planConfig.stripePriceId,
            quantity: 1
          }
        ],
        success_url: `${process.env.FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/upgrade/cancel`,
        metadata: {
          userId: user._id.toString(),
          plan
        }
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url
        }
      });
    } catch (error) {
      console.error('Create checkout session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session'
      });
    }
  }
);

/**
 * POST /stripe/webhook
 * Handle Stripe webhooks
 */
router.post(
  '/webhook',
  // Use raw body for webhook verification
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(session);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          console.log('Payment succeeded for invoice:', invoice.id);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          console.error('Payment failed for invoice:', invoice.id);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

/**
 * POST /stripe/cancel-subscription
 * Cancel current subscription
 */
router.post(
  '/cancel-subscription',
  authenticate,
  async (req: AuthRequest, res: Response<APIResponse>) => {
    try {
      const user = await User.findById(req.user!.id);
      if (!user || !user.stripeSubscriptionId) {
        res.status(400).json({
          success: false,
          error: 'No active subscription found'
        });
        return;
      }

      // Cancel subscription at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      res.json({
        success: true,
        message: 'Subscription will be cancelled at the end of the billing period'
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  }
);

/**
 * GET /stripe/portal
 * Get Stripe customer portal link
 */
router.get(
  '/portal',
  authenticate,
  async (req: AuthRequest, res: Response<APIResponse>) => {
    try {
      const user = await User.findById(req.user!.id);
      if (!user || !user.stripeCustomerId) {
        res.status(400).json({
          success: false,
          error: 'No Stripe customer found'
        });
        return;
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}/dashboard`
      });

      res.json({
        success: true,
        data: {
          url: session.url
        }
      });
    } catch (error) {
      console.error('Get portal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get portal link'
      });
    }
  }
);

// Webhook handler functions
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as PlanType;

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found:', userId);
    return;
  }

  // Update user plan
  user.plan = plan;
  user.stripeSubscriptionId = session.subscription as string;
  await user.save();

  console.log(`User ${userId} upgraded to ${plan} plan`);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  // Handle subscription status changes
  if (subscription.status === 'active') {
    console.log(`Subscription ${subscription.id} is active`);
  } else if (subscription.status === 'canceled') {
    user.plan = 'free';
    await user.save();
    console.log(`User ${user._id} downgraded to free plan`);
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const user = await User.findOne({ stripeSubscriptionId: subscription.id });
  if (!user) {
    console.error('User not found for subscription:', subscription.id);
    return;
  }

  // Downgrade to free plan
  user.plan = 'free';
  user.stripeSubscriptionId = undefined;
  await user.save();

  console.log(`User ${user._id} subscription deleted, downgraded to free`);
}

export default router;
