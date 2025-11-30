/**
 * Connection Sync Content Script
 *
 * This script runs on LinkedIn pages and can be triggered to sync recent connections
 */

import { scrapeRecentConnections, syncRecentConnectionsToCRM } from '../crm/autoSync';

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_CONNECTIONS') {
    handleSyncConnections()
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async sendResponse
  }

  if (message.type === 'SCRAPE_CONNECTIONS') {
    handleScrapeConnections()
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleSyncConnections() {
  console.log('[LinkedIn CRM] Starting connection sync...');

  try {
    const result = await syncRecentConnectionsToCRM();
    console.log('[LinkedIn CRM] Sync complete:', result);
    return result;
  } catch (error) {
    console.error('[LinkedIn CRM] Sync failed:', error);
    throw error;
  }
}

async function handleScrapeConnections() {
  console.log('[LinkedIn CRM] Scraping connections...');

  try {
    const connections = await scrapeRecentConnections();
    console.log('[LinkedIn CRM] Found connections:', connections.length);
    return { connections };
  } catch (error) {
    console.error('[LinkedIn CRM] Scrape failed:', error);
    throw error;
  }
}

// Auto-detect when on connections page
function detectConnectionsPage() {
  const isConnectionsPage =
    window.location.pathname.includes('/mynetwork/') ||
    window.location.pathname.includes('/search/results/people/');

  if (isConnectionsPage) {
    console.log('[LinkedIn CRM] Detected connections page');
  }

  return isConnectionsPage;
}

// Initialize
detectConnectionsPage();
