# Integrating CRM with Chrome Extension

This guide shows how to integrate the LinkedIn Lead CRM into your existing Chrome extension.

## Quick Integration

### 1. Import the CRM in your content script

```typescript
// src/content/index.ts or wherever you scrape LinkedIn
import * as CRM from '../crm';

// When you scrape a LinkedIn profile
async function onProfileScraped(profileData: any) {
  // Create or merge lead
  const lead = await CRM.mergeByProfileUrl(profileData.url, {
    name: profileData.name,
    meta: {
      headline: profileData.headline,
      company: profileData.company,
      location: profileData.location,
    },
  });

  // Automatically mark as scraped (idempotent)
  await CRM.applyEvent(lead.id, CRM.Event.SCRAPED);

  console.log('Lead tracked:', lead.name, lead.stage);
}
```

### 2. Add CRM UI to your popup or sidepanel

```typescript
// src/popup/Popup.tsx or src/sidepanel/SidePanel.tsx
import React, { useState, useEffect } from 'react';
import * as CRM from '../crm';
import { LeadCard } from '../crm/components';

export const Popup: React.FC = () => {
  const [leads, setLeads] = useState<CRM.Lead[]>([]);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const allLeads = await CRM.listLeads();
    setLeads(allLeads);
  };

  const handleEventApplied = async (leadId: string, event: CRM.Event) => {
    await CRM.applyEvent(leadId, event);
    await loadLeads(); // Refresh
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2>LinkedIn Leads</h2>
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onEventApplied={handleEventApplied}
        />
      ))}
    </div>
  );
};
```

### 3. Track actions automatically

When user sends connection requests:

```typescript
// After sending connection request on LinkedIn
async function onConnectionRequestSent(profileUrl: string) {
  const lead = await CRM.getLeadByUrl(profileUrl);
  if (lead) {
    await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
  }
}
```

When user sends messages:

```typescript
// After sending a DM
async function onMessageSent(profileUrl: string, messageContent: string) {
  const lead = await CRM.getLeadByUrl(profileUrl);
  if (lead) {
    await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);
    await CRM.addNote(lead.id, `Sent: "${messageContent.substring(0, 50)}..."`);
  }
}
```

## Background Script Integration

For automatic syncing and reminders:

```typescript
// src/background/index.ts
import * as CRM from '../crm';

// Check for overdue next actions every hour
chrome.alarms.create('checkNextActions', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkNextActions') {
    const now = new Date().toISOString();
    const overdueLeads = await CRM.listLeads({
      hasNextAction: true,
      nextActionDueBefore: now,
    });

    if (overdueLeads.length > 0) {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'LinkedIn CRM Reminder',
        message: `You have ${overdueLeads.length} overdue action(s)`,
      });
    }
  }
});
```

## Message Passing Between Components

Use Chrome's message passing to coordinate:

```typescript
// content script: Notify when connection accepted
chrome.runtime.sendMessage({
  type: 'CONNECTION_ACCEPTED',
  profileUrl: currentProfileUrl,
});

// background script: Handle the event
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'CONNECTION_ACCEPTED') {
    const lead = await CRM.getLeadByUrl(message.profileUrl);
    if (lead) {
      await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
    }
  }
});
```

## Storage Permissions

The CRM uses IndexedDB which is already available in Chrome extensions. No additional permissions needed.

## Complete Example: Auto-tracking Workflow

```typescript
// src/content/linkedinTracker.ts
import * as CRM from '../crm';

class LinkedInTracker {
  async trackProfileView(profileUrl: string, profileData: any) {
    // Create or update lead
    const lead = await CRM.mergeByProfileUrl(profileUrl, {
      name: profileData.name,
      meta: profileData,
    });

    // Mark as scraped
    await CRM.applyEvent(lead.id, CRM.Event.SCRAPED);

    return lead;
  }

  async trackConnectionRequest(profileUrl: string) {
    const lead = await CRM.getLeadByUrl(profileUrl);
    if (!lead) {
      console.error('Lead not found for:', profileUrl);
      return;
    }

    try {
      await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
      await CRM.setNextAction(
        lead.id,
        'Follow up if no response',
        this.getDaysFromNow(7)
      );
    } catch (error) {
      if (error instanceof CRM.InvalidTransitionError) {
        console.log('Already sent request to this lead');
      }
    }
  }

  async trackConnectionAccepted(profileUrl: string) {
    const lead = await CRM.getLeadByUrl(profileUrl);
    if (!lead) return;

    await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
    await CRM.clearNextAction(lead.id); // Clear the follow-up action
    await CRM.setNextAction(
      lead.id,
      'Send introduction message',
      this.getDaysFromNow(1)
    );
  }

  async trackMessageSent(profileUrl: string, message: string) {
    const lead = await CRM.getLeadByUrl(profileUrl);
    if (!lead) return;

    await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);
    await CRM.addNote(lead.id, `Sent: ${message.substring(0, 100)}`);
    await CRM.setNextAction(
      lead.id,
      'Check for reply',
      this.getDaysFromNow(3)
    );
  }

  async trackMessageReceived(profileUrl: string, message: string) {
    const lead = await CRM.getLeadByUrl(profileUrl);
    if (!lead) return;

    await CRM.applyEvent(lead.id, CRM.Event.DM_REPLY_RECEIVED);
    await CRM.addNote(lead.id, `Received: ${message.substring(0, 100)}`);
    await CRM.setNextAction(
      lead.id,
      'Continue conversation',
      this.getDaysFromNow(1)
    );
  }

  private getDaysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  }
}

export const tracker = new LinkedInTracker();
```

## Testing

Test the CRM in browser console:

```javascript
// Open DevTools console on your extension page
import * as CRM from './crm';

// Create test lead
const lead = await CRM.createLead('Test User', 'https://linkedin.com/in/test');

// Apply events
await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);

// Check it worked
const updated = await CRM.getLeadById(lead.id);
console.log(updated.stage); // Should be 'REQUEST_SENT'
```

## Best Practices

1. **Initialize early**: Call `CRM.initDB()` in your background script on extension load
2. **Batch updates**: When possible, group CRM operations to reduce storage calls
3. **Error handling**: Always wrap `applyEvent()` in try-catch for `InvalidTransitionError`
4. **Deduplication**: Always use `mergeByProfileUrl()` when scraping to avoid duplicates
5. **User feedback**: Use the React components to show users the state of their leads
6. **Next actions**: Set next actions after every stage change to keep users on track

## Troubleshooting

**IndexedDB not persisting?**
- Check that your extension has the correct permissions
- Ensure you're not in incognito mode (unless you have incognito access)

**Type errors?**
- Make sure you've run `npm install` and `npm run type-check`

**Invalid transitions?**
- Check the state machine diagram in README.md
- Use `getValidEvents(stage)` to see what's allowed

**Duplicate leads?**
- Always use `mergeByProfileUrl()` instead of `createLead()` when scraping
