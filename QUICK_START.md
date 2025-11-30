# Quick Start Guide - LinkedIn Agent with Automatic DM Tracking

Get your LinkedIn Connection Scanner with automatic DM tracking up and running in 5 minutes!

## Installation (One-Time Setup)

### Step 1: Build the Extension

```bash
npm install
npm run build
```

### Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Navigate to: `chrome://extensions/`
3. Toggle ON "Developer mode" (top-right corner)
4. Click "Load unpacked" button
5. Navigate to this project folder and select the **`dist`** folder
6. The extension should now appear in your extensions list

### Step 3: Pin the Extension (Optional)

1. Click the puzzle icon in Chrome toolbar (next to your profile)
2. Find "LinkedIn Connection Scanner"
3. Click the pin icon to keep it visible

## Core Features

### 1. Connection Scanning

Scan and organize LinkedIn connections - see original instructions below.

### 2. 🆕 Automatic DM Tracking (NEW!)

**The extension now automatically tracks all LinkedIn messages you send and receive!**

## How Automatic DM Tracking Works

### Sending Messages - ANY Way You Want!

The extension automatically detects and tracks messages sent through **ANY** method:

#### Method 1: Profile → Message
1. Visit someone's LinkedIn profile
2. Click "Message" button
3. Type and send your message
4. ✅ **Automatically tracked!** Green notification appears

#### Method 2: Messaging Interface
1. Go to https://linkedin.com/messaging/
2. Select or start a conversation
3. Type and send your message
4. ✅ **Automatically tracked!**

#### Method 3: Search Results → Message
1. Search for people on LinkedIn
2. Click "Message" on a search result
3. Type and send your message
4. ✅ **Automatically tracked!**

### What Happens Automatically

When you send a message:
1. ✅ Extension detects the send (network + DOM monitoring)
2. ✅ Creates/updates lead in CRM
3. ✅ Sets lead to "ACTIVE_CONVO" stage
4. ✅ Adds note with your message preview
5. ✅ Sets reminder: "Check for reply" (3 days)
6. ✅ Shows green notification: "Tracked message to [Name]"

When someone replies:
1. ✅ Extension detects the reply
2. ✅ Marks as "DM_REPLY_RECEIVED"
3. ✅ Adds note with their reply preview
4. ✅ Updates reminder: "Continue conversation" (1 day)
5. ✅ Shows notification: "📨 Tracked reply from [Name]"

### Viewing Your Tracked Messages

**Option 1: Side Panel (Recommended)**
1. Click extension icon
2. Select "Open Side Panel"
3. Filter by "ACTIVE_CONVO" to see ongoing conversations
4. Each lead shows:
   - Name and profile link
   - Current stage
   - All message notes with timestamps
   - Next action reminder

**Option 2: Browser Console (Advanced)**
```javascript
// Press F12 on LinkedIn, then:
const leads = await CRM.listLeads({ stage: CRM.Stage.ACTIVE_CONVO });
console.table(leads.map(l => ({
  name: l.name,
  messages: l.notes.length,
  nextAction: l.nextAction?.action
})));
```

## Response Tracking & Categorization

### Automatic Tracking
All DMs sent and received are automatically tracked with:
- Message preview (first 100 characters)
- Timestamp
- Profile URL
- Lead stage update

### Manual Categorization

**By Stage (Move leads through pipeline):**
- `ACTIVE_CONVO` - Ongoing conversation (default)
- `MEETING_BOOKED` - They agreed to meet
- `NURTURE` - Follow up later
- `LOST` - Not interested

**By Tags (Add custom labels):**
```javascript
// In console or via UI (coming soon)
await CRM.addTags(leadId, ['hot-lead', 'interested', 'meeting-requested']);
```

Common tags to use:
- `interested` - Showed interest
- `not-interested` - Declined
- `hot-lead` - High priority
- `needs-follow-up` - Requires action

**By Notes (Add context):**
- Open lead in CRM
- Add custom note about response quality/details

## Verifying DM Tracking Works

### Quick Test:

1. **Open Console (F12)** on any LinkedIn page
2. You should see:
   ```
   [Network Interceptor] ✅ Initialized successfully
   [Message Tracker] ✅ Initialized with network + DOM tracking
   ```

3. **Send a test message** to anyone
4. You should see:
   ```
   [Network Interceptor] Detected message send API call
   [Message Tracker] ✅ Successfully tracked sent message via network
   ```
   **AND** a green notification in top-right corner

5. **Check CRM** - Lead should be in "ACTIVE_CONVO" with message note

### If tracking doesn't work:
1. Refresh LinkedIn page
2. Check console for errors (red text)
3. Verify extension is enabled at `chrome://extensions/`
4. See troubleshooting section below

## Connection Scanning (Original Feature)

### Scanning Prospects

**Option A: From LinkedIn Page**

1. Go to LinkedIn.com
2. Navigate to one of these pages:
   - **People Search**: linkedin.com/search/results/people/
   - **My Network**: linkedin.com/mynetwork/
3. Look for the blue **"Scan 2nd Connections"** button (bottom-right)
4. Click it and enter how many to scan
5. Wait while it scans (scrolls automatically)
6. You'll see a notification when complete

**Option B: From Extension Popup**

1. Navigate to LinkedIn Search or My Network page
2. Click the extension icon
3. Click "Start Scan"

### Reviewing Your Prospects

1. Click extension icon
2. Click "View All Prospects" → Side panel opens
3. For each prospect:
   - **View Profile** - Opens in new tab
   - **Change Status** - Mark as Reviewed/Connected/Skipped
   - **Delete** - Remove from list

### Filtering & Searching

In the side panel:
- **Search box**: Find by name, headline, company
- **Status filter**: Show only New/Reviewed/Skipped
- **Stage filter**: Show by CRM stage
- **Sort**: By date, name, or mutual connections

## Complete Workflow Example

### Scenario: First Outreach

1. **Scan prospects** from LinkedIn search
2. **Review in CRM** - filter by status "new"
3. **Visit profile** of interesting person
4. **Click "Message"** on their profile
5. **Type introduction** and send
6. ✅ **Auto-tracked** → Lead moves to "ACTIVE_CONVO"
7. **Reminder set**: Check for reply in 3 days

### Scenario: They Reply Positively

1. **Receive reply** on LinkedIn
2. ✅ **Auto-tracked** → Note added with reply
3. **Open CRM** → See their reply in notes
4. **Manually add tag**: `interested`
5. **Reply and schedule meeting**
6. **Move to stage**: MEETING_BOOKED
7. **Reminder updated**: Prepare for meeting

### Scenario: No Response

1. **Reminder triggers** after 3 days
2. **Check CRM** → No reply received
3. **Send follow-up** message
4. ✅ **Auto-tracked** → Still in ACTIVE_CONVO
5. **New reminder**: Check again in 3 days
6. **If no response** → Move to NURTURE or LOST

### Scenario: They Decline

1. **Receive rejection**
2. ✅ **Auto-tracked** → Reply noted
3. **Add tag**: `not-interested`
4. **Move to stage**: LOST
5. **Add note**: Reason for rejection

## CRM Stage Pipeline

```
NEW (just scanned)
  ↓
REQUEST_SENT (connection request sent)
  ↓
CONNECTED (accepted connection)
  ↓
ACTIVE_CONVO (sent first DM) ← Auto-tracked!
  ↓
MEETING_BOOKED (scheduled meeting)
  ↓
NURTURE (follow up later) or LOST (not interested)
```

## Tips & Best Practices

### DM Tracking Best Practices

1. **Regular CRM Review**
   - Check "ACTIVE_CONVO" leads daily
   - Follow up on overdue reminders
   - Move stale conversations appropriately

2. **Consistent Categorization**
   - Develop a tag system that works for you
   - Use stages to track pipeline progress
   - Keep notes concise but informative

3. **Response Timing**
   - Default reminder: 3 days for replies
   - Adjust based on urgency
   - Set custom reminders for VIP leads

### Connection Scanning Best Practices

1. **Use LinkedIn Search Filters:**
   - Location, Company, Industry
   - Connections of specific people
   - Keywords in headlines

2. **Quality Over Quantity:**
   - Look for mutual connections
   - Review profiles before connecting
   - Personalize connection messages

3. **Stay Within Limits:**
   - LinkedIn limits: ~20-50 connections/day
   - Don't spam
   - Be selective

## Troubleshooting

### DM Tracking Issues

**"Messages not being tracked"**
1. Open console (F12) and check for initialization messages
2. Refresh LinkedIn page
3. Try different message flow (profile vs messaging interface)
4. Verify extension is enabled

**"Wrong profile being tracked"**
1. Check console logs to see which profile was detected
2. Profile detection uses multiple methods (URL, modal, context)
3. Delete incorrect lead and correct manually if needed

**"Duplicate messages in CRM"**
- Should be prevented automatically
- If duplicates exist, delete via CRM UI
- Both network and DOM layers deduplicate

### Connection Scanning Issues

**"Scan button doesn't appear"**
- Refresh the LinkedIn page
- Ensure you're on search or mynetwork page

**"No prospects found"**
- Check for 2nd degree connections badge
- Verify search results exist
- Try scrolling manually first

**"Extension not working"**
- Reload extension at chrome://extensions/
- Refresh LinkedIn page
- Check console (F12) for errors

## Privacy & Data

- ✅ All data stored **locally** in your browser (IndexedDB)
- ✅ **No external servers** - nothing leaves your machine
- ✅ Message content limited to 100 character preview
- ✅ You can delete all data by removing extension
- ✅ Open source - you can review all code

## Advanced Features

### Browser Console Commands

```javascript
// List all active conversations
const active = await CRM.listLeads({ stage: CRM.Stage.ACTIVE_CONVO });

// Find leads without replies
const noReply = active.filter(l =>
  !l.notes.some(n => n.content.startsWith('Received:'))
);

// Bulk tag all active conversations
for (const lead of active) {
  await CRM.addTags(lead.id, ['pending-reply']);
}

// Export to console
console.table(active.map(l => ({
  name: l.name,
  sent: l.notes.filter(n => n.content.startsWith('Sent:')).length,
  received: l.notes.filter(n => n.content.startsWith('Received:')).length
})));
```

## Documentation

- **Quick Start** (this file) - Get started quickly
- **ROBUST_TRACKING_README.md** - Technical details on how tracking works
- **DM_TRACKING_GUIDE.md** - Original DM tracking guide
- **src/crm/README.md** - CRM system documentation
- **src/crm/INTEGRATION.md** - Integration examples

## Next Steps

1. ✅ Install and verify extension works
2. ✅ Send a test message and verify auto-tracking
3. ✅ Scan your first batch of prospects
4. ✅ Review CRM and organize leads
5. ✅ Start sending personalized messages
6. ✅ Track conversations and follow up

## Support

For issues:
1. Check console (F12) for detailed errors
2. Review `ROBUST_TRACKING_README.md` for technical details
3. Try refreshing LinkedIn page
4. Verify extension is enabled

---

**Remember**: This is a productivity tool for professional networking. Always respect LinkedIn's terms of service and use responsibly!
