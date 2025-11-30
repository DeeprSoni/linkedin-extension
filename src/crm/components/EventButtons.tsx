/**
 * EventButtons Component
 *
 * Displays buttons for valid events that can be applied to a lead.
 * Only shows buttons for events that are legal transitions from the current stage.
 */

import React from 'react';
import { Stage, Event } from '../types';
import { getValidEvents } from '../stateMachine';

interface EventButtonsProps {
  stage: Stage;
  onEvent: (event: Event) => void;
  disabled?: boolean;
  className?: string;
}

const EVENT_LABELS: Record<Event, string> = {
  [Event.SCRAPED]: 'Scraped',
  [Event.CONNECTION_REQUEST_SENT]: 'Send Request',
  [Event.CONNECTION_ACCEPTED]: 'Accepted',
  [Event.DM_SENT]: 'Send DM',
  [Event.DM_REPLY_RECEIVED]: 'Reply Received',
  [Event.MEETING_SCHEDULED]: 'Schedule Meeting',
  [Event.SET_NURTURE]: 'Set Nurture',
  [Event.MARK_LOST]: 'Mark Lost',
};

const EVENT_COLORS: Record<Event, string> = {
  [Event.SCRAPED]: '#6B7280',
  [Event.CONNECTION_REQUEST_SENT]: '#3B82F6',
  [Event.CONNECTION_ACCEPTED]: '#10B981',
  [Event.DM_SENT]: '#8B5CF6',
  [Event.DM_REPLY_RECEIVED]: '#8B5CF6',
  [Event.MEETING_SCHEDULED]: '#F59E0B',
  [Event.SET_NURTURE]: '#6366F1',
  [Event.MARK_LOST]: '#EF4444',
};

export const EventButtons: React.FC<EventButtonsProps> = ({
  stage,
  onEvent,
  disabled = false,
  className = '',
}) => {
  const validEvents = getValidEvents(stage);

  // Filter out idempotent events that don't make sense to show as buttons
  const displayEvents = validEvents.filter((event) => {
    // Don't show SCRAPED button (internal event)
    if (event === Event.SCRAPED) return false;
    return true;
  });

  if (displayEvents.length === 0) {
    return (
      <div className={`event-buttons ${className}`}>
        <p style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
          No actions available for this stage
        </p>
      </div>
    );
  }

  return (
    <div className={`event-buttons ${className}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {displayEvents.map((event) => {
        const color = EVENT_COLORS[event];
        const label = EVENT_LABELS[event];

        return (
          <button
            key={event}
            onClick={() => onEvent(event)}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              border: `1px solid ${color}`,
              backgroundColor: disabled ? '#F3F4F6' : '#FFFFFF',
              color: disabled ? '#9CA3AF' : color,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = `${color}10`;
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
