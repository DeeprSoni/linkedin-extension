/**
 * StageBadge Component
 *
 * Displays a colored badge for a lead's stage.
 */

import React from 'react';
import { Stage } from '../types';

interface StageBadgeProps {
  stage: Stage;
  className?: string;
}

const STAGE_COLORS: Record<Stage, string> = {
  [Stage.NEW]: '#6B7280', // gray
  [Stage.REQUEST_SENT]: '#3B82F6', // blue
  [Stage.CONNECTED]: '#10B981', // green
  [Stage.ACTIVE_CONVO]: '#8B5CF6', // purple
  [Stage.MEETING_BOOKED]: '#F59E0B', // amber
  [Stage.NURTURE]: '#6366F1', // indigo
  [Stage.LOST]: '#EF4444', // red
};

const STAGE_LABELS: Record<Stage, string> = {
  [Stage.NEW]: 'New',
  [Stage.REQUEST_SENT]: 'Request Sent',
  [Stage.CONNECTED]: 'Connected',
  [Stage.ACTIVE_CONVO]: 'Active Conversation',
  [Stage.MEETING_BOOKED]: 'Meeting Booked',
  [Stage.NURTURE]: 'Nurture',
  [Stage.LOST]: 'Lost',
};

export const StageBadge: React.FC<StageBadgeProps> = ({ stage, className = '' }) => {
  const color = STAGE_COLORS[stage];
  const label = STAGE_LABELS[stage];

  return (
    <span
      className={`stage-badge ${className}`}
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
};
