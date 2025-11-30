# LinkedIn DM Auto-Tracking Feature

## Overview

The LinkedIn Agent now automatically tracks Direct Messages (DMs) sent and received on LinkedIn. When you send a DM to someone or receive a reply, the extension will:

1. Automatically create or update a lead in the CRM
2. Mark the lead with the appropriate event (DM_SENT or DM_REPLY_RECEIVED)
3. Add a note with a preview of the message
4. Set a next action reminder
5. Show you a notification confirming the tracking

## How It Works

### Automatic DM Sent Tracking

When you send a message on LinkedIn, the extension will:
- Detect the sent message
- Find or create a lead for that person in your CRM
- Apply the `DM_SENT` event (moves lead to `ACTIVE_CONVO` stage)
- Add a note with message preview: `Sent: "Your message..."`
- Set a reminder to check for reply in 3 days
- Show a green notification: "✅ Tracked message to [Name]"

### Automatic Reply Tracking

When you receive a reply from someone, the extension will:
- Detect the received message
- Find or create a lead for that person
- Apply the `DM_REPLY_RECEIVED` event (keeps lead in `ACTIVE_CONVO` stage)
- Add a note with message preview: `Received: "Their reply..."`
- Set a reminder to continue conversation in 1 day
- Show a green notification: "📨 Tracked reply from [Name]"

## CRM Stage Flow

```
NEW
  └─→ CONNECTED (when you connect with someone)
      └─→ ACTIVE_CONVO (when you send first DM)
          ├─→ ACTIVE_CONVO (continues when sending more DMs)
          ├─→ ACTIVE_CONVO (continues when receiving replies)
          ├─→ MEETING_BOOKED (when you schedule a meeting)
          ├─→ NURTURE (when you want to follow up later)
          └─→ LOST (when the lead doesn't progress)
```

## Using the Feature

### Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder from your project directory
5. The extension should now be loaded

### Step 2: Navigate to LinkedIn Messages

1. Go to https://www.linkedin.com/messaging/
2. Open the browser console (F12) to see tracking logs
3. You should see: `[Message Tracker] Initializing...`

### Step 3: Send a Message

1. Click on any conversation or start a new one
2. Type and send a message
3. Within a few seconds, you should see:
   - Console log: `[Message Tracker] Detected sent message to [Name]`
   - Console log: `[Message Tracker] ✅ Successfully tracked sent message`
   - Green notification in top-right: "✅ Tracked message to [Name]"

### Step 4: Check the CRM

1. Click the extension icon to open the popup
2. Or open the side panel (if configured)
3. You should see the person you messaged in the CRM
4. Their stage should be `ACTIVE_CONVO`
5. There should be a note with your message preview
6. There should be a next action: "Check for reply" (due in 3 days)

### Step 5: Receive a Reply

When the person replies:
1. You'll see a notification: "📨 Tracked reply from [Name]"
2. A new note will be added with their reply preview
3. Next action will update to: "Continue conversation" (due in 1 day)

## Viewing Tracked Data

### In the Side Panel

1. Click the extension icon
2. Select "Open Side Panel" (or configure it in Chrome settings)
3. You'll see all your leads organized by stage
4. Each lead shows:
   - Name and profile link
   - Current stage (NEW, CONNECTED, ACTIVE_CONVO, etc.)
   - Tags
   - Notes with timestamps
   - Next action reminder

### Filtering Leads

You can filter leads by:
- Stage (e.g., only show ACTIVE_CONVO leads)
- Tags
- Next action due date

## Message Data Tracked

For each DM, the system tracks:
- Profile URL (used as unique identifier)
- Profile name
- Message content preview (first 100 characters)
- Timestamp
- Direction (sent or received)

## Response Types

Currently, all replies are tracked as `DM_REPLY_RECEIVED`. In the future, you can categorize responses by:
- Adding tags (e.g., "interested", "not-interested", "meeting-request")
- Adding custom notes
- Moving to different stages manually

## Manual Categorization

If you want to manually categorize a response:

1. Open the CRM (side panel or popup)
2. Find the lead
3. Click on event buttons to apply:
   - `MEETING_SCHEDULED` - They agreed to meet
   - `SET_NURTURE` - Follow up later
   - `MARK_LOST` - Not interested
4. Add tags to categorize (e.g., "hot-lead", "needs-follow-up")
5. Add notes to record response type

## Troubleshooting

### Messages Not Being Tracked

1. **Check console for errors**: Press F12 and look for red errors
2. **Verify you're on LinkedIn messaging page**: URL should include `/messaging/`
3. **Refresh the page**: Sometimes LinkedIn's dynamic content needs a refresh
4. **Check message tracker logs**: Look for `[Message Tracker]` logs in console

### Wrong Profile Detected

If the extension tracks the wrong person:
1. This can happen if LinkedIn's DOM structure changed
2. Check console logs to see which profile URL was detected
3. You can manually delete the incorrect lead from the CRM

### Duplicate Tracking

The extension prevents duplicate tracking by:
- Creating unique message IDs based on content + timestamp
- Checking if message was already tracked before processing

If you still see duplicates:
1. This might happen if you refresh while sending
2. You can manually delete duplicate notes in the CRM

## Advanced Features

### Setting Response Categories

You can add tags to categorize response types:

```javascript
// In browser console or custom script
const lead = await CRM.getLeadByUrl('https://linkedin.com/in/profile');
await CRM.addTags(lead.id, ['positive-response', 'high-priority']);
```

### Custom Response Tracking

If you want to track specific response types, you can:

1. Add custom tags based on keywords
2. Create custom notes for different response categories
3. Use the stage system:
   - `ACTIVE_CONVO` - Ongoing conversation
   - `MEETING_BOOKED` - They agreed to meet
   - `NURTURE` - Need to follow up later
   - `LOST` - Not interested

### Bulk Operations

You can perform bulk operations on leads:

```javascript
// Get all leads in active conversation
const activeLeads = await CRM.listLeads({ stage: CRM.Stage.ACTIVE_CONVO });

// Add tag to all
for (const lead of activeLeads) {
  await CRM.addTags(lead.id, ['needs-follow-up']);
}
```

## Privacy & Data Storage

- All data is stored locally in your browser using IndexedDB
- No data is sent to external servers
- Message content is stored as preview (first 100 characters)
- You can clear all data by deleting the extension or clearing browser data

## Next Steps

Now that automatic DM tracking is set up, you can:

1. **Review your active conversations**: Filter by `ACTIVE_CONVO` stage
2. **Follow up on overdue actions**: Check leads with past-due next actions
3. **Categorize leads**: Add tags based on response quality
4. **Move leads through the pipeline**:
   - Schedule meetings → `MEETING_BOOKED`
   - Long-term follow-ups → `NURTURE`
   - Not interested → `LOST`

## Feature Roadmap

Potential future enhancements:
- Sentiment analysis of responses (positive/negative/neutral)
- Automatic response categorization using keywords
- Conversation summary generation
- Integration with calendar for meeting scheduling
- Email notifications for high-value responses
- Response time tracking
- Conversation analytics

## Support

If you encounter issues or have feature requests:
1. Check console logs for detailed error messages
2. Review the CRM documentation in `src/crm/README.md`
3. Check integration examples in `src/crm/INTEGRATION.md`
