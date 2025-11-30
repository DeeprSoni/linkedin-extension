# LinkedIn Lead CRM - Quick Start

## 5-Minute Setup

### 1. Basic Usage (Console)

Open your browser console and try:

```javascript
import * as CRM from './crm';

// Create a lead
const lead = await CRM.createLead(
  'John Doe',
  'https://linkedin.com/in/johndoe'
);
console.log('Created:', lead.name, 'Stage:', lead.stage);

// Send connection request
await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);

// Connection accepted
await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);

// Send DM
await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);

// Check current stage
const updated = await CRM.getLeadById(lead.id);
console.log('Current stage:', updated.stage); // ACTIVE_CONVO

// List all leads
const all = await CRM.listLeads();
console.log('Total leads:', all.length);
```

### 2. Add to Your React App

```tsx
import React, { useState, useEffect } from 'react';
import * as CRM from './crm';
import { LeadCard } from './crm/components';

function App() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    const data = await CRM.listLeads();
    setLeads(data);
  };

  const handleEvent = async (leadId, event) => {
    await CRM.applyEvent(leadId, event);
    await loadLeads();
  };

  return (
    <div>
      <h1>My Leads</h1>
      {leads.map(lead => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onEventApplied={handleEvent}
        />
      ))}
    </div>
  );
}
```

### 3. Track LinkedIn Actions

```typescript
// When you scrape a profile
async function onProfileScraped(name: string, url: string) {
  await CRM.mergeByProfileUrl(url, { name });
}

// When you send a connection request
async function onRequestSent(url: string) {
  const lead = await CRM.getLeadByUrl(url);
  if (lead) {
    await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
  }
}

// When connection is accepted
async function onConnected(url: string) {
  const lead = await CRM.getLeadByUrl(url);
  if (lead) {
    await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
  }
}
```

## Common Patterns

### Add Notes

```typescript
await CRM.addNote(leadId, 'Met at tech conference');
await CRM.addNote(leadId, 'Interested in our product');
```

### Set Next Action

```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await CRM.setNextAction(
  leadId,
  'Follow up about demo',
  tomorrow.toISOString()
);
```

### Add Tags

```typescript
await CRM.addTags(leadId, ['hot-lead', 'enterprise', 'q4-2025']);
```

### Filter Leads

```typescript
// Active conversations only
const active = await CRM.listLeads({
  stage: CRM.Stage.ACTIVE_CONVO
});

// Hot leads with next actions
const hot = await CRM.listLeads({
  tags: ['hot-lead'],
  hasNextAction: true
});

// Overdue actions
const overdue = await CRM.listLeads({
  hasNextAction: true,
  nextActionDueBefore: new Date().toISOString()
});
```

### Get Pipeline Stats

```typescript
const stats = await CRM.getStats();
console.log('New:', stats.NEW);
console.log('Connected:', stats.CONNECTED);
console.log('Active:', stats.ACTIVE_CONVO);
console.log('Meetings:', stats.MEETING_BOOKED);
```

## Error Handling

```typescript
try {
  // Try to send DM to someone you're not connected to
  await CRM.applyEvent(leadId, CRM.Event.DM_SENT);
} catch (error) {
  if (error instanceof CRM.InvalidTransitionError) {
    console.log('Cannot send DM - not connected yet');
    console.log('Current stage:', error.currentStage);
    console.log('Need to be CONNECTED first');
  }
}
```

## Valid Transitions Cheat Sheet

```
NEW
  ├─ CONNECTION_REQUEST_SENT → Request sent
  ├─ SET_NURTURE → Move to nurture
  └─ MARK_LOST → Mark as lost

REQUEST_SENT
  ├─ CONNECTION_ACCEPTED → They accepted
  ├─ SET_NURTURE → Move to nurture
  └─ MARK_LOST → Mark as lost

CONNECTED
  ├─ DM_SENT → Start conversation
  ├─ MEETING_SCHEDULED → Book meeting
  ├─ SET_NURTURE → Move to nurture
  └─ MARK_LOST → Mark as lost

ACTIVE_CONVO
  ├─ DM_SENT → Continue chatting
  ├─ DM_REPLY_RECEIVED → They replied
  ├─ MEETING_SCHEDULED → Book meeting
  ├─ SET_NURTURE → Move to nurture
  └─ MARK_LOST → Mark as lost

MEETING_BOOKED
  ├─ DM_SENT → Send message
  ├─ MEETING_SCHEDULED → Reschedule
  ├─ SET_NURTURE → Move to nurture
  └─ MARK_LOST → Mark as lost

NURTURE
  ├─ DM_SENT → Revive conversation
  ├─ MEETING_SCHEDULED → Book meeting
  └─ MARK_LOST → Mark as lost

LOST
  └─ (terminal - no transitions out)
```

## Run Examples

```typescript
import { runAllExamples } from './crm/examples/usage';
await runAllExamples();
```

## Next Steps

1. Read [README.md](./README.md) for full API documentation
2. Check [INTEGRATION.md](./INTEGRATION.md) for Chrome extension integration
3. See [examples/usage.ts](./examples/usage.ts) for detailed examples
4. Try the [demo/CRMDemo.tsx](./demo/CRMDemo.tsx) component

## Need Help?

- **Invalid transition?** Check the valid transitions list above
- **Type errors?** Run `npm run type-check`
- **Leads not persisting?** Check IndexedDB in DevTools → Application tab
- **Duplicates?** Use `mergeByProfileUrl()` instead of `createLead()`
