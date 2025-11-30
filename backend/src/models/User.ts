import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';
import { PlanType, PLANS } from '../config/plans';

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  refreshCredits(): Promise<void>;
  consumeCredits(amount: number): Promise<boolean>;
}

type UserModel = Model<IUser, {}, UserMethods>;

const userSchema = new Schema<IUser, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    emailVerified: {
      type: Boolean,
      default: true // Auto-verify since we removed email service
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'enterprise'],
      default: 'free'
    },
    stripeCustomerId: {
      type: String,
      sparse: true
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true
    },
    credits: {
      remaining: {
        type: Number,
        default: 50 // Free tier default
      },
      dailyLimit: {
        type: Number,
        default: 50 // Free tier default
      },
      lastRefresh: {
        type: Date,
        default: Date.now
      },
      warningsSent: {
        type: [String],
        default: []
      }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update credit limits when plan changes
userSchema.pre('save', async function (next) {
  if (!this.isModified('plan')) {
    return next();
  }

  const planConfig = PLANS[this.plan as PlanType];
  this.credits.dailyLimit = planConfig.dailyCredits;
  this.credits.remaining = planConfig.dailyCredits;
  this.credits.lastRefresh = new Date();
  this.credits.warningsSent = [];

  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Refresh credits method
userSchema.methods.refreshCredits = async function (): Promise<void> {
  const now = new Date();
  const lastRefresh = new Date(this.credits.lastRefresh);
  const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

  // Refresh if 24 hours have passed
  if (hoursSinceRefresh >= 24) {
    const planConfig = PLANS[this.plan as PlanType];
    this.credits.remaining = planConfig.dailyCredits;
    this.credits.dailyLimit = planConfig.dailyCredits;
    this.credits.lastRefresh = now;
    this.credits.warningsSent = [];
    await this.save();
  }
};

// Consume credits method
userSchema.methods.consumeCredits = async function (amount: number): Promise<boolean> {
  if (this.credits.remaining < amount) {
    return false; // Not enough credits
  }

  this.credits.remaining -= amount;
  await this.save();
  return true;
};

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ stripeCustomerId: 1 }, { sparse: true });
userSchema.index({ 'credits.lastRefresh': 1 });

const User = mongoose.model<IUser, UserModel>('User', userSchema);

export default User;
