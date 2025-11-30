import { StorageManager } from '../utils/storage';

document.addEventListener('DOMContentLoaded', async () => {
  // Load and display stats
  await loadStats();

  // Set up button handlers
  document.getElementById('scan-btn')?.addEventListener('click', startScan);
  document.getElementById('view-btn')?.addEventListener('click', openSidePanel);
  document.getElementById('crm-btn')?.addEventListener('click', openCRM);
  document.getElementById('export-btn')?.addEventListener('click', exportToCSV);
});

async function loadStats() {
  const prospects = await StorageManager.getProspects();
  const stats = await StorageManager.getStats();

  const totalCount = prospects.length;
  const newCount = prospects.filter(p => p.status === 'new').length;

  document.getElementById('total-count')!.textContent = totalCount.toString();
  document.getElementById('new-count')!.textContent = newCount.toString();

  if (stats.lastScanDate > 0) {
    const date = new Date(stats.lastScanDate);
    const timeAgo = getTimeAgo(date);
    document.getElementById('last-scan')!.textContent = timeAgo;
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function startScan() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.id) {
    alert('No active tab found');
    return;
  }

  if (!tab.url?.includes('linkedin.com')) {
    alert('Please navigate to LinkedIn first');
    return;
  }

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, { type: 'START_SCAN' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Please refresh the LinkedIn page and try again');
    } else {
      window.close();
    }
  });
}

async function openSidePanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id) {
    // Clear any tab preference
    await chrome.storage.local.remove('sidepanel_active_tab');
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
}

async function openCRM() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id) {
    // Set preference to open CRM tab
    await chrome.storage.local.set({ sidepanel_active_tab: 'crm' });
    await chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
}

async function exportToCSV() {
  const csv = await StorageManager.exportToCSV();

  // Create download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin-prospects-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  // Show feedback
  const btn = document.getElementById('export-btn') as HTMLButtonElement;
  const originalText = btn.textContent;
  btn.textContent = 'Exported!';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}
