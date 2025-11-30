# LinkedIn Lead CRM

A strongly typed, state-machine powered CRM for tracking LinkedIn leads. This module provides a complete solution for managing LinkedIn connections with enforced stage transitions, IndexedDB persistence, and React UI components.

## Features

- **State Machine Enforcement**: Legal transitions only, with `ERR_INVALID_TRANSITION` for illegal jumps
- **Idempotent Operations**: Re-sending requests, scheduling meetings, etc. are safe
- **Type Safety**: Full TypeScript support with strict typing
- **Persistent Storage**: IndexedDB-based local storage
- **React Components**: Pre-built UI components (stage badges, event buttons, lead cards)
- **No Auto-Sending**: Tracking only - you control all actions

## Quick Start

```typescript
import * as CRM from './crm';

// Initialize (automatic on first use)
await CRM.initDB();

// Create a lead
const lead = await CRM.createLead(
  'John Doe',
  'https://linkedin.com/in/johndoe',
  { company: 'Acme Corp', title: 'CTO' }
);

// Apply events to transition through stages
await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);
await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_ACCEPTED);
await CRM.applyEvent(lead.id, CRM.Event.DM_SENT);

// Add notes and next actions
await CRM.addNote(lead.id, 'Met at conference');
await CRM.setNextAction(lead.id, 'Follow up', '2025-11-01T10:00:00Z');

// Query leads
const activeLeads = await CRM.listLeads({ stage: CRM.Stage.ACTIVE_CONVO });
```

## Stages

```typescript
enum Stage {
  NEW = 'NEW',                      // Just discovered
  REQUEST_SENT = 'REQUEST_SENT',    // Connection request sent
  CONNECTED = 'CONNECTED',          // Connection accepted
  ACTIVE_CONVO = 'ACTIVE_CONVO',   // In conversation
  MEETING_BOOKED = 'MEETING_BOOKED', // Meeting scheduled
  NURTURE = 'NURTURE',              // Long-term nurture
  LOST = 'LOST',                    // No longer pursuing
}
```

## Events

```typescript
enum Event {
  SCRAPED = 'SCRAPED',                            // Lead discovered
  CONNECTION_REQUEST_SENT = 'CONNECTION_REQUEST_SENT', // Request sent
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',    // Request accepted
  DM_SENT = 'DM_SENT',                           // Direct message sent
  DM_REPLY_RECEIVED = 'DM_REPLY_RECEIVED',       // Reply received
  MEETING_SCHEDULED = 'MEETING_SCHEDULED',        // Meeting booked
  SET_NURTURE = 'SET_NURTURE',                   // Move to nurture
  MARK_LOST = 'MARK_LOST',                       // Mark as lost
}
```

## State Transitions

Valid transitions (enforced by state machine):

```
NEW
  → CONNECTION_REQUEST_SENT (send request)
  → NURTURE (not ready)
  → LOST (disqualified)

REQUEST_SENT
  → REQUEST_SENT (idempotent re-send)
  → CONNECTED (accepted)
  → NURTURE
  → LOST

CONNECTED
  → ACTIVE_CONVO (send DM)
  → MEETING_BOOKED (schedule meeting)
  → NURTURE
  → LOST

ACTIVE_CONVO
  → ACTIVE_CONVO (send more DMs, receive replies)
  → MEETING_BOOKED (schedule meeting)
  → NURTURE
  → LOST

MEETING_BOOKED
  → MEETING_BOOKED (reschedule, send DMs)
  → NURTURE
  → LOST

NURTURE
  → NURTURE (idempotent)
  → ACTIVE_CONVO (revive with DM)
  → MEETING_BOOKED (schedule meeting)
  → LOST

LOST
  → LOST (terminal state)
```

## Lead Data Structure

```typescript
interface Lead {
  id: string;                    // SHA-256 hash of profileUrl
  name: string;                  // Full name
  profileUrl: string;            // LinkedIn profile URL
  meta?: Record<string, unknown>; // Optional metadata
  stage: Stage;                  // Current stage
  tags: string[];                // Tags for categorization
  notes: Note[];                 // Notes history
  nextAction: NextAction | null; // Next action to take
  timestamps: {
    createdAt: string;           // ISO 8601
    updatedAt: string;           // ISO 8601
    stageChangedAt: string;      // ISO 8601
  };
}
```

## API Reference

### Lead Management

```typescript
// Create a new lead
createLead(name: string, profileUrl: string, meta?: Record<string, unknown>): Promise<Lead>

// Get lead by ID
getLeadById(leadId: string): Promise<Lead | null>

// Get lead by profile URL
getLeadByUrl(profileUrl: string): Promise<Lead | null>

// Merge or create by profile URL (deduplication)
mergeByProfileUrl(profileUrl: string, partial: Partial<Lead>): Promise<Lead>

// Delete a lead
removeLeadById(leadId: string): Promise<void>
```

### Event System

```typescript
// Apply an event (transitions stage)
// Throws InvalidTransitionError if illegal
applyEvent(leadId: string, event: Event): Promise<Lead>

// Check if transition is valid
isValidTransition(currentStage: Stage, event: Event): boolean

// Get valid events for a stage
getValidEvents(stage: Stage): Event[]
```

### Next Actions

```typescript
// Set next action
setNextAction(leadId: string, action: string, dueAtISO: string): Promise<Lead>

// Clear next action
clearNextAction(leadId: string): Promise<Lead>
```

### Notes

```typescript
// Add a note
addNote(leadId: string, content: string): Promise<Lead>

// Delete a note
deleteNote(leadId: string, noteId: string): Promise<Lead>
```

### Tags

```typescript
// Add tags
addTags(leadId: string, tags: string[]): Promise<Lead>

// Remove tags
removeTags(leadId: string, tags: string[]): Promise<Lead>
```

### Queries

```typescript
// List leads with filters
listLeads(filters?: LeadFilters): Promise<Lead[]>

// Get leads by stage
getLeadsByStageValue(stage: Stage): Promise<Lead[]>

// Get pipeline stats
getStats(): Promise<Record<Stage, number>>

interface LeadFilters {
  stage?: Stage;
  tags?: string[];
  hasNextAction?: boolean;
  nextActionDueBefore?: string; // ISO 8601
}
```

## React Components

### StageBadge

Displays a colored badge for a lead's stage.

```typescript
import { StageBadge } from './crm/components';

<StageBadge stage={lead.stage} />
```

### EventButtons

Displays buttons for valid events based on current stage.

```typescript
import { EventButtons } from './crm/components';

<EventButtons
  stage={lead.stage}
  onEvent={(event) => handleEvent(lead.id, event)}
  disabled={isProcessing}
/>
```

### LeadCard

Complete card component with stage badge, event buttons, notes, and next actions.

```typescript
import { LeadCard } from './crm/components';

<LeadCard
  lead={lead}
  onEventApplied={(leadId, event) => handleEvent(leadId, event)}
  onLeadClick={(lead) => console.log('Clicked:', lead)}
/>
```

## Error Handling

```typescript
import { InvalidTransitionError, LeadNotFoundError } from './crm';

try {
  await CRM.applyEvent(leadId, CRM.Event.DM_SENT);
} catch (error) {
  if (error instanceof InvalidTransitionError) {
    console.error('Invalid transition:', error.message);
    console.error('Current stage:', error.currentStage);
    console.error('Attempted event:', error.event);
  } else if (error instanceof LeadNotFoundError) {
    console.error('Lead not found:', error.leadId);
  } else {
    throw error;
  }
}
```

## Examples

See `examples/usage.ts` for comprehensive examples:

1. Basic lead creation and event flow
2. Invalid transition handling
3. Next actions and notes
4. Querying and filtering
5. Deduplication with mergeByProfileUrl
6. Nurture and lost flows

To run examples in browser console:

```javascript
import { runAllExamples } from './crm/examples/usage';
runAllExamples();
```

## Demo

See `demo/CRMDemo.tsx` for a complete React demo application.

## Architecture

```
crm/
├── types.ts          # Core types and interfaces
├── stateMachine.ts   # State transition logic
├── storage.ts        # IndexedDB persistence layer
├── utils.ts          # Utility functions
├── crm.ts            # Main API implementation
├── index.ts          # Public exports
├── components/       # React components
│   ├── StageBadge.tsx
│   ├── EventButtons.tsx
│   ├── LeadCard.tsx
│   └── index.ts
├── demo/             # Demo application
│   └── CRMDemo.tsx
└── examples/         # Usage examples
    └── usage.ts
```

## Best Practices

1. **Always use applyEvent()** to change stages - never modify `lead.stage` directly
2. **Handle InvalidTransitionError** to provide user feedback
3. **Use mergeByProfileUrl()** when scraping to avoid duplicates
4. **Set next actions** to keep your pipeline organized
5. **Add tags** for filtering and categorization
6. **Add notes** to track context and history

## License

Part of the LinkedIn Agent project.
