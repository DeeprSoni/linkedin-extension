/**
 * LeadCard Component
 *
 * Complete card component for displaying and interacting with a lead.
 */

import React, { useState } from 'react';
import { Lead, Event } from '../types';
import { StageBadge } from './StageBadge';
import { EventButtons } from './EventButtons';

interface LeadCardProps {
  lead: Lead;
  onEventApplied: (leadId: string, event: Event) => void;
  onLeadClick?: (lead: Lead) => void;
  className?: string;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onEventApplied,
  onLeadClick,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEvent = async (event: Event) => {
    setIsProcessing(true);
    try {
      await onEventApplied(lead.id, event);
    } catch (error) {
      console.error('Failed to apply event:', error);
      alert(`Failed to apply event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    if (onLeadClick && !isProcessing) {
      onLeadClick(lead);
    }
  };

  const formattedUpdatedAt = new Date(lead.timestamps.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`lead-card ${className}`}
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          marginBottom: '12px',
          cursor: onLeadClick ? 'pointer' : 'default',
        }}
        onClick={handleCardClick}
      >
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
            }}
          >
            {lead.name}
          </h3>
          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#3B82F6',
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            View Profile →
          </a>
        </div>
        <StageBadge stage={lead.stage} />
      </div>

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {lead.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#F3F4F6',
                color: '#6B7280',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Next Action */}
      {lead.nextAction && (
        <div
          style={{
            marginBottom: '12px',
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FCD34D',
          }}
        >
          <div style={{ fontSize: '11px', color: '#92400E', fontWeight: '600', marginBottom: '2px' }}>
            NEXT ACTION
          </div>
          <div style={{ fontSize: '13px', color: '#78350F' }}>{lead.nextAction.action}</div>
          <div style={{ fontSize: '11px', color: '#92400E', marginTop: '2px' }}>
            Due: {new Date(lead.nextAction.dueAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}

      {/* Latest Note */}
      {lead.notes.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
            LATEST NOTE
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#374151',
              fontStyle: 'italic',
              padding: '6px',
              backgroundColor: '#F9FAFB',
              borderRadius: '4px',
              borderLeft: '3px solid #D1D5DB',
            }}
          >
            {lead.notes[lead.notes.length - 1].content}
          </div>
        </div>
      )}

      {/* Event Buttons */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', marginBottom: '6px' }}>
          ACTIONS
        </div>
        <EventButtons
          stage={lead.stage}
          onEvent={handleEvent}
          disabled={isProcessing}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          fontSize: '11px',
          color: '#9CA3AF',
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        Updated {formattedUpdatedAt}
      </div>
    </div>
  );
};
