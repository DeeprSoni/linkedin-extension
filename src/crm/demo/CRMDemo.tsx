/**
 * CRM Demo Component
 *
 * Demonstrates the LinkedIn Lead CRM functionality with a simple UI.
 */

import React, { useState, useEffect } from 'react';
import * as CRM from '../index';
import { LeadCard } from '../components';

export const CRMDemo: React.FC = () => {
  const [leads, setLeads] = useState<CRM.Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Record<CRM.Stage, number> | null>(null);
  const [selectedStage, setSelectedStage] = useState<CRM.Stage | 'ALL'>('ALL');

  // Load leads on mount
  useEffect(() => {
    loadLeads();
    loadStats();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const allLeads = await CRM.listLeads();
      setLeads(allLeads);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CRM.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleEventApplied = async (leadId: string, event: CRM.Event) => {
    try {
      await CRM.applyEvent(leadId, event);
      await loadLeads();
      await loadStats();
    } catch (error) {
      console.error('Failed to apply event:', error);
      throw error;
    }
  };

  const handleCreateSampleLead = async () => {
    try {
      const sampleNames = [
        'Sarah Johnson',
        'Michael Chen',
        'Emily Rodriguez',
        'David Kim',
        'Jessica Williams',
      ];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const profileUrl = `https://linkedin.com/in/${randomName.toLowerCase().replace(' ', '-')}-${Date.now()}`;

      const lead = await CRM.createLead(randomName, profileUrl, {
        company: 'Tech Corp',
        title: 'Software Engineer',
      });

      // Add a sample tag
      await CRM.addTags(lead.id, ['sample', 'demo']);

      await loadLeads();
      await loadStats();
    } catch (error) {
      console.error('Failed to create sample lead:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all leads? This cannot be undone.')) {
      try {
        await CRM.clearAll();
        await loadLeads();
        await loadStats();
      } catch (error) {
        console.error('Failed to clear leads:', error);
      }
    }
  };

  const filteredLeads =
    selectedStage === 'ALL'
      ? leads
      : leads.filter((lead) => lead.stage === selectedStage);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          LinkedIn Lead CRM
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
          State-machine powered lead tracking system
        </p>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <button
          onClick={handleCreateSampleLead}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #3B82F6',
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          + Create Sample Lead
        </button>
        {leads.length > 0 && (
          <button
            onClick={handleClearAll}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid #EF4444',
              backgroundColor: '#FFFFFF',
              color: '#EF4444',
              cursor: 'pointer',
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '12px' }}>
            PIPELINE OVERVIEW
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {Object.entries(stats).map(([stage, count]) => (
              <div
                key={stage}
                onClick={() => setSelectedStage(stage as CRM.Stage)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: selectedStage === stage ? '#3B82F610' : '#FFFFFF',
                  border: selectedStage === stage ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  minWidth: '120px',
                }}
              >
                <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>
                  {stage.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                  {count}
                </div>
              </div>
            ))}
            <div
              onClick={() => setSelectedStage('ALL')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: selectedStage === 'ALL' ? '#3B82F610' : '#FFFFFF',
                border: selectedStage === 'ALL' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '2px' }}>
                ALL LEADS
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                {leads.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Info */}
      {selectedStage !== 'ALL' && (
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
          Showing <strong>{filteredLeads.length}</strong> leads in stage:{' '}
          <strong>{selectedStage.replace(/_/g, ' ')}</strong>
          <button
            onClick={() => setSelectedStage('ALL')}
            style={{
              marginLeft: '8px',
              fontSize: '12px',
              color: '#3B82F6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Show All
          </button>
        </div>
      )}

      {/* Leads Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          Loading leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ fontSize: '16px', color: '#6B7280', marginBottom: '8px' }}>
            No leads found
          </div>
          <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
            {selectedStage === 'ALL'
              ? 'Create a sample lead to get started'
              : `No leads in ${selectedStage.replace(/_/g, ' ')} stage`}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEventApplied={handleEventApplied}
              onLeadClick={(lead) => console.log('Clicked lead:', lead)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
