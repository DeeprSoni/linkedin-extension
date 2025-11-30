# CRM Usage Guide

## Overview

Your LinkedIn Agent extension now has a **full CRM system** integrated! You can track leads through their entire lifecycle from discovery to meeting.

## Where to Find the CRM

1. **Click the extension icon** → Open SidePanel
2. **Click the "🎯 CRM Pipeline" tab** at the top
3. You'll see your CRM dashboard with pipeline stages and lead cards

## Quick Start

### Step 1: Sync Your Existing Prospects

When you first open the CRM, click **"Sync from Prospects"** to convert all your existing prospects into CRM leads:

- `new` prospects → `NEW` stage in CRM
- `reviewed` prospects → `REQUEST_SENT` stage (assuming you sent requests)
- `connected` prospects → `CONNECTED` stage
- `skipped` prospects → `LOST` stage

### Step 2: Auto-Sync Recent Connections

**Automatically detect when people accept your connection requests:**

1. Go to your LinkedIn connections page:
   ```
   https://www.linkedin.com/mynetwork/invite-connect/connections/
   ```

2. In the CRM tab, click **"🔄 Auto-Sync Connections"**

3. The system will:
   - Scan your recent connections (up to 50)
   - Find any leads in `REQUEST_SENT` stage
   - Automatically move them to `CONNECTED` stage
   - Add a note about when the connection was detected

**Result:** No more manually tracking who accepted your requests!

## Understanding the Pipeline

### Stages

```
NEW → REQUEST_SENT → CONNECTED → ACTIVE_CONVO → MEETING_BOOKED
         ↓              ↓             ↓              ↓
      NURTURE or LOST (can move to these anytime)
```

**Stage Descriptions:**

- **NEW**: Just discovered this lead
- **REQUEST_SENT**: Connection request sent (waiting for acceptance)
- **CONNECTED**: Connection accepted (ready to message)
- **ACTIVE_CONVO**: In conversation via DMs
- **MEETING_BOOKED**: Meeting scheduled!
- **NURTURE**: Long-term follow-up (not ready yet)
- **LOST**: No longer pursuing

### Event Buttons

Each lead card shows **only valid actions** based on the current stage:

- **Send Request**: NEW → REQUEST_SENT
- **Accepted**: REQUEST_SENT → CONNECTED
- **Send DM**: CONNECTED → ACTIVE_CONVO
- **Schedule Meeting**: Any stage → MEETING_BOOKED
- **Set Nurture**: Move to nurture list
- **Mark Lost**: Move to lost

**The system prevents illegal transitions!** For example, you can't send a DM if you're not connected yet.

## Working with Leads

### View Lead Details

Each card shows:
- Name and profile link
- Current stage (colored badge)
- Tags (if any)
- Next action (if set)
- Latest note
- Available action buttons

### Filter by Stage

Click any stage number in the pipeline stats to filter:
- Only show leads in that stage
- Click "ALL" to see everything

## Example Workflow

### Scenario: You sent 10 connection requests yesterday

1. **Mark them as sent** (do this from Prospects tab):
   - Change status from "new" → "reviewed"

2. **Sync to CRM**:
   - Go to CRM tab
   - Click "Sync from Prospects"
   - They're now in `REQUEST_SENT` stage

3. **Wait for acceptances**, then:
   - Go to LinkedIn connections page
   - Click "🔄 Auto-Sync Connections" in CRM
   - Accepted connections automatically move to `CONNECTED`!

4. **Start conversations**:
   - Filter by `CONNECTED` stage
   - Click "Send DM" on each lead
   - They move to `ACTIVE_CONVO`

5. **Track progress**:
   - Add notes about each conversation
   - Set next actions ("Follow up on Friday")
   - Schedule meetings when ready

## Auto-Sync Details

### How It Works

The auto-sync script:

1. Scrapes your LinkedIn connections page
2. Extracts profile URLs from recent connections
3. Matches them against leads in your CRM
4. Updates leads from `REQUEST_SENT` → `CONNECTED`
5. Adds a timestamped note

### Requirements

- Must be on LinkedIn connections page when you click sync
- Extension needs to be able to access the page
- Only syncs leads that already exist in CRM

### Frequency

Run it:
- Daily to catch new acceptances
- After sending a batch of requests
- Before starting your outreach for the day

## Tips & Best Practices

### 1. Always Use Auto-Sync
**Don't manually mark connections** - let the auto-sync detect them for you!

### 2. Set Next Actions
After each stage transition, set a next action:
```
"Follow up if no response" - Due: 7 days from now
"Send introduction DM" - Due: Tomorrow
"Schedule demo call" - Due: This week
```

### 3. Add Notes
Document everything:
- "Met at Y Combinator event"
- "Interested in our analytics feature"
- "Mentioned they're hiring in Q4"

### 4. Use Tags
Organize leads:
- `hot-lead`, `warm-lead`, `cold-lead`
- `enterprise`, `smb`, `startup`
- `q4-2025`, `decision-maker`, `influencer`

### 5. Filter Strategically
Daily routine:
1. Filter by `ACTIVE_CONVO` - respond to ongoing conversations
2. Filter by `CONNECTED` - start new conversations
3. Check leads with overdue next actions

## Troubleshooting

### "Auto-Sync failed"

**Solution:** Make sure you're on the connections page:
```
https://www.linkedin.com/mynetwork/invite-connect/connections/
```

Not search results, not My Network homepage - the actual connections list.

### "No leads in CRM"

**Solution:**
1. Go to Prospects tab
2. Make sure you have prospects
3. Go back to CRM tab
4. Click "Sync from Prospects"

### "Invalid transition" error

This means you tried an illegal action (like sending a DM before being connected).

Check the stage and use the suggested action buttons instead.

## Data & Privacy

- **All data stored locally** in your browser (IndexedDB)
- **No data sent to external servers**
- **Only you can see your CRM data**
- **Export available** (via Prospects tab → Export CSV)

## Advanced: Manual Lead Management

You can also create leads programmatically:

```javascript
// Open browser console in the extension sidepanel
import * as CRM from './crm';

// Create a lead
const lead = await CRM.createLead('Jane Doe', 'https://linkedin.com/in/janedoe');

// Apply events
await CRM.applyEvent(lead.id, CRM.Event.CONNECTION_REQUEST_SENT);

// Add notes
await CRM.addNote(lead.id, 'Spoke at conference');

// Set next action
await CRM.setNextAction(lead.id, 'Follow up', '2025-11-01T10:00:00Z');
```

## Next Steps

1. ✅ Build your prospect list using the LinkedIn scanner
2. ✅ Sync prospects to CRM
3. ✅ Send connection requests
4. ✅ Use auto-sync to detect acceptances
5. ✅ Start conversations
6. ✅ Book meetings!

---

**Questions?** Check the [README.md](src/crm/README.md) for full API documentation.
