import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import creditService from '../services/creditService';
import { APIResponse, ConsumeCreditsRequest } from '../types';

const router = Router();

// All credit routes require authentication
router.use(authenticate);

/**
 * GET /credits/status
 * Get current credit status
 */
router.get('/status', async (req: AuthRequest, res: Response<APIResponse>) => {
  try {
    const credits = await creditService.getCreditStatus(req.user!.id);

    if (!credits) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    console.error('Get credit status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch credit status'
    });
  }
});

/**
 * POST /credits/consume
 * Consume credits for an action
 */
router.post(
  '/consume',
  validate(schemas.consumeCredits),
  async (req: AuthRequest<{}, {}, ConsumeCreditsRequest>, res: Response<APIResponse>) => {
    try {
      const { action, linkedInProfileUrl, metadata } = req.body;

      const result = await creditService.consumeCredits(
        req.user!.id,
        action,
        linkedInProfileUrl,
        metadata
      );

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: {
          remaining: result.remaining,
          message: `Successfully consumed credits for ${action}`
        }
      });
    } catch (error) {
      console.error('Consume credits error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to consume credits'
      });
    }
  }
);

/**
 * GET /credits/history
 * Get usage history
 */
router.get('/history', async (req: AuthRequest, res: Response<APIResponse>) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = await creditService.getUsageHistory(req.user!.id, limit);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get usage history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage history'
    });
  }
});

/**
 * GET /credits/stats
 * Get usage statistics
 */
router.get('/stats', async (req: AuthRequest, res: Response<APIResponse>) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await creditService.getUsageStats(req.user!.id, days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics'
    });
  }
});

export default router;
