/**
 * CRM View Component
 *
 * Full CRM interface for the sidepanel
 */

import React, { useState, useEffect } from 'react';
import * as CRM from '../crm';
import { LeadCard } from '../crm/components';
import { syncAllProspectsToCRM } from '../crm/sync';

export const CRMView: React.FC = () => {
  const [leads, setLeads] = useState<CRM.Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Record<CRM.Stage, number> | null>(null);
  const [selectedStage, setSelectedStage] = useState<CRM.Stage | 'ALL'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadLeads();
    loadStats();
  }, []);

  // Check for first-time sync after leads are loaded
  useEffect(() => {
    const checkFirstTimeSync = async () => {
      if (!isLoading && leads.length === 0) {
        // Check if we have prospects to sync
        const { StorageManager } = await import('../utils/storage');
        const prospects = await StorageManager.getProspects();

        if (prospects.length > 0) {
          console.log(`Found ${prospects.length} prospects to sync to CRM`);

          // Auto-sync on first load
          const autoSync = confirm(
            `Found ${prospects.length} prospects!\n\n` +
            `Would you like to import them into the CRM now?\n\n` +
            `(You can also click "Sync from Prospects" button anytime)`
          );

          if (autoSync) {
            // Sync inline to avoid function reference issues
            setIsSyncing(true);
            try {
              const result = await syncAllProspectsToCRM();
              alert(`✓ Successfully imported ${result.synced} prospects to CRM!`);
              await loadLeads();
              await loadStats();
            } catch (error) {
              console.error('Failed to sync:', error);
              alert(`Failed to sync: ${error}`);
            } finally {
              setIsSyncing(false);
            }
          }
        }
      }
    };

    checkFirstTimeSync();
  }, [isLoading, leads.length]);

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

  const handleSyncFromProspects = async (skipConfirm = false) => {
    if (!skipConfirm && !confirm('This will sync all prospects to the CRM. Continue?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAllProspectsToCRM();
      const message = `✓ Successfully imported ${result.synced} prospects to CRM!${result.errors.length > 0 ? `\n\nErrors: ${result.errors.length}` : ''}`;
      alert(message);
      await loadLeads();
      await loadStats();
      return result;
    } catch (error) {
      console.error('Failed to sync:', error);
      alert(`Failed to sync: ${error}`);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFixConnectedToRequestSent = async () => {
    const confirm = window.confirm(
      'Fix incorrectly marked leads?\n\n' +
      'This will move leads from CONNECTED to REQUEST_SENT if:\n' +
      '• They have no notes or next actions\n' +
      '• They were recently added (within 7 days)\n\n' +
      'Use this if you accidentally marked people as "connected" ' +
      'when you only sent them a request.\n\n' +
      'Continue?'
    );

    if (!confirm) return;

    setIsSyncing(true);
    try {
      // Get all connected leads
      const connectedLeads = await CRM.listLeads({ stage: CRM.Stage.CONNECTED });

      let fixed = 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const lead of connectedLeads) {
        // Only fix if:
        // 1. No notes (or only auto-generated notes)
        // 2. No next action
        // 3. Recently created (within 7 days)
        const hasUserNotes = lead.notes.some(note =>
          !note.content.includes('auto-detected') &&
          !note.content.includes('auto-synced')
        );
        const createdDate = new Date(lead.timestamps.createdAt);
        const isRecent = createdDate >= sevenDaysAgo;

        if (!hasUserNotes && !lead.nextAction && isRecent) {
          // Move back to REQUEST_SENT by creating a new lead in that stage
          try {
            // We can't go backwards in the state machine, so we need to update directly
            const updatedLead: CRM.Lead = {
              ...lead,
              stage: CRM.Stage.REQUEST_SENT,
              timestamps: {
                ...lead.timestamps,
                updatedAt: new Date().toISOString(),
                stageChangedAt: new Date().toISOString(),
              },
            };

            // Use internal storage to force update
            const { saveLead } = await import('../crm/storage');
            await saveLead(updatedLead);
            fixed++;
          } catch (error) {
            console.error('Failed to fix lead:', lead.name, error);
          }
        }
      }

      alert(`✓ Fixed ${fixed} leads!\n\nMoved them from CONNECTED to REQUEST_SENT.`);
      await loadLeads();
      await loadStats();
    } catch (error) {
      console.error('Failed to fix leads:', error);
      alert(`Failed to fix leads: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDiagnoseLinkedIn = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url?.includes('linkedin.com')) {
        alert('Please navigate to LinkedIn first');
        return;
      }

      if (!tab.id) return;

      // Inject diagnostic script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const report: string[] = [];

          report.push('=== PAGE INFO ===');
          report.push(`URL: ${window.location.href}`);
          report.push(`Title: ${document.title}`);
          report.push('');

          report.push('=== ALL CLASSES ON PAGE (sample) ===');
          const allElements = document.querySelectorAll('[class]');
          const classSet = new Set<string>();
          Array.from(allElements).slice(0, 200).forEach(el => {
            // className can be a string or SVGAnimatedString object
            const className = typeof el.className === 'string'
              ? el.className
              : (el.className as any)?.baseVal || '';

            if (className) {
              className.split(' ').forEach((c: string) => {
                if (c && c.length > 0) classSet.add(c);
              });
            }
          });
          Array.from(classSet).sort().slice(0, 50).forEach(c => {
            report.push(`  .${c}`);
          });
          report.push('');

          report.push('=== PROFILE LINKS (/in/) ===');
          const inLinks = document.querySelectorAll('a[href*="/in/"]');
          report.push(`Found ${inLinks.length} total /in/ links`);

          if (inLinks.length > 0) {
            report.push('');
            report.push('First 5 examples:');
            Array.from(inLinks).slice(0, 5).forEach((link, i) => {
              const el = link as HTMLElement;
              report.push(`\nLink ${i + 1}:`);
              report.push(`  href: ${(link as HTMLAnchorElement).href}`);
              report.push(`  text: ${el.textContent?.trim().substring(0, 50)}`);

              const linkClassName = typeof el.className === 'string'
                ? el.className
                : (el.className as any)?.baseVal || 'none';
              report.push(`  classes: ${linkClassName}`);

              // Find parent
              const parent = el.closest('li, div[class*="card"], div[class*="result"], article');
              if (parent) {
                report.push(`  parent tag: ${parent.tagName}`);
                const parentClassName = typeof parent.className === 'string'
                  ? parent.className
                  : (parent.className as any)?.baseVal || 'none';
                report.push(`  parent classes: ${parentClassName.split(' ').slice(0, 5).join(' ')}`);
              }
            });
          }

          report.push('');
          report.push('=== LIST ITEMS (li tags) ===');
          const lis = document.querySelectorAll('li');
          report.push(`Found ${lis.length} li elements`);

          const lisWithLinks = Array.from(lis).filter(li => li.querySelector('a[href*="/in/"]'));
          report.push(`Found ${lisWithLinks.length} li elements containing /in/ links`);

          if (lisWithLinks.length > 0) {
            const firstLi = lisWithLinks[0];
            report.push('');
            report.push('First li with /in/ link:');
            const liClassName = typeof firstLi.className === 'string'
              ? firstLi.className
              : (firstLi.className as any)?.baseVal || 'none';
            report.push(`  classes: ${liClassName}`);
            report.push(`  data attributes: ${Array.from(firstLi.attributes).filter(a => a.name.startsWith('data-')).map(a => a.name).join(', ')}`);
          }

          return report.join('\n');
        }
      });

      if (results && results[0] && results[0].result) {
        const report = results[0].result;
        console.log('🔍 LINKEDIN PAGE DIAGNOSTIC:\n', report);

        // Show in alert (truncated)
        const lines = report.split('\n');
        const shortReport = lines.slice(0, 40).join('\n');
        alert(
          'Diagnostic complete!\n\n' +
          'Full report is in console (press F12)\n\n' +
          'First few lines:\n' +
          shortReport +
          '\n\n... (see console for full report)'
        );
      }
    } catch (error) {
      console.error('Diagnostic failed:', error);
      alert(`Diagnostic failed: ${error}`);
    }
  };

  const handleAutoSyncConnections = async () => {
    setIsSyncing(true);
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url?.includes('linkedin.com')) {
        alert('Please navigate to LinkedIn connections page first:\n\nhttps://www.linkedin.com/mynetwork/invite-connect/connections/');
        setIsSyncing(false);
        return;
      }

      if (!tab.id) {
        throw new Error('No tab ID');
      }

      // Inject scraper script directly into the page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          // Wait for page to settle
          await new Promise(resolve => setTimeout(resolve, 1500));

          const connections: Array<{ name: string; profileUrl: string }> = [];
          const debug: string[] = [];

          // Strategy 1: Try specific LinkedIn connection selectors
          const specificSelectors = [
            '.mn-connection-card',
            '.scaffold-finite-scroll__content li',
            '[data-test-component="connections-list-item"]',
            '.reusable-search__result-container',
            'li.reusable-search__result-container',
            'div[data-view-name="search-entity-result-universal-template"]',
          ];

          let foundElements: Element[] = [];
          for (const selector of specificSelectors) {
            const elements = Array.from(document.querySelectorAll(selector));
            debug.push(`Tried selector "${selector}": found ${elements.length} elements`);
            if (elements.length > 0) {
              foundElements = elements;
              debug.push(`✓ Using selector: ${selector}`);
              break;
            }
          }

          // Strategy 2: If no specific containers found, find ALL links with /in/ (fallback)
          if (foundElements.length === 0) {
            debug.push('⚠ No specific containers found, trying fallback: all /in/ links');
            const allLinks = Array.from(document.querySelectorAll('a[href*="/in/"]'));
            debug.push(`Found ${allLinks.length} total /in/ links on page`);

            // Group links by their profile URL (deduplicate)
            const profileMap = new Map<string, HTMLAnchorElement>();
            for (const link of allLinks) {
              const href = (link as HTMLAnchorElement).href;
              if (href.includes('/in/') && !href.includes('/search/') && !href.includes('/company/')) {
                // Normalize URL
                try {
                  const urlObj = new URL(href);
                  const path = urlObj.pathname.replace(/\/$/, '').split('?')[0];
                  const normalizedUrl = `${urlObj.protocol}//${urlObj.host}${path}`;

                  if (path.match(/^\/in\/[^\/]+$/)) { // Only /in/username format
                    if (!profileMap.has(normalizedUrl)) {
                      profileMap.set(normalizedUrl, link as HTMLAnchorElement);
                    }
                  }
                } catch (e) {
                  // Skip invalid URLs
                }
              }
            }

            debug.push(`After deduplication: ${profileMap.size} unique profiles`);

            // Get names and URLs from the map
            for (const [profileUrl, linkElement] of profileMap) {
              // Try to find the name - look near the link
              let name = linkElement.textContent?.trim() || '';

              // If link text is empty, try to find name in parent elements
              if (!name || name.length < 2) {
                const parent = linkElement.closest('li, div[class*="entity"], div[class*="connection"]');
                if (parent) {
                  // Look for name elements
                  const nameSelectors = [
                    '.entity-result__title-text',
                    '.mn-connection-card__name',
                    'span[aria-hidden="true"]',
                    '.artdeco-entity-lockup__title',
                  ];

                  for (const sel of nameSelectors) {
                    const nameEl = parent.querySelector(sel);
                    if (nameEl && nameEl.textContent && nameEl.textContent.trim().length > 1) {
                      name = nameEl.textContent.trim();
                      break;
                    }
                  }
                }
              }

              // Extract just first and last name if we got too much text
              if (name && name.length > 2) {
                // Remove line breaks, extra spaces
                name = name.replace(/\s+/g, ' ').trim();
                // If too long, just take first line
                if (name.includes('\n')) {
                  name = name.split('\n')[0].trim();
                }

                connections.push({ name, profileUrl });
              }
            }

            debug.push(`Final connections extracted: ${connections.length}`);
          } else {
            // Strategy 1 succeeded - parse the specific containers
            for (const element of foundElements.slice(0, 100)) {
              try {
                // Try to find name
                const nameSelectors = [
                  '.entity-result__title-text a',
                  '.mn-connection-card__name',
                  'span.entity-result__title-text span[aria-hidden="true"]',
                  '.artdeco-entity-lockup__title',
                  'a[href*="/in/"]',
                ];

                let nameElement: Element | null = null;
                for (const sel of nameSelectors) {
                  nameElement = element.querySelector(sel);
                  if (nameElement && nameElement.textContent?.trim()) {
                    break;
                  }
                }

                // Find profile link
                const linkElement = element.querySelector('a[href*="/in/"]') as HTMLAnchorElement;

                if (linkElement) {
                  const name = nameElement?.textContent?.trim() || linkElement.textContent?.trim() || 'Unknown';
                  let profileUrl = linkElement.href;

                  // Normalize URL
                  try {
                    const urlObj = new URL(profileUrl);
                    const path = urlObj.pathname.replace(/\/$/, '').split('?')[0];
                    profileUrl = `${urlObj.protocol}//${urlObj.host}${path}`;
                  } catch (e) {
                    profileUrl = profileUrl.trim();
                  }

                  if (name && name.length > 1 && profileUrl) {
                    connections.push({ name, profileUrl });
                  }
                }
              } catch (error) {
                // Skip this element
              }
            }
          }

          // Return results with debug info
          return { connections, debug };
        }
      });

      if (!results || !results[0] || !results[0].result) {
        throw new Error('Failed to scrape connections from page');
      }

      const { connections, debug } = results[0].result as {
        connections: Array<{ name: string; profileUrl: string }>;
        debug: string[];
      };

      // Log debug info
      console.log('🔍 LinkedIn Scraper Debug Info:');
      debug.forEach(msg => console.log(msg));

      if (connections.length === 0) {
        alert(
          'No connections found on this page.\n\n' +
          'Debug info:\n' +
          debug.join('\n') + '\n\n' +
          'Make sure you are on:\n' +
          'https://www.linkedin.com/mynetwork/invite-connect/connections/\n\n' +
          'If you ARE on the connections page, try:\n' +
          '1. Scroll down to load more connections\n' +
          '2. Refresh the page\n' +
          '3. Check browser console (F12) for more details'
        );
        setIsSyncing(false);
        return;
      }

      // Now sync with CRM (all in sidepanel context - no imports needed in content script!)
      const errors: string[] = [];
      const newConnections: string[] = [];
      let updated = 0;

      for (const connection of connections) {
        try {
          const lead = await CRM.getLeadByUrl(connection.profileUrl);

          if (lead) {
            // If lead is in REQUEST_SENT stage, mark as CONNECTED
            if (lead.stage === CRM.Stage.REQUEST_SENT) {
              await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
              await CRM.addNote(lead.id, `Connection accepted (auto-detected on ${new Date().toLocaleDateString()})`);
              newConnections.push(connection.name);
              updated++;
            } else if (lead.stage === CRM.Stage.NEW) {
              // If somehow we're connected but lead was still NEW, skip to CONNECTED
              await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
              await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
              await CRM.addNote(lead.id, `Connection detected (auto-synced on ${new Date().toLocaleDateString()})`);
              newConnections.push(connection.name);
              updated++;
            }
          }
        } catch (error) {
          errors.push(`Failed to sync ${connection.name}: ${error}`);
        }
      }

      // Show results
      console.log('✅ Auto-Detect Results:', { checked: connections.length, updated, newConnections, errors });

      alert(
        `✓ Auto-Detect Complete!\n\n` +
        `Checked: ${connections.length} connections\n` +
        `Updated: ${updated} leads to CONNECTED\n\n` +
        (newConnections.length > 0
          ? `Newly connected:\n• ${newConnections.join('\n• ')}`
          : 'No new connections detected') +
        (errors.length > 0 ? `\n\nErrors: ${errors.length}` : '') +
        '\n\n(See console for details - press F12)'
      );

      await loadLeads();
      await loadStats();
    } catch (error) {
      console.error('Auto-detect failed:', error);
      alert(
        `Auto-detect failed: ${error}\n\n` +
        `Make sure you're on the LinkedIn connections page:\n` +
        `https://www.linkedin.com/mynetwork/invite-connect/connections/\n\n` +
        `Then try again.`
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredLeads =
    selectedStage === 'ALL'
      ? leads
      : leads.filter((lead) => lead.stage === selectedStage);

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>
          CRM Pipeline
        </h2>
        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
          State-machine powered lead tracking
        </p>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <button
            onClick={() => handleSyncFromProspects()}
            disabled={isSyncing}
            title="Import all prospects from the Prospects tab into CRM"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              border: '1px solid #3B82F6',
              backgroundColor: '#3B82F6',
              color: '#FFFFFF',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            {isSyncing ? 'Syncing...' : '📥 Import from Prospects'}
          </button>
          <button
            onClick={handleAutoSyncConnections}
            disabled={isSyncing}
            title="Detect who accepted your connection requests on LinkedIn"
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              border: '1px solid #10B981',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.6 : 1,
            }}
          >
            {isSyncing ? 'Syncing...' : '🔄 Auto-Detect Connections'}
          </button>
          {stats && stats[CRM.Stage.CONNECTED] > 0 && (
            <button
              onClick={handleFixConnectedToRequestSent}
              disabled={isSyncing}
              title="Fix leads incorrectly marked as CONNECTED (should be REQUEST_SENT)"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid #F59E0B',
                backgroundColor: '#FFFFFF',
                color: '#F59E0B',
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                opacity: isSyncing ? 0.6 : 1,
              }}
            >
              {isSyncing ? 'Fixing...' : '🔧 Fix Wrong Status'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={handleDiagnoseLinkedIn}
            title="Inspect LinkedIn page to find correct selectors"
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              border: '1px solid #666',
              backgroundColor: '#FFFFFF',
              color: '#666',
              cursor: 'pointer',
            }}
          >
            🔍 Diagnose LinkedIn Page
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
          💡 First time? Click "Import from Prospects" to populate the CRM
        </div>
      </div>

      {/* Pipeline Stats */}
      {stats && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#F9FAFB',
            borderRadius: '6px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>
            PIPELINE
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Object.entries(stats).map(([stage, count]) => (
              <div
                key={stage}
                onClick={() => setSelectedStage(stage as CRM.Stage)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  backgroundColor: selectedStage === stage ? '#3B82F610' : '#FFFFFF',
                  border: selectedStage === stage ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  cursor: 'pointer',
                  fontSize: '11px',
                  minWidth: '70px',
                }}
              >
                <div style={{ color: '#6B7280', marginBottom: '2px' }}>
                  {stage.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                  {count}
                </div>
              </div>
            ))}
            <div
              onClick={() => setSelectedStage('ALL')}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                backgroundColor: selectedStage === 'ALL' ? '#3B82F610' : '#FFFFFF',
                border: selectedStage === 'ALL' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                cursor: 'pointer',
                fontSize: '11px',
                minWidth: '70px',
              }}
            >
              <div style={{ color: '#6B7280', marginBottom: '2px' }}>ALL</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                {leads.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads List */}
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
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
            {selectedStage === 'ALL' ? 'No leads yet' : `No leads in ${selectedStage.replace(/_/g, ' ')} stage`}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
            Click "Sync from Prospects" to import your existing prospects
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onEventApplied={handleEventApplied}
            />
          ))}
        </div>
      )}
    </div>
  );
};
