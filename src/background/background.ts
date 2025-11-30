import { StorageManager } from '../utils/storage';
import { LinkedInProspect } from '../types';

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_PROSPECTS') {
    handleSaveProspects(message.prospects);
    sendResponse({ success: true });
  } else if (message.type === 'UPDATE_PROSPECT') {
    handleUpdateProspect(message.id, message.updates);
    sendResponse({ success: true });
  } else if (message.type === 'SCAN_START') {
    console.log('Scan started');
    // Could add analytics or notifications here
  } else if (message.type === 'SCAN_COMPLETE') {
    console.log('Scan completed');
    // Show notification or update badge
    chrome.action.setBadgeText({ text: 'Done' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  }
  return true;
});

async function handleSaveProspects(prospects: LinkedInProspect[]) {
  try {
    await StorageManager.addProspects(prospects);
    console.log(`Saved ${prospects.length} prospects`);

    // Update extension badge with count
    const allProspects = await StorageManager.getProspects();
    const newCount = allProspects.filter(p => p.status === 'new').length;
    if (newCount > 0) {
      chrome.action.setBadgeText({ text: newCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#0a66c2' });
    }
  } catch (error) {
    console.error('Error saving prospects:', error);
  }
}

async function handleUpdateProspect(id: string, updates: Partial<LinkedInProspect>) {
  try {
    await StorageManager.updateProspect(id, updates);
    console.log(`Updated prospect ${id}:`, updates);
  } catch (error) {
    console.error('Error updating prospect:', error);
  }
}

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Connection Scanner installed');
});
