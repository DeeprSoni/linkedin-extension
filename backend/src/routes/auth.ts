import { Router, Request, Response } from 'express';
import { HydratedDocument } from 'mongoose';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { validate, schemas } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import creditService from '../services/creditService';
import { RegisterRequest, LoginRequest, LoginResponse, APIResponse, AuthRequest, IUser } from '../types';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate(schemas.register),
  async (req: Request<{}, {}, RegisterRequest>, res: Response<APIResponse<{ message: string }>>) => {
    try {
      const { email, password, firstName, lastName, referralCode } = req.body;
      const normalizedReferralCode = referralCode?.trim().toUpperCase();

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
        return;
      }

      // Find referrer if code provided
      let referrer: HydratedDocument<IUser> | null = null;
      if (normalizedReferralCode) {
        referrer = await User.findOne({ referralCode: normalizedReferralCode });
        if (!referrer) {
          res.status(400).json({
            success: false,
            error: 'Invalid referral code'
          });
          return;
        }
      }

      // Create user (email automatically verified)
      const newUser = await User.create({
        email,
        password,
        firstName,
        lastName,
        referredBy: referrer?._id?.toString() || null,
        emailVerified: true,
        plan: 'free',
        credits: {
          remaining: 50,
          dailyLimit: 50,
          lastRefresh: new Date(),
          warningsSent: []
        }
      });

      // Apply referral bonus to both parties
      if (referrer) {
        const bonusCredits = 10;
        referrer.credits.remaining += bonusCredits;
        referrer.credits.dailyLimit += bonusCredits;
        await referrer.save();

        newUser.credits.remaining += bonusCredits;
        newUser.credits.dailyLimit += bonusCredits;
        await newUser.save();
      }

      res.status(201).json({
        success: true,
        message: 'Registration successful! You can now log in.',
        data: {
          message: 'Account created successfully'
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  }
);

/**
 * POST /auth/login
 * Login user
 */
router.post(
  '/login',
  validate(schemas.login),
  async (req: Request<{}, {}, LoginRequest>, res: Response<APIResponse<LoginResponse>>) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // Refresh credits if needed
      await user.refreshCredits();

      // Generate JWT token
      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        plan: user.plan
      });

      // Get credit status
      const credits = await creditService.getCreditStatus(user._id.toString());

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            plan: user.plan,
            emailVerified: user.emailVerified,
            referralCode: user.referralCode || null
          },
          credits: credits!
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  }
);

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response<APIResponse>) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const credits = await creditService.getCreditStatus(user._id.toString());

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          emailVerified: user.emailVerified,
          referralCode: user.referralCode || null
        },
        credits
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

export default router;
