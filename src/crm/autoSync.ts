/**
 * Auto-Sync Script for LinkedIn Connections
 *
 * Scrapes recent connections from LinkedIn and automatically updates CRM:
 * - Marks leads from REQUEST_SENT → CONNECTED when connection is accepted
 */

import * as CRM from './index';

export interface RecentConnection {
  name: string;
  profileUrl: string;
  connectedAt?: Date;
}

/**
 * Scrapes recent connections from LinkedIn's "My Network" page
 */
export async function scrapeRecentConnections(): Promise<RecentConnection[]> {
  const connections: RecentConnection[] = [];

  // Check if we're on LinkedIn
  if (!window.location.hostname.includes('linkedin.com')) {
    throw new Error('Must be on LinkedIn to scrape connections');
  }

  // Navigate to connections page if not already there
  const isOnConnectionsPage = window.location.pathname.includes('/mynetwork/') ||
                                window.location.pathname.includes('/search/results/people/');

  if (!isOnConnectionsPage) {
    console.log('Not on connections page. Please navigate to LinkedIn connections.');
    // You could programmatically navigate here if needed
    // window.location.href = 'https://www.linkedin.com/mynetwork/invite-connect/connections/';
    return connections;
  }

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Try multiple selectors as LinkedIn changes their HTML frequently
  const selectors = [
    '.mn-connection-card',
    '.scaffold-finite-scroll__content li',
    '[data-test-component="connections-list-item"]',
    '.reusable-search__result-container',
  ];

  let connectionElements: Element[] = [];
  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));
    if (elements.length > 0) {
      connectionElements = elements;
      break;
    }
  }

  if (connectionElements.length === 0) {
    console.warn('No connection elements found. LinkedIn might have changed their HTML structure.');
    return connections;
  }

  // Parse each connection
  for (const element of connectionElements.slice(0, 50)) { // Limit to 50 most recent
    try {
      // Try to find name and profile URL
      const nameElement = element.querySelector('.mn-connection-card__name, .entity-result__title-text a, a[href*="/in/"]');
      const linkElement = element.querySelector('a[href*="/in/"]') as HTMLAnchorElement;

      if (nameElement && linkElement) {
        const name = nameElement.textContent?.trim() || '';
        const profileUrl = linkElement.href;

        if (name && profileUrl) {
          connections.push({
            name,
            profileUrl,
            connectedAt: new Date(), // LinkedIn doesn't always show exact date
          });
        }
      }
    } catch (error) {
      console.warn('Failed to parse connection element:', error);
    }
  }

  return connections;
}

/**
 * Syncs recent connections with CRM, marking REQUEST_SENT leads as CONNECTED
 */
export async function syncRecentConnectionsToCRM(): Promise<{
  checked: number;
  updated: number;
  newConnections: string[];
  errors: string[];
}> {
  const connections = await scrapeRecentConnections();
  const errors: string[] = [];
  const newConnections: string[] = [];
  let updated = 0;

  console.log(`Found ${connections.length} recent connections on LinkedIn`);

  for (const connection of connections) {
    try {
      // Check if this person exists as a lead in CRM
      const lead = await CRM.getLeadByUrl(connection.profileUrl);

      if (lead) {
        // If lead is in REQUEST_SENT stage, mark as CONNECTED
        if (lead.stage === CRM.Stage.REQUEST_SENT) {
          await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
          await CRM.addNote(lead.id, `Connection accepted (auto-detected on ${new Date().toLocaleDateString()})`);
          newConnections.push(connection.name);
          updated++;
          console.log(`✓ Marked ${connection.name} as CONNECTED`);
        } else if (lead.stage === CRM.Stage.NEW) {
          // If somehow we're connected but lead was still NEW, skip to CONNECTED
          await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
          await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
          await CRM.addNote(lead.id, `Connection detected (auto-synced on ${new Date().toLocaleDateString()})`);
          newConnections.push(connection.name);
          updated++;
          console.log(`✓ Marked ${connection.name} as CONNECTED (from NEW)`);
        }
      } else {
        // Connection exists on LinkedIn but not in CRM - optionally create them
        console.log(`ℹ ${connection.name} is connected but not in CRM (skipping)`);
      }
    } catch (error) {
      errors.push(`Failed to sync ${connection.name}: ${error}`);
      console.error(`Failed to sync ${connection.name}:`, error);
    }
  }

  return {
    checked: connections.length,
    updated,
    newConnections,
    errors,
  };
}

/**
 * Auto-imports all recent connections as leads (optional - use carefully)
 */
export async function importRecentConnectionsAsLeads(): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  const connections = await scrapeRecentConnections();
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (const connection of connections) {
    try {
      // Check if lead already exists
      const existingLead = await CRM.getLeadByUrl(connection.profileUrl);

      if (existingLead) {
        skipped++;
        continue;
      }

      // Create new lead and mark as CONNECTED
      const lead = await CRM.createLead(connection.name, connection.profileUrl);
      await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
      await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
      await CRM.addNote(lead.id, `Imported from LinkedIn connections on ${new Date().toLocaleDateString()}`);
      imported++;
    } catch (error) {
      errors.push(`Failed to import ${connection.name}: ${error}`);
    }
  }

  return { imported, skipped, errors };
}

/**
 * Content script message handler for auto-sync
 */
export function setupAutoSyncListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_RECENT_CONNECTIONS') {
      syncRecentConnectionsToCRM()
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Required for async sendResponse
    }
  });
}
