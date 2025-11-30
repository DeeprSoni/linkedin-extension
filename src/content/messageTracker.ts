/**
 * LinkedIn Message Tracker - Robust Multi-Method Implementation
 *
 * Tracks DM sending and receiving using:
 * 1. Network interception (primary, most robust)
 * 2. Multi-context DOM monitoring (fallback)
 *
 * Works across ALL LinkedIn message flows:
 * - Profile → Message button
 * - Main messaging interface
 * - Connection search → Message
 * - InMail, group messages, etc.
 */

import * as CRM from '../crm';
import { injectNetworkInterceptor } from './networkInterceptor';

interface MessageData {
  profileUrl: string;
  profileName: string;
  messageContent: string;
  timestamp: number;
  source: 'network' | 'dom';
}

interface ProfileContext {
  profileUrl: string | null;
  profileName: string | null;
  context: 'profile' | 'messaging' | 'search' | 'unknown';
}

class LinkedInMessageTracker {
  private trackedMessages = new Set<string>();
  private observer: MutationObserver | null = null;
  private dialogObserver: MutationObserver | null = null;
  private isInitialized = false;
  private trackedDialogs = new Set<string>(); // Track which profiles have had dialog opened

  constructor() {
    this.init();
  }

  private async init() {
    console.log('[Message Tracker] Initializing robust tracker...');

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  private start() {
    console.log('[Message Tracker] Starting multi-method tracking...');

    // Method 1: Network interception (PRIMARY - most robust)
    this.initNetworkInterception();

    // Method 2: DOM monitoring (FALLBACK - catches what network misses)
    this.initDOMMonitoring();

    // Method 3: Dialog detection (Mark as messaged when compose dialog opens)
    this.initDialogDetection();

    // Monitor URL changes (LinkedIn is SPA)
    this.monitorURLChanges();

    this.isInitialized = true;
    console.log('[Message Tracker] ✅ Initialized with network + DOM + dialog tracking');
  }

  // ============================================================================
  // METHOD 1: NETWORK INTERCEPTION (Primary)
  // ============================================================================

  private initNetworkInterception() {
    console.log('[Message Tracker] Initializing network interception...');

    // Inject the interceptor script into page context
    injectNetworkInterceptor();

    // Listen for messages from the injected script
    window.addEventListener('message', (event) => {
      // Only accept messages from same origin
      if (event.source !== window) return;

      if (event.data && event.data.type === 'LINKEDIN_MESSAGE_SENT') {
        console.log('[Message Tracker] Network interceptor caught message:', event.data.data);
        this.handleNetworkMessage(event.data.data);
      }
    });

    console.log('[Message Tracker] Network interception active');
  }

  private async handleNetworkMessage(data: any) {
    try {
      // Extract profile URL from the intercepted data
      let profileUrl = data.profileUrl;
      let profileName = 'Unknown';

      // If no profile URL from network data, try to extract from current context
      if (!profileUrl) {
        const context = this.getCurrentContext();
        profileUrl = context.profileUrl;
        profileName = context.profileName || 'Unknown';
      } else {
        // Try to get name from page
        const context = this.getCurrentContext();
        if (context.profileUrl === profileUrl && context.profileName) {
          profileName = context.profileName;
        } else {
          // Extract name from profile URL if available
          profileName = await this.getNameFromProfileUrl(profileUrl);
        }
      }

      if (!profileUrl) {
        console.warn('[Message Tracker] Could not determine profile URL from network data');
        return;
      }

      const messageData: MessageData = {
        profileUrl: this.normalizeProfileUrl(profileUrl),
        profileName,
        messageContent: data.messageText || '',
        timestamp: data.timestamp || Date.now(),
        source: 'network'
      };

      await this.trackSentMessage(messageData);
    } catch (error) {
      console.error('[Message Tracker] Error handling network message:', error);
    }
  }

  // ============================================================================
  // METHOD 2: MULTI-CONTEXT DOM MONITORING (Fallback)
  // ============================================================================

  private initDOMMonitoring() {
    console.log('[Message Tracker] Initializing DOM monitoring...');

    // Monitor for Send button clicks across all contexts
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;

      // Check if this is a Send button
      if (this.isSendButton(target)) {
        console.log('[Message Tracker] Send button clicked (DOM)');
        setTimeout(() => this.handleDOMSend(), 500); // Small delay to let message be captured
      }
    }, true);

    // Also monitor for new message elements (for received messages)
    this.startMutationObserver();

    console.log('[Message Tracker] DOM monitoring active');
  }

  private isSendButton(element: HTMLElement): boolean {
    const text = element.textContent?.toLowerCase() || '';
    const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
    const type = element.getAttribute('type');
    const className = element.className.toLowerCase();

    // Check various patterns for Send button
    return (
      (element.tagName === 'BUTTON' || !!element.closest('button')) &&
      (
        text.includes('send') ||
        ariaLabel.includes('send') ||
        className.includes('send') ||
        (type === 'submit' && this.isInMessageContext(element))
      )
    );
  }

  private isInMessageContext(element: HTMLElement): boolean {
    // Check if element is within a message composition area
    const parent = element.closest(
      '.msg-form, .message-form, [class*="compose"], [class*="message"], .msg-overlay-conversation-bubble'
    );
    return parent !== null;
  }

  private async handleDOMSend() {
    try {
      // Get current context
      const context = this.getCurrentContext();

      if (!context.profileUrl) {
        console.warn('[Message Tracker] Could not determine profile from DOM context');
        return;
      }

      // Try to get message content
      const messageContent = this.extractMessageFromDOM();

      if (!messageContent) {
        console.warn('[Message Tracker] Could not extract message content from DOM');
        // Still track the send event even without content
      }

      const messageData: MessageData = {
        profileUrl: context.profileUrl,
        profileName: context.profileName || 'Unknown',
        messageContent: messageContent || '[Message content unavailable]',
        timestamp: Date.now(),
        source: 'dom'
      };

      // Create unique ID to prevent duplicate tracking with network method
      const messageId = `${messageData.profileUrl}-${messageData.timestamp}`;
      if (this.trackedMessages.has(messageId)) {
        console.log('[Message Tracker] Message already tracked by network interceptor, skipping DOM tracking');
        return;
      }

      await this.trackSentMessage(messageData);
    } catch (error) {
      console.error('[Message Tracker] Error handling DOM send:', error);
    }
  }

  private extractMessageFromDOM(): string | null {
    // Try multiple selectors for message input
    const selectors = [
      '.msg-form__contenteditable',
      '.msg-form__msg-content-container--scrollable p',
      '[data-placeholder="Write a message..."]',
      '.compose-modal__message textarea',
      '.msg-overlay-conversation-bubble textarea',
      'div[contenteditable="true"][role="textbox"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    }

    return null;
  }

  private startMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Check for received messages
            this.checkForReceivedMessage(element);
          }
        });
      }
    });

    // Observe the entire document for message changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private checkForReceivedMessage(element: Element) {
    // Look for indicators of received messages
    const isReceivedMessage =
      element.classList.contains('msg-s-message-list__event') &&
      !element.querySelector('.msg-s-event-listitem__message-bubble--is-sender');

    if (!isReceivedMessage) {
      return;
    }

    const context = this.getCurrentContext();
    if (!context.profileUrl) return;

    const messageContent = element.textContent?.trim() || '';
    if (!messageContent) return;

    // Create unique ID
    const messageId = `received-${context.profileUrl}-${messageContent.substring(0, 50)}-${Date.now()}`;
    if (this.trackedMessages.has(messageId)) return;

    this.trackedMessages.add(messageId);

    this.trackReceivedMessage({
      profileUrl: context.profileUrl,
      profileName: context.profileName || 'Unknown',
      messageContent,
      timestamp: Date.now(),
      source: 'dom'
    });
  }

  // ============================================================================
  // METHOD 3: DIALOG DETECTION (Mark as messaged when compose dialog opens)
  // ============================================================================

  private initDialogDetection() {
    console.log('[Message Tracker] Initializing dialog detection...');

    // Start observing for message compose dialogs
    this.dialogObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            this.checkForMessageDialog(element);
          }
        });
      }
    });

    // Observe the entire document for new dialogs
    this.dialogObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check for existing dialogs that might already be open
    this.checkExistingDialogs();

    console.log('[Message Tracker] Dialog detection active');
  }

  private checkExistingDialogs() {
    // Check if there are any message dialogs already open
    const dialogSelectors = [
      '.msg-overlay-bubble-header',
      '.msg-overlay-conversation-bubble',
      '.message-overlay',
      '[role="dialog"].msg-overlay-conversation-bubble-modal',
      '.artdeco-modal.msg-overlay-conversation-bubble-modal'
    ];

    for (const selector of dialogSelectors) {
      const dialogs = document.querySelectorAll(selector);
      for (const dialog of Array.from(dialogs)) {
        this.checkForMessageDialog(dialog);
      }
    }
  }

  private checkForMessageDialog(element: Element) {
    // Check if this is a message compose dialog
    const isMessageDialog = this.isMessageComposeDialog(element);

    if (!isMessageDialog) {
      return;
    }

    console.log('[Message Tracker] Message compose dialog detected!');

    // Get the current profile context
    const context = this.getCurrentContext();

    if (!context.profileUrl) {
      console.warn('[Message Tracker] Dialog detected but could not determine profile URL');
      return;
    }

    // Create unique ID to prevent duplicate tracking
    const dialogId = `dialog-${context.profileUrl}-${Date.now()}`;

    // Check if we've already tracked this dialog opening (with a time window)
    const recentDialogId = `dialog-${context.profileUrl}`;
    if (this.trackedDialogs.has(recentDialogId)) {
      console.log('[Message Tracker] Dialog already tracked for this profile recently');
      return;
    }

    this.trackedDialogs.add(recentDialogId);

    // Clear the tracking after 5 seconds to allow re-detection if dialog is closed and reopened
    setTimeout(() => {
      this.trackedDialogs.delete(recentDialogId);
    }, 5000);

    console.log(`[Message Tracker] Marking profile as "messaged" (dialog opened): ${context.profileUrl}`);

    // Update campaign status to "messaged"
    this.updateCampaignStatusOnDialogOpen(context.profileUrl, context.profileName || 'Unknown');
  }

  private isMessageComposeDialog(element: Element): boolean {
    // Check for various patterns that indicate a message compose dialog

    // Pattern 1: Element has message-related classes
    const classPatterns = [
      'msg-overlay-bubble-header',
      'msg-overlay-conversation-bubble',
      'message-overlay',
      'msg-form',
      'msg-overlay-conversation-bubble-modal'
    ];

    for (const pattern of classPatterns) {
      if (element.classList.contains(pattern) || element.querySelector(`.${pattern}`)) {
        return true;
      }
    }

    // Pattern 2: Dialog role with message form inside
    if (element.getAttribute('role') === 'dialog') {
      const hasMessageForm = element.querySelector('.msg-form, [class*="message-form"], [data-placeholder*="message"]');
      if (hasMessageForm) {
        return true;
      }
    }

    // Pattern 3: Check for message input field
    const messageInputSelectors = [
      '.msg-form__contenteditable',
      '[data-placeholder="Write a message..."]',
      'div[contenteditable="true"][role="textbox"]'
    ];

    for (const selector of messageInputSelectors) {
      if (element.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }

  private async updateCampaignStatusOnDialogOpen(profileUrl: string, profileName: string) {
    try {
      // Get prospect by profile URL
      const prospects = await chrome.storage.local.get('linkedin_prospects');
      const allProspects = prospects.linkedin_prospects || [];

      const prospect = allProspects.find((p: any) =>
        this.normalizeProfileUrl(p.profileUrl) === this.normalizeProfileUrl(profileUrl)
      );

      if (!prospect) {
        console.log('[Message Tracker] No prospect found for dialog-based campaign update');
        return;
      }

      // Get all campaigns
      const campaignsData = await chrome.storage.local.get('message_campaigns');
      const campaigns = campaignsData.message_campaigns || [];

      let updated = false;

      // Find campaigns containing this prospect
      for (const campaign of campaigns) {
        const contact = campaign.contacts.find((c: any) => c.prospectId === prospect.id);

        if (contact && contact.status !== 'messaged') {
          const previousStatus = contact.status;
          console.log(`[Message Tracker] Updating campaign "${campaign.name}" contact from "${previousStatus}" to "messaged" (dialog opened)`);

          // Update contact status
          contact.status = 'messaged';
          contact.messagedAt = Date.now();

          // Update stats based on previous status
          if (previousStatus === 'opened') {
            campaign.stats.opened--;
          } else if (previousStatus === 'pending') {
            campaign.stats.pending--;
          }
          campaign.stats.messaged++;

          updated = true;
        }
      }

      if (updated) {
        // Save updated campaigns
        await chrome.storage.local.set({ message_campaigns: campaigns });
        console.log('[Message Tracker] ✅ Campaign status updated to "messaged" (dialog opened)');

        // Show notification
        this.showNotification(`✅ ${profileName} marked as messaged`);
      }
    } catch (error) {
      console.error('[Message Tracker] Error updating campaign status on dialog open:', error);
    }
  }

  // ============================================================================
  // CONTEXT DETECTION (Works across all LinkedIn pages)
  // ============================================================================

  private getCurrentContext(): ProfileContext {
    const url = window.location.href;

    // Context 1: Profile page
    if (url.includes('/in/')) {
      return this.getProfilePageContext();
    }

    // Context 2: Messaging interface
    if (url.includes('/messaging/')) {
      return this.getMessagingInterfaceContext();
    }

    // Context 3: Search results
    if (url.includes('/search/results/people/')) {
      return this.getSearchContext();
    }

    // Context 4: Try generic profile link detection
    return this.getGenericContext();
  }

  private getProfilePageContext(): ProfileContext {
    const url = window.location.href;
    const match = url.match(/\/in\/([^\/\?]+)/);

    if (match) {
      const profileUrl = `https://www.linkedin.com/in/${match[1]}`;

      // Extract name from page
      const nameSelectors = [
        'h1.text-heading-xlarge',
        '.pv-text-details__left-panel h1',
        '.profile-topcard-person-entity__name',
        'h1[class*="heading"]'
      ];

      let profileName = null;
      for (const selector of nameSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          profileName = element.textContent?.trim() || null;
          if (profileName) break;
        }
      }

      return {
        profileUrl,
        profileName,
        context: 'profile'
      };
    }

    return { profileUrl: null, profileName: null, context: 'unknown' };
  }

  private getMessagingInterfaceContext(): ProfileContext {
    // Look for profile link in conversation header or selected conversation
    const selectors = [
      '.msg-thread__link-to-profile',
      '.msg-overlay-conversation-bubble__header a[href*="/in/"]',
      'a[data-control-name="view_profile"]',
      '.msg-conversation-listitem--active a[href*="/in/"]'
    ];

    for (const selector of selectors) {
      const link = document.querySelector(selector) as HTMLAnchorElement;
      if (link && link.href.includes('/in/')) {
        const profileUrl = this.normalizeProfileUrl(link.href);

        // Try to get name
        const nameElement = document.querySelector(
          '.msg-overlay-conversation-bubble__title, .msg-thread__title-text, .msg-entity-lockup__entity-title'
        );
        const profileName = nameElement?.textContent?.trim() || null;

        return {
          profileUrl,
          profileName,
          context: 'messaging'
        };
      }
    }

    return { profileUrl: null, profileName: null, context: 'messaging' };
  }

  private getSearchContext(): ProfileContext {
    // In search context, we need to find which profile is being messaged
    // This is harder - look for open modals or recently clicked profiles
    const modal = document.querySelector('[role="dialog"], .artdeco-modal');

    if (modal) {
      const profileLink = modal.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
      if (profileLink) {
        const profileUrl = this.normalizeProfileUrl(profileLink.href);
        const nameElement = modal.querySelector('h2, h3, .artdeco-modal__header h1');
        const profileName = nameElement?.textContent?.trim() || null;

        return {
          profileUrl,
          profileName,
          context: 'search'
        };
      }
    }

    return { profileUrl: null, profileName: null, context: 'search' };
  }

  private getGenericContext(): ProfileContext {
    // Last resort: look for any profile link in modals or focused areas
    const focusedAreas = [
      '[role="dialog"]',
      '.artdeco-modal',
      '.msg-overlay-bubble-header',
      '[aria-modal="true"]'
    ];

    for (const areaSelector of focusedAreas) {
      const area = document.querySelector(areaSelector);
      if (area) {
        const profileLink = area.querySelector('a[href*="/in/"]') as HTMLAnchorElement;
        if (profileLink) {
          const profileUrl = this.normalizeProfileUrl(profileLink.href);
          const nameElement = area.querySelector('h1, h2, h3, strong');
          const profileName = nameElement?.textContent?.trim() || null;

          return {
            profileUrl,
            profileName,
            context: 'unknown'
          };
        }
      }
    }

    return { profileUrl: null, profileName: null, context: 'unknown' };
  }

  // ============================================================================
  // CRM INTEGRATION
  // ============================================================================

  private async trackSentMessage(data: MessageData) {
    try {
      // Create unique ID to prevent duplicates
      const messageId = `${data.profileUrl}-${data.timestamp}-${data.source}`;
      if (this.trackedMessages.has(messageId)) {
        console.log('[Message Tracker] Duplicate message detected, skipping');
        return;
      }
      this.trackedMessages.add(messageId);

      console.log(`[Message Tracker] Tracking sent message (${data.source}):`, {
        profileUrl: data.profileUrl,
        profileName: data.profileName,
        messagePreview: data.messageContent.substring(0, 50)
      });

      // Get or create lead
      let lead = await CRM.getLeadByUrl(data.profileUrl);

      if (!lead) {
        console.log('[Message Tracker] Lead not found, creating new lead...');
        lead = await CRM.mergeByProfileUrl(data.profileUrl, {
          name: data.profileName,
          meta: {
            source: 'message_tracker',
            trackingMethod: data.source,
            firstMessageDate: new Date().toISOString()
          }
        });
      }

      // Apply DM_SENT event
      await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);

      // Add note with message preview
      const messagePreview = data.messageContent.length > 100
        ? `${data.messageContent.substring(0, 100)}...`
        : data.messageContent;

      await CRM.addNote(lead.id, `Sent: "${messagePreview}"`);

      // Set next action
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      await CRM.setNextAction(lead.id, 'Check for reply', threeDaysFromNow.toISOString());

      // Update bulk messaging campaign status (if this prospect is in a campaign)
      await this.updateCampaignStatus(data.profileUrl);

      console.log(`[Message Tracker] ✅ Successfully tracked sent message via ${data.source}`);

      // Show notification
      this.showNotification(`✅ Tracked message to ${data.profileName}`);

    } catch (error) {
      console.error('[Message Tracker] Error tracking sent message:', error);
      this.showNotification(`⚠️ Failed to track message: ${(error as Error).message}`, true);
    }
  }

  private async updateCampaignStatus(profileUrl: string) {
    try {
      // Get prospect by profile URL
      const prospects = await chrome.storage.local.get('linkedin_prospects');
      const allProspects = prospects.linkedin_prospects || [];

      const prospect = allProspects.find((p: any) =>
        this.normalizeProfileUrl(p.profileUrl) === this.normalizeProfileUrl(profileUrl)
      );

      if (!prospect) {
        console.log('[Message Tracker] No prospect found for campaign update');
        return;
      }

      // Get all campaigns
      const campaignsData = await chrome.storage.local.get('message_campaigns');
      const campaigns = campaignsData.message_campaigns || [];

      let updated = false;

      // Find campaigns containing this prospect
      for (const campaign of campaigns) {
        const contact = campaign.contacts.find((c: any) => c.prospectId === prospect.id);

        if (contact && contact.status !== 'messaged') {
          console.log(`[Message Tracker] Updating campaign "${campaign.name}" contact to "messaged"`);

          // Update contact status
          contact.status = 'messaged';
          contact.messagedAt = Date.now();

          // Update stats
          if (contact.status === 'opened') {
            campaign.stats.opened--;
          } else if (contact.status === 'pending') {
            campaign.stats.pending--;
          }
          campaign.stats.messaged++;

          updated = true;
        }
      }

      if (updated) {
        // Save updated campaigns
        await chrome.storage.local.set({ message_campaigns: campaigns });
        console.log('[Message Tracker] ✅ Campaign status updated');
      }
    } catch (error) {
      console.error('[Message Tracker] Error updating campaign status:', error);
    }
  }

  private async trackReceivedMessage(data: MessageData) {
    try {
      console.log(`[Message Tracker] Tracking received message from ${data.profileName}`);

      let lead = await CRM.getLeadByUrl(data.profileUrl);

      if (!lead) {
        console.log('[Message Tracker] Lead not found for received message, creating...');
        lead = await CRM.mergeByProfileUrl(data.profileUrl, {
          name: data.profileName,
          meta: {
            source: 'message_tracker',
            firstReplyDate: new Date().toISOString()
          }
        });
      }

      // Apply reply received event
      await CRM.applyEvent(lead.id, CRM.Event.DM_REPLY_RECEIVED);

      // Add note
      const messagePreview = data.messageContent.length > 100
        ? `${data.messageContent.substring(0, 100)}...`
        : data.messageContent;

      await CRM.addNote(lead.id, `Received: "${messagePreview}"`);

      // Set next action
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      await CRM.setNextAction(lead.id, 'Continue conversation', oneDayFromNow.toISOString());

      console.log(`[Message Tracker] ✅ Successfully tracked received message`);
      this.showNotification(`📨 Tracked reply from ${data.profileName}`);

    } catch (error) {
      console.error('[Message Tracker] Error tracking received message:', error);
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private normalizeProfileUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  private async getNameFromProfileUrl(profileUrl: string): Promise<string> {
    // Try to get name from existing lead
    const lead = await CRM.getLeadByUrl(profileUrl);
    if (lead) {
      return lead.name;
    }

    // Extract from URL as fallback
    const match = profileUrl.match(/\/in\/([^\/]+)/);
    return match ? match[1].replace(/-/g, ' ') : 'Unknown';
  }

  private monitorURLChanges() {
    let lastUrl = location.href;

    const urlObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[Message Tracker] URL changed:', currentUrl);
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private showNotification(message: string, isError: boolean = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isError ? '#dc2626' : '#10b981'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  public stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.dialogObserver) {
      this.dialogObserver.disconnect();
      this.dialogObserver = null;
    }
    console.log('[Message Tracker] Stopped');
  }
}

// Export singleton instance
export const messageTracker = new LinkedInMessageTracker();
