import { Request } from 'express';
import { PlanType as PlanTypeDef, ActionType as ActionTypeDef } from '../config/plans';

export type PlanType = PlanTypeDef;
export type ActionType = ActionTypeDef;

/**
 * User document interface
 */
export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  plan: PlanType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  credits: {
    remaining: number;
    dailyLimit: number;
    lastRefresh: Date;
    warningsSent: ('80%' | '90%')[];
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Usage history document interface
 */
export interface IUsageHistory {
  _id: string;
  userId: string;
  action: ActionType;
  creditCost: number;
  linkedInProfileUrl?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    email: string;
    plan: PlanType;
  };
}

/**
 * JWT Payload
 */
export interface JWTPayload {
  id: string;
  email: string;
  plan: PlanType;
}

/**
 * API Response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Credit consumption request
 */
export interface ConsumeCreditsRequest {
  action: ActionType;
  linkedInProfileUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Credit status response
 */
export interface CreditStatus {
  remaining: number;
  dailyLimit: number;
  used: number;
  percentUsed: number;
  nextRefresh: Date;
  warningLevel?: 'low' | 'critical' | null;
}

/**
 * Registration request body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Login request body
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response
 */
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    plan: PlanType;
    emailVerified: boolean;
  };
  credits: CreditStatus;
}
