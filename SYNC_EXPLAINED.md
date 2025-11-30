# The Two Sync Buttons - Explained Simply

## Quick Answer

**📥 Import from Prospects** = Import your scanned prospects into CRM (one-time)
**🔄 Auto-Detect Connections** = Auto-detect who accepted your requests (ongoing)

---

## 📥 Button 1: "Import from Prospects"

### What it does
Converts prospects from your "Prospects" tab into CRM leads.

### When to use
- **First time opening CRM** (to populate it)
- **After scanning new prospects** (to add them to CRM)
- **Anytime you want to sync** Prospects → CRM

### What happens
```
Prospects Tab              →         CRM Pipeline
────────────────────                ─────────────────────
John (new)               →          John (NEW)
Sarah (reviewed)         →          Sarah (REQUEST_SENT)
Mike (connected)         →          Mike (CONNECTED)
Jane (skipped)           →          Jane (LOST)
```

### Status Mapping
| Prospect Status | → | CRM Stage |
|-----------------|---|-----------|
| new | → | NEW |
| reviewed | → | REQUEST_SENT |
| connected | → | CONNECTED |
| skipped | → | LOST |

### Example Flow
1. You scan 50 people on LinkedIn → They appear in "Prospects" tab
2. You open "CRM Pipeline" tab
3. Click **"📥 Import from Prospects"**
4. ✅ All 50 people are now in CRM!

---

## 🔄 Button 2: "Auto-Detect Connections"

### What it does
Scrapes LinkedIn to find who accepted your connection requests, then automatically updates them in CRM.

### When to use
- **Daily** (to catch overnight acceptances)
- **Before your outreach** (to see who's ready for DMs)
- **After sending requests** (to track acceptance rate)

### What happens
```
Step 1: Go to LinkedIn connections page
Step 2: Click "Auto-Detect Connections"
Step 3: Script scrapes your recent connections (up to 50)
Step 4: Finds leads in REQUEST_SENT stage
Step 5: If they're connected, moves them to CONNECTED
Step 6: Adds note: "Connection accepted (auto-detected on...)"
```

### Example Flow

**Before:**
```
CRM Pipeline
─────────────────────
Sarah (REQUEST_SENT)  ← Waiting for acceptance
Mike (REQUEST_SENT)   ← Waiting for acceptance
John (CONNECTED)      ← Already connected
```

**You sent requests 2 days ago. Sarah accepted, Mike didn't.**

**Click "Auto-Detect Connections":**
```
✓ Checked: 50 connections
✓ Updated: 1 lead to CONNECTED

Newly connected:
• Sarah Johnson
```

**After:**
```
CRM Pipeline
─────────────────────
Sarah (CONNECTED) ✓   ← Auto-updated!
Mike (REQUEST_SENT)   ← Still waiting
John (CONNECTED)      ← No change
```

---

## Visual Comparison

### Import from Prospects (One Direction)
```
┌─────────────────┐
│ Prospects Tab   │
│ (50 people)     │
└────────┬────────┘
         │
         │ Click "Import from Prospects"
         ↓
┌─────────────────┐
│ CRM Pipeline    │
│ (50 leads)      │
└─────────────────┘
```

### Auto-Detect Connections (From LinkedIn)
```
┌──────────────────┐
│ LinkedIn.com     │
│ (Your actual     │
│  connections)    │
└────────┬─────────┘
         │
         │ Click "Auto-Detect"
         ↓
┌─────────────────┐
│ CRM Pipeline    │
│ (Updates stages)│
└─────────────────┘
```

---

## Real-World Usage

### Scenario: You want to connect with 100 people

**Day 1: Scan & Import**
1. Scan 100 people on LinkedIn → Prospects tab
2. Open CRM → Click **"📥 Import from Prospects"**
3. Result: 100 leads in CRM (all in NEW stage)

**Day 2: Send Requests**
1. Open 50 profiles from Prospects tab
2. Send connection requests manually
3. Mark them as "reviewed" in Prospects
4. Click **"📥 Import from Prospects"** again
5. Result: Those 50 leads → REQUEST_SENT stage

**Day 3: Check Acceptances**
1. Go to LinkedIn connections: `linkedin.com/mynetwork/invite-connect/connections/`
2. In CRM, click **"🔄 Auto-Detect Connections"**
3. Result: Alert shows "20 people accepted!" → Automatically moved to CONNECTED

**Day 4: Start Conversations**
1. Filter CRM by "CONNECTED" stage
2. Send intro messages
3. Click "Send DM" button on each lead
4. They move to ACTIVE_CONVO stage

---

## Which Button Should I Click?

### Use "📥 Import from Prospects" if:
- ✅ CRM is empty and you have prospects
- ✅ You just scanned new people
- ✅ You want to add prospects to CRM

### Use "🔄 Auto-Detect Connections" if:
- ✅ You sent connection requests days ago
- ✅ You want to see who accepted
- ✅ You want to auto-update REQUEST_SENT → CONNECTED

### Use BOTH if:
1. First, **Import from Prospects** (to populate CRM)
2. Then, **Auto-Detect Connections** (to update who accepted)

---

## FAQ

**Q: Do I need to click "Import" every time?**
A: No! Only when you have new prospects to add to CRM. Once imported, they stay in CRM.

**Q: How often should I click "Auto-Detect"?**
A: Daily is good. Or whenever you want to check for new acceptances.

**Q: Will "Auto-Detect" work if I'm not on LinkedIn?**
A: No. You must be on the LinkedIn connections page: `linkedin.com/mynetwork/invite-connect/connections/`

**Q: Can I use CRM without the Prospects tab?**
A: Yes! But you'll need to populate it somehow. Import from Prospects is the easiest way.

**Q: What if I click "Import" twice?**
A: No problem! It won't create duplicates. It merges by profile URL.

---

## Summary in One Sentence Each

**📥 Import from Prospects:** "Move prospects from the other tab into CRM"

**🔄 Auto-Detect Connections:** "Scan LinkedIn to find who accepted my requests"

---

## New Feature: Auto-Prompt!

When you open CRM for the first time and it's empty, you'll see:

```
Found 50 prospects!

Would you like to import them into the CRM now?

[Yes] [No]
```

Click **Yes** and it auto-imports! 🎉
