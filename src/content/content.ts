import { LinkedInProspect } from '../types';
import { messageTracker } from './messageTracker';

class LinkedInScanner {
  private isScanning = false;
  private scannedProfiles = new Set<string>();

  constructor() {
    this.init();
  }

  private init() {
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'START_SCAN') {
        this.startScan();
        sendResponse({ success: true });
      } else if (message.type === 'STOP_SCAN') {
        this.stopScan();
        sendResponse({ success: true });
      }
      return true;
    });

    // Add scan button to LinkedIn UI
    this.injectScanButton();
  }

  private injectScanButton() {
    // Wait for page to load
    setTimeout(() => {
      const targetElement = document.querySelector('.scaffold-layout__main');
      if (targetElement && !document.getElementById('linkedin-scanner-btn')) {
        const button = document.createElement('button');
        button.id = 'linkedin-scanner-btn';
        button.textContent = 'Scan 2nd Connections';
        button.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          background: #0a66c2;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 24px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px;
        `;

        button.addEventListener('click', () => {
          if (!this.isScanning) {
            this.startScan();
          } else {
            this.stopScan();
          }
        });

        document.body.appendChild(button);
      }
    }, 2000);
  }

  private async startScan() {
    this.isScanning = true;

    // Notify background script
    chrome.runtime.sendMessage({ type: 'SCAN_START' });

    // Ask user how many prospects they want to scan
    const targetCount = await this.promptForTargetCount();
    if (targetCount === null) {
      this.stopScan();
      return;
    }

    this.updateButtonState(`Scanning 0/${targetCount}...`, '#666');

    // Determine which page we're on and scan accordingly
    const url = window.location.href;

    if (url.includes('/search/results/people/')) {
      await this.scanSearchResultsWithPagination(targetCount);
    } else if (url.includes('/mynetwork/')) {
      await this.scanMyNetwork();
    } else {
      alert('Please navigate to LinkedIn Search (People) or My Network page to scan 2nd degree connections.');
      this.stopScan();
      return;
    }

    this.stopScan();
  }

  private async promptForTargetCount(): Promise<number | null> {
    const dialog = document.createElement('div');
    dialog.id = 'linkedin-scanner-dialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      min-width: 400px;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    dialog.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #000;">How many prospects to scan?</h2>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
        LinkedIn shows ~10 prospects per page. The scanner will automatically navigate through pages.
      </p>
      <div style="margin-bottom: 20px;">
        <input
          type="number"
          id="target-count-input"
          min="10"
          max="1000"
          value="50"
          style="
            width: 100%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 6px;
            box-sizing: border-box;
          "
          placeholder="Enter number (10-1000)"
        />
      </div>
      <div style="display: flex; gap: 10px;">
        <button
          id="scan-confirm-btn"
          style="
            flex: 1;
            background: #0a66c2;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Start Scan
        </button>
        <button
          id="scan-cancel-btn"
          style="
            flex: 1;
            background: #fff;
            color: #666;
            border: 2px solid #ddd;
            padding: 12px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Cancel
        </button>
      </div>
    `;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);

    return new Promise((resolve) => {
      const input = document.getElementById('target-count-input') as HTMLInputElement;
      const confirmBtn = document.getElementById('scan-confirm-btn');
      const cancelBtn = document.getElementById('scan-cancel-btn');

      const cleanup = () => {
        backdrop.remove();
        dialog.remove();
      };

      confirmBtn?.addEventListener('click', () => {
        const value = parseInt(input.value);
        if (value >= 10 && value <= 1000) {
          cleanup();
          resolve(value);
        } else {
          alert('Please enter a number between 10 and 1000');
        }
      });

      cancelBtn?.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      backdrop.addEventListener('click', () => {
        cleanup();
        resolve(null);
      });

      // Allow Enter key to confirm
      input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          confirmBtn?.click();
        }
      });

      input?.focus();
      input?.select();
    });
  }

  private stopScan() {
    this.isScanning = false;
    this.updateButtonState('Scan 2nd Connections', '#0a66c2');
    chrome.runtime.sendMessage({ type: 'SCAN_COMPLETE' });
  }

  private updateButtonState(text: string, color: string) {
    const button = document.getElementById('linkedin-scanner-btn');
    if (button) {
      button.textContent = text;
      button.style.background = color;
    }
  }

  private async scanSearchResultsWithPagination(targetCount: number) {
    console.log(`=== Starting Multi-Page Scan (Target: ${targetCount} prospects) ===`);

    let totalProspects: LinkedInProspect[] = [];
    let currentPage = 1;
    const maxPages = Math.ceil(targetCount / 10) + 2; // Add buffer for filtered results

    while (totalProspects.length < targetCount && currentPage <= maxPages) {
      console.log(`\n--- Page ${currentPage} (${totalProspects.length}/${targetCount} prospects collected) ---`);

      // Update button with progress
      this.updateButtonState(`Scanning ${totalProspects.length}/${targetCount}...`, '#666');

      // Scan current page
      const pageProspects = await this.scanCurrentPage();

      // Add new prospects to total
      const newProspects = pageProspects.filter(p =>
        !totalProspects.some(existing => existing.id === p.id)
      );

      totalProspects.push(...newProspects);
      console.log(`✓ Added ${newProspects.length} new prospects (Total: ${totalProspects.length}/${targetCount})`);

      // Save incrementally
      if (newProspects.length > 0) {
        chrome.runtime.sendMessage({
          type: 'SAVE_PROSPECTS',
          prospects: newProspects
        });
      }

      // Check if we've reached target
      if (totalProspects.length >= targetCount) {
        console.log(`🎉 Target reached! Collected ${totalProspects.length} prospects`);
        this.showNotification(`✓ Successfully scanned ${totalProspects.length} prospects!`);
        break;
      }

      // Check if there's a next page
      const hasNextPage = await this.goToNextPage();
      if (!hasNextPage) {
        console.log('No more pages available');
        this.showNotification(`Reached end of results. Collected ${totalProspects.length} prospects.`);
        break;
      }

      currentPage++;

      // Wait for page to load
      await this.sleep(3000);
    }

    console.log(`=== Scan Complete: ${totalProspects.length} prospects collected ===`);
  }

  private async goToNextPage(): Promise<boolean> {
    console.log('Looking for next page button...');

    // Strategy 1: Look for explicit "Next" buttons
    const nextButtonSelectors = [
      'button[aria-label="Next"]',
      'button[aria-label="View next page"]',
      '.artdeco-pagination__button--next',
      'button.artdeco-pagination__button--next',
      '[data-test-pagination-page-btn="next"]',
      'button[type="button"][aria-label*="ext"]' // Catches "Next" with any case
    ];

    for (const selector of nextButtonSelectors) {
      const buttons = document.querySelectorAll(selector);
      console.log(`Selector "${selector}": found ${buttons.length} buttons`);

      for (const btn of Array.from(buttons)) {
        const button = btn as HTMLButtonElement;
        if (!button.disabled && button.offsetParent !== null) { // Check if visible
          console.log(`✓ Found working next button with selector: ${selector}`);
          button.click();
          return true;
        }
      }
    }

    // Strategy 2: Find pagination container and look for clickable elements
    console.log('Strategy 1 failed, trying Strategy 2: Find pagination by structure');

    const paginationContainers = document.querySelectorAll('[class*="pagination"], [class*="artdeco-pagination"]');
    console.log(`Found ${paginationContainers.length} pagination containers`);

    for (const container of Array.from(paginationContainers)) {
      // Look for all buttons in pagination
      const buttons = container.querySelectorAll('button');
      console.log(`Container has ${buttons.length} buttons`);

      for (const button of Array.from(buttons)) {
        const text = button.textContent?.trim().toLowerCase() || '';
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

        // Check if this is a "next" button by text content or aria-label
        if ((text.includes('next') || ariaLabel.includes('next')) &&
            !button.disabled &&
            button.offsetParent !== null) {
          console.log(`✓ Found next button by text/aria: "${text || ariaLabel}"`);
          button.click();
          return true;
        }
      }
    }

    // Strategy 3: Look for numbered page buttons and click the one after current
    console.log('Strategy 2 failed, trying Strategy 3: Find next page number');

    const allButtons = Array.from(document.querySelectorAll('button'));

    // Find current page button (likely has aria-current="true" or is selected)
    let currentPageNum = 1;
    for (const button of allButtons) {
      if (button.getAttribute('aria-current') === 'true' ||
          button.classList.contains('selected') ||
          button.classList.contains('active')) {
        const pageText = button.textContent?.trim();
        const pageNum = parseInt(pageText || '');
        if (!isNaN(pageNum)) {
          currentPageNum = pageNum;
          console.log(`Current page is: ${currentPageNum}`);
          break;
        }
      }
    }

    // Find button for next page number
    const nextPageNum = currentPageNum + 1;
    for (const button of allButtons) {
      const buttonText = button.textContent?.trim();
      if (buttonText === String(nextPageNum) &&
          !button.disabled &&
          button.offsetParent !== null) {
        console.log(`✓ Found next page button by number: ${nextPageNum}`);
        button.click();
        return true;
      }
    }

    // Strategy 4: Look for any clickable element with pagination-related attributes
    console.log('Strategy 3 failed, trying Strategy 4: Any pagination links');

    const allLinks = Array.from(document.querySelectorAll('a, button'));
    for (const element of allLinks) {
      const href = (element as HTMLAnchorElement).href || '';
      const onclick = element.getAttribute('onclick') || '';

      // Check if URL or onclick contains page increment indicators
      if ((href.includes('page=') || onclick.includes('page')) &&
          !element.classList.contains('disabled') &&
          (element as HTMLElement).offsetParent !== null) {

        // Try to determine if this is a "next" link
        const text = element.textContent?.trim().toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';

        if (text.includes('next') || ariaLabel.includes('next') ||
            href.includes(`page=${currentPageNum + 1}`)) {
          console.log(`✓ Found next page link: ${href || onclick}`);
          (element as HTMLElement).click();
          return true;
        }
      }
    }

    // Strategy 5: URL manipulation as last resort
    console.log('Strategy 4 failed, trying Strategy 5: Direct URL manipulation');

    const currentUrl = new URL(window.location.href);
    const urlParams = currentUrl.searchParams;

    // Check if there's a page parameter
    const currentPage = parseInt(urlParams.get('page') || '1');
    console.log(`Current URL page parameter: ${currentPage}`);

    // Increment page in URL
    urlParams.set('page', String(currentPage + 1));
    const nextUrl = currentUrl.toString();

    // Only navigate if URL actually changed
    if (nextUrl !== window.location.href) {
      console.log(`✓ Navigating to next page via URL: ${nextUrl}`);
      window.location.href = nextUrl;
      return true;
    }

    console.log('❌ All strategies failed - no pagination method worked');
    console.log('Current URL:', window.location.href);
    console.log('Pagination HTML:', document.querySelector('[class*="pagination"]')?.outerHTML.substring(0, 500) || 'No pagination found');

    // Debug: Show all buttons on page
    const allPageButtons = Array.from(document.querySelectorAll('button')).slice(0, 20);
    console.log('Sample buttons on page:', allPageButtons.map(b => ({
      text: b.textContent?.trim().substring(0, 30),
      ariaLabel: b.getAttribute('aria-label'),
      disabled: b.disabled,
      classes: b.className
    })));

    return false;
  }

  private async scanCurrentPage(): Promise<LinkedInProspect[]> {
    console.log('Scanning current page...');

    // Scroll to load more results
    await this.scrollAndWait();

    // LinkedIn now uses obfuscated class names, so we need to find profile cards by structure
    // Look for: 1) Links containing "/in/" 2) Within list items 3) That have name/headline structure

    let profileCards: Element[] = [];
    let usedSelector = '';

    // Strategy 1: Find all list items that contain profile links
    const listItems = document.querySelectorAll('li, div[data-occludable-job-id], div[class*="search-result"]');
    console.log(`Found ${listItems.length} potential list items to scan`);

    for (const item of Array.from(listItems)) {
      const profileLink = item.querySelector('a[href*="/in/"]');
      if (profileLink && profileLink.getAttribute('href')?.includes('/in/')) {
        // Check if this looks like a person card (has text content suggesting it's a profile)
        const textContent = item.textContent || '';
        if (textContent.length > 20) { // Profile cards have substantial text
          profileCards.push(item);
        }
      }
    }

    if (profileCards.length === 0) {
      console.log('Strategy 1 failed, trying Strategy 2: Direct link search');

      // Strategy 2: Find all profile links and get their parent containers
      const allProfileLinks = document.querySelectorAll('a[href*="/in/"]');
      console.log(`Found ${allProfileLinks.length} profile links`);

      const seenContainers = new Set<Element>();
      const seenProfileIds = new Set<string>();

      for (const link of Array.from(allProfileLinks)) {
        const href = (link as HTMLAnchorElement).href;
        const profileId = this.extractProfileId(href);

        // Skip if we've already found a container for this profile
        if (seenProfileIds.has(profileId)) {
          continue;
        }

        // Walk up to find the card container (usually 2-5 levels up)
        let current: Element | null = link.parentElement;
        let depth = 0;

        while (current && depth < 10) {
          // Look for a container that seems like a profile card
          const rect = current.getBoundingClientRect();
          const textLength = current.textContent?.length || 0;
          const hasSubstantialContent = textLength > 80 && textLength < 2000; // More precise range
          const isReasonableSize = rect.height > 80 && rect.height < 600; // Better size filtering

          if (hasSubstantialContent && isReasonableSize && !seenContainers.has(current)) {
            // Check if this container has only one profile link (not a parent of multiple cards)
            const linksInContainer = current.querySelectorAll('a[href*="/in/"]').length;
            if (linksInContainer <= 3) { // Allow up to 3 links (avatar, name, view profile)
              seenContainers.add(current);
              seenProfileIds.add(profileId);
              profileCards.push(current);
              break;
            }
          }

          current = current.parentElement;
          depth++;
        }
      }
    }

    console.log(`✓ Found ${profileCards.length} profile cards using structural analysis`);

    if (profileCards.length === 0) {
      console.error('❌ ERROR: No profile cards found with any strategy');
      console.log('Current URL:', window.location.href);
      console.log('Sample of all links:', Array.from(document.querySelectorAll('a')).slice(0, 10).map(a => a.href));
      this.showNotification('No profile cards found. LinkedIn may have changed their layout.');
      return [];
    }

    const prospects: LinkedInProspect[] = [];
    let extractionErrors = 0;
    let filteredOut = 0;

    for (const card of Array.from(profileCards)) {
      try {
        const prospect = this.extractProspectFromSearchCard(card as HTMLElement);
        if (prospect) {
          if (prospect.id && !this.scannedProfiles.has(prospect.id)) {
            prospects.push(prospect);
            this.scannedProfiles.add(prospect.id);
            console.log(`✓ Extracted: ${prospect.name} (${prospect.headline})`);
          } else {
            filteredOut++;
            console.log(`⊘ Filtered: Already scanned or missing ID`);
          }
        } else {
          filteredOut++;
          console.log(`⊘ Filtered: Not a 2nd degree connection or extraction failed`);
        }
      } catch (error) {
        extractionErrors++;
        console.error('❌ Error extracting prospect:', error);
      }
    }

    console.log(`=== Page Scan Summary ===`);
    console.log(`Total cards found: ${profileCards.length}`);
    console.log(`Successfully extracted: ${prospects.length}`);
    console.log(`Filtered out: ${filteredOut}`);
    console.log(`Extraction errors: ${extractionErrors}`);

    return prospects;
  }

  private async scanMyNetwork() {
    console.log('=== Starting My Network Scan ===');

    // Scroll to load more
    await this.scrollAndWait();

    // Try multiple selectors for network cards
    const selectors = [
      '.discover-entity-type-card',
      '.mn-connection-card',
      '[data-control-name="people_connect"]',
      '.artdeco-list__item',
      '.discover-person-card'
    ];

    let cards: NodeListOf<Element> | null = null;
    let usedSelector = '';

    for (const selector of selectors) {
      const foundCards = document.querySelectorAll(selector);
      if (foundCards.length > 0) {
        cards = foundCards;
        usedSelector = selector;
        console.log(`✓ Found ${foundCards.length} network cards using selector: "${selector}"`);
        break;
      } else {
        console.log(`✗ No cards found with selector: "${selector}"`);
      }
    }

    if (!cards || cards.length === 0) {
      console.error('❌ ERROR: No network cards found with any selector');
      console.log('Current URL:', window.location.href);
      console.log('Page HTML sample:', document.body.innerHTML.substring(0, 500));
      this.showNotification('No network cards found. Please check console for details.');
      return;
    }

    const prospects: LinkedInProspect[] = [];
    let extractionErrors = 0;
    let filteredOut = 0;

    for (const card of Array.from(cards)) {
      try {
        const prospect = this.extractProspectFromNetworkCard(card as HTMLElement);
        if (prospect) {
          if (prospect.id && !this.scannedProfiles.has(prospect.id)) {
            prospects.push(prospect);
            this.scannedProfiles.add(prospect.id);
            console.log(`✓ Extracted: ${prospect.name} (${prospect.headline})`);
          } else {
            filteredOut++;
            console.log(`⊘ Filtered: Already scanned or missing ID`);
          }
        } else {
          filteredOut++;
          console.log(`⊘ Filtered: Extraction failed`);
        }
      } catch (error) {
        extractionErrors++;
        console.error('❌ Error extracting prospect:', error);
      }
    }

    console.log(`=== Scan Summary ===`);
    console.log(`Total cards found: ${cards.length}`);
    console.log(`Successfully extracted: ${prospects.length}`);
    console.log(`Filtered out: ${filteredOut}`);
    console.log(`Extraction errors: ${extractionErrors}`);

    // Send to storage
    if (prospects.length > 0) {
      chrome.runtime.sendMessage({
        type: 'SAVE_PROSPECTS',
        prospects: prospects
      });

      this.showNotification(`Found ${prospects.length} new prospects`);
    } else {
      this.showNotification('No new prospects found. Check console (F12) for details.');
    }
  }

  private extractProspectFromSearchCard(card: HTMLElement): LinkedInProspect | null {
    try {
      // Find the profile link (works with obfuscated classes)
      const linkElement = card.querySelector('a[href*="/in/"]') as HTMLAnchorElement;

      if (!linkElement) {
        console.log('⚠️ No profile link found in card');
        return null;
      }

      const profileUrl = linkElement.href.split('?')[0]; // Remove query params
      const profileId = this.extractProfileId(profileUrl);

      if (!profileId || profileId === profileUrl) {
        console.log('⚠️ Invalid profile ID extracted from:', profileUrl);
        return null;
      }

      // Extract name - look for spans with aria-hidden="true" near the profile link
      // LinkedIn typically uses this pattern for names
      let name = 'Unknown';

      // Try to get name from link or nearby spans
      const linkParent = linkElement.closest('div, li');
      if (linkParent) {
        const nameSpans = linkParent.querySelectorAll('span[aria-hidden="true"]');
        for (const span of Array.from(nameSpans)) {
          const text = span.textContent?.trim() || '';
          // Names are typically 5-50 chars and contain spaces
          if (text.length >= 5 && text.length <= 50 && text.includes(' ')) {
            name = text;
            break;
          }
        }

        // Fallback: try to get text from the link itself
        if (name === 'Unknown') {
          const linkText = linkElement.textContent?.trim();
          if (linkText && linkText.length >= 5 && linkText.length <= 50) {
            name = linkText;
          }
        }
      }

      // Extract all text content and parse it more intelligently
      const cardText = card.textContent || '';

      // LinkedIn often concatenates text without newlines, split on common patterns
      // Example from console: "Jay Chia  • 2ndFounder, EventualSan Francisco Bay Area"
      let cleanText = cardText
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\s*•\s*/g, ' • ') // Normalize bullet points
        .trim();

      console.log(`Card text for ${name}: "${cleanText.substring(0, 200)}"`);

      // Extract headline - text between "2nd" and location/end
      let headline = '';

      // Try pattern: "Name • 2nd<Headline><Location>"
      const headlinePatterns = [
        new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*?2nd\\s*(.+?)(?:San Francisco|New York|London|Los Angeles|Seattle|Austin|Boston|Chicago|United States|United Kingdom|Canada|India|Germany|$)`, 'i'),
        new RegExp(`2nd\\s*(.+?)(?:San Francisco|New York|London|Los Angeles|Seattle|Austin|Boston|Chicago|United States|United Kingdom|Canada|India|Germany|,|$)`, 'i'),
      ];

      for (const pattern of headlinePatterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          headline = match[1].trim();
          // Remove common artifacts
          headline = headline
            .replace(/\s*•\s*$/, '')
            .replace(/^\s*[-:•]\s*/, '')
            .trim();
          if (headline.length > 5 && headline.length < 200) {
            break;
          } else {
            headline = '';
          }
        }
      }

      // Extract location - look for location patterns in the text
      let location = '';
      const locationPatterns = [
        /(?:San Francisco Bay Area|San Francisco|New York|Los Angeles|Seattle|Austin|Boston|Chicago|London|Toronto|Vancouver|Bangalore|Mumbai|Berlin|Paris|Sydney)(?:[,\s]+[A-Za-z\s]+)?/i,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2}|[A-Za-z\s]+)/,
        /(United States|United Kingdom|Canada|India|Germany|France|Australia|Singapore)/i
      ];

      for (const pattern of locationPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          location = match[0].trim();
          break;
        }
      }

      // Extract mutual connections from the clean text
      let mutualConnections = 0;
      const mutualMatch = cleanText.match(/(\d+)\s+mutual\s+connection/i);
      if (mutualMatch) {
        mutualConnections = parseInt(mutualMatch[1]);
      }

      // Look for 2nd degree indicators
      const connectionDegree = cleanText.includes('2nd') ? '2nd' : '';

      // Accept if: explicitly 2nd degree, OR has mutual connections, OR can't determine
      const is2ndDegree =
        connectionDegree === '2nd' ||
        mutualConnections > 0 ||
        connectionDegree === '';

      if (!is2ndDegree) {
        console.log(`⊘ Skipping ${name}: Not 2nd degree`);
        return null;
      }

      console.log(`✓ Extracted: ${name} | ${headline || 'No headline'} | ${location || 'No location'} | ${mutualConnections} mutual`);

      return {
        id: profileId,
        name,
        headline,
        profileUrl,
        location,
        mutualConnections,
        scannedAt: Date.now(),
        status: 'new'
      };
    } catch (error) {
      console.error('❌ Error extracting from search card:', error);
      return null;
    }
  }

  private extractProspectFromNetworkCard(card: HTMLElement): LinkedInProspect | null {
    try {
      // Find the profile link (works with obfuscated classes)
      const linkElement = card.querySelector('a[href*="/in/"]') as HTMLAnchorElement;

      if (!linkElement) {
        console.log('⚠️ No profile link found in network card');
        return null;
      }

      const profileUrl = linkElement.href.split('?')[0];
      const profileId = this.extractProfileId(profileUrl);

      if (!profileId || profileId === profileUrl) {
        console.log('⚠️ Invalid profile ID extracted from:', profileUrl);
        return null;
      }

      // Extract name using structural approach
      let name = 'Unknown';
      const linkParent = linkElement.closest('div, li');
      if (linkParent) {
        const nameSpans = linkParent.querySelectorAll('span[aria-hidden="true"]');
        for (const span of Array.from(nameSpans)) {
          const text = span.textContent?.trim() || '';
          if (text.length >= 5 && text.length <= 50 && text.includes(' ')) {
            name = text;
            break;
          }
        }

        if (name === 'Unknown') {
          const linkText = linkElement.textContent?.trim();
          if (linkText && linkText.length >= 5 && linkText.length <= 50) {
            name = linkText;
          }
        }
      }

      // Extract info from card text content
      const cardText = card.textContent || '';
      const lines = cardText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      // Extract headline
      let headline = '';
      const nameIndex = lines.findIndex(line => line.includes(name));
      if (nameIndex >= 0 && nameIndex < lines.length - 1) {
        for (let i = nameIndex + 1; i < Math.min(nameIndex + 4, lines.length); i++) {
          const line = lines[i];
          if (line.length > 10 && line.length < 200 && !line.includes('mutual connection') && !line.includes('Connect')) {
            headline = line;
            break;
          }
        }
      }

      // Extract mutual connections
      let mutualConnections = 0;
      for (const line of lines) {
        if (line.includes('mutual connection')) {
          const match = line.match(/(\d+)/);
          if (match) {
            mutualConnections = parseInt(match[1]);
            break;
          }
        }
      }

      console.log(`✓ Extracted network prospect: ${name} | ${headline || 'No headline'} | ${mutualConnections} mutual`);

      return {
        id: profileId,
        name,
        headline,
        profileUrl,
        mutualConnections,
        scannedAt: Date.now(),
        status: 'new'
      };
    } catch (error) {
      console.error('❌ Error extracting from network card:', error);
      return null;
    }
  }

  private extractProfileId(url: string): string {
    const match = url.match(/\/in\/([^/]+)/);
    return match ? match[1] : url;
  }

  private async scrollAndWait() {
    console.log('Starting scroll to load more results...');
    const scrollCount = 10; // Increased from 5 to 10 for more content
    let lastHeight = document.body.scrollHeight;
    let unchangedCount = 0;

    for (let i = 0; i < scrollCount; i++) {
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
      console.log(`Scroll ${i + 1}/${scrollCount}`);

      // Wait for content to load
      await this.sleep(2000); // Increased to 2s for better loading

      // Check if new content loaded
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) {
        unchangedCount++;
        console.log(`No new content loaded (${unchangedCount}/3)`);

        // If no new content after 3 attempts, stop scrolling
        if (unchangedCount >= 3) {
          console.log('Reached end of results');
          break;
        }
      } else {
        unchangedCount = 0;
        lastHeight = newHeight;
      }
    }

    window.scrollTo(0, 0); // Scroll back to top
    await this.sleep(1000); // Wait for any final renders
    console.log('Scrolling complete');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private showNotification(message: string) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0a66c2;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize scanner
new LinkedInScanner();

// Message tracker is automatically initialized when imported
// It will monitor LinkedIn messaging and track DMs sent/received in the CRM

// Auto-click Message button feature for bulk messaging
class MessageButtonAutoClicker {
  private maxRetries = 5;
  private retryDelay = 1500; // ms between retries

  constructor() {
    this.init();
  }

  private async init() {
    // Check if we're on a profile page
    if (!window.location.href.includes('/in/')) {
      return;
    }

    // Initial delay to let page start loading
    await this.sleep(1000);

    // Close any popups first (premium prompts, etc.)
    await this.closePopups();

    // Check if auto-click is enabled
    const result = await chrome.storage.local.get('auto_click_message');
    if (!result.auto_click_message) {
      return;
    }

    console.log('Auto-click enabled, waiting for page to fully load...');

    // Wait for page to be more fully loaded
    await this.waitForPageLoad();

    // Close popups again in case they appeared after load
    await this.closePopups();

    // Try to find and click the Message button with retries
    await this.clickMessageButtonWithRetry();
  }

  private async closePopups(): Promise<void> {
    console.log('Checking for popups to close...');

    // Common LinkedIn popup/modal patterns
    const popupSelectors = [
      // Premium upgrade modals
      '[role="dialog"]',
      '.artdeco-modal',
      '[aria-modal="true"]',
      '.msg-overlay-bubble-header__premium-upsell',

      // Specific premium prompts
      '.premium-upsell-modal',
      '[data-test-modal*="premium"]',
      '.contextual-sign-in-modal'
    ];

    let closedAny = false;

    for (const selector of popupSelectors) {
      const popups = document.querySelectorAll(selector);

      for (const popup of Array.from(popups)) {
        // Check if this popup is actually visible
        const rect = popup.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        const style = window.getComputedStyle(popup as HTMLElement);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        // Check if it contains premium/upgrade messaging
        const popupText = popup.textContent?.toLowerCase() || '';
        const isPremiumPopup = popupText.includes('premium') ||
                               popupText.includes('upgrade') ||
                               popupText.includes('try for free') ||
                               popupText.includes('unlock');

        if (!isPremiumPopup) continue;

        console.log('Found premium popup, looking for close button...');

        // Try to find close button
        const closeButton = this.findCloseButton(popup as HTMLElement);

        if (closeButton) {
          console.log('✓ Found close button, clicking...');
          closeButton.click();
          closedAny = true;
          await this.sleep(500); // Wait for popup to close
        } else {
          console.log('⚠️ Popup found but no close button detected');
        }
      }
    }

    if (closedAny) {
      console.log('✓ Closed popup(s), waiting for UI to settle...');
      await this.sleep(800);
    } else {
      console.log('No popups detected');
    }
  }

  private findCloseButton(popup: HTMLElement): HTMLElement | null {
    // Common close button patterns
    const closeSelectors = [
      // Standard close buttons
      'button[aria-label*="Dismiss" i]',
      'button[aria-label*="Close" i]',
      'button[data-test-modal-close-btn]',
      '.artdeco-modal__dismiss',

      // X buttons
      'button[type="button"] svg[data-test-icon="close-small"]',
      'button.artdeco-button--circle svg',

      // Text-based
      'button:has-text("No thanks")',
      'button:has-text("Maybe later")',
      'button:has-text("Not now")'
    ];

    for (const selector of closeSelectors) {
      try {
        const button = popup.querySelector(selector);
        if (button && this.isButtonClickable(button as HTMLElement)) {
          return button as HTMLElement;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: Look for any button with close-related text or aria-label
    const allButtons = popup.querySelectorAll('button');
    for (const button of Array.from(allButtons)) {
      const text = button.textContent?.toLowerCase().trim() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

      if (text === 'no thanks' ||
          text === 'not now' ||
          text === 'maybe later' ||
          text === 'dismiss' ||
          ariaLabel.includes('dismiss') ||
          ariaLabel.includes('close')) {

        if (this.isButtonClickable(button)) {
          return button;
        }
      }

      // Check for X icon button
      const svg = button.querySelector('svg');
      if (svg) {
        const title = svg.getAttribute('aria-label') || svg.querySelector('title')?.textContent || '';
        if (title.toLowerCase().includes('close') || title.toLowerCase().includes('dismiss')) {
          if (this.isButtonClickable(button)) {
            return button;
          }
        }
      }
    }

    return null;
  }

  private async waitForPageLoad(): Promise<void> {
    // Strategy 1: Wait for document readyState
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
      console.log('✓ Page load event fired');
    }

    // Strategy 2: Wait for common LinkedIn profile elements to appear
    const maxWait = 10000; // 10 seconds max
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const profileContent = document.querySelector('.scaffold-layout__main, [data-view-name="profile-view"], .profile-content');
      if (profileContent) {
        console.log('✓ Profile content detected');
        break;
      }
      await this.sleep(500);
    }

    // Additional delay to ensure buttons are rendered
    await this.sleep(2000);
    console.log('✓ Page should be ready now');
  }

  private async clickMessageButtonWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`Auto-click attempt ${attempt}/${this.maxRetries}...`);

      const button = await this.findMessageButton();

      if (button) {
        // Check if button is visible and enabled
        if (!this.isButtonClickable(button)) {
          console.log(`⚠️ Button found but hidden via CSS - checking if it's in a dropdown...`);

          // Try to open the "More" dropdown first
          const moreButtonClicked = await this.clickMoreButton();

          if (moreButtonClicked) {
            console.log('✓ Clicked "More" button, waiting for dropdown...');
            await this.sleep(800); // Wait for dropdown animation

            // Try to find the button again now that dropdown is open
            const buttonAfterDropdown = await this.findMessageButton();
            if (buttonAfterDropdown && this.isButtonClickable(buttonAfterDropdown)) {
              await this.clickButton(buttonAfterDropdown);
              return; // Success!
            }
          }

          // Still not clickable, wait and retry
          console.log(`⚠️ Button still not clickable, waiting...`);
          await this.sleep(this.retryDelay);
          continue;
        }

        // Button found and clickable - click it!
        await this.clickButton(button);
        return; // Success!
      }

      // Button not found, wait and retry
      if (attempt < this.maxRetries) {
        console.log(`⚠️ Message button not found, waiting ${this.retryDelay}ms before retry...`);
        await this.sleep(this.retryDelay);
      }
    }

    // All retries exhausted
    console.log('❌ Could not find or click Message button after all retries');
    this.showNotification('⚠️ Could not auto-click Message button. Click it manually.', '#f5a623');
  }

  private async clickButton(button: HTMLElement): Promise<void> {
    await this.sleep(300); // Small delay before click
    console.log('✓ Clicking Message button...');

    try {
      // Scroll button into view first
      button.scrollIntoView({ behavior: 'instant', block: 'center' });
      await this.sleep(200);

      // Try multiple click methods
      button.click();

      // Fallback: dispatch click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      button.dispatchEvent(clickEvent);

      console.log('✓ Message button clicked successfully!');
      this.showNotification('✓ Message button clicked! Type your message and send.', '#057642');
    } catch (error) {
      console.error('❌ Error clicking button:', error);
      throw error;
    }
  }

  private async clickMoreButton(): Promise<boolean> {
    console.log('Looking for "More" dropdown button...');

    // LinkedIn uses various patterns for the More button
    const moreSelectors = [
      'button[aria-label*="More actions"]',
      'button[aria-label*="more actions" i]',
      'button[aria-label*="More"]',
      'button[aria-haspopup="true"]',
      'button.artdeco-dropdown__trigger',
      'button[data-control-name*="overflow"]',
      '.pvs-profile-actions button[aria-label*="actions" i]'
    ];

    // Try each selector
    for (const selector of moreSelectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        for (const button of Array.from(buttons)) {
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          const text = button.textContent?.trim().toLowerCase() || '';

          // Check if this is a More/overflow button
          if (ariaLabel.includes('more') || ariaLabel.includes('actions') || text === 'more') {
            const moreButton = button as HTMLElement;

            // Check if it's visible and clickable
            if (this.isButtonClickable(moreButton)) {
              console.log(`✓ Found "More" button: ${ariaLabel || text}`);

              // Scroll into view and click
              moreButton.scrollIntoView({ behavior: 'instant', block: 'center' });
              await this.sleep(200);
              moreButton.click();

              return true;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: Look for buttons with ellipsis or "More" text
    const allButtons = Array.from(document.querySelectorAll('button'));
    for (const button of allButtons) {
      const text = button.textContent?.trim() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

      // Look for ellipsis icon or "More" text
      if (text === '...' || text === '•••' || text.toLowerCase() === 'more' ||
          ariaLabel.includes('more actions')) {
        if (this.isButtonClickable(button)) {
          console.log('✓ Found "More" button (fallback method)');
          button.scrollIntoView({ behavior: 'instant', block: 'center' });
          await this.sleep(200);
          button.click();
          return true;
        }
      }
    }

    console.log('❌ No "More" button found');
    return false;
  }

  private async findMessageButton(): Promise<HTMLElement | null> {
    console.log('Searching for Message button...');

    // LinkedIn uses various selectors for the Message button
    const selectors = [
      // Most specific first
      'button.message-anywhere-button',
      'button[aria-label*="Message"][aria-label*="' + this.getProfileName() + '"]',
      'a[aria-label*="Message"][aria-label*="' + this.getProfileName() + '"]',

      // General Message buttons
      'button[aria-label^="Message"]',
      'a[aria-label^="Message"]',
      'button.pvs-profile-actions__action[aria-label*="message" i]',

      // Broader selectors
      '.pvs-profile-actions button',
      '.message-anywhere-button',
      'button[data-control-name*="message"]',

      // Most generic
      'button[aria-label*="message" i]',
      'a[aria-label*="message" i]'
    ];

    const candidateButtons: HTMLElement[] = [];

    // Try each selector and collect candidates
    for (const selector of selectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        for (const button of Array.from(buttons)) {
          const text = button.textContent?.trim().toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

          // Check if this is actually a Message button (not "Send message to LinkedIn")
          if ((text.includes('message') || ariaLabel.includes('message')) &&
              !ariaLabel.includes('send a message to linkedin') &&
              !ariaLabel.includes('premium')) {
            candidateButtons.push(button as HTMLElement);
          }
        }
      } catch (e) {
        // Selector might not be supported, continue
        continue;
      }
    }

    // If we found candidates, prioritize visible ones
    if (candidateButtons.length > 0) {
      console.log(`Found ${candidateButtons.length} candidate Message button(s)`);

      // First, try to find a visible button
      for (const button of candidateButtons) {
        if (this.isButtonClickable(button)) {
          const text = button.textContent?.trim().toLowerCase() || '';
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
          console.log(`✓ Found VISIBLE Message button`);
          console.log(`  Text: "${text}", Aria-label: "${ariaLabel}"`);
          return button;
        }
      }

      // If no visible button, return the first one (might be in dropdown)
      const firstButton = candidateButtons[0];
      const text = firstButton.textContent?.trim().toLowerCase() || '';
      const ariaLabel = firstButton.getAttribute('aria-label')?.toLowerCase() || '';
      console.log(`✓ Found Message button (hidden, may be in dropdown)`);
      console.log(`  Text: "${text}", Aria-label: "${ariaLabel}"`);
      return firstButton;
    }

    // Fallback: Manual search through all buttons
    console.log('Trying fallback method: scanning all buttons...');
    const allButtons = Array.from(document.querySelectorAll('button, a'));
    console.log(`Found ${allButtons.length} total buttons/links on page`);

    for (const button of allButtons) {
      const text = button.textContent?.trim().toLowerCase() || '';
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
      const dataControl = button.getAttribute('data-control-name')?.toLowerCase() || '';

      // Look for exact "Message" text or aria-label containing "message"
      if (text === 'message' ||
          (ariaLabel.includes('message') &&
           !ariaLabel.includes('send a message to linkedin') &&
           !ariaLabel.includes('premium'))) {

        if (this.isButtonClickable(button as HTMLElement)) {
          console.log('✓ Found VISIBLE Message button using fallback method');
          console.log(`  Text: "${text}", Aria-label: "${ariaLabel}", Control: "${dataControl}"`);
          return button as HTMLElement;
        }
      }
    }

    console.log('❌ No visible Message button found');

    // Debug: show what buttons we did find
    const sampleButtons = allButtons.slice(0, 10).map(b => ({
      text: b.textContent?.trim().substring(0, 30),
      aria: b.getAttribute('aria-label')?.substring(0, 50),
      tag: b.tagName
    }));
    console.log('Sample of buttons found:', sampleButtons);

    return null;
  }

  private getProfileName(): string {
    // Try to extract profile name for more specific selector
    const nameElement = document.querySelector('h1.text-heading-xlarge, h1[class*="heading"]');
    return nameElement?.textContent?.trim() || '';
  }

  private isButtonClickable(button: HTMLElement): boolean {
    // Check if button is visible
    const rect = button.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log('Button has no dimensions');
      return false;
    }

    // Check if button is disabled
    if (button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true') {
      console.log('Button is disabled');
      return false;
    }

    // Check visibility
    const style = window.getComputedStyle(button);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      console.log('Button is hidden via CSS');
      return false;
    }

    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private showNotification(message: string, color: string = '#057642') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize auto-clicker
new MessageButtonAutoClicker();
