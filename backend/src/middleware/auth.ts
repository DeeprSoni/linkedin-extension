import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { getRedisClient } from '../config/redis';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided. Please include Bearer token in Authorization header.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    // Check if token is cached in Redis (optional - for session management)
    try {
      const redis = getRedisClient();
      const cachedSession = await redis.get(`session:${decoded.id}`);

      if (!cachedSession) {
        // Session doesn't exist in cache, but token is valid
        // Cache it for 30 days
        await redis.setEx(
          `session:${decoded.id}`,
          30 * 24 * 60 * 60, // 30 days in seconds
          token
        );
      }
    } catch (redisError) {
      // Redis error shouldn't block the request
      console.error('Redis error in auth middleware:', redisError);
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      plan: decoded.plan
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work differently for authenticated users
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          plan: decoded.plan
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

export default { authenticate, optionalAuth };
