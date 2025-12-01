import mongoose, { Schema, Model } from 'mongoose';
import { IUsageHistory } from '../types';

type UsageHistoryModel = Model<IUsageHistory>;

const usageHistorySchema = new Schema<IUsageHistory, UsageHistoryModel>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      ref: 'User'
    },
    action: {
      type: String,
      required: true,
      enum: ['profile_scan', 'connection_request', 'bulk_message', 'crm_sync'],
      index: true
    },
    creditCost: {
      type: Number,
      required: true,
      min: 0
    },
    linkedInProfileUrl: {
      type: String,
      sparse: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false // We're using 'timestamp' field directly
  }
);

// Compound indexes for efficient queries
usageHistorySchema.index({ userId: 1, timestamp: -1 });
usageHistorySchema.index({ userId: 1, action: 1 });
usageHistorySchema.index({ timestamp: -1 });

// Static method to get user stats
usageHistorySchema.statics.getUserStats = async function (
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const match: any = { userId };

  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) match.timestamp.$gte = startDate;
    if (endDate) match.timestamp.$lte = endDate;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        totalCredits: { $sum: '$creditCost' }
      }
    }
  ]);
};

// Static method to get usage by date range
usageHistorySchema.statics.getUsageByDateRange = async function (
  userId: string,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.find({
    userId,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .limit(1000);
};

const UsageHistory = mongoose.model<IUsageHistory, UsageHistoryModel>(
  'UsageHistory',
  usageHistorySchema
);

export default UsageHistory;
